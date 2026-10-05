import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeNotice,splitSentences} from './dist/engine.js';
import {dateSuggestions,reminderDefaultDate,buildQuestions} from './dist/followup.js';
const model=JSON.parse(fs.readFileSync(new URL('./dist/model.json',import.meta.url)));
const analyze=text=>analyzeNotice(text,model);

// Losing the earlier day or choosing one end of a range must fail these fixtures.
for(const phrase of ['9 or 12 October 2026','9 and 12 October 2026','9, 10 and 12 October 2026','9–12 October 2026','9 - 12 Oct. 2026','9 to 12 October 2026','October 9–12, 2026','Oct. 9 or 12, 2026','9 & 12 October 2026','9&12 October 2026','9 through 12 October 2026','9 and/or 12 October 2026','October 9 through 12, 2026','9, 10 & 12 October 2026','9 until 12 October 2026','9 till 12 October 2026','9/12 October 2026','9 October 2026–2027','9 Oct. 2026-2027','October 9, 2026 or 2027']){
  test(`preserve grouped date without selecting a reminder: ${phrase}`,()=>{
    const source=`Please choose a session on ${phrase}.`,result=analyze(source),card=result.cards[0];
    assert.equal(result.sentences.length,1);
    assert.equal(card.dates.length,1);
    assert.equal(card.dates[0].text,phrase);
    assert.equal(card.text.slice(card.dates[0].start,card.dates[0].end),phrase);
    assert.equal(reminderDefaultDate(card),'');assert.deepEqual(dateSuggestions(card),[]);
    assert.ok(card.flags.some(flag=>flag.startsWith('This date phrase')));
    const questions=buildQuestions(result);assert.ok(questions.includes(source));
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

test('number-led statements after a month abbreviation do not become dates',()=>{
  const source='The club ends in Oct. 9 volunteers are needed.',result=analyze(source);
  assert.equal(result.sentences.length,2);
  assert.ok(result.cards.every(card=>!card.dates.length));
});
test('a following statement cannot supply a missing year',()=>{
  const source='Please return the form by 9 Oct. 2027 applications open in January.',result=analyze(source);
  assert.equal(result.sentences.length,2);
  assert.equal(result.cards[0].dates[0].text,'9 Oct.');
  assert.equal(reminderDefaultDate(result.cards[0]),'');
  assert.ok(result.cards[0].flags.some(flag=>flag.includes('year is not')));
});
for(const phrase of ['9 or\n12 October 2026','9 &\n12 October 2026','9 October 2026 to\n12 October 2026']){
  test(`a date spanning a line break cannot select its last part: ${phrase}`,()=>{
    const result=analyze(`Please choose a session on ${phrase}.`);
    assert.ok(result.cards.every(card=>!reminderDefaultDate(card)));
    assert.ok(result.cards.some(card=>card.flags.some(flag=>flag.includes('line break'))));
    for(const span of [...result.cards,...result.background])assert.equal(result.source.slice(span.start,span.end),span.text);
  });
}
test('ordinary independent lines keep their own explicit full dates',()=>{
  const result=analyze('Please register by 9 October 2026.\nPlease pay by 12 October 2026.');
  assert.deepEqual(result.cards.map(reminderDefaultDate),['2026-10-09','2026-10-12']);
});
test('abbreviated dates retain ordinary time continuations',()=>{
  for(const phrase of ['9 Oct. 2026 at 10 am','Oct. 9, 2026 at 10 am']){
    const result=analyze(`Please attend on ${phrase}.`);
    assert.equal(result.sentences.length,1);assert.equal(reminderDefaultDate(result.cards[0]),'2026-10-09');
  }
});

// These assertions detect changing a list into an exclusive choice, or a range
// into endpoint choices. The quoted wording must remain intact in the draft.
for(const [phrase,warning,question] of [
  ['9 & 12 October 2026','lists multiple dates','Which of the listed dates'],
  ['9, 10 and 12 October 2026','lists multiple dates','Which of the listed dates'],
  ['October 9, 10 & 12, 2026','lists multiple dates','Which of the listed dates'],
  ['9 or 12 October 2026','gives alternatives','Which alternative date'],
  ['9, 10 or 12 October 2026','gives alternatives','Which alternative date'],
  ['9 and/or 12 October 2026','allows one or both','Should this step apply to one or both'],
  ['9 through 12 October 2026','gives a range','When within this range'],
  ['9–12 October 2026','gives a range','When within this range'],
  ['9 October 2026 through 12 October 2026','gives a range','When within this range'],
  ['9 Oct. 2026 or 12 Oct. 2026','gives alternatives','Which alternative date'],
  ['9 October 2026 and/or 12 November 2026','allows one or both','Should this step apply to one or both'],
  ['9 October 2026 & 9 October 2026','lists multiple dates','Which of the listed dates'],
  ['9/12 October 2026','uses a slash','What does the slash'],
  ['9 October 2026/12 November 2026','uses a slash','What does the slash'],
  ['9 October 2026–2027','gives a range','When within this range'],
  ['October 9, 2026 or 2027','gives alternatives','Which alternative date'],
])test(`keep date meaning in warnings and draft: ${phrase}`,()=>{
  const source=`Please choose a session on ${phrase}.`,result=analyze(source),card=result.cards[0];
  assert.ok(card.flags.some(flag=>flag.includes(warning)),JSON.stringify(card.flags));
  assert.ok(buildQuestions(result).includes(question));assert.ok(buildQuestions(result).includes(source));
  assert.equal(reminderDefaultDate(card),'');assert.deepEqual(dateSuggestions(card),[]);
  for(const date of card.dates)assert.equal(card.text.slice(date.start,date.end),date.text);
});
for(const [phrase,warning] of [
  ['2026-10-09–12','gives a range'],['2026-10-09/12','uses a slash'],
  ['2026-10-09 through 12','gives a range'],['2026-10-09 and/or 12','allows one or both'],
  ['2026-10-09 to 2026-10-12','gives a range'],['2026-10-09 or 2026-10-12','gives alternatives'],
])test(`do not silently suggest the first ISO endpoint: ${phrase}`,()=>{
  const card=analyze(`Please attend on ${phrase}.`).cards[0];
  assert.equal(card.dates.length,1);assert.equal(card.dates[0].text,phrase);
  assert.ok(card.flags.some(flag=>flag.includes(warning)));
  assert.equal(reminderDefaultDate(card),'');assert.deepEqual(dateSuggestions(card),[]);
});
for(const phrase of ['31 or 30 February 2026','April 30 & 31, 2026','29 February 2024 or 2025','2026-02-30–31'])test(`warn about invalid components in a date group: ${phrase}`,()=>{
  const result=analyze(`Please register on ${phrase}.`),card=result.cards[0];
  assert.ok(card.flags.some(flag=>flag.includes('calendar date is invalid')));
  assert.ok(buildQuestions(result).includes('correct full calendar date'));assert.equal(reminderDefaultDate(card),'');
});
test('mixed grouping keeps both list and range questions',()=>{
  const result=analyze('Please attend on 9–12, 15 October 2026.'),card=result.cards[0];
  assert.equal(card.dates[0].text,'9–12, 15 October 2026');
  assert.ok(buildQuestions(result).includes('When within this range'));
  assert.ok(buildQuestions(result).includes('Which of the listed dates'));
  assert.equal(reminderDefaultDate(card),'');
});
test('independent dates inside a sentence keep individual suggestions',()=>{
  const card=analyze('Please register by 9 October 2026; the workshop takes place on 12 October 2026.').cards[0];
  assert.deepEqual(dateSuggestions(card).map(s=>s.date),['2026-10-09','2026-10-12']);
  assert.equal(reminderDefaultDate(card),'');assert.ok(!card.flags.some(flag=>flag.startsWith('This date phrase')));
});
test('full-date choice lists do not turn their commas into additional list instructions',()=>{
  const result=analyze('Please register on 9 October 2026, 12 October 2026 or 15 November 2026.'),card=result.cards[0];
  assert.ok(card.flags.some(flag=>flag.includes('gives alternatives')));
  assert.ok(!card.flags.some(flag=>flag.includes('lists multiple dates')));
  assert.ok(!buildQuestions(result).includes('all of them'));assert.deepEqual(dateSuggestions(card),[]);
});
for(const phrase of ['2026-02-28–30','2026-04-30 & 31'])test(`detect invalid short ISO endpoint: ${phrase}`,()=>{
  const result=analyze(`Please attend on ${phrase}.`);
  assert.ok(result.cards[0].flags.some(flag=>flag.includes('calendar date is invalid')));
  assert.equal(reminderDefaultDate(result.cards[0]),'');
});
for(const [phrase,invalid] of [['2026-04-30 or 31 May 2026',false],['2026-10-09 or 31 November 2026',true]])test(`a named ISO alternative keeps its own month: ${phrase}`,()=>{
  const result=analyze(`Please attend on ${phrase}.`),card=result.cards[0];
  assert.deepEqual(card.dates.map(d=>d.text),[phrase.slice(0,10),phrase.slice(14)]);
  assert.equal(card.flags.some(flag=>flag.includes('calendar date is invalid')),invalid);
  assert.equal(reminderDefaultDate(card),'');assert.deepEqual(dateSuggestions(card),[]);
  assert.ok(card.flags.some(flag=>flag.includes('gives alternatives')));
});
for(const suffix of ['12 noon','12:30 pm','12 pm','12 people must attend'])test(`an ISO date does not swallow a following time or count: ${suffix}`,()=>{
  const card=analyze(`Please attend on 2026-10-09, ${suffix}.`).cards[0];
  assert.deepEqual(card.dates.map(d=>d.text),['2026-10-09']);
  assert.equal(reminderDefaultDate(card),'2026-10-09');
  assert.ok(!card.flags.some(flag=>flag.startsWith('This date phrase')));
});
for(const [phrase,warning] of [
  ['9 October 2026 through 12','gives a range'],['October 9, 2026 or 12','gives alternatives'],
  ['9 Oct. or 12 Oct. 2026','gives alternatives'],['9 Oct. through 12 Oct. 2026','gives a range'],
  ['9 Oct. and/or 12 Oct. 2026','allows one or both'],
])test(`trailing short or abbreviated endpoints cannot select the full endpoint: ${phrase}`,()=>{
  const source=`Please register on ${phrase}.`,result=analyze(source);
  assert.equal(result.sentences.length,1);
  assert.ok(result.cards[0].flags.some(flag=>flag.includes(warning)));
  assert.equal(reminderDefaultDate(result.cards[0]),'');assert.deepEqual(dateSuggestions(result.cards[0]),[]);
  assert.ok(buildQuestions(result).includes(source));
});
for(const connector of ['or','through','and/or','&','–'])test(`a date connector at the start of the next line blocks both reminders: ${connector}`,()=>{
  const result=analyze(`Please register on 9 October 2026\n${connector} 12 October 2026.`);
  assert.ok(result.cards.every(card=>!reminderDefaultDate(card)));
  assert.ok(result.cards.every(card=>dateSuggestions(card).length===0));
  assert.ok(result.cards.every(card=>card.flags.some(flag=>flag.includes('line break'))));
  for(const span of [...result.cards,...result.background])assert.equal(result.source.slice(span.start,span.end),span.text);
});
for(const phrase of ['2026-02-28 or 30–31 May 2026','28 February 2026 or 30–31 May 2026'])test(`a following named day group keeps its own month: ${phrase}`,()=>{
  const result=analyze(`Please register on ${phrase}.`),card=result.cards[0];
  assert.equal(card.dates.length,2);assert.equal(card.dates[1].text,'30–31 May 2026');
  assert.ok(!card.flags.some(flag=>flag.includes('calendar date is invalid')));
  assert.equal(reminderDefaultDate(card),'');assert.deepEqual(dateSuggestions(card),[]);
});
test('a month-first abbreviated endpoint stays in the alternative sentence',()=>{
  const source='Please register on 9 Oct. or Oct. 12, 2026.',result=analyze(source);
  assert.equal(result.sentences.length,1);assert.equal(result.cards[0].dates.length,2);
  assert.ok(result.cards[0].flags.some(flag=>flag.includes('gives alternatives')));
  assert.ok(buildQuestions(result).includes(source));assert.equal(reminderDefaultDate(result.cards[0]),'');
});
for(const phrase of ['9 October 2026 or 12, at 10 am','2026-10-09 or 12, at 10 am'])test(`punctuation after a short endpoint does not restore a default: ${phrase}`,()=>{
  const card=analyze(`Please register on ${phrase}.`).cards[0];
  assert.ok(card.flags.some(flag=>flag.includes('gives alternatives')));
  assert.equal(reminderDefaultDate(card),'');assert.deepEqual(dateSuggestions(card),[]);
});
for(const fullDate of ['2026-10-09','9 October 2026'])for(const count of ['12,000','12.5'])test(`formatted counts after ${fullDate} stay outside date extraction: ${count}`,()=>{
  const card=analyze(`Please attend on ${fullDate} and ${count} people will join.`).cards[0];
  assert.deepEqual(card.dates.map(d=>d.text),[fullDate]);assert.equal(reminderDefaultDate(card),'2026-10-09');
  assert.ok(!card.flags.some(flag=>flag.startsWith('This date phrase')));
});
