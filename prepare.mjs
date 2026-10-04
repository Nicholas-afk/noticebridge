import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root=new URL('./dist/',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');
const fingerprint=text=>createHash('sha256').update(text).digest('hex').slice(0,12);

// Static hosts can cache linked assets longer than the HTML document.
// Fingerprint dependencies first, then the script that references them.
const engine=fingerprint(await read('engine.js'));
const model=fingerprint(await read('model.json'));
let app=await read('app.js');
app=app.replace(/from '\.\/engine\.js(?:\?v=[a-f0-9]+)?'/,"from './engine.js?v="+engine+"'");
app=app.replace(/fetch\('\.\/model\.json(?:\?v=[a-f0-9]+)?'\)/,"fetch('./model.json?v="+model+"')");
await writeFile(new URL('app.js',root),app);

const appVersion=fingerprint(app),styleVersion=fingerprint(await read('style.css'));
let html=await read('index.html');
html=html.replace(/href="style\.css(?:\?v=[a-f0-9]+)?"/,'href="style.css?v='+styleVersion+'"');
html=html.replace(/src="app\.js(?:\?v=[a-f0-9]+)?"/,'src="app.js?v='+appVersion+'"');
await writeFile(new URL('index.html',root),html);
console.log('Prepared matching, content-versioned browser assets.');
