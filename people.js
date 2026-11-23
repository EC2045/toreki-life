'use strict';

const castSources = {
  onva:'https://ec2045.github.io/onva-citizen/',
  waon:'https://ec2045.github.io/Waon-Jinkoku/#tab-database'
};
const eastCalendarCast = [
  ['shuren','onva','シュレン',null,'バイナリ','ニュースの解説'],
  ['zero','onva','ゼロ',null,'バイナリ','交通制御'],
  ['aria','onva','アリア・ウォーリン',14,'ウォーウルフ','歴史の教科書のデザイン'],
  ['rittsu','onva','りっつー・アルバルス',14,'ウォーウルフ×ウォーキャット','記号を使ったアート'],
  ['agen','onva','ア゛ジェン',17,'ウォーウルフ','学校での暮らし'],
  ['ebil','onva','エビル',13,'ウォーウルフ','学校や街での日々'],
  ['mei','onva','メイ',12,'ウォーウルフ','公園や街での日々'],
  ['bell','onva','ベル',17,'ウォーウルフ','弦楽器の手入れ'],
  ['shakan','onva','シャカン',38,'ウォーウルフ','音楽と演奏'],
  ['vincent','onva','ヴィンセント・シュミット',52,'人間','中央言語局の研究'],
  ['leon','onva','レオ',32,'ウォーウルフ','ホログラムの舞台'],
  ['sion','onva','シオン',21,'ウォーウルフ','星間輸送船'],
  ['emma','onva','エマ',50,'ウォーウルフ','都市の気象'],
  ['jacob','onva','ジェイコブ',24,'人間','夢境のデザイン'],
  ['karen','onva','カレン',21,'人間','仮想空間の設計'],
  ['celia','onva','セリア',22,'人間','イラスト制作'],
  ['tet','onva','テト',19,'ウォーキャット','街の情報が行き交う場所'],
  ['lucia','onva','ルチア',26,'ウォーウルフ','地質調査と探検'],
  ['rina','waon','莉奈・モンサンパス',14,'種族未公表','通信環を使った日々の暮らし'],
  ['rijes','waon','リジェス・アルバルス',13,'ウォーウルフ','自作の不思議なポスター'],
  ['yuna','waon','結菜・モンサンパス',14,'種族未公表','モンサンパス家と街での日々'],
  ['leia','waon','レイア・ミスト',23,'人間','和温陣国中央図書館の文献'],
  ['noah','waon','ノア・ヴェリス',24,'人間','杖に使う記号回路'],
  ['el','waon','エル・サフィア',42,'人間','杖と記号エネルギーの研究'],
  ['iris','waon','アイリス・フェン',19,'人間','各国の文化と言語'],
  ['kai','waon','カイ・レノス',null,'人間','外交と言語'],
  ['arca','waon','R-09《アルカ》',null,'人型生命体','杖の実験と記号演算']
].map(([id,nation,name,age,species,topic])=>({id,nation,name,age,species,topic}));
const residentJobs=['図書館職員','修理工','料理人','仕立て職人','農業従事者','教師','商店の店員','運送の仕事','工房の職人','記録係','看護職','デザイナー'];
const residentTopics=['町の古い地図','家で作る料理','手入れした道具','地元の昔話','楽器と演奏','風景のスケッチ','草花の観察','古い本の収集','散歩道','小さな模型作り','写真の整理','他の国の言葉','旅先からの便り','市場の食材','ボードゲーム'];
const originalResidents=Object.keys(nations).flatMap((nation,countryIndex)=>{
  let seed=(countryIndex+1)*51829;
  const random=()=>{
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    return seed/4294967296;
  };
  const used=new Set(eastCalendarCast.filter(p=>p.nation===nation).map(p=>p.name));
  return Array.from({length:36},(_,index)=>{
    let name=randomName(nation,random);
    for(let attempt=0;used.has(name)&&attempt<50;attempt++)name=randomName(nation,random);
    if(used.has(name))name+='・'+(index%2===0?'エン':'レン');
    while(used.has(name))name+='・ラ';
    used.add(name);
    const age=Math.floor(random()*35)-12;
    const draw=nation==='onva'||nation==='waon'?random():0;
    const common=['人間','人間','ウォーウルフ','ウォーキャット'][Math.floor(draw*4)];
    const species=nation==='onva'?(index%12===0?'バイナリ':common):nation==='waon'?(index%12===0?'人型生命体':common):'人間';
    const job=residentJobs[Math.floor(random()*residentJobs.length)];
    const topic=residentTopics[Math.floor(random()*residentTopics.length)];
    return {id:'resident-'+nation+'-'+index,nation,name,age,species,job,topic,gender:rollGender(((seed^0x39ab9a10)>>>0)/4294967296),original:true};
  });
});
const residents=[...eastCalendarCast,...originalResidents];
const castById=Object.fromEntries(residents.map(person=>[person.id,person]));

const householdJobs={
  waon:['杖工房の職人','記号印刷の仕事','商店の店員','公共施設の職員'],
  onva:['!abyangの仕立て','記号資料の整理','食料品店の仕事','端末の整備']
};
function makeHousehold(life) {
  // Derive the same starting household each time an older save is opened.
  let seed=2166136261;
  for(const ch of life.id||life.name)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
  function draw(max) {
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    return Math.floor(seed/4294967296*max);
  }
  const budget=life.wealth==='余裕のある家庭'?2:life.wealth==='慎ましい家庭'?0:1;
  const jobs=householdJobs[life.origin]||['商店の仕事','事務職','修理・整備の仕事','教育関係の仕事'];
  const arrangement=draw(5);
  const roles=arrangement===0?['親']:arrangement===1?['親','祖父母の一人']:['親（1人目）','親（2人目）'];
  const guardians=roles.map(role=>({role,age:role.startsWith('祖')?51+draw(24):23+draw(19),job:jobs[draw(jobs.length)]}));
  return {
    budget,guardians,siblings:draw(3),
    home:['親族と暮らす家','賃貸の住まい','持ち家'][budget===0?draw(2):draw(3)],
    schedule:['仕事の時間が不規則','夕方は家族がそろいやすい','親族の手を借りている'][draw(3)],
    study:['共有スペースで勉強','近くの図書館で勉強','静かな勉強場所がある'][draw(3)]
  };
}
function householdMarkup(life) {
  const h=life.household;
  return `<p>${esc(life.wealth||'家計の記録なし')} · ${h.home}<br>${h.schedule}。きょうだい ${h.siblings}人。<br>${h.study}。</p>
    <ul>${h.guardians.map(g=>`<li>${g.role} · 出生時${g.age}歳 · ${g.job}</li>`).join('')}</ul>`;
}
function householdMilestone(){
  if(s.age<13||s.age>=18||s.seen.includes('schoolSupport')||!s.household)return null;
  const h=s.household;
  const cost=8;
  return E('schoolSupport','家庭と学校','勉強を続けるために',
    `${h.study}。教材と、家の手伝いをしながら勉強する時間について考える時期が来た。`,
    [
      C('家の人と学ぶ時間を決める',{mind:6,bond:5},'家の人と、手伝いと勉強を両立できる時間を決めた。'),
      C(h.budget===0?'教材の貸し出しを相談する':'教材をそろえる',h.budget===0?{mind:8}:{mind:10,money:-cost},
        h.budget===0?'学校の貸し出しを使い、必要な教材を借りた。':'教材を買って、自分のペースで勉強を続けた。', h.budget===0?{}:{cost})
    ]);
}
function contactAge(person) {
  return person.age===null?null:person.age+s.birth+s.age-2045;
}
function availableCast(species) {
  return residents.filter(p=>{
    const age=contactAge(p);
    return (!species||p.species===species)&&(age===null||(age>=6&&age<=100));
  });
}
function meetCast(species,random=Math.random) {
  if(s.age<6)return null;
  const existing=new Set(s.contacts.map(c=>c.castId));
  const available=availableCast(species).filter(p=>!existing.has(p.id));
  const local=available.filter(p=>p.nation===s.nation);
  const visiting=available.filter(p=>p.nation!==s.nation);
  const pool=local.length&&random()<.93 ? local : random()<.14 ? visiting : [];
  if(!pool.length)return null;
  const highlighted=pool.filter(p=>['aria','rittsu','rina','rijes'].includes(p.id));
  const established=pool.filter(p=>!p.original);
  const candidates=highlighted.length&&random()<.19?highlighted:established.length&&random()<.28?established:pool;
  const person=candidates[Math.floor(random()*candidates.length)];
  const contact={castId:person.id,metAge:s.age,closeness:15,interest:random(),status:'acquaintance',lastContact:tick()};
  s.contacts.push(contact);
  const setting=person.nation===s.nation?'地元の集まり':'東暦の地域間交流会';
  log(`${setting}で${person.name}と出会い、${person.topic}について話した。`,'交流',{castId:person.id});
  return contact;
}
function deepenContact(contact,amount){
  const person=castById[contact.castId];
  contact.closeness=Math.min(100,contact.closeness+amount);
  contact.lastContact=tick();
  if(contact.status==='acquaintance'&&contact.closeness>=40){
    contact.status='friend';
    s.friends++;
    log(`${person.name}と何度か話すうちに、友人になった。`,'交流',{castId:person.id});
  }else{
    log(`${person.name}と${person.topic}について、また話した。`,'交流',{castId:person.id});
  }
  return contact;
}
function socialMoment(species,amount=15){
  const acquaintances=s.contacts.filter(c=>{
    const p=castById[c.castId];
    return p&&(!species||p.species===species)&&(contactAge(p)??6)<=100;
  });
  const local=acquaintances.filter(c=>castById[c.castId].nation===s.nation);
  const returning=(local.length?local:acquaintances).filter(c=>tick()-(c.lastContact??-4)>=2);
  if(returning.length&&Math.random()<.58)return deepenContact(pick(returning),amount);
  return meetCast(species)||(returning.length?deepenContact(pick(returning),amount):null);
}
function canAskOut(contact){
  const person=castById[contact.castId];
  const age=person?contactAge(person):null;
  return !s.partnerId&&s.age>=18&&age!==null&&age>=18&&age<=100&&Math.abs(s.age-age)<=20
    &&contact.status==='friend'&&contact.closeness>=63&&contact.nextInvite!==null
    &&(contact.nextInvite??0)<=tick();
}
function relationshipEvent(contact){
  if(!contact||!canAskOut(contact))return null;
  const person=castById[contact.castId];
  return E('relationship-'+person.id,'人間関係',person.name+'との、これから',
    `${person.name}と何度も交流し、二人で過ごす時間が増えた。これからどんな関係でいたいか、話せそうだ。`,[
    C('付き合いたいと気持ちを伝える',{},`${person.name}に気持ちを伝えた。`,{relationship:'ask',target:person.id}),
    C('友人としての関係を大切にする',{bond:4},`${person.name}との友情を大切にすることにした。`,{relationship:'friend',target:person.id}),
    C('今はまだ考える',{happy:2},`${person.name}との関係について、ゆっくり考えることにした。`,{relationship:'later',target:person.id})
  ]);
}
function resolveRelationship(choice){
  const contact=s.contacts.find(c=>c.castId===choice.target);
  if(!contact||!canAskOut(contact))return choice.story;
  const name=castById[contact.castId].name;
  if(choice.relationship==='later'){contact.nextInvite=tick()+12;return choice.story}
  contact.nextInvite=null;
  if(choice.relationship==='friend')return choice.story;
  const willingness=Math.min(.88,.28+(contact.closeness-63)/60+s.stats.bond/500);
  if(contact.interest>=willingness)return `${name}は今の友情を続けたいと話した。二人は友人のままでいることにした。`;
  contact.status='partner';
  s.partnerId=contact.castId;
  change({happy:10,bond:8});
  return `${name}も同じ気持ちだと答え、二人は付き合い始めた。`;
}
function partnerName(life=s){return castById[life.partnerId]?.name||''}
function peoplePanel(){
  modal(`<h2>家族と人間関係</h2>
    <h3>生まれた家庭</h3>${householdMarkup(s)}
    <h3>養子として迎えた子</h3>${childrenMarkup(s)}<h3>東暦で出会った人</h3><p>今の国の住民名簿には${residents.filter(p=>p.nation===s.nation).length}人。年代や交流の機会によって、出会う相手が変わります。</p>
    ${s.contacts.length?s.contacts.slice().reverse().map(c=>{
      const p=castById[c.castId];
      const status={acquaintance:'知人',friend:'友人',partner:'パートナー'}[c.status];
      return `<div class="contact-row"><b>${esc(p.name)}</b><span>${status} · ${nations[p.nation].name} · あなたが${c.metAge}歳のときに出会う<br>${p.species} · 性別：${p.gender||"不明"} · ${p.original?(contactAge(p)<18?'学生':p.job)+' · ':''}${p.topic}<br>${p.original?'ゲームオリジナルの住民':`<a href="${castSources[p.nation]}" target="_blank" rel="noopener">公開資料</a>`}</span>${!s.ended&&!s.activeDecision&&!s.actionUsed&&(contactAge(p)??6)<=100?`<button class="secondary" data-visit-person="${p.id}">${esc(p.name)}と過ごす</button>`:''}</div>`;
    }).join(''):'<p>日常を進めると、地元や地域間の交流会で東暦の人物と出会えます。</p>'}
    <p>作中の人物との出会いや交際は、今回の人生の出来事として記録されます。</p><h3>生物の記録</h3><p>${s.encounters.length?s.encounters.map(esc).join('、'):'まだ出会っていません。'}</p>`);
  document.querySelectorAll('[data-visit-person]').forEach(button=>{
    button.onclick=()=>{
      if(s.ended||s.activeDecision||s.actionUsed)return;
      const contact=s.contacts.find(c=>c.castId===button.dataset.visitPerson);
      if(!contact)return;
      deepenContact(contact,22);
      change({bond:4,happy:3});
      s.actionUsed=true;
      save();render();peoplePanel();
    };
  });
}

