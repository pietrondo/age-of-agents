import type { ThemeDef } from '../theme/types';

/**
 * Geometria dróg — JEDNO źródło prawdy dla renderu (placeholders.drawRoads)
 * i dla rasteryzacji pasa ziemi (terrain-map: dirt wzdłuż dróg). Dzięki temu
 * narysowana droga i tekstura ziemi pod nią pokrywają się (maska dirt to kapsuła
 * wokół osi, więc na ostrych zakrętach/końcach możliwa różnica 1–2 kafli).
 *
 * Droga to deterministyczny łuk (quadratic Bézier) między dwoma węzłami grafu,
 * z haszowanym wygięciem i falującą szerokością — bez Math.random, więc świat
 * jest identyczny między sesjami.
 */

/** Punkt na osi drogi w przestrzeni siatki + lokalna pół-szerokość (kafle). */
export interface RoadPoint {
  gx: number;
  gy: number;
  hw: number;
}

const BASE_HW = 0.5; // bazowa pół-szerokość drogi (kafle)
const JUNCTION_BONUS = 0.5; // o ile szersza przy węzłach (placach/skrzyżowaniach)
const WOBBLE_HW = 0.12; // amplituda organicznego falowania szerokości
const MAX_BOW = 1.5; // maks. wygięcie łuku na środku (kafle)

function hash01(a: number, b: number, seed: number): number {
  let h = (a * 374761393 + b * 668265263 + seed * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const signed = (a: number, b: number, seed: number) => hash01(a, b, seed) * 2 - 1;

function resolveNode(theme: ThemeDef, id: string): { gx: number; gy: number } | undefined {
  if (id.startsWith('door:')) return theme.buildings.find((b) => `door:${b.id}` === id)?.door;
  return theme.crossroads.find((c) => c.id === id);
}

/**
 * Deterministyczny łuk między dwoma węzłami + profil szerokości.
 * Bézier PRZECHODZI przez końce (t=0, t=1), więc drogi spotykają się dokładnie
 * w węzłach — ciągłość na skrzyżowaniach zachowana mimo wygięcia.
 */
export function roadCurve(ax: number, ay: number, bx: number, by: number, seed: number): RoadPoint[] {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len; // jednostkowa normalna do odcinka
  const ny = dx / len;
  // wygięcie proporcjonalne do długości, ze stałym (haszowanym) znakiem i amplitudą
  const bow = signed(Math.round(ax * 8 + bx), Math.round(ay * 8 + by), seed * 131 + 7) * Math.min(MAX_BOW, len * 0.16);
  const cx = (ax + bx) / 2 + nx * bow; // punkt kontrolny Béziera
  const cy = (ay + by) / 2 + ny * bow;
  const wobFreq = 2 + Math.floor(hash01(seed, Math.round(len), 53) * 3); // 2..4 fale szerokości
  const wobPhase = hash01(seed, 99, 17) * Math.PI * 2;
  const steps = Math.max(8, Math.round(len * 2));
  const pts: RoadPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * ax + 2 * mt * t * cx + t * t * bx;
    const y = mt * mt * ay + 2 * mt * t * cy + t * t * by;
    const junction = Math.abs(Math.cos(Math.PI * t)); // 1 przy węzłach, 0 w środku
    const wobble = WOBBLE_HW * Math.sin(t * Math.PI * wobFreq + wobPhase);
    pts.push({ gx: x, gy: y, hw: BASE_HW + JUNCTION_BONUS * junction + wobble });
  }
  return pts;
}

/** Krzywe wszystkich dróg motywu — jedna polilinia na krawędź grafu (theme.edges). */
export function themeRoadCurves(theme: ThemeDef): RoadPoint[][] {
  const out: RoadPoint[][] = [];
  theme.edges.forEach(([aId, bId], i) => {
    const a = resolveNode(theme, aId);
    const b = resolveNode(theme, bId);
    if (a && b) out.push(roadCurve(a.gx, a.gy, b.gx, b.gy, i + 1));
  });
  return out;
}

/** Czy punkt (px,py) w przestrzeni siatki leży na którejś z dróg (wewnątrz pasa). */
export function pointOnRoad(curves: RoadPoint[][], px: number, py: number): boolean {
  for (const c of curves) {
    for (let i = 0; i < c.length - 1; i++) {
      const a = c[i];
      const b = c[i + 1];
      const sx = b.gx - a.gx;
      const sy = b.gy - a.gy;
      const len2 = sx * sx + sy * sy || 1;
      let t = ((px - a.gx) * sx + (py - a.gy) * sy) / len2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = a.gx + t * sx;
      const cy = a.gy + t * sy;
      const hw = a.hw + (b.hw - a.hw) * t;
      if (Math.hypot(px - cx, py - cy) < hw) return true;
    }
  }
  return false;
}
