'use strict';

function boundaryEvent() {
  const ticket = s.boundaryTicket;
  const event = (step, title, body, choices) => ({
    ...E('boundary-' + step, '境界駅', title, body, choices),
    major: true,
    scripted: true
  });

  if (!ticket) {
    if (s.age < 10 || s.age > 17) return null;
    const year = s.birth + s.age + 2;
    return event('ticket', '名前の入った切符',
      `通学路で切符を拾った。乗客欄には「${s.name}」、日付は東暦${year}年。裏には見覚えのない駅の印がある。`, [
        C('家の人と一緒に調べる', {bond: 4},
          '家の人と駅の印を写した。出所は分からず、写しを二人で取っておくことにした。',
          {ticketAction: 'shared'}),
        C('日記に挟んでおく', {mind: 3},
          '切符を日記に挟み、書かれていた年に印をつけた。',
          {ticketAction: 'kept'})
      ]);
  }

  if (ticket.phase !== 'waiting' || tick() < ticket.due) return null;
  const friend = s.contacts.filter(contact => ['friend', 'partner'].includes(contact.status))
    .sort((a, b) => b.closeness - a.closeness)
    .find(contact => contactAge(castById[contact.castId]) <= 100);
  const name = friend && castById[friend.castId].name;
  const shared = ticket.route === 'shared';
  const help = name || (shared ? '家の人' : '切符のことを打ち明けた家の人');
  const witness = name || '家の人';
  return event('platform', '切符に書かれた日',
    shared
      ? '家に置いていた切符の写しに、今までなかったホーム番号が浮かんだ。駅へ行くと、窓にだけ、その番号のホームが映っている。'
      : '日記に挟んだ切符に、今までなかったホーム番号が浮かんだ。駅の窓には、その番号のホームと、切符を探している子が映っている。', [
      C(`${witness}を呼ぶ`, {bond: 7, mind: 3},
        `${help}と並んで窓を見ると、向こう側から誰かが手を振った。二人で駅の印と時刻を書き留めた。`,
        {ticketAction: 'witnessed', witness, witnessId: friend?.castId}),
      C('窓越しに切符を渡す', {mind: 7},
        '窓に切符を押し当てると、向こう側の手が受け取った。窓はいつもの景色に戻った。',
        {ticketAction: 'returned'}),
      C('駅を出る', {happy: 3},
        '駅を出ると、切符の印が消えた。窓に映ったホームの番号だけは、覚えていた。',
        {ticketAction: 'left'})
    ]);
}

function advanceBoundaryStory(choice) {
  if (['shared', 'kept'].includes(choice.ticketAction)) {
    s.boundaryTicket = {phase: 'waiting', route: choice.ticketAction, due: tick() + 8};
    return;
  }
  const contact = s.contacts.find(person => person.castId === choice.witnessId);
  if (contact) deepenContact(contact, 15);
  Object.assign(s.boundaryTicket, {
    phase: 'echo',
    outcome: choice.ticketAction,
    witness: choice.witness,
    witnessId: choice.witnessId,
    due: tick() + 20
  });
}

function boundaryEcho() {
  const ticket = s.boundaryTicket;
  if (ticket?.phase !== 'echo' || tick() < ticket.due) return;
  ticket.phase = 'closed';
  const stories = {
    witnessed: `${ticket.witness}と残した時刻の記録に、別の町でも同じ印を見たという手紙が届いた。`,
    returned: '郵便受けに、あの切符と同じ印の便箋が届いた。「あの日、帰れました」とだけ書いてあった。',
    left: '古い日記を開くと、あのホームの番号が、書いた覚えのない筆跡で余白に残っていた。'
  };
  log(stories[ticket.outcome], '境界駅', {castId: ticket.witnessId});
  s.lastDecision = {title: 'あの日の切符', story: stories[ticket.outcome]};
}
