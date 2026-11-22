'use strict';
// Fixed exchange values are simulation settings, not live market rates.
const currencyData={
 waon:{id:'erias',label:'erias',yen:30,scale:20,meal:20,income:60000,living:36000,allowance:240,bread:3,water:1,clothes:120,origin:'ユーザー指定価格。円との換算・収入はゲーム設定。'},
 japan:{id:'jpy',label:'円',yen:1,scale:600,meal:600,income:3600000,living:2400000,allowance:12000,bread:150,water:100,clothes:3600,origin:'日本の通貨は円。物価・収入はゲーム設定。'},
 onva:{id:'abyaren',label:'!abyaren',yen:153,scale:4,meal:4,income:24000,living:16000,allowance:80,bread:1.1,water:.65,clothes:24,origin:'!abyaren、1 !abyang＝0.55 !abyarenを公開資料から採用。円との換算はゲーム用の固定値。'}
};
function currency(n=s?.nation||'waon'){return currencyData[n]||{id:'local-'+n,label:nations[n].name+'通貨（仮）',yen:30,scale:20,meal:20,income:60000,living:40000,allowance:240,bread:3,water:1,clothes:120,origin:'通貨名・価格は未確定のためゲーム用の仮単位。'}}
function roundMoney(n){return Math.round((Number(n)||0)*100)/100}
function fmtMoney(n,nation=s?.nation||'waon'){let c=currency(nation);return roundMoney(n).toLocaleString('ja-JP',{maximumFractionDigits:2})+' '+c.label}
function highDenomination(n,nation){return nation==='waon'?`${Math.floor(n/10000)} テクトニクス ＋ ${roundMoney(n%10000).toLocaleString()} erias`:nation==='onva'?'1 !abyang = 0.55 !abyaren':''}
function migrateLife(x){if(!x||!nations[x.nation])return x;let old=x.moneyVersion!==3;if(old){x.money=roundMoney(x.money*currency(x.nation).scale);for(let l of x.log||[]){if(l.delta?.money)l.delta.money=roundMoney(l.delta.money*currency(l.nation||x.nation).scale);l.moneyNation=l.nation||x.nation;l.text=l.text.replace(/(\d+(?:\.\d+)?) LP/g,(_,v)=>fmtMoney(+v*currency(l.nation||x.nation).scale,l.nation||x.nation));}x.moneyVersion=3;x.pending=null;x.activeDecision=false;}x.version=3;x.contacts=x.contacts||[];x.encounters=x.encounters||[];x.lineage=x.lineage||[x.species];x.vampire=!!x.vampire;x.progressMode=x.progressMode||'milestone';x.policy=x.policy||'balanced';x.lastBatch=x.lastBatch||null;x.decisions=x.decisions||0;x.lastSnapshot={...x.stats,money:x.money};return initializeRegions(x)}
const changeOld=change;
change=function(effect){changeOld(effect);for(let k of Object.keys(s.stats))s.stats[k]=roundMoney(s.stats[k]);s.money=roundMoney(s.money)};
const normalizeOld=normalize;
normalize=function(){normalizeOld();if(s)migrateLife(s)};
const makeLifeOld=makeLife;
function speciesRoll(n,draw=Math.random()){let native=['onva','waon'].includes(n);if(draw<.025)return 'ウォーウルフ×ウォーキャット';if(draw<(native?.25:.055))return 'ウォーウルフ';if(draw<(native?.42:.085))return 'ウォーキャット';return '人間'}
makeLife=function(){let x=makeLifeOld();x.species=speciesRoll(x.nation);x.lineage=x.species==='ウォーウルフ×ウォーキャット'?['ウォーウルフ','ウォーキャット']:[x.species];x.vampire=Math.random()<.01;x.moneyVersion=3;x.money=roundMoney(x.money*currency(x.nation).scale);x.version=3;x.policy='balanced';x.progressMode='milestone';x.contacts=[];x.encounters=[];x.activeDecision=false;x.decisions=0;x.pending=null;x.region=pick(regions[x.nation].filter(r=>r.birth)).id;x.originRegion=x.region;return x};
function biologyName(x=s){return x.species+(x.vampire?' / 吸血鬼の特性':'')}
showBirth=function(){const x=birthDraft;modal(`<div class="event-type">BIRTH LOTTERY · ${Object.keys(nations).length} COUNTRIES</div><h2>次の人生は、ここから。</h2><div class="birth-result"><span>出生地</span><h3>${esc(placeName(x.origin,x.originRegion))}</h3><span>あなたの名前</span><strong>${esc(x.name)}</strong><p>${esc(biologyName(x))}<br>${esc(x.wealth)} · ${esc(x.traits)}</p>${x.lineage.length>1?'<div class="rare-tag">RARE · 二つの種族を受け継ぐ出生</div>':''}${x.vampire?'<div class="rare-tag">RARE · 吸血鬼の特性</div>':''}</div><p>所持金：${fmtMoney(x.money,x.nation)}<br>0歳から、日常はまとめて進み、大切な場面で選択します。</p><button class="primary" id="acceptBirth">この人生をはじめる</button><button class="secondary" id="rerollBirth">もう一度ガチャを引く</button>${s?'<p>現在の人生は過去の人生録に保存されます。</p>':''}`);$('#rerollBirth').onclick=()=>{birthDraft=makeLife();showBirth()};$('#acceptBirth').onclick=()=>{archiveLife();s=birthDraft;birthDraft=null;normalize();log(`${placeName(s.origin,s.originRegion)}に${s.name}として生まれた。種族：${biologyName()}。${s.wealth}。`,'誕生');s.lastBatch={from:0,to:0,count:1,message:'あなたの人生が始まった。'};save();$('#modal').close();render()}};
const logOld=log;
log=function(t,type='日常',details={}){logOld(t,type,{moneyNation:s.nation,region:s.region,...details})};
deltaText=function(d,nation=s?.nation||'waon'){return Object.entries(d||{}).filter(([,v])=>v!==0).map(([k,v])=>k==='money'?`資金 ${v>0?'+':''}${fmtMoney(v,nation)}`:`${labels[k]||k} ${v>0?'+':''}${Math.round(v*100)/100}`).join(' / ')};
item=function(x){return `<div class="timeline-item ${x.type==='事故'?'danger-log':''}"><small>${x.year}年 · ${x.age}歳 第${(x.quarter||0)+1}期 · ${esc(x.type||'記録')}${x.nation&&nations[x.nation]?' · '+esc(placeName(x.nation,x.region)):''}</small><p>${esc(x.text)}</p>${Object.keys(x.delta||{}).length?`<div class="log-delta">${esc(deltaText(x.delta,x.moneyNation||x.nation||s?.nation))}</div>`:''}</div>`};
const ecology={
 onva:[['コロレン','車輪型の小さな生物が、坂道を静かに転がっていった。'],['スイレン','水辺で回転しながら進むスイレンの群れを見た。'],['ネルン','工房の粘土作品に見えたものが、ゆっくり形を変えた。ネルンだった。']],
 waon:[['双角の白鳥蜘蛛','観測所の記録で、神域を警護する双角の白鳥蜘蛛について学んだ。'],['電位殻の重歩蝸','許可を受けた見学で、電気信号を蓄える殻の記録を観察した。']]
};
function ecologyEvents(){const arr=[];let add=(id,type,title,body,opts,min=6,ns=null,requires=null)=>{let e=E(id,type,title,body,opts);Object.assign(e,{min,max:Infinity,ns,requires});arr.push(e)};
add('kororen','onva / 生物','小さな車輪に、道を譲る。','坂道にコロレンの群れが現れた。振動に敏感な生物を驚かせずに、どう共に暮らそう。',[C('静かに道を譲り、観察する',{mind:6,happy:4},'コロレンの群れを静かに見送った。',{meetCreature:'コロレン'}),C('地域の観察会に参加する',{bond:7,mind:4},'コロレンの観察会で生態を学んだ。',{meetCreature:'コロレン'})],6,['onva']);
add('suiren','onva / 生物','水辺に光が集まる。','水辺のスイレンを観察する会に誘われた。回転する姿を、少し離れて眺められる。',[C('観察会に参加する',{happy:8,mind:4},'水辺でスイレンの群れを見た。',{meetCreature:'スイレン'}),C('解説を聞いて記録する',{mind:9},'スイレンの生息域を記録した。',{meetCreature:'スイレン'})],6,['onva']);
add('nerun','onva / 生物','作品が、動いた。','工房の片隅の粘土が、少しずつ形を変えている。造形師は「ネルンだ」と教えてくれた。',[C('生物として距離を保ち観察する',{mind:8,happy:4},'ネルンを作品と取り違えず、観察した。',{meetCreature:'ネルン'}),C('工房の管理者に知らせる',{bond:6,mind:4},'工房の管理者とネルンの様子を確かめた。',{meetCreature:'ネルン'})],8,['onva']);
add('swan','和温陣国 / 生物','神域の警護者。','観測所で、双角の白鳥蜘蛛の記録を見た。美しい姿だけで、近づいてよい生き物ではないという。',[C('観測所の記録を詳しく読む',{mind:9},'双角の白鳥蜘蛛の警護行動について学んだ。',{meetCreature:'双角の白鳥蜘蛛'}),C('許可された見学に申し込む',{mind:6,money:-12},'専門家による見学で生態を学んだ。',{cost:12,meetCreature:'双角の白鳥蜘蛛'})],12,['waon']);
add('snail','和温陣国 / 生物','殻が記録する信号。','観測所の公開講座では、電位殻の重歩蝸とデジタル遺物の共鳴を紹介している。',[C('公開講座を聴く',{mind:9},'電位殻の重歩蝸の信号蓄積について学んだ。',{meetCreature:'電位殻の重歩蝸'}),C('記録の整理を手伝う',{bond:6,mind:5},'観測所で生態記録の整理を手伝った。',{meetCreature:'電位殻の重歩蝸'})],12,['waon']);
add('wolfpeer','異種族の暮らし','耳と尻尾のある、隣人。','地域の集まりで、ウォーウルフの住民と話した。同じ街で暮らしていても、感じ取る音や匂いは少し違う。',[C('相手の話を聞く',{bond:8,mind:4},'ウォーウルフの知人ができた。',{contactSpecies:'ウォーウルフ'}),C('一緒に地域の活動をする',{bond:9,happy:4},'ウォーウルフの住民と活動に参加した。',{contactSpecies:'ウォーウルフ'})],6,['waon','onva']);
add('catpeer','異種族の暮らし','写さずに、覚えておく。','ウォーキャットの知人と出かけた。写真を撮る前に、どうしてほしいか聞いてみよう。',[C('撮影してよいか尋ねる',{bond:9,mind:3},'相手の意思を確かめ、撮影の希望を尊重した。',{contactSpecies:'ウォーキャット'}),C('写真は撮らず、会話を楽しむ',{bond:7,happy:5},'ウォーキャットの知人と会話を楽しんだ。',{contactSpecies:'ウォーキャット'})],6,['waon','onva']);
add('hybridlife','種族 / ハーフ','二つの特徴、ひとりの自分。','狼と猫、両方の特徴を受け継ぐあなた。ひとつの型に自分を合わせるより、快適な暮らしを探せそうだ。',[C('自分の感覚に合う環境を整える',{health:8,happy:6},'ハーフとしての感覚に合う暮らしを整えた。'),C('似た経験を持つ人と交流する',{bond:9,happy:5},'複数の種族を受け継ぐ仲間と出会った。')],12,null,'hybrid');
add('vampirelife','体質 / 吸血鬼','自分に合う生活の時間。','吸血鬼の特性を持つあなた。暮らしの時間帯や必要な補給について、相談できる場所を見つけた。',[C('必要な補給と生活の時間を相談する',{health:10,happy:5,money:-8},'自分の体質に合う補給と生活を整えた。',{cost:8}),C('周囲と無理のない予定を話し合う',{health:6,bond:8},'体質に合わせた予定を周囲と話し合った。')],12,null,'vampire');
add('accidentcare','事故 / 大切な選択','療養の時間を、どう作る。','負傷して治療を受けた。ここからの回復のため、生活や仕事の予定を調整する必要がある。',[C('休養を優先し、予定を減らす',{health:14,money:-12},'休養の時間を確保し、回復を優先した。',{cost:12}),C('身近な人に支援を頼む',{health:9,bond:5},'周囲の支援を受けながら療養した。'),C('専門家と無理のない計画を立てる',{health:11,mind:3},'専門家と回復までの計画を立てた。')],0);
return arr}
const eventsOld=events,eligibleOld=eligible;
events=function(){return [...eventsOld(),...ecologyEvents(),...regionalEvents()].map(e=>({...e,choices:e.choices.map(c=>({...c,effect:{...c.effect,...(c.effect.money!==undefined?{money:roundMoney(c.effect.money*currency().scale)}:{})},...(c.cost!==undefined?{cost:roundMoney(c.cost*currency().scale)}:{})}))}))};
eligible=function(e){return eligibleOld(e)&&(!e.requires||(e.requires==='hybrid'?s.lineage.length>1:s.vampire))};
function rememberCreature(name){if(!s.encounters.includes(name))s.encounters.push(name)}
function addContact(species){let contact={name:randomName(s.nation),species,nation:s.nation,metAge:s.age};s.contacts.push(contact);s.friends++;log(`${contact.name}（${species}）と知り合った。`,'交流');return contact}
// Fictional gameplay probabilities. No person has a predetermined maximum age.
function mortalityProfile(x=s){
 const agingScale=x.vampire?4:1;
 return {agingScale,kind:x.digital?'digital':x.vampire?'vampire':'biological'};
}
function annualMortalityRisk(x=s){
 if(x.digital)return 0;
 let p=mortalityProfile(x),age=x.age<50?x.age:50+(x.age-50)/p.agingScale;
 let base=age<6?.0005:age<50?.0003:.0015*Math.pow(2,(age-50)/8);
 let healthFactor=.6+Math.pow((100-x.stats.health)/55,2);
 return Math.min(.95,Math.max(.00005,base*healthFactor));
}
function endLife(cause,reason){
 if(s.ended)return false;
 s.ended=true;s.activeDecision=false;s.pending=null;s.queuedDecision=null;
 s.death={cause,age:s.age,quarter:s.quarter,year:s.birth+s.age};s.endType='death';s.endReason=reason;
 log(reason,'終幕',{cause});archiveLife();return true;
}
function finishCheck(){
 if(s.ended)return true;
 if(s.stats.health<=0){endLife(s.digital?'data_failure':'illness',s.digital?'記憶データを維持できなくなり、意識の記録が途絶えた。':'体調が回復せず、人生の幕を閉じた。');return true;}
 return false;
}
function assessLifeRisk(draw=Math.random()){
 if(s.ended)return true;
 if(s.mortalityCheckedTick===tick())return false;
 s.mortalityCheckedTick=tick();
 const annual=annualMortalityRisk();
 const period=s.digital?.0000025:1-Math.pow(1-annual,.25);
 if(draw>=period)return false;
 if(s.digital)return endLife('data_failure','復旧できない記憶障害によって、意識の記録が途絶えた。');
 const older=s.age>=70&&annual>=.01;
 return endLife(older?'aging':'illness',older?'年齢とともに体の力が衰え、人生の幕を閉じた。':'突然の重い病気から回復できず、人生の幕を閉じた。');
}
function resumeArtificialEnding(x){
 if(!x||!x.ended||x.death||x.age!==80)return false;
 const previous=x.endReason||(x.log||[]).find(l=>l.age===80&&/80歳|一区切り|ここまでの日々/.test(l.text))?.text||'';
 const artificial=/80歳|一区切り|ここまでの日々/.test(previous)&&!/死亡|亡く|回復せず|事故/.test(previous);
 if(!artificial)return false;
 x.ended=false;x.activeDecision=false;x.pending=null;delete x.endReason;
 x.log=x.log.filter(l=>!(l.type==='終幕'&&l.age===80&&/80歳|一区切り|ここまでの日々/.test(l.text)));
 return true;
}
function annualEconomy(){let c=currency();if(s.age<18){change({money:c.allowance});log(`家族から自由に使えるお金 ${fmtMoney(c.allowance)} を受け取った。日々の生活費は家計が支えている。`,'収支');return}let working=!['学生','悠々自適'].includes(s.job),income=working?c.income:s.job==='悠々自適'?localLivingCost()*.9:localLivingCost()*.85;
let factor=s.job==='研究技師'?1.12:s.job==='記号作家'?.95:1;income=roundMoney(income*factor);let expenses=roundMoney(localLivingCost()),shortfall=Math.max(0,expenses-s.money-income);change({money:income-expenses});log(`年間収入 ${fmtMoney(income)}、生活費 ${fmtMoney(expenses)}。${shortfall?'不足分を支援制度や家族との相談で補った。':''}`,'収支');if(shortfall)change({happy:-2});}
function advanceClock(){if(finishCheck()||assessLifeRisk())return;s.quarter++;if(s.quarter===4){s.quarter=0;s.age++;s.actionUsed=false;annualEconomy();if(s.age>55&&!s.digital)change({health:-1.5});}let done=s.conditions.filter(c=>c.until<=tick());s.conditions=s.conditions.filter(c=>c.until>tick());for(let c of done){change({health:9,happy:3});log(`${c.name}の療養を終えた。`,'回復')}finishCheck()}
accident=function(force,severityRoll=Math.random()){let options=s.age<6?[['発熱',-10,2],['転倒による打撲',-8,1]]:[['足首の捻挫',-12,2],['転倒による骨折',-22,4],['移動中の接触事故',-18,3]];if(force&&s.nation==='waon'&&s.age>=18)options.push(['記号装置の反応による負傷',-21,4]);if(s.digital)options=[['接続障害',-3,1]];if(severityRoll<(s.digital?.001:.02)){let text=s.digital?'重大な接続事故で記憶を復旧できず、意識の記録が途絶えた。':'重大な事故に巻き込まれ、救助と治療を受けたが命を救えなかった。';log(s.digital?'復旧不能な接続事故が起きた。':'命に関わる重大な事故が起きた。','事故');endLife(s.digital?'data_failure':'accident',text);return text;}let[name,damage,duration]=pick(options);let bill=roundMoney(currency().meal*ri(3,9));change({health:damage,happy:-4,money:-bill});s.conditions.push({name,until:tick()+duration});let text=`${name}。手当て・復旧に ${fmtMoney(bill)} を支払い、療養を始めた。`;log(text,'事故');return text};
function autoChoice(e){let affordable=e.choices.filter(c=>!c.cost||c.cost<=s.money);let policy={balanced:{health:1,happy:1,mind:1,bond:1},learn:{mind:3,health:.5,happy:1,bond:.5},rest:{health:4,happy:2},social:{bond:3,happy:2},work:{money:2,mind:1}}[s.policy]||{};let ranked=affordable.map(c=>({c,score:Object.entries(c.effect).reduce((sum,[k,v])=>sum+(policy[k]||0)*(k==='money'?v/currency().scale:v),0)+Math.random()*6}));return ranked.sort((a,b)=>b.score-a.score)[0]?.c||e.choices[e.choices.length-1]}
function applyChoice(e,c,manual){let effects={...c.effect};if(!manual)for(let k of Object.keys(effects))if(k!=='money')effects[k]=roundMoney(effects[k]*.2);change(effects);if(c.job)s.job=c.job;if(c.digital)s.digital=true;if(c.partner)s.partner=true;if(c.friend){let person=addContact(speciesRoll(s.nation));log(`一緒に過ごす時間を通して、${person.name}との距離が縮まった。`,'交流')}if(c.contactSpecies)addContact(c.contactSpecies);if(c.meetCreature)rememberCreature(c.meetCreature);s.seen=[...new Set([...s.seen,e.id])];s.eventCounts[e.id]=(s.eventCounts[e.id]||0)+1;s.recent=[e.id,...s.recent].slice(0,9);log(manual?`「${e.title}」で「${c.text}」を選んだ。${c.story}`:c.story,manual?'選択':'日常',{...(manual?{choice:c.text}:{}),eventTitle:e.title});}
function dailyEcology(){let local=ecology[s.nation];if(local&&Math.random()<.08&&s.age>=6){let[name,text]=pick(local);rememberCreature(name);change({mind:.6,happy:.6});log(text,'生物')}else if(s.age>=6&&Math.random()<.025){let person=addContact(speciesRoll(s.nation));log(`${person.name}と暮らしの話をした。`,'交流')}}
function routine(){let options=events().filter(e=>eligible(e)&&!e.major&&!['first','baby','career','retire','partner','transfer','accidentcare','hybridlife','vampirelife'].includes(e.id));if(s.age<6)options=events().filter(e=>e.min!==undefined&&eligible(e)&&!['accidentcare'].includes(e.id));let fresh=options.filter(e=>!s.recent.includes(e.id));let e=pick(fresh.length?fresh:options);if(e)applyChoice(e,autoChoice(e),false);if(s.age<6)change({health:.5,bond:.3});if(s.stats.health<40){change({health:4});log('体調に合わせて予定を減らし、休養した。','療養')}dailyEcology();if(s.vampire&&tick()%8===0){change({health:2});log('体質に合う補給と生活リズムを確かめた。','体質')}if(Math.random()<.012&&!s.conditions.length){accident(false);if(s.ended)return;s.queuedDecision='accidentcare'}else if(Math.random()<.18){let[,t,effects]=pick(incidental);effects={...effects};if(effects.money!==undefined)effects.money=roundMoney(effects.money*currency().scale);for(let k of Object.keys(effects))if(k!=='money')effects[k]*=.35;if(s.age<6){t='家族と穏やかな時間を過ごした。';effects={happy:1,bond:1}}change(effects);log(t,'偶発')}if(s.conditions.length)change({health:-.4});finishCheck()}
function importantEvent(){if(s.queuedDecision){let id=s.queuedDecision;s.queuedDecision=null;return events().find(e=>e.id===id)}let id=null;if(s.age>=6&&!s.seen.includes('first'))id='first';else if(s.age>=12&&s.lineage.length>1&&!s.seen.includes('hybridlife'))id='hybridlife';else if(s.age>=12&&s.vampire&&!s.seen.includes('vampirelife'))id='vampirelife';else if(s.age>=18&&s.job==='学生')id='career';else if(s.age>=65&&!s.seen.includes('retire'))id='retire';else if(s.age>=45&&!s.seen.includes('transfer'))id='transfer';else if(s.age>=22&&s.friends>1&&!s.partner&&!s.seen.includes('partner'))id='partner';if(id)return events().find(e=>e.id===id);if(s.age>=12&&Math.random()<.025){let ids=['competition','movinghouse','promotion','outside','researchrisk',...ecologyEvents().map(e=>e.id)];return pick(events().filter(e=>(e.major||ids.includes(e.id))&&eligible(e)&&!s.recent.includes(e.id)))}return null}
function simulateUntilImportant(mode=s.progressMode||'milestone'){if(!s||s.ended||s.activeDecision)return;s.progressMode=mode;let limits={year:4,five:20,milestone:40},limit=limits[mode]||40,start=tick(),before=s.log.length;
for(let i=0;i<limit&&!s.ended;i++){let e=importantEvent();if(e){s.event=e.id;s.activeDecision=true;break}routine();if(s.ended)break;advanceClock();}if(!s.ended&&!s.activeDecision){let e=importantEvent();if(e){s.event=e.id;s.activeDecision=true}}
s.lastBatch={from:start,to:tick(),count:s.log.length-before,message:s.activeDecision?'人生の分岐にたどり着いた。':s.ended?'ひとつの人生が、記録になった。':'日常の日々が過ぎていった。'};save();render()}
choose=function(i){if(!s||s.ended||!s.activeDecision)return;let e=events().find(e=>e.id===s.event),c=e?.choices[i];if(!c||c.cost>s.money)return;applyChoice(e,c,true);s.decisions++;s.activeDecision=false;s.pending=null;s.lastDecision={title:e.title,story:c.story};if(c.risk&&Math.random()<c.risk){accident(e.id==='researchrisk');if(!s.ended)s.queuedDecision='accidentcare'}if(!finishCheck())advanceClock();save();render()};
// Old callers can still advance without introducing the old result-confirmation step.
advance=function(){simulateUntilImportant()};
ending=function(){
 $('#event').innerHTML=`<article class="event-card"><div class="event-type">LIFE CHRONICLE</div><h2 class="event-title">ここに、ひとつの人生があった。</h2><p class="event-body">${esc(s.name)}、${s.age}歳${s.quarter?' 第'+(s.quarter+1)+'期':''}。<br>出生：${esc(placeName(s.origin,s.originRegion))}<br>居住：${esc(placeName(s.nation,s.region))}<br>${esc(s.endReason||'人生の記録をここに残した。')}</p><div class="summary-grid"><div>人生の記録<b>${s.log.length}件</b></div><div>出会った出来事<b>${s.seen.length}種類</b></div></div><button class="primary" id="endingRecords">人生録を読む・保存する</button><button class="secondary" id="endingNew">次の出生ガチャを引く</button></article>`;
 $('#actions').innerHTML='';$('#endingRecords').onclick=records;$('#endingNew').onclick=setup;
};
const profileOld=profile,renderOld=render,recordsOld=records,sourcesOld=showSources;
profile=function(){profileOld();$('#sceneSub').textContent=regionInfo(s.nation,s.region)?.name||nations[s.nation].sub;let identity=$('#profile').querySelector('.identity p');if(identity)identity.insertAdjacentHTML('beforeend',`<br>出生地：${esc(regionInfo(s.origin,s.originRegion)?.name||'地域の記録なし')}<br>居住地：${esc(regionInfo(s.nation,s.region)?.name||'地域の記録なし')}`);let balance=$('#profile').querySelector('.balance');if(balance)balance.innerHTML=`所持金 <b>${fmtMoney(s.money)}</b><small>${highDenomination(s.money,s.nation)}</small>`;let relationship=$('#profile').querySelector('.relationship');if(relationship)relationship.innerHTML=`${esc(biologyName())}<br>友人 ${s.friends}人${s.partner?' · パートナーあり':''}<br>生物の記録 ${s.encounters.length}種${s.conditions.length?'<br><strong>療養中：'+s.conditions.map(x=>esc(x.name)).join('、')+'</strong>':''}`;$('#timeLabel').textContent='日常は自動進行 · 大切な場面で選択';};
function controlsHTML(){return `<div class="pace-controls"><label for="lifePolicy">日々の過ごし方<select id="lifePolicy"><option value="balanced">バランスよく</option><option value="learn">学びを大切に</option><option value="rest">健康を大切に</option><option value="social">交流を大切に</option><option value="work">仕事を大切に</option></select></label><label for="progressMode">進める時間<select id="progressMode"><option value="milestone">次の大切な出来事まで</option><option value="year">1年まで</option><option value="five">5年まで</option></select></label></div>`}
function bindControls(){if($('#lifePolicy')){$('#lifePolicy').value=s.policy;$('#lifePolicy').onchange=()=>{s.policy=$('#lifePolicy').value;save()}}if($('#progressMode')){$('#progressMode').value=s.progressMode;$('#progressMode').onchange=()=>{s.progressMode=$('#progressMode').value;save()}}}
render=function(){if(!s){renderOld();$('#event').querySelector('.event-body').innerHTML='生まれる国と名前は、運命にまかせて。<br>日常はまとめて進み、大切な場面で選ぶ。';return}profile();$('#timeline').innerHTML=s.log.slice(0,6).map(item).join('');if(s.ended){ending();return}let e=s.activeDecision?events().find(e=>e.id===s.event):null;
if(e){$('#event').innerHTML=`<article class="event-card important-card"><div class="event-type">大切な選択 · ${esc(e.type)}</div><h2 class="event-title">${esc(e.title)}</h2><p class="event-body">${esc(e.body)}</p><div class="choices">${e.choices.map((c,i)=>`<button class="choice" data-choice="${i}" ${c.cost>s.money?'disabled':''}><span>${esc(c.text)}</span><small>${esc(deltaText(c.effect))}${c.cost>s.money?'<br>所持金が足りません':''}${c.risk>=.15?'<br>事故リスクあり':''}</small></button>`).join('')}</div><p class="turn-note">この場面は、あなた自身で選びます。</p></article>`;document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>choose(+b.dataset.choice));}
else{let batch=s.lastBatch,from=batch?Math.floor(batch.from/4):s.age,to=batch?Math.floor(batch.to/4):s.age;$('#event').innerHTML=`<article class="event-card progress-card"><div class="event-type">LIFE GOES ON</div><h2 class="event-title">${s.lastDecision?'また、日々が動き出す。':'いつもの日々を、その先へ。'}</h2>${s.lastDecision?`<p class="chosen">${esc(s.lastDecision.story)}</p>`:''}<p class="event-body">${batch?`${from}歳から${to}歳まで、${batch.count}件の記録が残りました。`:'日常の出来事は、あなたの過ごし方に合わせて進んでいきます。'}<br>進路や事故への対応など、大切な場面で立ち止まります。</p>${controlsHTML()}<button class="primary" id="progressLife">${s.progressMode==='year'?'1年を進める':s.progressMode==='five'?'5年まで進める':'次の大切な出来事まで進める'}</button><p class="turn-note">一度に最大10年。途中に大切な選択があれば、そこで止まります。</p></article>`;bindControls();$('#progressMode').onchange=()=>{s.progressMode=$('#progressMode').value;save();render()};$('#progressLife').onclick=()=>simulateUntilImportant();}
let list=[['atlas','国と地域'],['economy','お金と買い物'],['contacts','出会った人・生物'],['rest','休養する'],...(s.age>=6?[['learn','学ぶ'],['social','交流する']]:[]),...(s.age>=18?[['travel','移り住む'],['job','仕事を変える']]:[])];$('#actions').innerHTML=`<div class="action-heading">暮らしを整える</div><div class="action-grid">${list.map(([k,v])=>`<button data-action="${k}" ${(s.activeDecision&&!['atlas','economy','contacts'].includes(k))||(s.actionUsed&&!['atlas','economy','contacts'].includes(k))?'disabled':''}>${v}</button>`).join('')}</div>`;document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));$('#worldNote').textContent=ecology[s.nation]?`この土地の生物：${ecology[s.nation].map(x=>x[0]).join('、')}。出会いや観察も人生録に残ります。`:nations[s.nation].note;};
function economyItems(n=s.nation){let c=currency(n);return [
 {id:'bread',name:'パン',price:c.bread,effect:{happy:1},note:n==='waon'?'2〜5 erias':'軽い食事'},
 {id:'water',name:'水',price:c.water,effect:{health:1},note:n==='waon'?'1 erias':'飲み物'},
 {id:'meal',name:'普通の食事',price:c.meal,effect:{health:3,happy:2},note:n==='waon'?'10〜30 erias':'毎日の食事'},
 {id:'clothes',name:'服',price:c.clothes,effect:{happy:6},note:n==='waon'?'50〜200 erias':'暮らしの品物'},
 ...(n==='onva'?[{id:'onigiri',name:'おにぎり',price:1.1,effect:{happy:2,health:1},note:'公開資料：2 !abyang'},{id:'pc',name:'ONVAのPC',price:420,effect:{mind:8,happy:4},note:'公開資料：420 !abyaren'}]:[])
]}
function buyItem(id){if(!s||s.ended)return false;let it=economyItems().find(x=>x.id===id);if(!it||s.money<it.price)return false;let key=s.age+'-'+id;s.purchases=s.purchases||{};if(s.purchases[key])return false;change({money:-it.price,...it.effect});s.purchases[key]=true;log(`${it.name}を ${fmtMoney(it.price)} で購入した。`,'買い物');save();return true}
function economyPanel(){let c=currency();modal(`<div class="event-type">LIFE & MONEY</div><h2>${nations[s.nation].name}で暮らすお金。</h2><div class="wallet"><strong>${fmtMoney(s.money)}</strong><p>${highDenomination(s.money,s.nation)}</p></div>${s.nation==='waon'?'<p>1 テクトニクス = 10,000 erias</p>':''}<p>${s.age<18?'生活費は家計が支え、毎年お小遣いを受け取ります。':`仕事の年間収入の目安：${fmtMoney(c.income)}<br>生活費の目安：${fmtMoney(localLivingCost())} / 年`}</p><div class="shop-grid">${economyItems().map(it=>`<button data-buy="${it.id}" ${s.ended||s.money<it.price||s.purchases?.[s.age+'-'+it.id]?'disabled':''}><span>${it.name}</span><b>${fmtMoney(it.price)}</b><small>${it.note}${s.purchases?.[s.age+'-'+it.id]?' · 今年購入済み':''}</small></button>`).join('')}</div><p class="turn-note">買い物の効果は各品物につき年に一度。日々の食費は年間生活費に含みます。</p><details><summary>通貨・換算について</summary><p>${c.origin}</p><p>移住時はゲーム用の固定換算で全額を移します。1 erias = 30円、1 !abyaren = 153円。実際の為替とは同期しません。未設定の国は「現地通貨（仮）」で表示します。</p></details>`);document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{if(buyItem(b.dataset.buy)){render();economyPanel()}else toast('所持金または今年の購入状況を確認してください。')})}
function migrateTo(nation, regionId=regions[nation]?.[0]?.id) {
 const destination=regionInfo(nation,regionId);
 if(!canMoveRegion(nation,destination))return false;
 const oldNation=s.nation, oldRegion=s.region;
 const fee=regionFee(nation,destination);
 change({money:-fee});
 log(`移住費用 ${fmtMoney(fee,oldNation)} を支払った。`,'収支');
 const afterFee=s.money;
 s.nation=nation;
 s.region=regionId;
 s.actionUsed=true;
 if(oldNation!==nation)s.money=roundMoney(afterFee*currency(oldNation).yen/currency(nation).yen);
 s.lastSnapshot=snapshot();
 const exchange=oldNation!==nation?` ${fmtMoney(afterFee,oldNation)} を ${fmtMoney(s.money,nation)} に両替した。`:'';
 const permit=destination.permit?' 許可証を取得して移動した。':'';
 log(`${placeName(oldNation,oldRegion)}から${placeName(nation,regionId)}へ移住。${permit}${exchange}`,'移住',{
   fromRegion:oldRegion,toRegion:regionId,
   ...(exchange?{exchange:{from:oldNation,to:nation,before:afterFee,after:s.money,fee}}:{})
 });
 save();
 return true;
}
function movePanel() {
 modal(`<h2>どこで暮らそう。</h2><label for="moveNation">国</label>
 <select id="moveNation">${Object.entries(nations).map(([id,n])=>`<option value="${id}">${n.name}</option>`).join('')}</select>
 <label for="moveRegion">州・都市・地域</label><select id="moveRegion"></select>
 <p id="moveDetails"></p><button class="primary" id="confirmMove">この地域へ移住する</button>`);
 const country=$('#moveNation'), region=$('#moveRegion'), confirm=$('#confirmMove');
 function updateDetails(){
   const destination=regionInfo(country.value,region.value);
   confirm.disabled=!canMoveRegion(country.value,destination);
   if(!destination)return;
   const alreadyHere=country.value===s.nation&&destination.id===s.region;
   const fee=regionFee(country.value,destination);
   $('#moveDetails').textContent=[
     destination.note,alreadyHere?'現在の居住地。':`費用 ${fmtMoney(fee)}。`,
     !alreadyHere&&s.money<fee?'所持金が足りません。':'',
     country.value!==s.nation?'所持金は移住先の通貨に両替されます。':''
   ].filter(Boolean).join(' ');
   confirm.textContent=destination.permit?'許可証を申請して移住する':'この地域へ移住する';
 }
 function updateRegions(){
   region.innerHTML=regions[country.value].map(r=>`<option value="${r.id}">${esc(regionLabel(r))}</option>`).join('');
   if(country.value===s.nation&&s.region)region.value=s.region;
   updateDetails();
 }
 country.value=s.nation;
 country.onchange=updateRegions;
 region.onchange=updateDetails;
 confirm.onclick=()=>{if(migrateTo(country.value,region.value)){$('#modal').close();render()}};
 updateRegions();
}
action=function(k){if(!s)return;if(k==='atlas'){atlasPanel();return}if(k==='economy'){economyPanel();return}if(k==='contacts'){contactsPanel();return}if(s.ended||s.actionUsed||s.activeDecision)return;if(k==='travel'){movePanel();return}if(k==='job'){if(s.age<18)return;modal('<h2>仕事を、選び直す。</h2><p>転職にかかる準備費用：'+fmtMoney(currency().meal*10)+'</p>'+['研究技師','言語案内人','記号作家','地域職員'].map(j=>`<button class="secondary" data-job="${j}" ${s.money<currency().meal*10?'disabled':''}>${j}</button>`).join(''));document.querySelectorAll('[data-job]').forEach(b=>b.onclick=()=>{change({money:-currency().meal*10});s.job=b.dataset.job;s.actionUsed=true;log(`${s.job}の仕事へ進路を変えた。`,'仕事');save();$('#modal').close();render()});return}let options={rest:{health:10,happy:4},learn:{mind:7,money:-currency().meal*3},social:{bond:7,happy:4}};let effects=options[k];if(!effects||effects.money<0&&s.money<-effects.money)return;change(effects);if(k==='social'&&s.age>=6)addContact(speciesRoll(s.nation));log({rest:'休養の時間をとった。',learn:'自分の興味を深めて学んだ。',social:'身近な人とゆっくり過ごした。'}[k],'日常');s.actionUsed=true;save();render()};
function contactsPanel(){modal(`<div class="event-type">LIVING TOGETHER</div><h2>同じ世界に、生きている。</h2><p>あなた：${esc(biologyName())}</p><h3>知り合った人たち</h3>${s.contacts.length?s.contacts.slice().reverse().map(c=>`<div class="contact-row"><b>${esc(c.name)}</b><span>${esc(c.species)} · ${nations[c.nation].name} · ${c.metAge}歳で出会う</span></div>`).join(''):'<p>日々の暮らしの中で、出会いが増えていきます。</p>'}<h3>出会った・学んだ生物</h3>${s.encounters.length?'<p>'+s.encounters.map(esc).join('、')+'</p>':'<p>生物の記録はまだありません。</p>'}<p>知的種族は地域の住民・友人として、生物は生息地に応じた出会いや観察として記録しています。</p>`)}
records=function(){recordsOld();if($('#logType')){for(let name of ['生物','交流','体質','移住','買い物','仕事']){let option=document.createElement('option');option.value=name;option.textContent=name;$('#logType').append(option)}}};
download=function(json=false){let x=viewingLife||s;if(!x)return;let text=json?JSON.stringify(x,null,2):`東暦人生録 — ${x.name}\n${biologyName(x)} / 出生 ${placeName(x.origin||x.nation,x.originRegion)} / 居住 ${placeName(x.nation,x.region)}\n${x.age}歳 / 所持金 ${fmtMoney(x.money,x.nation)}\n\n`+[...x.log].reverse().map(l=>`${l.year}年 ${l.age}歳 第${(l.quarter||0)+1}期 [${l.type||'記録'}] ${l.text}${l.delta?' ('+deltaText(l.delta,l.moneyNation||l.nation||x.nation)+')':''}`).join('\n');let url=URL.createObjectURL(new Blob([text],{type:json?'application/json':'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='toreki-life-'+(json?'save.json':'chronicle.txt');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
guide=function(){modal(`<div class="event-type">HOW TO LIVE</div><h2>日常は流れ、選択はときどき。</h2><p>「次の大切な出来事まで進める」で、日々をまとめて進めます。日常の出来事、出会い、収支、回復はすべてログに残り、進路や大きな事故、種族・体質に関わる場面で止まります。</p><p>「1年まで」「5年まで」でも、途中に大切な選択があれば止まります。一度に進む上限は10年。日々の過ごし方は「学び」「健康」「交流」「仕事」などから選べます。結果の確認ボタンを毎回押す必要はありません。</p><p>出生時には国に加えて地域も決まります。「国と地域」で地名と資料を確認でき、18歳から別の州や都市に移住できます。</p><p>所持金は居住国の通貨。生活費と収入は年ごとに反映し、買い物や移住もできます。移住しても出生国・種族は変わりません。</p><p>21か国の出生ガチャ。ウォーウルフとウォーキャットのハーフや、吸血鬼の特性がまれに生まれます。それぞれの暮らしや出会いがイベントに関わります。寿命は決まっていません。幼い頃に事故や病気で亡くなる可能性も、80歳を越えて長生きする可能性もあります。健康と年齢、体質で経過が変わり、次の人生でも記録が残ります。</p><button class="secondary" id="guideSources">設定と参照資料を見る</button>`);$('#guideSources').onclick=showSources};
showSources=function(){sourcesOld();$('#modalContent').insertAdjacentHTML('beforeend',`<h3>通貨と生物の追加設定</h3><p>和温陣国：ユーザー指定の 1 テクトニクス = 10,000 erias、パン2〜5、水1、食事10〜30、服50〜200 eriasを採用。日本は円。onvaは公開された <a href="https://ec2045.github.io/onva-rate/" target="_blank" rel="noopener">!abyaren Exchange</a> の通貨名、!abyangの比率、おにぎり・PCの価格を採用しています。</p><p>それ以外の国の通貨名は未確定として仮単位を表示。円への固定換算、収入、医療費や移住費はシミュレーション設定で、現実や公式の為替レートではありません。</p><p>生物は <a href="https://ec2045.github.io/onva-s_creature/" target="_blank" rel="noopener">onva生物資料</a> と <a href="https://ec2045.github.io/Waonjin-Ecosystem-Observatory/" target="_blank" rel="noopener">和温陣国生態系観測所</a> を参照。公開資料のない地域には固有種を断定して追加していません。</p><p>寿命の上限はありません。事故の重症度、年齢・健康に応じた病気や加齢、吸血鬼の緩やかな加齢、デジタル存在のデータ障害はゲーム用の仮設定です。現実の死亡率や公式の種族寿命を示していません。</p><p>ハーフと吸血鬼はユーザーの追加設定を反映。ハーフ2.5%、吸血鬼1%の独立抽選はゲーム上の仮の確率です。吸血鬼の補給・生活リズム、種族の出生分布も正式な生物学設定ではありません。</p>`)};
normalize();archive=archive.map(migrateLife);if(resumeArtificialEnding(s))save();if(s&&s.pending){s.pending=null;s.activeDecision=false}$('#newBtn').onclick=setup;$('#guideBtn').onclick=guide;$('#recordBtn').onclick=records;$('#allRecords').onclick=records;$('#sourcesBtn').onclick=showSources;$('#atlasBtn').onclick=atlasPanel;render();
