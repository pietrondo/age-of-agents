import { describe, expect, it } from 'vitest';
import { FANTASY } from '../src/theme/fantasy';
import { SCIFI } from '../src/theme/scifi';

/**
 * Angielski jest językiem bazowym: dane motywu (etykiety budynków) nie mogą
 * zawierać zlokalizowanych napisów. Tłumaczenie idzie wyłącznie przez
 * `buildingText()` w i18n — etykieta w ThemeDef to kanoniczna, angielska nazwa.
 *
 * Strażnik wykrywa polskie litery diakrytyczne. Nie wyłapie polszczyzny bez
 * diakrytyków (np. „Targ"), ale etykiety są krótkie i kontrolowane, więc to
 * wystarczająca siatka regresji.
 */
const POLISH = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;

describe('Język bazowy = angielski: etykiety budynków w motywach', () => {
  for (const theme of [FANTASY, SCIFI]) {
    it(`motyw "${theme.id}" — etykiety budynków bez polskich znaków`, () => {
      const offenders = theme.buildings
        .filter((b) => POLISH.test(b.label))
        .map((b) => `${b.id}: "${b.label}"`);
      expect(offenders).toEqual([]);
    });
  }
});
