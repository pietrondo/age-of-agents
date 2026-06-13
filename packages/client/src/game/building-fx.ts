import type { BuildingId } from '../theme/types';

/**
 * FX aktywności budynku (Zadanie 3): gdy ≥1 jednostka pracuje PRZY budynku,
 * budynek dostaje poświatę + unoszące się drobinki w stylu zależnym od roli.
 *
 * Maszyneria (emitery, cykl życia) jest w view.ts. TUTAJ żyje to, co subiektywne
 * i warte strojenia: PRÓG aktywności i WYGLĄD FX per budynek. To naturalny punkt
 * wkładu (learning) — wartości niżej są działającym domyślnym, do podkręcenia.
 */
export interface BuildingFxStyle {
  /** Główny kolor drobinek + poświaty. */
  color: number;
  /** Akcent (część drobinek), np. jaśniejsza iskra. */
  spark: number;
  /** Drobinek na sekundę przy pełnej intensywności. */
  rate: number;
  /** Prędkość unoszenia w górę (px/s). */
  rise: number;
  /** Poziomy rozrzut źródła drobinek (px). */
  spread: number;
  /** Bazowe krycie poświaty (0–1). */
  glow: number;
}

/**
 * WKŁAD USERA (learning) — paleta/charakter FX per budynek. BuildingId jest
 * wspólny dla obu motywów, więc kolory dobrane „po roli" (kuźnia=iskry, archiwum=
 * chłodna poświata itd.). Zmień śmiało, by dopasować klimat każdego świata.
 */
export const BUILDING_FX: Record<BuildingId, BuildingFxStyle> = {
  citadel: { color: 0xf0e6c8, spark: 0xffffff, rate: 5, rise: 26, spread: 16, glow: 0.16 },
  tower: { color: 0x9a7fff, spark: 0xd6c7ff, rate: 8, rise: 34, spread: 10, glow: 0.22 },
  forge: { color: 0xffa53a, spark: 0xfff0b0, rate: 12, rise: 40, spread: 10, glow: 0.24 },
  library: { color: 0x6fd0e0, spark: 0xc4f2f8, rate: 6, rise: 24, spread: 12, glow: 0.18 },
  mine: { color: 0xb09878, spark: 0xd8c6a6, rate: 9, rise: 22, spread: 12, glow: 0.16 },
  barracks: { color: 0x5fd08a, spark: 0xb6f0cf, rate: 7, rise: 28, spread: 12, glow: 0.18 },
  market: { color: 0xf0c050, spark: 0xfff0c0, rate: 8, rise: 26, spread: 14, glow: 0.20 },
  guild: { color: 0xd86fae, spark: 0xf6c8e2, rate: 8, rise: 30, spread: 10, glow: 0.20 },
};

/** Jak blisko drzwi (w kaflach) musi być pracująca jednostka, by liczyć się jako „przy budynku". */
export const FX_ACTIVE_RADIUS = 2.4;

export interface WorkerSample {
  buildingId: BuildingId;
  /** Odległość jednostki od drzwi budynku (kafle). */
  distToDoor: number;
  working: boolean;
}

/**
 * Czyste: zbiór budynków aktualnie „pracujących" — mają co najmniej jedną
 * jednostkę w stanie pracy i dostatecznie blisko drzwi. Testowalne bez sceny.
 */
export function collectActiveBuildings(
  workers: Iterable<WorkerSample>,
  radius = FX_ACTIVE_RADIUS,
): Set<BuildingId> {
  const out = new Set<BuildingId>();
  for (const w of workers) if (w.working && w.distToDoor <= radius) out.add(w.buildingId);
  return out;
}
