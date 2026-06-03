import { Router, type Request, type Response } from 'express';
import { ValidationError } from '../errors.js';
import type { SatelliteCatalog } from '../services/satelliteCatalog.js';
import { parseOptionalDate } from '../utils/time.js';

interface CreateSatelliteRouterOptions {
  catalog: SatelliteCatalog;
}

export function createSatelliteRouter({ catalog }: CreateSatelliteRouterOptions): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const satellites = catalog.getSatellites();

    res.json({
      count: satellites.length,
      satellites,
    });
  });

  router.get('/positions', (req, res, next) => {
    try {
      const at = parseOptionalDate(req.query.at);
      res.json(at ? catalog.getPositionsAt(at) : catalog.getCurrentSnapshot());
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id/position', (req: Request<{ id: string }>, res: Response, next) => {
    try {
      const at = parseOptionalDate(req.query.at);
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('id route parameter is required.');
      }

      res.json(catalog.getPosition(id, at));
    } catch (error) {
      next(error);
    }
  });

  router.post('/omms', (req, res, next) => {
    try {
      const count = catalog.loadOmms(req.body);
      catalog.start();

      res.status(202).json({
        message: `Loaded ${count} satellite OMM record(s).`,
        ...catalog.getCurrentSnapshot(),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
