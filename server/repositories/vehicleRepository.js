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
  vehicle: ['档案基础信息', '档案基础信息1', 'Vehicle', '车型主表', '车辆主表'],
  specs: ['Specs', '参数表', '基础参数表'],
  benchmark: ['Benchmark', '对标点表', 'Benchmark 表'],
  discussion: ['Discussion', '资料链接表', '讨论链接表'],
  version: ['Version', '迭代记录表', 'Version 表'],
  l1Market: ['L1-用户市场层', 'L1-用户市场层1'],
  l2Profile: ['L2-竞品档案层', 'L2-竞品档案层1'],
  l3Scenes: ['L3-场景对标分析层', 'L3-场景对标分析层1'],
  l3Features: ['L3-具体功能亮点', 'L3-具体功能亮点1'],
  l3Styling: ['L3-造型机会点', 'L3-造型机会点1'],
  l4Design: ['L4-设计对标层', 'L4-设计对标层1'],
  l5Trace: ['L5-测评与追溯层', 'L5-测评与追溯层1'],
};

const readFieldText = (value, fallback = '') => {
  if (Array.isArray(value)) {
    return value.map((item) => item?.text || item?.name || item?.url || item?.tmp_url || item?.link || String(item)).join('');
  }
  if (typeof value === 'object' && value !== null) {
    return value.text || value.name || value.url || value.tmp_url || value.link || JSON.stringify(value);
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

const mediaUrlFromToken = (fileToken) =>
  fileToken ? `/api/feishu/media/${encodeURIComponent(fileToken)}` : '';

const mediaTokenFromText = (value = '') => {
  const text = String(value || '');
  return (
    text.match(/\/drive\/v1\/medias\/([^/?#]+)\/download/)?.[1] ||
    text.match(/[?&]file_token=([^&#]+)/)?.[1] ||
    ''
  );
};

const mediaTokenFromValue = (value) => {
  if (!value) return '';
  if (Array.isArray(value)) {
    for (const item of value) {
      const token = mediaTokenFromValue(item);
      if (token) return token;
    }
    return '';
  }

  if (typeof value === 'object') {
    return (
      value.file_token ||
      value.fileToken ||
      value.media_token ||
      value.mediaToken ||
      mediaTokenFromText(value.url) ||
      mediaTokenFromText(value.tmp_url) ||
      mediaTokenFromText(value.link) ||
      ''
    );
  }

  return mediaTokenFromText(value);
};

const metadataFields = new Set([
  '品牌',
  '车型',
  '车型ID',
  'vehicleId',
  '父记录',
  '记录',
  '关联记录',
  '关联车型',
]);

const fieldValueByNames = (fields, names) => {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(fields, name)) {
      return fields[name];
    }
  }
  return undefined;
};

const extractUrl = (value) => {
  if (!value) return '';
  const mediaToken = mediaTokenFromValue(value);
  if (mediaToken) return mediaUrlFromToken(mediaToken);

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = extractUrl(item);
      if (url) return url;
    }
    return '';
  }
  if (typeof value === 'object') {
    return value.url || value.tmp_url || value.link || '';
  }
  const text = String(value);
  return text.match(/https?:\/\/[^\s，,]+/)?.[0] || '';
};

const mediaFromFields = (fields, names, vehicleId, id, title) => {
  const raw = fieldValueByNames(fields, names);
  const url = extractUrl(raw);
  return mediaFromUrl(vehicleId, id, url, title);
};

const mediaListFromFields = (fields, names, vehicleId, idPrefix, title) => {
  const raw = fieldValueByNames(fields, names);
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return values
    .map((item, index) => mediaFromUrl(vehicleId, `${idPrefix}-${index + 1}`, extractUrl(item), title))
    .filter(Boolean);
};

const normalizeText = (value) => readFieldText(value).trim();

const readVehicleKey = (fields, knownVehicleId = '') => {
  const id = readAny(fields, ['竞品库ID', '竞品ID', '车型ID', 'vehicleId']);
  const hasVehicleIdentity = Boolean(readAny(fields, ['品牌']) || readAny(fields, ['车型']));
  if (hasVehicleIdentity) return id;
  if (knownVehicleId && id === knownVehicleId) return id;
  return '';
};

const parentFieldNames = ['父记录', '关联记录', '关联车型', '所属车型'];
const looseParentFieldNames = [...parentFieldNames, '记录'];

const tokensFromField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(tokensFromField);
  if (typeof value === 'object') {
    return [
      ...(Array.isArray(value.record_ids) ? value.record_ids : []),
      ...(Array.isArray(value.records) ? value.records : []),
      ...(Array.isArray(value.ids) ? value.ids : []),
      value.record_id,
      value.recordId,
      value.id,
      value.text,
      value.name,
      value.link_record_id,
    ].filter(Boolean).map(String);
  }
  return [String(value)];
};

const parentTokens = (fields, names = looseParentFieldNames) =>
  tokensFromField(fieldValueByNames(fields, names)).map((item) => item.trim()).filter(Boolean);

const hasStrictParentField = (fields) => parentTokens(fields, parentFieldNames).length > 0;

const matchesParent = (fields, vehicleId, parentRecordIds = new Set()) =>
  parentTokens(fields).some((token) => token === vehicleId || parentRecordIds.has(token));

const isVehicleParentRow = (fields, vehicleId) => {
  const canonicalId = readAny(fields, ['竞品库ID', '车型ID', 'vehicleId']);
  if (canonicalId === vehicleId) return true;
  return readVehicleKey(fields, vehicleId) === vehicleId && Boolean(readAny(fields, ['品牌']) || readAny(fields, ['车型']));
};

const firstNonEmptyField = (fields, names) => readAny(fields, names, '').trim();

const compactItems = (items) => items.filter((item) => item && item.value && item.value !== '[]' && item.value !== '{}');

const keyValueItems = (fields, names) =>
  compactItems(names.map((name) => ({ label: name, value: readAny(fields, [name]) })));

const textPreview = (text, fallback = '') => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean ? clean.slice(0, 26) : fallback;
};

const childRowsBySequence = (records, vehicleId, buildChild) => {
  const rows = [];
  let activeVehicleId = '';
  const parentRecordIds = new Set(
    records
      .filter((record) => isVehicleParentRow(record.fields || {}, vehicleId))
      .map((record) => record.record_id),
  );

  for (const record of records) {
    const fields = record.fields || {};

    if (isVehicleParentRow(fields, vehicleId)) {
      activeVehicleId = vehicleId;
      continue;
    }

    if (readVehicleKey(fields) && readVehicleKey(fields) !== vehicleId) {
      activeVehicleId = '';
    }

    const isCurrentChild = matchesParent(fields, vehicleId, parentRecordIds) || (!hasStrictParentField(fields) && activeVehicleId === vehicleId);
    if (!isCurrentChild) continue;

    const item = buildChild(record, fields);
    if (item) rows.push(item);
  }

  return rows;
};

const readScoreField = (fields, model = '') => {
  const explicit = readAny(fields, [`${model}得分`, `${model} 得分`, '车型得分', '总分', '得分', '小米YU7得分', '小米 YU7 得分']);
  if (explicit) return explicit;

  const scoreEntry = Object.entries(fields).find(([key, value]) => key.endsWith('得分') && key !== '满分' && normalizeText(value));
  return scoreEntry ? readFieldText(scoreEntry[1]) : '';
};

const pairedUserPoints = (fields, prefixes, max = 6) => {
  const points = [];

  for (let index = 1; index <= max; index += 1) {
    const keyword = readAny(fields, prefixes.flatMap((prefix) => [
      `${prefix}${index}关键词`,
      `${prefix}${index}关键字`,
      `${prefix}${index}`,
    ]));
    const description = readAny(fields, prefixes.flatMap((prefix) => [
      `${prefix}${index}描述`,
      `${prefix}${index}说明`,
      `${prefix}${index}详述`,
    ]));

    if (keyword || description) {
      points.push({
        keyword: keyword || `条目 ${index}`,
        description,
      });
    }
  }

  return points;
};

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
    media: mediaFromFields(fields, ['图片/视频封面链接', '图片链接', '截图链接'], vehicleId, id, title),
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
    media: mediaFromFields(fields, ['图片链接', '图片/视频封面链接'], vehicleId, id, title),
  };
};

const designRecordToBenchmarkPoint = (record) => {
  const fields = record.fields || {};
  const vehicleId = readAny(fields, ['车型ID', 'vehicleId']);
  const moduleName = readAny(fields, ['模块']);
  const id = readAny(fields, ['对标ID', '对标点ID'], record.record_id);
  const title = readAny(fields, ['对标标题', '标题']);
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
    media: mediaFromFields(fields, ['图片链接', '图片/视频封面链接'], vehicleId, id, title),
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
    heat: readAny(fields, ['热度']),
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
    yearModel: readAny(fields, ['平台/维度', '年款/改款时间']),
    changeTime: readAny(fields, ['标题/评测维度', '变化时间']),
    changeTypes: readList(fields, ['标题/评测维度', '变化类型']),
    description: readAny(fields, ['观点摘要/评分依据', '变化描述']),
    designImpact: readAny(fields, ['引用价值/设计影响', '设计对标影响']),
  };
};

const buildL1Profile = (records, vehicleId) => {
  const record = records.find((item) => readVehicleKey(item.fields || {}, vehicleId) === vehicleId);
  const fields = record?.fields || {};
  const targetUsers = pairedUserPoints(fields, ['核心目标用户', '目标用户']);
  let marketPoints = pairedUserPoints(fields, ['核心市场卖点', '市场卖点', '定位标签', '卖点']);

  if (!marketPoints.length) {
    marketPoints = Object.entries(fields)
      .filter(([key, value]) => /卖点|定位/.test(key) && !/标签\/关键词|建议对标层级/.test(key) && normalizeText(value))
      .slice(0, 4)
      .map(([key, value]) => ({ keyword: key, description: readFieldText(value) }));
  }

  return {
    targetUsers,
    marketPoints,
    tags: readList(fields, ['市场定位标签', '定位标签', '车型标签/关键词', '关键标签']),
  };
};

const l2ItemLabel = (fields) =>
  firstNonEmptyField(fields, ['参数项', '配置项', '项目', '维度', '竞品ID', '竞品库ID']);

const rowValuesExceptMeta = (fields, label) =>
  Object.entries(fields)
    .filter(([key, value]) => !metadataFields.has(key) && key !== '竞品库ID' && key !== '竞品ID' && key !== label && normalizeText(value))
    .map(([key, value]) => `${key}：${readFieldText(value)}`);

const buildL2Profile = (records, vehicleId) => {
  const parent = records.find((item) => isVehicleParentRow(item.fields || {}, vehicleId));
  const parentFields = parent?.fields || {};
  const basicItems = keyValueItems(parentFields, [
    '生产平台',
    '车型平台',
    '上市时间',
    '官方指导价',
    '指导价',
    '能源类型',
    '能源形式',
    '车身结构',
    '对标车型',
    '全系标配',
    '版本专属配置',
    '核心配置',
  ]);

  const configItems = childRowsBySequence(records, vehicleId, (record, fields) => {
    const label = l2ItemLabel(fields);
    if (!label || label === vehicleId) return null;

    const valueParts = rowValuesExceptMeta(fields, label);
    const value = readAny(fields, ['参数值', '内容', '值']) || valueParts.join('\n');
    if (!value) return null;

    return {
      id: record.record_id,
      label,
      value,
      description: valueParts.filter((item) => !item.startsWith('参数值：') && !item.startsWith('内容：')).join('\n'),
    };
  });

  return {
    basicItems,
    configItems,
    specRows: configItems,
  };
};

const specFromL2Profile = (profile = {}) => {
  const spec = {};
  const rows = profile.specRows || [];

  for (const row of rows) {
    const key = `${row.label} ${row.value}`;
    const value = row.value;

    if (/长宽高|车身尺寸|尺寸/.test(key)) {
      const numbers = value.match(/\d+(\.\d+)?/g)?.map(Number) || [];
      spec.lengthMm = numbers[0];
      spec.widthMm = numbers[1];
      spec.heightMm = numbers[2];
    } else if (/轴距/.test(key)) {
      spec.wheelbaseMm = readNumber({ value }, ['value']);
    } else if (/座位|座椅|座数/.test(key)) {
      spec.seats = value;
    } else if (/驱动/.test(key)) {
      spec.drivetrain = value;
    } else if (/电池/.test(key)) {
      spec.batteryKwh = value;
    } else if (/CLTC|续航/.test(key)) {
      spec.cltcRangeKm = value;
    } else if (/座舱|芯片/.test(key)) {
      spec.cockpitChip = value;
    } else if (/屏幕|屏/.test(key)) {
      spec.screenLayout = value;
    } else if (/辅助驾驶|智驾|智能驾驶/.test(key)) {
      spec.assistDriving = value;
    } else if (/功率|动力/.test(key)) {
      spec.engineOrMotor = value;
    } else if (/零百|加速/.test(key)) {
      spec.acceleration0100 = value;
    }
  }

  return spec;
};

const buildL3Scenes = (records, vehicleId) => {
  const scenes = [];
  let currentScene = null;
  let activeVehicleId = '';
  const parentRecordIds = new Set(
    records
      .filter((record) => isVehicleParentRow(record.fields || {}, vehicleId))
      .map((record) => record.record_id),
  );

  for (const record of records) {
    const fields = record.fields || {};

    if (isVehicleParentRow(fields, vehicleId)) {
      activeVehicleId = vehicleId;
    } else if (readVehicleKey(fields) && readVehicleKey(fields) !== vehicleId) {
      activeVehicleId = '';
      currentScene = null;
    }

    const isActive =
      matchesParent(fields, vehicleId, parentRecordIds) ||
      (!hasStrictParentField(fields) && activeVehicleId === vehicleId) ||
      readVehicleKey(fields, vehicleId) === vehicleId;
    if (!isActive) continue;

    const sceneTitle = readAny(fields, ['场景名称', '场景标题']);
    if (sceneTitle) {
      currentScene = {
        id: record.record_id,
        title: sceneTitle,
        source: readAny(fields, ['场景来源', '来源']),
        image: mediaFromFields(fields, ['场景图片', '图片', '场景图'], vehicleId, record.record_id, sceneTitle),
        needs: [],
      };
      scenes.push(currentScene);
      continue;
    }

    const need = readAny(fields, ['行为需求', '用户需求']);
    if (need && currentScene) {
      currentScene.needs.push({
        need,
        note: readAny(fields, ['行为需求备注', '需求备注']),
        hardware: readAny(fields, ['YU7 已有硬件支撑', 'YU7已有硬件支撑', '已有硬件支撑', '硬件支撑']),
        software: readAny(fields, ['YU7 已有软件/HMI 支撑', 'YU7已有软件/HMI支撑', 'YU7已有软件HMI支撑', '软件/HMI支撑', '软件HMI支撑']),
        judgement: readAny(fields, ['竞品判断', '现有体验判断', '判断']),
      });
    }
  }

  return scenes;
};

const buildL3Features = (records, vehicleId) =>
  childRowsBySequence(records, vehicleId, (record, fields) => {
    const title = readAny(fields, ['亮点标题', '亮点名称', '功能亮点']);
    const feature = readAny(fields, ['具体功能点', '功能点', '功能描述']);
    const judgement = readAny(fields, ['亮点判断', '判断']);
    const benchmarkValue = readAny(fields, ['对标价值', '可借鉴点']);
    if (!title && !feature && !judgement) return null;

    return {
      id: record.record_id,
      title: title || textPreview(feature),
      feature,
      judgement,
      benchmarkValue,
      image: mediaFromFields(fields, ['亮点图片', '图片', '功能图片'], vehicleId, record.record_id, title || feature),
    };
  });

const buildL3Styling = (records, vehicleId) =>
  childRowsBySequence(records, vehicleId, (record, fields) => {
    const title = readAny(fields, ['机会标题', '标题', '造型机会']);
    const description = readAny(fields, ['功能描述', '机会描述', '描述']);
    if (!title && !description) return null;

    return {
      id: record.record_id,
      title: title || textPreview(description),
      type: readAny(fields, ['机会类型', '类型']),
      priority: readAny(fields, ['优先级']),
      source: readAny(fields, ['来源线索', '来源']),
      direction: readAny(fields, ['可做方向', '方向']),
      description,
      designValue: readAny(fields, ['设计价值', '价值']),
    };
  });

const buildL4Design = (records, vehicleId) => {
  const heroImages = [];
  const references = [];
  let activeVehicleId = '';
  let activeGroup = '';
  const parentRecordIds = new Set(
    records
      .filter((record) => isVehicleParentRow(record.fields || {}, vehicleId))
      .map((record) => record.record_id),
  );

  for (const record of records) {
    const fields = record.fields || {};

    if (isVehicleParentRow(fields, vehicleId)) {
      activeVehicleId = vehicleId;
      heroImages.push(...mediaListFromFields(fields, ['核心视觉效果参考', '核心视觉效果参考图', '主图'], vehicleId, 'l4-hero', '核心视觉效果参考'));
      continue;
    }

    if (readVehicleKey(fields) && readVehicleKey(fields) !== vehicleId) {
      activeVehicleId = '';
      activeGroup = '';
    }

    const isActive = matchesParent(fields, vehicleId, parentRecordIds) || (!hasStrictParentField(fields) && activeVehicleId === vehicleId);
    if (!isActive) continue;

    const description = readAny(fields, ['对应亮点描述', '对照亮点描述', '亮点描述', '设计看点', '描述']);
    const image = mediaFromFields(fields, ['核心视觉效果参考', '核心视觉效果参考图', '图片', '参考图'], vehicleId, record.record_id, description || activeGroup);
    const firstCell = firstNonEmptyField(fields, ['竞品库ID', '竞品ID', '分组', '分类', '亮点类型']);
    if (/外观|外饰|内饰|CMF|HMI|智驾/.test(firstCell) && !description && !image) {
      activeGroup = firstCell;
      continue;
    }

    if (!description && !image) continue;

    references.push({
      id: record.record_id,
      group: readAny(fields, ['分组', '分类', '亮点类型']) || activeGroup || firstCell,
      title: readAny(fields, ['标题', '对标标题']) || textPreview(description, firstCell || activeGroup),
      description,
      image,
      url: readAny(fields, ['可跳转链接', '链接', 'URL']),
    });
  }

  return { heroImages, references };
};

const buildL5Profile = (records, vehicleId, model = '') => {
  const parent = records.find((record) => isVehicleParentRow(record.fields || {}, vehicleId));
  const parentFields = parent?.fields || {};
  const rows = childRowsBySequence(records, vehicleId, (record, fields) => {
    const dimension = readAny(fields, ['评测维度', '标题/评测维度', '维度', '竞品库ID', '竞品ID']);
    if (!dimension || dimension === vehicleId) return null;

    return {
      dimension,
      maxScore: readAny(fields, ['满分']),
      score: readScoreField(fields, model),
      reason: readAny(fields, ['评分依据']),
    };
  });

  return {
    totalScore: readAny(parentFields, ['满分']) || '100',
    score: readScoreField(parentFields, model),
    summary: readAny(parentFields, ['评分依据']),
    rows,
  };
};

async function listJoinedData() {
  const [
    vehicleRecords,
    l1MarketRecords,
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
    listRecordsByKind('l1Market'),
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
    const vehicleModel = readAny(record.fields || {}, ['车型', 'model']);
    const l1Profile = buildL1Profile(l1MarketRecords, vehicleId);
    const l2Profile = buildL2Profile(l2Records, vehicleId);
    const l5Profile = buildL5Profile(l5TraceRecords, vehicleId, vehicleModel);
    const childSpec =
      specs.find((item) => item.vehicleId === vehicleId)?.spec ||
      specFromL2Profile(l2Profile) ||
      l2RowsToSpec(l2Records, vehicleId);
    const profile = {
      benchmarkLevel: readAny(record.fields || {}, ['建议对标层级']),
      l1: l1Profile,
      l2: l2Profile,
      l3Scenes: buildL3Scenes(l3SceneRecords, vehicleId),
      l3Features: buildL3Features(l3FeatureRecords, vehicleId),
      l3Styling: buildL3Styling(l3StylingRecords, vehicleId),
      l4Design: buildL4Design(l4DesignRecords, vehicleId),
      l5: l5Profile,
    };

    return vehicleFieldsToEntity(record, {
      spec: childSpec,
      benchmarkPoints: byVehicleId(benchmarkPoints, vehicleId),
      discussions: byVehicleId(discussions, vehicleId),
      versionLogs: byVehicleId(versionLogs, vehicleId),
      profile,
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
