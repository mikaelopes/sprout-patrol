const { chromium } = require('playwright'); const F = process.argv[2] || 'dist/sprout-patrol.html', tag = process.argv[3] || 'a';
(async()=>{const b=await chromium.launch();
for (const [w,h] of [[1440,900],[1024,1366],[390,844]]) {
const p=await b.newPage({viewport:{width:w,height:h},locale:'en-US'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
let html=require('fs').readFileSync(F,'utf8');html=html.replace("showSplash();\nrequestAnimationFrame(frame);","showSplash();\nwindow.__t={showHub,startAdventure,resume,get meta(){return meta},setInv(v){invuln=v}};\nrequestAnimationFrame(frame);");
await p.setContent(html);await p.waitForTimeout(500);
await p.evaluate(()=>{const m=window.__t.meta;m.tutorialDone=true;m.journeyDone=true;m.coach={hub:1,map:1,prelevel:1,chars:1};m.coins=300;m.adv={};for(let g=1;g<=3;g++)for(let i=1;i<=8;i++)m.adv[g+'-'+i]=3;});
await p.evaluate(()=>window.__t.showHub());await p.waitForTimeout(400);await p.screenshot({path:`/tmp/big_${tag}_hub_${w}.png`});
await p.evaluate(()=>{const T=window.__t;T.startAdventure(4,2,{});});await p.waitForTimeout(600);
await p.evaluate(()=>{const T=window.__t;T.resume();T.setInv(99);});await p.waitForTimeout(1500);
await p.screenshot({path:`/tmp/big_${tag}_play_${w}.png`});
const r=await p.evaluate(()=>{const c=document.getElementById('cv').getBoundingClientRect(),a=document.querySelector('.app').getBoundingClientRect();return {cv:[c.width|0,c.height|0],app:[a.width|0,a.height|0]}});
console.log(w,h,JSON.stringify(r),errs.slice(0,2));await p.close();}
await b.close();})();
