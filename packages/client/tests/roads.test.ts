import { describe, it, expect } from 'vitest';
import { roadCurve, themeRoadCurves, pointOnRoad } from '../src/game/roads';
import { FANTASY } from '../src/theme/fantasy';
import { SCIFI } from '../src/theme/scifi';

describe('roadCurve', () => {
  it('przechodzi dokładnie przez oba węzły (ciągłość na skrzyżowaniach)', () => {
    const c = roadCurve(2, 3, 10, 7, 1);
    expect(c[0].gx).toBeCloseTo(2);
    expect(c[0].gy).toBeCloseTo(3);
    expect(c[c.length - 1].gx).toBeCloseTo(10);
    expect(c[c.length - 1].gy).toBeCloseTo(7);
  });

  it('deterministyczny (ten sam świat między wywołaniami)', () => {
    expect(roadCurve(2, 3, 10, 7, 5)).toEqual(roadCurve(2, 3, 10, 7, 5));
  });

  it('środek odchyla się od linii prostej (łuk, nie odcinek)', () => {
    const c = roadCurve(0, 0, 12, 0, 3);
    const mid = c[Math.floor(c.length / 2)];
    // prosta dałaby gy≈0 na środku; łuk musi się wygiąć w bok
    expect(Math.abs(mid.gy)).toBeGreaterThan(0.3);
  });

  it('szerokość dodatnia i większa przy węzłach niż w środku', () => {
    const c = roadCurve(0, 0, 14, 0, 2);
    const end = c[0].hw;
    const mid = c[Math.floor(c.length / 2)].hw;
    expect(mid).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(mid);
  });
});

describe('themeRoadCurves', () => {
  it('jedna krzywa na krawędź grafu (oba motywy)', () => {
    expect(themeRoadCurves(FANTASY)).toHaveLength(FANTASY.edges.length);
    expect(themeRoadCurves(SCIFI)).toHaveLength(SCIFI.edges.length);
  });
});

describe('pointOnRoad', () => {
  const curves = themeRoadCurves(FANTASY);
  it('punkt na osi drogi jest "na drodze"', () => {
    const p = curves[0][Math.floor(curves[0].length / 2)];
    expect(pointOnRoad(curves, p.gx, p.gy)).toBe(true);
  });
  it('odległy punkt nie jest na drodze', () => {
    expect(pointOnRoad(curves, -50, -50)).toBe(false);
  });
});
