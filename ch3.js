'use strict';
// くろばらの館 第三章『ソウタの懐中時計』（第二章 ANOTHER END のその後）
//   game.js のしくみと ch2.js の絵を使い、ここでは第三章の部屋・物語・絵を足す。
//   新しい遊び：懐中時計で時を「止める」（数秒だけ。止めたあとは巻き直しが要る）。
//   動く刃・一瞬だけ開く扉・回る歯車・追ってくる時計守を、止めてすり抜ける。

// ---------- 色・絵 ----------
PAL.sota = { hair: '#3a2a20', hairL: '#5a4232', skin: '#f2d0b5', eye: '#24141c', shirt: '#2a4a7a', shirtD: '#1e3a62',
  pants: '#3a3a44', sock: '#e8e2d8', shoe: '#3a2420', cheek: '#e9a69a' };

// 男の子（16x20）。girl() と同じ向き・コマ
function boy(dir, frame) {
  const flip = dir === 'left', d = flip ? 'right' : dir;
  return art(`boy-${dir}-${frame}`, 16, 20, (g, R) => {
    const P = PAL.sota;
    if (flip) { g.translate(16, 0); g.scale(-1, 1); }
    R('rgba(0,0,0,.4)', 4, 18, 8, 2);
    const leg = (x, lift) => { R(P.pants, x, 14, 2, 2); R(P.sock, x, 16, 2, 2 - lift); R(P.shoe, x, 18 - lift, 2, 1); };
    if (d === 'right') {
      if (frame === 0) { leg(6, 0); leg(8, 0); } else if (frame === 1) { leg(5, 0); leg(9, 1); } else { leg(5, 1); leg(9, 0); }
    } else { leg(5, frame === 2 ? 1 : 0); leg(9, frame === 1 ? 1 : 0); }
    R(P.shirt, 4, 9, 8, 5); R(P.shirtD, 4, 13, 8, 1);
    if (d === 'right') { R(P.shirtD, 7, 10, 2, 3); R(P.skin, 7, 13, 2, 1); }
    else { R(P.shirt, 3, 10, 1, 3); R(P.shirt, 12, 10, 1, 3); R(P.skin, 3, 13, 1, 1); R(P.skin, 12, 13, 1, 1); if (d === 'down') R('#e8e0d0', 6, 9, 4, 1); }
    R(P.hair, 4, 1, 8, 2); R(P.hair, 3, 2, 10, 5);
    if (d === 'down') {
      R(P.skin, 4, 4, 8, 5); R(P.skin, 5, 9, 6, 0.5);
      R(P.hair, 4, 3, 8, 2); R(P.hair, 4, 5, 1, 1); R(P.hair, 11, 5, 1, 1); R(P.hair, 7, 5, 2, 0.6);
      R(P.eye, 5, 6, 1, 2); R(P.eye, 10, 6, 1, 2); R(P.cheek, 5, 8, 1, 1); R(P.cheek, 10, 8, 1, 1);
      R(P.hairL, 5, 2, 4, 1);
    } else if (d === 'up') {
      R(P.hair, 3, 2, 10, 7); R(P.hairL, 5, 3, 5, 1);
    } else {
      R(P.skin, 7, 4, 5, 5); R(P.hair, 7, 3, 5, 2); R(P.hair, 3, 2, 4, 7);
      R(P.eye, 10, 6, 1, 2); R(P.cheek, 10, 8, 1, 1); R(P.hairL, 5, 2, 4, 1);
    }
  });
}
// 遊んでいる章で、主人公の絵をかえる
function playerArt(dir, frame) { return CH === 3 ? boy(dir, frame) : girl('riko', dir, frame); }

Object.assign(ARTS, {
  blade: [16, 16, (g, R) => {
    R('#5a4a2a', 7, 0, 2, 5);
    R('#9aa4b4', 2, 5, 12, 3); R('#c8d0dc', 3, 5, 10, 1); R('#9aa4b4', 3, 8, 10, 2); R('#6a7484', 4, 10, 8, 2); R('#4a5464', 6, 12, 4, 1);
    R('#e8eef8', 4, 6, 2, 1);
  }],
  teeth: [16, 16, (g, R) => {
    R('#5a4a30', 3, 3, 10, 10); R('#7a6840', 4, 4, 8, 8); R('#2a2418', 6, 6, 4, 4); R('#c8a860', 7, 7, 2, 2);
    [[7, 0], [7, 13], [0, 7], [13, 7], [2, 2], [12, 2], [2, 12], [12, 12]].forEach(([x, y]) => R('#8a7848', x, y, 3, 3));
  }],
  grave: [16, 16, (g, R) => {
    R('#3a3a40', 4, 3, 8, 11); R('#4a4a52', 5, 2, 6, 2); R('#4a4a52', 4, 4, 8, 1); R('#2a2a30', 3, 13, 10, 2);
    R('#5a5a64', 6, 5, 4, 1); R('#5a5a64', 7, 4, 2, 4);
  }],
  bigBell: [16, 26, (g, R) => {
    R('#3a2a18', 7, 0, 2, 4); R('#6a5430', 4, 4, 8, 4); R('#8a7040', 3, 7, 10, 8); R('#a88a4a', 2, 14, 12, 4); R('#c8a860', 4, 8, 2, 6);
    R('#5a4428', 1, 17, 14, 2); R('#3a2a18', 7, 19, 2, 3); R('#2a1a10', 6, 22, 4, 2);
  }],
  rope: [16, 24, (g, R) => { for (let y = 0; y < 22; y++) R(y % 3 ? '#8a7050' : '#6a5438', 7 + (y % 2), y, 2, 1); R('#5a4428', 6, 21, 4, 3); }],
  ribbon: [16, 16, (g, R) => { R('#c0303a', 4, 9, 3, 3); R('#c0303a', 9, 9, 3, 3); R('#8a1a24', 7, 10, 2, 2); R('#c0303a', 6, 12, 1, 3); R('#c0303a', 9, 12, 1, 3); }],
  dollChair: [16, 18, (g, R) => {
    R('#3a2416', 3, 0, 10, 9); R('#5a1a2a', 4, 1, 8, 7); R('#3a2416', 2, 9, 12, 3); R('#5a1a2a', 3, 9, 10, 2);
    R('#2a1a10', 3, 12, 1, 6); R('#2a1a10', 12, 12, 1, 6); R('#e8dcc4', 5, 3, 6, 3); R('#5a4a3a', 6, 4, 4, 0.6);
  }],
  sotaDoll: [16, 18, (g, R) => {
    R('#3a2416', 3, 0, 10, 9); R('#3a2416', 2, 9, 12, 3); R('#2a1a10', 3, 12, 1, 6); R('#2a1a10', 12, 12, 1, 6);
    R('#3a2a20', 5, 1, 6, 3); R('#f2d0b5', 5, 3, 6, 4); R('#1a0a10', 6, 5, 1, 1); R('#1a0a10', 9, 5, 1, 1);
    R('#2a4a7a', 4, 7, 8, 4); R('#e8e0d0', 6, 7, 4, 1);
  }],
  crankTable: [16, 16, (g, R) => {
    R('#3a2618', 1, 4, 14, 7); R('#4a3220', 1, 4, 14, 1); R('#1a100a', 2, 11, 2, 5); R('#1a100a', 12, 11, 2, 5);
    R('#8a8a94', 5, 6, 6, 1); R('#8a8a94', 10, 3, 1, 4); R('#5a3a22', 9, 2, 3, 2);
  }],
  doorLock: [16, 16, (g, R) => {
    R('#1a0e08', 1, 0, 14, 16); R('#3a2414', 2, 1, 12, 15); R('#2a1a0e', 7, 1, 2, 15); R('#8a8a94', 6, 7, 4, 4); R('#1a1a20', 7, 8, 2, 2);
  }],
  doorCrank: [16, 16, (g, R) => {
    R('#2a2a30', 1, 0, 14, 16); R('#3a3a42', 2, 1, 12, 15); R('#5a5038', 3, 3, 10, 1); R('#5a5038', 3, 12, 10, 1);
    R('#1a1a20', 6, 6, 4, 4); R('#4a4030', 7, 7, 2, 2);
  }],
});

// 時計守になったリコ（頭が時計。赤いリボンだけが、むかしのまま）
function keeperRiko(dir, fr, t, still) {
  const tk = still ? 0 : ((t * 2) | 0) % 4;
  return art(`rk-${dir}-${fr}-${tk}`, 16, 26, (g, R) => {
    if (dir === 'left') { g.translate(16, 0); g.scale(-1, 1); }
    R('rgba(0,0,0,.45)', 3, 24, 10, 2);
    const leg = (x, l) => { R('#0c0a12', x, 19, 2, 5 - l); };
    if (fr === 1) { leg(5, 0); leg(9, 2); } else if (fr === 2) { leg(5, 2); leg(9, 0); } else { leg(5, 0); leg(9, 0); }
    R('#283258', 4, 11, 8, 4); R('#1c2444', 3, 14, 10, 6); R('#141a30', 3, 19, 10, 1);
    R('#283258', 2, 12, 2, 6); R('#283258', 12, 12, 2, 6); R('#d8d0c8', 2, 18, 2, 1); R('#d8d0c8', 12, 18, 2, 1);
    R('#f0ebe2', 6, 11, 4, 1);
    R('#2a2418', 3, 1, 10, 10); R('#e8e0cc', 4, 2, 8, 8);
    const hands = [[7, 3, 1, 3], [7, 5, 3, 1], [7, 5, 1, 3], [4, 5, 3, 1]][tk];
    R('#1a1008', 7, 5, 2, 2); R('#1a1008', ...hands);
    R('#c0303a', 11, 0, 4, 3); R('#c0303a', 10, 1, 1, 1); R('#8a1a24', 12, 1, 1, 1);
  });
}
const _monsterArt2 = monsterArt;
monsterArt = function (kind, dir, fr, t) { return kind === 'rkeeper' ? keeperRiko(dir, fr, t) : _monsterArt2(kind, dir, fr, t); };

// ---------- 時を止める ----------
const STOP_LEN = 4, WIND_LEN = 5;
const S3 = { t: 0, stopUntil: 0, coolUntil: 0, wasFrozen: false };
const frozen = () => CH === 3 && now < S3.stopUntil;
function stopTime() {
  if (CH !== 3 || mode !== 'play' || busy || paused || Msg.open || !G || G.hidden || !has('watch3')) return;
  if (frozen()) return;
  if (now < S3.coolUntil) { Snd.click(); return run(() => say('……ぜんまいを、巻きなおしている。\nもう少しだけ、待って。')); }
  S3.stopUntil = now + STOP_LEN; S3.coolUntil = now + STOP_LEN + WIND_LEN;
  Snd.rewind(); vibrate(40);
  if (!flags().stopTold) { flags().stopTold = true; run(() => say('……音が、消えた。\nほこりも、ろうそくの火も、ぜんぶ止まっている。')); }
}
// 毎フレーム：止まっていなければ塔の時間を進め、動くものに当たったら死ぬ
function tick3(dt) {
  if (CH !== 3) return;
  const fz = frozen();
  if (fz !== S3.wasFrozen) {
    S3.wasFrozen = fz;
    $('cv').style.filter = fz ? 'grayscale(.85) brightness(1.08)' : '';
    if (!fz) Snd.click();
  }
  const btn = $('btn-era');
  btn.classList.toggle('stop', fz);
  btn.classList.toggle('cool', !fz && now < S3.coolUntil);
  if (fz || busy || Msg.open || G.hidden) return;
  S3.t += dt;
  const m = curMap();
  const pp = pos(G.p);
  for (const h of hazardsOf(m)) {
    if (Math.hypot(pp.x - h.x * T, pp.y - h.y * T) < 11) { const d = h.death, msg = h.msg; run(async () => { Snd.crash(); shake(); await say(msg); await die(d); }); return; }
  }
  // 一瞬だけ開く扉：閉じる瞬間に、扉の上にいたら
  const sh = objsOf(m).find(o => o.shutter);
  if (sh && !shutterOpen() && ((G.p.x === sh.x && G.p.y === sh.y) || (G.p.moving && G.p.tx === sh.x && G.p.ty === sh.y))) {
    run(async () => { Snd.slam(); shake(); await say('ガシャン！\n鉄の扉が、いきおいよく閉じて――'); await die('door'); });
  }
}
// 動く刃・歯車の、いまの位置（マス単位）
function hazardsOf(m) {
  const t = S3.t, out = [];
  for (const h of m.hazards || []) {
    if (h.kind === 'swing') out.push({ x: h.cx + h.amp * Math.sin(t * h.w + h.ph), y: h.y, art: 'blade', death: 'blade', msg: '風を切る音がして――\n刃が、からだを通りぬけた。' });
    if (h.kind === 'roll') {
      const span = h.x1 - h.x0 + 2;
      for (let k = 0; k < h.n; k++) {
        let u = ((t * h.v + h.ph + k * span / h.n) % span + span) % span;
        if (h.v < 0) u = span - u;
        out.push({ x: h.x0 - 1 + u, y: h.y, art: 'teeth', death: 'teeth', msg: '回る歯車の歯が、足をとらえて――' });
      }
    }
  }
  return out;
}
const shutterOpen = () => (S3.t % 2.6) < 0.32;

const _extra2 = extraSprites;
extraSprites = function (m, pp) {
  const out = _extra2(m, pp);
  if (CH !== 3) return out;
  for (const h of hazardsOf(m)) {
    const img = getArt(h.art);
    out.push({ y: h.y * T + 16.2, img, x: Math.round(h.x * T), dy: Math.round(h.y * T) + 16 - img.height });
  }
  if (m.id === 'c3_bell' && !flags().fleeing) {
    const fz = flags().rikoAwake;
    const img = fz ? girl('riko', 'down', 0) : keeperRiko(pp ? faceTo(3 * T, 3 * T, pp.x, pp.y) : 'down', 0, now, true);
    out.push({ y: 3 * T + 16, img, x: 3 * T, dy: 3 * T + 16 - img.height });
    if (flags().lilaHere3) { const L = monsterArt('lila', pp ? faceTo(7 * T, 3 * T, pp.x, pp.y) : 'down', 0, now); out.push({ y: 3 * T + 16, img: L, x: 7 * T, dy: 3 * T + 16 - L.height }); }
  }
  return out;
};

// ---------- アイテム・思い出・死に方・エンディング ----------
Object.assign(ITEMS, {
  watch3: { name: '懐中時計', desc: '七年前、森の入口で目をさましたとき、ポケットに入っていた。⏱ で、少しのあいだ時を止められる。' },
  crank: { name: 'ハンドル', desc: '工房で見つけた、鉄のハンドル。四角い穴にはまりそうだ。' },
  keepKey: { name: '小さな鍵', desc: '書庫の机の引き出しにあった。札に『時計守の部屋』。' },
});
const MEMS = {
  1: '（色あせた写真）\n\n手をつないだ、女の子と小さな男の子。\nうしろの森で、木もれ日がゆれている。\n\nうらに、えんぴつで：\n『リコ　十さい　ソウタ　四さい\n　はじめての　ピクニック』',
  2: '（手帳のページ）\n\nソウタが、また夜中に泣いた。\n黒い花びらの夢をみたって。\n\nだいじょうぶ。\nおねえちゃんが、ぜったい まもるから。\n\n　　　　　　　　　リコ',
  3: '（時計守の手帳。字が、だんだん乱れていく）\n\n一日目　塔を見まわる。異常なし。\n十日目　わたしの名前は、リ……\n百日目　思いだせない。\n　　　　でも、だれかを待っている。\n　　　　ちいさな手の、だれかを。',
  4: '（クレヨンの絵）\n\n大きい女の子と、小さい男の子。\nふたりとも、わらっている。\n\n『おねえちゃん　だいすき　ソウタ』\n\n……七年前に、ぼくが描いた絵だ。',
};
DEATHS.push(
  ['grave', '名前のない墓', '森の入口の小さなお墓', 3],
  ['blade', '振り子の刃', '刃の廊下', 3],
  ['doll3', 'つぎのおともだち', '工房の空いた椅子', 3],
  ['mirror3', '映らない鏡', '書庫の古い鏡', 3],
  ['rkeeper', '時計守', '書庫での追いかけっこ', 3],
  ['door', 'はさむ扉', '一瞬だけ開く鉄の扉', 3],
  ['found3', 'みいつけた', '時計守の部屋のかくれんぼ', 3],
  ['teeth', '歯車の歯', '歯車の間', 3],
  ['bell', '鐘の綱', '鐘の間の綱', 3],
  ['lila3', '魔女の手', 'さいごの追いかけっこ', 3],
);
ENDINGS.push(
  ['c3normal', 'NORMAL END『いつか、むかえに』', 3],
  ['c3true', 'TRUE END『七年ぶりの、ただいま』', 3],
  ['c3another', 'ANOTHER END『めぐる時計』', 3],
);
Object.assign(ENDING_TEXT, {
  c3normal: [
    'ソウタは、ふりかえらずに森を走った。\nうしろで、鐘が鳴りつづけていた。',
    '森の入口で、一度だけ、塔を見上げた。\nてっぺんの窓に、小さな人かげが立っていた。',
    '時計の頭に、赤いリボン。\n人かげは、手をふるでもなく、ただ、じっと――',
    'あの夜から、ソウタは毎晩、懐中時計のぜんまいを巻く。',
    '「いつか、ぜったい、むかえにいくから」',
  ],
  c3true: [
    '止まった時の中で、ソウタは、四つの思い出をならべた。',
    '「おねえちゃん。リコ。\nぼくだよ。ソウタだよ」',
    'ピシ……と、時計の顔にひびが入った。\nその奥から、なつかしい目が、ソウタを見た。',
    '「…………ソウタ？\nおおきく、なったね」',
    '魔女は、ふたりを見て、長いあいだ黙っていた。\nやがて、大きな針に、そっと指をかけた。　3時34分。',
    '森を抜けると、東の空が白みはじめていた。\n七年ぶりに、ふたりで、家の扉をあけた。\n「……ただいま」',
  ],
  c3another: [
    '「ぼくが、かわりに時計守になる。\nだから、おねえちゃんを、かえして」',
    '魔女は、なにも言わずに、ソウタの頭に手をのせた。\n時計の音が、ソウタの中に流れこんでくる。',
    '――森の入口で、リコは目をさました。\nポケットに、懐中時計がひとつ。',
    '針は、3時33分で止まっている。\nなにか、大切なことを、忘れている気がする。',
    '塔の中では、今夜も、\nちいさな時計守が、見まわりをしている。',
  ],
});

// ---------- 鏡の中のミナ（ヒント） ----------
async function minaMirror3() {
  if (!flags().minaMet3) {
    flags().minaMet3 = true;
    await say('鏡の中に、白い服の女の子が映った。');
    await say('……ソウタくん？\nおおきく、なったね。', 'ミナ');
    await say('わたし、ミナ。リコの、おともだち。\nふたの裏の字、読んでくれたんだね。', 'ミナ');
    await say('リコはね、自分の名前を、わすれちゃったの。\n時計守になって、ずっと塔を見まわってる。', 'ミナ');
    await say('塔のあちこちに、リコの「思い出」が\nこぼれてるの。ぜんぶ、あつめて。\nそしたら、きっと……', 'ミナ');
  }
  await say(minaHint3(), 'ミナ');
}
function minaHint3() {
  const f = flags();
  if (!f.workIn) return '左の廊下の刃は、とっても速いの。\nその時計で、時を止めて（⏱）。\n止まっているあいだに、すり抜けて。';
  if (!has('crank') && !f.gearOpen) return '工房の作業台に、ハンドルがあるよ。\n上の回廊の、歯車の間の扉をあけるの。';
  if (!has('keepKey') && !f.keepOpen) return '書庫の机に、時計守の部屋の鍵があるの。\n……あの子が来たら、時を止めて逃げて。';
  if (!f.upperIn) return 'ホールの奥の鉄の扉は、ほんの一瞬しか開かないの。\n開いた瞬間に、時を止めて。';
  if (G.F.pages.length < 4) return `リコの思い出、まだあるよ（${G.F.pages.length}/4）。\n時計守の部屋や、工房も見てみて。`;
  return 'リコは、塔のてっぺんの鐘の間にいるよ。\n思い出を、わたしてあげて。\n……名前を、よんであげて。';
}

// ---------- 小さなイベント ----------
async function getMem(n) {
  if (!G.F.pages.includes(n)) G.F.pages.push(n);
  Snd.pick();
  await say(`リコの思い出を見つけた。（${G.F.pages.length}/4）`);
  await paper(`リコの思い出 ${'①②③④'[n - 1]}`, MEMS[n]);
}
function rkeeper(map, x, y, delay, extra) {
  startChase(0, map, x, y, delay, 0.28);
  Object.assign(M, { kind: 'rkeeper', caughtId: 'rkeeper' }, extra);
}
const lantern3 = (x, y, id) => ({ x, y, art: 'lantern', lantern: id, solid: true, act: () => lantern(id) });
const minaGlass3 = (x, y) => ({ x, y, art: 'mirror', act: minaMirror3 });

// ---------- マップ ----------
Object.assign(MAPS, {
  c3_gate: {
    name: '森の入口', amb: 'forest', dark: 0.82, light: 56, outdoor: true,
    rows: [
      'TTTTTpTTTTT',
      'TTTT,p,TTTT',
      'TTT,,p,,TTT',
      'TT,,,p,,,TT',
      'TT,,,p,,,TT',
      'TTT,,p,,TTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTT,,p,,TTT',
      'TT,,,p,,,TT',
      'TT,,,p,,,TT',
      'TT,,,p,,,TT',
      'TTT,,p,,TTT',
      'TTTTTpTTTTT',
    ],
    warps: [{ x: 5, y: 0, to: 'c3_court', tx: 6, ty: 11, dir: 'up' }],
    lights: [{ x: 5.5, y: 0.2, r: 26, c: 'moon' }],
    enter: async () => {
      if (flags().fleeing) { M = null; flags().fleeing = false; await ending('c3normal'); }
    },
    objs: [
      ...[[2, 9], [3, 10], [8, 9], [7, 11]].map(([x, y], i) => ({ x, y, art: 'grave', solid: true, act: async () => {
        await say(['小さなお墓。名前のところが、けずられている。', '小さなお墓。花が一輪、そなえてある。\n……黒い薔薇だ。', '小さなお墓。苔が、びっしり生えている。', 'いちばん新しいお墓。\n土が、まだやわらかい。'][i]);
        if (i !== 3) return;
        const c = await choose('掘ってみる？', ['掘る', 'やめておく']);
        if (c !== 0) return say('……やめておこう。');
        await say('土を、手でかきわけた。\n中に、小さな木の箱。');
        await say('ふたに、ソウタの名前が彫ってある――');
        await scare();
        await say('箱が、内側から、ひらいた。');
        await die('grave');
      } })),
      { x: 3, y: 3, art: 'sign', solid: true, act: async () => { await say('古い立て札。\n『この先　時計塔　――立ち入るべからず』\n……七年前と、同じだ。'); } },
      ...[[5, 11], [5, 7], [5, 4]].map(([x, y]) => ({ x, y, art: 'petals', act: async () => { await say('黒い花びらが、点々と落ちている。\nあの夜と、同じように。'); } })),
      { x: 7, y: 4, art: 'rose', solid: true, act: async () => { await say('黒い薔薇。\n……さわらないほうがいい。おねえちゃんが、そう言ってた。'); } },
    ],
    steps: [{ test: (x, y) => y === 13, act: async () => { await say('……ここで帰ったら、七年前と同じだ。'); G.p.dir = 'up'; await warp('c3_gate', 5, 12, 'up'); } }],
  },

  c3_court: {
    name: '枯れた中庭', amb: 'forest', dark: 0.84, light: 54, outdoor: true, style: 'stone',
    rows: [
      '#############',
      '######d######',
      'T,,,,,p,,,,,T',
      'T,,,,,p,,,,,T',
      'T,ww,,p,,,,,T',
      'T,ww,,p,,,,,T',
      'T,,,,,p,,,,,T',
      'TT,,,,p,,,,TT',
      'TT,,,,p,,,,TT',
      'TTT,,,p,,,TTT',
      'TTT,,,p,,,TTT',
      'TTTT,,p,,TTTT',
      'TTTTTTpTTTTTT',
    ],
    warps: [
      { x: 6, y: 1, to: 'c3_hall', tx: 6, ty: 9, dir: 'up', door: true },
      { x: 6, y: 12, to: 'c3_gate', tx: 5, ty: 1, dir: 'down' },
    ],
    lights: [{ x: 6.5, y: 1.2, r: 24, c: 'moon' }],
    enter: async () => {
      if (flags().courtIn) return;
      flags().courtIn = true;
      await say('石づくりの塔。てっぺんの時計は、3時33分。');
      await say('扉の黒い薔薇は、ぜんぶ枯れて、\n灰色になっている。');
    },
    objs: [
      { x: 3, y: 4, art: 'fountain', solid: true, act: async () => {
        await say('水の枯れた噴水。\n時計を胸にかかえた、女の人の像。');
        if (!hasPage(1)) { await say('底のすき間に、紙が一枚はさまっている。'); await getMem(1); }
      } },
      { x: 9, y: 4, art: 'wellLid', solid: true, act: async () => { await say('古い井戸。重たいふたが、のせてある。\nふたの上に、子どもの手のあとが、たくさん。'); } },
      { x: 10, y: 6, art: 'ribbon', act: async () => { await say('石だたみのすき間に、赤い糸くず。\n……おねえちゃんのリボンと、同じ色だ。'); } },
      lantern3(10, 9, 'c3court'),
    ],
  },

  c3_hall: {
    name: '止まったホール', amb: 'tower', dark: 0.87, light: 50, style: 'stone',
    rows: [
      '#############',
      '######S######',
      '#...........#',
      '#...........#',
      '#...........#',
      'd...........d',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '######d######',
    ],
    warps: [
      { x: 6, y: 10, to: 'c3_court', tx: 6, ty: 2, dir: 'down', door: true },
      { x: 0, y: 5, to: 'c3_corr', tx: 3, ty: 11, dir: 'up', door: true },
      { x: 12, y: 5, to: 'c3_lib', tx: 1, ty: 4, dir: 'right', door: true },
      { x: 6, y: 1, to: 'c3_upper', tx: 6, ty: 7, dir: 'up' },
    ],
    lights: [{ x: 6.5, y: 4, r: 22, c: 'moon' }],
    enter: async () => {
      if (M && M.kind === 'rkeeper') {
        M = null; flags().chase1Done = true; Snd.setAmb('tower');
        await sleep(300);
        await say('……カチ、コチという音が、書庫の扉の前で止まった。');
        await say('時計守は、ホールには入ってこない……？');
        return;
      }
      if (flags().hallIn) return;
      flags().hallIn = true;
      await say('中は、ひんやりとしている。\n……ここ、知ってる気がする。');
      await say('階段の前に、鉄の扉。\nガシャン、ガシャンと、ひらいては閉じている。');
    },
    objs: [
      { x: 6, y: 2, shutter: true, art: () => shutterOpen() ? null : 'gateIron', get solid() { return !shutterOpen(); }, act: async () => {
        await say('鉄の扉が、ほんの一瞬だけひらいて、\nすぐに、ガシャンと閉じる。');
        await say('（ひらいた瞬間に、時を止められたら……）');
      } },
      { x: 2, y: 1, art: 'clock', act: async () => { await say('柱時計。3時33分。\n……振り子だけが、かすかにふるえている。'); } },
      { x: 9, y: 1, art: 'painting_girl', act: async () => { await say('女の子の絵。顔のところに、時計が描きたしてある。\n金のプレートに『二代目　時計守』。'); } },
      minaGlass3(4, 1),
      lantern3(10, 9, 'c3hall'),
    ],
  },

  c3_corr: {
    name: '刃の廊下', amb: 'tower', dark: 0.88, light: 48, style: 'stone',
    rows: [
      '###d###',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '###d###',
    ],
    warps: [
      { x: 3, y: 12, to: 'c3_hall', tx: 1, ty: 5, dir: 'right', door: true },
      { x: 3, y: 0, to: 'c3_work', tx: 5, ty: 7, dir: 'up', door: true },
    ],
    hazards: [
      { kind: 'swing', y: 3, cx: 3, amp: 2.3, w: 3.1, ph: 0 },
      { kind: 'swing', y: 6, cx: 3, amp: 2.3, w: 3.7, ph: 2.1 },
      { kind: 'swing', y: 9, cx: 3, amp: 2.3, w: 2.7, ph: 4.2 },
    ],
    enter: async () => {
      if (flags().corrIn) return;
      flags().corrIn = true;
      await say('細長い廊下。\n天井から、大きな刃が三つ、ぶんぶんとゆれている。');
      await say('……速すぎる。とても、通れない。');
      await say('（ポケットの懐中時計が、カチ、と鳴った）');
      await say('（画面の右上の ⏱ で、時を止められる。\n止めていられるのは、少しのあいだだけ）');
    },
    objs: [lantern3(5, 11, 'c3corr')],
  },

  c3_work: {
    name: '人形の工房', amb: 'tower', dark: 0.88, light: 48, style: 'stone',
    rows: [
      '###########',
      '###########',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#####d#####',
    ],
    warps: [{ x: 5, y: 8, to: 'c3_corr', tx: 3, ty: 1, dir: 'down', door: true }],
    enter: async () => {
      if (flags().workIn) return;
      flags().workIn = true;
      await say('人形だらけの部屋。\nどの人形も、ちがう服を着た子どもだ。');
    },
    objs: [
      ...[3, 4, 6, 7].map(x => ({ x, y: 1, art: 'dollShelf', act: async () => { await say(x === 4 ? '人形がならんでいる。\n札に『ミナの　おともだち』。' : '人形がならんでいる。\n……みんな、こっちを見ている。'); } })),
      { x: 5, y: 3, art: 'sotaDoll', solid: true, act: async () => {
        await say('椅子に、男の子の人形がすわっている。\n青いシャツ。……七年前の、ぼくの顔だ。');
        await say('胸に、札。『しっぱい　――時間がたりなかった』');
      } },
      { x: 2, y: 4, art: 'dollChair', solid: true, act: async () => {
        await say('空いている椅子。\n背もたれに『つぎの　おともだち』と書いてある。');
        const c = await choose('すわってみる？', ['すわる', 'やめておく']);
        if (c !== 0) return say('……やめておこう。');
        await say('椅子に、こしかけた。\nひじかけが、カチリと手首をはさんだ。');
        await say('指先から、だんだん、かたく、つめたく……');
        await die('doll3');
      } },
      { x: 8, y: 5, art: () => has('crank') || flags().gearOpen ? 'ktable' : 'crankTable', solid: true, act: async () => {
        if (has('crank') || flags().gearOpen) return say('作業台。小さな工具が散らばっている。');
        await say('作業台の上に、鉄のハンドルがある。');
        await getItem('crank');
      } },
      { x: 2, y: 7, art: 'paper', glint: true, when: () => !hasPage(4), act: async () => { await say('棚のすみに、古い画用紙が一枚。'); await getMem(4); } },
      minaGlass3(9, 1),
      lantern3(9, 7, 'c3work'),
    ],
  },

  c3_lib: {
    name: '書庫', amb: 'tower', dark: 0.87, light: 50, style: 'stone',
    rows: [
      '#############',
      '#############',
      '#...........#',
      '#...........#',
      'd...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#############',
    ],
    warps: [{ x: 0, y: 4, to: 'c3_hall', tx: 11, ty: 5, dir: 'left', door: true }],
    objs: [
      ...[2, 3, 4, 6, 7].map((x, i) => ({ x, y: 1, art: 'shelf', act: async () => {
        await say(['『時計のしくみ』\n歯車の絵がたくさん描いてある。', '『時を止める術』\n「止めた時の中で、名を呼ばれた守り手は、もとの姿をとりもどす」', '『薔薇と契約』\n「時を差しだした者は、名を失い、塔の守り手となる」', '絵本。『とけいの　くにの　おひめさま』', '『時計守の心得』\n「書庫と、主の部屋を、見まわること」'][i]);
      } })),
      { x: 10, y: 1, art: 'mirror', act: async () => {
        await say('くもった、古い鏡。\n……ソウタの姿が、映っていない。');
        const c = await choose('ふいて、のぞいてみる？', ['のぞく', 'やめておく']);
        if (c !== 0) return say('……やめておこう。');
        await say('そでで、くもりをふいた。\n鏡の中には、だれもいない部屋が映っている。');
        await say('……ふりかえると、自分の手が、すけていた。');
        await scare();
        await die('mirror3');
      } },
      { x: 6, y: 4, art: 'desk', solid: true, act: async () => {
        if (!hasPage(2)) { await say('机の上に、手帳のページが一枚。'); await getMem(2); }
        if (has('keepKey') || flags().keepOpen) return say('机の引き出しは、からっぽだ。');
        await say('引き出しの中に、小さな鍵がある。');
        await getItem('keepKey');
        if (flags().chase1Done) return;
        await sleep(400);
        Snd.tick(); await sleep(350); Snd.tick(true); await sleep(350);
        await say('カチ……コチ……カチ……コチ……');
        await say('扉のほうから、だれかが、入ってくる。');
        rkeeper('c3_lib', 1, 6, 0.9, { follow: true, safe: ['c3_hall'] });
        await sleep(1200);
        await say('時計の頭。……赤い、リボン。');
        await say('……おねえちゃん？');
        if (!flags().stopTold) await say('（⏱ で時を止めて、そのすきに！）');
      } },
      lantern3(10, 7, 'c3lib'),
    ],
  },

  c3_upper: {
    name: '上の回廊', amb: 'tower', dark: 0.86, light: 50, style: 'stone',
    rows: [
      '#############',
      '#############',
      '#...........#',
      '#...........#',
      'd...........d',
      '#...........#',
      '#...........#',
      '#...........#',
      '######S######',
    ],
    warps: [
      { x: 6, y: 8, to: 'c3_hall', tx: 6, ty: 3, dir: 'down' },
      { x: 0, y: 4, to: 'c3_keep', tx: 7, ty: 4, dir: 'left', door: true, when: () => flags().keepOpen },
      { x: 12, y: 4, to: 'c3_gear', tx: 6, ty: 8, dir: 'up', door: true, when: () => flags().gearOpen },
    ],
    enter: async () => {
      if (flags().upperIn) return;
      flags().upperIn = true;
      await say('鉄の扉の向こうは、長い回廊だった。\n左右に、扉がひとつずつ。');
    },
    objs: [
      { x: 0, y: 4, art: 'doorLock', solid: true, when: () => !flags().keepOpen, act: async () => {
        await say('鍵のかかった扉。\n札に『時計守の部屋』。');
        if (!has('keepKey')) return say('……鍵がいる。');
        G.F.items = G.F.items.filter(i => i !== 'keepKey');
        flags().keepOpen = true; Snd.click();
        await say('小さな鍵を回した。カチャリ。');
      } },
      { x: 12, y: 4, art: 'doorCrank', solid: true, when: () => !flags().gearOpen, act: async () => {
        await say('鉄の扉。取っ手がなくて、\nかわりに四角い穴があいている。');
        if (!has('crank')) return say('……なにか、はめるものがあれば。');
        G.F.items = G.F.items.filter(i => i !== 'crank');
        flags().gearOpen = true; Snd.gears();
        await say('ハンドルをはめて、ぐるぐる回した。\n扉が、重たい音をたてて上がっていく。');
      } },
      minaGlass3(3, 1),
      { x: 9, y: 1, art: 'window', act: async () => { await say('窓の外に、森が広がっている。\nずっと遠くに、小さな明かり。\n……ぼくの家だ。'); } },
      lantern3(10, 7, 'c3upper'),
    ],
  },

  c3_keep: {
    name: '時計守の部屋', amb: 'tower', dark: 0.86, light: 50, style: 'stone',
    rows: [
      '#########',
      '#########',
      '#.......#',
      '#.......#',
      '#.......d',
      '#.......#',
      '#.......#',
      '#.......#',
      '#########',
    ],
    warps: [{ x: 8, y: 4, to: 'c3_upper', tx: 1, ty: 4, dir: 'right', door: true, when: () => !(M && M.kind === 'rkeeper' && M.map === 'c3_keep') }],
    steps: [{ test: (x, y) => x === 8 && y === 4, when: () => !!(M && M.kind === 'rkeeper' && M.map === 'c3_keep'), act: async () => { await say('扉の向こうに、時計守が立っている！'); G.p.dir = 'left'; await warp('c3_keep', 7, 4, 'left'); } }],
    enter: async () => {
      if (flags().keepIn) return;
      flags().keepIn = true;
      await say('せまい部屋。かたいベッドと、たんすだけ。\n……かべに、子どもの絵が、たくさん貼ってある。');
    },
    objs: [
      { x: 2, y: 2, art: 'bed', solid: true, act: async () => { await say('かたいベッド。\nまくらもとに、赤いリボンが一本。'); } },
      { x: 5, y: 1, art: 'drawingFaded', act: async () => { await say('色あせた絵が、何枚も。\nどれも、手をつないだ、ふたりの子ども。'); } },
      { x: 2, y: 6, art: 'wardrobe', solid: true, act: hideIn },
      { x: 5, y: 4, art: 'desk', solid: true, act: async () => {
        if (hasPage(3)) return say('机の上は、きれいに片づいている。');
        await say('机の上に、すりきれた手帳がある。');
        await getMem(3);
        if (flags().chase2Done) return;
        await sleep(400);
        Snd.tick(); await sleep(300); Snd.tick(true); await sleep(300); Snd.tick();
        await say('カチ、コチ、カチ、コチ――\n見まわりの足音が、もどってくる！');
        await say('（どこかに、かくれなきゃ！）');
        rkeeper('c3_keep', 8, 4, 2.4, { doneFlag: 'chase2Done', hideTime: 5.5, follow: false });
      } },
      lantern3(1, 7, 'c3keep'),
    ],
  },

  c3_gear: {
    name: '歯車の間', amb: 'tower', dark: 0.86, light: 50, style: 'stone',
    rows: [
      '#############',
      '######S######',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '######d######',
    ],
    warps: [
      { x: 6, y: 9, to: 'c3_upper', tx: 11, ty: 4, dir: 'left', door: true },
      { x: 6, y: 1, to: 'c3_bell', tx: 5, ty: 6, dir: 'up' },
    ],
    hazards: [
      { kind: 'roll', y: 3, x0: 1, x1: 11, v: 3.4, ph: 0, n: 2 },
      { kind: 'roll', y: 5, x0: 1, x1: 11, v: -4.0, ph: 3, n: 2 },
      { kind: 'roll', y: 7, x0: 1, x1: 11, v: 3.0, ph: 6, n: 3 },
    ],
    enter: async () => {
      if (flags().gearIn3) return;
      flags().gearIn3 = true;
      await say('塔の時計の、機械の中。\n大きな歯車が、床の上を、ごろごろと転がっている。');
      await say('……止まった塔の中で、ここだけが動いている。');
    },
    objs: [
      ...[2, 4, 8, 10].map(x => ({ x, y: 1, art: 'bigGear', act: async () => { await say('かべの大きな歯車。ぎし、ぎし、と回っている。'); } })),
      lantern3(11, 8, 'c3gear'),
    ],
  },

  c3_bell: {
    name: '鐘の間', amb: 'tower', dark: 0.84, light: 52, style: 'stone',
    rows: [
      '###########',
      '###########',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#####S#####',
    ],
    warps: [{ x: 5, y: 7, to: 'c3_gear', tx: 6, ty: 2, dir: 'down' }],
    lights: [{ x: 5.5, y: 1, r: 34, c: 'moon' }],
    enter: async () => {
      if (flags().bellIn) return;
      flags().bellIn = true;
      await say('塔のてっぺん。大きな鐘の下に、\n時計の頭をした女の子が、立っている。');
      await say('赤いリボン。紺色のワンピース。\n……七年前と、同じ服。');
      await sleep(300);
      flags().lilaHere3 = true;
      Snd.bell();
      await say('……その時計。\nあなた、あの子の弟ね。', '魔女');
      await say('あの子は、自分から時間をさしだしたの。\nあなたのかわりに。', '魔女');
      await say('名前も、もう覚えていない。\nセナの時計を守る、りっぱな時計守よ。', '魔女');
    },
    objs: [
      { x: 5, y: 1, art: 'bigBell', act: async () => { await say('大きな鐘。ふちに、小さな文字がたくさん刻まれている。\n……子どもの名前だ。'); } },
      { x: 8, y: 2, art: 'rope', act: async () => {
        await say('鐘の綱が、たれさがっている。');
        const c = await choose('ひっぱってみる？', ['ひっぱる', 'やめておく']);
        if (c !== 0) return say('……やめておこう。');
        await say('綱を、思いきりひいた。');
        Snd.bell(); shake();
        await say('ゴォォン――\n頭の上で、なにかが、ちぎれる音がした。');
        await die('bell');
      } },
      { x: 3, y: 3, art: null, solid: true, act: () => finalChoice3() },
      { x: 7, y: 3, art: null, solid: true, when: () => flags().lilaHere3, act: async () => {
        await say('この塔の時計は、セナのためにあるの。\n止めておかなくちゃ、いけないの。', '魔女');
      } },
      { x: 8, y: 5, art: 'bedSena', solid: true, act: async () => { await say('小さなベッドで、女の子が眠っている。\n胸の上で組んだ手が、ぴくりとも動かない。'); } },
      lantern3(1, 6, 'c3bell'),
    ],
  },
});
for (const id of Object.keys(MAPS)) {
  const m = MAPS[id];
  if (m.id) continue;
  m.id = id; m.h = m.rows.length; m.w = m.rows[0].length;
  m.rows.forEach((r, i) => { if (r.length !== m.w) console.warn('row length', id, i); });
  m.objs = m.objs || []; m.warps = m.warps || []; m.steps = m.steps || []; m.lights = m.lights || [];
}

// ---------- さいごの選択 ----------
async function finalChoice3() {
  if (flags().fleeing) return;
  const fz = frozen();     // しらべた瞬間に、時が止まっていたか
  if (fz) await say('止まった時の中で、時計守の針も、止まっている。');
  else await say('時計守は、ソウタをじっと見ている。\nカチ……コチ……');
  const opts = ['逃げる'];
  if (G.F.pages.length === 4) opts.push('思い出をわたして、名前をよぶ');
  opts.push('ぼくが、かわりに時計守になる', 'やめておく');
  const c = await choose('どうする？', opts);
  const pick = opts[c];
  if (!pick || pick === 'やめておく') return;
  if (pick.startsWith('思い出')) {
    if (!fz) return say('（時計守は、ずっと時計の音にしばられている……\n時を止めた中でなら、声がとどくかもしれない）');
    return trueEnd3();
  }
  if (pick.startsWith('ぼくが')) {
    const k = await choose('ほんとうに？', ['なる', 'やっぱりやめる']);
    if (k !== 0) return;
    await ending('c3another');
  }
  await say('……ごめん、おねえちゃん。\nいまは、まだ、むりだ。');
  await say('逃がさないわ。\nその時計も、置いていきなさい――！', '魔女');
  flags().lilaHere3 = false; flags().fleeing = true;
  Snd.crack(); shake();
  await say('走れ！');
  startChase(0, 'c3_bell', 7, 3, 1.4, 0.27);
  Object.assign(M, { kind: 'lila', caughtId: 'lila3', follow: true, safe: [], lag: 1.0 });
}
async function trueEnd3() {
  flags().rikoAwake = true;
  await say('止まった時の中で、ソウタは、\n四つの思い出を、時計守の前にならべた。');
  await say('写真。手帳のページ。乱れた字の手帳。\nクレヨンの絵。');
  await say('「おねえちゃん」');
  await say('「リコ！」');
  Snd.chime();
  await ending('c3true');
}

// ---------- はじまり ----------
function newState3() {
  return { map: 'c3_gate', p: { x: 5, y: 12, dir: 'up' }, F: { items: ['watch3'], pages: [], f: {}, lit: [] } };
}
async function newGame3() {
  G = newState3();
  G.p = { x: 5, y: 12, dir: 'up', tx: 5, ty: 12, moving: false, t: 0, anim: 0 };
  S3.t = 0; S3.stopUntil = 0; S3.coolUntil = 0;
  await fade(true, 600);
  startPlay();
  enterMap('c3_gate', 5, 12, 'up');
  await fade(false, 1000);
  run(async () => {
    if (!meta.endings.includes('c2another')) await say('（これは、リコが自分の時間をさしだした、\nもうひとつの物語）');
    await say('――あれから、七年。');
    await say('ソウタは、十二歳になった。\n家では、だれも、おねえちゃんの話をしない。');
    await say('机のひきだしの奥に、あの日ポケットに\n入っていた懐中時計。ずっと、3時33分のまま。');
    await say('今夜、その針が、はじめて動いた。\nカチ……');
    await say('ふたの裏に、うすい文字が浮かんでいる。\n『リコを　よんで　――ミナ』');
    await say('……おねえちゃん。');
  });
}
