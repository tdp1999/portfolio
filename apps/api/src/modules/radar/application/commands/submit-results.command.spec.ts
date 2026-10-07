import { radarItem } from '../../domain/__fixtures__/radar-item.fixture';
import { IRadarWorkRepository } from '../ports/radar-work.repository.port';
import { RadarEnrichmentInput } from '../radar-enrichment.schema';
import { SubmitResultsCommand, SubmitResultsHandler } from './submit-results.command';

const ITEM_A = '01a10755-0000-7000-8000-00000000000a';
const ITEM_B = '01a10755-0000-7000-8000-00000000000b';

const valid = {
  tldr: 'Claude ships a new feature',
  providerTags: ['anthropic', 'anthropic'],
  contentType: 'news',
  signalScore: 7,
  isPromo: false,
  isRelevant: true,
  factCheck: '   ',
  overview: 'A new Claude feature, part of the push toward agentic coding tools.',
  context: "Claude is Anthropic's model family.",
  scoreReason: 'A real release the Owner will use.',
  applyNote: 'Try it in the next session.',
  producer: { adapter: 'external-worker', model: 'claude' },
  schemaVersion: 3,
};

describe('SubmitResultsHandler', () => {
  let repo: jest.Mocked<IRadarWorkRepository>;
  let handler: SubmitResultsHandler;

  beforeEach(() => {
    repo = {
      claim: jest.fn(),
      findById: jest.fn(async (id: string) => radarItem({ id })),
      saveEnrichment: jest.fn().mockResolvedValue(true),
      release: jest.fn(),
      markFailed: jest.fn(),
      findDeepCandidates: jest.fn(),
      countDeep: jest.fn(),
      noteError: jest.fn(),
    };
    handler = new SubmitResultsHandler(repo);
  });

  it('should store valid results and reject invalid ones in the same batch', async () => {
    const result = await handler.execute(
      new SubmitResultsCommand({
        results: [
          { itemId: ITEM_A, enrichment: valid },
          { itemId: ITEM_B, enrichment: { ...valid, signalScore: 11 } },
        ],
      })
    );

    expect(result).toEqual({
      stored: 1,
      rejected: [{ itemId: ITEM_B, reason: expect.stringContaining('signalScore') }],
    });
    expect(repo.saveEnrichment).toHaveBeenCalledTimes(1);
  });

  it('should dedupe provider tags and turn blank optional text into null before saving', async () => {
    await handler.execute(new SubmitResultsCommand({ results: [{ itemId: ITEM_A, enrichment: valid }] }));

    const saved = repo.saveEnrichment.mock.calls[0][1] as RadarEnrichmentInput;
    expect(saved.providerTags).toEqual(['anthropic']);
    expect(saved.factCheck).toBeNull();
  });

  it('should require overview, context, score reason and apply note, and reject older shapes', async () => {
    const { context: _c, ...noContext } = valid;
    const { overview: _o, ...noOverview } = valid;
    const result = await handler.execute(
      new SubmitResultsCommand({
        results: [
          { itemId: ITEM_A, enrichment: noContext },
          { itemId: ITEM_B, enrichment: { ...valid, applyNote: null, scoreReason: ' ' } },
          { itemId: ITEM_A, enrichment: noOverview },
          { itemId: ITEM_B, enrichment: { ...valid, schemaVersion: 2 } },
        ],
      })
    );

    expect(result.stored).toBe(0);
    expect(result.rejected.map((r) => r.reason)).toEqual([
      expect.stringContaining('context'),
      expect.stringMatching(/applyNote[\s\S]*scoreReason|scoreReason[\s\S]*applyNote/),
      expect.stringContaining('overview'),
      expect.stringContaining('schemaVersion'),
    ]);
  });

  it('should reject a fact check without a severity', async () => {
    const result = await handler.execute(
      new SubmitResultsCommand({
        results: [{ itemId: ITEM_A, enrichment: { ...valid, factCheck: 'The benchmark is from 2024.' } }],
      })
    );

    expect(result).toEqual({
      stored: 0,
      rejected: [{ itemId: ITEM_A, reason: expect.stringContaining('factCheckSeverity') }],
    });
  });

  it('should drop the severity when there is no fact check', async () => {
    await handler.execute(
      new SubmitResultsCommand({
        results: [{ itemId: ITEM_A, enrichment: { ...valid, factCheckSeverity: 'major' } }],
      })
    );

    const saved = repo.saveEnrichment.mock.calls[0][1] as RadarEnrichmentInput;
    expect(saved.factCheckSeverity).toBeNull();
  });

  it('should reject a result for an item that no longer exists', async () => {
    repo.saveEnrichment.mockResolvedValue(false);

    const result = await handler.execute(
      new SubmitResultsCommand({ results: [{ itemId: ITEM_A, enrichment: valid }] })
    );

    expect(result).toEqual({ stored: 0, rejected: [{ itemId: ITEM_A, reason: 'Item not found' }] });
  });
});
