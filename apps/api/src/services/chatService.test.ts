import { MockLanguageModelV3 } from 'ai/test';
import { describe, expect, it } from 'vitest';
import { highDragOmm, validOmm } from '../test/fixtures.js';
import { SatelliteCatalog } from './satelliteCatalog.js';
import { createChatService } from './chatService.js';

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 10, text: 10, reasoning: 0 },
};

function fixtureCatalog() {
  const catalog = new SatelliteCatalog({ liveRefreshEnabled: false });
  catalog.loadOmms([validOmm]);
  return catalog;
}

function request(content: string) {
  return {
    messages: [{ role: 'user' as const, content }],
    context: {
      selectedSatelliteId: null,
      filters: { orbitClasses: [], objectTypes: [], countryCodes: [] },
    },
  };
}

describe('chat service', () => {
  it('uses on-demand position lookup and reports old elements deterministically', async () => {
    const model = new MockLanguageModelV3({
      doGenerate: [
        {
          content: [
            {
              type: 'tool-call',
              toolCallId: 'position-1',
              toolName: 'getCurrentPosition',
              input: JSON.stringify({ id: '25544' }),
            },
          ],
          finishReason: { unified: 'tool-calls', raw: undefined },
          usage,
          warnings: [],
        },
        {
          content: [{ type: 'text', text: 'The ISS is currently over Earth.' }],
          finishReason: { unified: 'stop', raw: undefined },
          usage,
          warnings: [],
        },
      ],
    });
    const reply = await createChatService(fixtureCatalog(), model).run(
      request('Where is the ISS now?'),
      new AbortController().signal,
    );
    expect(reply.positionNotices).toEqual([
      expect.objectContaining({ id: '25544', elementEpoch: validOmm.EPOCH }),
    ]);
    expect(reply.positionNotices[0]?.elementAgeDays).toBeGreaterThan(1);
    expect(reply.text).toContain(validOmm.EPOCH);
  });

  it('drops scene actions for unknown IDs', async () => {
    const model = new MockLanguageModelV3({
      doGenerate: [
        {
          content: [
            {
              type: 'tool-call',
              toolCallId: 'select-1',
              toolName: 'selectSatellite',
              input: JSON.stringify({ id: 'missing' }),
            },
          ],
          finishReason: { unified: 'tool-calls', raw: undefined },
          usage,
          warnings: [],
        },
        {
          content: [
            { type: 'text', text: 'That satellite is not in this catalog.' },
          ],
          finishReason: { unified: 'stop', raw: undefined },
          usage,
          warnings: [],
        },
      ],
    });
    const reply = await createChatService(fixtureCatalog(), model).run(
      request('Select missing'),
      new AbortController().signal,
    );
    expect(reply.actions).toEqual([]);
  });

  it('returns catalog search choices and a validated selection action', async () => {
    const model = new MockLanguageModelV3({ doGenerate: [
      {
        content: [{ type: 'tool-call', toolCallId: 'search-1', toolName: 'searchSatellites', input: JSON.stringify({ query: 'iss' }) }],
        finishReason: { unified: 'tool-calls', raw: undefined }, usage, warnings: [],
      },
      {
        content: [{ type: 'tool-call', toolCallId: 'select-1', toolName: 'selectSatellite', input: JSON.stringify({ id: '25544' }) }],
        finishReason: { unified: 'tool-calls', raw: undefined }, usage, warnings: [],
      },
      {
        content: [{ type: 'text', text: 'Showing the ISS.' }],
        finishReason: { unified: 'stop', raw: undefined }, usage, warnings: [],
      },
    ] });
    const reply = await createChatService(fixtureCatalog(), model).run(request('Show the ISS'), new AbortController().signal);
    expect(reply.searchResults.map(({ id }) => id)).toEqual(['25544']);
    expect(reply.actions).toEqual([{ type: 'selectSatellite', id: '25544' }]);
  });

  it('never presents a failed propagation as a current position', async () => {
    const catalog = new SatelliteCatalog({ liveRefreshEnabled: false });
    catalog.loadOmms([highDragOmm]);
    const model = new MockLanguageModelV3({
      doGenerate: [
        {
          content: [
            {
              type: 'tool-call',
              toolCallId: 'position-1',
              toolName: 'getCurrentPosition',
              input: JSON.stringify({ id: '64844' }),
            },
          ],
          finishReason: { unified: 'tool-calls', raw: undefined },
          usage,
          warnings: [],
        },
        {
          content: [{ type: 'text', text: 'It is currently over San Diego.' }],
          finishReason: { unified: 'stop', raw: undefined },
          usage,
          warnings: [],
        },
      ],
    });
    const reply = await createChatService(catalog, model).run(
      request('Where is STARLINK-34709?'),
      new AbortController().signal,
    );
    expect(reply.positionNotices).toHaveLength(1);
    expect(reply.text).toMatch(/propagation failed/i);
    expect(reply.text).not.toContain('currently over San Diego');
  });

  it.each([
    'When will the ISS pass over San Diego?',
    'When can I see the ISS from San Diego?',
    'Will the ISS be visible from my ground station tonight?',
    'What is the satellite footprint over California?',
  ])(
    'refuses unsupported access or coverage questions without calling the model: %s',
    async (question) => {
      const model = new MockLanguageModelV3();
      const reply = await createChatService(fixtureCatalog(), model).run(
        request(question),
        new AbortController().signal,
      );
      expect(reply.text).toMatch(/pass|access/i);
      expect(reply.actions).toEqual([]);
      expect(model.doGenerateCalls).toHaveLength(0);
    },
  );

  it('does not repeat unverified catalog or current-position claims from a text-only model reply', async () => {
    const model = new MockLanguageModelV3({
      doGenerate: {
        content: [
          { type: 'text', text: 'The ISS is currently over San Diego.' },
        ],
        finishReason: { unified: 'stop', raw: undefined },
        usage,
        warnings: [],
      },
    });
    const reply = await createChatService(fixtureCatalog(), model).run(
      request('Where is the ISS now?'),
      new AbortController().signal,
    );
    expect(reply.text).not.toContain('currently over San Diego');
    expect(reply.text).toMatch(/verify|position/i);
  });
});
