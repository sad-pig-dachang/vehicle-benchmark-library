export type Market = '国内' | '海外';
export type EnergyType = '纯电' | '插混' | '增程' | '燃油' | '混动';
export type VehicleLevel = '轿车' | 'SUV' | 'MPV' | '皮卡' | '跑车';
export type DataStatus = '已完成' | '调研中' | '待补充';
export type MediaType = 'image' | 'video';
export type Sentiment = '正向' | '中性' | '争议' | '负向';
export type BenchmarkCategory = 'experience' | 'hmi' | 'exterior' | 'interior';
export type VersionChangeType = '外饰' | '内饰' | 'HMI' | '智驾' | '配置' | '动力';

export interface MediaAsset {
  id: string;
  type: MediaType;
  url: string;
  title: string;
  alt?: string;
  source?: string;
}

export interface VehicleSpec {
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  wheelbaseMm?: number;
  seats?: string;
  drivetrain?: string;
  batteryKwh?: string;
  cltcRangeKm?: string;
  engineOrMotor?: string;
  acceleration0100?: string;
  cockpitChip?: string;
  screenLayout?: string;
  assistDriving?: string;
}

export interface BenchmarkPoint {
  id: string;
  category: BenchmarkCategory;
  title: string;
  description?: string;
  sceneDescription?: string;
  userValue?: string;
  highlight?: string;
  issue?: string;
  referenceValue?: string;
  media?: MediaAsset;
  interfaceLocation?: string;
  interactionMode?: string;
  visualStyle?: string;
  informationArchitecture?: string;
  motion?: string;
  stylingFeature?: string;
  brandIdentity?: string;
  proportion?: string;
  detailDesign?: string;
  materialColor?: string;
}

export interface DiscussionLink {
  id: string;
  platform: string;
  title: string;
  url: string;
  heat: string;
  summary: string;
  sentiment: Sentiment;
  referenceValue: string;
}

export interface VersionLog {
  id: string;
  yearModel: string;
  changeTime: string;
  changeTypes: VersionChangeType[];
  description: string;
  designImpact: string;
}

export interface ProfileKeyValue {
  label: string;
  value: string;
}

export interface ProfileUserPoint {
  keyword: string;
  description: string;
}

export interface ProfileSpecRow {
  label: string;
  value: string;
  description?: string;
}

export interface ProfileSceneNeed {
  need: string;
  note?: string;
  hardware: string;
  software: string;
  judgement: string;
}

export interface ProfileScene {
  id: string;
  title: string;
  source: string;
  image?: MediaAsset;
  needs: ProfileSceneNeed[];
}

export interface ProfileFeature {
  id: string;
  title: string;
  feature: string;
  judgement: string;
  benchmarkValue: string;
  image?: MediaAsset;
}

export interface ProfileOpportunity {
  id: string;
  title: string;
  type: string;
  priority: string;
  source: string;
  direction: string;
  description: string;
  designValue: string;
}

export interface ProfileDesignReference {
  id: string;
  group: string;
  title: string;
  description: string;
  image?: MediaAsset;
  url?: string;
}

export interface ProfileScoreRow {
  dimension: string;
  maxScore: string;
  score: string;
  reason: string;
}

export interface VehicleProfileData {
  benchmarkLevel?: string;
  l1?: {
    targetUsers: ProfileUserPoint[];
    marketPoints: ProfileUserPoint[];
    tags: string[];
  };
  l2?: {
    basicItems: ProfileKeyValue[];
    configItems: ProfileSpecRow[];
    specRows: ProfileSpecRow[];
  };
  l3Scenes?: ProfileScene[];
  l3Features?: ProfileFeature[];
  l3Styling?: ProfileOpportunity[];
  l4Design?: {
    heroImages: MediaAsset[];
    references: ProfileDesignReference[];
  };
  l5?: {
    totalScore: string;
    score: string;
    summary: string;
    rows: ProfileScoreRow[];
  };
}

export interface Vehicle {
  id: string;
  recordId?: string;
  brand: string;
  model: string;
  year: string;
  market: Market;
  countryRegion: string;
  level: VehicleLevel;
  energy: EnergyType;
  priceMin: number;
  priceMax: number;
  coverImage: MediaAsset;
  productPositioning: string;
  targetUsers: string;
  summary: string;
  keyTags: string[];
  scenarioTags: string[];
  hmiTags: string[];
  stylingTags: string[];
  status: DataStatus;
  completeness: number;
  updatedAt: string;
  isKeyModel: boolean;
  spec: VehicleSpec;
  coreHighlights: string[];
  designFocus: string[];
  benchmarkSuitability: string[];
  experiencePoints: BenchmarkPoint[];
  hmiPoints: BenchmarkPoint[];
  exteriorPoints: BenchmarkPoint[];
  interiorPoints: BenchmarkPoint[];
  links: DiscussionLink[];
  versionLogs: VersionLog[];
  profile?: VehicleProfileData;
}
