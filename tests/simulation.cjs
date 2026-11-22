const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.join(__dirname,'..');
function boot(storage={}){let els=new Map();function el(){return {value:'',textContent:'',innerHTML:'',open:false,onclick:null,classList:{add(){},remove(){}},querySelector(){return el()},addEventListener(){},showModal(){this.open=true},close(){this.open=false},append(){},insertAdjacentHTML(){},click(){}}}let ctx=vm.createContext({console,setTimeout:()=>{},URL,Blob,document:{querySelector(k){if(!els.has(k))els.set(k,el());return els.get(k)},querySelectorAll(){return []},createElement:el},localStorage:{getItem(k){return storage[k]||null},setItem(k,v){storage[k]=v}}});for(let f of ['game.js','systems.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});return {ctx,storage,run:code=>vm.runInContext(code,ctx)}}
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
let lives=0,manual=0,steps=0;for(let country of r('Object.keys(nations)')){r(`s=makeLife();s.nation='${country}';s.origin='${country}';s.money=currency('${country}').scale*60;normalize()`);let guard=0;while(!r('s.ended')){if(r('s.activeDecision')){r(`{const e=events().find(x=>x.id===s.event);const i=e.choices.findIndex(c=>!c.cost||c.cost<=s.money);if(i<0)throw Error('No affordable choice');choose(i);}`);manual++;}else r('simulateUntilImportant()');assert(++guard<200);assert(r('Number.isFinite(s.money)&&s.money>=0'));assert(r('Object.values(s.stats).every(x=>x>=0&&x<=100&&Number.isFinite(x))'));steps++;}assert(r('s.age<=80'));lives++;}
assert(manual<lives*80);console.log(JSON.stringify({passed:true,lives,importantChoices:manual,batchSteps:steps,migration:true,rareTraits:true,localPrices:true,legacyReload:true,ecology:true}));
