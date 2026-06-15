// Dev-entry: w trybie deweloperskim klienta serwuje Vite (proxy na /ws, /hooks...).
// Dystrybucja npm używa src/cli.ts (z webRoot). Tu NIE podajemy webRoot.
import { SERVER_PORT } from '@agent-citadel/shared';
import { startServer } from './server.js';

// Siatka bezpieczeństwa: pojedynczy nieobsłużony błąd nie może wygasić serwera
// wizualizacji — wtedy klient zostaje bez źródła danych. Logujemy i działamy dalej.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection — server keeps running:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception — server keeps running:', err);
});

const demo = process.argv.includes('--demo');
const server = await startServer({ port: SERVER_PORT, host: '127.0.0.1', demo });
console.log(`Age of Agents server (dev): ${server.url} (ws: /ws)`);
if (demo) console.log('Demo mode: scenario generator started');
