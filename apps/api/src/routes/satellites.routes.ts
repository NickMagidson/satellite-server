import { Router, type Request, type Response } from 'express';
import { ValidationError } from '../errors.js';
import type { SatelliteCatalog } from '../services/satelliteCatalog.js';
import { loadStoredOmms, saveOmms } from '../services/ommRecordStore.js';
import { validateAndNormalizeOmms } from '../validation/ommValidation.js';
import { parseOptionalDate } from '../utils/time.js';

interface CreateSatelliteRouterOptions {
  catalog: SatelliteCatalog;
  databaseUrl: string | null;
}

export function createSatelliteRouter({ catalog, databaseUrl }: CreateSatelliteRouterOptions): Router {
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

  router.post('/omms', async (req, res, next) => {
    try {
      const validatedOmms = validateAndNormalizeOmms(req.body);
      
      if (databaseUrl) {
        await saveOmms(databaseUrl, validatedOmms);
        const storedOmms = await loadStoredOmms(databaseUrl);
        const count = catalog.loadOmms(storedOmms.records);
        catalog.start();

        res.status(202).json({
          message: `Loaded ${count} satellite OMM record(s).`,
          ...catalog.getCurrentSnapshot(),
        });
      } else {
        const count = catalog.loadOmms(validatedOmms);
        catalog.start();

        res.status(202).json({
          message: `Loaded ${count} satellite OMM record(s) (database not configured).`,
          ...catalog.getCurrentSnapshot(),
        });
      }
    } catch (error) {
      next(error);
    }
  });

  return router;
}
