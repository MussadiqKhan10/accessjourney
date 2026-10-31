import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runJourney } from '../src/runner.js';
import { startFixture } from '../examples/server.js';

test('real Chromium finds dialog and validation defects across desktop/mobile, with baseline comparison', async () => {
  const fixture=await startFixture(); const outputDir=await mkdtemp(path.join(tmpdir(),'accessjourney-'));
  try {
    const config=JSON.parse(await readFile(new URL('../examples/journey.json',import.meta.url)));config.baseURL=fixture.url;
    const result=await runJourney(config,{outputDir});
    assert.equal(result.errors.length,0);assert.equal(result.checkpoints.length,8);
    for (const viewport of ['desktop','mobile']) {
      const checkpoints=result.checkpoints.filter(c=>c.viewport===viewport);
      assert.equal(checkpoints[0].issues.length,0,'initial page is clean');
      assert(checkpoints[1].issues.some(i=>i.rule==='label'),'dialog reveals an unlabeled input');
      assert(checkpoints[2].issues.some(i=>i.rule==='image-alt'),'validation reveals an image without alt');
      assert.equal(checkpoints[3].issues.length,0,'closed dialog returns to clean page');
      assert(checkpoints.every(c=>c.focus.length===4));
    }
    assert.equal(result.exitCode,1);
    const files=await readdir(outputDir);assert.deepEqual(files.sort(),['report.html','report.json','summary.md']);
    assert(!(await readFile(path.join(outputDir,'report.json'),'utf8')).includes('innerHTML'));
    const second=await runJourney(config,{outputDir,baseline:result});assert.equal(second.exitCode,0);assert.equal(second.summary.new,0);
    config.steps[0].url='/?fixed=1';
    const fixed=await runJourney(config,{outputDir,baseline:result});
    assert.equal(fixed.exitCode,0);assert.equal(fixed.summary.issues,0);assert.equal(fixed.summary.resolved,result.summary.issues);
  } finally { await fixture.close();await rm(outputDir,{recursive:true,force:true}); }
});
test('action failure is a run error, not an accessibility pass', async () => {
  const fixture=await startFixture();const outputDir=await mkdtemp(path.join(tmpdir(),'accessjourney-fail-'));
  try {
    const result=await runJourney({name:'Failure',baseURL:fixture.url,timeout:200,viewports:[{name:'mobile',width:390,height:844}],steps:[{name:'Home',action:'goto',url:'/'},{name:'Missing target',action:'click',target:{role:'button',name:'Not present'}}]},{outputDir});
    assert.equal(result.exitCode,2);assert.equal(result.errors.length,1);assert.equal(result.checkpoints.length,1);
    assert((await readFile(path.join(outputDir,'report.html'),'utf8')).includes('Run incomplete'));
  } finally { await fixture.close();await rm(outputDir,{recursive:true,force:true}); }
});
