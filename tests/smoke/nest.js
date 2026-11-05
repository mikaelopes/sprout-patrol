const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
for (const [w,h] of [[430,740],[390,664],[1024,1366]]) {
const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:3,isMobile:true,hasTouch:true,locale:'pt-BR'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
let html=require('fs').readFileSync(process.argv[2]||'dist/sprout-patrol.html','utf8');html=html.replace("showSplash();\nrequestAnimationFrame(frame);","showSplash();\nwindow.__t={showHub,showProfile,showChars,get meta(){return meta}};\nrequestAnimationFrame(frame);");
await p.setContent(html);await p.waitForTimeout(500);
await p.evaluate(()=>{const m=window.__t.meta;m.tutorialDone=true;m.journeyDone=true;m.coach={hub:1,map:1,prelevel:1,chars:1,nest:1,shop:1};m.coins=251;m.adv={'1-1':3,'1-2':3};});
await p.evaluate(()=>window.__t.showHub());await p.waitForTimeout(300);
await p.click('[data-act="shop"], [data-act="nest"]').catch(e=>console.log('noclick'));await p.waitForTimeout(400);
await p.screenshot({path:`/tmp/nest_${process.argv[3]||'a'}_${w}.png`});
const r=await p.evaluate(()=>{const c=document.querySelector('.overlay .card').getBoundingClientRect(),o=document.getElementById('overlay').getBoundingClientRect();return {card:[c.width|0,c.height|0],ov:[o.width|0,o.height|0],z:getComputedStyle(document.documentElement).getPropertyValue('--uiz')}});
console.log(w,JSON.stringify(r),errs);await p.close();}
await b.close();})();
