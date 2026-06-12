import type { DataStatus, EnergyType, Market, VehicleLevel } from './vehicle';

export interface FilterState {
  search: string;
  market: Market | '全部';
  energies: EnergyType[];
  levels: VehicleLevel[];
  priceMin: string;
  priceMax: string;
  scenarioTags: string[];
  hmiTags: string[];
  stylingTags: string[];
  statuses: DataStatus[];
}
