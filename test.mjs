import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitSentences,classify,analyzeNotice} from './dist/engine.js';
const model=JSON.parse(fs.readFileSync(new URL('./dist/model.json',import.meta.url)));
const evaluation=JSON.parse(fs.readFileSync(new URL('./evaluation.json',import.meta.url)));
// Cross-runtime parity with Python on every holdout example.
for(const row of evaluation.predictions){const pred=classify(row.text,model);assert.equal(pred.label,row.prediction,row.text);assert.ok(Math.abs(pred.score-row.score)<1e-10,row.text);}
const fixtures=[
  'Please return the form by 9 October 2026. Do not bring cash. Email office@example.org for help.',
  'Contact Ms. Lee at help@example.org. The fee is $12.50.\nBring lunch.',
  '<script>alert("test")</script>\nPlease bring water.',
  'Return the form tomorrow. Payment is due by 08/10.',
  'Register on Monday. The meeting is on 9 October and 12 October.',
  'There is no payment required for this activity.',
  'You do not have to buy any materials.',
  'これは学校のお知らせです。',
];
for(const source of fixtures){const out=analyzeNotice(source,model);for(const span of [...out.cards,...out.background])assert.equal(source.slice(span.start,span.end),span.text);assert.equal(out.sentences.length,out.cards.length+out.background.length);}
assert.equal(splitSentences('Contact Ms. Lee at help@example.org. The fee is $12.50.').length,2);
const relative=analyzeNotice('Please return the form tomorrow.',model,{anchorDate:'2026-10-05'});assert.equal(relative.cards[0].dates[0].resolved,'2026-10-06');
assert.ok(analyzeNotice('Payment is due by 08/10.',model).cards[0].flags.some(x=>x.includes('ambiguous')));
const missing=analyzeNotice('Bring a water bottle.',model);assert.ok(missing.cards[0].flags.some(x=>x.includes('No date')));
const negative=analyzeNotice('Do not bring cash.',model);assert.equal(negative.cards[0].text,'Do not bring cash.');assert.equal(negative.cards[0].title,'A restriction or exception');
assert.throws(()=>analyzeNotice('',model));assert.throws(()=>analyzeNotice('a'.repeat(20001),model));
assert.throws(()=>analyzeNotice('Bring lunch.',model,{anchorDate:'2026-02-31'}));
assert.ok(analyzeNotice('Registration closes on 2026-99-99.',model).cards[0].flags.some(x=>x.includes('invalid')));
console.log('PASS: 48 cross-runtime model predictions, 8 span-integrity fixtures, relative/ambiguous/missing dates, preserved negation, input bounds.');
