import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const html=await readFile(new URL('./dist/index.html',import.meta.url),'utf8');
const model=await readFile(new URL('./dist/model.json',import.meta.url),'utf8');
let sequence=0;
async function app(){
  const dom=new JSDOM(html,{url:'https://noticebridge.test/'});
  globalThis.window=dom.window;globalThis.document=dom.window.document;
  globalThis.fetch=async()=>new Response(model,{headers:{'Content-Type':'application/json'}});
  dom.window.matchMedia=()=>({matches:true});
  dom.window.HTMLElement.prototype.scrollIntoView=function(){};
  const downloads=[];
  URL.createObjectURL=blob=>{downloads.push({blob});return 'blob:test';};
  URL.revokeObjectURL=()=>{};
  dom.window.document.addEventListener('click',event=>{if(event.target.tagName==='A'&&event.target.download){event.preventDefault();downloads.at(-1).filename=event.target.download;}});
  await import(new URL(`./dist/app.js?workflow=${sequence++}`,import.meta.url));
  const $=id=>document.getElementById(id);
  const input=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
  const check=label=>{const el=document.querySelector(`input[aria-label="${label}"]`);el.checked=true;el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
  return {dom,$,input,check,downloads};
}
test('repeated unchanged analysis preserves reader work and reminder identifiers',async()=>{
  const {$,input,check,downloads}=await app();
  input('notice','Please return the form by 9 October 2026.');$('analyze-button').click();
  check('Mark excerpt 1 reviewed');check('I checked this date against the notice or with the sender. Excerpt 1.');document.querySelector('.reminder-save').click();
  input('question-draft','Reader edited: please confirm the venue.');$('calendar-button').click();
  $('analyze-button').click();
  assert.equal(document.querySelector('#cards input').checked,true,'Unchanged analysis lost the review mark');
  assert.equal($('reminder-count').textContent,'1 reminder saved','Unchanged analysis lost the saved reminder');
  assert.equal($('question-draft').value,'Reader edited: please confirm the venue.');
  $('calendar-button').click();
  const uid=text=>text.match(/^UID:(.+)$/m)[1];
  assert.equal(uid(await downloads[0].blob.text()),uid(await downloads[1].blob.text()));
});
test('source and issue-date changes block old exports and announce stale state',async()=>{
  const {$,input,check}=await app();input('notice','Please return the form by 9 October 2026.');$('analyze-button').click();
  check('I checked this date against the notice or with the sender. Excerpt 1.');document.querySelector('.reminder-save').click();
  input('anchor-date','2026-10-06');
  assert.equal($('stale-note').hidden,false);assert.equal($('calendar-button').disabled,true);assert.equal($('export-button').disabled,true);
  assert.match($('live-status').textContent,/changed|update|older/i,'Source change was not announced');
  input('notice','Revised notice: Please return the form by 12 October 2026.');$('analyze-button').click();
  assert.equal($('reminder-count').textContent,'0 reminders saved');assert.equal(document.querySelector('#cards input').checked,false);
  assert.equal(document.querySelector('#reminder-list input[type=checkbox]').checked,false);assert.equal($('calendar-button').disabled,true);
});
test('source navigation from reminders returns to the originating control',async()=>{
  const {$,input}=await app();input('notice','Please return the form by 9 October 2026.');$('analyze-button').click();
  document.querySelector('[data-view=followup]').click();
  const source=document.querySelector('#reminder-list .source-button');source.click();
  assert.equal($('source-text').querySelector('mark').textContent,'Please return the form by 9 October 2026.');
  $('back-to-plan').click();
  assert.equal($('followup-view').hidden,false,'Source navigation abandoned the reminders view');
  assert.equal(document.activeElement,source,'Keyboard focus did not return to its originating control');
});
test('validation feedback is associated with the affected fields',async()=>{
  const {$,input,check}=await app();$('analyze-button').click();
  assert.equal($('notice').getAttribute('aria-invalid'),'true');
  assert.ok($('notice').getAttribute('aria-describedby').split(' ').includes('input-error'));
  input('notice','Please return the form tomorrow.');$('analyze-button').click();
  check('I checked this date against the notice or with the sender. Excerpt 1.');
  const date=document.querySelector('#reminder-list input[type=date]');
  const feedback=document.querySelector('.reminder-feedback');
  assert.equal(date.getAttribute('aria-invalid'),'true');assert.ok(feedback.textContent.length);
  assert.ok(date.getAttribute('aria-describedby').split(' ').includes(feedback.id));
});
test('UI downloads retain source, reader marks, edited questions and confirmed all-day dates',async()=>{
  const {$,input,check,downloads}=await app();
  const source='Please return the form on 9 & 12 October 2026.\nBring lunch; water, a £5 fee and a \\ folder. 親子🌿';
  input('notice',source);$('analyze-button').click();check('Mark excerpt 1 reviewed');
  input('reminder-sentence-0','2026-10-09');check('I checked this date against the notice or with the sender. Excerpt 1.');document.querySelector('.reminder-save').click();
  const draft='Reader draft; a comma, backslash \\ and\nsecond line: 親子🌿';input('question-draft',draft);
  $('export-button').click();$('questions-button').click();$('calendar-button').click();
  assert.deepEqual(downloads.map(x=>x.filename),['noticebridge-plan.txt','noticebridge-questions.txt','noticebridge-reminders.ics']);
  assert.equal(downloads[0].blob.type,'text/plain;charset=utf-8');assert.equal(downloads[2].blob.type,'text/calendar;charset=utf-8');
  const plan=await downloads[0].blob.text();assert.ok(plan.includes('[x] 1. Please return the form on 9 & 12 October 2026.'));assert.ok(plan.endsWith(source));assert.ok(plan.includes('2026-10-09: Please return the form on 9 & 12 October 2026.'));assert.match(plan,/lists multiple dates/);
  assert.equal(await downloads[1].blob.text(),draft);
  const calendar=(await downloads[2].blob.text()).replace(/\r\n /g,'');assert.ok(calendar.includes('DTSTART;VALUE=DATE:20261009\r\nDTEND;VALUE=DATE:20261010'));assert.ok(calendar.includes('Please return the form on 9 & 12 October 2026.'));assert.ok(calendar.includes('lists multiple dates'));assert.ok(!calendar.includes('VALARM'));assert.ok(!calendar.includes('TZID'));
});
test('toolbar source navigation remembers the current view rather than an older excerpt visit',async()=>{
  const {$,input}=await app();input('notice','Please return the form by 9 October 2026.');$('analyze-button').click();
  document.querySelector('#cards .source-button').click();$('back-to-plan').click();
  document.querySelector('[data-view=followup]').click();
  const toolbarSource=document.querySelector('[data-view=source]');toolbarSource.click();
  $('back-to-plan').click();
  assert.equal($('followup-view').hidden,false,'Toolbar Source used an older navigation origin');
  assert.equal(document.activeElement,toolbarSource);
});
test('failed source update keeps paused work and reversion clears obsolete validation errors',async()=>{
  const {$,input,check}=await app();const source='Please return the form by 9 October 2026.';
  input('notice',source);$('analyze-button').click();check('Mark excerpt 1 reviewed');check('I checked this date against the notice or with the sender. Excerpt 1.');document.querySelector('.reminder-save').click();
  input('question-draft','Reader edited draft.');input('notice','');$('analyze-button').click();
  assert.equal($('calendar-button').disabled,true);assert.equal($('reminder-count').textContent,'1 reminder saved');assert.equal(document.querySelector('#cards input').checked,true);assert.equal($('question-draft').value,'Reader edited draft.');assert.ok($('input-error').textContent);
  input('notice',source);
  assert.equal($('input-error').textContent,'','Restoring valid source left an obsolete validation error');
  assert.notEqual($('notice').getAttribute('aria-invalid'),'true');
  assert.equal($('stale-note').hidden,true);assert.equal($('calendar-button').disabled,false);assert.equal($('questions-button').disabled,false);
  $('analyze-button').click();assert.equal($('reminder-count').textContent,'1 reminder saved');assert.equal($('question-draft').value,'Reader edited draft.');
});
test('editing a saved date announces withdrawal rather than leaving a saved-status message',async()=>{
  const {$,input,check}=await app();input('notice','Please return the form by 9 October 2026.');$('analyze-button').click();check('I checked this date against the notice or with the sender. Excerpt 1.');document.querySelector('.reminder-save').click();
  input('reminder-sentence-0','2026-10-12');
  assert.equal($('reminder-count').textContent,'0 reminders saved');assert.equal($('calendar-button').disabled,true);
  assert.match($('live-status').textContent,/withdraw|removed|no longer saved/i,'Withdrawal left an obsolete saved announcement');
});
test('confirmation accessible names contain their visible labels for voice control',async()=>{
  const {input,$}=await app();input('notice','Please return the form by 9 October 2026.');$('analyze-button').click();
  const label=document.querySelector('.reminder-confirm'),checkbox=label.querySelector('input');
  assert.ok(checkbox.getAttribute('aria-label').toLowerCase().includes(label.textContent.toLowerCase()),'Accessible name omitted the visible confirmation label');
});
