import { describe, expect, it } from 'vitest';
import { interpretLine } from '../src/transcript/parser.js';

describe('interpretLine', () => {
  it('zamienia enqueue na fakt prompt', () => {
    const line = JSON.stringify({
      type: 'queue-operation',
      operation: 'enqueue',
      timestamp: '2026-06-13T10:00:00.000Z',
      sessionId: 'abc',
      content: 'Napraw testy auth',
    });
    expect(interpretLine(line)).toEqual([
      { kind: 'prompt', text: 'Napraw testy auth', ts: '2026-06-13T10:00:00.000Z' },
    ]);
  });

  it('wyciąga tool-start z opisem, usage i model z rekordu assistant', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-06-13T10:00:01.000Z',
      gitBranch: 'main',
      message: {
        id: 'msg_01',
        model: 'claude-fable-5',
        stop_reason: 'tool_use',
        usage: { input_tokens: 10, cache_read_input_tokens: 90, output_tokens: 42 },
        content: [
          { type: 'tool_use', id: 'toolu_01', name: 'Bash', input: { command: 'npm test', description: 'Uruchom testy' } },
        ],
      },
    });
    const facts = interpretLine(line);
    expect(facts).toContainEqual({
      kind: 'tool-start',
      tool: 'Bash',
      detail: 'Uruchom testy',
      messageId: 'msg_01',
      ts: '2026-06-13T10:00:01.000Z',
    });
    expect(facts).toContainEqual({ kind: 'usage', messageId: 'msg_01', input: 100, output: 42 });
    expect(facts).toContainEqual({ kind: 'meta', model: 'claude-fable-5', gitBranch: 'main', cwd: undefined });
  });

  it('end_turn daje turn-end i tekst asystenta', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-06-13T10:00:02.000Z',
      message: {
        id: 'msg_02',
        model: 'claude-fable-5',
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Gotowe, testy przechodzą.' }],
      },
    });
    const kinds = interpretLine(line).map((f) => f.kind);
    expect(kinds).toContain('turn-end');
    expect(kinds).toContain('assistant-text');
  });

  it('tool_result z is_error daje fakt błędu', () => {
    const line = JSON.stringify({
      type: 'user',
      timestamp: '2026-06-13T10:00:03.000Z',
      message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_01', is_error: true, content: 'boom' }] },
      toolUseResult: 'Error: boom',
    });
    expect(interpretLine(line)).toContainEqual({
      kind: 'tool-result',
      isError: true,
      ts: '2026-06-13T10:00:03.000Z',
    });
  });

  it('last-prompt daje tytuł, śmieci dają pustą listę', () => {
    expect(interpretLine(JSON.stringify({ type: 'last-prompt', lastPrompt: 'Refactor API' }))).toEqual([
      { kind: 'title', title: 'Refactor API' },
    ]);
    expect(interpretLine('to nie jest json{')).toEqual([]);
    expect(interpretLine(JSON.stringify({ type: 'file-history-snapshot' }))).toEqual([]);
  });

  it('skraca bardzo długie prompty', () => {
    const line = JSON.stringify({
      type: 'queue-operation',
      operation: 'enqueue',
      timestamp: '2026-06-13T10:00:00.000Z',
      content: 'x'.repeat(1000),
    });
    const [fact] = interpretLine(line);
    expect(fact.kind).toBe('prompt');
    if (fact.kind === 'prompt') expect(fact.text.length).toBeLessThanOrEqual(240);
  });
});
