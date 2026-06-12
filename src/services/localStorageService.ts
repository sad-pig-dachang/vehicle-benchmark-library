import { sampleVehicles } from '../data/sampleVehicles';
import type { Vehicle } from '../types/vehicle';

const STORAGE_KEY = 'vehicle-benchmark-library:v1';

const cloneVehicles = (vehicles: Vehicle[]) => JSON.parse(JSON.stringify(vehicles)) as Vehicle[];

const readRaw = (): Vehicle[] | null => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Vehicle[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeRaw = (vehicles: Vehicle[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles, null, 2));
};

export const localStorageService = {
  async listVehicles(): Promise<Vehicle[]> {
    const stored = readRaw();
    if (stored) return stored;

    const seeded = cloneVehicles(sampleVehicles);
    writeRaw(seeded);
    return seeded;
  },

  async saveVehicles(vehicles: Vehicle[]): Promise<Vehicle[]> {
    writeRaw(vehicles);
    return vehicles;
  },

  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    const vehicles = await this.listVehicles();
    const next = [vehicle, ...vehicles];
    writeRaw(next);
    return vehicle;
  },

  async updateVehicle(vehicle: Vehicle): Promise<Vehicle> {
    const vehicles = await this.listVehicles();
    const next = vehicles.map((item) => (item.id === vehicle.id ? vehicle : item));
    writeRaw(next);
    return vehicle;
  },

  async deleteVehicle(vehicleId: string): Promise<void> {
    const vehicles = await this.listVehicles();
    writeRaw(vehicles.filter((item) => item.id !== vehicleId));
  },

  async resetVehicles(): Promise<Vehicle[]> {
    const seeded = cloneVehicles(sampleVehicles);
    writeRaw(seeded);
    return seeded;
  },
};
