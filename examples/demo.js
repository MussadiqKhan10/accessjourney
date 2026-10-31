import { readFile } from 'node:fs/promises';
import { startFixture } from './server.js';
import { runJourney } from '../src/runner.js';
const fixture = await startFixture();
try {
  const config = JSON.parse(await readFile(new URL('./journey.json', import.meta.url)));
  config.baseURL = fixture.url;
  const report = await runJourney(config);
  console.log(`Demo: ${report.summary.checkpoints} checkpoints, ${report.summary.issues} intentional issue occurrences. Open artifacts/accessjourney/report.html. The demo contains deliberate defects.`);
  process.exitCode = report.exitCode === 2 ? 2 : 0;
} finally { await fixture.close(); }
