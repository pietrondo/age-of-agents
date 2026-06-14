import { claudeSource } from './claude.js';
import { codexSource } from './codex.js';
import type { AgentSource } from './types.js';

/** Wszystkie aktywne źródła agentów. OpenCode dojdzie tu w Fazie 2. */
export const SOURCES: AgentSource[] = [claudeSource, codexSource];
