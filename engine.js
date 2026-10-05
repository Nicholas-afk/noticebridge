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
      && !monthAbbreviationContinues(text,start,i))emit(i+1);
  }
  emit(text.length); return spans;
}

export function classify(text, model) {
  // Match scikit-learn's Unicode word boundaries without treating accented
  // names as ASCII prefixes (for example, Noël must not add the feature "no").
  const words=text.toLowerCase().match(/(?<![\p{L}\p{N}_])[a-zA-Z][a-zA-Z]+(?![\p{L}\p{N}_])/gu)||[];
  const terms=[...words,...words.slice(0,-1).map((w,i)=>w+' '+words[i+1])];
  const counts=new Map();
  for(const term of terms){if(Object.hasOwn(model.vocabulary,term)){const i=model.vocabulary[term];counts.set(i,(counts.get(i)||0)+1);}}
  const features=[...counts].map(([i,n])=>[i,(1+Math.log(n))*model.idf[i]]);
  const norm=Math.sqrt(features.reduce((sum,[,v])=>sum+v*v,0));
  const logits=model.weights.map((row,k)=>model.bias[k]+features.reduce((sum,[i,v])=>sum+row[i]*(norm?v/norm:0),0));
  const highest=Math.max(...logits),exp=logits.map(x=>Math.exp(x-highest)),total=exp.reduce((a,b)=>a+b,0);
  const probabilities=Object.fromEntries(model.classes.map((label,k)=>[label,exp[k]/total]));
  const k=logits.indexOf(highest);
  const uniqueWords=[...new Set(words)];
  const vocabularyCoverage=uniqueWords.length?uniqueWords.filter(word=>Object.hasOwn(model.vocabulary,word)).length/uniqueWords.length:0;
  return {label:model.classes[k],score:exp[k]/total,probabilities,knownFeatures:features.length,vocabularyCoverage};
}

const MONTHS='January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';
const MONTH_TOKEN=`(?:${MONTHS})\\b\\.?`;
const DAY='\\d{1,2}(?:st|nd|rd|th)?\\b';
const DAY_SEPARATOR='(?:\\s*[-–—&/]\\s*|\\s+(?:to|through|until|till|and/or|and|or)\\s+|\\s*,\\s*(?:(?:and/or|and|or|&)\\s+)?)';
const DAY_LIST=`${DAY}(?:${DAY_SEPARATOR}${DAY})*`;
const YEAR_LIST=`\\d{4}\\b(?:${DAY_SEPARATOR}\\d{4}\\b)*`;
const ISO_DATE='\\d{4}-\\d{2}-\\d{2}\\b';
// A shortened endpoint must end like a date. Do not consume the day of a
// following named date, a clock time, or a number-led statement.
const SHORT_DAY=`(?!${DAY}[,.]\\d)(?!${DAY_LIST}\\s+${MONTH_TOKEN})${DAY}(?=$|[,.!?;)]|${DAY_SEPARATOR}(?:${ISO_DATE}|${DAY})|\\s+(?:at|by|on|with|before|after)\\b)`;
const SHORT_TAIL=`(?:${DAY_SEPARATOR}${SHORT_DAY})*`;
const NAMED_DATE=`(?:${DAY_LIST}\\s+${MONTH_TOKEN}(?:,?\\s+${YEAR_LIST})?|${MONTH_TOKEN}\\s+${DAY_LIST}(?:,?\\s+${YEAR_LIST})?)`;
const ISO_LIST=`${ISO_DATE}(?:${DAY_SEPARATOR}(?:${ISO_DATE}|${SHORT_DAY}))*`;
const DATE_RE=new RegExp(`\\b(?:${NAMED_DATE}${SHORT_TAIL}|${ISO_LIST}|\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?\\b|(?:next\\s+|this\\s+)?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\\b|today\\b|tomorrow\\b|next week\\b|within\\s+\\d+\\s+days?\\b)`,'gi');
const NAMED_MONTH_RE=new RegExp(`\\b(?:${MONTHS})\\b`,'i');
const DAY_FIRST_GROUP_RE=new RegExp(`^(${DAY_LIST})\\s+(${MONTHS})\\.?[,]?(?:\\s+(${YEAR_LIST}))?(${SHORT_TAIL})$`,'i');
const MONTH_FIRST_GROUP_RE=new RegExp(`^(${MONTHS})\\.?\\s+(${DAY_LIST})[,]?(?:\\s+(${YEAR_LIST}))?(${SHORT_TAIL})$`,'i');
const DATE_JOIN_RE=new RegExp(`^${DAY_SEPARATOR}$`,'i');
const DATE_RELATION_NOTES={
  list:'This date phrase lists multiple dates. Confirm which dates apply to this step.',
  alternatives:'This date phrase gives alternatives. Confirm which date applies to this step.',
  oneOrBoth:'This date phrase allows one or both dates. Confirm whether one or both apply to this step.',
  range:'This date phrase gives a range. Confirm when this step applies within it.',
  slash:'This date phrase uses a slash with an unclear meaning. Confirm how these dates relate.'
};
// Classify only the connectors between date tokens, never ISO hyphens or
// the comma between a month/day and year. Commas in an explicit choice list
// follow that choice; a comma alongside a range still represents a list.
function dateRelations(connectors){
  const types=new Set();let comma=false;
  for(const connector of connectors){
    const value=connector.trim().toLowerCase();
    if(value.includes('and/or'))types.add('oneOrBoth');
    else if(/\bor\b/.test(value))types.add('alternatives');
    else if(/\band\b|&/.test(value))types.add('list');
    else if(/\b(?:to|through|until|till)\b|[-–—]/.test(value))types.add('range');
    else if(value.includes('/'))types.add('slash');
    if(value.includes(','))comma=true;
  }
  if(comma && (!types.size || types.has('range') || types.has('slash')))types.add('list');
  return [...types];
}
function tokenConnectors(value,pattern){
  const tokens=[...value.matchAll(new RegExp(pattern,'gi'))];
  return tokens.slice(1).map((token,index)=>value.slice(tokens[index].index+tokens[index][0].length,token.index));
}
function dateGroup(value){
  const dayFirst=value.match(DAY_FIRST_GROUP_RE),monthFirst=value.match(MONTH_FIRST_GROUP_RE);
  if(dayFirst || monthFirst){
    const days=dayFirst?dayFirst[1]:monthFirst[2],month=dayFirst?dayFirst[2]:monthFirst[1],years=(dayFirst||monthFirst)[3]||'',tail=(dayFirst||monthFirst)[4];
    const tailConnectors=[...tail.matchAll(new RegExp(`(${DAY_SEPARATOR})${DAY}`,'gi'))].map(match=>match[1]);
    return {relations:dateRelations([...tokenConnectors(days,DAY),...tokenConnectors(years,'\\d{4}\\b'),...tailConnectors]),days:days+tail,month,years};
  }
  if(new RegExp(`^${ISO_DATE}`).test(value))return {relations:dateRelations(tokenConnectors(value,`${ISO_DATE}|${DAY}`)),iso:true};
  return {relations:[]};
}
function invalidDateComponent(value,group){
  if(group.month){
    const days=group.days.match(/\d+/g),years=group.years.match(/\d{4}/g)||['2000'];
    // An absent year may permit a leap day. Never manufacture a missing year
    // for reminders; 2000 only checks whether a month/day is ever possible.
    return days.some(day=>years.some(year=>!fullDateISO(`${day} ${group.month} ${year}`)));
  }
  if(group.iso){
    let prefix='';
    return [...value.matchAll(new RegExp(`${ISO_DATE}|${DAY}`,'gi'))].some(match=>{
      const token=match[0];
      if(token.length===10){prefix=token.slice(0,8);return !fullDateISO(token);}
      return !fullDateISO(prefix+token.replace(/(?:st|nd|rd|th)$/i,'').padStart(2,'0'));
    });
  }
  return false;
}
const MONTH_ABBREVIATIONS='Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';
const ABBREVIATION_RE=new RegExp(`\\b(?:${MONTH_ABBREVIATIONS})\\.$`,'i');
const DAY_BEFORE_MONTH_RE=new RegExp(`\\b${DAY}\\s+(?:${MONTH_ABBREVIATIONS})\\.$`,'i');
// A number-led new statement must not silently supply a date or missing year.
const DATE_CONTINUATION='(?=$|[^A-Za-z0-9\\s]|\\s+(?:at|by|on|from|to|through|until|till|and|or|with|in|for|before|after)\\b)';
const YEAR_CONTINUATION_RE=new RegExp(`^\\s+${YEAR_LIST}${DATE_CONTINUATION}`,'i');
const DAY_CONTINUATION_RE=new RegExp(`^\\s+${DAY_LIST}(?:,?\\s+${YEAR_LIST})?${DATE_CONTINUATION}`,'i');
const ABBREVIATED_JOIN_RE=new RegExp(`^${DAY_SEPARATOR}(?:${NAMED_DATE}|${ISO_DATE}|${SHORT_DAY})`,'i');
function monthAbbreviationContinues(text,start,index){
  const prefix=text.slice(Math.max(start,index-16),index+1);
  if(!ABBREVIATION_RE.test(prefix))return false;
  const suffix=text.slice(index+1);
  return (DAY_BEFORE_MONTH_RE.test(prefix)?YEAR_CONTINUATION_RE:DAY_CONTINUATION_RE).test(suffix)
    || (DAY_BEFORE_MONTH_RE.test(prefix) && ABBREVIATED_JOIN_RE.test(suffix));
}
const LINE_DATE_END_RE=/\b\d{1,4}(?:st|nd|rd|th)?(?:\s*[-–—&/,]|\s+(?:to|through|until|till|and\/or|and|or))\s*$/i;
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
  const crossLineDates=new Set();
  sentences.forEach((span,index)=>{
    const previous=sentences[index-1];
    if(!previous || !/\n/.test(text.slice(previous.end,span.start)))return;
    const previousDates=matches(previous.text,DATE_RE),nextDates=matches(span.text,DATE_RE);
    const startsWithJoinedDate=nextDates.some(date=>DATE_JOIN_RE.test(' '+span.text.slice(0,date.start)));
    const previousEndsWithDate=previousDates.some(date=>date.end===previous.text.length);
    if((LINE_DATE_END_RE.test(previous.text) && nextDates.some(date=>date.start===0)) || (previousEndsWithDate && startsWithJoinedDate)){
      crossLineDates.add(index-1);crossLineDates.add(index);
    }
  });
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
    if(prediction.vocabularyCoverage<0.5){kind='review';flags.push('Much of this wording is unfamiliar to the model. Check the complete sentence.');}
    if(kind==='background' && (dates.length||contacts.length)){kind='review';flags.push('This sentence contains a date or contact detail. Check whether it matters.');}
    if(crossLineDates.has(index))flags.push('A date may continue across a line break. Read both lines and confirm the full date before choosing a reminder.');
    const relations=new Set();
    let joinedConnectors=[];
    const flushRelations=()=>{dateRelations(joinedConnectors).forEach(type=>relations.add(type));joinedConnectors=[];};
    dates.slice(1).forEach((date,i)=>{
      const previous=dates[i],connector=span.text.slice(previous.end,date.start);
      if(DATE_JOIN_RE.test(connector)){
        date.ambiguous=true;previous.ambiguous=true;
        joinedConnectors.push(connector);
      }else flushRelations();
    });
    flushRelations();
    for(const date of dates){
      if(crossLineDates.has(index))date.ambiguous=true;
      date.resolved=anchorRelative(date.text,anchorDate);
      const named=NAMED_MONTH_RE.test(date.text);
      const group=dateGroup(date.text);
      if(invalidDateComponent(date.text,group))flags.push('This calendar date is invalid. Confirm it with the sender.');
      if(group.relations.length){date.ambiguous=true;group.relations.forEach(type=>relations.add(type));}
      if(/\b(today|tomorrow)\b/i.test(date.text))flags.push(date.resolved?`Relative date uses your reference date (${anchorDate}).`:'A relative date needs the date this notice was issued.');
      else if(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|week|within)\b/i.test(date.text))flags.push('The exact calendar date is unclear. Confirm it with the sender.');
      else if(!named && /^\d{1,2}[/-]/.test(date.text))flags.push('The day/month order may be ambiguous. Confirm the date format.');
      else if(!/\b\d{4}\b/.test(date.text))flags.push('The year is not stated.');
    }
    relations.forEach(type=>flags.push(DATE_RELATION_NOTES[type]));
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
