import { describe, it, expect } from 'vitest';
import { biomeEdges, type TerrainId } from '../src/game/terrain-map';

describe('biomeEdges', () => {
  // 3×3: środek grass, na wschód water, na południe rock
  const map: TerrainId[][] = [
    ['grass', 'grass', 'grass'],
    ['grass', 'grass', 'water'],
    ['grass', 'rock', 'grass'],
  ];

  it('zwraca tylko różniących się kardynalnych sąsiadów', () => {
    const e = biomeEdges(map, 1, 1);
    const biomes = e.map((x) => x.biome).sort();
    expect(biomes).toEqual(['rock', 'water']);
  });

  it('komórka w jednolitym obszarze nie ma krawędzi', () => {
    expect(biomeEdges(map, 0, 0)).toEqual([]);
  });

  it('kierunki wskazują na właściwego sąsiada', () => {
    const e = biomeEdges(map, 1, 1);
    const water = e.find((x) => x.biome === 'water')!;
    expect([water.dgx, water.dgy]).toEqual([1, 0]);
    const rock = e.find((x) => x.biome === 'rock')!;
    expect([rock.dgx, rock.dgy]).toEqual([0, 1]);
  });

  it('nie wychodzi poza granice mapy', () => {
    expect(() => biomeEdges(map, 2, 2)).not.toThrow();
  });
});
