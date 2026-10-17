'use strict';
// くろばらの館 第二章『魔女の時計塔』
//   game.js のしくみ（マップ・イベント・追いかけっこ）を使い、ここでは第二章の部屋・物語・絵を足す。
//   新しい遊び：懐中時計で「昔」と「今」を切りかえる／たんすにかくれる／鏡の中のミナのヒント

// ---------- 色・絵 ----------
PAL.sena = { hair: '#9a7450', hairL: '#c09a6a', skin: '#f4dcca', eye: '#3a2418', dress: '#f2eee6', dressD: '#d4ccc0',
  collar: '#ffffff', sock: '#ffffff', shoe: '#b0a090', ribbon: '#e8c8d0', cheek: '#f0b0b0', long: true };

Object.assign(ARTS, {
  petals: [16, 16, (g, R) => { [[3, 4], [10, 7], [6, 11], [12, 13], [2, 12]].forEach(([x, y]) => { R('#2a0610', x, y, 2, 1); R('#5a0e22', x, y, 1, 1); }); }],
  hat: [16, 16, (g, R) => {
    R('#2a4a7a', 4, 8, 8, 4); R('#1e3a62', 3, 11, 10, 2); R('#3a5a8a', 5, 8, 6, 1); R('#e8e0d0', 7, 7, 2, 1);
  }],
  shine: [16, 16, (g, R) => { R('#c8b070', 6, 10, 4, 3); R('#f0e0a0', 7, 10, 2, 1); R('#8a7040', 7, 9, 2, 1); }],
  fountain: [16, 24, (g, R) => {
    R('#4a4a52', 3, 18, 10, 6); R('#5a5a64', 2, 17, 12, 2); R('#3a3a42', 6, 8, 4, 10);
    R('#6a6a74', 5, 3, 6, 6); R('#7a7a84', 6, 1, 4, 3); R('#5a5a64', 4, 6, 1, 4); R('#5a5a64', 11, 6, 1, 4);
    R('#c8b070', 6, 6, 4, 3); R('#2a2010', 7, 7, 1, 1); R('#2a2010', 8, 7, 1, 1);
  }],
  well: [16, 18, (g, R) => {
    R('#3a3a42', 2, 8, 12, 9); R('#4a4a54', 2, 8, 12, 2); R('#000', 4, 9, 8, 2);
    R('#2a1a10', 2, 1, 2, 8); R('#2a1a10', 12, 1, 2, 8); R('#3a2618', 1, 0, 14, 2); R('#6a6a60', 7, 2, 1, 6);
  }],
  wellLid: [16, 18, (g, R) => {
    R('#3a3a42', 2, 8, 12, 9); R('#4a4a54', 2, 8, 12, 2); R('#5a3a22', 3, 7, 10, 3); R('#3a2414', 3, 9, 10, 1);
    R('#2a1a10', 2, 1, 2, 8); R('#2a1a10', 12, 1, 2, 8); R('#3a2618', 1, 0, 14, 2);
  }],
  thornDoor: [16, 16, (g, R) => {
    R('#1a0e08', 1, 0, 14, 16); R('#3a2414', 2, 1, 12, 15);
    for (let i = 0; i < 14; i++) { const x = (i * 7) % 14 + 1, y = (i * 5) % 15; R('#0c1a10', x, y, 3, 2); R('#22040c', x + 1, y, 1, 1); }
    R('#0c1a10', 0, 4, 16, 1); R('#0c1a10', 0, 10, 16, 1); R('#0c1a10', 5, 0, 1, 16); R('#0c1a10', 11, 0, 1, 16);
  }],
  pendulum: [16, 44, (g, R) => {
    R('#5a4a2a', 7, 0, 2, 32); R('#8a7040', 7, 0, 1, 32);
    R('#8a7040', 2, 31, 12, 12); R('#a88a4a', 3, 32, 10, 10); R('#c8a860', 5, 34, 6, 6); R('#6a5430', 7, 36, 2, 2);
  }],
  gateIron: [16, 16, (g, R) => {
    for (let x = 1; x < 16; x += 3) R('#3a3a40', x, 0, 1, 16);
    R('#4a4a52', 0, 2, 16, 1); R('#4a4a52', 0, 13, 16, 1); R('#8a7a40', 7, 7, 2, 3);
  }],
  bigpot: [16, 16, (g, R) => {
    R('#5a3a2a', 2, 6, 12, 9); R('#6a4a36', 1, 5, 14, 2); R('#3a2418', 3, 6, 10, 1);
    R('#2a1a10', 6, 8, 1, 4); R('#2a1a10', 7, 11, 2, 1);
  }],
  bigpotSoil: [16, 16, (g, R) => {
    R('#7a5a3a', 2, 6, 12, 9); R('#8a6a46', 1, 5, 14, 2); R('#3a2a1a', 3, 5, 10, 2); R('#4a3a24', 5, 5, 3, 1);
  }],
  bigpotSprout: [16, 16, (g, R) => {
    R('#7a5a3a', 2, 6, 12, 9); R('#8a6a46', 1, 5, 14, 2); R('#3a2a1a', 3, 5, 10, 2);
    R('#5a9a4a', 7, 2, 1, 4); R('#6aaa5a', 8, 2, 2, 1);
  }],
  vineUp: [16, 48, (g, R) => {
    R('#5a3a2a', 2, 38, 12, 9); R('#6a4a36', 1, 37, 14, 2);
    for (let y = 0; y < 40; y++) { const x = 6 + Math.round(Math.sin(y / 4) * 3); R('#16301c', x, y, 4, 1); R('#24442a', x + 1, y, 1, 1); }
    [[3, 6], [10, 14], [4, 22], [11, 28], [3, 33]].forEach(([x, y]) => { R('#e8e4ec', x, y, 3, 3); R('#22040c', x + 1, y + 1, 1, 1); R('#16301c', x - 1, y + 1, 1, 1); });
  }],
  vineTop: [16, 16, (g, R) => {
    R('#08060a', 2, 3, 12, 11); R('#1a1418', 1, 2, 14, 2);
    for (let y = 2; y < 16; y++) { const x = 6 + Math.round(Math.sin(y / 3) * 2); R('#16301c', x, y, 4, 1); R('#24442a', x + 1, y, 1, 1); }
    R('#e8e4ec', 10, 5, 3, 3);
  }],
  roseWhite: [16, 16, (g, R) => {
    R('#1a3020', 2, 6, 12, 9); R('#24402a', 3, 4, 10, 4); R('#1a3020', 1, 9, 14, 5);
    [[3, 5], [8, 4], [10, 9], [4, 10], [7, 8]].forEach(([x, y]) => { R('#e8e4ec', x, y, 3, 3); R('#ffffff', x + 1, y, 1, 1); R('#c8c4cc', x, y + 1, 1, 1); });
  }],
  drawing: [16, 16, (g, R) => {
    R('#e8dcc4', 3, 2, 10, 10); R('#d0c4ac', 3, 11, 10, 1);
    R('#f0a020', 4, 3, 3, 3); R('#f0c040', 5, 4, 1, 1);
    R('#4a6aaa', 8, 5, 4, 4); R('#e8dcc4', 9, 6, 2, 2); R('#3a2a1a', 10, 6, 1, 2); R('#3a2a1a', 10, 7, 1, 1); R('#3a2a1a', 9, 8, 1, 1);
    R('#c04060', 5, 9, 2, 1);
  }],
  drawingFaded: [16, 16, (g, R) => {
    R('#8a8070', 3, 2, 10, 10); R('#706858', 3, 11, 10, 1); R('#9a8040', 4, 3, 3, 3); R('#4a5a7a', 8, 5, 4, 4); R('#8a8070', 9, 6, 2, 2);
  }],
  wardrobe: [16, 26, (g, R) => {
    R('#2a1a10', 1, 0, 14, 26); R('#3a2618', 2, 2, 12, 22); R('#2a1a10', 7, 2, 2, 22);
    R('#4a3220', 3, 4, 3, 18); R('#4a3220', 10, 4, 3, 18); R('#a8823a', 6, 12, 1, 2); R('#a8823a', 9, 12, 1, 2); R('#1a100a', 0, 24, 16, 2);
  }],
  bigGear: [16, 16, (g, R) => {
    R('#4a4030', 3, 3, 10, 10); R('#5a5038', 4, 4, 8, 8); R('#2a2418', 6, 6, 4, 4); R('#1a1610', 7, 7, 2, 2);
    [[7, 0], [7, 13], [0, 7], [13, 7], [2, 2], [12, 2], [2, 12], [12, 12]].forEach(([x, y]) => R('#4a4030', x, y, 3, 3));
  }],
  gearbox: [16, 18, (g, R) => {
    R('#3a3a40', 1, 2, 14, 15); R('#4a4a52', 2, 3, 12, 13); R('#1a1a20', 5, 6, 6, 6); R('#2a2a30', 6, 7, 4, 4);
    R('#5a5038', 3, 4, 3, 3); R('#5a5038', 10, 12, 3, 3);
  }],
  gearboxFull: [16, 18, (g, R) => {
    R('#3a3a40', 1, 2, 14, 15); R('#4a4a52', 2, 3, 12, 13); R('#8a7040', 5, 6, 6, 6); R('#c8a860', 6, 7, 4, 4); R('#4a4030', 7, 8, 2, 2);
    R('#5a5038', 3, 4, 3, 3); R('#5a5038', 10, 12, 3, 3);
  }],
  dial: [16, 24, (g, R) => {
    R('#2a2018', 4, 10, 8, 14); R('#3a2a20', 5, 11, 6, 12);
    R('#6a5a3a', 1, 0, 14, 12); R('#e8e0cc', 2, 1, 12, 10); R('#2a1a10', 7, 2, 1, 5); R('#2a1a10', 8, 6, 3, 1);
    [[7, 1], [12, 5], [7, 9], [2, 5]].forEach(([x, y]) => R('#6a5a3a', x, y, 2, 1));
  }],
  cradle: [16, 20, (g, R) => {
    R('#5a4030', 1, 8, 14, 10); R('#6a5040', 2, 9, 12, 2); R('#3a2818', 1, 17, 14, 2);
    R('#f2d0b5', 4, 6, 5, 4); R('#3a2a20', 3, 5, 7, 2); R('#3a2a20', 3, 7, 1, 2); R('#24141c', 5, 8, 2, 0.5);
    R('#2a4a7a', 6, 10, 8, 4); R('#e8e0d0', 8, 10, 3, 1);
    for (let i = 0; i < 5; i++) R('#c8a860', 1 + i * 3, 4 + (i % 2), 1, 5);
  }],
  clockWall: [16, 16, (g, R) => {
    R('#1a1610', 0, 0, 16, 16); R('#e8e0cc', 1, 1, 14, 14); R('#d0c8b4', 2, 2, 12, 12);
    R('#2a1a10', 7, 3, 1, 5); R('#2a1a10', 8, 7, 4, 1); R('#2a1a10', 7, 7, 2, 2);
    [[7, 1], [13, 7], [7, 13], [1, 7]].forEach(([x, y]) => R('#2a1a10', x, y, 2, 2));
  }],
  shoe: [16, 16, (g, R) => { R('#3a2420', 5, 10, 7, 3); R('#5a3a30', 5, 9, 3, 2); R('#e8e0d0', 6, 9, 1, 1); }],
  bedSena: [16, 26, (g, R) => {
    R('#2a1a12', 1, 0, 14, 7); R('#3a2618', 2, 1, 12, 5);
    R('#f0e8ee', 3, 6, 10, 5);
    R('#9a7450', 4, 4, 8, 6); R('#9a7450', 3, 7, 2, 4); R('#9a7450', 11, 7, 2, 4); R('#c09a6a', 5, 4, 4, 1);
    R('#f4dcca', 5, 7, 6, 4); R('#3a2418', 6, 9, 2, 0.6); R('#3a2418', 9, 9, 2, 0.6); R('#f0b0b0', 5, 10, 1, 1); R('#f0b0b0', 10, 10, 1, 1);
    R('#e8d0dc', 1, 11, 14, 13); R('#d4bcc8', 1, 14, 14, 1); R('#d4bcc8', 1, 19, 14, 1); R('#f4e4ec', 2, 11, 12, 1); R('#c8a8b8', 7, 13, 4, 6);
    R('#2a1a12', 0, 23, 16, 3);
  }],
  stump: [16, 16, (g, R) => { R('#2a1a10', 4, 6, 8, 8); R('#4a3220', 4, 5, 8, 2); R('#3a2618', 6, 5, 4, 1); }],
});

// 時計守（あたまが時計の、背の高い影）と、魔女リラ
function monsterArt(kind, dir, fr, t) {
  const tk = kind === 'keeper' ? ((t * 2) | 0) % 4 : 0;
  return art(`m-${kind}-${dir}-${fr}-${tk}`, 16, 28, (g, R) => {
    if (dir === 'left') { g.translate(16, 0); g.scale(-1, 1); }
    R('rgba(0,0,0,.45)', 3, 26, 10, 2);
    const leg = (x, l) => { R('#060409', x, 21, 2, 6 - l); };
    if (fr === 1) { leg(5, 0); leg(9, 2); } else if (fr === 2) { leg(5, 2); leg(9, 0); } else { leg(5, 0); leg(9, 0); }
    if (kind === 'keeper') {
      R('#0b0710', 4, 9, 8, 13); R('#140c1a', 3, 11, 10, 9); R('#0b0710', 2, 12, 2, 10); R('#0b0710', 12, 12, 2, 10);
      R('#0b0710', 1, 21, 2, 3); R('#0b0710', 13, 21, 2, 3);
      R('#2a2418', 3, 0, 10, 10); R('#e8e0cc', 4, 1, 8, 8);
      const hands = [[7, 2, 1, 3], [7, 4, 3, 1], [7, 4, 1, 3], [4, 4, 3, 1]][tk];
      R('#1a1008', 7, 4, 2, 2); R('#1a1008', ...hands);
      R('#5a4a2a', 7, 14, 2, 6); R('#a88a4a', 6, 19, 4, 3);
    } else {
      R('#0c0a12', 4, 10, 8, 12); R('#14101c', 3, 13, 10, 9); R('#0c0a12', 2, 21, 12, 2);
      R('#d8d4e0', 3, 1, 10, 3); R('#d8d4e0', 2, 3, 12, 12);
      if (dir !== 'up') {
        R('#e8dcd8', 5, 4, 6, 6); R('#d8d4e0', 5, 4, 6, 1);
        if (dir === 'down') { R('#8a1020', 6, 6, 1, 1); R('#8a1020', 9, 6, 1, 1); R('#5a4a54', 7, 8, 2, 0.5); }
        else R('#8a1020', 9, 6, 1, 1);
      }
      R('#2a1430', 6, 10, 4, 1); R('#e8dcd8', 2, 16, 2, 2); R('#e8dcd8', 12, 16, 2, 2);
    }
  });
}

// 物の上に重ねて描くもの（ベッドのセナ、立っている魔女、ゆれる振り子）
function extraSprites(m, pp) {
  const out = [];
  if (m.id === 'c2_face' && flags().lilaHere && !M) {
    const img = monsterArt('lila', pp ? faceTo(5 * T, 2 * T, pp.x, pp.y) : 'down', 0, now);
    out.push({ y: 2 * T + 16, img, x: 5 * T, dy: 2 * T + 16 - img.height });
  }
  if (m.id === 'c2_hall@past') {
    const sw = Math.sin(now * 2.4) * 5;
    const img = getArt('pendulum');
    out.push({ y: 4 * T + 16.1, img, x: 6 * T + Math.round(sw), dy: 4 * T + 16 - img.height });
  }
  return out;
}

// ---------- アイテム・手紙・死に方・エンディング ----------
Object.assign(ITEMS, {
  watch: { name: '懐中時計', desc: '噴水の底で見つけた。3時33分で止まっている。⌛ で針を回すと「昔」と「今」が切りかわる。' },
  hat: { name: 'ソウタの帽子', desc: '弟のソウタの帽子。森のはずれに落ちていた。' },
  seed: { name: '白い薔薇の種', desc: '「昔」の台所で見つけた。セナさまの花壇用、と書いてあった。' },
  gear: { name: '小さな歯車', desc: 'セナの部屋のおもちゃ箱に入っていた。金色の歯車。' },
});
const LETTERS = {
  1: 'おかあさんへ\n\nきょう、白いばらが　さいたよ。\nおかあさんの　すきな　いろ。\nわたしも　すき。',
  2: 'おかあさんへ\n\nおくすり、にがいけど　がんばって　のむね。\nげんきに　なったら、\nもりへ　ピクニックに　いこうね。',
  3: 'おかあさんへ\n\nねむるの、こわくないよ。\nおかあさんが　手を　にぎってくれるから。',
  4: 'おかあさんへ\n\nもしも、わたしが　いなくなっても、\nとけいは　とめないで。\nおかあさんの　じかんまで、とまっちゃうから。\n\nだいすき。　セナ',
};
DEATHS.push(
  ['well', '井戸の底', '中庭の古井戸', 2],
  ['vine', '薔薇の苗床', '温室の黒い薔薇', 2],
  ['pendulum', '振り子の刃', 'ホールの大きな振り子', 2],
  ['between', '時のはざま', '壁や穴のある場所で時を切りかえる', 2],
  ['keeper', '時計守', '書庫での追いかけっこ', 2],
  ['found', 'みつけた', 'かくれんぼ', 2],
  ['sleep', 'ずっといっしょ', 'セナのさそい', 2],
  ['infinite', 'どこまでも', '書庫の合わせ鏡', 2],
  ['gear', '歯車の歯', '歯車の間の針', 2],
  ['lila', '魔女の腕', 'さいごの追いかけっこ', 2],
);
ENDINGS.push(
  ['c2normal', 'NORMAL END『止まったままの時計』', 2],
  ['c2true', 'TRUE END『3時34分』', 2],
  ['c2another', 'ANOTHER END『もうひとりの時計守』', 2],
);
Object.assign(ENDING_TEXT, {
  c2normal: [
    'ソウタの手をにぎって、リコは森を走った。',
    'うしろで、時計塔の鐘が鳴りつづけていた。\n十三回、十四回、十五回……',
    '家の明かりが見えたとき、\nソウタが目をこすって言った。\n「おねえちゃん、どこいってたの？」',
    '――あの塔は、今も森のおくで\n3時33分を指したまま、だれかを待っている。',
    'ときどき、窓の外で\n黒い花びらが、ひらりと舞う。',
  ],
  c2true: [
    'カチリ。',
    '長い長いあいだ止まっていた針が、\nひとつだけ、前へ進んだ。　3時34分。',
    '「おかあさん、ありがとう。\nもう、くるしくないよ」\nセナは、ほほえんで目をとじた。',
    '魔女は、娘を抱いたまま、\n声をあげて泣いた。\n塔じゅうの黒い薔薇が、白く咲きかわっていく。',
    '朝の光の中で、ソウタが目をさました。\n「……おねえちゃん？」',
    'ミナの声が、どこかで笑った。\n「よかったね、リコ」',
  ],
  c2another: [
    '「……いいの？」\n魔女は、ふるえる声で言った。',
    'リコの時間が、少しずつ歯車に流れていく。\nかわりに、ソウタの頬に赤みがもどった。',
    '目をさましたソウタは、\nひとりで森の入口に立っていた。\nポケットに、懐中時計がひとつ。',
    '――時計塔の針は、今も3時33分のまま。',
    'けれど夜になると、塔の中から\nふたりぶんの足音が聞こえるという。\nひとつは魔女の。もうひとつは――',
  ],
});
// 第一章を TRUE で終えたか（ミナのセリフが変わる）
const metMina1 = () => meta.endings.includes('true');

// ---------- 昔と今を切りかえる ----------
function toggleEra() {
  if (mode !== 'play' || busy || paused || Msg.open || !G || G.hidden || !has('watch')) return;
  run(async () => {
    const base = MAPS[G.map];
    if (flags().watchBroken) return say('懐中時計は、止まったまま動かない。');
    if (!base.past) return say('……針が、うごかない。\nここでは、時がもどらないみたいだ。');
    if (flags().watchStuck && !flags().chase2Done) { Snd.click(); return say('針が……うごかない！？'); }
    const toPast = era() === 'present';
    Snd.rewind(); vibrate(40);
    await fade(true, 380, toPast ? 'sepia' : '');
    G.F.f.past = toPast;
    const m = curMap();
    Snd.setAmb(M && (!M.era || M.era === era()) ? 'chase' : m.amb);
    $('btn-era').classList.toggle('past', toPast);
    showPlace(m.name + (toPast ? '（昔）' : '（今）'));
    // 時計守は「今」にしかいられない
    let escaped = false;
    if (M && M.endOnPast && toPast) { const d = M.doneFlag; M = null; if (d) flags()[d] = true; escaped = true; Snd.setAmb(m.amb); }
    await fade(false, 380);
    if (!passable(m, G.p.x, G.p.y)) {
      Snd.crash(); shake();
      await say('……！？');
      await say(tileAt(m, G.p.x, G.p.y) === 'x' ? '足もとの床が、なかった――' : 'からだが、かべの中に、めりこんで――');
      await die('between');
    }
    if (!flags().eraTold) { flags().eraTold = true; await say(toPast ? '……あたたかい。\nまわりの景色が、むかしの姿にもどっている。' : '……もとの、冷たい塔にもどった。'); }
    if (escaped) {
      await sleep(300);
      await say('……カチ、コチという音が、消えた。');
      await say('よかった……。\nあれは『今』にしか、いられないの。', minaName());
    }
  });
}
const minaName = () => (flags().minaMet || metMina1() ? 'ミナ' : '？？？');

// ---------- 鏡の中のミナ（ヒント） ----------
async function minaMirror() {
  if (!flags().minaMet) {
    flags().minaMet = true;
    await say('鏡の中に、白い服の女の子が映った。');
    if (metMina1()) {
      await say('……リコ？　リコだ！', 'ミナ');
      await say('わたし、ミナ。\nあのときは、名前をよんでくれて、ありがとう。', 'ミナ');
      await say('こんどは、わたしが　リコをたすける番だね。', 'ミナ');
    } else {
      await say('……あなた、だあれ？', '？？？');
      await say('わたしは、ミナ。\nむかし、魔女さんに「おねがい」をした子。', 'ミナ');
      await say('いまは、鏡の中にしか　いられないけど……\nあなたを、たすけたいの。', 'ミナ');
    }
    await say('ソウタくんは、塔のてっぺんにいるよ。\n魔女さんが、ソウタくんの「時間」を\nとろうとしてる。', 'ミナ');
  }
  await say(minaHint(), 'ミナ');
}
function minaHint() {
  const f = flags();
  if (!has('watch')) return '中庭の噴水の底に、なにか光ってたよ。';
  if (!f.planted && !has('seed')) return '「昔」の台所に行ってみて。\n魔女さん、白い薔薇が好きだったんだって。';
  if (!f.planted) return 'その種、「昔」の温室の大きな鉢に\nうめてみたら？';
  if (!f.archiveIn) return '「今」の温室を見て。\n何十年もたったら、種はどうなってるかな。';
  if (!has('gear') && !f.gearIn) return 'セナちゃんの部屋の「今」の、おもちゃ箱……\n気をつけてね。あれが来たら、かくれて。';
  if (!f.gearIn) return '歯車の間に、歯車が一枚たりないの。\n書庫のはしごの上だよ。';
  if (!f.clockSet) return '文字盤の部屋の扉は、\nセナちゃんが生まれた朝の時刻でひらくの。\n「昔」の日記と、セナちゃんの絵を見て。';
  if (G.F.pages.length < 4) return `セナちゃんの手紙、まだどこかにあるよ（${G.F.pages.length}/4）。\n全部あつめて、魔女さんに……。`;
  return 'ソウタくんは、てっぺん。\nセナちゃんの手紙、魔女さんにとどけてあげて。';
}

// ---------- 小さなイベント ----------
async function getLetter(n) {
  if (!G.F.pages.includes(n)) G.F.pages.push(n);
  Snd.pick();
  await say(`セナの手紙を見つけた。（${G.F.pages.length}/4）`);
  await paper(`セナの手紙 ${'①②③④'[n - 1]}`, LETTERS[n]);
}
function keeper(map, x, y, delay, extra) {
  startChase(0, map, x, y, delay, 0.3);
  Object.assign(M, { kind: 'keeper', era: 'present', caughtId: 'keeper' }, extra);
}
const past = () => era() === 'past';
const shared = (...os) => os;

// ---------- マップ ----------
const lanternObj = (x, y, id) => ({ x, y, art: 'lantern', lantern: id, solid: true, act: () => lantern(id) });
const minaGlass = (x, y) => ({ x, y, art: 'mirror', act: minaMirror });

Object.assign(MAPS, {
  c2_edge: {
    name: '森のはずれ', amb: 'forest', dark: 0.8, light: 56, outdoor: true,
    rows: [
      'TTTTTpTTTTT',
      'TTTT,p,TTTT',
      'TTT,,p,,TTT',
      'TT,,,p,,,TT',
      'TT,,,p,,,TT',
      'TTT,,p,,TTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTT,,p,,TTT',
      'TT,,,p,,,TT',
      'TT,,,p,,,TT',
      'TTT,,p,,TTT',
      'TTTTTpTTTTT',
    ],
    warps: [{ x: 5, y: 0, to: 'c2_court', tx: 6, ty: 11, dir: 'up' }],
    lights: [{ x: 5.5, y: 0.2, r: 26, c: 'moon' }],
    enter: async () => {
      if (flags().fleeing) {
        M = null; flags().fleeing = false;
        await ending('c2normal');
      }
    },
    objs: [
      { x: 6, y: 10, art: 'hat', glint: true, when: () => !has('hat'), act: async () => { await say('青い帽子が落ちている。\n……ソウタの帽子だ！'); await getItem('hat'); } },
      ...[[5, 9], [5, 7], [5, 4], [5, 2]].map(([x, y]) => ({ x, y, art: 'petals', act: async () => { await say('黒い花びらが、点々とつづいている。'); } })),
      { x: 3, y: 4, art: 'sign', solid: true, act: async () => { await say('古い立て札。\n『この先　時計塔　――立ち入るべからず』'); } },
      { x: 7, y: 11, art: 'stump', solid: true, act: async () => { await say('切り株。年輪を数えようとしたら、\n途中から、ぐちゃぐちゃにねじれていた。'); } },
      { x: 7, y: 3, art: 'rose', solid: true, act: async () => { await say('黒い薔薇。……あの館と、同じ花だ。'); } },
    ],
    steps: [
      { test: (x, y) => y === 13, act: async () => { await say('……ソウタを置いては、帰れない。'); G.p.dir = 'up'; await warp('c2_edge', 5, 12, 'up'); } },
      { test: (x, y) => y <= 6, when: () => !flags().bell, act: async () => {
        flags().bell = true;
        for (let i = 0; i < 3; i++) { Snd.bell(); await sleep(900); }
        await say('ゴーン……　ゴーン……　ゴーン……');
        await say('森のおくで、鐘が鳴っている。\n……数えていたら、十三回鳴った。');
      } },
    ],
  },

  c2_court: {
    name: '時計塔の中庭', amb: 'forest', dark: 0.82, light: 54, outdoor: true, style: 'stone',
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
      { x: 6, y: 1, to: 'c2_hall', tx: 6, ty: 9, dir: 'up', door: true },
      { x: 6, y: 12, to: 'c2_edge', tx: 5, ty: 1, dir: 'down', when: () => !past() },
    ],
    lights: [{ x: 6.5, y: 1.2, r: 24, c: 'moon' }],
    enter: async () => {
      if (flags().courtIn) return;
      flags().courtIn = true;
      await say('木々がひらけて、石づくりの塔があらわれた。');
      await say('てっぺんの大きな時計は、3時33分。\n……針は、ぴくりとも動かない。');
    },
    steps: [{ test: (x, y) => y === 12, when: () => past(), act: async () => { await say('門の外は、白い霧で、なにも見えない。'); G.p.dir = 'up'; await warp('c2_court', 6, 11, 'up'); } }],
    objs: [
      { x: 6, y: 1, art: 'thornDoor', solid: true, when: () => !past() && !flags().thornGone, act: async () => {
        await say('塔の扉。黒い薔薇のつるが、びっしりと巻きついている。');
        await say('……さわったら、ただではすまなそうだ。');
        if (has('watch')) await say('（この扉、「昔」はどうだったんだろう……）');
      } },
      { x: 3, y: 4, art: 'fountain', solid: true, act: async () => {
        if (!has('watch')) {
          await say('水の枯れた噴水。\n時計を胸にかかえた、女の人の像が立っている。');
          await say('……底のほうで、なにか光った。');
          await getItem('watch');
          await say('ふたに、黒い薔薇のもよう。\n針は 3時33分 で止まっている。');
          await say('りゅうずを、回せそうだ……');
          setUI();
          await say('（画面の右上の ⌛ で、懐中時計の針を回せる）');
          return;
        }
        await say('時計を胸にかかえた、女の人の像。\n台座の文字は、こすれて読めない。');
      } },
      { x: 9, y: 4, art: 'well', solid: true, act: async () => {
        await say('古い井戸。のぞきこむと、まっ暗だ。\n……底のほうから、カチ、コチと音がする。');
        const c = await choose('もっと、のぞいてみる？', ['のぞく', 'やめておく']);
        if (c !== 0) return say('……やめておこう。');
        await say('身を乗りだして、井戸の底をのぞいた。');
        await say('底の水に、小さな時計の文字盤が\nいくつも、いくつも浮かんでいる。');
        await scare();
        await say('水の中から、手がのびて――');
        await die('well');
      } },
      lanternObj(10, 9, 'court'),
    ],
    past: {
      name: '時計塔の中庭', amb: 'past', dark: 0.62, light: 62,
      objs: [
        { x: 3, y: 4, art: 'fountain', solid: true, act: async () => {
          await say('噴水から、きれいな水があふれている。');
          await say('時計をかかえた女の人の像。\n台座に『いとしい　セナへ』と彫ってある。');
        } },
        { x: 9, y: 4, art: 'wellLid', solid: true, act: async () => { await say('井戸には、しっかりとふたがしてある。\n『子どもは近づかないこと』'); } },
        lanternObj(10, 9, 'court'),
        ...[[2, 8], [10, 6]].map(([x, y]) => ({ x, y, art: 'roseWhite', solid: true, act: async () => { await say('白い薔薇が咲いている。\nあまい、いいにおい。'); } })),
      ],
    },
  },

  c2_hall: {
    name: '時計のホール', amb: 'tower', dark: 0.86, light: 50, style: 'stone',
    rows: [
      '#############',
      '######x######',
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
      { x: 6, y: 10, to: 'c2_court', tx: 6, ty: 2, dir: 'down', door: true },
      { x: 0, y: 5, to: 'c2_kitchen', tx: 9, ty: 5, dir: 'left', door: true },
      { x: 12, y: 5, to: 'c2_green', tx: 1, ty: 5, dir: 'right', door: true },
    ],
    lights: [{ x: 6.5, y: 4, r: 22, c: 'moon' }],
    enter: async () => {
      if (flags().hallIn) return;
      flags().hallIn = true;
      await say('中は、ひんやりとしている。\n天井から、大きな振り子がぶらさがっている。');
      await say('カチ……コチ……\nどこかで、時計の音がする。止まっているはずなのに。');
    },
    objs: [
      { x: 6, y: 4, art: 'pendulum', solid: true, act: async () => {
        await say('大きな振り子。ぴたりと止まっている。\nふちが、刃物のように光っている。');
        const c = await choose('押してみる？', ['押す', 'やめておく']);
        if (c !== 0) return say('……やめておこう。');
        await say('振り子を、そっと押した。');
        Snd.gears();
        await say('ギ……ギギ……\n振り子が、ゆっくりと揺れはじめ――');
        await say('もどってきた刃が、まっすぐリコに――');
        await die('pendulum');
      } },
      { x: 2, y: 1, art: 'clock', act: async () => {
        await say('柱時計。3時33分で止まっている。');
        if (meta.endings.length) await say('……あの館の柱時計も、\nたしか 3時33分 で止まっていた。');
      } },
      { x: 9, y: 1, art: 'painting_lady', act: async () => { await say('女の人と、白い服の女の子の絵。\n顔のところが、黒くぬりつぶされている。'); } },
      minaGlass(4, 1),
      lanternObj(10, 9, 'hall'),
    ],
    past: {
      name: '時計のホール', amb: 'past', dark: 0.66, light: 60,
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
        { x: 6, y: 10, to: 'c2_court', tx: 6, ty: 2, dir: 'down', door: true },
        { x: 0, y: 5, to: 'c2_kitchen', tx: 9, ty: 5, dir: 'left', door: true },
        { x: 12, y: 5, to: 'c2_green', tx: 1, ty: 5, dir: 'right', door: true },
        { x: 6, y: 1, to: 'c2_archive', tx: 6, ty: 7, dir: 'up' },
      ],
      objs: [
        { x: 6, y: 4, art: null, solid: true, act: async () => { await say('大きな振り子が、ゆっくりと時を刻んでいる。\nコチ……コチ……'); } },
        { x: 2, y: 1, art: 'clock', act: async () => { await say('柱時計が、元気に動いている。\n……針は、2時すぎをさしている。'); } },
        { x: 9, y: 1, art: 'painting_lady', act: async () => { await say('やさしそうな女の人と、白い服の女の子の絵。\n『リラと　セナ』'); } },
        minaGlass(4, 1),
        { x: 6, y: 2, art: 'gateIron', solid: true, when: () => !flags().gateOpen, act: async () => { await say('階段の前に、鉄の柵。\n『主の部屋へは、だれも通さぬこと』'); await say('かんぬきは、向こう側についている。'); } },
        lanternObj(10, 9, 'hall'),
      ],
    },
  },

  c2_kitchen: {
    name: '台所', amb: 'tower', dark: 0.86, light: 50, style: 'stone',
    rows: [
      '###########',
      '###########',
      '#=========#',
      '#=========#',
      '#==xx=====#',
      '#==xx=====d',
      '#=========#',
      '#=========#',
      '##d########',
    ],
    warps: [
      { x: 10, y: 5, to: 'c2_hall', tx: 1, ty: 5, dir: 'right', door: true },
      { x: 2, y: 8, to: 'c2_work', tx: 1, ty: 2, dir: 'down', when: () => !past() },
    ],
    objs: [
      { x: 2, y: 1, art: 'cupboard', act: async () => { await say('食器棚。からっぽだ。\nネズミがかじったあとがある。'); } },
      { x: 5, y: 1, art: 'jars', act: async () => { await say('びんが並んでいる。\nどれも、中身が干からびている。'); } },
      { x: 8, y: 1, art: 'sink', act: async () => { await say('流し台。水は出ない。'); } },
      { x: 7, y: 5, art: 'ktable', solid: true, act: async () => {
        await say('テーブルの上に、紙が一枚。');
        await paper('メモ', '奥さまは　白い薔薇が　お好き。\nセナさまの　お部屋にも　かざること。\n\n　　　　　　　料理番　マーサ');
      } },
      lanternObj(9, 7, 'kitchen'),
    ],
    past: {
      name: '台所', amb: 'past', dark: 0.64, light: 60,
      rows: [
        '###########',
        '###########',
        '#=========#',
        '#=========#',
        '#=========#',
        '#=========d',
        '#=========#',
        '#=========#',
        '##d########',
      ],
      steps: [{ test: (x, y) => x === 2 && y === 8, act: async () => { await say('地下への扉は、かたく閉ざされている。'); G.p.dir = 'up'; await warp('c2_kitchen', 2, 7, 'up'); } }],
      objs: [
        { x: 2, y: 1, art: 'cupboard', act: async () => { await say('食器棚に、白いお皿がきちんと並んでいる。\n小さなお皿に『セナ』と彫ってある。'); } },
        { x: 5, y: 1, art: 'jars', act: async () => {
          if (has('seed') || flags().planted) return say('ジャムやピクルスのびん。おいしそうだ。');
          await say('びんの中に、小さな種がたくさん入っている。\nラベル：『白薔薇　セナさまの花壇用』');
          await getItem('seed');
        } },
        { x: 8, y: 1, art: 'sink', act: async () => { await say('流し台。きれいな水が出る。'); } },
        { x: 5, y: 3, art: 'pot', solid: true, act: async () => { await say('お鍋で、スープがことことと煮えている。\nいいにおい。……やさしい味がしそう。'); } },
        { x: 7, y: 5, art: 'ktable', solid: true, act: async () => { await say('テーブルの上に、焼きたてのパン。\n小さなカードに『セナさま　おやつ』。'); } },
        lanternObj(9, 7, 'kitchen'),
      ],
    },
  },

  c2_green: {
    name: '温室', amb: 'tower', dark: 0.84, light: 52, style: 'stone',
    rows: [
      '###########',
      '###########',
      '#,,,,p,,,,#',
      '#,,,,p,,,,#',
      '#,,,,p,,,,#',
      'dpppppp,,,#',
      '#,,,,p,,,,#',
      '#,,,,p,,,,#',
      '#,,,,p,,,,#',
      '###########',
    ],
    warps: [{ x: 0, y: 5, to: 'c2_hall', tx: 11, ty: 5, dir: 'left', door: true }],
    lights: [{ x: 5.5, y: 1, r: 20, c: 'moon' }],
    objs: [
      { x: 5, y: 2, art: () => flags().planted ? 'vineUp' : 'bigpot', solid: true, act: async () => {
        if (!flags().planted) return say('大きな鉢。土はからからに乾いて、ひびが入っている。');
        await say('大きな鉢から、白い花をつけた太い蔓が、\n天井の穴の向こうまでのびている。');
        if (!flags().vineSeen) { flags().vineSeen = true; await say('……あのとき「昔」にうめた種だ！\n何十年もかけて、ここまで育ったんだ。'); }
        const c = await choose('蔓をのぼる？', ['のぼる', 'やめておく']);
        if (c !== 0) return;
        Snd.rustle();
        await warp('c2_archive', 2, 7, 'right');
      } },
      ...[[2, 3], [8, 3], [2, 7], [8, 7], [3, 8], [7, 2]].map(([x, y]) => ({ x, y, art: 'rose', solid: true, act: async () => {
        await say('黒い薔薇が、ぎっしりと咲いている。\n花びらの奥で、なにかが脈うっている……');
        const c = await choose('さわってみる？', ['さわる', 'やめておく']);
        if (c !== 0) return say('……やめておこう。');
        await say('花にふれた。');
        Snd.rustle(); shake();
        await say('つるが、足もとからいっせいに伸びて、\nリコを土の中へ、ひきずりこんでいく――');
        await die('vine');
      } })),
      lanternObj(9, 8, 'green'),
    ],
    past: {
      name: '温室', amb: 'past', dark: 0.6, light: 62,
      objs: [
        { x: 5, y: 2, art: () => flags().planted ? 'bigpotSprout' : 'bigpotSoil', solid: true, act: async () => {
          if (flags().planted) return say('うめた種から、小さな芽が出ている。\n……がんばって育ってね。');
          await say('大きな鉢。ふかふかの土が入っている。\n札に『セナさまの薔薇を　ここに』。');
          if (!has('seed')) return say('……なにか、植えるものがあれば。');
          const c = await choose('白い薔薇の種をうめる？', ['うめる', 'やめておく']);
          if (c !== 0) return;
          G.F.items = G.F.items.filter(i => i !== 'seed');
          flags().planted = true;
          Snd.pick();
          await say('種を、そっと土にうめた。');
          await say('……花が咲くまで、何十年もかかりそうだ。');
          await say('（「今」にもどったら、どうなっているだろう）');
        } },
        ...[[2, 3], [8, 3], [2, 7], [8, 7], [3, 8], [7, 2]].map(([x, y]) => ({ x, y, art: 'roseWhite', solid: true, act: async () => { await say('白い薔薇が、満開に咲いている。'); } })),
        { x: 8, y: 6, art: 'paper', glint: true, when: () => !hasPage(1), act: () => getLetter(1) },
        lanternObj(9, 8, 'green'),
      ],
    },
  },

  c2_archive: {
    name: '書庫', amb: 'tower', dark: 0.87, light: 50, style: 'stone',
    rows: [
      '#############',
      '###########S#',
      '#...........#',
      '#...........#',
      '#...........d',
      '#...........#',
      '#...........#',
      '#...........#',
      '######x######',
    ],
    warps: [
      { x: 12, y: 4, to: 'c2_sena', tx: 1, ty: 4, dir: 'right', door: true },
      { x: 11, y: 1, to: 'c2_gear', tx: 6, ty: 8, dir: 'up', when: () => !past() },
    ],
    enter: async () => {
      if (!flags().archiveIn && !past()) {
        flags().archiveIn = true;
        await say('天井の穴から、書庫に出た。\n本と、ほこりのにおい。');
      }
      if (!flags().chase1Done && !past() && !M) {
        await sleep(500);
        Snd.tick(); await sleep(400); Snd.tick(true); await sleep(400);
        await say('カチ……コチ……カチ……コチ……');
        await say('音が、近づいてくる。');
        keeper('c2_archive', 11, 2, 1.3, { endOnPast: true, doneFlag: 'chase1Done' });
        await sleep(1500);
        await say('時を……もどして！\nはやく！', minaName());
      }
    },
    objs: [
      { x: 1, y: 7, art: 'vineTop', solid: true, when: () => flags().planted, act: async () => {
        const c = await choose('蔓をつたって、温室へおりる？', ['おりる', 'やめておく']);
        if (c !== 0) return;
        Snd.rustle();
        await warp('c2_green', 5, 3, 'down');
      } },
      ...[1, 2, 3, 5].map((x, i) => ({ x, y: 1, art: 'shelf', act: async () => {
        await say(['『時計のしくみ』\n歯車の絵がたくさん描いてある。', '『時を止める術』\n……かんじんのページが、やぶりとられている。', '『薔薇と契約』\n「黒き薔薇を受けとりし子は、その時を差しだす」', '子ども向けの絵本。\n『とけいの　くにの　おひめさま』'][i]);
      } })),
      { x: 8, y: 1, art: 'mirror', act: async () => {
        await say('二枚の鏡が、向かいあわせに立てかけてある。\n鏡の中に、鏡がどこまでも続いている。');
        const c = await choose('のぞきこむ？', ['のぞく', 'やめておく']);
        if (c !== 0) return say('……やめておこう。');
        await say('鏡をのぞきこんだ。\nたくさんのリコが、いっせいに こちらを見た。');
        await say('いちばん奥のリコが、ふりかえって、\nこっちに歩いてくる。');
        await scare();
        await say('気がつくと、リコは鏡のいちばん奥にいた。');
        await die('infinite');
      } },
      { x: 5, y: 4, art: 'desk', solid: true, act: async () => {
        await say('机の上に、古い日記がある。');
        await paper('魔女の日記', '……インクがかすれて、ほとんど読めない。\n\n「……３時３３分……」\n「……あの子が生まれた……朝……」');
        await say('（「昔」なら、読めるかもしれない）');
      } },
      lanternObj(10, 7, 'archive'),
    ],
    past: {
      name: '書庫', amb: 'past', dark: 0.64, light: 60,
      rows: [
        '#############',
        '###########S#',
        '#...........#',
        '#...........#',
        '#...........d',
        '#...........#',
        '#...........#',
        '#...........#',
        '######d######',
      ],
      warps: [
        { x: 12, y: 4, to: 'c2_sena', tx: 1, ty: 4, dir: 'right', door: true },
        { x: 6, y: 8, to: 'c2_hall', tx: 6, ty: 2, dir: 'down', when: () => flags().gateOpen },
      ],
      steps: [
        { test: (x, y) => x === 6 && y === 7, when: () => !flags().gateOpen, act: async () => { Snd.click(); flags().gateOpen = true; await say('階段の下に鉄の柵がある。\nこちら側から、かんぬきを外した。'); } },
        { test: (x, y) => x === 11 && y === 1, act: async () => { await say('はしごは、まだかかっていない。'); G.p.dir = 'down'; await warp('c2_archive', 11, 2, 'down'); } },
      ],
      objs: [
        ...[1, 2, 3, 5].map((x, i) => ({ x, y: 1, art: 'shelf', act: async () => {
          await say(['『時計のしくみ』\nていねいに手入れされている。', '『こどもの　びょうき』\nたくさんのしおりが、はさんである。', '『薔薇の育て方』\n白い薔薇のページに、押し花。', '絵本。『とけいの　くにの　おひめさま』\n「おひめさまは、じかんを　とめて　しまいました」'][i]);
        } })),
        { x: 8, y: 1, art: 'mirror', act: async () => { await say('大きな姿見。\n……今は、ふつうの鏡だ。'); } },
        { x: 5, y: 4, art: 'desk', solid: true, act: async () => {
          await say('机の上の日記。インクがまだ新しい。');
          await paper('リラの日記', 'セナの熱が下がらない。\n医者は、今夜がやまだと言った。\n\nあの子が生まれたのは、\n春の朝の　７時４０分だった。\n小さな手が、わたしの指をにぎった。\n\n時を止めよう。この塔の時計を、\nあの子の最後の一秒の前で。\n文字盤の部屋の扉は、\nあの子が生まれた朝の時刻でひらくように。');
        } },
        { x: 9, y: 6, art: 'paper', glint: true, when: () => !hasPage(2), act: () => getLetter(2) },
        lanternObj(10, 7, 'archive'),
      ],
    },
  },

  c2_sena: {
    name: 'セナの部屋', amb: 'tower', dark: 0.86, light: 50, style: 'stone',
    rows: [
      '#########',
      '#########',
      '#.......#',
      '#.......#',
      'd.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#########',
    ],
    warps: [{ x: 0, y: 4, to: 'c2_archive', tx: 11, ty: 4, dir: 'left', door: true, when: () => !(M && M.kind === 'keeper' && M.map === 'c2_sena') }],
    steps: [{ test: (x, y) => x === 0 && y === 4, when: () => !!(M && M.kind === 'keeper' && M.map === 'c2_sena'), act: async () => { await say('扉が……あかない！'); G.p.dir = 'right'; await warp('c2_sena', 1, 4, 'right'); } }],
    objs: [
      { x: 6, y: 2, art: 'bed', solid: true, act: async () => { await say('小さなベッド。ほこりが、白くつもっている。'); } },
      { x: 2, y: 1, art: 'drawingFaded', act: async () => { await say('色あせたクレヨンの絵。\nお日さまと、時計……\n針のところは、かすれて見えない。'); } },
      { x: 4, y: 1, art: 'window', act: async () => { await say('窓の外は、ずっと夜のまま。\n月が、動かない。'); } },
      { x: 7, y: 5, art: 'wardrobe', solid: true, act: hideIn },
      { x: 2, y: 6, art: () => has('gear') || flags().gearIn ? 'toyboxOpen' : 'toybox', solid: true, act: async () => {
        if (has('gear') || flags().gearIn) return say('からっぽのおもちゃ箱。');
        await say('おもちゃ箱。ふたが、半分あいている。\n中で、なにか金色のものが光っている。');
        await getItem('gear');
        await sleep(400);
        Snd.tick(); await sleep(300); Snd.tick(true); await sleep(300); Snd.tick();
        await say('カチ、コチ、カチ、コチ――\n足音が、すぐそこまで来ている！');
        flags().watchStuck = true;
        await say('懐中時計の針が……うごかない！？');
        await say('（どこかに、かくれなきゃ！）');
        keeper('c2_sena', 0, 4, 2.2, { doneFlag: 'chase2Done', hideTime: 5.5, follow: false });
      } },
      lanternObj(1, 7, 'sena'),
    ],
    past: {
      name: 'セナの部屋', amb: 'past', dark: 0.62, light: 60,
      objs: [
        { x: 6, y: 2, art: 'bedSena', solid: true, act: async () => {
          if (flags().senaTalked) {
            await say('セナは、すうすうと寝息をたてている。');
            if (!hasPage(3)) { await say('まくらの下から、手紙がのぞいている。'); await getLetter(3); }
            return;
          }
          await say('ベッドで、女の子が眠っている。\n……目をあけた。');
          await say('……だあれ？　あたらしい、おてつだいさん？', 'セナ');
          await say('おかあさん、またないてるの。\nわたしの　おねつが、さがらないから。', 'セナ');
          await say('ねえ……さみしいから、\nいっしょに　ねよう？', 'セナ');
          const c = await choose('ずっと、ずっと、いっしょに。', ['いっしょにねる', 'ことわる']);
          if (c === 0) {
            await say('セナのとなりに、横になった。\nあたたかい……まぶたが、重い……');
            await say('時計の音が、だんだん遠くなる。\nカチ……コチ………………');
            await say('――リコは、もう二度と目をさまさなかった。');
            await die('sleep');
          }
          flags().senaTalked = true;
          await say('……そっか。\nおねえちゃんも、かえるところが　あるんだね。', 'セナ');
          await say('じゃあ、これ。\nおかあさんに、わたしたかったの。', 'セナ');
          if (!hasPage(3)) await getLetter(3);
        } },
        { x: 2, y: 1, art: 'drawing', act: async () => {
          await say('クレヨンの絵。お日さまと、時計。');
          await say('時計の針は、７時４０分。\n『わたしの　うまれた　じかん』と書いてある。');
        } },
        { x: 4, y: 1, art: 'window', act: async () => { await say('窓の外は、夜明け前。\n森のむこうが、うすく明るい。'); } },
        { x: 7, y: 5, art: 'wardrobe', solid: true, act: async () => { await say('たんすの中に、白いワンピースがたくさん。'); } },
        { x: 2, y: 6, art: 'toybox', solid: true, act: async () => { await say('おもちゃ箱。ぬいぐるみや、絵本や、\nブリキの時計が入っている。'); } },
        lanternObj(1, 7, 'sena'),
      ],
    },
  },

  c2_work: {
    name: '地下工房', amb: 'tower', dark: 0.9, light: 46, style: 'stone',
    rows: [
      '###########',
      '#S#########',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '###########',
    ],
    warps: [{ x: 1, y: 1, to: 'c2_kitchen', tx: 2, ty: 7, dir: 'up' }],
    enter: async () => {
      if (flags().workIn) return;
      flags().workIn = true;
      await say('地下は、人形だらけだった。');
      await say('……あの館で見た人形と、同じ顔をしている。');
    },
    objs: [
      ...[3, 4, 5, 6, 7].map(x => ({ x, y: 1, art: 'dollShelf', act: async () => {
        await say('人形がならんでいる。\nどの人形も、ちがう服を着た子どもだ。');
        if (x === 5) await say('札がついている。\n『ミナの　おともだち』');
      } })),
      { x: 5, y: 4, art: 'desk', solid: true, act: async () => {
        await say('作業台の上に、作りかけの人形。');
        await say('……髪は、ソウタと同じ色。\n服は、ソウタと同じ青いシャツ。');
        await say('いそがなきゃ。');
      } },
      { x: 8, y: 6, art: 'shoe', glint: true, when: () => !flags().shoeSeen, act: async () => { flags().shoeSeen = true; await say('小さな靴が片方、落ちている。\n……ソウタの靴だ。'); } },
      { x: 2, y: 7, art: 'paper', glint: true, when: () => !hasPage(4), act: () => getLetter(4) },
      minaGlass(9, 1),
      lanternObj(9, 7, 'work'),
    ],
  },

  c2_gear: {
    name: '歯車の間', amb: 'tower', dark: 0.86, light: 50, style: 'stone',
    rows: [
      '#############',
      '######S######',
      '#...........#',
      '#..ooooooo..#',
      '#..ooooooo..#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '######S######',
    ],
    warps: [
      { x: 6, y: 9, to: 'c2_archive', tx: 11, ty: 2, dir: 'down' },
      { x: 6, y: 1, to: 'c2_face', tx: 5, ty: 6, dir: 'up', when: () => flags().clockSet },
    ],
    enter: async () => {
      if (flags().gearRoomIn) return;
      flags().gearRoomIn = true;
      await say('塔の時計の、機械の中だ。\n大きな歯車が、ぜんぶ止まっている。');
    },
    objs: [
      ...[2, 4, 8, 10].map(x => ({ x, y: 1, art: 'bigGear', act: async () => { await say('大きな歯車。ぴくりとも動かない。'); } })),
      { x: 6, y: 2, art: 'gateIron', solid: true, when: () => !flags().clockSet, act: async () => { await say('上への階段に、鉄の格子。\n文字盤の針と、つながっているみたいだ。'); } },
      { x: 9, y: 6, art: () => flags().gearIn ? 'gearboxFull' : 'gearbox', solid: true, act: async () => {
        if (flags().gearIn) return say('歯車が、ぴったりはまっている。');
        await say('歯車箱。まんなかの歯車が、一枚ぬけている。');
        if (!has('gear')) return say('……ここにはまる歯車があれば。');
        G.F.items = G.F.items.filter(i => i !== 'gear');
        flags().gearIn = true;
        Snd.click(); Snd.gears();
        await say('小さな歯車を、すき間にはめた。\nカチリ。');
      } },
      { x: 3, y: 6, art: 'dial', solid: true, act: setClock },
      minaGlass(11, 1),
      lanternObj(1, 8, 'gear'),
    ],
  },

  c2_face: {
    name: '文字盤の部屋', amb: 'tower', dark: 0.84, light: 52, style: 'stone',
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
    warps: [{ x: 5, y: 7, to: 'c2_gear', tx: 6, ty: 2, dir: 'down' }],
    lights: [{ x: 5.5, y: 1, r: 34, c: 'moon' }],
    enter: async () => {
      if (flags().faceIn) return;
      flags().faceIn = true;
      await say('塔のてっぺん。大きな文字盤の裏側。\n月の光が、数字をすかして床にうつっている。');
      Snd.giggle();
      await say('まんなかの揺りかごで、ソウタが眠っている！');
      await sleep(400);
      flags().lilaHere = true;
      Snd.bell();
      await say('……いらっしゃい。', '魔女');
      await say('あなたね。ミナの願いを、といた子は。', '魔女');
      await say('あれから、時計がゆるみはじめたの。\nセナの時間が、こぼれてしまう。', '魔女');
      await say('だから、その子の時間が要るの。\nあと少し……あと少しで、たりるのよ。', '魔女');
    },
    objs: [
      ...[3, 4, 5, 6, 7].map(x => ({ x, y: 1, art: 'clockWall', act: async () => { await say('文字盤の裏側。\n大きな針が、3時33分をさしている。'); } })),
      { x: 5, y: 3, art: 'cradle', solid: true, act: finalChoice },
      { x: 9, y: 6, art: 'lantern', lantern: 'face', solid: true, act: () => lantern('face') },
    ],
  },
});
for (const id of Object.keys(MAPS)) {
  const m = MAPS[id];
  if (m.id) continue;
  m.id = id; m.h = m.rows.length; m.w = m.rows[0].length;
  m.rows.forEach((r, i) => { if (r.length !== m.w) console.warn('row length', id, i); });
  m.objs = m.objs || []; m.warps = m.warps || []; m.steps = m.steps || []; m.lights = m.lights || [];
  if (m.past && m.past.rows) m.past.rows.forEach((r, i) => { if (r.length !== m.w) console.warn('past row length', id, i); });
}

// ---------- 歯車の間：針を合わせる ----------
async function setClock() {
  if (flags().clockSet) return say('針は 7時40分。\n上への格子は、もうひらいている。');
  await say('文字盤の針を、手で回せるハンドルがある。');
  if (!flags().gearIn) { Snd.click(); return say('回そうとしても、歯車が空回りする。\nどこかで、歯車が一枚たりないみたいだ。'); }
  const hours = ['3時', '6時', '7時', '12時'], mins = ['00分', '15分', '33分', '40分'];
  const h = await choose('何時に合わせる？', hours);
  if (h < 0) return;
  const mm = await choose(`${hours[h]}……何分に合わせる？`, mins);
  Snd.gears();
  if (h === 2 && mm === 3) {
    flags().clockSet = true;
    shake();
    await say('ガコン――！');
    await say('止まっていた歯車が、ひとつだけ回った。\n上への格子が、ゆっくりとひらいていく。');
    return;
  }
  flags().clockWrong = (flags().clockWrong || 0) + 1;
  if (flags().clockWrong === 1) { Snd.crash(); return say('ギギギ……\n歯車がきしんで、針がもとにもどった。'); }
  if (flags().clockWrong === 2) { Snd.crash(); shake(); return say('ガタガタガタッ！\n歯車が、あばれるように動いた……\n……つぎにまちがえたら、あぶない。'); }
  Snd.crash(); shake();
  await say('歯車が、いっせいに回りはじめた。');
  await say('そでが、歯車にかみこまれて――');
  await die('gear');
}

// ---------- さいごの選択 ----------
async function finalChoice() {
  if (flags().fleeing) return;
  await say('揺りかごの中で、ソウタが眠っている。\n顔色が、だんだん白くなっていく……');
  const opts = ['ソウタを起こして逃げる'];
  if (G.F.pages.length === 4) opts.push('セナの手紙をわたす');
  opts.push('わたしの時間をあげる', 'やめておく');
  const c = await choose('どうする？', opts);
  const pick = opts[c];
  if (pick === 'やめておく') return;
  if (pick === 'セナの手紙をわたす') return trueEnd2();
  if (pick === 'わたしの時間をあげる') {
    await say('……ソウタのかわりに、\nわたしの時間を、あげる。');
    await say('……！', '魔女');
    const k = await choose('ほんとうに？', ['あげる', 'やっぱりやめる']);
    if (k !== 0) return;
    await ending('c2another');
  }
  // 逃げる
  await say('ソウタ！　起きて！');
  await say('ソウタをゆすると、うっすら目をあけた。\n「……おねえちゃん？」');
  await say('……どこへ行くの。', '魔女');
  await say('返して……。\nセナの時間を、返して――！', '魔女');
  flags().lilaHere = false; flags().fleeing = true; flags().thornGone = true; flags().watchBroken = true;
  G.F.f.past = false;
  $('btn-era').classList.remove('past');
  Snd.crack(); shake();
  await say('パキン、と懐中時計がひび割れた。\n……もう、時はもどせない！');
  await say('ソウタの手をひいて、走れ！');
  startChase(0, 'c2_face', 5, 2, 1.4, 0.27);
  Object.assign(M, { kind: 'lila', caughtId: 'lila', follow: true, safe: [], lag: 1.0 });
}

async function trueEnd2() {
  await say('リコは、四通の手紙を、魔女にさしだした。');
  await say('……これは。', '魔女');
  await say('（魔女は、手紙を一通ずつ、ひらいていく）');
  await paper('セナの手紙', LETTERS[4]);
  await say('……「とけいは　とめないで」……', '魔女');
  await say('わたしは……あの子のためだと思って……', '魔女');
  await say('いつのまにか、魔女のとなりに\n白い服の女の子が立っていた。');
  await say('おかあさん。\nもう、いいんだよ。', 'セナ');
  await say('わたし、ずっと、おかあさんの手を\nにぎってたよ。', 'セナ');
  await say('……セナ。\n…………ごめんね。', '魔女');
  await say('魔女は、ふるえる手で、\n大きな針に指をかけた。');
  Snd.gears();
  await ending('c2true');
}

// ---------- はじまり ----------
function newState2() {
  return { map: 'c2_edge', p: { x: 5, y: 12, dir: 'up' }, F: { items: [], pages: [], f: {}, lit: [] } };
}
async function newGame2() {
  G = newState2();
  G.p = { x: 5, y: 12, dir: 'up', tx: 5, ty: 12, moving: false, t: 0, anim: 0 };
  await fade(true, 600);
  startPlay();
  enterMap('c2_edge', 5, 12, 'up');
  $('btn-era').classList.remove('past');
  await fade(false, 1000);
  run(async () => {
    await say('――あの夜から、一年。');
    if (metMina1()) await say('リコの机の上には、\nあの日ひろった黒い薔薇が、枯れずにかざってある。');
    else await say('リコは、あの館のことを、\nだれにも話していない。');
    await say('夕方。弟のソウタが、帰ってこなかった。');
    await say('森の入口に、黒い花びらが\n点々と落ちていた。');
    await say('……ソウタ！');
  });
}
