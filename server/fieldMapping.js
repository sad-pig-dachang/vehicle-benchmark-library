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

const mediaTokenFromField = (value) => {
  if (!value) return '';
  if (Array.isArray(value)) {
    for (const item of value) {
      const token = mediaTokenFromField(item);
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

const formatDateText = (value) => {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || Math.abs(timestamp) < 100000000000) return '';

  const parts = new Intl.DateTimeFormat('zh-CN', {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
  }).formatToParts(new Date(timestamp));
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${partMap.year}年${partMap.month}月${partMap.day}日`;
};

const readableFieldValue = (value) => {
  const dateValue = typeof value === 'number' ? formatDateText(value) : '';
  if (dateValue) return dateValue;
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
};

const arrayFromField = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item !== 'object' || item === null) return readableFieldValue(item);
        return readableFieldValue(item.text) ||
          readableFieldValue(item.name) ||
          readableFieldValue(item.value) ||
          readableFieldValue(item.display_name) ||
          readableFieldValue(item.en_name) ||
          readableFieldValue(item.url) ||
          readableFieldValue(item.tmp_url) ||
          (typeof item.link === 'string' ? item.link : '');
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|,|，|、|;|；/)
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
    const values = value.map((item) => textFromField(item, '')).filter(Boolean);
    const hasRichTextParts = value.some((item) => typeof item === 'object' && item !== null && item.text);
    return values.join(hasRichTextParts ? '' : ' / ');
  }
  if (typeof value === 'object' && value !== null) {
    return readableFieldValue(value.url) ||
      readableFieldValue(value.tmp_url) ||
      (typeof value.link === 'string' ? value.link : '') ||
      readableFieldValue(value.text) ||
      readableFieldValue(value.name) ||
      readableFieldValue(value.value) ||
      readableFieldValue(value.display_name) ||
      readableFieldValue(value.en_name) ||
      fallback;
  }
  if (value === undefined || value === null) return fallback;
  return readableFieldValue(value) || fallback;
};

const urlFromField = (value, fallback = '') => {
  const mediaToken = mediaTokenFromField(value);
  if (mediaToken) return mediaUrlFromToken(mediaToken);

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = urlFromField(item, '');
      if (url) return url;
    }
    return fallback;
  }

  if (typeof value === 'object' && value !== null) {
    return value.url || value.tmp_url || value.link || fallback;
  }

  const raw = textFromField(value, '').trim();
  if (/^(https?:|data:image\/|\/)/.test(raw)) return raw;
  return fallback;
};

const dateFromField = (value, fallback = '') => {
  if (typeof value === 'number') {
    return formatDateText(value) || fallback;
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

const firstNumber = (value) => {
  const match = textFromField(value).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
};

const normalizeSpec = (spec = {}) => {
  const sizeText = textFromField(spec.长宽高 || spec.size || spec.dimensions);
  const sizeNumbers = sizeText.match(/\d+(\.\d+)?/g)?.map(Number) || [];

  return {
    lengthMm: spec.lengthMm ?? spec.车长 ?? sizeNumbers[0],
    widthMm: spec.widthMm ?? spec.车宽 ?? sizeNumbers[1],
    heightMm: spec.heightMm ?? spec.车高 ?? sizeNumbers[2],
    wheelbaseMm: spec.wheelbaseMm ?? firstNumber(spec.轴距),
    seats: spec.seats ?? spec.座位数,
    drivetrain: spec.drivetrain ?? spec.驱动形式,
    batteryKwh: spec.batteryKwh ?? spec.电池容量,
    cltcRangeKm: spec.cltcRangeKm ?? spec.CLTC续航 ?? spec.CLTC续航里程,
    engineOrMotor: spec.engineOrMotor ?? spec.动力系统 ?? spec.电机,
    acceleration0100: spec.acceleration0100 ?? spec.零百加速,
    cockpitChip: spec.cockpitChip ?? spec.座舱芯片,
    screenLayout: spec.screenLayout ?? spec.屏幕布局,
    assistDriving: spec.assistDriving ?? spec.辅助驾驶,
  };
};

export const fieldAliases = {
  vehicleId: ['vehicleId', '竞品库ID', '车型ID', '车型编号', '车辆ID'],
  brand: ['brand', '品牌'],
  model: ['model', '车型', '车型名称'],
  year: ['year', '年款'],
  market: ['market', '市场', '国内/海外'],
  countryRegion: ['countryRegion', '国家/地区', '国家地区'],
  level: ['level', '车型级别', '级别'],
  energy: ['energy', '能源形式', '能源'],
  priceMin: ['priceMin', '最低价格', '价格下限', '价格区间最低', '价格下限（万元）', '价格下限(万元)'],
  priceMax: ['priceMax', '最高价格', '价格上限', '价格区间最高', '价格上限（万元）', '价格上限(万元)'],
  coverImageUrl: ['coverImageUrl', '封面图', '封面图链接', '封面图URL'],
  coverImageTitle: ['coverImageTitle', '封面图标题'],
  coverImageAlt: ['coverImageAlt', '封面图说明'],
  coverImageSource: ['coverImageSource', '封面图来源'],
  productPositioning: ['productPositioning', '产品定位'],
  targetUsers: ['targetUsers', '目标用户'],
  summary: ['summary', '车型总述', '车型总结', '车型一句话总结', '一句话总结', '总结'],
  keyTags: ['keyTags', '车型标签/关键词', '关键标签'],
  scenarioTags: ['scenarioTags', '使用场景标签', '场景标签'],
  hmiTags: ['hmiTags', 'HMI标签', 'HMI 标签'],
  stylingTags: ['stylingTags', '内外饰标签', '造型标签'],
  status: ['status', '数据状态'],
  completeness: ['completeness', '数据完整度'],
  updatedAt: ['updatedAt', '更新时间'],
  isKeyModel: ['isKeyModel', '重点车型', '是否重点车型'],
  coreHighlights: ['coreHighlights', '核心特点'],
  designFocus: ['designFocus', '设计看点'],
  benchmarkSuitability: ['benchmarkSuitability', '适合对标类型'],
  specJson: ['specJson', '参数JSON', '基础参数JSON', '配置JSON'],
  l1Json: ['l1Json', 'L1用户市场JSON', 'L1 用户市场JSON'],
  l2Json: ['l2Json', 'L2竞品档案JSON', 'L2 竞品档案JSON'],
  l3Json: ['l3Json', 'L3场景对标JSON', 'L3 场景对标JSON'],
  l4Json: ['l4Json', 'L4设计借鉴JSON', 'L4 设计借鉴JSON'],
  l5Json: ['l5Json', 'L5测评追溯JSON', 'L5 测评追溯JSON'],
  displayNote: ['displayNote', '网站显示备注', '读取备注'],
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
  const priceRange = textFromField(fields['指导价'] || fields['价格区间'] || '');
  const priceNumbers = priceRange.match(/\d+(\.\d+)?/g)?.map(Number) || [];
  const rawLevel = textFromField(fieldValue(fields, 'level'), 'SUV');
  const rawEnergy = textFromField(fieldValue(fields, 'energy'), '');
  const inferredEnergy = rawEnergy || (rawLevel.includes('纯电') ? '纯电' : rawLevel.includes('增程') ? '增程' : rawLevel.includes('插混') ? '插混' : '纯电');
  const coverImage = {
    id: `${vehicleId}-cover`,
    type: 'image',
    url: urlFromField(fieldValue(fields, 'coverImageUrl')),
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
    level: rawLevel,
    energy: inferredEnergy,
    priceMin: numberFromField(fieldValue(fields, 'priceMin'), priceNumbers[0] || 0),
    priceMax: numberFromField(fieldValue(fields, 'priceMax'), priceNumbers[1] || priceNumbers[0] || 0),
    coverImage,
    productPositioning: textFromField(fieldValue(fields, 'productPositioning')),
    targetUsers: textFromField(fieldValue(fields, 'targetUsers')),
    summary: textFromField(fieldValue(fields, 'summary')),
    keyTags: arrayFromField(fieldValue(fields, 'keyTags')),
    scenarioTags: arrayFromField(fieldValue(fields, 'scenarioTags')),
    hmiTags: arrayFromField(fieldValue(fields, 'hmiTags')),
    stylingTags: arrayFromField(fieldValue(fields, 'stylingTags')),
    status: textFromField(fieldValue(fields, 'status')),
    completeness: numberFromField(fieldValue(fields, 'completeness'), 0),
    updatedAt: dateFromField(fieldValue(fields, 'updatedAt')),
    isKeyModel: boolFromField(fieldValue(fields, 'isKeyModel')),
    spec: normalizeSpec(Object.keys(grouped.spec || {}).length ? grouped.spec : jsonFromField(fieldValue(fields, 'specJson'), {})),
    coreHighlights: arrayFromField(fieldValue(fields, 'coreHighlights')),
    designFocus: arrayFromField(fieldValue(fields, 'designFocus')),
    benchmarkSuitability: arrayFromField(fieldValue(fields, 'benchmarkSuitability')),
    experiencePoints,
    hmiPoints,
    exteriorPoints,
    interiorPoints,
    links: grouped.discussions || [],
    versionLogs: grouped.versionLogs || [],
    profile: grouped.profile,
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
