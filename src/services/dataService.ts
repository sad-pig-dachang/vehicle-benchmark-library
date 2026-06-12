import { feishuService } from './feishuService';
import { localStorageService } from './localStorageService';
import type { Vehicle } from '../types/vehicle';

export interface VehicleRepository {
  listVehicles(): Promise<Vehicle[]>;
  saveVehicles(vehicles: Vehicle[]): Promise<Vehicle[]>;
  createVehicle(vehicle: Vehicle): Promise<Vehicle>;
  updateVehicle(vehicle: Vehicle): Promise<Vehicle>;
  deleteVehicle(vehicleId: string): Promise<void>;
  resetVehicles(): Promise<Vehicle[]>;
}

const source = import.meta.env.VITE_DATA_SOURCE || 'local';

export const dataService: VehicleRepository =
  source === 'feishu' ? feishuService : localStorageService;

export const dataSourceLabel = source === 'feishu' ? '飞书多维表格' : '浏览器本地存储';
