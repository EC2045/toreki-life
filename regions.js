'use strict';

const regionSources = {
  waon: 'https://ec2045.github.io/Waon-Jinkoku/#tab-map',
  ifeci: 'https://ec2045.github.io/ifeci/#states',
  onva: 'https://ec2045.github.io/onva/',
  japan: 'https://ec2045.github.io/NODE-LAB/'
};
const sourceRegions = {
  waon: [
    {id:'capital', name:'和陣当府（中央）', kind:'首都', note:'和温陣国の首都。杖の工房や記号工学を学ぶ機会がある。', living:1, birth:true},
    {id:'buffer', name:'ラ＝ウクカ境界（緩衝区）', kind:'緩衝区', note:'首都外への移動には許可証と空間の歪みへの備えが必要。', living:1.05, birth:true, permit:true},
    {id:'former', name:'不安定の地（旧領）', kind:'旧領', note:'国勢調査の居住地欄に登場する旧領。ゲームでは許可を得た滞在・調査先。', living:1.15, permit:true}
  ],
  ifeci: [
    {id:'state1', name:'第1州 · d͡ð̠t͡ʃʃɵɘɨ', kind:'州', note:'州名は音声表記。州をまたぐと方言差が大きく、公用語が交流の助けになる。', living:1, birth:true},
    {id:'state2', name:'第2州 · ʃʄt͡pŋ͡mjɡ͡bɯ', kind:'州', note:'州名は音声表記。公用語はイクスイル語とシェランイブ語。', living:1, birth:true},
    {id:'state3', name:'第3州 · zʈ͡ʂʊ̈t͡θ̠aʉzk͡tp', kind:'州', note:'州名は音声表記。標準語 vɪ̈ɸɵc͡çɪ̈ と各州の方言がある。', living:1, birth:true}
  ],
  japan: [{id:'tokyo', name:'東京都・渋谷区セクター7G', kind:'都市地区', note:'NODE LABの法人化の地として掲載されている。', living:1.15, birth:true}]
};
const provisionalRegions = [
  {id:'urban', name:'都市部', kind:'生活圏', note:'通学・仕事・文化施設を利用しやすい都市部。', living:1.08, birth:true},
  {id:'residential', name:'住宅地域', kind:'生活圏', note:'地域の行事や近所同士の交流がある住宅地域。', living:1, birth:true},
  {id:'outskirts', name:'郊外', kind:'生活圏', note:'住居費を抑えやすい一方、移動には時間がかかる地域。', living:.9, birth:true}
].map(r=>({...r, provisional:true}));
const regions = Object.fromEntries(Object.keys(nations).map(n=>[
  n,
  n==='waon'||n==='ifeci' ? sourceRegions[n] : [...(sourceRegions[n]||[]), ...provisionalRegions]
]));
function regionInfo(nation, id) {
  return regions[nation]?.find(region=>region.id===id);
}
function placeName(nation, id) {
  const name=nations[nation]?.name||'地域不明';
  const region=regionInfo(nation,id);
  return region ? name+' / '+region.name : name;
}
function regionLabel(region) {
  return region.name+(region.provisional?'（ゲーム内区分）':'');
}
function initializeRegions(life) {
  if(!regions[life.nation])return life;
  if(!regionInfo(life.nation,life.region))life.region=null;
  if(!regionInfo(life.origin||life.nation,life.originRegion))life.originRegion=null;
  return life;
}
function localLivingCost() {
  return currency().living*(regionInfo(s.nation,s.region)?.living??1);
}
function regionFee(nation, region) {
  if(nation!==s.nation)return currency().meal*30;
  return currency().meal*(region.permit?20:10);
}
function canMoveRegion(nation, region) {
  return !!region && !!s && !s.ended && !s.activeDecision && !s.actionUsed && s.age>=18
    && (nation!==s.nation||region.id!==s.region) && s.money>=regionFee(nation,region);
}

function regionalEvents() {
  const land=regionInfo(s.nation,s.region);
  const events=[];
  function add(id,type,title,body,choices,min=6,major=false) {
    events.push({...E(id,type,title,body,choices),min,major});
  }
  if(s.nation==='waon'&&land?.id==='capital'){
    add('capitalStaff','和陣当府','工房で見た、小さな陣。','和陣当府の杖工房で、記号回路と陣を学ぶ公開講座が開かれた。',[
      C('工房の講座を聴く',{mind:7},'和陣当府の工房で杖の記号回路を学んだ。'),
      C('職人の仕事を見学する',{bond:6,happy:3},'和陣当府の杖職人の仕事を見学した。')
    ]);
    add('waonStaffTraining','和陣当府','杖の見習いになれるか。','工房から、仕事の傍らで魔力学を学ぶ見習い枠の案内が届いた。',[
      C('見習いに応募する',{mind:10,bond:5},'杖工房の見習いとして魔力学の勉強を始めた。'),
      C('公開講座だけに通う',{mind:5,happy:4},'今の暮らしを続けながら公開講座に通うことにした。')
    ],16,true);
  }
  if(s.nation==='waon'&&land?.permit){
    add('boundaryPermit','首都外 / 渡航','歪みの観測通知','空間に歪みが観測され、いつもの経路が一時閉鎖された。観測担当者から案内が来た。',[
      C('案内に従って迂回する',{health:3,mind:3},'空間の歪みを避けて、案内された経路で移動した。'),
      C('現地の調査記録を整理する',{mind:8,bond:4},'調査担当者に協力し、歪みの記録を整理した。')
    ],12,true);
  }
  if(s.nation==='ifeci'&&land){
    const topics={
      state1:['声調を聞き分ける日','地元の音と標準語の声調を聞き比べた。'],
      state2:['隣の州から来た転入生','州の言葉の違いを知り、公用語で会話した。'],
      state3:['音と文字のあいだ','地元の話し言葉を聞き、標準語の読み書きと比べた。']
    };
    const [title,story]=topics[land.id];
    add('dialect-'+land.id,'IFECI / 言語',title,land.name+'で、地元の言葉と他の州の言葉に触れる機会があった。',[
      C('発音を聞き比べる',{mind:7},story),
      C('公用語で交流する',{bond:7},'イクスイル語やシェランイブ語を使って他州の人と交流した。')
    ]);
    add('islandExchange-'+land.id,'IFECI / 州間交流','ことばの違う、隣の州へ。','別の州との交流会に招待された。身近な方言が相手には通じないことがある。',[
      C('公用語で交流する',{bond:9,mind:4},'他州との交流会で公用語を使い、知り合いができた。',{friend:1}),
      C('聞き取りを学んで参加する',{mind:9},'他州の方言を学び、交流会で聞き取れた言葉を記録した。')
    ],12,true);
  }
  if(s.nation==='onva'){
    add('onvaCulture','onva / 暮らし','!abyangを仕立てる日','伝統衣装の!abyangを、普段着に合わせて仕立て直す工房を見つけた。',[
      C('機能と着心地を比べる',{mind:6,happy:4},'onvaの伝統衣装!abyangの仕立てについて知った。'),
      C('工房の人から話を聞く',{bond:7},'!abyangを仕立てる職人と話した。')
    ]);
  }
  if(['waon','onva'].includes(s.nation)){
    add('ringSetup','東暦IT / 通信','手首ひとつで、連絡と認証。','連絡や記号認証に使う携帯通信環を設定する日。衛星回線を使い、PCとの連携や、自分で組んだ環境も試せる。',[
      C('Lunade OSでPCと連携する',{mind:6,happy:3},'通信環とPCをLunade OSで連携した。'),
      C('Womiz OSの勉強会へ行く',{mind:7,bond:3},'Womiz OSの勉強会で、用途に合わせた環境の作り方を学んだ。')
    ],12);
  }
  if(s.nation==='japan'&&land?.id==='tokyo'){
    add('sectorLab','東京 / セクター7G','セクター7Gで聞いた研究','NODE LABの公開資料をきっかけに、CEDのエネルギーとデジタル記録に関心を持った。',[
      C('研究の歴史を読む',{mind:7},'東京でNODE LABとCEDの関係について学んだ。'),
      C('記録の残し方について考える',{mind:4,happy:4},'身の回りの記録をどう残すか考えた。')
    ],12);
  }
  if(land?.provisional){
    const scenes={
      urban:['街の公開講座','都市部の公共施設で開かれた講座に参加した。',{mind:6}],
      residential:['ご近所の共同作業','住宅地域の住民と共同作業をして、顔見知りが増えた。',{bond:6}],
      outskirts:['郊外の移動を工夫する','郊外で移動時間を見直し、自分のペースで暮らす工夫をした。',{health:5,happy:3}]
    };
    const [title,story,effect]=scenes[land.id];
    add('local-'+land.id,'地域の暮らし',title,land.note,[
      C('参加する',effect,story),C('身近な人と相談する',{bond:4,happy:3},'この地域の暮らしについて、身近な人と話をした。')
    ]);
  }
  return events;
}

function atlasPanel() {
  const page=nation=>{
    const place=regions[nation];
    const source=regionSources[nation];
    return `<h3>${nations[nation].name}</h3><p>${nations[nation].note}</p>
      ${place.map(r=>`<div class="contact-row"><b>${esc(regionLabel(r))}</b><span>${r.kind} · ${r.note}</span></div>`).join('')}
      ${source?`<p><a href="${source}" target="_blank" rel="noopener">地域の参照資料</a></p>`:''}`;
  };
  modal(`<h2>東暦の国と地域</h2><label for="atlasNation">国を選ぶ</label>
    <select id="atlasNation">${Object.entries(nations).map(([id,n])=>`<option value="${id}">${n.name}</option>`).join('')}</select>
    <div id="atlasPage"></div>
    <p>和温陣国の区分は国勢調査フォームの居住地欄、IFECIは公式サイトの3州を参照。ゲーム内区分と地域ごとの生活費はゲーム用の設定。</p>
    <p>onvaや和温陣国とその周辺では携帯通信環が普及し、通信は衛星回線が中心。<a href="https://ec2045.github.io/torekiIT/" target="_blank" rel="noopener">東暦IT案内</a></p>`);
  $('#atlasNation').value=s?.nation||'waon';
  const update=()=>{$('#atlasPage').innerHTML=page($('#atlasNation').value)};
  $('#atlasNation').onchange=update;
  update();
}
