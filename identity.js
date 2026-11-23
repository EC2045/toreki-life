'use strict';

const genderOptions = ['男', '女', '不明'];

function rollGender(draw = Math.random()) {
  if (draw < .49) return '男';
  if (draw < .98) return '女';
  return '不明';
}

function initializeIdentity(life) {
  if (!genderOptions.includes(life.gender)) life.gender = '不明';
  life.children ??= [];
}

const racObservations = [
  ['モバジュウ', 'モバイルバッテリーに擬態する生物の調査記録を読んだ。'],
  ['トモガサ', '忘れ物のような姿をした擬態生物の記録を見た。'],
  ['サミシイシ', '群れを求めるという鉱物系生物の観察記録を読んだ。'],
  ['クウキ', '周囲の空気に擬態する生命体の記録を見た。'],
  ['ナリヒト', '人の姿に似せる擬態生物の記録を読んだ。']
];

function speciesMilestone() {
  if (s.age < 10 || s.seen.includes('speciesLiving')) return null;
  if (s.species === 'バイナリ') {
    return E('speciesLiving','種族','ログに残る、あなたの声',
      'バイナリのあなたに、音声記録と文字の両方で参加できる交流会から案内が来た。どんな形で参加しよう。',
      [C('音声で話してみる',{bond:8,happy:5},'音声で交流会に参加し、参加者と話した。'),
       C('文字と記号で記録を作る',{mind:9},'文字と記号で交流会の記録を作った。')]);
  }
  if (s.species === '人型生命体') {
    return E('speciesLiving','種族','記号を扱う手',
      '人型生命体のあなたに、研究施設の公開講座で記号演算を体験する案内が届いた。',
      [C('記号演算に取り組む',{mind:9},'公開講座で記号演算に取り組んだ。'),
       C('参加者と組んで試す',{bond:8,mind:4},'参加者と協力して記号演算を試した。')]);
  }
  return null;
}

function childAge(child, life = s) {
  return child.ageAtAdoption + life.age - child.adoptedAt;
}

function canAdopt() {
  return !!s && !s.ended && !s.activeDecision && !s.actionUsed && s.age >= 18;
}

function adoptChild() {
  if (!canAdopt()) return false;
  const child = {
    name: randomName(s.nation), gender: rollGender(), species: speciesRoll(s.nation),
    ageAtAdoption: ri(0, 5), adoptedAt: s.age
  };
  s.children.push(child);
  s.actionUsed = true;
  change({bond:6,happy:6});
  const partner = partnerName();
  log(`${child.name}（${child.ageAtAdoption}歳）を養子に迎えた。${partner ? partner+'と一緒に新しい暮らしを始めた。' : '一緒に暮らし始めた。'}`, '家族');
  save();
  return true;
}

function adoptionPanel() {
  modal(`<h2>養子を迎える</h2>
    <p>${partnerName() ? esc(partnerName())+'と子どもを迎える準備をする。' : '一人で子どもを迎える準備をする。'}</p>
    <p>子どもの名前・種族・性別・年齢は迎えたときに決まります。18歳になるまでは毎年、養育費がかかります。</p>
    <button class="primary" id="confirmAdoption">養子を迎える</button>`);
  $('#confirmAdoption').onclick = () => {
    if (!adoptChild()) return;
    $('#modal').close();
    render();
  };
}

function childrenMarkup(life) {
  if (!life.children.length) return '<p>子どもの記録はありません。</p>';
  return life.children.map(child => `<div class="contact-row"><b>${esc(child.name)}</b>
    <span>${childAge(child,life)}歳 · ${esc(child.gender)} · ${esc(child.species)}<br>あなたが${child.adoptedAt}歳のときに養子として迎えた</span></div>`).join('');
}

function childLifeEvent() {
  const children = s.children.filter(child => childAge(child) < 18);
  if (!children.length) return null;
  const child = children[s.age % children.length];
  return E('raiseChild','家族',child.name+'と過ごす休日',
    `${child.name}と一緒に出かけたり、家で話をしたりできる休日が来た。`,
    [C('一緒に街へ出かける',{bond:7,happy:5},`${child.name}と街を散歩した。`),
     C('家でゆっくり話を聞く',{bond:6,happy:4},`${child.name}から最近の話を聞いた。`)]);
}
