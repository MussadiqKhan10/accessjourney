import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { compare, renderHtml, fingerprint } from '../src/report.js';

test('generated report is usable at desktop and mobile widths and has no axe violations', async () => {
  const report=compare({schemaVersion:1,name:'Form accessibility review',engineVersion:'test',failOn:['serious','critical'],errors:[],checkpoints:[{name:'Open dialog',viewport:'mobile',width:390,height:844,url:'http://localhost/form',issues:[{fingerprint:fingerprint('mobile','Open dialog','label',['input']),rule:'label',impact:'serious',description:'Form elements must have labels',helpUrl:'https://dequeuniversity.com/rules/axe/label',tags:['wcag2a'],target:['input']}],incomplete:[{rule:'color-contrast',description:'Review contrast',nodes:1}],focus:[{tag:'input',role:null,inDialog:true,onBody:false}]}]});
  const browser=await chromium.launch(process.env.ACCESSJOURNEY_CHROMIUM_PATH ? {executablePath:process.env.ACCESSJOURNEY_CHROMIUM_PATH} : {});
  try {
    for (const width of [1280,390]) {
      const context=await browser.newContext({viewport:{width,height:844}});
      const page=await context.newPage();
      await page.setContent(renderHtml(report));
      const results=await new AxeBuilder({page}).analyze();
      assert.deepEqual(results.violations.map(v=>v.id),[]);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'report must reflow without horizontal scroll');
      const summary=page.locator('summary').first();
      await summary.focus();await page.keyboard.press('Enter');
      assert(await page.locator('details').first().getAttribute('open') !== null,'keyboard opens finding details');
      await context.close();
    }
  } finally { await browser.close(); }
});
