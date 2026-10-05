// Fixed baseline comparison; does not train or choose a model.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {classify,analyzeNotice} from './dist/engine.js';
import {classify as baselineClassify,analyzeNotice as baselineAnalyze} from './docs/model-audit/baseline/engine.js';
const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url)));
const cases=read('./audit-cases.json'),baseline=read('./docs/model-audit/baseline/model.json'),candidate=read('./dist/model.json');
const legacy=read('./docs/model-audit/baseline/dataset.json').holdout;
const labels=['action','background','contact','event'];
const cue=/^(?:please\s+)?(?:you\s+(?:must|need to|will need to)|parents?\s+(?:must|need to)|students?\s+(?:must|should)|do not|don't|return|submit|complete|bring|pay|register|reserve|hand|ensure|make sure|remember|sign|book|wear|collect|upload|renew|confirm|send|keep|wait|choose)\b/i;
function evaluate(rows,model,infer=classify,analyze=analyzeNotice){
  const predictions=rows.map(row=>{
    const raw=infer(row.text,model),plan=analyze(row.text,model);
    const kinds=[...plan.cards,...plan.background].map(x=>x.kind||'background');
    return {...row,prediction:raw.label,score:raw.score,kinds,categoryReview:kinds.includes('review'),actionListed:kinds.includes('action'),visible:plan.cards.length>0,knownFeatures:raw.knownFeatures};
  });
  const matrix=labels.map(label=>labels.map(pred=>predictions.filter(x=>x.label===label&&x.prediction===pred).length));
  const positives=predictions.filter(x=>x.label==='action'),tp=positives.filter(x=>x.prediction==='action').length,fp=predictions.filter(x=>x.label!=='action'&&x.prediction==='action').length;
  return {count:rows.length,correct:predictions.filter(x=>x.label===x.prediction).length,confusion_matrix:matrix,action:{support:positives.length,true_positive:tp,false_positive:fp,recall:tp/positives.length,precision:tp/(tp+fp)||0,listed:positives.filter(x=>x.actionListed).length,hidden:positives.filter(x=>!x.visible).length},category_review_sentences:predictions.filter(x=>x.categoryReview).length,errors:predictions.filter(x=>x.label!==x.prediction),predictions};
}
const results={conditions:cases.limitations,labels,baseline_version:baseline.version,candidate_version:candidate.version,case_sha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('./audit-cases.json',import.meta.url))).digest('hex'),models:{}};
for(const [name,model]of Object.entries({baseline,candidate}))results.models[name]=Object.fromEntries(Object.entries({legacy,authored:cases.authored,public:cases.public}).map(([set,rows])=>[set,name==='baseline'?evaluate(rows,model,baselineClassify,baselineAnalyze):evaluate(rows,model)]));
results.instruction_rule=Object.fromEntries(Object.entries({legacy,authored:cases.authored,public:cases.public}).map(([set,rows])=>{const tp=rows.filter(x=>x.label==='action'&&cue.test(x.text)).length,fp=rows.filter(x=>x.label!=='action'&&cue.test(x.text)).length;return[set,{action_support:rows.filter(x=>x.label==='action').length,true_positive:tp,false_positive:fp,scope:'Binary anchored instruction cue only; does not classify event/contact/background.'}];}));
fs.writeFileSync(new URL('./docs/model-audit/comparison.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
for(const [name,sets]of Object.entries(results.models))for(const[set,r]of Object.entries(sets))console.log(name,set,JSON.stringify({correct:r.correct,count:r.count,action:r.action,categoryReview:r.category_review_sentences}));
console.log('instruction_rule',JSON.stringify(results.instruction_rule));
