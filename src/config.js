const actions = new Set(['goto', 'click', 'fill', 'press', 'check', 'select', 'waitFor']);
const impacts = new Set(['minor', 'moderate', 'serious', 'critical']);
export const defaultViewports = [{ name: 'desktop', width: 1280, height: 800 }, { name: 'mobile', width: 390, height: 844 }];

function fail(message) { throw new Error(`Invalid journey: ${message}`); }
export function httpUrl(value, base) {
  if (typeof value !== 'string' || !value.trim()) fail('expected a nonempty URL string');
  let url;
  try { url = new URL(value, base); } catch { fail('expected an HTTP(S) URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) fail('URLs must use HTTP(S) without embedded credentials');
  return url;
}
export function validateConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('expected an object');
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120) fail('name must be 1–120 characters');
  const baseURL = httpUrl(input.baseURL).href;
  const viewports = input.viewports ?? defaultViewports;
  if (!Array.isArray(viewports) || !viewports.length || viewports.length > 8) fail('provide 1–8 viewports');
  const names = new Set();
  for (const v of viewports) {
    if (!v || !/^[a-zA-Z0-9_-]{1,40}$/.test(v.name) || names.has(v.name)) fail('viewport names must be unique safe identifiers');
    names.add(v.name);
    if (![v.width, v.height].every(n => Number.isInteger(n) && n >= 240 && n <= 3840)) fail('viewport dimensions must be integers from 240 to 3840');
  }
  if (!Array.isArray(input.steps) || !input.steps.length || input.steps.length > 100) fail('provide 1–100 steps');
  if (input.steps[0]?.action !== 'goto') fail('the first step must navigate with goto');
  if (!input.steps.some(s => s?.scan !== false)) fail('at least one step must scan');
  const ids = new Set();
  for (const step of input.steps) {
    if (!step || typeof step.name !== 'string' || !step.name.trim() || ids.has(step.name) || step.name.length > 120) fail('step names must be unique and 1–120 characters');
    ids.add(step.name);
    if (!actions.has(step.action)) fail('unsupported action');
    if (step.action === 'goto') httpUrl(step.url, baseURL);
    else {
      const t = step.target;
      if (!t || typeof t !== 'object' || Array.isArray(t)) fail('actions require a target');
      if (Object.keys(t).some(k => !['role', 'name', 'label', 'testId', 'selector'].includes(k))) fail('unknown target key');
      const modes = ['role', 'label', 'testId', 'selector'].filter(k => typeof t[k] === 'string' && t[k].length);
      if (modes.length !== 1 || (t.name !== undefined && (typeof t.name !== 'string' || !t.role))) fail('target requires exactly one locator mode; name is only valid with role');
    }
    if (['fill', 'press', 'select'].includes(step.action) && typeof step.value !== 'string') fail('action requires a string value');
    if (step.scan !== undefined && typeof step.scan !== 'boolean') fail('scan must be boolean');
  }
  const failOn = input.failOn ?? ['serious', 'critical'];
  if (!Array.isArray(failOn) || failOn.some(x => !impacts.has(x))) fail('invalid failOn impact');
  const timeout = input.timeout ?? 10000;
  if (!Number.isInteger(timeout) || timeout < 100 || timeout > 120000) fail('timeout must be 100–120000 ms');
  const keyboard = input.keyboard ?? { tabs: 0 };
  if (!keyboard || !Number.isInteger(keyboard.tabs) || keyboard.tabs < 0 || keyboard.tabs > 50) fail('keyboard.tabs must be 0–50');
  if (input.screenshots !== undefined && typeof input.screenshots !== 'boolean') fail('screenshots must be boolean');
  return { name: input.name, baseURL, viewports, steps: input.steps, timeout, failOn, keyboard, screenshots: input.screenshots ?? false };
}

export function resolveValue(value, env = process.env) {
  return value.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, key) => {
    if (env[key] === undefined) throw new Error(`Missing environment variable: ${key}`);
    return env[key];
  });
}
export function safeUrl(value) {
  try { const u = new URL(value); return `${u.origin}${u.pathname}`; } catch { return '[unavailable]'; }
}
