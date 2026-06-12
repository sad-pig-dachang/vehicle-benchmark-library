import { Router } from 'express';
import { requireFeishuConfig } from '../config.js';
import { getTenantAccessToken } from '../feishuClient.js';
import { vehicleRepository } from '../repositories/vehicleRepository.js';

export const apiRouter = Router();

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});

apiRouter.get(
  '/feishu/health',
  asyncHandler(async (_req, res) => {
    requireFeishuConfig();
    await getTenantAccessToken();
    res.json({ ok: true });
  }),
);

apiRouter.get(
  '/vehicles',
  asyncHandler(async (_req, res) => {
    const vehicles = await vehicleRepository.listVehicles();
    res.json(vehicles);
  }),
);

apiRouter.get(
  '/vehicles/:vehicleId',
  asyncHandler(async (req, res) => {
    const vehicle = await vehicleRepository.getVehicle(req.params.vehicleId);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }
    res.json(vehicle);
  }),
);

apiRouter.post(
  '/vehicles',
  asyncHandler(async (req, res) => {
    const vehicle = await vehicleRepository.createVehicle(req.body);
    res.status(201).json(vehicle);
  }),
);

apiRouter.put(
  '/vehicles/:vehicleId',
  asyncHandler(async (req, res) => {
    const vehicle = await vehicleRepository.updateVehicle(req.params.vehicleId, req.body);
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }
    res.json(vehicle);
  }),
);

apiRouter.delete(
  '/vehicles/:vehicleId',
  asyncHandler(async (req, res) => {
    const deleted = await vehicleRepository.deleteVehicle(req.params.vehicleId);
    if (!deleted) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }
    res.status(204).send();
  }),
);

apiRouter.get(
  '/benchmark-points',
  asyncHandler(async (req, res) => {
    const points = await vehicleRepository.listBenchmarkPoints(req.query.vehicleId);
    res.json(points);
  }),
);

apiRouter.post(
  '/benchmark-points',
  asyncHandler(async (req, res) => {
    const point = await vehicleRepository.createBenchmarkPoint(req.body);
    res.status(201).json(point);
  }),
);

apiRouter.put(
  '/benchmark-points/:recordId',
  asyncHandler(async (req, res) => {
    const point = await vehicleRepository.updateBenchmarkPoint(req.params.recordId, req.body);
    if (!point) {
      res.status(404).json({ message: 'Benchmark point not found' });
      return;
    }
    res.json(point);
  }),
);

apiRouter.get(
  '/discussions',
  asyncHandler(async (req, res) => {
    const discussions = await vehicleRepository.listDiscussions(req.query.vehicleId);
    res.json(discussions);
  }),
);
