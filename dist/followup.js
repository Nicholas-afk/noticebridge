import {validReferenceDate,fullDateISO} from './engine.js?v=d0e95a9d0305';

export function validReminderDate(value){
  return typeof value==='string' && validReferenceDate(value) && +value.slice(0,4)>=1000 && +value.slice(0,4)<=9998;
}
export function dateSuggestions(card){
  const found=[];
  for(const item of card.dates||[]){
    if(item.ambiguous)continue;
    const text=item.text.trim(),date=/^(today|tomorrow)$/i.test(text)?item.resolved:fullDateISO(text);
    if(validReminderDate(date) && !found.some(x=>x.date===date))found.push({date,source:item.text});
  }
  return found;
}
export function reminderDefaultDate(card){
  const suggestions=dateSuggestions(card);
  // A filtered list of valid dates must not hide a competing unresolved date.
  return suggestions.length===1 && (card.dates||[]).every(item=>dateSuggestions({dates:[item]}).length===1)?suggestions[0].date:'';
}
function calendarText(value){
  return String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'');
}
function foldLine(line){
  const encoder=new TextEncoder();let chunk='',length=0;const chunks=[];
  for(const character of line){
    const bytes=encoder.encode(character).length;
    if(length+bytes>75){chunks.push(chunk);chunk=' ';length=1;}
    chunk+=character;length+=bytes;
  }
  chunks.push(chunk);return chunks.join('\r\n');
}
export function buildCalendar(result,entries,{now=new Date(),uidPrefix=globalThis.crypto.randomUUID()}={}){
  if(!Array.isArray(entries)||!entries.length)throw new Error('Save at least one confirmed reminder first.');
  if(!/^[A-Za-z0-9-]{1,80}$/.test(uidPrefix))throw new Error('Invalid calendar identifier.');
  if(!(now instanceof Date)||Number.isNaN(now.getTime()))throw new Error('Invalid export time.');
  const timestamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NoticeBridge//Source-linked reminders//EN','CALSCALE:GREGORIAN'];
  const used=new Set();
  entries.forEach(entry=>{
    const card=result.cards.find(c=>c.id===entry.id);
    if(!card||used.has(entry.id)||entry.confirmed!==true||!validReminderDate(entry.date))throw new Error('Every reminder needs a unique source excerpt and a confirmed valid date.');
    used.add(entry.id);
    const end=new Date(entry.date+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+1);
    const description=`Original sentence ${card.index+1}:\n${card.text}\n\nReminder date confirmed by the reader: ${entry.date}. This is an all-day reminder, not an inferred event time.\n${card.flags.map(f=>'Review note: '+f).join('\n')}\n\nCheck the complete notice before acting. NoticeBridge can miss instructions.`;
    const summary='NoticeBridge: '+Array.from(card.text.replace(/\s+/g,' ')).slice(0,80).join('');
    lines.push('BEGIN:VEVENT',`UID:${uidPrefix}-${card.index}@noticebridge.local`,`DTSTAMP:${timestamp}`,`DTSTART;VALUE=DATE:${entry.date.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${end.toISOString().slice(0,10).replace(/-/g,'')}`,`SUMMARY:${calendarText(summary)}`,`DESCRIPTION:${calendarText(description)}`,'TRANSP:TRANSPARENT','END:VEVENT');
  });
  lines.push('END:VCALENDAR');return lines.map(foldLine).join('\r\n')+'\r\n';
}
function questionFor(flag){
  if(flag.includes('line break'))return 'Does this date continue across the line break, and which full date applies to this step?';
  if(flag.includes('lists multiple dates'))return 'Which of the listed dates apply to this step: all of them, or only some?';
  if(flag.includes('gives alternatives'))return 'Which alternative date applies to this step?';
  if(flag.includes('allows one or both'))return 'Should this step apply to one or both dates, and which dates?';
  if(flag.includes('gives a range'))return 'When within this range should I act: throughout it, on a particular day, or by its end?';
  if(flag.includes('uses a slash'))return 'What does the slash mean here: separate dates, a choice, or a range?';
  if(flag.includes('relative date needs'))return 'On what date was this notice issued, and what calendar date does the relative deadline mean?';
  if(flag.includes('Relative date uses'))return 'Is the issue date I supplied correct for this notice?';
  if(flag.includes('year is not'))return 'Which year does this date refer to?';
  if(flag.includes('day/month'))return 'What is the full date, with the month written as a word and the year included?';
  if(flag.includes('No date'))return 'Is there a deadline or a particular day for this instruction?';
  if(flag.includes('More than one date'))return 'What does each date refer to, and which date applies to this step?';
  if(flag.includes('calendar date is invalid')||flag.includes('exact calendar date is unclear'))return 'What is the correct full calendar date?';
  if(flag.includes('long sentence'))return 'Are there separate steps or exceptions in this sentence that I should check?';
  return 'Does this sentence require me to do anything, and are there any conditions I should check?';
}
export function buildQuestions(result){
  const lines=['Hello,','I would like to check a few details in your notice.',''];let count=0;
  for(const card of result.cards){
    if(!card.flags.length && card.kind!=='review')continue;
    count++;lines.push(`${count}. The notice says:`,card.text,...new Set((card.flags.length?card.flags:['Uncertain category']).map(questionFor)),'');
  }
  if(!count)return 'No clarification questions were generated. Read the complete notice to check for anything the model missed.';
  lines.push('Thank you.','','Draft prepared locally by NoticeBridge. Review and edit it before sharing; the app does not send messages.');
  return lines.join('\n');
}
