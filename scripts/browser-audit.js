// Injected by the local QA server only. No notice leaves the browser.
const panel=document.createElement('aside');
panel.id='qa-diagnostics';panel.setAttribute('aria-label','Local QA diagnostics');
const button=document.createElement('button');button.textContent='Run accessibility audit';
const output=document.createElement('pre');output.id='qa-report';output.style.whiteSpace='pre-wrap';
panel.append(button,output);document.body.append(panel);
button.addEventListener('click',async()=>{
  output.textContent='Checking…';
  const report=await axe.run({exclude:[['#qa-diagnostics']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}});
  output.textContent=JSON.stringify({tool:'axe-core',version:axe.version,url:location.href,viewport:{width:innerWidth,height:innerHeight},violations:report.violations.map(({id,impact,help,helpUrl,nodes})=>({id,impact,help,helpUrl,nodes:nodes.map(({target,html,failureSummary})=>({target,html,failureSummary}))})),incomplete:report.incomplete.map(({id,help,nodes})=>({id,help,nodes:nodes.map(({target,failureSummary})=>({target,failureSummary}))})),passedRules:report.passes.length},null,2);
});
