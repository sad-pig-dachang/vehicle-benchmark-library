import type { DataStatus, EnergyType, VehicleLevel } from '../types/vehicle';

export const energyOptions: EnergyType[] = ['纯电', '插混', '增程', '燃油', '混动'];
export const levelOptions: VehicleLevel[] = ['轿车', 'SUV', 'MPV', '皮卡', '跑车'];
export const statusOptions: DataStatus[] = ['已完成', '调研中', '待补充'];

export const formatPrice = (min: number, max: number) => {
  if (!min && !max) return '待补充';
  if (min === max) return `${min} 万`;
  return `${min}-${max} 万`;
};

export const joinOrDash = (items: string[] | undefined, separator = ' / ') =>
  items && items.length ? items.join(separator) : '待补充';

export const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
