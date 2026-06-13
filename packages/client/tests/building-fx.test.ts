import { describe, it, expect } from 'vitest';
import { BUILDING_FX, collectActiveBuildings, FX_ACTIVE_RADIUS } from '../src/game/building-fx';
import { FANTASY } from '../src/theme/fantasy';

describe('BUILDING_FX', () => {
  it('ma styl dla każdego budynku obu motywów', () => {
    for (const b of FANTASY.buildings) expect(BUILDING_FX[b.id]).toBeDefined();
  });
});

describe('collectActiveBuildings', () => {
  it('liczy tylko pracujące i blisko drzwi', () => {
    const active = collectActiveBuildings([
      { buildingId: 'forge', distToDoor: 1, working: true }, // ✓
      { buildingId: 'mine', distToDoor: 10, working: true }, // za daleko
      { buildingId: 'tower', distToDoor: 0.5, working: false }, // nie pracuje
    ]);
    expect([...active]).toEqual(['forge']);
  });

  it('deduplikuje wielu pracowników tego samego budynku', () => {
    const active = collectActiveBuildings([
      { buildingId: 'forge', distToDoor: 1, working: true },
      { buildingId: 'forge', distToDoor: 2, working: true },
    ]);
    expect(active.size).toBe(1);
  });

  it('respektuje promień graniczny', () => {
    expect(collectActiveBuildings([{ buildingId: 'forge', distToDoor: FX_ACTIVE_RADIUS, working: true }]).size).toBe(1);
    expect(collectActiveBuildings([{ buildingId: 'forge', distToDoor: FX_ACTIVE_RADIUS + 0.1, working: true }]).size).toBe(0);
  });

  it('pusty wkład → pusty zbiór', () => {
    expect(collectActiveBuildings([]).size).toBe(0);
  });
});
