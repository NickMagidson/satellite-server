import cors from 'cors';
import express, { type ErrorRequestHandler, type Express } from 'express';
import { HttpError } from './errors.js';
import { createSatelliteRouter } from './routes/satellites.routes.js';
import type { SatelliteCatalog } from './services/satelliteCatalog.js';

interface CreateAppOptions {
  catalog: SatelliteCatalog;
}

export function createApp({ catalog }: CreateAppOptions): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  app.get('/health', (req, res) => {
    const snapshot = catalog.getCurrentSnapshot();

    res.json({
      ok: true,
      satellitesLoaded: snapshot.count,
      updatedAt: snapshot.updatedAt,
    });
  });

  app.use('/api/satellites', createSatelliteRouter({ catalog }));

  const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const statusCode = err instanceof HttpError ? err.statusCode : 500;
    const response: { error: string; details?: unknown } = {
      error: err instanceof Error ? err.message : 'Internal server error',
    };

    if (err instanceof HttpError && err.details !== undefined) {
      response.details = err.details;
    }

    res.status(statusCode).json(response);
  };

  app.use(errorHandler);

  return app;
}
