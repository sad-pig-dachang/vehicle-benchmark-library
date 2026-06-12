import { config } from '../config.js';
import { createRecord, deleteRecord, getRecord, listRecords, updateRecord } from '../feishuClient.js';
import {
  benchmarkRecordToEntity,
  benchmarkToFields,
  discussionRecordToEntity,
  discussionToFields,
  fieldValue,
  specRecordToEntity,
  specToFields,
  vehicleFieldsToEntity,
  vehicleToFields,
  versionRecordToEntity,
  versionToFields,
} from '../fieldMapping.js';

const tables = config.feishu.tables;

const readFieldText = (value, fallback = '') => {
  if (Array.isArray(value)) {
    return value.map((item) => item?.text || item?.name || String(item)).join('');
  }
  if (typeof value === 'object' && value !== null) {
    return value.link || value.text || value.name || JSON.stringify(value);
  }
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const byVehicleId = (records, vehicleId) =>
  records.filter((item) => item.vehicleId === vehicleId);

async function listJoinedData() {
  const [vehicleRecords, specRecords, benchmarkRecords, discussionRecords, versionRecords] = await Promise.all([
    listRecords(tables.vehicle),
    listRecords(tables.specs),
    listRecords(tables.benchmark),
    listRecords(tables.discussion),
    listRecords(tables.version),
  ]);

  const specs = specRecords.map(specRecordToEntity);
  const benchmarkPoints = benchmarkRecords.map(benchmarkRecordToEntity);
  const discussions = discussionRecords.map(discussionRecordToEntity);
  const versionLogs = versionRecords.map(versionRecordToEntity);

  return vehicleRecords.map((record) => {
    const vehicleId = readFieldText(fieldValue(record.fields || {}, 'vehicleId'), record.record_id);

    return vehicleFieldsToEntity(record, {
      spec: specs.find((item) => item.vehicleId === vehicleId)?.spec || {},
      benchmarkPoints: byVehicleId(benchmarkPoints, vehicleId),
      discussions: byVehicleId(discussions, vehicleId),
      versionLogs: byVehicleId(versionLogs, vehicleId),
    });
  });
}

async function findVehicleRecord(vehicleId) {
  const records = await listRecords(tables.vehicle);
  return records.find(
    (record) => record.record_id === vehicleId || readFieldText(fieldValue(record.fields || {}, 'vehicleId')) === vehicleId,
  );
}

async function deleteRecords(records, tableId) {
  for (const record of records) {
    await deleteRecord(tableId, record.recordId || record.record_id);
  }
}

async function deleteChildren(vehicleId) {
  const [specRecords, benchmarkRecords, discussionRecords, versionRecords] = await Promise.all([
    listRecords(tables.specs),
    listRecords(tables.benchmark),
    listRecords(tables.discussion),
    listRecords(tables.version),
  ]);

  const specs = specRecords.map(specRecordToEntity).filter((record) => record.vehicleId === vehicleId);
  const benchmarkPoints = benchmarkRecords.map(benchmarkRecordToEntity).filter((record) => record.vehicleId === vehicleId);
  const discussions = discussionRecords.map(discussionRecordToEntity).filter((record) => record.vehicleId === vehicleId);
  const versionLogs = versionRecords.map(versionRecordToEntity).filter((record) => record.vehicleId === vehicleId);

  await deleteRecords(specs, tables.specs);
  await deleteRecords(benchmarkPoints, tables.benchmark);
  await deleteRecords(discussions, tables.discussion);
  await deleteRecords(versionLogs, tables.version);
}

async function createChildren(vehicle) {
  await createRecord(tables.specs, specToFields(vehicle.id, vehicle.spec || {}));

  const benchmarkPoints = [
    ...(vehicle.experiencePoints || []),
    ...(vehicle.hmiPoints || []),
    ...(vehicle.exteriorPoints || []),
    ...(vehicle.interiorPoints || []),
  ];

  for (const point of benchmarkPoints) {
    await createRecord(tables.benchmark, benchmarkToFields(vehicle.id, point));
  }

  for (const link of vehicle.links || []) {
    await createRecord(tables.discussion, discussionToFields(vehicle.id, link));
  }

  for (const log of vehicle.versionLogs || []) {
    await createRecord(tables.version, versionToFields(vehicle.id, log));
  }
}

async function rebuildVehicle(vehicleId) {
  const vehicles = await listJoinedData();
  return vehicles.find((vehicle) => vehicle.id === vehicleId);
}

export const vehicleRepository = {
  async listVehicles() {
    return listJoinedData();
  },

  async getVehicle(vehicleId) {
    const vehicles = await listJoinedData();
    return vehicles.find((vehicle) => vehicle.id === vehicleId || vehicle.recordId === vehicleId) || null;
  },

  async createVehicle(vehicle) {
    await createRecord(tables.vehicle, vehicleToFields(vehicle));
    await createChildren(vehicle);
    return rebuildVehicle(vehicle.id);
  },

  async updateVehicle(vehicleId, vehicle) {
    const record = await findVehicleRecord(vehicleId);
    if (!record) return null;

    const nextVehicle = {
      ...vehicle,
      id: vehicle.id || vehicleId,
    };

    await updateRecord(tables.vehicle, record.record_id, vehicleToFields(nextVehicle));
    await deleteChildren(nextVehicle.id);
    await createChildren(nextVehicle);
    return rebuildVehicle(nextVehicle.id);
  },

  async deleteVehicle(vehicleId) {
    const record = await findVehicleRecord(vehicleId);
    if (!record) return false;

    const canonicalVehicleId = readFieldText(fieldValue(record.fields || {}, 'vehicleId'), vehicleId);
    await deleteChildren(canonicalVehicleId);
    await deleteRecord(tables.vehicle, record.record_id);
    return true;
  },

  async listBenchmarkPoints(vehicleId) {
    const points = (await listRecords(tables.benchmark)).map(benchmarkRecordToEntity);
    return vehicleId ? points.filter((point) => point.vehicleId === vehicleId) : points;
  },

  async createBenchmarkPoint(payload) {
    const vehicleId = payload.vehicleId || payload.point?.vehicleId;
    const point = payload.point || payload;
    const record = await createRecord(tables.benchmark, benchmarkToFields(vehicleId, point));
    return benchmarkRecordToEntity(record);
  },

  async updateBenchmarkPoint(recordId, payload) {
    const existing = await getRecord(tables.benchmark, recordId);
    if (!existing) return null;

    const existingPoint = benchmarkRecordToEntity(existing);
    const point = payload.point || payload;
    const vehicleId = payload.vehicleId || point.vehicleId || existingPoint.vehicleId;
    const record = await updateRecord(tables.benchmark, recordId, benchmarkToFields(vehicleId, { ...existingPoint, ...point }));
    return benchmarkRecordToEntity(record);
  },

  async listDiscussions(vehicleId) {
    const discussions = (await listRecords(tables.discussion)).map(discussionRecordToEntity);
    return vehicleId ? discussions.filter((discussion) => discussion.vehicleId === vehicleId) : discussions;
  },
};
