import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICON_PROVIDER, IconProvider } from '@portfolio/landing/shared/ui';
import type { PublicSkill, SkillTier, SkillTierGroup } from '@portfolio/landing/shared/data-access';
import { HomeStack } from './home.stack';

class MockIconProvider implements IconProvider {
  getSvg(name: string, size: number): string | null {
    return `<svg width="${size}" height="${size}"><path d="M1 1" /></svg>`;
  }
  getSupportedIcons(): string[] {
    return [];
  }
}

function makeSkill(id: string): PublicSkill {
  return {
    id,
    name: id,
    slug: id,
    category: 'TECHNICAL',
    isLibrary: false,
    parentSkillId: null,
    yearsOfExperience: null,
    iconId: null,
    iconUrl: null,
    proficiencyNote: null,
    isFeatured: false,
    displayOrder: 0,
    tier: 'DAILY',
  };
}

function makeGroup(tier: SkillTier, label: string, memberIds: string[]): SkillTierGroup {
  return { tier, label, members: memberIds.map(makeSkill) };
}

describe('HomeStack — beats() interleave', () => {
  let fixture: ComponentFixture<HomeStack>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeStack],
      providers: [{ provide: ICON_PROVIDER, useValue: new MockIconProvider() }],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeStack);
  });

  function setInputs(stackIntro: string, tierGroups: readonly SkillTierGroup[]): void {
    fixture.componentRef.setInput('stackIntro', stackIntro);
    fixture.componentRef.setInput('tierGroups', tierGroups);
    fixture.detectChanges();
  }

  const beatCount = () => fixture.nativeElement.querySelectorAll('.home-stack__beat').length;
  const proseCount = () => fixture.nativeElement.querySelectorAll('.home-stack__paragraph').length;
  const tierCount = () => fixture.nativeElement.querySelectorAll('.home-stack__beat-tier').length;

  it('pairs one paragraph with one tier when counts are equal', () => {
    setInputs('First para.\n\nSecond para.', [
      makeGroup('DAILY', 'Daily drivers', ['Angular']),
      makeGroup('FREQUENT', 'Frequent', ['RxJS']),
    ]);

    expect(beatCount()).toBe(2);
    expect(proseCount()).toBe(2);
    expect(tierCount()).toBe(2);
  });

  it('renders extra paragraphs with no tier when paragraphs outnumber groups', () => {
    setInputs('One.\n\nTwo.\n\nThree.', [makeGroup('DAILY', 'Daily drivers', ['Angular'])]);

    expect(beatCount()).toBe(3);
    expect(proseCount()).toBe(3);
    expect(tierCount()).toBe(1);
  });

  it('renders extra tiers with no paragraph when groups outnumber paragraphs', () => {
    setInputs('Only one paragraph.', [
      makeGroup('DAILY', 'Daily drivers', ['Angular']),
      makeGroup('SHIPPED', 'Shipped with', ['Nx']),
    ]);

    expect(beatCount()).toBe(2);
    expect(proseCount()).toBe(1);
    expect(tierCount()).toBe(2);
  });

  it('drops empty-member tiers before pairing', () => {
    setInputs('First.\n\nSecond.', [
      makeGroup('DAILY', 'Daily drivers', ['Angular']),
      makeGroup('FREQUENT', 'Frequent', []),
    ]);

    // Only one populated group survives → 2 paragraphs, 1 tier.
    expect(beatCount()).toBe(2);
    expect(proseCount()).toBe(2);
    expect(tierCount()).toBe(1);
  });
});
