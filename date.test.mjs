import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeNotice,splitSentences} from './dist/engine.js';
import {dateSuggestions,reminderDefaultDate,buildQuestions} from './dist/followup.js';
const model=JSON.parse(fs.readFileSync(new URL('./dist/model.json',import.meta.url)));
const analyze=text=>analyzeNotice(text,model);

// Losing the earlier day or choosing one end of a range must fail these fixtures.
for(const phrase of ['9 or 12 October 2026','9 and 12 October 2026','9, 10 and 12 October 2026','9–12 October 2026','9 - 12 Oct. 2026','9 to 12 October 2026','October 9–12, 2026','Oct. 9 or 12, 2026']){
  test(`preserve grouped date without selecting a reminder: ${phrase}`,()=>{
    const source=`Please choose a session on ${phrase}.`,result=analyze(source),card=result.cards[0];
    assert.equal(result.sentences.length,1);
    assert.equal(card.dates.length,1);
    assert.equal(card.dates[0].text,phrase);
    assert.equal(card.text.slice(card.dates[0].start,card.dates[0].end),phrase);
    assert.equal(reminderDefaultDate(card),'');assert.deepEqual(dateSuggestions(card),[]);
    assert.ok(card.flags.some(flag=>flag.includes('alternatives')||flag.includes('range')));
    const questions=buildQuestions(result);assert.ok(questions.includes(source));assert.ok(questions.includes('Which date'));
  });
}
for(const phrase of ['31 April 2026','April 31, 2026','29 February 2026','Feb. 29, 2026','0 October 2026','32nd October 2026','31 November 2026']){
  test(`flag invalid named date: ${phrase}`,()=>{
    const result=analyze(`Please return the form by ${phrase}.`),card=result.cards[0];
    assert.equal(result.sentences.length,1);
    assert.equal(card.dates[0].text,phrase);
    assert.ok(card.flags.some(flag=>flag.includes('calendar date is invalid')));
    assert.equal(reminderDefaultDate(card),'');
    assert.ok(buildQuestions(result).includes('correct full calendar date'));
  });
}
for(const [phrase,iso] of [['9 Oct. 2026','2026-10-09'],['Oct. 9th, 2026','2026-10-09'],['9 October, 2026','2026-10-09'],['29 Feb. 2024','2024-02-29'],['September 30, 2026','2026-09-30'],['9 Sept. 2026','2026-09-09']]){
  test(`keep valid abbreviated or punctuated date intact: ${phrase}`,()=>{
    const source=`Please register by ${phrase}. Bring your library card.`,result=analyze(source),card=result.cards[0];
    assert.equal(result.sentences.length,2);assert.equal(card.dates[0].text,phrase);
    assert.equal(reminderDefaultDate(card),iso);assert.ok(!card.flags.some(flag=>flag.includes('invalid')||flag.includes('year is not')));
    for(const span of [...result.cards,...result.background])assert.equal(source.slice(span.start,span.end),span.text);
  });
}
test('a month abbreviation at an actual sentence end still splits',()=>{
  assert.deepEqual(splitSentences('The club ends in Oct. Please return the form.').map(s=>s.text),['The club ends in Oct.','Please return the form.']);
});
test('explicit full-date ranges stay ambiguous for reminder selection',()=>{
  const card=analyze('Please attend from 9 October 2026 to 12 October 2026.').cards[0];
  assert.equal(card.dates.length,2);assert.equal(reminderDefaultDate(card),'');
});
test('two different months without a first year cannot borrow that year',()=>{
  const card=analyze('Please choose between 9 October and 12 November 2026.').cards[0];
  assert.equal(card.dates.length,2);assert.equal(reminderDefaultDate(card),'');
});
test('partial dates and numeric dates stay unresolved',()=>{
  for(const phrase of ['9 October','9 or 12 October','08/10/2026','Saturday'])assert.equal(reminderDefaultDate(analyze(`Please register on ${phrase}.`).cards[0]),'');
});
