import { HealthProfile } from '../../domain/entities/health-profile.entity';
import { MedicalItem } from '../../domain/entities/medical-item.entity';
import { IHealthProfileProps, IMedicalItemProps } from '../../domain/medicine-cabinet.types';
import { IHealthProfileRepository } from '../ports/health-profile.repository.port';
import { IMedicalItemRepository } from '../ports/medical-item.repository.port';
import { CreateHealthProfileCommand, CreateHealthProfileHandler } from './create-health-profile.command';
import { CreateMedicalItemCommand, CreateMedicalItemHandler } from './create-medical-item.command';
import { DeleteHealthProfileCommand, DeleteHealthProfileHandler } from './delete-health-profile.command';
import { DeleteMedicalItemCommand, DeleteMedicalItemHandler } from './delete-medical-item.command';
import { RenameHealthProfileCommand, RenameHealthProfileHandler } from './rename-health-profile.command';
import { UpdateMedicalItemCommand, UpdateMedicalItemHandler } from './update-medical-item.command';

// Expected values come from the examples of the medicine cabinet epic (R2, R3, R7, R10, R11, R13, 'P9 Trùng
// tên', the EP table and Non-functional History). The fake repositories keep the port contract: `findById`
// and `findByName` skip deleted rows, and `findByName` ignores letter case.

const OWNER_USER_ID = '01a10b5b-9d90-753e-a6a3-00000000aaaa';
const ME_ID = '01a10b5b-9d90-753e-a6a3-0000000000a1';
const OWNER_PROFILE_ID = '01a10b5b-9d90-753e-a6a3-0000000000a3';
const BO_ID = '01a10b5b-9d90-753e-a6a3-0000000000a2';
const AIR_X_ID = '01a10b5b-9d90-753e-a6a3-0000000000b1';
const UNKNOWN_ID = '01a10b5b-9d90-753e-a6a3-0000000000ff';
const EARLIER = new Date('2026-10-01T00:00:00Z');

const audit = (id: string) => ({
  id,
  createdAt: EARLIER,
  updatedAt: EARLIER,
  createdById: OWNER_USER_ID,
  updatedById: OWNER_USER_ID,
  deletedAt: null,
  deletedById: null,
});

const person = (id: string, name: string, overrides: Partial<IHealthProfileProps> = {}) =>
  HealthProfile.load({ ...audit(id), name, ...overrides });

const airX = (overrides: Partial<IMedicalItemProps> = {}) =>
  MedicalItem.load({
    ...audit(AIR_X_ID),
    profileId: ME_ID,
    kind: 'MEDICINE',
    name: 'Air-X',
    activeIngredients: ['Simethicone'],
    strength: '80mg',
    dose: null,
    timing: null,
    usageType: null,
    purpose: null,
    note: null,
    packForTravel: false,
    ...overrides,
  });

const profileRepo = (people: HealthProfile[] = []) => {
  const rows = new Map(people.map((p) => [p.id, p]));
  const live = () => [...rows.values()].filter((p) => !p.isDeleted);
  return {
    rows,
    add: jest.fn(async (p: HealthProfile) => {
      rows.set(p.id, p);
      return p.id;
    }),
    update: jest.fn(async (id: string, p: HealthProfile) => {
      rows.set(id, p);
    }),
    findById: jest.fn(async (id: string) => live().find((p) => p.id === id) ?? null),
    findByName: jest.fn(
      async (name: string) => live().find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? null
    ),
    findAllWithItemCount: jest.fn(),
    removeWithItems: jest.fn(async (id: string, p: HealthProfile) => {
      rows.set(id, p);
    }),
  } satisfies jest.Mocked<IHealthProfileRepository> & { rows: Map<string, HealthProfile> };
};

const itemRepo = (items: MedicalItem[] = []) => {
  const rows = new Map(items.map((i) => [i.id, i]));
  return {
    rows,
    add: jest.fn(async (i: MedicalItem) => {
      rows.set(i.id, i);
      return i.id;
    }),
    update: jest.fn(async (id: string, i: MedicalItem) => {
      rows.set(id, i);
    }),
    remove: jest.fn(async (id: string, i: MedicalItem) => {
      rows.set(id, i);
    }),
    findById: jest.fn(async (id: string) => {
      const row = rows.get(id);
      return row && !row.isDeleted ? row : null;
    }),
    findAll: jest.fn(),
    findLookup: jest.fn(),
  } satisfies jest.Mocked<IMedicalItemRepository> & { rows: Map<string, MedicalItem> };
};

const PARACETAMOL = (strength: string) => ({
  profileId: ME_ID,
  kind: 'MEDICINE',
  name: 'Paracetamol',
  activeIngredients: ['Paracetamol'],
  strength,
});

describe('medicine cabinet commands', () => {
  describe('CreateMedicalItemHandler', () => {
    const setup = (people = [person(ME_ID, 'Mẹ')]) => {
      const items = itemRepo();
      const profiles = profileRepo(people);
      return { items, profiles, handler: new CreateMedicalItemHandler(items, profiles) };
    };

    it('R2.2: does not call the repository when the schema rejects a supply sent with a dose', async () => {
      const { items, handler } = setup();
      const dto = { profileId: ME_ID, kind: 'SUPPLY', name: 'Băng gạc', dose: '1 miếng' };

      await expect(handler.execute(new CreateMedicalItemCommand(dto, OWNER_USER_ID))).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'MEDICAL_ITEM_INVALID_INPUT',
      });
      expect(items.add).not.toHaveBeenCalled();
    });

    it('R3.7: saves a second "Paracetamol" with another strength for the same person, without a warning', async () => {
      const { items, handler } = setup();

      await handler.execute(new CreateMedicalItemCommand(PARACETAMOL('500mg'), OWNER_USER_ID));
      await handler.execute(new CreateMedicalItemCommand(PARACETAMOL('250mg'), OWNER_USER_ID));

      expect(items.add).toHaveBeenCalledTimes(2);
      expect([...items.rows.values()].map((i) => i.toProps().strength).sort()).toEqual(['250mg', '500mg']);
    });

    it('R13.8: rejects the person "Bố" deleted in another tab with 400 at field "profileId"', async () => {
      const { items, handler } = setup([
        person(ME_ID, 'Mẹ'),
        person(BO_ID, 'Bố', { deletedAt: EARLIER, deletedById: OWNER_USER_ID }),
      ]);

      await expect(
        handler.execute(new CreateMedicalItemCommand({ ...PARACETAMOL('500mg'), profileId: BO_ID }, OWNER_USER_ID))
      ).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'MEDICAL_ITEM_INVALID_INPUT',
        data: { profileId: ['This person no longer exists'] },
      });
      expect(items.add).not.toHaveBeenCalled();
    });

    it('EP: rejects a random profileId with 400 at field "profileId" and saves nothing', async () => {
      const { items, handler } = setup();

      await expect(
        handler.execute(new CreateMedicalItemCommand({ ...PARACETAMOL('500mg'), profileId: UNKNOWN_ID }, OWNER_USER_ID))
      ).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'MEDICAL_ITEM_INVALID_INPUT',
        data: { profileId: ['This person no longer exists'] },
      });
      expect(items.add).not.toHaveBeenCalled();
    });

    it('Non-functional History: the created item carries the Owner userId as createdById', async () => {
      const { items, handler } = setup();

      const id = await handler.execute(new CreateMedicalItemCommand(PARACETAMOL('500mg'), OWNER_USER_ID));

      expect(items.rows.get(id)?.createdById).toBe(OWNER_USER_ID);
    });
  });

  describe('UpdateMedicalItemHandler', () => {
    it('R10.5: saves two updates in a row, and the later dose "2 viên" wins', async () => {
      const items = itemRepo([airX()]);
      const handler = new UpdateMedicalItemHandler(items, profileRepo([person(ME_ID, 'Mẹ')]));

      await handler.execute(new UpdateMedicalItemCommand(AIR_X_ID, { dose: '1 viên' }, OWNER_USER_ID));
      await handler.execute(new UpdateMedicalItemCommand(AIR_X_ID, { dose: '2 viên' }, OWNER_USER_ID));

      expect(items.update).toHaveBeenCalledTimes(2);
      expect(items.rows.get(AIR_X_ID)?.dose).toBe('2 viên');
    });

    it('Q-48: a PATCH with dose "1 miếng" on the stored supply "Băng gạc" gives 400 at field "dose" and saves nothing', async () => {
      // The PATCH schema cannot know the stored kind, so the handler checks it.
      const bandage = airX({ kind: 'SUPPLY', name: 'Băng gạc', activeIngredients: [], strength: null });
      const items = itemRepo([bandage]);
      const handler = new UpdateMedicalItemHandler(items, profileRepo([person(ME_ID, 'Mẹ')]));

      const error = await handler
        .execute(new UpdateMedicalItemCommand(AIR_X_ID, { dose: '1 miếng' }, OWNER_USER_ID))
        .catch((e: unknown) => e);

      expect(error).toMatchObject({ statusCode: 400, errorCode: 'MEDICAL_ITEM_INVALID_INPUT' });
      expect(Object.keys((error as { data?: object }).data ?? {})).toEqual(['dose']);
      expect(items.update).not.toHaveBeenCalled();
    });

    it.each([
      ['R13.10: the item was deleted together with its person "Mẹ"', true],
      ['ST-3 row 6: only the item was deleted', false],
    ])('%s: returns 404 MEDICAL_ITEM_NOT_FOUND and saves nothing', async (_label, personDeleted) => {
      const deletedMark = { deletedAt: EARLIER, deletedById: OWNER_USER_ID };
      const items = itemRepo([airX(deletedMark)]);
      const profiles = profileRepo([person(ME_ID, 'Mẹ', personDeleted ? deletedMark : {})]);
      const handler = new UpdateMedicalItemHandler(items, profiles);

      await expect(
        handler.execute(new UpdateMedicalItemCommand(AIR_X_ID, { dose: '2 viên' }, OWNER_USER_ID))
      ).rejects.toMatchObject({ statusCode: 404, errorCode: 'MEDICAL_ITEM_NOT_FOUND' });
      expect(items.update).not.toHaveBeenCalled();
    });
  });

  describe('DeleteMedicalItemHandler', () => {
    it('R7.1: soft deletes "Air-X": deletedAt is set and deletedById is the Owner', async () => {
      const items = itemRepo([airX()]);

      await new DeleteMedicalItemHandler(items).execute(new DeleteMedicalItemCommand(AIR_X_ID, OWNER_USER_ID));

      const removed = items.remove.mock.calls[0][1];
      expect(removed.deletedAt).toBeInstanceOf(Date);
      expect(removed.deletedById).toBe(OWNER_USER_ID);
    });

    it('R13.9: returns 404 MEDICAL_ITEM_NOT_FOUND when "Air-X" was already deleted on another device', async () => {
      const items = itemRepo([airX({ deletedAt: EARLIER, deletedById: OWNER_USER_ID })]);

      await expect(
        new DeleteMedicalItemHandler(items).execute(new DeleteMedicalItemCommand(AIR_X_ID, OWNER_USER_ID))
      ).rejects.toMatchObject({ statusCode: 404, errorCode: 'MEDICAL_ITEM_NOT_FOUND' });
      expect(items.remove).not.toHaveBeenCalled();
    });
  });

  describe('CreateHealthProfileHandler', () => {
    const create = (people: HealthProfile[], name: string) => {
      const profiles = profileRepo(people);
      const run = new CreateHealthProfileHandler(profiles).execute(
        new CreateHealthProfileCommand({ name }, OWNER_USER_ID)
      );
      return { profiles, run };
    };

    it('R11.1: saves "Bố" next to "Owner" and "Mẹ"', async () => {
      const { profiles, run } = create([person(OWNER_PROFILE_ID, 'Owner'), person(ME_ID, 'Mẹ')], 'Bố');

      const id = await run;

      expect(profiles.rows.get(id)?.name).toBe('Bố');
    });

    it('R11.2: rejects "mẹ" with 409 HEALTH_PROFILE_NAME_TAKEN when "Mẹ" exists, and saves nothing', async () => {
      const { profiles, run } = create([person(ME_ID, 'Mẹ')], 'mẹ');

      await expect(run).rejects.toMatchObject({ statusCode: 409, errorCode: 'HEALTH_PROFILE_NAME_TAKEN' });
      expect(profiles.add).not.toHaveBeenCalled();
    });

    it('P9: saves "Mẹ" again after the earlier "Mẹ" was deleted', async () => {
      const { profiles, run } = create([person(ME_ID, 'Mẹ', { deletedAt: EARLIER, deletedById: OWNER_USER_ID })], 'Mẹ');

      await run;

      expect(profiles.add).toHaveBeenCalledTimes(1);
    });
  });

  describe('RenameHealthProfileHandler', () => {
    const rename = (people: HealthProfile[], id: string, name: string) => {
      const profiles = profileRepo(people);
      const run = new RenameHealthProfileHandler(profiles).execute(
        new RenameHealthProfileCommand(id, { name }, OWNER_USER_ID)
      );
      return { profiles, run };
    };

    it('R11.5: renames "Mẹ" to "mẹ" (the same person, only the letter case differs)', async () => {
      const { profiles, run } = rename([person(ME_ID, 'Mẹ')], ME_ID, 'mẹ');

      await run;

      expect(profiles.rows.get(ME_ID)?.name).toBe('mẹ');
    });

    it('R11.6: rejects renaming "Bố" to "mẹ" with 409 HEALTH_PROFILE_NAME_TAKEN, and saves nothing', async () => {
      const { profiles, run } = rename([person(ME_ID, 'Mẹ'), person(BO_ID, 'Bố')], BO_ID, 'mẹ');

      await expect(run).rejects.toMatchObject({ statusCode: 409, errorCode: 'HEALTH_PROFILE_NAME_TAKEN' });
      expect(profiles.update).not.toHaveBeenCalled();
    });

    it('R13.12: returns 404 HEALTH_PROFILE_NOT_FOUND when "Bố" was deleted in another tab', async () => {
      const { profiles, run } = rename(
        [person(BO_ID, 'Bố', { deletedAt: EARLIER, deletedById: OWNER_USER_ID })],
        BO_ID,
        'Ba'
      );

      await expect(run).rejects.toMatchObject({ statusCode: 404, errorCode: 'HEALTH_PROFILE_NOT_FOUND' });
      expect(profiles.update).not.toHaveBeenCalled();
    });
  });

  describe('DeleteHealthProfileHandler', () => {
    it('R7.4: soft deletes "Mẹ" together with her items through one repository call', async () => {
      const profiles = profileRepo([person(ME_ID, 'Mẹ')]);

      await new DeleteHealthProfileHandler(profiles).execute(new DeleteHealthProfileCommand(ME_ID, OWNER_USER_ID));

      expect(profiles.removeWithItems).toHaveBeenCalledTimes(1);
      const [id, deleted] = profiles.removeWithItems.mock.calls[0];
      expect(id).toBe(ME_ID);
      expect(deleted.deletedAt).toBeInstanceOf(Date);
      expect(deleted.deletedById).toBe(OWNER_USER_ID);
    });

    it('R13.11: returns 404 HEALTH_PROFILE_NOT_FOUND when "Bố" was already deleted in another tab', async () => {
      const profiles = profileRepo([person(BO_ID, 'Bố', { deletedAt: EARLIER, deletedById: OWNER_USER_ID })]);

      await expect(
        new DeleteHealthProfileHandler(profiles).execute(new DeleteHealthProfileCommand(BO_ID, OWNER_USER_ID))
      ).rejects.toMatchObject({ statusCode: 404, errorCode: 'HEALTH_PROFILE_NOT_FOUND' });
      expect(profiles.removeWithItems).not.toHaveBeenCalled();
    });
  });
});
