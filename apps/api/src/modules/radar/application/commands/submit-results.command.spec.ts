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
  producer: { adapter: 'external-worker', model: 'claude' },
  schemaVersion: 1,
};

describe('SubmitResultsHandler', () => {
  let repo: jest.Mocked<IRadarWorkRepository>;
  let handler: SubmitResultsHandler;

  beforeEach(() => {
    repo = {
      claim: jest.fn(),
      saveEnrichment: jest.fn().mockResolvedValue(true),
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

  it('should reject a result for an item that no longer exists', async () => {
    repo.saveEnrichment.mockResolvedValue(false);

    const result = await handler.execute(
      new SubmitResultsCommand({ results: [{ itemId: ITEM_A, enrichment: valid }] })
    );

    expect(result).toEqual({ stored: 0, rejected: [{ itemId: ITEM_A, reason: 'Item not found' }] });
  });
});
