import { medicalItemDisplay } from './medical-item-display.util';

// AC-1 · 'DT-1 Tên hiển thị'. Expected values come from examples R1.1–R1.4 of the medicine cabinet epic.
describe('medicalItemDisplay', () => {
  it('R1.1: a medicine with exactly one active ingredient shows the ingredient, with the product name below', () => {
    expect(medicalItemDisplay({ kind: 'MEDICINE', name: 'Air-X', activeIngredients: ['Simethicone'] })).toEqual({
      primary: 'Simethicone',
      secondary: 'Air-X',
      isSupply: false,
    });
  });

  it('R1.2: a medicine with two active ingredients shows the product name, with the ingredients joined by " + "', () => {
    expect(
      medicalItemDisplay({ kind: 'MEDICINE', name: 'Panadol Extra', activeIngredients: ['Paracetamol', 'Caffeine'] })
    ).toEqual({ primary: 'Panadol Extra', secondary: 'Paracetamol + Caffeine', isSupply: false });
  });

  it('R1.3: a medicine without active ingredients shows the product name and no sub-line', () => {
    expect(medicalItemDisplay({ kind: 'MEDICINE', name: 'Men tiêu hóa X', activeIngredients: [] })).toEqual({
      primary: 'Men tiêu hóa X',
      secondary: null,
      isSupply: false,
    });
  });

  it('R1.4: a supply shows its name, the supply flag and no sub-line', () => {
    expect(medicalItemDisplay({ kind: 'SUPPLY', name: 'Nhiệt kế điện tử', activeIngredients: [] })).toEqual({
      primary: 'Nhiệt kế điện tử',
      secondary: null,
      isSupply: true,
    });
  });
});
