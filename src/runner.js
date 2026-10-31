import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { validateConfig, resolveValue, safeUrl, httpUrl } from './config.js';
import { fingerprint, compare, renderHtml, renderMarkdown } from './report.js';

export function locate(page, target) {
  if (target.role) return page.getByRole(target.role, { name: target.name, exact: true });
  if (target.label) return page.getByLabel(target.label, { exact: true });
  if (target.testId) return page.getByTestId(target.testId);
  return page.locator(target.selector);
}
async function perform(page, step, config) {
  if (step.action === 'goto') {
    const response = await page.goto(httpUrl(resolveValue(step.url), config.baseURL).href, { waitUntil: 'domcontentloaded' });
    if (response && !response.ok()) throw new Error('Navigation returned an unsuccessful HTTP response');
    return;
  }
  const target = locate(page, step.target);
  switch (step.action) {
    case 'click': await target.click(); break;
    case 'fill': await target.fill(resolveValue(step.value)); break;
    case 'press': await target.press(resolveValue(step.value)); break;
    case 'check': await target.check(); break;
    case 'select': await target.selectOption(resolveValue(step.value)); break;
    case 'waitFor': await target.waitFor({ state: 'visible' }); break;
  }
}
async function focusTrace(source, tabs) {
  if (!tabs) return [];
  // Optional Tab presses may trigger application focus/blur handlers.
  // Restore the previously focused element but do not claim a side-effect-free probe.
  const previous = await source.evaluateHandle(() => document.activeElement);
  const trace = [];
  try {
    for (let n = 0; n < tabs; n++) {
      await source.keyboard.press('Tab');
      trace.push(await source.evaluate(() => {
        const el = document.activeElement;
        return { tag: el?.tagName?.toLowerCase() ?? 'none', role: el?.getAttribute('role') ?? null, inDialog: Boolean(el?.closest('dialog,[role="dialog"],[role="alertdialog"]')), onBody: el === document.body };
      }));
    }
  } finally {
    await previous.evaluate(el => { if (el?.isConnected && typeof el.focus === 'function') el.focus(); });
    await previous.dispose();
  }
  return trace;
}

/** Runs only trusted, locally supplied journey files against sites you may test. */
export async function runJourney(input, { outputDir = 'artifacts/accessjourney', baseline, launchOptions = {} } = {}) {
  const config = validateConfig(input);
  // Fail on absent variables before launching or interacting with a target.
  for (const step of config.steps) for (const value of [step.value, step.url]) if (typeof value === 'string') resolveValue(value);
  for (const step of config.steps) if (step.action === 'goto') httpUrl(resolveValue(step.url), config.baseURL);
  const report = { schemaVersion: 1, name: config.name, generatedAt: new Date().toISOString(), engineVersion: 'unknown', failOn: config.failOn, checkpoints: [], errors: [] };
  const destination = path.resolve(outputDir);
  await mkdir(destination, { recursive: true, mode: 0o700 });
  const browser = await chromium.launch({ ...(process.env.ACCESSJOURNEY_CHROMIUM_PATH ? { executablePath: process.env.ACCESSJOURNEY_CHROMIUM_PATH } : {}), ...launchOptions });
  try {
    for (const viewport of config.viewports) {
      const { name, width, height } = viewport;
      const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
      const page = await context.newPage();
      page.setDefaultTimeout(config.timeout);
      page.setDefaultNavigationTimeout(config.timeout);
      try {
        for (let index = 0; index < config.steps.length; index++) {
          const step = config.steps[index];
          try {
            await perform(page, step, config);
            if (step.scan === false) continue;
            const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
            report.engineVersion = results.testEngine.version;
            const issues = results.violations.flatMap(rule => rule.nodes.map(node => ({ fingerprint: fingerprint(name, step.name, rule.id, node.target), rule: rule.id, impact: rule.impact, description: rule.help, helpUrl: rule.helpUrl, tags: rule.tags, target: node.target })));
            const checkpoint = { name: step.name, viewport: name, width, height, url: safeUrl(page.url()), issues, incomplete: results.incomplete.map(r=>({ rule:r.id, description:r.help, nodes:r.nodes.length })), focus: await focusTrace(page, config.keyboard.tabs) };
            if (config.screenshots) {
              const filename = `${name}-${String(index + 1).padStart(3, '0')}.png`;
              await page.screenshot({ path: path.join(destination, filename), fullPage: true, mask: [page.locator('input,textarea,[contenteditable="true"]')] });
              checkpoint.screenshot = filename;
            }
            report.checkpoints.push(checkpoint);
          } catch {
            // Raw browser exceptions may contain field values, URLs or tokens.
            report.errors.push({ viewport: name, step: step.name, message: `The ${step.action} action or its accessibility checkpoint failed. Check the target, readiness and timeout locally.` });
            break;
          }
        }
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
  compare(report, baseline);
  await writeFile(path.join(destination, 'report.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  await writeFile(path.join(destination, 'report.html'), renderHtml(report), { mode: 0o600 });
  await writeFile(path.join(destination, 'summary.md'), renderMarkdown(report), { mode: 0o600 });
  return report;
}
