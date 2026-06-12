import { appendFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TailRegistry } from '../src/transcript/tail.js';

describe('TailRegistry', () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'citadel-tail-'));
    file = join(dir, 'session.jsonl');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('dostarcza tylko pełne linie, częściową trzyma w buforze', async () => {
    const tails = new TailRegistry();
    await writeFile(file, '{"a":1}\n{"b":2}\n{"c":');
    expect(await tails.readNewLines(file)).toEqual(['{"a":1}', '{"b":2}']);

    await appendFile(file, '3}\n');
    expect(await tails.readNewLines(file)).toEqual(['{"c":3}']);
    expect(await tails.readNewLines(file)).toEqual([]);
  });

  it('registerAtEnd pomija historię', async () => {
    const tails = new TailRegistry();
    await writeFile(file, '{"stare":1}\n');
    await tails.registerAtEnd(file);
    expect(await tails.readNewLines(file)).toEqual([]);
    await appendFile(file, '{"nowe":2}\n');
    expect(await tails.readNewLines(file)).toEqual(['{"nowe":2}']);
  });

  it('wykrywa skrócenie pliku i zaczyna od zera', async () => {
    const tails = new TailRegistry();
    await writeFile(file, '{"a":1}\n{"b":2}\n');
    await tails.readNewLines(file);
    await writeFile(file, '{"od-nowa":1}\n');
    expect(await tails.readNewLines(file)).toEqual(['{"od-nowa":1}']);
  });
});
