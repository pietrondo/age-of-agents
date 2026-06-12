import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

/**
 * Przyrostowy tail plików NDJSON: pamięta offset per plik i dostarcza
 * wyłącznie KOMPLETNE linie (zakończone \n). Niedokończona końcówka
 * zostaje w buforze do następnego odczytu — transkrypty są dopisywane
 * na żywo, więc ostatnia linia bywa w połowie zapisu.
 */
export class TailRegistry {
  private offsets = new Map<string, number>();
  private remainders = new Map<string, string>();

  /** Rejestruje plik bez czytania historii — tail zacznie od bieżącego końca. */
  async registerAtEnd(path: string): Promise<void> {
    const { size } = await stat(path);
    this.offsets.set(path, size);
    this.remainders.set(path, '');
  }

  has(path: string): boolean {
    return this.offsets.has(path);
  }

  forget(path: string): void {
    this.offsets.delete(path);
    this.remainders.delete(path);
  }

  /** Czyta nowe pełne linie od zapamiętanego offsetu (domyślnie od początku pliku). */
  async readNewLines(path: string): Promise<string[]> {
    let offset = this.offsets.get(path) ?? 0;
    let size: number;
    try {
      ({ size } = await stat(path));
    } catch {
      this.forget(path);
      return [];
    }
    if (size < offset) {
      // Plik skrócony/nadpisany — zacznij od zera.
      offset = 0;
      this.remainders.set(path, '');
    }
    if (size === offset) return [];

    const chunk = await readRange(path, offset, size - 1);
    this.offsets.set(path, size);

    const buffered = (this.remainders.get(path) ?? '') + chunk;
    const parts = buffered.split('\n');
    const remainder = parts.pop() ?? '';
    this.remainders.set(path, remainder);
    return parts.filter((line) => line.trim().length > 0);
  }
}

function readRange(path: string, start: number, end: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    createReadStream(path, { start, end, encoding: 'utf8' })
      .on('data', (part) => (data += part))
      .on('end', () => resolve(data))
      .on('error', reject);
  });
}
