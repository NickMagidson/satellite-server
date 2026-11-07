import { generateText, stepCountIs, tool } from 'ai';
import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import type { SatelliteMetadata } from '../types.js';
import {
  getCurrentPosition,
  getSatelliteDetails,
  searchSatellites,
  validateSceneAction,
} from './chatCatalogTools.js';
import type { ChatFilters, ChatSceneAction } from './chatCatalogTools.js';
import type { SatelliteCatalog } from './satelliteCatalog.js';

export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context: { selectedSatelliteId: string | null; filters: ChatFilters };
}

export interface ChatReply {
  text: string;
  actions: ChatSceneAction[];
  searchResults: SatelliteMetadata[];
  positionNotices: Array<{
    id: string;
    elementEpoch: string;
    elementAgeDays: number;
  }>;
}

export interface ChatService {
  run(request: ChatRequest, signal: AbortSignal): Promise<ChatReply>;
}

const unavailable =
  'Ground-station access, pass times, footprints, coverage, and radio contacts are not available yet. I can search the satellite catalog, filter the globe, select satellites, and show catalog details or an on-demand position with its element age.';

function asksForUnsupportedCalculation(text: string): boolean {
  return [
    /\bpass(?:es)?\b/i,
    /\b(?:access\s+window|footprint|coverage|radio\s+contact|contact\s+window)\b/i,
    /\bground[ -]?station\b.*\b(?:access|visibility|visible|contact|see|view)\b/i,
    /\b(?:when|where|can|will)\b.*\b(?:see|spot|visible|overhead)\b.*\b(?:from|over|above|at|near|tonight)\b/i,
    /\bvisible\s+from\b/i,
    /\bwhen\b.*\b(?:over|above|near)\b/i,
  ].some((pattern) => pattern.test(text));
}

function asksForCurrentPosition(text: string): boolean {
  return /\b(?:where\s+is|current\s+(?:position|location|altitude)|right\s+now|coordinates|latitude|longitude)\b/i.test(
    text,
  );
}

function actionSummary(
  actions: ChatSceneAction[],
  catalog: SatelliteCatalog,
): string {
  return actions
    .map((action) => {
      if (action.type === 'resetFilters') return 'Cleared the globe filters.';
      if (action.type === 'selectSatellite') {
        const satellite = getSatelliteDetails(catalog, action.id);
        return satellite
          ? `Selected ${satellite.name} (NORAD ${satellite.noradCatId}).`
          : '';
      }
      return `Updated globe filters: ${Object.entries(action.patch)
        .map(([key, values]) => `${key} ${values.join(', ') || 'cleared'}`)
        .join('; ')}.`;
    })
    .filter(Boolean)
    .join(' ');
}

export function createChatService(
  catalog: SatelliteCatalog,
  model: LanguageModel,
): ChatService {
  return {
    async run(request, signal) {
      const empty: ChatReply = {
        text: unavailable,
        actions: [],
        searchResults: [],
        positionNotices: [],
      };
      if (asksForUnsupportedCalculation(request.messages.at(-1)?.content ?? ''))
        return empty;

      const actions: ChatSceneAction[] = [];
      let verifiedReads = 0;
      const resultIds = new Set<string>();
      const positionNotices = new Map<
        string,
        ChatReply['positionNotices'][number]
      >();
      const positionFailures = new Set<string>();
      const selected =
        request.context.selectedSatelliteId === null
          ? null
          : getSatelliteDetails(catalog, request.context.selectedSatelliteId);

      const result = await generateText({
        model,
        system: [
          'You are Lynx, a satellite catalog assistant. Use tools to check catalog facts and to request globe changes. Never invent satellite IDs, live locations, passes, ground-station access, footprints, coverage, or radio contacts. The latter five capabilities are unavailable.',
          'For searches, call searchSatellites. To change the globe, call selectSatellite, patchFilters, or resetFilters. For current position, call getCurrentPosition; the orbital elements may be stale, so mention their epoch and uncertainty.',
          `Selected satellite: ${selected ? JSON.stringify({ id: selected.id, name: selected.name, epoch: selected.epoch }) : 'none'}. Active filters: ${JSON.stringify(request.context.filters)}.`,
        ].join('\n'),
        messages: request.messages,
        abortSignal: signal,
        stopWhen: stepCountIs(5),
        tools: {
          searchSatellites: tool({
            description:
              'Search loaded satellites by name, NORAD ID, or object ID.',
            inputSchema: z.object({
              query: z.string(),
              limit: z.number().int().min(1).max(20).optional(),
            }),
            execute: ({ query, limit }) => {
              const matches = searchSatellites(catalog, query, limit ?? 10);
              verifiedReads += 1;
              for (const match of matches)
                if (resultIds.size < 20) resultIds.add(match.id);
              return matches;
            },
          }),
          getSatelliteDetails: tool({
            description:
              'Get trusted catalog metadata for a loaded satellite ID.',
            inputSchema: z.object({ id: z.string() }),
            execute: ({ id }) => {
              const details = getSatelliteDetails(catalog, id);
              if (details) verifiedReads += 1;
              return details;
            },
          }),
          getCurrentPosition: tool({
            description:
              'Propagate one loaded satellite at request time. May fail or be unreliable when elements are old.',
            inputSchema: z.object({ id: z.string() }),
            execute: ({ id }) => {
              const position = getCurrentPosition(catalog, id);
              if (position) {
                verifiedReads += 1;
                positionNotices.set(id, {
                  id,
                  elementEpoch: position.elementEpoch,
                  elementAgeDays: position.elementAgeDays,
                });
                if (position.position.status === 'propagation_failed')
                  positionFailures.add(id);
              }
              return position;
            },
          }),
          selectSatellite: tool({
            description:
              'Select a loaded satellite on the globe by its exact ID.',
            inputSchema: z.object({ id: z.string() }),
            execute: ({ id }) => {
              const action = validateSceneAction(catalog, {
                type: 'selectSatellite',
                id,
              });
              if (!action || actions.length >= 3)
                return { accepted: false, reason: 'Satellite is unavailable.' };
              actions.push(action);
              return {
                accepted: true,
                satellite: getSatelliteDetails(catalog, id),
              };
            },
          }),
          patchFilters: tool({
            description:
              'Set one or more globe filter categories to exact values available in this catalog. Empty arrays clear a category.',
            inputSchema: z.object({
              orbitClasses: z
                .array(z.enum(['LEO', 'MEO', 'GEO', 'HEO', 'OTHER']))
                .optional(),
              objectTypes: z.array(z.string()).optional(),
              countryCodes: z.array(z.string()).optional(),
            }),
            execute: (patch) => {
              const action = validateSceneAction(catalog, {
                type: 'patchFilters',
                patch,
              });
              if (!action || actions.length >= 3)
                return {
                  accepted: false,
                  reason: 'Filter values are unavailable.',
                };
              actions.push(action);
              return { accepted: true, action };
            },
          }),
          resetFilters: tool({
            description: 'Clear all globe filters.',
            inputSchema: z.object({}),
            execute: () => {
              const action = validateSceneAction(catalog, {
                type: 'resetFilters',
              });
              if (!action || actions.length >= 3) return { accepted: false };
              actions.push(action);
              return { accepted: true };
            },
          }),
        },
      });

      const notices = [...positionNotices.values()];
      const caveats = notices.map(
        ({ id, elementEpoch, elementAgeDays }) =>
          `${id}: orbital elements epoch ${elementEpoch} (${elementAgeDays.toFixed(1)} days old)${positionFailures.has(id) ? '; propagation failed, so no current position is available' : '; a propagated position from old elements may be inaccurate'}.`,
      );
      const results = catalog
        .getSatellites()
        .filter((satellite) => resultIds.has(satellite.id));
      const answer =
        positionFailures.size > 0
          ? 'I could not compute a current position for the satellite(s) listed below.'
          : asksForCurrentPosition(request.messages.at(-1)?.content ?? '') &&
              notices.length === 0
            ? 'I could not verify a current position from the loaded catalog.'
            : verifiedReads === 0 && actions.length > 0
              ? actionSummary(actions, catalog)
              : verifiedReads === 0
                ? /\bselected\b/i.test(request.messages.at(-1)?.content ?? '')
                  ? selected
                    ? `Selected satellite: ${selected.name} (NORAD ${selected.noradCatId}).`
                    : 'No satellite is selected.'
                  : 'I could not verify a catalog answer. Ask me to search for a satellite by name or NORAD ID.'
                : result.text.trim() ||
                  'I could not complete that catalog request.';
      return {
        text: [...caveats, answer].join('\n\n'),
        actions,
        searchResults: results,
        positionNotices: notices,
      };
    },
  };
}

export function createOpenAiChatService(
  catalog: SatelliteCatalog,
  options: { apiKey: string; model: string },
): ChatService {
  const provider = createOpenAI({ apiKey: options.apiKey });
  return createChatService(catalog, provider.chat(options.model));
}
