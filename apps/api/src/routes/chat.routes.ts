import { Router } from 'express';
import { z } from 'zod';
import {
  getSatelliteDetails,
  validateSceneAction,
} from '../services/chatCatalogTools.js';
import type { ChatService } from '../services/chatService.js';
import type { SatelliteCatalog } from '../services/satelliteCatalog.js';

const filtersSchema = z
  .object({
    orbitClasses: z.array(z.enum(['LEO', 'MEO', 'GEO', 'HEO', 'OTHER'])).max(5),
    objectTypes: z.array(z.string()).max(100),
    countryCodes: z.array(z.string()).max(300),
  })
  .strict();

const requestSchema = z
  .object({
    messages: z
      .array(
        z
          .object({
            role: z.enum(['user', 'assistant']),
            content: z.string().trim().min(1).max(2000),
          })
          .strict(),
      )
      .min(1)
      .max(12),
    context: z
      .object({
        selectedSatelliteId: z.string().nullable(),
        filters: filtersSchema,
      })
      .strict(),
  })
  .strict();

export function createChatRouter({
  catalog,
  enabled,
  service,
}: {
  catalog: SatelliteCatalog;
  enabled: boolean;
  service: ChatService | null;
}): Router {
  const router = Router();
  if (!enabled || process.env.NODE_ENV === 'production') return router;

  router.post('/chat', async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid chat request.' });
      return;
    }
    const request = parsed.data;
    if (
      request.messages.at(-1)?.role !== 'user' ||
      (request.context.selectedSatelliteId !== null &&
        !getSatelliteDetails(catalog, request.context.selectedSatelliteId)) ||
      !validateSceneAction(catalog, {
        type: 'patchFilters',
        patch: request.context.filters,
      })
    ) {
      res
        .status(400)
        .json({ error: 'Invalid chat history or catalog context.' });
      return;
    }
    if (!service) {
      res.status(503).json({
        error:
          'Chat requires OPENAI_API_KEY and OPENAI_MODEL on the API server.',
      });
      return;
    }
    if (catalog.getSatellites().length === 0) {
      res
        .status(503)
        .json({ error: 'The satellite catalog is not loaded yet.' });
      return;
    }

    const controller = new AbortController();
    const onClose = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.on('close', onClose);
    try {
      const reply = await service.run(request, controller.signal);
      if (!controller.signal.aborted) res.json(reply);
    } catch {
      if (!controller.signal.aborted) {
        res
          .status(502)
          .json({
            error: 'Chat model request failed. Check API server configuration.',
          });
      }
    } finally {
      res.off('close', onClose);
    }
  });

  return router;
}
