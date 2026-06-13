import { Assets, Container, Sprite, type Texture } from 'pixi.js';
import type { ThemeDef } from '../theme/types';
import { buildTerrainMap, biomeEdges } from './terrain-map';

const tiles = new Map<string, Texture>(); // TerrainId -> tekstura diamentu
let loaded = false;

// Zmiękczanie styków biomów (look — łatwy do strojenia). 0 wyłącza efekt.
const FEATHER_ALPHA = 0.45; // krycie nakładki tekstury sąsiada
const FEATHER_SCALE = 0.7; // rozmiar nakładki względem kafla
const FEATHER_OFFSET = 0.28; // przesunięcie nakładki ku sąsiadowi (ułamek kafla)
const BOUNDARY_SHADE = 0.94; // delikatny kontur — komórka graniczna nieco ciemniejsza

/** Deterministyczny tint jitter (±5%) jak dotychczas — rozbija jednolite pola. */
function jitter01(gx: number, gy: number): number {
  const j = ((gx * 73856093) ^ (gy * 19349663)) >>> 0;
  return 0.95 + (j % 100) / 1000; // 0.95–1.05
}
function grayTint(factor: number): number {
  const v = Math.max(0, Math.min(255, Math.round(255 * factor)));
  return (v << 16) | (v << 8) | v;
}

/** Ładuje kafle izometryczne terenu (jeden diament per TerrainId). Brak → drawTerrain fallback. */
export async function loadIsoTiles(themeId: string): Promise<void> {
  tiles.clear();
  loaded = false;
  try {
    const res = await fetch(`/assets/${themeId}/tilemap-iso/index.json`);
    if (!res.ok) return;
    const idx: { ids: string[] } = await res.json();
    for (const id of idx.ids) {
      try {
        tiles.set(id, await Assets.load<Texture>(`/assets/${themeId}/tilemap-iso/${id}.png`));
      } catch {
        /* pojedynczy brak — pomijamy */
      }
    }
    loaded = tiles.size > 0;
  } catch {
    /* brak indeksu — fallback */
  }
}

export function hasIsoTiles(): boolean {
  return loaded;
}

/**
 * Teren izometryczny: per-cel diament (Sprite), anchor (0.5,0.5) w toScreen(gx,gy).
 * Rysowane w kolejności głębokości (gx+gy), by cienki bok kafla z tyłu nie nachodził
 * na przód. Płaska warstwa tła (niesortowana) — dodawana pod unitLayer w view.ts.
 *
 * Współpraca tekstur (Zadanie 2): na styku dwóch biomów komórka dostaje (a) lekki
 * kontur (przyciemnienie) i (b) "feather" — nakładkę tekstury sąsiada przesuniętą
 * ku wspólnej krawędzi. To proceduralna namiastka kafli przejściowych (np. brzeg
 * wody) bez generowania nowych assetów. Tint jitter (±5%) jak dotąd.
 */
export function buildIsoTilemap(theme: ThemeDef): Container {
  const root = new Container();
  const map = buildTerrainMap(theme);
  const { w, h } = theme.grid;
  const cells: { gx: number; gy: number }[] = [];
  for (let gy = 0; gy < h; gy++) for (let gx = 0; gx < w; gx++) cells.push({ gx, gy });
  cells.sort((a, b) => a.gx + a.gy - (b.gx + b.gy)); // tył → przód

  for (const { gx, gy } of cells) {
    const tex = tiles.get(map[gy][gx]);
    if (!tex) continue;
    const p = theme.projection.toScreen(gx, gy);
    const j = jitter01(gx, gy);
    const edges = biomeEdges(map, gx, gy);

    const s = new Sprite(tex);
    s.anchor.set(0.5, 0.5);
    s.scale.set(theme.tile / tex.width); // diament 32px → szerokość kafla (tileW=64)
    s.position.set(p.x, p.y);
    s.tint = grayTint(j * (edges.length ? BOUNDARY_SHADE : 1));
    root.addChild(s);

    // feather: nakładka tekstury każdego różniącego się sąsiada, biased ku jego krawędzi
    if (FEATHER_ALPHA > 0) {
      for (const e of edges) {
        const ntex = tiles.get(e.biome);
        if (!ntex) continue;
        const np = theme.projection.toScreen(gx + e.dgx, gy + e.dgy);
        const f = new Sprite(ntex);
        f.anchor.set(0.5, 0.5);
        f.scale.set((theme.tile / ntex.width) * FEATHER_SCALE);
        f.position.set(p.x + (np.x - p.x) * FEATHER_OFFSET, p.y + (np.y - p.y) * FEATHER_OFFSET);
        f.alpha = FEATHER_ALPHA;
        f.tint = grayTint(j);
        root.addChild(f);
      }
    }
  }
  return root;
}
