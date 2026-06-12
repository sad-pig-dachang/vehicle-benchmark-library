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

export function vehicleFieldsToEntity(record, grouped = {}) {
  const fields = record.fields || {};
  const vehicleId = textFromField(fields.vehicleId, record.record_id);
  const coverImage = {
    id: `${vehicleId}-cover`,
    type: 'image',
    url: textFromField(fields.coverImageUrl, fallbackImage),
    title: textFromField(fields.coverImageTitle, `${textFromField(fields.brand)} ${textFromField(fields.model)} 封面图`),
    alt: textFromField(fields.coverImageAlt, textFromField(fields.coverImageTitle, '车型封面图')),
    source: textFromField(fields.coverImageSource, 'Feishu'),
  };

  const benchmarkPoints = grouped.benchmarkPoints || [];
  const experiencePoints = benchmarkPoints.filter((point) => point.category === 'experience');
  const hmiPoints = benchmarkPoints.filter((point) => point.category === 'hmi');
  const exteriorPoints = benchmarkPoints.filter((point) => point.category === 'exterior');
  const interiorPoints = benchmarkPoints.filter((point) => point.category === 'interior');

  return {
    id: vehicleId,
    recordId: record.record_id,
    brand: textFromField(fields.brand),
    model: textFromField(fields.model),
    year: textFromField(fields.year),
    market: textFromField(fields.market, '国内'),
    countryRegion: textFromField(fields.countryRegion),
    level: textFromField(fields.level, 'SUV'),
    energy: textFromField(fields.energy, '纯电'),
    priceMin: numberFromField(fields.priceMin),
    priceMax: numberFromField(fields.priceMax),
    coverImage,
    productPositioning: textFromField(fields.productPositioning),
    targetUsers: textFromField(fields.targetUsers),
    summary: textFromField(fields.summary),
    keyTags: arrayFromField(fields.keyTags),
    scenarioTags: arrayFromField(fields.scenarioTags),
    hmiTags: arrayFromField(fields.hmiTags),
    stylingTags: arrayFromField(fields.stylingTags),
    status: textFromField(fields.status, '待补充'),
    completeness: numberFromField(fields.completeness, 0),
    updatedAt: dateFromField(fields.updatedAt),
    isKeyModel: boolFromField(fields.isKeyModel),
    spec: grouped.spec || {},
    coreHighlights: arrayFromField(fields.coreHighlights),
    designFocus: arrayFromField(fields.designFocus),
    benchmarkSuitability: arrayFromField(fields.benchmarkSuitability),
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
    vehicleId: textFromField(fields.vehicleId),
    recordId: record.record_id,
    spec: jsonFromField(fields.specJson, {}),
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
    id: textFromField(fields.pointId, record.record_id),
    vehicleId: textFromField(fields.vehicleId),
    category: textFromField(fields.category, 'experience'),
    title: textFromField(fields.title),
    description: textFromField(fields.description),
    sceneDescription: textFromField(fields.sceneDescription),
    userValue: textFromField(fields.userValue),
    highlight: textFromField(fields.highlight),
    issue: textFromField(fields.issue),
    referenceValue: textFromField(fields.referenceValue),
    media: jsonFromField(fields.mediaJson, undefined),
    interfaceLocation: textFromField(fields.interfaceLocation),
    interactionMode: textFromField(fields.interactionMode),
    visualStyle: textFromField(fields.visualStyle),
    informationArchitecture: textFromField(fields.informationArchitecture),
    motion: textFromField(fields.motion),
    stylingFeature: textFromField(fields.stylingFeature),
    brandIdentity: textFromField(fields.brandIdentity),
    proportion: textFromField(fields.proportion),
    detailDesign: textFromField(fields.detailDesign),
    materialColor: textFromField(fields.materialColor),
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
    id: textFromField(fields.linkId, record.record_id),
    vehicleId: textFromField(fields.vehicleId),
    platform: textFromField(fields.platform),
    title: textFromField(fields.title),
    url: textFromField(fields.url),
    heat: textFromField(fields.heat),
    summary: textFromField(fields.summary),
    sentiment: textFromField(fields.sentiment, '中性'),
    referenceValue: textFromField(fields.referenceValue),
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
    id: textFromField(fields.logId, record.record_id),
    vehicleId: textFromField(fields.vehicleId),
    yearModel: textFromField(fields.yearModel),
    changeTime: textFromField(fields.changeTime),
    changeTypes: arrayFromField(fields.changeTypes),
    description: textFromField(fields.description),
    designImpact: textFromField(fields.designImpact),
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
