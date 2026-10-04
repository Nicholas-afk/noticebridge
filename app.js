import {analyzeNotice,validReferenceDate} from './engine.js';
const $=id=>document.getElementById(id);
const examples={
  trip:{date:'2026-10-05',text:'Dear parents and carers,\n\nOur Year 6 museum visit will take place on 14 October 2026. The bus leaves school at 9 am and returns at 3 pm.\n\nPlease return the signed consent form to your teacher by 9 October 2026. Pay the $12 trip fee through the school portal by 9 October 2026. Bring a packed lunch and a bottle of water. Do not bring cash on the day of the visit.\n\nFor questions or accessibility needs, email trips@example.org.\n\nThank you for your support.'},
  library:{date:'2026-10-05',text:'Community Library — Creative Saturday\n\nThe workshop takes place at the community library on 17 October 2026 at 10 am. The session lasts for two hours.\n\nPlease register online by 12 October 2026. Bring your library card. You do not need to purchase any materials.\n\nIf you need help completing the form, call the library team. Our email address is library@example.org.\n\nEveryone is welcome at our community events.'},
  unclear:{date:'',text:'Community garden volunteer day\n\nThe activity takes place on Saturday at 10 am.\n\nPlease return the registration form by tomorrow. Bring gloves and a bottle of water. Payment is due by 08/10.\n\nIf you need an interpreter, contact the coordinator.\n\nThank you for helping our neighbourhood.'}
};
let model=null,result=null,view='plan',selected=null,completed=new Set();
function node(tag,attrs={},text){const el=document.createElement(tag);for(const [key,value]of Object.entries(attrs)){if(key==='class')el.className=value;else el.setAttribute(key,value);}if(text!==undefined)el.textContent=text;return el;}
function count(){ $('characters').textContent=`${$('notice').value.length.toLocaleString()} / 20,000 characters`;if(result){$('stale-note').hidden=result.source===$('notice').value&&result.anchorDate===$('anchor-date').value;}}
function loadExample(name){if(!examples[name])throw new Error('Unknown example.');$('notice').value=examples[name].text;$('anchor-date').value=examples[name].date;count();return runAnalysis();}
function setView(next){view=next;$('plan-view').hidden=next!=='plan';$('source-view').hidden=next!=='source';document.querySelectorAll('.view').forEach(b=>{b.classList.toggle('active',b.dataset.view===next);b.setAttribute('aria-pressed',String(b.dataset.view===next));});}
function showSource(id){selected=id;const card=result.cards.find(x=>x.id===id);const el=$('source-text');el.replaceChildren();if(card){el.append(document.createTextNode(result.source.slice(0,card.start)),node('mark',{},result.source.slice(card.start,card.end)),document.createTextNode(result.source.slice(card.end)));}else el.textContent=result.source;setView('source');el.setAttribute('tabindex','-1');el.focus({preventScroll:true});el.querySelector('mark')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
function render(){
  $('empty-state').hidden=true;$('results').hidden=false;$('stale-note').hidden=true;
  const summary=result.summary;
  $('stats').replaceChildren(...[[summary.actions,'instructions'],[summary.details,'useful details'],[summary.review,'need a check']].map(([value,label])=>{const s=node('div',{class:'stat'});s.append(node('strong',{},value),node('span',{},label));return s;}));
  $('warnings').replaceChildren(...result.overallWarnings.map(t=>node('p',{class:'banner'},t)));
  $('result-status').textContent='Linked to original text';
  $('cards').replaceChildren();
  const names={action:'Instruction',event:'Detail',contact:'Contact',review:'Review'};
  result.cards.forEach((card,i)=>{
    const article=node('article',{class:'card','data-card':card.id});
    const main=node('div',{class:'card-main'}),heading=node('div',{class:'card-heading'}),title=node('div',{class:'card-title'});
    title.append(node('span',{class:'card-number'},String(i+1).padStart(2,'0')),node('h3',{},card.title));heading.append(title,node('span',{class:'kind-tag'},names[card.kind]));main.append(heading,node('p',{class:'instruction'},card.text));
    const chips=node('div',{class:'chips'});
    [...card.dates,...card.times,...card.amounts].forEach(d=>chips.append(node('span',{class:'chip'},d.text+(d.resolved?` (${d.resolved})`:''))));
    if(chips.childNodes.length)main.append(chips);
    card.flags.forEach(flag=>main.append(node('p',{class:'flag'},flag)));
    const explanation=node('details');explanation.append(node('summary',{},'Why this card?'),node('p',{},`Local model category: ${names[card.prediction.label]||'Background'}. Model score: ${Math.round(card.prediction.score*100)}%. This is an uncalibrated category score, not a guarantee. Dates and amounts are copied from this sentence. The card text is an exact source extract.`));main.append(explanation);
    const bottom=node('div',{class:'card-bottom'}),label=node('label'),check=node('input',{type:'checkbox','aria-label':`Mark card ${i+1} checked`});
    check.checked=completed.has(card.id);article.classList.toggle('checked',check.checked);
    check.addEventListener('change',()=>{if(check.checked)completed.add(card.id);else completed.delete(card.id);article.classList.toggle('checked',check.checked);$('live-status').textContent=`Card ${i+1} ${check.checked?'checked':'unchecked'}.`;});label.append(check,document.createTextNode('Checked'));
    const evidence=node('button',{class:'source-button'},'Check source');evidence.addEventListener('click',()=>showSource(card.id));bottom.append(label,evidence);article.append(main,bottom);$('cards').append(article);
  });
  $('background-details').hidden=!result.background.length;$('background-summary').textContent=`Other sentences (${result.background.length})`;
  $('background-list').replaceChildren(...result.background.map(x=>node('p',{},x.text)));
  $('source-text').textContent=result.source;setView('plan');
  $('live-status').textContent=`Plan ready. ${summary.actions} instructions, ${summary.details} useful details, ${summary.review} cards need a check.`;
}
function runAnalysis(){
  if(!model)throw new Error('The model is still loading.');
  $('input-error').textContent='';
  try{result=analyzeNotice($('notice').value,model,{anchorDate:$('anchor-date').value});completed=new Set();selected=null;render();return {summary:result.summary,cards:result.cards.map(({id,text,kind,start,end,flags})=>({id,text,kind,start,end,flags}))};}
  catch(error){$('input-error').textContent=error.message;throw error;}
}
function exportPlan(){
  if(!result)return;
  const lines=['NOTICEBRIDGE — ACTION PLAN','',`Reference date: ${result.anchorDate||'Not supplied'}`,'','Review the original notice before acting. This prototype may miss or misclassify instructions.',''];
  result.cards.forEach((card,i)=>{lines.push(`${completed.has(card.id)?'[x]':'[ ]'} ${i+1}. ${card.text}`,`    Category: ${card.kind}`,...card.flags.map(f=>'    Check: '+f),'');});
  lines.push('ORIGINAL NOTICE',result.source);
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'})),link=node('a',{href:url,download:'noticebridge-plan.txt'});document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('live-status').textContent='Plan saved as a text file.';
}
$('notice').addEventListener('input',count);$('anchor-date').addEventListener('input',count);
$('analyze-button').addEventListener('click',()=>{try{runAnalysis();}catch{}});
document.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>{try{loadExample(b.dataset.example);}catch{}}));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('clear-button').addEventListener('click',()=>{$('notice').value='';$('anchor-date').value='';result=null;completed.clear();$('results').hidden=true;$('empty-state').hidden=false;$('input-error').textContent='';$('result-status').textContent='Ready when you are';count();$('notice').focus();$('live-status').textContent='Notice cleared.';});
$('export-button').addEventListener('click',exportPlan);
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
  const response=await fetch('./model.json');if(!response.ok)throw new Error('Model file unavailable.');model=await response.json();
  $('analyze-button').disabled=false;$('analyze-button').textContent='Find my next steps';
  $('model-facts').textContent=`TF–IDF + logistic regression · ${model.training_examples} authored training sentences · ${model.holdout_examples} separate synthetic test sentences · ${Math.round(model.accuracy*1000)/10}% sentence-category accuracy on that test set. Two of twelve test instructions were missed. This is a prototype benchmark, not real-world validation.`;
  await registerTools();
}catch(error){$('analyze-button').textContent='Model unavailable';$('input-error').textContent='The local model could not load. Refresh the page to try again.';}
count();
