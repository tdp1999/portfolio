import { formatZodError } from '@portfolio/shared/errors';
import { CreateMedicalItemSchema, UpdateMedicalItemSchema } from './medical-item.dto';

// Expected values come from the examples of the medicine cabinet epic (R2, R3, 'DT-1 Tên hiển thị',
// 'P10 Trim', and the EP + BVA tables). "400 at field X" means the formatted Zod error has exactly the
// key X, because `ServerErrorDirective` puts the message under the input with that name.

const PROFILE_ID = '01a10b5b-9d90-753e-a6a3-0000000000a1';
const MEDICINE = { profileId: PROFILE_ID, kind: 'MEDICINE', name: 'Atorvastatin', strength: '10mg' };
const SUPPLY = { profileId: PROFILE_ID, kind: 'SUPPLY', name: 'Nhiệt kế điện tử' };

type ParseResult = ReturnType<typeof CreateMedicalItemSchema.safeParse>;

const errorFields = (result: ParseResult): string[] =>
  result.success ? [] : Object.keys(formatZodError(result.error)).sort();

const create = (input: Record<string, unknown>) => CreateMedicalItemSchema.safeParse(input);
const text = (length: number) => 'a'.repeat(length);

describe('CreateMedicalItemSchema', () => {
  describe('R2 Field theo loại', () => {
    it('DT-1 row 5: rejects a supply with active ingredients at field "activeIngredients"', () => {
      expect(errorFields(create({ ...SUPPLY, activeIngredients: ['Simethicone'] }))).toEqual(['activeIngredients']);
    });

    it('R2.2: rejects the supply "Băng gạc" sent with dose "1 miếng" at field "dose"', () => {
      expect(errorFields(create({ ...SUPPLY, name: 'Băng gạc', dose: '1 miếng' }))).toEqual(['dose']);
    });
  });

  describe('R3 Field bắt buộc', () => {
    it('R3.1: accepts the medicine "Atorvastatin" 10mg of a person', () => {
      expect(create(MEDICINE)).toMatchObject({
        success: true,
        data: { profileId: PROFILE_ID, kind: 'MEDICINE', name: 'Atorvastatin', strength: '10mg' },
      });
    });

    it.each([
      ['an empty name', ''],
      ['a name of only spaces (P10)', '   '],
    ])('R3.2: rejects %s at field "name"', (_label, name) => {
      expect(errorFields(create({ ...MEDICINE, name }))).toEqual(['name']);
    });

    it('R3.3: rejects the medicine "Atorvastatin" without strength at field "strength"', () => {
      const { strength: _strength, ...withoutStrength } = MEDICINE;
      expect(errorFields(create(withoutStrength))).toEqual(['strength']);
    });

    it('R3.4: accepts the supply "Nhiệt kế điện tử" without strength', () => {
      expect(create(SUPPLY)).toMatchObject({ success: true, data: { kind: 'SUPPLY', name: 'Nhiệt kế điện tử' } });
    });

    it('R3.6: keeps the note "Không hợp: nổi mẩn sau 2 ngày" of "Kem Z" word for word', () => {
      const note = 'Không hợp: nổi mẩn sau 2 ngày';
      expect(create({ ...MEDICINE, name: 'Kem Z', strength: '1%', note })).toMatchObject({
        success: true,
        data: { note },
      });
    });

    it('R3.8: keeps the note "Đã dùng, chưa rõ kết quả" of "Siro ho Y" word for word', () => {
      const note = 'Đã dùng, chưa rõ kết quả';
      expect(create({ ...MEDICINE, name: 'Siro ho Y', strength: '100ml', note })).toMatchObject({
        success: true,
        data: { note },
      });
    });
  });

  describe('P10 Trim', () => {
    it('drops an active ingredient of only spaces: ["Simethicone", "  "] becomes ["Simethicone"]', () => {
      expect(create({ ...MEDICINE, activeIngredients: ['Simethicone', '  '] })).toMatchObject({
        success: true,
        data: { activeIngredients: ['Simethicone'] },
      });
    });
  });

  describe('BVA: boundaries of the data dictionary', () => {
    it.each([1, 200])('name: accepts %i characters', (length) => {
      expect(create({ ...MEDICINE, name: text(length) }).success).toBe(true);
    });

    it.each([0, 201])('name: rejects %i characters at field "name"', (length) => {
      expect(errorFields(create({ ...MEDICINE, name: text(length) }))).toEqual(['name']);
    });

    it('each active ingredient: 0 characters is dropped without an error', () => {
      expect(create({ ...MEDICINE, activeIngredients: [''] })).toMatchObject({
        success: true,
        data: { activeIngredients: [] },
      });
    });

    it.each([1, 100])('each active ingredient: accepts %i characters', (length) => {
      expect(create({ ...MEDICINE, activeIngredients: [text(length)] }).success).toBe(true);
    });

    it('each active ingredient: rejects 101 characters at that ingredient', () => {
      expect(errorFields(create({ ...MEDICINE, activeIngredients: [text(101)] }))).toEqual(['activeIngredients.0']);
    });

    it('number of active ingredients: accepts 10', () => {
      const ingredients = Array.from({ length: 10 }, (_, i) => `Hoạt chất ${i + 1}`);
      expect(create({ ...MEDICINE, activeIngredients: ingredients }).success).toBe(true);
    });

    it('number of active ingredients: rejects 11 at field "activeIngredients"', () => {
      const ingredients = Array.from({ length: 11 }, (_, i) => `Hoạt chất ${i + 1}`);
      expect(errorFields(create({ ...MEDICINE, activeIngredients: ingredients }))).toEqual(['activeIngredients']);
    });

    it.each([0, 1, 500])('purpose: accepts %i characters', (length) => {
      expect(create({ ...MEDICINE, purpose: text(length) }).success).toBe(true);
    });

    it('purpose: rejects 501 characters at field "purpose"', () => {
      expect(errorFields(create({ ...MEDICINE, purpose: text(501) }))).toEqual(['purpose']);
    });

    it.each([0, 1, 2000])('note: accepts %i characters', (length) => {
      expect(create({ ...MEDICINE, note: text(length) }).success).toBe(true);
    });

    it('note: rejects 2001 characters at field "note"', () => {
      expect(errorFields(create({ ...MEDICINE, note: text(2001) }))).toEqual(['note']);
    });

    it.each([1, 50])('strength: accepts %i characters', (length) => {
      expect(create({ ...MEDICINE, strength: text(length) }).success).toBe(true);
    });

    it.each([0, 51])('strength: rejects %i characters at field "strength"', (length) => {
      expect(errorFields(create({ ...MEDICINE, strength: text(length) }))).toEqual(['strength']);
    });

    it.each([0, 1, 100])('dose: accepts %i characters', (length) => {
      expect(create({ ...MEDICINE, dose: text(length) }).success).toBe(true);
    });

    it('dose: rejects 101 characters at field "dose"', () => {
      expect(errorFields(create({ ...MEDICINE, dose: text(101) }))).toEqual(['dose']);
    });
  });

  describe('EP: invalid classes sent straight to the API', () => {
    it.each([
      ['kind', 'FOOD'],
      ['timing', 'MIDNIGHT'],
      ['usageType', 'WEEKLY'],
      ['packForTravel', 'yes'],
    ])('rejects %s = %j at that field', (field, value) => {
      expect(errorFields(create({ ...MEDICINE, [field]: value }))).toEqual([field]);
    });
  });
});

describe('UpdateMedicalItemSchema', () => {
  it('R2.4: rejects a PATCH that sends kind "SUPPLY" at field "kind"', () => {
    const result = UpdateMedicalItemSchema.safeParse({ dose: '2 viên', kind: 'SUPPLY' });
    expect(result.success ? [] : Object.keys(formatZodError(result.error))).toEqual(['kind']);
  });

  it('R10.5: accepts a PATCH of only the dose "2 viên"', () => {
    expect(UpdateMedicalItemSchema.safeParse({ dose: '2 viên' })).toMatchObject({
      success: true,
      data: { dose: '2 viên' },
    });
  });
});
