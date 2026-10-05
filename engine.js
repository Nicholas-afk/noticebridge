// NoticeBridge inference and source-span extraction. No network calls in this module.
export function splitSentences(text) {
  const spans = []; let start = 0;
  function emit(end) {
    let a=start,b=end; while(a<b && /\s/.test(text[a]))a++; while(b>a && /\s/.test(text[b-1]))b--;
    if(b>a) spans.push({text:text.slice(a,b),start:a,end:b}); start=end;
  }
  for(let i=0;i<text.length;i++) {
    const c=text[i], previous=text.slice(Math.max(start,i-8),i+1);
    if(c==='\n')emit(i+1);
    else if(/[.!?]/.test(c) && (i===text.length-1 || /\s/.test(text[i+1])) && !/\b(?:Mr|Mrs|Ms|Dr|Prof|St|e\.g|i\.e)\.$/i.test(previous)
      && !(/\b(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.$/i.test(previous) && /^\s+\d/.test(text.slice(i+1))))emit(i+1);
  }
  emit(text.length); return spans;
}

export function classify(text, model) {
  const words=text.toLowerCase().match(/\b[a-zA-Z][a-zA-Z]+\b/g)||[];
  const terms=[...words,...words.slice(0,-1).map((w,i)=>w+' '+words[i+1])];
  const counts=new Map();
  for(const term of terms){const i=model.vocabulary[term];if(i!==undefined)counts.set(i,(counts.get(i)||0)+1);}
  const features=[...counts].map(([i,n])=>[i,(1+Math.log(n))*model.idf[i]]);
  const norm=Math.sqrt(features.reduce((sum,[,v])=>sum+v*v,0));
  const logits=model.weights.map((row,k)=>model.bias[k]+features.reduce((sum,[i,v])=>sum+row[i]*(norm?v/norm:0),0));
  const highest=Math.max(...logits),exp=logits.map(x=>Math.exp(x-highest)),total=exp.reduce((a,b)=>a+b,0);
  const probabilities=Object.fromEntries(model.classes.map((label,k)=>[label,exp[k]/total]));
  const k=logits.indexOf(highest);
  return {label:model.classes[k],score:exp[k]/total,probabilities,knownFeatures:features.length};
}

const MONTHS='January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';
const MONTH_TOKEN=`(?:${MONTHS})\\b\\.?`;
const DAY='\\d{1,2}(?:st|nd|rd|th)?\\b';
const DAY_SEPARATOR='(?:\\s*[-–—]\\s*|\\s+(?:to|and|or)\\s+|\\s*,\\s*(?:(?:and|or)\\s+)?)';
const DAY_LIST=`${DAY}(?:${DAY_SEPARATOR}${DAY})*`;
const DATE_RE=new RegExp(`\\b(?:${DAY_LIST}\\s+${MONTH_TOKEN}(?:,?\\s+\\d{4}\\b)?|${MONTH_TOKEN}\\s+${DAY_LIST}(?:,?\\s+\\d{4}\\b)?|\\d{4}-\\d{2}-\\d{2}\\b|\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?\\b|(?:next\\s+|this\\s+)?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\\b|today\\b|tomorrow\\b|next week\\b|within\\s+\\d+\\s+days?\\b)`,'gi');
const NAMED_MONTH_RE=new RegExp(`\\b(?:${MONTHS})\\b`,'i');
const GROUPED_DAY_RE=new RegExp(`\\b${DAY}${DAY_SEPARATOR}${DAY}`,'i');
function namedDateParts(value){
  const dayFirst=value.match(new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS})\\.?[,]?\\s+(\\d{4})$`,'i'));
  const monthFirst=value.match(new RegExp(`^(${MONTHS})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(\\d{4})$`,'i'));
  if(!dayFirst && !monthFirst)return null;
  return {day:dayFirst?dayFirst[1]:monthFirst[2],month:dayFirst?dayFirst[2]:monthFirst[1],year:(dayFirst||monthFirst)[3]};
}
const TIME_RE=/\b(?:\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)|noon|midnight)\b/gi;
function matches(text,re){return [...text.matchAll(re)].map(x=>({text:x[0],start:x.index,end:x.index+x[0].length}));}
function anchorRelative(value,anchor){
  if(!/^(today|tomorrow)$/i.test(value)||!anchor)return null;
  const d=new Date(anchor+'T12:00:00Z');if(Number.isNaN(d.getTime()))return null;
  if(value.toLowerCase()==='tomorrow')d.setUTCDate(d.getUTCDate()+1);
  return d.toISOString().slice(0,10);
}
export function validReferenceDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(value+'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===value;
}
// Only a single, explicit, valid full date can become a reminder suggestion.
// Grouped days, partial dates, numeric date formats and weekdays remain unresolved.
export function fullDateISO(value){
  if(typeof value!=='string')return null;
  const text=value.trim();let date=text;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text)){
    const parts=namedDateParts(text);if(!parts)return null;
    const month=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(parts.month.slice(0,3).toLowerCase())+1;
    date=`${parts.year}-${String(month).padStart(2,'0')}-${parts.day.padStart(2,'0')}`;
  }
  return validReferenceDate(date)?date:null;
}
const actionCues=/^(?:please\s+)?(?:you\s+(?:must|need to|will need to)|parents?\s+(?:must|need to)|students?\s+(?:must|should)|do not|don't|return|submit|complete|bring|pay|register|reserve|hand|ensure|make sure|remember|sign|book|wear|collect|upload|renew|confirm|send|keep|wait|choose)\b/i;
function titleFor(text,label){
  if(/\b(do not|don't|not required|no payment|do not need|do not have to)\b/i.test(text))return 'A restriction or exception';
  if(label==='event')return 'When or where';
  if(label==='contact')return 'Where to ask for help';
  if(/\b(consent|permission|sign|reply|form|slip)\b/i.test(text))return 'Complete the paperwork';
  if(/\b(pay|fee|payment|cost|money)\b/i.test(text))return 'Check the payment';
  if(/\b(bring|pack|take|wear|carry)\b/i.test(text))return 'Prepare what you need';
  if(/\b(register|book|reserve|attend|confirm)\b/i.test(text))return 'Confirm your place';
  if(/\b(deadline|due|closes|final date)\b/i.test(text))return 'Check the deadline';
  return 'An instruction to review';
}

export function analyzeNotice(text,model,{anchorDate=''}={}){
  if(typeof text!=='string'||!text.trim())throw new Error('Paste a notice first.');
  if(text.length>20000)throw new Error('Please use a notice of 20,000 characters or fewer.');
  if(anchorDate && !validReferenceDate(anchorDate))throw new Error('Use a valid reference date.');
  const sentences=splitSentences(text),cards=[],background=[];
  const overallWarnings=[];
  if(/[^\x00-\x7F]/.test(text) && !/[a-z]{3}/i.test(text))overallWarnings.push('This model was trained on English notices. It may not understand this text.');
  for(const [index,span] of sentences.entries()){
    const prediction=classify(span.text,model),dates=matches(span.text,DATE_RE),times=matches(span.text,TIME_RE);
    const amounts=matches(span.text,/(?:[$£€]\s?\d+(?:[.,]\d{2})?|\b(?:HKD|USD|GBP|EUR)\s?\d+(?:[.,]\d{2})?)/gi);
    const contacts=matches(span.text,/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|https?:\/\/[^\s)]+/g);
    const flags=[]; let kind=prediction.label;
    // Conservative rule gate supplements ML, preserving the model's original decision.
    if(prediction.label!=='action' && actionCues.test(span.text)){
      kind='review';flags.push('This sounds like an instruction, but the model assigned another category.');
    }else if(prediction.score<0.55 || prediction.knownFeatures<2){
      kind='review';flags.push('The category is uncertain. Check this sentence.');
    }
    if(kind==='background' && (dates.length||contacts.length)){kind='review';flags.push('This sentence contains a date or contact detail. Check whether it matters.');}
    for(const date of dates){
      date.resolved=anchorRelative(date.text,anchorDate);
      const named=NAMED_MONTH_RE.test(date.text);
      if((/^\d{4}-\d{2}-\d{2}$/.test(date.text) || namedDateParts(date.text)) && !fullDateISO(date.text))flags.push('This calendar date is invalid. Confirm it with the sender.');
      if(named && GROUPED_DAY_RE.test(date.text))flags.push('This date phrase lists alternatives or a range. Confirm which date applies to your step.');
      if(/\b(today|tomorrow)\b/i.test(date.text))flags.push(date.resolved?`Relative date uses your reference date (${anchorDate}).`:'A relative date needs the date this notice was issued.');
      else if(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|week|within)\b/i.test(date.text))flags.push('The exact calendar date is unclear. Confirm it with the sender.');
      else if(!named && /^\d{1,2}[/-]/.test(date.text))flags.push('The day/month order may be ambiguous. Confirm the date format.');
      else if(!/\b\d{4}\b/.test(date.text))flags.push('The year is not stated.');
    }
    if(kind==='action' && !dates.length)flags.push('No date is stated in this instruction. Check the rest of the notice.');
    if(dates.length>1)flags.push('More than one date appears in this sentence. Check what each refers to.');
    if(span.text.length>350)flags.push('This is a long sentence. It may contain more than one instruction.');
    if(kind==='background'){background.push({...span,index,prediction});continue;}
    cards.push({...span,id:`sentence-${index}`,index,kind,title:titleFor(span.text,prediction.label),prediction,dates,times,amounts,contacts,flags:[...new Set(flags)]});
  }
  if(!cards.some(x=>x.kind==='action'))overallWarnings.push('No confident action was found. Read the original notice to check for missed instructions.');
  const order={action:0,review:1,event:2,contact:3};cards.sort((a,b)=>order[a.kind]-order[b.kind]||a.index-b.index);
  return {source:text,anchorDate,sentences,cards,background,overallWarnings,modelVersion:model.version,summary:{actions:cards.filter(x=>x.kind==='action').length,details:cards.filter(x=>x.kind==='event'||x.kind==='contact').length,review:cards.filter(x=>x.flags.length||x.kind==='review').length}};
}
