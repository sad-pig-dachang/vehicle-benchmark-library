const fallbackImage =
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80';

const arrayFromField = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.text) return item.text;
        if (item?.name) return item.name;
        return String(item);
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const numberFromField = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const boolFromField = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return ['true', '1', 'yes', '是'].includes(value.toLowerCase());
  return false;
};

const textFromField = (value, fallback = '') => {
  if (Array.isArray(value)) {
    return value.map((item) => item?.text || item?.name || String(item)).join('');
  }
  if (typeof value === 'object' && value !== null) {
    return value.link || value.text || value.name || JSON.stringify(value);
  }
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const dateFromField = (value, fallback = '') => {
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString().slice(0, 10);
  }

  return textFromField(value, fallback);
};

const jsonFromField = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const jsonToField = (value) => JSON.stringify(value || {}, null, 2);
const arrayToField = (items = []) => items;

export const fieldAliases = {
  vehicleId: ['vehicleId', '车型ID', '车型编号', '车辆ID'],
  brand: ['brand', '品牌'],
  model: ['model', '车型', '车型名称'],
  year: ['year', '年款'],
  market: ['market', '市场', '国内/海外'],
  countryRegion: ['countryRegion', '国家/地区', '国家地区'],
  level: ['level', '车型级别', '级别'],
  energy: ['energy', '能源形式', '能源'],
  priceMin: ['priceMin', '最低价格', '价格下限', '价格区间最低'],
  priceMax: ['priceMax', '最高价格', '价格上限', '价格区间最高'],
  coverImageUrl: ['coverImageUrl', '封面图链接', '封面图URL'],
  coverImageTitle: ['coverImageTitle', '封面图标题'],
  coverImageAlt: ['coverImageAlt', '封面图说明'],
  coverImageSource: ['coverImageSource', '封面图来源'],
  productPositioning: ['productPositioning', '产品定位'],
  targetUsers: ['targetUsers', '目标用户'],
  summary: ['summary', '车型一句话总结', '一句话总结', '总结'],
  keyTags: ['keyTags', '关键标签'],
  scenarioTags: ['scenarioTags', '使用场景标签', '场景标签'],
  hmiTags: ['hmiTags', 'HMI标签', 'HMI 标签'],
  stylingTags: ['stylingTags', '内外饰标签', '造型标签'],
  status: ['status', '数据状态'],
  completeness: ['completeness', '数据完整度'],
  updatedAt: ['updatedAt', '更新时间'],
  isKeyModel: ['isKeyModel', '重点车型'],
  coreHighlights: ['coreHighlights', '核心特点'],
  designFocus: ['designFocus', '设计看点'],
  benchmarkSuitability: ['benchmarkSuitability', '适合对标类型'],
  specJson: ['specJson', '参数JSON', '基础参数JSON', '配置JSON'],
  pointId: ['pointId', '对标点ID'],
  category: ['category', '类别', '对标类型'],
  title: ['title', '标题'],
  description: ['description', '描述'],
  sceneDescription: ['sceneDescription', '场景描述'],
  userValue: ['userValue', '用户价值'],
  highlight: ['highlight', '体验亮点', '亮点'],
  issue: ['issue', '问题'],
  referenceValue: ['referenceValue', '可借鉴点', '引用价值'],
  mediaJson: ['mediaJson', '媒体JSON', '图片JSON', '截图JSON'],
  interfaceLocation: ['interfaceLocation', '界面位置'],
  interactionMode: ['interactionMode', '交互方式'],
  visualStyle: ['visualStyle', '视觉风格'],
  informationArchitecture: ['informationArchitecture', '信息架构'],
  motion: ['motion', '动效'],
  stylingFeature: ['stylingFeature', '造型特征'],
  brandIdentity: ['brandIdentity', '品牌识别点'],
  proportion: ['proportion', '比例姿态'],
  detailDesign: ['detailDesign', '细节设计'],
  materialColor: ['materialColor', '材质/色彩', '材质 / 色彩'],
  linkId: ['linkId', '链接ID'],
  platform: ['platform', '平台'],
  url: ['url', '链接', 'URL'],
  heat: ['heat', '热度'],
  sentiment: ['sentiment', '情绪倾向'],
  logId: ['logId', '迭代记录ID', '记录ID'],
  yearModel: ['yearModel', '年款/改款时间', '年款'],
  changeTime: ['changeTime', '改款时间', '变化时间'],
  changeTypes: ['changeTypes', '变化类型'],
  designImpact: ['designImpact', '对设计对标的影响', '设计对标影响'],
};

export const chineseFieldNames = Object.fromEntries(
  Object.entries(fieldAliases).map(([key, aliases]) => [key, aliases[1] || key]),
);

export function fieldValue(fields, key) {
  const aliases = fieldAliases[key] || [key];
  for (const name of aliases) {
    if (Object.prototype.hasOwnProperty.call(fields, name)) {
      return fields[name];
    }
  }
  return undefined;
}

const benchmarkCategoryFromField = (value) => {
  const raw = textFromField(value, 'experience').trim().toLowerCase();
  const map = {
    体验: 'experience',
    体验场景: 'experience',
    experience: 'experience',
    hmi: 'hmi',
    界面: 'hmi',
    外饰: 'exterior',
    exterior: 'exterior',
    内饰: 'interior',
    interior: 'interior',
  };

  return map[raw] || 'experience';
};

export function vehicleFieldsToEntity(record, grouped = {}) {
  const fields = record.fields || {};
  const vehicleId = textFromField(fieldValue(fields, 'vehicleId'), record.record_id);
  const coverImage = {
    id: `${vehicleId}-cover`,
    type: 'image',
    url: textFromField(fieldValue(fields, 'coverImageUrl'), fallbackImage),
    title: textFromField(
      fieldValue(fields, 'coverImageTitle'),
      `${textFromField(fieldValue(fields, 'brand'))} ${textFromField(fieldValue(fields, 'model'))} 封面图`,
    ),
    alt: textFromField(fieldValue(fields, 'coverImageAlt'), textFromField(fieldValue(fields, 'coverImageTitle'), '车型封面图')),
    source: textFromField(fieldValue(fields, 'coverImageSource'), 'Feishu'),
  };

  const benchmarkPoints = grouped.benchmarkPoints || [];
  const experiencePoints = benchmarkPoints.filter((point) => point.category === 'experience');
  const hmiPoints = benchmarkPoints.filter((point) => point.category === 'hmi');
  const exteriorPoints = benchmarkPoints.filter((point) => point.category === 'exterior');
  const interiorPoints = benchmarkPoints.filter((point) => point.category === 'interior');

  return {
    id: vehicleId,
    recordId: record.record_id,
    brand: textFromField(fieldValue(fields, 'brand')),
    model: textFromField(fieldValue(fields, 'model')),
    year: textFromField(fieldValue(fields, 'year')),
    market: textFromField(fieldValue(fields, 'market'), '国内'),
    countryRegion: textFromField(fieldValue(fields, 'countryRegion')),
    level: textFromField(fieldValue(fields, 'level'), 'SUV'),
    energy: textFromField(fieldValue(fields, 'energy'), '纯电'),
    priceMin: numberFromField(fieldValue(fields, 'priceMin')),
    priceMax: numberFromField(fieldValue(fields, 'priceMax')),
    coverImage,
    productPositioning: textFromField(fieldValue(fields, 'productPositioning')),
    targetUsers: textFromField(fieldValue(fields, 'targetUsers')),
    summary: textFromField(fieldValue(fields, 'summary')),
    keyTags: arrayFromField(fieldValue(fields, 'keyTags')),
    scenarioTags: arrayFromField(fieldValue(fields, 'scenarioTags')),
    hmiTags: arrayFromField(fieldValue(fields, 'hmiTags')),
    stylingTags: arrayFromField(fieldValue(fields, 'stylingTags')),
    status: textFromField(fieldValue(fields, 'status'), '待补充'),
    completeness: numberFromField(fieldValue(fields, 'completeness'), 0),
    updatedAt: dateFromField(fieldValue(fields, 'updatedAt')),
    isKeyModel: boolFromField(fieldValue(fields, 'isKeyModel')),
    spec: grouped.spec || {},
    coreHighlights: arrayFromField(fieldValue(fields, 'coreHighlights')),
    designFocus: arrayFromField(fieldValue(fields, 'designFocus')),
    benchmarkSuitability: arrayFromField(fieldValue(fields, 'benchmarkSuitability')),
    experiencePoints,
    hmiPoints,
    exteriorPoints,
    interiorPoints,
    links: grouped.discussions || [],
    versionLogs: grouped.versionLogs || [],
  };
}

export function vehicleToFields(vehicle) {
  return {
    vehicleId: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    market: vehicle.market,
    countryRegion: vehicle.countryRegion,
    level: vehicle.level,
    energy: vehicle.energy,
    priceMin: vehicle.priceMin,
    priceMax: vehicle.priceMax,
    coverImageUrl: vehicle.coverImage?.url || '',
    coverImageTitle: vehicle.coverImage?.title || '',
    coverImageAlt: vehicle.coverImage?.alt || '',
    coverImageSource: vehicle.coverImage?.source || '',
    productPositioning: vehicle.productPositioning,
    targetUsers: vehicle.targetUsers,
    summary: vehicle.summary,
    keyTags: arrayToField(vehicle.keyTags),
    scenarioTags: arrayToField(vehicle.scenarioTags),
    hmiTags: arrayToField(vehicle.hmiTags),
    stylingTags: arrayToField(vehicle.stylingTags),
    status: vehicle.status,
    completeness: vehicle.completeness,
    updatedAt: vehicle.updatedAt,
    isKeyModel: vehicle.isKeyModel,
    coreHighlights: arrayToField(vehicle.coreHighlights),
    designFocus: arrayToField(vehicle.designFocus),
    benchmarkSuitability: arrayToField(vehicle.benchmarkSuitability),
  };
}

export function specRecordToEntity(record) {
  const fields = record.fields || {};
  return {
    vehicleId: textFromField(fieldValue(fields, 'vehicleId')),
    recordId: record.record_id,
    spec: jsonFromField(fieldValue(fields, 'specJson'), {}),
  };
}

export function specToFields(vehicleId, spec) {
  return {
    vehicleId,
    specJson: jsonToField(spec),
  };
}

export function benchmarkRecordToEntity(record) {
  const fields = record.fields || {};
  return {
    recordId: record.record_id,
    id: textFromField(fieldValue(fields, 'pointId'), record.record_id),
    vehicleId: textFromField(fieldValue(fields, 'vehicleId')),
    category: benchmarkCategoryFromField(fieldValue(fields, 'category')),
    title: textFromField(fieldValue(fields, 'title')),
    description: textFromField(fieldValue(fields, 'description')),
    sceneDescription: textFromField(fieldValue(fields, 'sceneDescription')),
    userValue: textFromField(fieldValue(fields, 'userValue')),
    highlight: textFromField(fieldValue(fields, 'highlight')),
    issue: textFromField(fieldValue(fields, 'issue')),
    referenceValue: textFromField(fieldValue(fields, 'referenceValue')),
    media: jsonFromField(fieldValue(fields, 'mediaJson'), undefined),
    interfaceLocation: textFromField(fieldValue(fields, 'interfaceLocation')),
    interactionMode: textFromField(fieldValue(fields, 'interactionMode')),
    visualStyle: textFromField(fieldValue(fields, 'visualStyle')),
    informationArchitecture: textFromField(fieldValue(fields, 'informationArchitecture')),
    motion: textFromField(fieldValue(fields, 'motion')),
    stylingFeature: textFromField(fieldValue(fields, 'stylingFeature')),
    brandIdentity: textFromField(fieldValue(fields, 'brandIdentity')),
    proportion: textFromField(fieldValue(fields, 'proportion')),
    detailDesign: textFromField(fieldValue(fields, 'detailDesign')),
    materialColor: textFromField(fieldValue(fields, 'materialColor')),
  };
}

export function benchmarkToFields(vehicleId, point) {
  return {
    vehicleId,
    pointId: point.id,
    category: point.category,
    title: point.title,
    description: point.description || '',
    sceneDescription: point.sceneDescription || '',
    userValue: point.userValue || '',
    highlight: point.highlight || '',
    issue: point.issue || '',
    referenceValue: point.referenceValue || '',
    mediaJson: point.media ? jsonToField(point.media) : '',
    interfaceLocation: point.interfaceLocation || '',
    interactionMode: point.interactionMode || '',
    visualStyle: point.visualStyle || '',
    informationArchitecture: point.informationArchitecture || '',
    motion: point.motion || '',
    stylingFeature: point.stylingFeature || '',
    brandIdentity: point.brandIdentity || '',
    proportion: point.proportion || '',
    detailDesign: point.detailDesign || '',
    materialColor: point.materialColor || '',
  };
}

export function discussionRecordToEntity(record) {
  const fields = record.fields || {};
  return {
    recordId: record.record_id,
    id: textFromField(fieldValue(fields, 'linkId'), record.record_id),
    vehicleId: textFromField(fieldValue(fields, 'vehicleId')),
    platform: textFromField(fieldValue(fields, 'platform')),
    title: textFromField(fieldValue(fields, 'title')),
    url: textFromField(fieldValue(fields, 'url')),
    heat: textFromField(fieldValue(fields, 'heat')),
    summary: textFromField(fieldValue(fields, 'summary')),
    sentiment: textFromField(fieldValue(fields, 'sentiment'), '中性'),
    referenceValue: textFromField(fieldValue(fields, 'referenceValue')),
  };
}

export function discussionToFields(vehicleId, link) {
  return {
    vehicleId,
    linkId: link.id,
    platform: link.platform,
    title: link.title,
    url: link.url,
    heat: link.heat,
    summary: link.summary,
    sentiment: link.sentiment,
    referenceValue: link.referenceValue,
  };
}

export function versionRecordToEntity(record) {
  const fields = record.fields || {};
  return {
    recordId: record.record_id,
    id: textFromField(fieldValue(fields, 'logId'), record.record_id),
    vehicleId: textFromField(fieldValue(fields, 'vehicleId')),
    yearModel: textFromField(fieldValue(fields, 'yearModel')),
    changeTime: textFromField(fieldValue(fields, 'changeTime')),
    changeTypes: arrayFromField(fieldValue(fields, 'changeTypes')),
    description: textFromField(fieldValue(fields, 'description')),
    designImpact: textFromField(fieldValue(fields, 'designImpact')),
  };
}

export function versionToFields(vehicleId, log) {
  return {
    vehicleId,
    logId: log.id,
    yearModel: log.yearModel,
    changeTime: log.changeTime,
    changeTypes: arrayToField(log.changeTypes),
    description: log.description,
    designImpact: log.designImpact,
  };
}
