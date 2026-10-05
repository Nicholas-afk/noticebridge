import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {classify,analyzeNotice} from './dist/engine.js';
const model=JSON.parse(fs.readFileSync(new URL('./dist/model.json',import.meta.url)));
test('browser inference matches re-fitted Python scores on all 93 audited inputs',()=>{
  const audit=JSON.parse(fs.readFileSync(new URL('./docs/model-audit/python-audit.json',import.meta.url)));
  assert.equal(audit.candidate_predictions.length,93);
  for(const row of audit.candidate_predictions){const pred=classify(row.text,model);assert.equal(pred.label,row.prediction,row.text);assert.ok(Math.abs(pred.score-row.score)<1e-10,row.text);}
});
test('passive and conditional instructions remain in the instruction checklist',()=>{
  for(const text of ['Lunchboxes and water bottles are to be packed.','Those wishing to join are asked to complete the booking.']){
    const plan=analyzeNotice(text,model);
    assert.equal(plan.cards[0]?.kind,'action',text);
    assert.equal(plan.cards[0].text,text);
  }
});
test('partially learned requirements can remain uncertain without losing their source',()=>{
  const text='A signed consent slip is needed for participation.';
  const plan=analyzeNotice(text,model);
  assert.equal(plan.cards[0].kind,'review');
  assert.equal(plan.cards[0].text,text);
});
test('unfamiliar vocabulary triggers review even with a high category score',()=>{
  const plan=analyzeNotice('Please bring zargle zindle blorx sneevle vorple.',model);
  assert.equal(plan.cards[0].kind,'review');
  assert.ok(plan.cards[0].flags.some(x=>x.includes('unfamiliar')));
});
test('ordinary words matching inherited object properties never corrupt predictions',()=>{
  const pred=classify('The constructor sent a message.',model);
  assert.ok(Number.isFinite(pred.score));
  assert.ok(['action','background','contact','event'].includes(pred.label));
});
test('operational notification differs from a route for help',()=>{
  assert.equal(classify('Notify the office if your child will be absent.',model).label,'action');
  assert.equal(classify('For advice on getting here, write to the transport coordinator.',model).label,'contact');
});
test('historical action words do not become reader instructions',()=>{
  for(const text of ['The volunteer returned the forms last week.','Families registered in record numbers last year.'])assert.equal(classify(text,model).label,'background',text);
});
