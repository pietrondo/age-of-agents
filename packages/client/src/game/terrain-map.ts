import type { ThemeDef } from '../theme/types';
import { themeRoadCurves, pointOnRoad } from './roads';

export type TerrainId = 'grass' | 'dirt' | 'water' | 'rock';
export const TERRAINS: readonly TerrainId[] = ['grass', 'dirt', 'water', 'rock'];

/** Deterministyczny hash węzła kraty → [0,1). Bez Math.random. */
function hash01(ix: number, iy: number, seed: number): number {
  let h = (ix * 374761393 + iy * 668265263 + seed * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Gładki value-noise w punkcie (x,y) przy danej częstotliwości. */
function valueNoise(x: number, y: number, freq: number, seed: number): number {
  const fx = x * freq;
  const fy = y * freq;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = smooth(fx - x0);
  const ty = smooth(fy - y0);
  const top = lerp(hash01(x0, y0, seed), hash01(x0 + 1, y0, seed), tx);
  const bot = lerp(hash01(x0, y0 + 1, seed), hash01(x0 + 1, y0 + 1, seed), tx);
  return lerp(top, bot, ty);
}

/** Dwie oktawy → organiczne plamy z nieregularnym brzegiem. */
function fbm(x: number, y: number, seed: number): number {
  return valueNoise(x, y, 0.16, seed) * 0.65 + valueNoise(x, y, 0.34, seed + 9973) * 0.35;
}

const WATER_BELOW = 0.25; // niskie zagłębienia szumu → stawy
const ROCK_ABOVE = 0.78; // wysokie grzbiety → połacie skał

/**
 * Proceduralna, estetyczna mapa biomów (deterministyczna).
 * grass = baza; water = spójne stawy (value-noise); rock = połacie z buforem
 * trawy od wody (brak styków woda-skała → czysty autotiling Wang); dirt =
 * ścieżki wzdłuż dróg (theme.edges), tylko na trawie.
 */
export function buildTerrainMap(theme: ThemeDef): TerrainId[][] {
  const { w, h } = theme.grid;
  const map: TerrainId[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => 'grass' as TerrainId));

  const isWater = (gx: number, gy: number) => fbm(gx, gy, 1) < WATER_BELOW;

  // 1. woda + skała (skała z buforem 1 komórki od wody)
  for (let gy = 0; gy < h; gy++) {
    for (let gx = 0; gx < w; gx++) {
      if (isWater(gx, gy)) { map[gy][gx] = 'water'; continue; }
      if (fbm(gx, gy, 7) > ROCK_ABOVE) {
        const nearWater =
          isWater(gx - 1, gy) || isWater(gx + 1, gy) || isWater(gx, gy - 1) || isWater(gx, gy + 1);
        if (!nearWater) map[gy][gx] = 'rock';
      }
    }
  }

  // 2. ścieżki ziemne wzdłuż dróg — tylko na trawie (nie zatapiają wody/skał).
  // Te same krzywe (roads.ts) co render w drawRoads → pas ziemi pokrywa się z drogą.
  const curves = themeRoadCurves(theme);
  for (let gy = 0; gy < h; gy++) {
    for (let gx = 0; gx < w; gx++) {
      if (map[gy][gx] !== 'grass') continue;
      if (pointOnRoad(curves, gx + 0.5, gy + 0.5)) map[gy][gx] = 'dirt';
    }
  }

  return map;
}

/** Iso-sąsiad o innym biomie (jedna z 4 krawędzi diamentu) — do feather/AO w izo-terenie. */
export interface BiomeEdge {
  dgx: number;
  dgy: number;
  biome: TerrainId;
}

const ISO_NEIGHBORS: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Krawędzie komórki (gx,gy) stykające się z INNYM biomem. W izometrii 4 boki
 * diamentu odpowiadają kardynalnym sąsiadom siatki. Używane do zmiękczania
 * styków biomów (nakładka tekstury sąsiada + przyciemnienie konturu).
 */
export function biomeEdges(map: TerrainId[][], gx: number, gy: number): BiomeEdge[] {
  const h = map.length;
  const w = map[0].length;
  const self = map[gy][gx];
  const out: BiomeEdge[] = [];
  for (const [dgx, dgy] of ISO_NEIGHBORS) {
    const nx = gx + dgx;
    const ny = gy + dgy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
    const nb = map[ny][nx];
    if (nb !== self) out.push({ dgx, dgy, biome: nb });
  }
  return out;
}
