import type { Vehicle } from '../types/vehicle';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || `API request failed: ${response.status}`);
  }

  return payload as T;
}

export const feishuService = {
  async listVehicles(): Promise<Vehicle[]> {
    return request<Vehicle[]>('/vehicles');
  },

  async saveVehicles(vehicles: Vehicle[]): Promise<Vehicle[]> {
    const existing = await this.listVehicles();
    const existingIds = new Set(existing.map((vehicle) => vehicle.id));

    for (const vehicle of vehicles) {
      if (existingIds.has(vehicle.id)) {
        await this.updateVehicle(vehicle);
      } else {
        await this.createVehicle(vehicle);
      }
    }

    return this.listVehicles();
  },

  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    return request<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  },

  async updateVehicle(vehicle: Vehicle): Promise<Vehicle> {
    return request<Vehicle>(`/vehicles/${encodeURIComponent(vehicle.id)}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle),
    });
  },

  async deleteVehicle(vehicleId: string): Promise<void> {
    await request<void>(`/vehicles/${encodeURIComponent(vehicleId)}`, {
      method: 'DELETE',
    });
  },

  async resetVehicles(): Promise<Vehicle[]> {
    throw new Error('飞书模式不支持一键恢复示例数据。请使用导入 JSON 进行批量写入。');
  },
};
