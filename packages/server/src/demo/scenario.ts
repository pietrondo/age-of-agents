import type { HeroSnapshot, HeroStateKind } from '@agent-citadel/shared';
import type { World } from '../world.js';

/**
 * Tryb demo — zapętlona opowieść z trzech scen (wybór użytkownika, 2026-06-13):
 *  1. Wyprawa peona po skarb: subagent pracuje i wraca ze skrzynką.
 *  2. Awaria i naprawa: błąd narzędzia, dym, poprawka, fajerwerki.
 *  3. Karawana git: po pracy bohater zanosi kod na targ (commit + push).
 * Klient nie odróżnia demo od prawdziwych sesji — te same zdarzenia.
 */

interface Step {
  at: number; // sekundy od startu pętli
  run: (world: World, iteration: number) => void;
}

const LOOP_SECONDS = 58;

function makeHero(world: World, sessionId: string, title: string): HeroSnapshot {
  const now = new Date().toISOString();
  return {
    sessionId,
    title,
    projectDir: '/demo/projekt',
    model: 'claude-fable-5',
    gitBranch: 'main',
    teamColor: world.claimTeamColor(),
    state: 'idle',
    tokens: { input: 0, output: 0 },
    startedAt: now,
    lastActivityAt: now,
  };
}

function patch(
  world: World,
  sessionId: string,
  fields: Partial<Pick<HeroSnapshot, 'state' | 'currentTool' | 'toolDetail'>> & { state?: HeroStateKind },
): void {
  const hero = world.getHero(sessionId);
  if (!hero) return;
  const tokens = {
    input: hero.tokens.input + 1200 + Math.floor(((hero.tokens.input * 7919) % 997)),
    output: hero.tokens.output + 350 + ((hero.tokens.output * 31) % 211),
  };
  world.upsertHero({
    ...hero,
    currentTool: undefined,
    toolDetail: undefined,
    ...fields,
    tokens,
    lastActivityAt: new Date().toISOString(),
  });
}

function say(world: World, sessionId: string, role: 'user' | 'assistant', text: string): void {
  world.emitTranscriptLine({
    type: 'transcript-line',
    line: { sessionId, role, text, ts: new Date().toISOString() },
  });
}

const H1 = 'demo-kowal';
const H2 = 'demo-zwiadowca';
const PEON = 'demo-peon-1';

const TIMELINE: Step[] = [
  // --- Scena: awaria i naprawa + karawana git (bohater 1) ---
  {
    at: 1,
    run: (w, i) => {
      w.startMission({
        id: `demo-m-naprawa-${i}`,
        sessionId: H1,
        prompt: 'Napraw moduł płatności — testy sypią się od rana',
        status: 'active',
        startedAt: new Date().toISOString(),
      });
      say(w, H1, 'user', 'Napraw moduł płatności — testy sypią się od rana');
      patch(w, H1, { state: 'thinking' });
    },
  },
  { at: 4, run: (w) => patch(w, H1, { state: 'working', currentTool: 'Grep', toolDetail: 'PaymentError' }) },
  { at: 10, run: (w) => patch(w, H1, { state: 'working', currentTool: 'Edit', toolDetail: 'payments.ts' }) },
  { at: 16, run: (w) => patch(w, H1, { state: 'working', currentTool: 'Bash', toolDetail: 'npm test — payments' }) },
  {
    at: 21,
    run: (w) => {
      say(w, H1, 'assistant', 'Test nadal czerwony — walidacja kwot odrzuca zero. Poprawiam warunek brzegowy.');
      patch(w, H1, { state: 'error' });
    },
  },
  { at: 25, run: (w) => patch(w, H1, { state: 'working', currentTool: 'Edit', toolDetail: 'payments.ts — poprawka' }) },
  { at: 31, run: (w) => patch(w, H1, { state: 'working', currentTool: 'Bash', toolDetail: 'npm test — zielone ✓' }) },
  { at: 37, run: (w) => patch(w, H1, { state: 'working', currentTool: 'Bash', toolDetail: 'git commit + push' }) },
  {
    at: 43,
    run: (w, i) => {
      say(w, H1, 'assistant', 'Moduł płatności naprawiony, testy zielone, zmiany wypchnięte.');
      patch(w, H1, { state: 'returning' });
      w.completeMission(`demo-m-naprawa-${i}`, 'completed', new Date().toISOString());
    },
  },
  { at: 50, run: (w) => patch(w, H1, { state: 'idle' }) },

  // --- Scena: wyprawa peona po skarb (bohater 2) ---
  {
    at: 6,
    run: (w, i) => {
      w.startMission({
        id: `demo-m-eksport-${i}`,
        sessionId: H2,
        prompt: 'Dodaj eksport raportów do CSV i PDF',
        status: 'active',
        startedAt: new Date().toISOString(),
      });
      say(w, H2, 'user', 'Dodaj eksport raportów do CSV i PDF');
      patch(w, H2, { state: 'thinking' });
    },
  },
  {
    at: 11,
    run: (w) => {
      patch(w, H2, { state: 'working', currentTool: 'Task', toolDetail: 'Zbadaj formaty eksportu' });
      w.upsertPeon({
        agentId: PEON,
        parentSessionId: H2,
        state: 'working',
        currentTool: 'Grep',
        description: 'Zbadaj formaty eksportu',
      });
    },
  },
  { at: 14, run: (w) => patch(w, H2, { state: 'thinking' }) },
  { at: 19, run: (w) => w.upsertPeon({ agentId: PEON, parentSessionId: H2, state: 'working', currentTool: 'Bash', description: 'Zbadaj formaty eksportu' }) },
  { at: 27, run: (w) => w.completePeon(PEON) }, // wraca ze skrzynką do bohatera
  {
    at: 29,
    run: (w) => {
      say(w, H2, 'assistant', 'Zwiadowca wrócił: najlepiej csv-stringify + pdfkit. Implementuję.');
      patch(w, H2, { state: 'working', currentTool: 'Write', toolDetail: 'export.ts' });
    },
  },
  { at: 38, run: (w) => patch(w, H2, { state: 'working', currentTool: 'Bash', toolDetail: 'npm test — export' }) },
  {
    at: 46,
    run: (w, i) => {
      say(w, H2, 'assistant', 'Eksport CSV i PDF gotowy, z testami.');
      patch(w, H2, { state: 'returning' });
      w.completeMission(`demo-m-eksport-${i}`, 'completed', new Date().toISOString());
    },
  },
  { at: 53, run: (w) => patch(w, H2, { state: 'idle' }) },
];

export function startDemo(world: World): void {
  world.upsertHero(makeHero(world, H1, 'Napraw moduł płatności'));
  world.upsertHero(makeHero(world, H2, 'Eksport raportów'));

  const startedAt = Date.now();
  const fired = new Set<string>();

  setInterval(() => {
    const elapsed = (Date.now() - startedAt) / 1000;
    const iteration = Math.floor(elapsed / LOOP_SECONDS);
    const inLoop = elapsed % LOOP_SECONDS;
    for (const step of TIMELINE) {
      const key = `${iteration}:${step.at}`;
      if (inLoop >= step.at && !fired.has(key)) {
        fired.add(key);
        step.run(world, iteration);
      }
    }
  }, 400);
}
