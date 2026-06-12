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

export interface Vehicle {
  id: string;
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
}
