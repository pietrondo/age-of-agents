import { isometric } from '../game/projection';
import type { ThemeDef } from './types';

/**
 * Motyw sci-fi (izometryczny, docelowo assety acdrnx CC0).
 * Ten sam układ logiczny co fantasy — zmienia się tylko projekcja,
 * nazwy budynków i paleta (marsjańska baza).
 */
export const SCIFI: ThemeDef = {
  id: 'scifi',
  name: 'Stacja (sci-fi)',
  style: 'iso',
  projection: isometric(64, 32),
  tile: 64,
  grid: { w: 26, h: 17 },
  buildings: [
    { id: 'citadel', label: 'Centrum dowodzenia', gx: 11, gy: 6, w: 4, h: 3, door: { gx: 13, gy: 9.6 }, placeholderColor: 0x8c93a8 },
    { id: 'tower', label: 'Laboratorium', gx: 3, gy: 1.5, w: 2, h: 3, door: { gx: 4, gy: 5 }, placeholderColor: 0x7f77dd },
    { id: 'forge', label: 'Fabryka dronów', gx: 20, gy: 2, w: 3, h: 2, door: { gx: 21.5, gy: 4.6 }, placeholderColor: 0xd85a30 },
    { id: 'library', label: 'Archiwum danych', gx: 1.5, gy: 9, w: 3, h: 2, door: { gx: 3, gy: 11.5 }, placeholderColor: 0x378add },
    { id: 'mine', label: 'Rafineria', gx: 21, gy: 9.5, w: 3, h: 2, door: { gx: 22.5, gy: 12 }, placeholderColor: 0x5f5e5a },
    { id: 'barracks', label: 'Hangar', gx: 6, gy: 13, w: 3, h: 2, door: { gx: 7.5, gy: 12.6 }, placeholderColor: 0x1d9e75 },
    { id: 'market', label: 'Port kosmiczny', gx: 17, gy: 13, w: 3, h: 2, door: { gx: 18.5, gy: 12.6 }, placeholderColor: 0xba7517 },
    { id: 'guild', label: 'Stacja łączności', gx: 11.5, gy: 13.5, w: 3, h: 2, door: { gx: 13, gy: 13.1 }, placeholderColor: 0xd4537e },
  ],
  crossroads: [
    { id: 'x-center', gx: 13, gy: 11 },
    { id: 'x-west', gx: 7, gy: 8 },
    { id: 'x-east', gx: 19, gy: 8 },
    { id: 'x-nw', gx: 6, gy: 5 },
    { id: 'x-ne', gx: 19, gy: 5 },
  ],
  edges: [
    ['door:citadel', 'x-center'],
    ['x-center', 'door:barracks'],
    ['x-center', 'door:market'],
    ['x-center', 'door:guild'],
    ['x-center', 'x-west'],
    ['x-center', 'x-east'],
    ['x-west', 'door:library'],
    ['x-west', 'x-nw'],
    ['x-nw', 'door:tower'],
    ['x-east', 'door:mine'],
    ['x-east', 'x-ne'],
    ['x-ne', 'door:forge'],
  ],
  terrain: { base: 0x8a4b32, alt: 0x93553a, path: 0x5a5e66 },
};
