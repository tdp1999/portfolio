import { HealthProfile } from '../../domain/entities/health-profile.entity';
import { IHealthProfileRepository } from '../ports/health-profile.repository.port';
import { ListHealthProfilesHandler, ListHealthProfilesQuery } from './list-health-profiles.query';

// R11.12 of the medicine cabinet epic: people are sorted A→Z in Vietnamese ("Bố", "Mẹ", "Owner").

const OWNER_USER_ID = '01a10b5b-9d90-753e-a6a3-00000000aaaa';
const AT = new Date('2026-10-01T00:00:00Z');

const person = (id: string, name: string) =>
  HealthProfile.load({
    id,
    name,
    createdAt: AT,
    updatedAt: AT,
    createdById: OWNER_USER_ID,
    updatedById: OWNER_USER_ID,
    deletedAt: null,
    deletedById: null,
  });

describe('ListHealthProfilesHandler', () => {
  it('R11.12: returns "Bố", "Mẹ", "Owner" in that order, each with its item count', async () => {
    const profiles = {
      findAllWithItemCount: jest.fn(async () => [
        { profile: person('01a10b5b-9d90-753e-a6a3-0000000000a3', 'Owner'), itemCount: 5 },
        { profile: person('01a10b5b-9d90-753e-a6a3-0000000000a1', 'Mẹ'), itemCount: 3 },
        { profile: person('01a10b5b-9d90-753e-a6a3-0000000000a2', 'Bố'), itemCount: 0 },
      ]),
    } as unknown as IHealthProfileRepository;

    const result = await new ListHealthProfilesHandler(profiles).execute(new ListHealthProfilesQuery());

    expect(result.map(({ name, itemCount }) => ({ name, itemCount }))).toEqual([
      { name: 'Bố', itemCount: 0 },
      { name: 'Mẹ', itemCount: 3 },
      { name: 'Owner', itemCount: 5 },
    ]);
  });
});
