import assert from 'node:assert/strict';
const helpers=await import('./dist/followup.js').catch(()=>({}));
assert.equal(typeof helpers.dateSuggestions,'function','The date suggestion helper must exist.');
const {dateSuggestions,buildCalendar,buildQuestions}=helpers;
const dateCard=(values)=>({dates:values.map(text=>({text}))});
for(const [input,want] of [
  ['9 October 2026','2026-10-09'],['October 9th, 2026','2026-10-09'],
  ['Feb 29, 2024','2024-02-29'],['2026-12-31','2026-12-31'],
  ['29 February 2026',null],['31 April 2026',null],['9 October',null],
  ['08/10/2026',null],['Saturday',null],['tomorrow',null],['2026-99-99',null],
])assert.deepEqual(dateSuggestions(dateCard([input])),want?[{date:want,source:input}]:[],input);
assert.deepEqual(dateSuggestions({dates:[{text:'tomorrow',resolved:'2026-10-06'}]}),[{date:'2026-10-06',source:'tomorrow'}]);
assert.equal(dateSuggestions(dateCard(['9 October 2026','12 October 2026'])).length,2);
assert.equal(dateSuggestions(dateCard(['9 October 2026','2026-10-09'])).length,1);
const card={id:'sentence-0',index:0,kind:'action',text:'Return the form; bring lunch, water and a £5 fee.\\',flags:['Confirm the date.']};
const result={cards:[card]};
const opts={now:new Date('2026-10-05T02:03:04Z'),uidPrefix:'fixture'};
const entry=(date)=>({id:'sentence-0',date,confirmed:true});
const unfold=s=>s.replace(/\r\n /g,'');
const calendar=buildCalendar(result,[entry('2026-12-31')],opts),plain=unfold(calendar);
assert.ok(plain.includes('DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101'));
assert.ok(plain.includes('DTSTAMP:20261005T020304Z'));
assert.ok(plain.includes('Return the form\\; bring lunch\\, water and a £5 fee.\\\\'));
assert.ok(plain.includes('Confirm the date.'));
assert.equal((plain.match(/BEGIN:VEVENT/g)||[]).length,1);
assert.ok(!plain.includes('VALARM'));
assert.ok(unfold(buildCalendar(result,[entry('2024-02-29')],opts)).includes('DTEND;VALUE=DATE:20240301'));
const long={...card,text:'親子🌿'.repeat(80)+'\r\nBEGIN:VEVENT\nSUMMARY:injection'};
const folded=buildCalendar({cards:[long]},[entry('2026-10-09')],opts);
for(const line of folded.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75,'UTF-8 line too long');
assert.equal((folded.split('\r\n').filter(l=>l==='BEGIN:VEVENT')).length,1);
assert.ok(unfold(folded).includes('親子🌿'.repeat(80)+'\\nBEGIN:VEVENT\\nSUMMARY:injection'));
for(const entries of [[],[entry('2026-02-29')],[entry('2026-04-31')],[{...entry('2026-10-09'),confirmed:false}],[{...entry('2026-10-09'),id:'unknown'}],[entry('2026-10-09'),entry('2026-10-09')]])assert.throws(()=>buildCalendar(result,entries,opts));
assert.throws(()=>buildCalendar(result,[entry('2026-10-09')],{...opts,uidPrefix:'bad\r\nBEGIN:VEVENT'}));
const flagged={...card,text:'Please return the form by tomorrow.',flags:['A relative date needs the date this notice was issued.']};
const questions=buildQuestions({cards:[flagged]});
assert.ok(questions.includes(flagged.text));assert.ok(questions.includes('issued'));
assert.ok(!buildQuestions({cards:[{...card,flags:[]}]}).includes(card.text));
assert.ok(buildQuestions({cards:[{...card,kind:'review',flags:[]}]}).includes('require'));
console.log('PASS: conservative date suggestions, calendar rollovers, escaping, UTF-8 folding, export rejection paths and source-linked questions.');
