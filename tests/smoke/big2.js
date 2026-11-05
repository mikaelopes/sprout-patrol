const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
for (const [w,h] of [[1024,1366],[1280,720]]) {
const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2,locale:'en-US'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
let html=require('fs').readFileSync('dist/sprout-patrol.html','utf8');html=html.replace("showSplash();\nrequestAnimationFrame(frame);","showSplash();\nwindow.__t={showChars,showProfile,get meta(){return meta}};\nrequestAnimationFrame(frame);");
await p.setContent(html);await p.waitForTimeout(500);
await p.evaluate(()=>{const m=window.__t.meta;m.tutorialDone=true;m.journeyDone=true;m.coach={hub:1,map:1,prelevel:1,chars:1};m.coins=300;});
await p.evaluate(()=>window.__t.showChars());await p.waitForTimeout(500);await p.screenshot({path:`/tmp/big_chars_${w}.png`});
await p.evaluate(()=>window.__t.showProfile());await p.waitForTimeout(500);await p.screenshot({path:`/tmp/big_prof_${w}.png`});
const r=await p.evaluate(()=>{const c=document.querySelector('.overlay .card').getBoundingClientRect(),o=document.getElementById('overlay').getBoundingClientRect();return {card:[c.top|0,c.bottom|0],ov:[o.top|0,o.bottom|0]}});
console.log(w,JSON.stringify(r),errs);await p.close();}
await b.close();})();
