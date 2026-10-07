import { RadarSource } from '../../domain/entities/radar-source.entity';
import { ICaptureProvider, ResolvedSource } from '../ports/capture-provider.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { CreateSourceCommand, CreateSourceHandler } from './create-source.command';

const CANONICAL = 'https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv';

const setup = (resolved: ResolvedSource | null) => {
  const repo = {
    findByUrl: jest.fn(async () => null),
    add: jest.fn(async () => undefined),
  } as unknown as jest.Mocked<IRadarSourceRepository>;
  const youtube = {
    platform: 'YOUTUBE',
    credentialName: 'YOUTUBE_API_KEY',
    isConfigured: () => true,
    resolveSource: jest.fn(async () => resolved),
  } as unknown as ICaptureProvider;
  return { repo, handler: new CreateSourceHandler(repo, [youtube]) };
};

describe('CreateSourceHandler', () => {
  it('should store a YouTube channel under its canonical URL, named after the channel when no name is given', async () => {
    const { repo, handler } = setup({ url: CANONICAL, name: 'Fireship' });

    const created = await handler.execute(
      new CreateSourceCommand({ platform: 'YOUTUBE', url: '@fireship', displayName: '' })
    );

    expect(repo.findByUrl).toHaveBeenCalledWith(CANONICAL);
    expect(created).toMatchObject({ url: CANONICAL, displayName: 'Fireship' });
    expect((repo.add.mock.calls[0][0] as RadarSource).url).toBe(CANONICAL);
  });

  it('should refuse a URL that points at no channel, and a YouTube URL sent as a Facebook source', async () => {
    const { repo, handler } = setup(null);

    await expect(
      handler.execute(new CreateSourceCommand({ url: '@fireship', displayName: 'Fireship' }))
    ).rejects.toMatchObject({ errorCode: 'RADAR_INVALID_INPUT' });

    await expect(
      handler.execute(new CreateSourceCommand({ platform: 'YOUTUBE', url: 'https://www.youtube.com/@nobody' }))
    ).rejects.toMatchObject({ errorCode: 'RADAR_INVALID_INPUT' });
    expect(repo.add).not.toHaveBeenCalled();
  });
});
