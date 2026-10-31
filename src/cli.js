#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { runJourney } from './runner.js';

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { output: { type:'string', short:'o' }, baseline:{ type:'string' }, help:{ type:'boolean', short:'h' }, version:{ type:'boolean' } } });
  if (values.version) { console.log('AccessJourney 0.1.0'); return; }
  if (values.help || !positionals.length) {
    console.log('AccessJourney — accessibility testing across user journeys\n\nUsage: accessjourney journey.json [--output artifacts/run] [--baseline report.json]\n\nExit codes: 0 configured gate passed, 1 qualifying issues, 2 config/run failure.\nRuns locally. Automated checks do not certify WCAG conformance.');
    process.exitCode = values.help ? 0 : 2; return;
  }
  if (positionals.length !== 1) throw new Error('Expected one journey JSON file');
  const config = JSON.parse(await readFile(positionals[0], 'utf8'));
  const baseline = values.baseline ? JSON.parse(await readFile(values.baseline, 'utf8')) : undefined;
  const report = await runJourney(config, { outputDir: values.output, baseline });
  console.log(`AccessJourney: ${report.summary.checkpoints} checkpoints, ${report.summary.issues} issue occurrences, ${report.summary.new} new/unbaselined, ${report.summary.errors} run errors. Exit ${report.exitCode}.`);
  process.exitCode = report.exitCode;
}
main().catch(error => {
  // Configuration errors are authored locally; never print arbitrary browser errors.
  console.error(error.message.startsWith('Invalid journey:') || error.message.startsWith('Missing environment variable:') || error.message.startsWith('Baseline ') ? error.message : 'AccessJourney could not complete. Check the JSON file, output permissions, dependencies and Chromium installation.');
  process.exitCode = 2;
});
