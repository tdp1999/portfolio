import 'dotenv/config';

import { Test } from '@nestjs/testing';

import { HealthProfileErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { PrismaModule, PrismaService } from '../../../../shared/prisma';
import { HealthProfile } from '../../domain/entities/health-profile.entity';
import { MedicalItem } from '../../domain/entities/medical-item.entity';
import { ICreateMedicalItemPayload } from '../../domain/medicine-cabinet.types';
import { HealthProfileRepository } from './health-profile.repository';
import { MedicalItemRepository } from './medical-item.repository';

// Expected values come from R7.1, R7.4, R10.1, R10.2, R10.4, R11.2 and 'P9 Trùng tên' of the medicine
// cabinet epic. Every row this file writes belongs to one throwaway user, removed in afterAll.
// The dev database may hold other medicine data, so person names carry a run token (the unique index on
// lower(name) is global) and every read is narrowed to the people this test created.

describe('Medicine cabinet repositories (integration)', () => {
  let prisma: PrismaService;
  let items: MedicalItemRepository;
  let profiles: HealthProfileRepository;
  const userId = IdentifierValue.v7();
  const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
  const RUN = userId.slice(-8);
  /** A person name made unique for this run: "Mẹ" becomes "Mẹ <run>". */
  const named = (name: string) => `${name} ${RUN}`;
  let createdProfiles = new Set<string>();
  const mine = (profileId: string) => createdProfiles.has(profileId);

  const medicine = (profileId: string, name: string, extra: Partial<ICreateMedicalItemPayload> = {}) =>
    MedicalItem.create(
      {
        profileId,
        kind: 'MEDICINE',
        name,
        activeIngredients: [],
        strength: '10mg',
        dose: null,
        timing: null,
        usageType: null,
        purpose: null,
        note: null,
        packForTravel: false,
        ...extra,
      },
      userId
    );

  const addPerson = async (name: string) => {
    const profile = HealthProfile.create({ name: named(name) }, userId);
    await profiles.add(profile);
    createdProfiles.add(profile.id);
    return profile;
  };

  const addItem = async (profileId: string, name: string) => {
    const item = medicine(profileId, name);
    await items.add(item);
    await tick();
    return item;
  };

  const deletedAtOf = async (table: 'medical_items' | 'health_profiles', id: string) => {
    const rows = await prisma.$queryRawUnsafe<{ deletedAt: Date | null }[]>(
      `SELECT "deletedAt" FROM ${table} WHERE id = $1::uuid`,
      id
    );
    return rows[0]?.deletedAt ?? null;
  };

  const listNames = async (profileId?: string) =>
    (await items.findAll({ page: 1, limit: 100, profileId })).data.filter((i) => mine(i.profileId)).map((i) => i.name);

  const countsOfMine = async () =>
    (await profiles.findAllWithItemCount())
      .filter(({ profile }) => mine(profile.id))
      .map(({ profile, itemCount }) => [profile.name, itemCount] as const);

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [MedicalItemRepository, HealthProfileRepository],
    }).compile();
    prisma = mod.get(PrismaService);
    items = mod.get(MedicalItemRepository);
    profiles = mod.get(HealthProfileRepository);
    await prisma.user.create({
      data: { id: userId, email: `medicine-cabinet-${userId}@integration.test`, name: 'Owner', role: 'ADMIN' },
    });
  });

  afterEach(async () => {
    createdProfiles = new Set<string>();
    await prisma.$executeRawUnsafe(`DELETE FROM medical_items WHERE "createdById" = $1::uuid`, userId);
    await prisma.$executeRawUnsafe(`DELETE FROM health_profiles WHERE "createdById" = $1::uuid`, userId);
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('MedicalItemRepository', () => {
    it('R10.1: lists the item saved last at the top', async () => {
      const owner = await addPerson('Owner');
      await addItem(owner.id, 'Air-X');
      await addItem(owner.id, 'Panadol Extra');
      await addItem(owner.id, 'Atorvastatin');

      expect(await listNames()).toEqual(['Atorvastatin', 'Panadol Extra', 'Air-X']);
    });

    it('R10.4: moves "Atorvastatin" from the bottom to the top after its dose is edited', async () => {
      const owner = await addPerson('Owner');
      const atorvastatin = await addItem(owner.id, 'Atorvastatin');
      await addItem(owner.id, 'Air-X');
      await addItem(owner.id, 'Panadol Extra');

      await items.update(atorvastatin.id, atorvastatin.update({ dose: '1 viên x 1 lần/ngày' }, userId));

      expect((await listNames())[0]).toBe('Atorvastatin');
    });

    it('R10.2: the profileId filter returns only the 3 items of "Mẹ", not the 5 of "Owner"', async () => {
      const owner = await addPerson('Owner');
      const me = await addPerson('Mẹ');
      for (const name of ['A1', 'A2', 'A3', 'A4', 'A5']) await addItem(owner.id, name);
      for (const name of ['M1', 'M2', 'M3']) await addItem(me.id, name);

      expect((await listNames(me.id)).sort()).toEqual(['M1', 'M2', 'M3']);
    });

    it('R7.1: after "Air-X" is deleted, list and lookup skip it and the row keeps its deletedAt', async () => {
      const owner = await addPerson('Owner');
      const airX = await addItem(owner.id, 'Air-X');

      await items.remove(airX.id, airX.softDelete(userId));

      expect(await listNames()).toEqual([]);
      expect((await items.findLookup()).filter((row) => mine(row.item.profileId))).toEqual([]);
      expect(await items.findById(airX.id)).toBeNull();
      expect(await deletedAtOf('medical_items', airX.id)).toBeInstanceOf(Date);
    });
  });

  describe('HealthProfileRepository', () => {
    it('R7.4: deleting "Mẹ" soft deletes her and her 3 items in one call, and itemCount skips deleted items', async () => {
      const owner = await addPerson('Owner');
      const me = await addPerson('Mẹ');
      const meItems = [await addItem(me.id, 'M1'), await addItem(me.id, 'M2'), await addItem(me.id, 'M3')];
      const ownerItem = await addItem(owner.id, 'Air-X');
      await items.remove(ownerItem.id, ownerItem.softDelete(userId));
      await addItem(owner.id, 'Atorvastatin');

      expect((await countsOfMine()).slice().sort()).toEqual([
        [named('Mẹ'), 3],
        [named('Owner'), 1],
      ]);

      await profiles.removeWithItems(me.id, me.softDelete(userId));

      expect(await deletedAtOf('health_profiles', me.id)).toBeInstanceOf(Date);
      for (const item of meItems) expect(await deletedAtOf('medical_items', item.id)).toBeInstanceOf(Date);
      expect((await countsOfMine()).map(([name]) => name)).toEqual([named('Owner')]);
    });

    it('R11.2: the unique index refuses "mẹ" while "Mẹ" exists', async () => {
      await addPerson('Mẹ');

      await expect(profiles.add(HealthProfile.create({ name: named('mẹ') }, userId))).rejects.toThrow();
      // The refusal comes from the name, not from a broken insert: another name still saves.
      await expect(addPerson('Bố')).resolves.toBeDefined();
    });

    it('R11.2: two adds of "Bố" at the same time save one and refuse the other with NAME_TAKEN (409)', async () => {
      const both = [
        HealthProfile.create({ name: named('Bố') }, userId),
        HealthProfile.create({ name: named('bố') }, userId),
      ];
      both.forEach((p) => createdProfiles.add(p.id));

      const results = await Promise.allSettled(both.map((p) => profiles.add(p)));

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const [refused] = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      expect(refused.reason).toMatchObject({ statusCode: 409, errorCode: HealthProfileErrorCode.NAME_TAKEN });
    });

    it('R11.2: findByName finds "Mẹ" when asked for "mẹ"', async () => {
      const me = await addPerson('Mẹ');

      expect((await profiles.findByName(named('mẹ')))?.id).toBe(me.id);
    });

    it('P9: saves "Mẹ" again after the earlier "Mẹ" was deleted', async () => {
      const me = await addPerson('Mẹ');
      await profiles.removeWithItems(me.id, me.softDelete(userId));

      expect(await profiles.findByName(named('Mẹ'))).toBeNull();
      const again = await addPerson('Mẹ');
      expect((await profiles.findById(again.id))?.name).toBe(named('Mẹ'));
    });
  });
});
