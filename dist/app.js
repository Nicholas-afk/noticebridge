import {analyzeNotice,validReferenceDate} from './engine.js?v=de007f231b9f';
import {dateSuggestions,reminderDefaultDate,validReminderDate,buildCalendar,buildQuestions} from './followup.js?v=70c973f503a4';
const $=id=>document.getElementById(id);
const examples={
  trip:{date:'2026-10-05',text:'Dear parents and carers,\n\nOur Year 6 museum visit will take place on 14 October 2026. The bus leaves school at 9 am and returns at 3 pm.\n\nPlease return the signed consent form to your teacher by 9 October 2026. Pay the $12 trip fee through the school portal by 9 October 2026. Bring a packed lunch and a bottle of water. Do not bring cash on the day of the visit.\n\nFor questions or accessibility needs, email trips@example.org.\n\nThank you for your support.'},
  library:{date:'2026-10-05',text:'Community Library — Creative Saturday\n\nThe workshop takes place at the community library on 17 October 2026 at 10 am. The session lasts for two hours.\n\nPlease register online by 12 October 2026. Bring your library card. You do not need to purchase any materials.\n\nIf you need help completing the form, call the library team. Our email address is library@example.org.\n\nEveryone is welcome at our community events.'},
  unclear:{date:'',text:'Community garden volunteer day\n\nThe activity takes place on Saturday at 10 am.\n\nPlease return the registration form by tomorrow. Bring gloves and a bottle of water. Payment is due by 08/10.\n\nIf you need an interpreter, contact the coordinator.\n\nThank you for helping our neighbourhood.'},
  dates:{date:'',text:'Community workshop notice\n\nPlease choose a session on 9 or 12 October 2026.\n\nPlease return the booking form by 31 November 2026. Please register online by 9 Oct. 2026.\n\nFor questions, email workshops@example.org.'}
};
let model=null,result=null,view='plan',selected=null,completed=new Set(),reminders=new Map(),calendarId='';
function node(tag,attrs={},text){const el=document.createElement(tag);for(const [key,value]of Object.entries(attrs)){if(key==='class')el.className=value;else el.setAttribute(key,value);}if(text!==undefined)el.textContent=text;return el;}
function isStale(){return !!result&&(result.source!==$('notice').value||result.anchorDate!==$('anchor-date').value);}
function reviewStatus(){if(result)$('result-status').textContent=`${completed.size} of ${result.cards.length} reviewed`;}
function count(){
  $('characters').textContent=`${$('notice').value.length.toLocaleString()} / 20,000 characters`;
  const stale=isStale();$('stale-note').hidden=!stale;$('export-button').disabled=stale;
  document.querySelectorAll('#cards input[type="checkbox"]').forEach(check=>check.disabled=stale);
  document.querySelectorAll('.followup-control').forEach(control=>control.disabled=stale);
  document.querySelectorAll('.reminder-row').forEach(updateReminderRow);
  $('calendar-button').disabled=stale||!reminders.size;
  $('questions-button').disabled=stale||!$('question-draft').value.trim();
  if(model)$('analyze-button').textContent=stale?'Update checklist':'Find instructions';
  if(stale)$('result-status').textContent='Update needed';else reviewStatus();
}
function scrollToPlan(){if(window.innerWidth<=700){$('result-panel').scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('plan-heading').setAttribute('tabindex','-1');$('plan-heading').focus({preventScroll:true});}}
function loadExample(name){if(!examples[name])throw new Error('Unknown example.');$('notice').value=examples[name].text;$('anchor-date').value=examples[name].date;count();return runAnalysis({focusResults:true});}
function setView(next){view=next;$('plan-view').hidden=next!=='plan';$('source-view').hidden=next!=='source';$('followup-view').hidden=next!=='followup';document.querySelectorAll('.view').forEach(b=>{b.classList.toggle('active',b.dataset.view===next);b.setAttribute('aria-pressed',String(b.dataset.view===next));});}
function updateReminderCount(){
  $('reminder-count').textContent=`${reminders.size} reminder${reminders.size===1?'':'s'} saved`;
  $('calendar-button').disabled=isStale()||!reminders.size;
}
function updateReminderRow(row){
  const date=row.querySelector('input[type="date"]'),confirmation=row.querySelector('input[type="checkbox"]'),save=row.querySelector('.reminder-save');
  save.disabled=isStale()||!validReminderDate(date.value)||!confirmation.checked||reminders.has(row.dataset.id);
  row.querySelector('.reminder-feedback').textContent=reminders.has(row.dataset.id)?`Saved for ${date.value}.`:confirmation.checked&&!validReminderDate(date.value)?'Choose a valid date before saving.':'';
}
function renderFollowup(){
  $('reminder-list').replaceChildren();
  const eligible=result.cards.filter(card=>['action','review','event'].includes(card.kind));
  if(!eligible.length)$('reminder-list').append(node('p',{class:'group-help'},'No instruction or event excerpts were found. Read the complete source for anything the model missed.'));
  for(const card of eligible){
    const i=result.cards.indexOf(card)+1,row=node('article',{class:'reminder-row','data-id':card.id});
    row.append(node('p',{class:'card-context'},`Excerpt ${i} · Sentence ${card.index+1}`),node('p',{class:'instruction'},card.text));
    card.flags.forEach(flag=>row.append(node('p',{class:'flag'},flag)));
    const suggestions=dateSuggestions(card),defaultDate=reminderDefaultDate(card),helpId=`date-help-${card.id}`;
    row.append(node('p',{id:helpId,class:'group-help'},defaultDate?`Suggested from “${suggestions[0].source}”. Check it before saving.`:card.dates.length>1?'More than one date reference appears. Confirm which date applies to this reminder.':'No full, unambiguous date in this sentence. Confirm a date with the sender before choosing one.'));
    const controls=node('div',{class:'reminder-fields'}),dateId=`reminder-${card.id}`;
    const date=node('input',{type:'date',id:dateId,min:'1000-01-01',max:'9998-12-31',class:'followup-control','aria-describedby':helpId});
    date.value=defaultDate;
    const field=node('div');field.append(node('label',{for:dateId},`Reminder date for excerpt ${i}`),date);
    const confirmLabel=node('label',{class:'reminder-confirm'}),confirmation=node('input',{type:'checkbox',class:'followup-control','aria-label':`I checked the date for excerpt ${i}`});
    confirmLabel.append(confirmation,document.createTextNode('I checked this date against the notice or with the sender.'));
    controls.append(field,confirmLabel);row.append(controls);
    const actions=node('div',{class:'reminder-actions'}),save=node('button',{class:'reminder-save',disabled:''},`Save reminder ${i}`),clear=node('button',{class:'text-button followup-control'},`Clear date ${i}`),source=node('button',{class:'source-button'},'Check source');
    source.addEventListener('click',()=>showSource(card.id));
    const withdraw=()=>{reminders.delete(card.id);updateReminderRow(row);updateReminderCount();};
    date.addEventListener('input',()=>{confirmation.checked=false;withdraw();});
    confirmation.addEventListener('change',withdraw);
    clear.addEventListener('click',()=>{date.value='';confirmation.checked=false;withdraw();date.focus();});
    save.addEventListener('click',()=>{
      if(isStale()||!validReminderDate(date.value)||!confirmation.checked)return;
      reminders.set(card.id,{id:card.id,date:date.value,confirmed:true});updateReminderRow(row);updateReminderCount();
      $('live-status').textContent=`Reminder for excerpt ${i} saved for ${date.value}. Download the calendar file to import it.`;
    });
    actions.append(save,clear,source);row.append(actions,node('p',{class:'reminder-feedback','aria-live':'polite'}));$('reminder-list').append(row);
  }
  $('question-draft').value=buildQuestions(result);updateReminderCount();
}
function showSource(id){selected=id;const card=result.cards.find(x=>x.id===id);const el=$('source-text');el.replaceChildren();if(card){el.append(document.createTextNode(result.source.slice(0,card.start)),node('mark',{},result.source.slice(card.start,card.end)),document.createTextNode(result.source.slice(card.end)));$('source-help').textContent=`Sentence ${card.index+1} is highlighted in the complete notice used for this checklist.`;}else el.textContent=result.source;setView('source');el.setAttribute('tabindex','-1');el.focus({preventScroll:true});el.querySelector('mark')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});}
function render(){
  $('empty-state').hidden=true;$('results').hidden=false;$('stale-note').hidden=true;
  const summary=result.summary;
  $('stats').replaceChildren();
  [[summary.actions,'instructions'],[summary.details,'details'],[summary.review,'with review notes']].forEach(([value,label],i)=>{if(i)$('stats').append(document.createTextNode(' · '));$('stats').append(node('strong',{},value),document.createTextNode(' '+label));});
  $('warnings').replaceChildren(...result.overallWarnings.map(t=>node('p',{class:'banner'},t)));
  reviewStatus();
  $('cards').replaceChildren();
  const names={action:'Instruction',event:'Detail',contact:'Contact',review:'Review'};
  const groups=[
    {kinds:['action'],title:'Instructions',help:'Read the exact wording, including restrictions and exceptions.'},
    {kinds:['review'],title:'Questions to check',help:'These sentences need a closer look before you rely on them.'},
    {kinds:['event','contact'],title:'Dates & contacts',help:'Supporting information from the same notice.'}
  ];
  groups.forEach(({kinds,title,help})=>{
    const members=result.cards.filter(card=>kinds.includes(card.kind));if(!members.length)return;
    const group=node('section',{class:'plan-group'}),heading=node('h3',{class:'group-heading'});
    heading.append(document.createTextNode(title),node('span',{},members.length));group.append(heading,node('p',{class:'group-help'},help));
    members.forEach(card=>{
    const i=result.cards.indexOf(card),article=node('article',{class:'card','data-card':card.id,tabindex:'-1'});
    const main=node('div',{class:'card-main'});
    main.append(node('p',{class:'card-context'},`Sentence ${card.index+1}${kinds.length>1?' · '+names[card.kind]:''}`),node('p',{class:'instruction'},card.text));
    const extracted=node('div',{class:'extracted'});
    [...card.dates,...card.times,...card.amounts].forEach(d=>extracted.append(node('span',{},d.text+(d.resolved?` → ${d.resolved}`:''))));
    if(extracted.childNodes.length)main.append(extracted);
    card.flags.forEach(flag=>main.append(node('p',{class:'flag'},flag)));
    const explanation=node('details');explanation.append(node('summary',{},'How this was identified'),node('p',{},`Local model category: ${names[card.prediction.label]||'Background'}. Model score: ${Math.round(card.prediction.score*100)}%. This is an uncalibrated category score, not a guarantee. Dates and amounts are copied from this sentence. The excerpt is an exact source extract.`));main.append(explanation);
    const bottom=node('div',{class:'card-bottom'}),label=node('label'),check=node('input',{type:'checkbox','aria-label':`Mark excerpt ${i+1} reviewed`});
    check.checked=completed.has(card.id);article.classList.toggle('checked',check.checked);
    check.addEventListener('change',()=>{if(check.checked)completed.add(card.id);else completed.delete(card.id);article.classList.toggle('checked',check.checked);reviewStatus();$('live-status').textContent=`Excerpt ${i+1} ${check.checked?'reviewed':'not reviewed'}. ${completed.size} of ${result.cards.length} reviewed.`;});label.append(check,document.createTextNode('Reviewed'));
    const evidence=node('button',{class:'source-button'},'Check source');evidence.addEventListener('click',()=>showSource(card.id));bottom.append(label,evidence);main.append(bottom);article.append(node('span',{class:'card-number','aria-hidden':'true'},String(i+1).padStart(2,'0')),main);group.append(article);
    });$('cards').append(group);
  });
  $('background-details').hidden=!result.background.length;$('background-summary').textContent=`Other sentences (${result.background.length})`;
  $('background-list').replaceChildren(...result.background.map(x=>node('p',{},x.text)));
  $('source-text').textContent=result.source;$('source-help').textContent='The complete notice used for this checklist. A selected excerpt will be highlighted.';renderFollowup();setView('plan');count();
  $('live-status').textContent=`Plan ready. ${summary.actions} instructions, ${summary.details} useful details, ${summary.review} cards need a check.`;
}
function runAnalysis({focusResults=false}={}){
  if(!model)throw new Error('The model is still loading.');
  $('input-error').textContent='';
  try{result=analyzeNotice($('notice').value,model,{anchorDate:$('anchor-date').value});completed=new Set();reminders.clear();calendarId=crypto.randomUUID();selected=null;render();if(focusResults)scrollToPlan();return {summary:result.summary,cards:result.cards.map(({id,text,kind,start,end,flags})=>({id,text,kind,start,end,flags}))};}
  catch(error){$('input-error').textContent=error.message;throw error;}
}
function exportPlan(){
  if(!result||isStale())return;
  const lines=['NOTICEBRIDGE — ACTION PLAN','',`Reference date: ${result.anchorDate||'Not supplied'}`,'','Review the original notice before acting. This prototype may miss or misclassify instructions.',''];
  result.cards.forEach((card,i)=>{lines.push(`${completed.has(card.id)?'[x]':'[ ]'} ${i+1}. ${card.text}`,`    Category: ${card.kind}`,...card.flags.map(f=>'    Check: '+f),'');});
  if(reminders.size){lines.push('READER-CONFIRMED ALL-DAY REMINDERS');for(const entry of reminders.values())lines.push(`${entry.date}: ${result.cards.find(card=>card.id===entry.id).text}`);lines.push('');}
  lines.push('ORIGINAL NOTICE',result.source);
  requestDownload(lines.join('\n'),'text/plain;charset=utf-8','noticebridge-plan.txt');$('live-status').textContent='Text-file download requested. It includes the original notice.';
}
function requestDownload(text,type,name){const url=URL.createObjectURL(new Blob([text],{type})),link=node('a',{href:url,download:name});document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('notice').addEventListener('input',count);$('anchor-date').addEventListener('input',count);
$('analyze-button').addEventListener('click',()=>{try{runAnalysis({focusResults:true});}catch{}});
document.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>{try{loadExample(b.dataset.example);}catch{}}));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('clear-button').addEventListener('click',()=>{
  $('notice').value='';$('anchor-date').value='';result=null;selected=null;completed.clear();reminders.clear();calendarId='';$('question-draft').value='';updateReminderCount();
  for(const id of ['cards','source-text','background-list','warnings','stats','reminder-list'])$(id).replaceChildren();
  $('results').hidden=true;$('empty-state').hidden=false;$('input-error').textContent='';$('result-status').textContent='No notice yet';
  setView('plan');count();$('notice').focus();$('live-status').textContent='Notice and checklist cleared.';
});
$('back-to-plan').addEventListener('click',()=>{setView('plan');const card=selected?document.querySelector(`[data-card="${selected}"]`):$('plan-heading');card?.focus({preventScroll:true});card?.scrollIntoView({block:'nearest',behavior:'instant'});});
$('export-button').addEventListener('click',exportPlan);
$('question-draft').addEventListener('input',count);
$('questions-button').addEventListener('click',()=>{if(!result||isStale()||!$('question-draft').value.trim())return;requestDownload($('question-draft').value,'text/plain;charset=utf-8','noticebridge-questions.txt');$('live-status').textContent='Questions-file download requested. Review it before sharing; nothing has been sent.';});
$('calendar-button').addEventListener('click',()=>{if(!result||isStale()||!reminders.size)return;try{requestDownload(buildCalendar(result,[...reminders.values()],{uidPrefix:calendarId}),'text/calendar;charset=utf-8','noticebridge-reminders.ics');$('live-status').textContent='Calendar-file download requested. Import it yourself; your calendar account has not been changed.';}catch(error){$('live-status').textContent=error.message;}});
for(const id of ['about-button','model-button'])$(id).addEventListener('click',()=>$('about-dialog').showModal());
$('close-dialog').addEventListener('click',()=>$('about-dialog').close());
async function registerTools(){
  const context=document.modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const registered=[{
    name:'analyze_notice',title:'Find next steps in a notice',
    description:'Analyze supplied English notice text locally and update the visible action plan. Does not send or save the notice. Returns source-linked sentence extracts and review flags. Not legal, medical or emergency guidance.',
    inputSchema:{type:'object',properties:{text:{type:'string',minLength:1,maxLength:20000},anchorDate:{type:'string',description:'Optional issue date in YYYY-MM-DD format; only resolves today or tomorrow.'}},required:['text'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:true},
    execute(input){if(!input||typeof input.text!=='string'||!input.text.trim()||input.text.length>20000)throw new Error('Provide a notice of 1–20,000 characters.');if(input.anchorDate!==undefined&&(typeof input.anchorDate!=='string'||(input.anchorDate&&!validReferenceDate(input.anchorDate))))throw new Error('Invalid reference date.');const previous=result;try{$('notice').value=input.text;$('anchor-date').value=input.anchorDate||'';count();return runAnalysis();}catch(error){result=previous;throw error;}}
  },{
    name:'get_notice_plan',title:'Read the current notice plan',description:'Read the current source-linked plan, review flags and checked cards. Returns empty if no notice has been analyzed.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},
    execute(){return result?{summary:result.summary,stale:result.source!==$('notice').value||result.anchorDate!==$('anchor-date').value,cards:result.cards.map(({id,text,kind,start,end,flags})=>({id,text,kind,start,end,flags,checked:completed.has(id)}))}:{empty:true};}
  }];
  for(const tool of registered){try{await context.registerTool(tool,{signal:lifecycle.signal});}catch(error){console.warn('Optional browser tools unavailable.',error.message);}}
}
try{
  const response=await fetch('./model.json?v=b85c00fb1760');if(!response.ok)throw new Error('Model file unavailable.');model=await response.json();
  $('analyze-button').disabled=false;$('analyze-button').textContent='Find instructions';
  document.querySelectorAll('[data-example]').forEach(button=>button.disabled=false);
  $('model-facts').textContent=`TF–IDF + logistic regression · ${model.training_examples} authored training sentences · ${model.holdout_examples} separate synthetic test sentences · ${Math.round(model.accuracy*1000)/10}% sentence-category accuracy on that test set. Two of twelve test instructions were missed. This is a prototype benchmark, not real-world validation.`;
  await registerTools();
}catch(error){$('analyze-button').textContent='Model unavailable';$('input-error').textContent='The local model could not load. Refresh the page to try again.';}
count();
