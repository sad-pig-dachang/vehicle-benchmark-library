import { config } from '../config.js';
import { createRecord, deleteRecord, getRecord, listRecords, listTables, updateRecord } from '../feishuClient.js';
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
let cachedTableNameMap = null;

const tableNameCandidates = {
  vehicle: ['档案基础信息1', '档案基础信息', 'Vehicle', '车型主表', '车辆主表'],
  specs: ['Specs', '参数表', '基础参数表'],
  benchmark: ['Benchmark', '对标点表', 'Benchmark 表'],
  discussion: ['Discussion', '资料链接表', '讨论链接表'],
  version: ['Version', '迭代记录表', 'Version 表'],
  l1Market: ['L1-用户市场层1', 'L1-用户市场层'],
  l2Profile: ['L2-竞品档案层1', 'L2-竞品档案层'],
  l3Scenes: ['L3-场景对标分析层1', 'L3-场景对标分析层'],
  l3Features: ['L3-具体功能亮点1', 'L3-具体功能亮点'],
  l3Styling: ['L3-造型机会点1', 'L3-造型机会点'],
  l4Design: ['L4-设计对标层1', 'L4-设计对标层'],
  l5Trace: ['L5-测评与追溯层1', 'L5-测评与追溯层'],
};

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

const readAny = (fields, names, fallback = '') => {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(fields, name)) {
      return readFieldText(fields[name], fallback);
    }
  }
  return fallback;
};

const readNumber = (fields, names, fallback = undefined) => {
  const raw = readAny(fields, names, '');
  const match = raw.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : fallback;
};

const readList = (fields, names) =>
  readAny(fields, names, '')
    .split(/\n|,|，|、|;|；/)
    .map((item) => item.trim())
    .filter(Boolean);

const mediaFromUrl = (vehicleId, id, url, title) =>
  url
    ? {
        id: `${vehicleId}-${id}-media`,
        type: 'image',
        url,
        title: title || '对标资料图片',
        alt: title || '对标资料图片',
        source: 'Feishu',
      }
    : undefined;

async function tableNameMap() {
  if (cachedTableNameMap) return cachedTableNameMap;

  const allTables = await listTables();
  cachedTableNameMap = new Map(
    allTables
      .map((table) => [table.name, table.table_id || table.tableId || table.id])
      .filter(([, tableId]) => Boolean(tableId)),
  );
  return cachedTableNameMap;
}

async function resolveTableId(kind) {
  const names = tableNameCandidates[kind] || [];

  try {
    const namesToIds = await tableNameMap();
    for (const name of names) {
      if (namesToIds.has(name)) return namesToIds.get(name);
    }
  } catch (error) {
    console.warn(`Resolve Feishu table name for ${kind} failed: ${error.message}`);
  }

  return tables[kind] || '';
}

async function listRecordsByKind(kind, { required = false } = {}) {
  const tableId = await resolveTableId(kind);
  if (!tableId) {
    if (required) {
      throw new Error(`Missing Feishu table: ${kind}. Create one of: ${(tableNameCandidates[kind] || []).join(', ')}`);
    }
    return [];
  }

  try {
    return await listRecords(tableId);
  } catch (error) {
    if (required) throw error;
    console.warn(`Skip optional Feishu table ${kind} (${tableId}): ${error.message}`);
    return [];
  }
}

const l2RowsToSpec = (rows, vehicleId) => {
  const spec = {};

  for (const record of rows) {
    const fields = record.fields || {};
    const rowVehicleId = readAny(fields, ['车型ID', 'vehicleId'], record.record_id);
    if (rowVehicleId !== vehicleId) continue;

    const key = readAny(fields, ['参数项', '参数名称', '字段']);
    const value = readAny(fields, ['参数值', '内容', '值']);
    if (!key || !value) continue;

    if (key.includes('长宽高')) {
      const numbers = value.match(/\d+(\.\d+)?/g)?.map(Number) || [];
      spec.lengthMm = numbers[0];
      spec.widthMm = numbers[1];
      spec.heightMm = numbers[2];
    } else if (key.includes('轴距')) {
      spec.wheelbaseMm = readNumber({ value }, ['value']);
    } else if (key.includes('座位')) {
      spec.seats = value;
    } else if (key.includes('驱动')) {
      spec.drivetrain = value;
    } else if (key.includes('电池')) {
      spec.batteryKwh = value;
    } else if (key.toLowerCase().includes('cltc') || key.includes('续航')) {
      spec.cltcRangeKm = value;
    } else if (key.includes('座舱芯片')) {
      spec.cockpitChip = value;
    } else if (key.includes('屏幕')) {
      spec.screenLayout = value;
    } else if (key.includes('辅助驾驶') || key.includes('智驾')) {
      spec.assistDriving = value;
    }
  }

  return spec;
};

const sceneRecordToBenchmarkPoint = (record) => {
  const fields = record.fields || {};
  const vehicleId = readAny(fields, ['车型ID', 'vehicleId']);
  const id = readAny(fields, ['场景ID', '对标点ID'], record.record_id);
  const title = readAny(fields, ['场景标题', '标题']);
  const url = readAny(fields, ['图片/视频封面链接', '图片链接', '截图链接']);

  return {
    recordId: record.record_id,
    id,
    vehicleId,
    category: 'experience',
    title,
    sceneDescription: readAny(fields, ['场景描述', '描述']),
    userValue: readAny(fields, ['用户价值']),
    highlight: readAny(fields, ['体验亮点', '亮点']),
    issue: readAny(fields, ['问题', '问题/待验证']),
    referenceValue: readAny(fields, ['可借鉴点', '引用价值/设计影响']),
    media: mediaFromUrl(vehicleId, id, url, title),
  };
};

const featureRecordToBenchmarkPoint = (record) => {
  const fields = record.fields || {};
  const vehicleId = readAny(fields, ['车型ID', 'vehicleId']);
  const id = readAny(fields, ['功能ID', '对标点ID'], record.record_id);
  const title = readAny(fields, ['用户需求', '功能名称', '标题']);

  return {
    recordId: record.record_id,
    id,
    vehicleId,
    category: 'experience',
    title,
    description: readAny(fields, ['现有体验判断', '体验判断']),
    sceneDescription: readAny(fields, ['场景ID']),
    userValue: readAny(fields, ['用户需求']),
    highlight: [
      readAny(fields, ['硬件支撑']),
      readAny(fields, ['软件/HMI支撑', '软件HMI支撑']),
    ].filter(Boolean).join('\n'),
    issue: readAny(fields, ['问题', '问题/待验证']),
    referenceValue: readAny(fields, ['机会点', '可借鉴点']),
  };
};

const stylingRecordToBenchmarkPoint = (record) => {
  const fields = record.fields || {};
  const vehicleId = readAny(fields, ['车型ID', 'vehicleId']);
  const group = readAny(fields, ['分组', '模块']);
  const id = readAny(fields, ['机会ID', '对标点ID'], record.record_id);
  const title = readAny(fields, ['标题', '对标标题']);
  const url = readAny(fields, ['图片链接', '图片/视频封面链接']);

  return {
    recordId: record.record_id,
    id,
    vehicleId,
    category: group.includes('外') ? 'exterior' : 'interior',
    title,
    stylingFeature: readAny(fields, ['造型特征', '设计看点']),
    brandIdentity: readAny(fields, ['品牌识别点']),
    proportion: readAny(fields, ['比例姿态']),
    detailDesign: readAny(fields, ['细节设计']),
    materialColor: readAny(fields, ['材质/色彩', '材质色彩']),
    referenceValue: readAny(fields, ['可借鉴点', '引用价值/设计影响']),
    media: mediaFromUrl(vehicleId, id, url, title),
  };
};

const designRecordToBenchmarkPoint = (record) => {
  const fields = record.fields || {};
  const vehicleId = readAny(fields, ['车型ID', 'vehicleId']);
  const moduleName = readAny(fields, ['模块']);
  const id = readAny(fields, ['对标ID', '对标点ID'], record.record_id);
  const title = readAny(fields, ['对标标题', '标题']);
  const url = readAny(fields, ['图片链接', '图片/视频封面链接']);
  const categoryMap = {
    外饰: 'exterior',
    内饰: 'interior',
    HMI: 'hmi',
    智驾: 'hmi',
    品牌: 'experience',
  };

  return {
    recordId: record.record_id,
    id,
    vehicleId,
    category: categoryMap[moduleName] || 'experience',
    title,
    description: readAny(fields, ['体验看点']),
    highlight: readAny(fields, ['HMI/智驾看点', 'HMI智驾看点']),
    issue: readAny(fields, ['问题/待验证', '问题']),
    referenceValue: readAny(fields, ['可借鉴点']),
    stylingFeature: readAny(fields, ['设计看点']),
    media: mediaFromUrl(vehicleId, id, url, title),
  };
};

const traceRecordToDiscussion = (record) => {
  const fields = record.fields || {};
  const vehicleId = readAny(fields, ['车型ID', 'vehicleId']);
  const type = readAny(fields, ['内容类型']);
  const url = readAny(fields, ['链接', 'URL']);
  const title = readAny(fields, ['标题/评测维度', '标题']);

  if (!url) {
    return null;
  }

  return {
    recordId: record.record_id,
    id: readAny(fields, ['链接ID'], record.record_id),
    vehicleId,
    platform: readAny(fields, ['平台/维度', '平台'], type || '资料'),
    title,
    url,
    heat: readAny(fields, ['热度'], '待补充'),
    summary: readAny(fields, ['观点摘要/评分依据', '观点摘要', '摘要']),
    sentiment: readAny(fields, ['情绪倾向'], '中性'),
    referenceValue: readAny(fields, ['引用价值/设计影响', '引用价值']),
  };
};

const traceRecordToVersionLog = (record) => {
  const fields = record.fields || {};
  const type = readAny(fields, ['内容类型']);
  if (type !== '迭代记录') return null;

  return {
    recordId: record.record_id,
    id: readAny(fields, ['迭代记录ID', '记录ID'], record.record_id),
    vehicleId: readAny(fields, ['车型ID', 'vehicleId']),
    yearModel: readAny(fields, ['平台/维度', '年款/改款时间'], '待补充'),
    changeTime: readAny(fields, ['标题/评测维度', '变化时间'], '待补充'),
    changeTypes: readList(fields, ['标题/评测维度', '变化类型']),
    description: readAny(fields, ['观点摘要/评分依据', '变化描述']),
    designImpact: readAny(fields, ['引用价值/设计影响', '设计对标影响']),
  };
};

async function listJoinedData() {
  const [
    vehicleRecords,
    specRecords,
    benchmarkRecords,
    discussionRecords,
    versionRecords,
    l2Records,
    l3SceneRecords,
    l3FeatureRecords,
    l3StylingRecords,
    l4DesignRecords,
    l5TraceRecords,
  ] = await Promise.all([
    listRecordsByKind('vehicle', { required: true }),
    listRecordsByKind('specs'),
    listRecordsByKind('benchmark'),
    listRecordsByKind('discussion'),
    listRecordsByKind('version'),
    listRecordsByKind('l2Profile'),
    listRecordsByKind('l3Scenes'),
    listRecordsByKind('l3Features'),
    listRecordsByKind('l3Styling'),
    listRecordsByKind('l4Design'),
    listRecordsByKind('l5Trace'),
  ]);

  const specs = specRecords.map(specRecordToEntity);
  const benchmarkPoints = [
    ...benchmarkRecords.map(benchmarkRecordToEntity),
    ...l3SceneRecords.map(sceneRecordToBenchmarkPoint),
    ...l3FeatureRecords.map(featureRecordToBenchmarkPoint),
    ...l3StylingRecords.map(stylingRecordToBenchmarkPoint),
    ...l4DesignRecords.map(designRecordToBenchmarkPoint),
  ].filter((point) => point.vehicleId && point.title);
  const discussions = [
    ...discussionRecords.map(discussionRecordToEntity),
    ...l5TraceRecords.map(traceRecordToDiscussion).filter(Boolean),
  ];
  const versionLogs = [
    ...versionRecords.map(versionRecordToEntity),
    ...l5TraceRecords.map(traceRecordToVersionLog).filter(Boolean),
  ];

  return vehicleRecords.map((record) => {
    const vehicleId = readFieldText(fieldValue(record.fields || {}, 'vehicleId'), record.record_id);
    const childSpec = specs.find((item) => item.vehicleId === vehicleId)?.spec || l2RowsToSpec(l2Records, vehicleId);

    return vehicleFieldsToEntity(record, {
      spec: childSpec,
      benchmarkPoints: byVehicleId(benchmarkPoints, vehicleId),
      discussions: byVehicleId(discussions, vehicleId),
      versionLogs: byVehicleId(versionLogs, vehicleId),
    });
  });
}

async function findVehicleRecord(vehicleId) {
  const records = await listRecordsByKind('vehicle', { required: true });
  return records.find(
    (record) => record.record_id === vehicleId || readFieldText(fieldValue(record.fields || {}, 'vehicleId')) === vehicleId,
  );
}

async function deleteRecords(records, tableId) {
  if (!tableId) return;
  for (const record of records) {
    await deleteRecord(tableId, record.recordId || record.record_id);
  }
}

async function deleteChildren(vehicleId) {
  const [specTableId, benchmarkTableId, discussionTableId, versionTableId] = await Promise.all([
    resolveTableId('specs'),
    resolveTableId('benchmark'),
    resolveTableId('discussion'),
    resolveTableId('version'),
  ]);

  const [specRecords, benchmarkRecords, discussionRecords, versionRecords] = await Promise.all([
    specTableId ? listRecords(specTableId) : [],
    benchmarkTableId ? listRecords(benchmarkTableId) : [],
    discussionTableId ? listRecords(discussionTableId) : [],
    versionTableId ? listRecords(versionTableId) : [],
  ]);

  const specs = specRecords.map(specRecordToEntity).filter((record) => record.vehicleId === vehicleId);
  const benchmarkPoints = benchmarkRecords.map(benchmarkRecordToEntity).filter((record) => record.vehicleId === vehicleId);
  const discussions = discussionRecords.map(discussionRecordToEntity).filter((record) => record.vehicleId === vehicleId);
  const versionLogs = versionRecords.map(versionRecordToEntity).filter((record) => record.vehicleId === vehicleId);

  await deleteRecords(specs, specTableId);
  await deleteRecords(benchmarkPoints, benchmarkTableId);
  await deleteRecords(discussions, discussionTableId);
  await deleteRecords(versionLogs, versionTableId);
}

async function createChildren(vehicle) {
  const [specTableId, benchmarkTableId, discussionTableId, versionTableId] = await Promise.all([
    resolveTableId('specs'),
    resolveTableId('benchmark'),
    resolveTableId('discussion'),
    resolveTableId('version'),
  ]);

  if (specTableId) await createRecord(specTableId, specToFields(vehicle.id, vehicle.spec || {}));

  const benchmarkPoints = [
    ...(vehicle.experiencePoints || []),
    ...(vehicle.hmiPoints || []),
    ...(vehicle.exteriorPoints || []),
    ...(vehicle.interiorPoints || []),
  ];

  for (const point of benchmarkPoints) {
    if (benchmarkTableId) await createRecord(benchmarkTableId, benchmarkToFields(vehicle.id, point));
  }

  for (const link of vehicle.links || []) {
    if (discussionTableId) await createRecord(discussionTableId, discussionToFields(vehicle.id, link));
  }

  for (const log of vehicle.versionLogs || []) {
    if (versionTableId) await createRecord(versionTableId, versionToFields(vehicle.id, log));
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
    await createRecord(await resolveTableId('vehicle'), vehicleToFields(vehicle));
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

    await updateRecord(await resolveTableId('vehicle'), record.record_id, vehicleToFields(nextVehicle));
    await deleteChildren(nextVehicle.id);
    await createChildren(nextVehicle);
    return rebuildVehicle(nextVehicle.id);
  },

  async deleteVehicle(vehicleId) {
    const record = await findVehicleRecord(vehicleId);
    if (!record) return false;

    const canonicalVehicleId = readFieldText(fieldValue(record.fields || {}, 'vehicleId'), vehicleId);
    await deleteChildren(canonicalVehicleId);
    await deleteRecord(await resolveTableId('vehicle'), record.record_id);
    return true;
  },

  async listBenchmarkPoints(vehicleId) {
    const vehicles = await listJoinedData();
    const points = vehicles.flatMap((vehicle) => [
      ...vehicle.experiencePoints,
      ...vehicle.hmiPoints,
      ...vehicle.exteriorPoints,
      ...vehicle.interiorPoints,
    ]);
    return vehicleId ? points.filter((point) => point.vehicleId === vehicleId) : points;
  },

  async createBenchmarkPoint(payload) {
    const vehicleId = payload.vehicleId || payload.point?.vehicleId;
    const point = payload.point || payload;
    const record = await createRecord(await resolveTableId('benchmark'), benchmarkToFields(vehicleId, point));
    return benchmarkRecordToEntity(record);
  },

  async updateBenchmarkPoint(recordId, payload) {
    const benchmarkTableId = await resolveTableId('benchmark');
    const existing = await getRecord(benchmarkTableId, recordId);
    if (!existing) return null;

    const existingPoint = benchmarkRecordToEntity(existing);
    const point = payload.point || payload;
    const vehicleId = payload.vehicleId || point.vehicleId || existingPoint.vehicleId;
    const record = await updateRecord(benchmarkTableId, recordId, benchmarkToFields(vehicleId, { ...existingPoint, ...point }));
    return benchmarkRecordToEntity(record);
  },

  async listDiscussions(vehicleId) {
    const vehicles = await listJoinedData();
    const discussions = vehicles.flatMap((vehicle) => vehicle.links);
    return vehicleId ? discussions.filter((discussion) => discussion.vehicleId === vehicleId) : discussions;
  },
};
