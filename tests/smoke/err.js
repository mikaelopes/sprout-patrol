const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.setContent(require('fs').readFileSync(process.argv[2],'utf8'));await p.waitForTimeout(800);console.log(errs.slice(0,5));await b.close();})();
