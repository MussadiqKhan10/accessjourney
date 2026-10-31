import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig, safeUrl, resolveValue } from '../src/config.js';
import { fingerprint, compare, renderHtml, renderMarkdown } from '../src/report.js';
const config = () => ({ name:'Example', baseURL:'http://localhost:3000', steps:[{ name:'Home', action:'goto', url:'/' }] });
test('defaults provide independent desktop and mobile viewports', () => assert.equal(validateConfig(config()).viewports.length, 2));
test('rejects non-HTTP and credential-bearing URLs', () => {
  for (const baseURL of ['file:///etc/passwd','javascript:alert(1)','https://user:password@example.com']) assert.throws(()=>validateConfig({...config(),baseURL}));
});
test('rejects missing navigation URL and empty scans', () => {
  assert.throws(()=>validateConfig({...config(),steps:[{name:'Home',action:'goto'}]}));
  assert.throws(()=>validateConfig({...config(),steps:[{name:'Home',action:'goto',url:'/',scan:false}]}));
});
test('rejects duplicate step identifiers', () => assert.throws(()=>validateConfig({...config(),steps:[...config().steps,...config().steps]})));
test('rejects ambiguous locators and unsupported actions', () => {
  for (const step of [{name:'Bad',action:'execute'},{name:'Bad',action:'click',target:{role:'button',selector:'.x'}},{name:'Bad',action:'click',target:{name:'button'}}]) assert.throws(()=>validateConfig({...config(),steps:[...config().steps,step]}));
});
test('rejects unsafe dimensions, duplicate viewport names and invalid thresholds', () => {
  for (const viewports of [[{name:'../../x',width:390,height:800}],[{name:'x',width:390,height:0}],[{name:'x',width:390,height:800},{name:'x',width:390,height:800}]]) assert.throws(()=>validateConfig({...config(),viewports}));
  assert.throws(()=>validateConfig({...config(),failOn:['high']}));
});
test('environment substitution never silently accepts missing secrets', () => {
  assert.equal(resolveValue('${DEMO_KEY}',{DEMO_KEY:'value'}),'value');
  assert.throws(()=>resolveValue('${MISSING}',{}),/Missing environment variable/);
});
test('report URL drops credentials, query strings and fragments', () => assert.equal(safeUrl('https://user:pw@example.com/account?token=secret#private'),'https://example.com/account'));
const issue = (rule='label',impact='serious') => ({fingerprint:fingerprint('desktop','Form',rule,['#field']),rule,impact,target:['#field'],description:'Missing label',tags:['wcag2a'],helpUrl:'https://dequeuniversity.com/rules/axe/label'});
const report = (issues=[issue()]) => ({schemaVersion:1,name:'Example',engineVersion:'test',failOn:['serious','critical'],errors:[],checkpoints:[{name:'Form',viewport:'desktop',width:1280,height:800,url:'http://localhost/',issues,incomplete:[],focus:[]}]});
test('fingerprints retain viewport and checkpoint identity', () => {
  assert.notEqual(fingerprint('mobile','Form','label',['#field']),issue().fingerprint);
  assert.notEqual(fingerprint('desktop','Home','label',['#field']),issue().fingerprint);
});
test('unbaselined qualifying issues fail the gate', () => assert.equal(compare(report()).exitCode,1));
test('baseline permits existing issues but fails new qualifying issues', () => {
  const before=compare(report());
  assert.equal(compare(report(),before).exitCode,0);
  assert.equal(compare(report([issue(),issue('image-alt')]),before).exitCode,1);
});
test('resolved issues counted only after a complete run', () => {
  const before=compare(report());
  assert.equal(compare(report([]),before).summary.resolved,1);
  const failed=report([]); failed.errors.push({viewport:'desktop',step:'Form',message:'Failed'}); failed.checkpoints=[];
  assert.equal(compare(failed,before).summary.resolved,0); assert.equal(failed.exitCode,2);
});
test('rejects unrelated, incomplete and resized baselines', () => {
  assert.throws(()=>compare(report(),{...report(),name:'Other'}));
  assert.throws(()=>compare(report(),{...report(),checkpoints:[]}));
  const resized=report();resized.checkpoints[0].width=390;
  assert.throws(()=>compare(report(),resized));
});
test('low-impact findings do not fail serious-only gate', () => assert.equal(compare(report([issue('region','moderate')])).exitCode,0));
test('HTML report escapes malicious names and selectors; disallows arbitrary help links', () => {
  const r=report();r.name='<script>alert(1)</script>';r.checkpoints[0].issues[0].target=['<img src=x onerror=alert(1)>'];r.checkpoints[0].issues[0].helpUrl='javascript:alert(1)';
  const html=renderHtml(compare(r));assert(!html.includes('<script>'));assert(!html.includes('href="javascript:'));assert(html.includes('&lt;script&gt;'));
});
test('empty findings keep manual review advice visible', () => {
  const r=compare(report([]));assert(renderHtml(r).includes('not a WCAG compliance certificate'));assert(renderMarkdown(r).includes('Manual review'));
});
