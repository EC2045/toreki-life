const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.join(__dirname,'..');
function boot(storage={}, timers={set:()=>{},clear:()=>{}}){let els=new Map();function el(){return {value:'',textContent:'',innerHTML:'',open:false,onclick:null,classList:{add(){},remove(){}},querySelector(){return el()},addEventListener(){},showModal(){this.open=true},close(){this.open=false},append(){},insertAdjacentHTML(){},click(){}}}let ctx=vm.createContext({console,setTimeout:timers.set,clearTimeout:timers.clear,URL,Blob,document:{querySelector(k){if(!els.has(k))els.set(k,el());return els.get(k)},querySelectorAll(){return []},createElement:el},localStorage:{getItem(k){return storage[k]||null},setItem(k,v){storage[k]=v}}});for(let f of ['game.js','regions.js','identity.js','people.js','autoplay.js','systems.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});return {ctx,storage,run:code=>vm.runInContext(code,ctx)}}
let b=boot(),r=b.run;
r("s=makeLife();s.nation='waon';s.origin='waon';s.lineage=['人間'];s.species='人間';s.vampire=false;normalize()");
// No mandatory choices for routine childhood. Stop at the first school milestone.
r('simulateUntilImportant()');assert.equal(r('s.age'),6);assert.equal(r('s.event'),'first');assert(r('s.activeDecision'));assert(r('s.log.length>20'));r('choose(0)');assert(!r('s.pending'));assert(!r('s.activeDecision'));
// A fixed annual mode cannot exceed its requested time, but can stop early.
let start=r('tick()');r("simulateUntilImportant('year')");assert(r('tick()')-start<=4);
// Species and vampire traits are independent; both can coexist.
assert.equal(r("speciesRoll('waon',.01)"),'ウォーウルフ×ウォーキャット');assert.equal(r("speciesRoll('japan',.99)"),'人間');
r("s=makeLife();s.age=12;s.quarter=0;s.nation='waon';s.lineage=['ウォーウルフ','ウォーキャット'];s.species='ウォーウルフ×ウォーキャット';s.vampire=true;s.seen=['first'];normalize();s.activeDecision=false;simulateUntilImportant()");assert.equal(r('s.event'),'hybridlife');r('choose(0);simulateUntilImportant()');assert.equal(r('s.event'),'vampirelife');
// Prices are in real local units, with high-denomination rendering and one purchase per year.
r("s=makeLife();s.nation='waon';s.origin='waon';s.money=20000;s.moneyVersion=3;normalize()");assert.equal(r("fmtMoney(10000,'waon')"),'10,000 erias');assert(r("highDenomination(10001,'waon').includes('1 テクトニクス')"));assert.equal(r("economyItems().find(x=>x.id==='water').price"),1);let cash=r('s.money');assert(r("buyItem('water')"));assert.equal(r('s.money'),cash-1);assert(!r("buyItem('water')"));
r("s.nation='onva';s.money=1000;s.lastSnapshot=snapshot()");assert.equal(r("economyItems().find(x=>x.id==='pc').price"),420);assert.equal(r("economyItems().find(x=>x.id==='onigiri').price"),1.1);
// Migration converts spendable money after fees and cannot change birthplace or ancestry.
r("s.nation='waon';s.origin='waon';s.age=20;s.money=20000;s.actionUsed=false;s.activeDecision=false;s.lastSnapshot=snapshot()");assert(r("migrateTo('japan')"));assert.equal(r('s.money'),(20000-600)*30);assert.equal(r('s.origin'),'waon');assert.equal(r('s.nation'),'japan');assert(r("s.log[0].exchange.to==='japan'"));
// Currency metadata on each log survives later migration.
assert(r("s.log.find(x=>x.type==='買い物').moneyNation==='waon'"));
// Legacy balances convert only once; pending choices/results are not applied twice.
let old={version:2,name:'旧データ',nation:'onva',origin:'onva',id:'old',age:18,quarter:0,stats:{health:70,happy:60,mind:30,bond:40},money:60,job:'学生',friends:0,partner:false,digital:false,log:[{text:'収入 12 LP',year:2044,age:17,nation:'onva',delta:{money:12}}],seen:[],recent:[],conditions:[],pending:{title:'済'},actionUsed:false,ended:false};let store={'toreki-life-v1':JSON.stringify(old)};let m=boot(store);assert.equal(m.run('s.money'),240);assert.equal(m.run('s.version'),3);assert.equal(m.run('s.pending'),null);m.run('save()');m=boot(store);assert.equal(m.run('s.money'),240);assert(m.run("s.log[0].text.includes('!abyaren')"));
// Reload must retain an important decision and its event.
r("s.activeDecision=true;s.event='career';save()");let reload=boot(b.storage);assert(reload.run('s.activeDecision'));assert.equal(reload.run('s.event'),'career');
// Country-specific ecology cannot leak into another country's encounters.
r("s=makeLife();s.nation='japan';s.age=20;normalize()");assert.equal(r("ecologyEvents().filter(e=>e.ns?.includes('onva')).some(eligible)"),false);r("s.nation='onva'");assert(r("ecologyEvents().find(e=>e.id==='kororen')&&eligible(ecologyEvents().find(e=>e.id==='kororen'))"));
// Full lives: ordinary history progresses in batches, no unaffordable-choice dead ends.
// Regional moves preserve birthplace and currency; foreign moves reset the current region.
r("s=makeLife();s.age=20;s.nation='waon';s.origin='waon';s.region='capital';s.originRegion='capital';s.money=20000;s.actionUsed=false;normalize()");
assert(r("events().some(e=>e.id==='capitalStaff')"));
assert(r("!migrateTo('waon','capital')"));
assert(r("migrateTo('waon','buffer')"));
assert.equal(r('s.money'),19600);
assert.equal(r('s.originRegion'),'capital');
assert.equal(r('s.log[0].region'),'buffer');
assert(r("s.log[0].text.includes('許可証')"));
assert(r("events().some(e=>e.id==='boundaryPermit')&&!events().some(e=>e.id==='capitalStaff')"));
assert(r('localLivingCost()>currency().living'));
r('s.actionUsed=false');assert(r("migrateTo('ifeci','state2')"));
assert.equal(r('s.region'),'state2');assert.equal(r('s.originRegion'),'capital');
assert(r("events().some(e=>e.id==='dialect-state2')&&!events().some(e=>e.id==='dialect-state1')"));
assert.equal(boot(b.storage).run('s.region'),'state2');
assert(r("Object.keys(nations).every(n=>regions[n].some(region=>region.birth))"));
assert.equal(m.run('s.originRegion'),null);
// Each country has a stable, unique local roster in addition to the published cast.
assert(r("Object.keys(nations).every(n=>{const list=originalResidents.filter(p=>p.nation===n);return list.length===36&&new Set(list.map(p=>p.name)).size===36})"));
r("s=makeLife();s.nation='onva';s.age=18;s.contacts=[];s.partnerId=null;normalize();meetCast(undefined,()=>0)");
assert.equal(r('s.contacts[0].castId'),'aria');
r("deepenContact(s.contacts[0],25);deepenContact(s.contacts[0],26)");
assert.equal(r('s.contacts[0].status'),'friend');
r("s.event=relationshipEvent(s.contacts[0]).id;s.activeDecision=true;save()");
let socialReload=boot(b.storage);
assert.equal(socialReload.run('s.event'),'relationship-aria');
socialReload.run('choose(0)');
assert.equal(socialReload.run('partnerName()'),'アリア・ウォーリン');
assert(socialReload.run("s.log.some(x=>x.text.includes('付き合い始めた'))"));
r("s.age=17");assert.equal(r('canAskOut(s.contacts[0])'),false);
r("s.age=18;s.contacts[0].interest=.999;resolveRelationship({target:'aria',relationship:'ask'})");
assert.equal(r('s.partnerId'),null);
r("s.age=13;s.household.budget=0;s.seen=[]");assert(r("householdMilestone().choices.some(c=>c.text.includes('貸し出し'))"));
r("s.household.budget=2");assert.equal(r("events().find(e=>e.id==='schoolSupport').choices[1].cost"),32);
// The timer advances a year, stops on a choice, and preserves the manual pace.
let scheduled=null;
const timed=boot({}, {set:fn=>{scheduled=fn;return 1},clear:id=>{if(id===1)scheduled=null}});
const play=timed.run;
play("s=makeLife();s.age=4;s.quarter=0;s.progressMode='five';normalize();Math.random=()=>.999;toggleAutoplay()");
assert.equal(typeof scheduled,'function');
scheduled();
assert.equal(play('s.age'),5);
assert.equal(play("JSON.parse(localStorage.getItem(KEY)).progressMode"),'five');
scheduled();
assert.equal(play('s.age'),6);
assert.equal(play('s.event'),'first');
assert.equal(scheduled,null);
assert(play("autoplayControls().includes('一時停止中')"));
play("choose(0)");
assert.equal(typeof scheduled,'function');
play('toggleAutoplay()');
assert.equal(scheduled,null);
// The saved identity and adoption flow work for all three genders.
assert.equal(r("rollGender(0)+rollGender(.5)+rollGender(.99)"),'男女不明');
assert.equal(r("speciesRoll('onva',.45)"),'バイナリ');
assert.equal(r("speciesRoll('waon',.45)"),'人型生命体');
r("s=makeLife();s.age=10;s.species='バイナリ';s.seen=['first'];normalize()");
assert.equal(r('importantEvent().id'),'speciesLiving');
for (const gender of ['男','女','不明']) {
  r(`s=makeLife();s.age=17;s.gender='${gender}';s.partnerId=null;normalize()`);
  assert.equal(r('adoptChild()'),false);
  r('s.age=18');
  assert(r('adoptChild()'));
  assert.equal(r('adoptChild()'),false);
  assert(r("s.log.some(x=>x.type==='家族'&&x.text.includes(s.children[0].name))"));
  const saved=boot(b.storage).run('s');
  assert.equal(saved.gender,gender);
  assert.equal(saved.children.length,1);
  r("s.age=19;s.money=100000;annualEconomy()");
  assert(r("s.log[0].text.includes('養育費')"));
}
// A healthy 81-year-old is not forcibly ended; everyday and ecology events stay available.
r("s=makeLife();s.age=81;s.quarter=0;s.stats.health=100;s.digital=false;normalize()");assert.equal(r('finishCheck()'),false);assert(r("events().filter(eligible).some(e=>e.id==='library')"));assert(r("ecologyEvents().filter(e=>e.ns?.includes('onva')).length>0"));
// Forced rare fatal accident: auto progression stops at age 3, with one final log and durable cause.
r("s=makeLife();s.age=3;s.quarter=2;s.species='人間';s.lineage=['人間'];s.vampire=false;s.digital=false;s.stats.health=100;normalize();var savedRandom=Math.random;Math.random=()=>0;simulateUntilImportant();Math.random=savedRandom");
assert(r('s.ended'));assert.equal(r('s.age'),3);assert.equal(r('s.quarter'),2);assert.equal(r('s.death.cause'),'accident');assert.equal(r('s.log[0].type'),'終幕');let deadLogs=r('s.log.length');r('advanceClock();simulateUntilImportant();finishCheck();save()');assert.equal(r('s.log.length'),deadLogs);assert.equal(r('s.age'),3);let deadReload=boot(b.storage);assert.equal(deadReload.run('s.death.cause'),'accident');assert(deadReload.run('s.ended'));
// Natural illness has nonzero possibility at any age; health and aging affect the probability.
r("s=makeLife();s.age=3;s.digital=false;s.vampire=false;normalize();assessLifeRisk(0)");assert(r('s.ended'));assert.equal(r('s.death.cause'),'illness');
r("s=makeLife();s.age=90;s.digital=false;s.vampire=false;normalize();s.stats.health=100");let healthy=r('annualMortalityRisk()');r('s.stats.health=20');assert(r('annualMortalityRisk()')>healthy);r('s.stats.health=100;s.vampire=true');assert(r('annualMortalityRisk()')<healthy);
// Digital lives have no biological age cap and can actually play beyond 500, not just render.
r("s=makeLife();s.age=500;s.quarter=0;s.digital=true;s.job='悠々自適';s.seen=['first','career','retire','partner','transfer'];s.lineage=['人間'];s.vampire=false;normalize();var previousRandom=Math.random;Math.random=()=>.999999;simulateUntilImportant('five');Math.random=previousRandom");assert.equal(r('s.age'),505);assert(!r('s.ended'));assert(r('s.log.some(l=>l.age>500)'));
// Current old artificial age-80 endings resume; deaths at the same age never revive.
let oldEnd={...old,id:'old-cap',age:80,ended:true,endReason:'80歳。歩んだ日々を、ひとつの人生録に残した。',log:[{age:80,year:2125,type:'終幕',text:'80歳。歩んだ日々を、ひとつの人生録に残した。'}]};let resumed=boot({'toreki-life-v1':JSON.stringify(oldEnd)});assert.equal(resumed.run('s.ended'),false);assert.equal(resumed.run('s.age'),80);assert(resumed.run("!s.log.some(l=>l.type==='終幕')"));
oldEnd.endReason='事故で亡くなった。';oldEnd.death={cause:'accident',age:80};let preserved=boot({'toreki-life-v1':JSON.stringify(oldEnd)});assert(preserved.run('s.ended'));
let lives=0,manual=0,steps=0,ages=[];for(let country of r('Object.keys(nations)')){r(`s=makeLife();s.nation='${country}';s.origin='${country}';s.money=currency('${country}').scale*60;s.digital=false;s.vampire=false;s.species='人間';s.lineage=['人間'];normalize()`);let guard=0;while(!r('s.ended')){if(r('s.activeDecision')){r(`{const e=events().find(x=>x.id===s.event);const i=e.choices.findIndex(c=>!c.digital&&(!c.cost||c.cost<=s.money));if(i<0)throw Error('No affordable choice');choose(i);}`);manual++;}else r('simulateUntilImportant()');assert(++guard<250);assert(r('Number.isFinite(s.money)&&s.money>=0'));assert(r('Object.values(s.stats).every(x=>x>=0&&x<=100&&Number.isFinite(x))'));steps++;}assert(r('s.death&&s.ended'));ages.push(r('s.age'));lives++;}
assert(ages.some(age=>age>80));assert(manual<lives*80);console.log(JSON.stringify({passed:true,lives,importantChoices:manual,batchSteps:steps,youngest:Math.min(...ages),oldest:Math.max(...ages),earlyFatalAccident:true,noAgeCap:true,age500:true,migration:true,rareTraits:true,localPrices:true,legacyReload:true,ecology:true}));

