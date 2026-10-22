'use strict';
// くろばらの館 第四章『鏡の向こうの館』（第三章のどれかのエンディングで解放）
//   game.js のしくみを使い、ここでは第四章の部屋・物語・絵を足す。
//   新しい遊び：館の鏡をくぐって、左右はんたいの「鏡の館」と「くろばらの館」を行き来する。
//   - マップの mirror に「鏡の館」がわの中身を書く。間取り・物・出入り口は、ぜんぶ「くろばらの館」がわの座標で書き、
//     鏡の館では mirrorVariant() が左右を自動でうらがえす（x → w-1-x）。鏡をくぐっても、同じ座標の場所に出る
//   - objs＝くろばらの館だけ／both＝両がわ／mirror.objs＝鏡の館だけ（warps・dwarps・mirror.warps も同じ考え）
//   - 鏡の館の文字は、手鏡を手に入れるまで鏡文字（CSS で左右反転）で出る

// ---------- 色・絵 ----------
PAL.rikoR = Object.assign({}, PAL.riko, { eye: '#d8e0ec', cheek: null });

// 左右うらがえしの女の子（鏡のリコ・鏡のミナ）。リボンがはんたいがわにくる
function flippedGirl(pal, dir, fr) {
  const d = dir === 'left' ? 'right' : dir === 'right' ? 'left' : dir;
  return art(`fg-${pal}-${dir}-${fr}`, 16, 20, g => { g.translate(16, 0); g.scale(-1, 1); g.drawImage(girl(pal, d, fr), 0, 0); });
}
const _monsterArt4 = monsterArt;
monsterArt = function (kind, dir, fr, t) {
  if (kind === 'rikoR') return flippedGirl('rikoR', dir, fr);
  if (kind === 'minaR') return flippedGirl('mina', dir, fr);
  return _monsterArt4(kind, dir, fr, t);
};

const candleArt = flame => (g, R) => {
  R('#6a5430', 5, 13, 6, 2); R('#a88a4a', 6, 11, 4, 2); R('#8a7040', 7, 13, 2, 1);
  R('#e8e0d0', 7, 5, 2, 6); R('#c8c0b0', 8, 6, 1, 5);
  if (flame) { R(flame[0], 7, 1, 2, 4); R(flame[1], 7, 3, 2, 2); R('#fff8e8', 7, 4, 1, 1); }
  else R('#2a2420', 7, 4, 2, 1);
};
const mirrorGlass = (glass, hi, extra) => (g, R) => {
  R('#6a5020', 3, 0, 10, 25); R('#8a6a2a', 3, 0, 10, 1); R(glass, 4, 1, 8, 23);
  R(hi, 5, 2, 1, 9); R(hi, 6, 3, 1, 3); R('#4a3a18', 2, 24, 12, 2);
  if (extra) extra(g, R);
};
Object.assign(ARTS, {
  candleOff: [16, 16, candleArt(null)],
  candleR: [16, 16, candleArt(['#c02030', '#ff6050'])],
  candleW: [16, 16, candleArt(['#e8e0c8', '#ffffff'])],
  candleB: [16, 16, candleArt(['#2040b0', '#6090ff'])],
  // 鏡（くろばらがわから見ると、むこうに明かり。鏡の館から見ると、むこうに黒い薔薇）
  mirrorWarm: [16, 26, mirrorGlass('#b8946a', '#e8c890', (g, R) => { R('#d8b080', 4, 14, 8, 10); R('#fff0c0', 8, 7, 2, 3); R('#5a4030', 8, 9, 2, 0.5); })],
  mirrorCold: [16, 26, mirrorGlass('#3a3c4c', '#6a6e84', (g, R) => {
    R('#2a2c3a', 4, 14, 8, 10); R('#4a4c5e', 4, 14, 8, 1); R('#3a0716', 9, 19, 2, 2); R('#6a1028', 9, 19, 1, 1);
  })],
  mirrorThorn: [16, 26, mirrorGlass('#141018', '#2a2834', (g, R) => {
    R('#0c1a10', 4, 4, 8, 20); for (let i = 0; i < 9; i++) { const x = 4 + (i * 5) % 7, y = 4 + (i * 7) % 18; R('#3a0716', x, y, 2, 2); R('#7a1830', x, y, 1, 1); }
  })],
  mirrorMinaR: [16, 26, g => {
    g.drawImage(getArt('mirrorWarm'), 0, 0);
    g.save(); g.beginPath(); g.rect(4, 1, 8, 19); g.clip();
    g.globalAlpha = 0.85; g.drawImage(flippedGirl('mina', 'down', 0), 0, 2);
    g.restore();
  }],
  exitFrame: [16, 26, (g, R) => {
    R('#6a5020', 3, 0, 10, 22); R('#8a6a2a', 3, 0, 10, 1); R('#1a2238', 4, 1, 8, 20); R('#24304a', 4, 1, 8, 7);
    R('#e8e4ec', 6, 15, 2, 2); R('#e8e4ec', 9, 17, 1, 1); R('#c8d0e0', 10, 3, 1, 1); R('#3a5a7a', 5, 2, 1, 6);
    R('#4a3a18', 4, 22, 2, 4); R('#4a3a18', 10, 22, 2, 4);
  }],
  litWindow: [16, 16, (g, R) => {
    R('#100810', 3, 3, 10, 10); R('#f0c060', 4, 4, 8, 8); R('#ffe8a0', 5, 5, 2, 3);
    R('#3a2410', 7, 4, 2, 8); R('#3a2410', 4, 7, 8, 1);
  }],
  curtainWin: [16, 16, (g, R) => {
    R('#2a1c14', 2, 1, 12, 13); R('#f0c060', 3, 2, 10, 11);
    R('#7a2a3a', 3, 2, 5, 11); R('#7a2a3a', 8, 2, 5, 11); R('#5a1a2a', 5, 2, 1, 11); R('#5a1a2a', 10, 2, 1, 11); R('#ffe8a0', 8, 2, 0.5, 11);
    R('#3a2a20', 1, 13, 14, 2);
  }],
  plaque: [16, 16, (g, R) => { R('#5a4420', 3, 5, 10, 7); R('#c8a860', 4, 6, 8, 5); R('#6a5430', 5, 7, 6, 0.6); R('#6a5430', 5, 9, 4, 0.6); }],
  paintFamily: [16, 16, (g, R) => {
    R('#8a6a2a', 2, 2, 12, 10); R('#e8d8c0', 3, 3, 10, 8);
    R('#5a3a2a', 4, 4, 3, 3); R('#f2d8c8', 4, 5, 3, 2); R('#6a4a7a', 4, 7, 3, 4);
    R('#1a1418', 9, 5, 3, 2); R('#f2e4e0', 9, 6, 3, 2); R('#e6e2ec', 9, 8, 3, 3); R('#8a6a2a', 6, 13, 4, 1);
  }],
  teaPlates: [16, 16, (g, R) => {
    R('#d8ccbc', 1, 4, 14, 7); R('#b0a594', 1, 10, 14, 2); R('#24180f', 3, 12, 2, 4); R('#24180f', 11, 12, 2, 4);
    R('#f8f4ee', 2, 5, 5, 3); R('#c8c0b8', 3, 6, 3, 1); R('#f8f4ee', 9, 5, 5, 3); R('#c8c0b8', 10, 6, 3, 1);
  }],
  teaSet: [16, 16, (g, R) => {
    R('#d8ccbc', 1, 4, 14, 7); R('#b0a594', 1, 10, 14, 2); R('#24180f', 3, 12, 2, 4); R('#24180f', 11, 12, 2, 4);
    R('#f0ece4', 6, 2, 5, 5); R('#f0ece4', 11, 3, 2, 1); R('#d8d0c4', 5, 4, 1, 2); R('#7a2a3a', 7, 4, 3, 1);
    R('#f8f4ee', 2, 6, 3, 2); R('#8a4a2a', 3, 6, 1, 1); R('#f8f4ee', 11, 7, 3, 2); R('#8a4a2a', 12, 7, 1, 1);
  }],
  tableDark: [16, 16, (g, R) => {
    R('#3a3430', 1, 4, 14, 7); R('#2a2420', 1, 10, 14, 2); R('#140e0a', 3, 12, 2, 4); R('#140e0a', 11, 12, 2, 4);
    R('#8a8478', 3, 5, 2, 1); R('#8a8478', 6, 6, 1, 2); R('#8a8478', 10, 5, 3, 1); R('#22040c', 8, 7, 2, 2);
  }],
  tableScissors: [16, 16, (g, R) => {
    R('#3a2618', 1, 4, 14, 7); R('#4a3220', 1, 4, 14, 1); R('#1a100a', 2, 11, 2, 5); R('#1a100a', 12, 11, 2, 5);
    R('#d4d8de', 5, 6, 6, 1); R('#d4d8de', 5, 8, 6, 1); R('#9aa0a8', 10, 7, 2, 1); R('#c8a040', 3, 5, 2, 2); R('#c8a040', 3, 8, 2, 2);
  }],
  vanity: [16, 26, (g, R) => {
    R('#3a2618', 1, 14, 14, 4); R('#4a3220', 1, 14, 14, 1); R('#2a1a10', 2, 18, 3, 8); R('#2a1a10', 11, 18, 3, 8);
    R('#6a5020', 3, 1, 10, 13); R('#9aa4b4', 4, 2, 8, 11); R('#b8c2d0', 5, 3, 1, 5); R('#8a6a2a', 3, 0, 10, 1);
    R('#c8ccd4', 9, 12, 3, 2); R('#a8823a', 7, 13, 2, 1);
  }],
  vanityEmpty: [16, 26, (g, R) => {
    R('#3a2618', 1, 14, 14, 4); R('#4a3220', 1, 14, 14, 1); R('#2a1a10', 2, 18, 3, 8); R('#2a1a10', 11, 18, 3, 8);
    R('#6a5020', 3, 1, 10, 13); R('#5a6474', 4, 2, 8, 11); R('#7a8494', 5, 3, 1, 5); R('#8a6a2a', 3, 0, 10, 1);
  }],
  sewing: [16, 16, (g, R) => {
    R('#3a2618', 1, 7, 14, 4); R('#1a100a', 2, 11, 2, 5); R('#1a100a', 12, 11, 2, 5);
    R('#1a1418', 3, 2, 9, 2); R('#1a1418', 10, 2, 2, 6); R('#1a1418', 3, 2, 2, 5); R('#c8a040', 6, 3, 2, 0.6);
    R('#c8ccd4', 4, 7, 1, 1); R('#f0ece4', 6, 6, 6, 2);
  }],
  torso: [16, 26, (g, R) => {
    R('#2a1a10', 7, 20, 2, 5); R('#2a1a10', 4, 24, 8, 2);
    R('#c8b8a8', 5, 2, 6, 4); R('#f0ece4', 4, 6, 8, 6); R('#e6e2ec', 3, 12, 10, 8); R('#d0ccd8', 3, 19, 10, 1);
    R('#c0303a', 7, 8, 2, 1);
  }],
  torsoBlack: [16, 26, (g, R) => {
    R('#2a1a10', 7, 20, 2, 5); R('#2a1a10', 4, 24, 8, 2);
    R('#3a3430', 5, 2, 6, 4); R('#141018', 4, 6, 8, 6); R('#0c0a10', 3, 12, 10, 8); R('#22040c', 6, 9, 2, 2); R('#5a0e22', 6, 9, 1, 1);
  }],
  sewbox: [16, 16, (g, R) => {
    R('#5a3a22', 2, 7, 12, 7); R('#6a4a2a', 1, 5, 14, 3); R('#8a6a3a', 1, 9, 14, 1);
    R('#c0303a', 4, 6, 2, 2); R('#e8e4ec', 8, 6, 2, 2); R('#3a5aa0', 11, 6, 2, 2); R('#f4f0ea', 5, 10, 5, 3);
  }],
  bedMina: [16, 26, (g, R) => {
    R('#2a1a12', 1, 0, 14, 7); R('#3a2618', 2, 1, 12, 5); R('#f0e8ee', 3, 6, 10, 5);
    R('#1a1418', 4, 4, 8, 6); R('#1a1418', 3, 7, 2, 5); R('#1a1418', 11, 7, 2, 5);
    R('#f2e4e0', 5, 7, 6, 4); R('#2a1820', 6, 9, 2, 0.6); R('#2a1820', 9, 9, 2, 0.6); R('#6d1530', 9, 4, 3, 1);
    R('#e6e2ec', 1, 11, 14, 13); R('#d0ccd8', 1, 14, 14, 1); R('#d0ccd8', 1, 19, 14, 1); R('#f4f0f8', 2, 11, 12, 1);
    R('#2a1a12', 0, 23, 16, 3);
  }],
  bedRoses: [16, 26, (g, R) => {
    R('#1a120c', 1, 0, 14, 7); R('#2a1a12', 2, 1, 12, 5); R('#5a5460', 3, 6, 10, 4);
    R('#2a2430', 1, 10, 14, 14); R('#201c26', 1, 14, 14, 1);
    [[3, 8], [8, 11], [5, 15], [10, 17], [4, 20]].forEach(([x, y]) => { R('#0c1a10', x - 1, y + 1, 4, 2); R('#22040c', x, y, 3, 3); R('#5a0e22', x + 1, y, 1, 1); });
    R('#1a120c', 0, 23, 16, 3);
  }],
});

// ---------- 鏡の館（左右うらがえしの間取り） ----------
function mirrorVariant(m) {
  const L = m.mirror, w = m.w;
  const fx = x => w - 1 - x;
  const fd = d => (d === 'left' ? 'right' : d === 'right' ? 'left' : d);
  const flipObj = o => Object.create(o, { x: { value: fx(o.x), enumerable: true, writable: true } });
  const rows = (L.rows || m.rows).map(r => [...r].reverse().join(''));
  const v = Object.assign({}, m, {
    id: m.id + '@mir', base: m, mirrored: true, era: 'mirror', rows,
    name: L.name || m.name, amb: L.amb || 'mirror', dark: L.dark != null ? L.dark : 0.5, light: L.light || 70,
    tint: L.tint || 'rgba(255,196,140,.30)', enter: L.enter || null,
    objs: [...(L.objs || []), ...(m.both || [])].map(flipObj),
    warps: [...m.warps0, ...(L.warps || [])].map(wp => Object.assign({}, wp, { x: fx(wp.x), tx: MAPS[wp.to].w - 1 - wp.tx, dir: fd(wp.dir) })),
    steps: [...m.bsteps, ...(L.steps || [])].map(s => ({ test: (x, y) => s.test(fx(x), y), when: s.when, act: s.act })),
    lights: (L.lights || []).map(l => Object.assign({}, l, { x: w - l.x })),
  });
  v.h = rows.length; v.w = rows[0].length;
  return v;
}
// いま見ている間取りでの x（くろばらがわの座標から）
const vx4 = (m, x) => (m.mirrored ? m.w - 1 - x : x);

// 鏡の館の文字（手鏡がないと鏡文字で出る）
async function msay(text, name) {
  if (era() !== 'mirror') return say(text, name);
  if (has('handMirror')) return say('（手鏡にうつして、読んだ）\n' + text, name);
  $('msg-text').classList.add('mirtext');
  try { await say(text, name); } finally { $('msg-text').classList.remove('mirtext'); }
  if (!flags().mirTold) { flags().mirTold = true; await say('……字が、ぜんぶ、うらがえしになっている。\nこのままじゃ、うまく読めない。'); }
}
async function paper4(title, text, mir) {
  $('paper-text').classList.toggle('mirtext', !!mir);
  try { await paper(title, text); } finally { $('paper-text').classList.remove('mirtext'); }
}
const _showPlace4 = showPlace;
showPlace = function (name) {
  const base = G && MAPS[G.map];
  const inMir = CH === 4 && era() === 'mirror';
  $('place').classList.toggle('mirtext', inMir && !has('handMirror'));
  _showPlace4(CH === 4 && base && base.mirror ? name + (inMir ? '（鏡の館）' : '（くろばらの館）') : name);
};
const _startPlay4 = startPlay;
startPlay = function () {
  ['msg-text', 'paper-text', 'place'].forEach(id => $(id).classList.remove('mirtext'));
  _startPlay4();
};
Snd.glass = function () {
  [1568, 2093, 2637, 3136].forEach((f, i) => this.tone(f, 1.3, { type: 'sine', vol: 0.05, at: i * 0.07 }));
  this.noise(0.8, { vol: 0.12, freq: 6000, type: 'highpass', attack: 0.2 });
};

// ---------- 鏡をくぐる ----------
async function crossMirror() {
  const f = flags();
  if (f.fleeing) return say('（いまは、鏡をくぐっている　ひまはない！）');
  const toMir = !f.mir;
  Snd.glass(); vibrate(30);
  await fade(true, 420, 'white');
  f.mir = toMir;
  const m = curMap(), p = G.p;
  const nx = m.w - 1 - p.x;
  Object.assign(p, { x: nx, tx: nx, ty: p.y, moving: false, t: 0, anim: 0, dir: 'down' });
  // 鏡のリコは、鏡のこちらがわには来られない
  let escaped = false;
  if (M && M.endOnCross) { const d = M.doneFlag; M = null; if (d) f[d] = true; escaped = true; }
  Snd.setAmb(M && (!M.era || M.era === era()) ? 'chase' : m.amb);
  showPlace(m.name);
  await fade(false, 420);
  if (!passable(m, nx, p.y)) {
    Snd.rustle(); shake();
    await say('……！？');
    await say('鏡をぬけた先は、黒い薔薇のしげみの、まっただなかだった。');
    await say('とげのある蔓が、ぎゅうっと、からだに巻きついて――');
    await die('c4thorn');
  }
  if (!f.crossTold) {
    f.crossTold = true;
    if (toMir) await say('……あたたかい。鏡の館にもどってきた。');
    else {
      await say('……つめたい。');
      await say('黒い薔薇。止まった柱時計。\n……あの夜の、くろばらの館だ。');
      await say('ここでは、間取りが、ふつうの向きにもどっている。\n字も、ちゃんと読める。');
      await say('（鏡をしらべると、また、むこうがわへ　くぐれる）');
    }
  }
  if (m.enter) await m.enter();
  if (escaped) {
    await sleep(300);
    await say('……鏡のむこうで、もうひとりのリコが、\nガラスに両手をついて、こちらを見ている。');
    await say('こっちまでは、来られないみたいだ。');
    await say('……手鏡を、ぎゅっとにぎりしめた。');
  }
}
async function mirrorAct() {
  const f = flags();
  if (M && M.endOnCross) return crossMirror();
  if (f.fleeing) return say('（いまは、鏡をくぐっている　ひまはない！）');
  if (!f.mir) {
    if (f.minaMet) {
      await say('鏡の中から、鏡のミナが、ほおづえをついて\nこちらを見ている。');
      const c = await choose('どうする？', ['鏡をくぐる', 'はなしかける', 'やめておく']);
      if (c === 1) return say(minaHint4(), '鏡のミナ');
      if (c === 0) return crossMirror();
      return;
    }
    await say('鏡のむこうに、明かりのともった部屋が映っている。');
  } else {
    await say('鏡のむこうに、黒い薔薇の部屋が映っている。\n……リコの姿は、どこにも映っていない。');
  }
  const c = await choose('鏡を、くぐる？', ['くぐる', 'やめておく']);
  if (c === 0) await crossMirror();
}
const glass4 = (x, y) => ({ x, y, art: () => (flags().mir ? 'mirrorCold' : flags().minaMet ? 'mirrorMinaR' : 'mirrorWarm'), act: mirrorAct });

function minaHint4() {
  const f = flags();
  if (!has('stairKey') && !f.gateKey) return 'くろばらの館の　書斎に、ろうそくが　あるでしょ。\n鏡の館の　書斎でも、おなじ　ばしょに\n火を　ともしてね。……「おなじ」だよ？';
  if (!has('scissors') && !f.vineCut) return '鏡の館の　台所に、はさみが　あるよ。\n……こっちがわにしか、ないけどね。';
  if (!f.vineCut) return 'くろばらの館の　ろうかの　はしっこ。\nとげとげの　とびら、はさみで　きれるかな？';
  if (!has('handMirror')) return '衣装部屋の　手鏡、とってきて。\nそしたら、鏡の館の字も　よめるよ。\n……鏡台の　鏡には、気をつけてね。くすくす。';
  if (!f.gateOpen) return 'かいだんの　門の　あいことば、\n手鏡で　よんでみて。';
  if (G.F.pages.length < 4) return `あの子の日記、まだ　かくれてるよ（${G.F.pages.length}/4）。\n鏡の館だけじゃなくて、くろばらの館も　さがしてね。\n……鏡からしか　入れない　へやも　あるよ。`;
  return '二階の　こども部屋で、まってるね。\nあの子の　ほんとうの名前、わかった？';
}

// ---------- アイテム・日記・死に方・エンディング ----------
Object.assign(ITEMS, {
  stairKey: { name: '階段の鍵', desc: '鏡の館の書斎の、机の引き出しにあった。持ち手が、うらがえしの薔薇のかたち。' },
  scissors: { name: 'はさみ', desc: '鏡の館の台所にあった、銀のはさみ。くろばらの館の台所には、なかった。' },
  handMirror: { name: '手鏡', desc: '衣装部屋の鏡台にあった、銀の手鏡。うらがえしの字も、これにうつせば読める。' },
});
const DIARY4 = {
  1: 'きょう、森の中の　この館に\nひっこしてきた。\n\nわたしの　へやは　二階。\n大きな鏡が　あって、\nちょっとだけ　こわい。',
  2: '鏡の中の子に、はなしかけてみた。\n\nわたしと　おなじ顔。\nでも、リボンが　はんたいがわ。\n\nわたしが　わらうと、あの子も　わらう。\nはじめての、おともだち。',
  3: 'あの子に、名前を　つけてあげた。\n\nわたしの名前を、\n鏡に　うつしたみたいに\nうしろから　読んで――「ミナ」。\n\nおさらにも、ほってもらった。',
  4: '（白いハンカチ。すみに、赤い糸で　ししゅう）\n\n　　　　ナ　ミ\n\n（つつんであった紙に）\nおかあさんが　ぬってくれた、\nわたしの　名前。\nなくさないように、しまっておく。',
};
const LIT_PAGES4 = [1, 2];       // 鏡の館で見つける（手鏡がないと鏡文字）
function readDiary4(n) {
  return paper4(`古い日記 ${'①②③④'[n - 1]}`, DIARY4[n], !has('handMirror') && LIT_PAGES4.includes(n));
}
async function getDiary4(n) {
  if (!G.F.pages.includes(n)) G.F.pages.push(n);
  Snd.pick();
  await say(`古い日記を見つけた。（${G.F.pages.length}/4）`);
  await readDiary4(n);
  if (!has('handMirror') && LIT_PAGES4.includes(n) && !flags().diaryMirTold) {
    flags().diaryMirTold = true;
    await say('……鏡文字だ。\n手鏡でもあれば、ちゃんと読めるのに。');
  }
}
DEATHS.push(
  ['c4pond', '水鏡', '鏡の庭の池', 4],
  ['c4thorn', 'うらがわの薔薇', 'むこうに黒いものが映る鏡', 4],
  ['c4candle', 'さかさまの火', '書斎のろうそく', 4],
  ['c4spell', 'うしろから読む', '書斎のうらがえしの本', 4],
  ['c4lag', 'おくれる鏡', 'くろばらの館の廊下の鏡', 4],
  ['c4tea', 'うつしのお茶', '鏡の館の台所', 4],
  ['c4shadow', 'もうひとりのリコ', '衣装部屋からの追いかけっこ', 4],
  ['c4needle', 'ぬいとめ', 'おかあさんの部屋のミシン', 4],
  ['c4name', 'まちがえた名前', 'さいごの名前', 4],
  ['c4mina', 'ずっと、ここに', 'さいごの追いかけっこ', 4],
);
ENDINGS.push(
  ['c4normal', 'NORMAL END『閉じたカーテン』', 4],
  ['c4true', 'TRUE END『ふたつの名前』', 4],
  ['c4another', 'ANOTHER END『二階の窓の明かり』', 4],
);
Object.assign(ENDING_TEXT, {
  c4normal: [
    'リコは、かえりの鏡に、とびこんだ。\nうしろで、だれかが、名前をよんでいた。',
    '白い薔薇の原っぱは、まだ夜だった。\nひびだらけの鏡は、もう、なにも映さない。',
    '……ミナは、まだ、あの館でねむっている。\nほんとうの名前を、わすれたまま。',
    'ときどき、鏡の奥で、\n二階のカーテンが、ほんの少しだけ、ゆれる。',
    '「こんどは、さいごまで、あそぼうね」',
  ],
  c4true: [
    'ナミは、鏡のミナの手を、両手でつつんだ。\n「ずっと、わたしの名前を、もっていてくれたんだね」',
    '「……だって、わたしの名前は、\nあなたが、つけてくれたんだもの」',
    'リボンがはんたいがわの、そっくりな顔で、\nふたりは、はじめて、いっしょにわらった。',
    '二階の窓のカーテンが、いっぱいにひらかれた。\n鏡の館に、朝の光がさしこんでくる。',
    '気がつくと、リコは、白い薔薇の原っぱにいた。\nひびだらけの鏡に、ふたりの女の子が映っている。',
    '「またね、リコ」「またね」\n……鏡の向こうにも、ちゃんと、朝は来た。',
  ],
  c4another: [
    '「わたしが、ここにのこる。\nミナの、おともだちになる。\nだから、あの子を、かえしてあげて」',
    '鏡のミナは、しばらく、だまっていた。\nそれから、ねむっている女の子の耳もとで、\nなにかを、そっと、ささやいた。',
    '女の子は目をさまし、鏡をくぐって、\n朝の原っぱへ、かけていった。\n……一度も、ふりかえらずに。',
    '白い薔薇の原っぱの鏡には、\nいまは、ふたりの女の子が映っている。',
    'ひとりは、白い服。\nもうひとりは――赤いリボンを、はんたいがわに結んでいる。',
  ],
});

// ---------- 小さなイベント ----------
const lantern4 = (x, y, id) => ({ x, y, art: 'lantern', lantern: id, solid: true, act: () => lantern(id) });

async function candle4(i) {
  const f = flags();
  if (f.candleDone) return say('ろうそくが、しずかに燃えている。');
  const lit = f.cseq || [];
  if (lit.includes(i)) return say('ろうそくに、火がともっている。');
  await say('燭台に、まだ火のついていない、白いろうそく。');
  const c = await choose('火をともす？', ['ともす', 'やめておく']);
  if (c !== 0) return;
  Snd.click();
  f.cseq = [...lit, i];
  if (i !== f.cseq.length - 1) {
    f.cseq = [];
    f.cwrong = (f.cwrong || 0) + 1;
    const col = ['赤', '白', '青'][i];
    if (f.cwrong === 1) { Snd.crash(); return say(`ぽっ……${col}い炎。\n……と思ったとたん、ぜんぶの火が消えた。\nじゅんばんが、ちがうみたい。`); }
    if (f.cwrong === 2) { Snd.crash(); shake(); return say(`${col}い炎が、いっしゅん、まっ黒になって……消えた。\nつぎにまちがえたら、あぶない気がする。`); }
    Snd.crash(); shake();
    await say('火が、黒く、大きく、燃えあがった。');
    await say('黒い炎が、床をつたって、\nリコの影に、燃えうつって――');
    await die('c4candle');
  }
  if (f.cseq.length < 3) return say(`ぽっ、と火がともった。\n……${['赤', '白', '青'][i]}い炎だ。`);
  f.candleDone = true;
  Snd.chime();
  await say('三本のろうそくが、赤、白、青に燃えあがった。');
  await say('机の引き出しが、カタン、とひらいた。');
  await getItem('stairKey');
}

async function gate4() {
  const f = flags();
  await say('階段の前に、鉄の門。');
  if (!f.gateKey) {
    if (!has('stairKey')) return say('鍵がかかっている。\n鍵穴のよこに、小さな札がかかっている。');
    G.F.items = G.F.items.filter(i => i !== 'stairKey');
    f.gateKey = true; Snd.click();
    await say('「階段の鍵」をさしこんだ。カチャリ。');
    await say('……でも、門はひらかない。');
    Snd.giggle();
    await say('あいことばは？', '鏡のミナ');
  }
  if (!has('handMirror')) return say('（あいことば……？\n札の字は、うらがえしで、うまく読めない）');
  const c = await choose('あいことばは？', ['あさが　くるまで　あそぼう', 'うぼそあ　でまるく　がさあ', 'わからない']);
  if (c === 1) { Snd.crash(); return say('ブー……と、門が低くうなった。\n……さかさまに読んだだけじゃ、だめみたいだ。'); }
  if (c !== 0) return;
  f.gateOpen = true; Snd.door();
  await say('門が、きい……と、ひらいた。');
  Snd.giggle();
  await say('上のほうで、くすくすと、笑い声がした。');
}

async function vanity4() {
  if (has('handMirror')) return say('鏡台の鏡には、なにも映っていない。\n……リコの姿さえ。');
  await say('鏡台の上に、銀の手鏡が置いてある。');
  const c = await choose('手鏡を取る？', ['取る', 'やめておく']);
  if (c !== 0) return;
  await getItem('handMirror');
  await say('手鏡をのぞくと、うしろの鏡台の鏡がうつりこんだ。\n……うらがえしの、うらがえし。');
  await say('（鏡の館の、うらがえしの字も、\nこの手鏡にうつせば、読めそうだ）');
  await sleep(400);
  await say('……あれ？');
  await say('鏡台の鏡の中で、リコが、まだ、こちらを見ている。\nリコは、もう、手鏡をのぞいているのに。');
  Snd.giggle();
  await say('鏡の中のリコが、にっこり笑った。\n……リボンが、はんたいがわだ。');
  Snd.crack(); shake();
  await say('そして、鏡のふちに、手をかけた――！');
  await say('（鏡をくぐれば、にげられるかもしれない！）');
  startChase(0, 'c4_dress', 5, 2, 900, 0.3);
  Object.assign(M, { kind: 'rikoR', era: 'present', caughtId: 'c4shadow', follow: true, safe: [], endOnCross: true, doneFlag: 'chase1Done', lag: 1.1 });
}

// ---------- マップ（座標はぜんぶ、くろばらの館がわ） ----------
const roseW4 = (x, y) => ({ x, y, art: 'roseWhite', solid: true, act: async () => { await say('白い薔薇。\nあまい、いいにおいがする。'); } });
const roseB4 = (x, y) => ({ x, y, art: 'rose', solid: true, act: async () => { await say('黒い薔薇。\n……さわらないほうがいい。'); } });
const LIT_LIGHTS = (...xy) => xy.map(([x, y]) => ({ x, y, r: 26, c: 'fire' }));

Object.assign(MAPS, {
  c4_field: {
    name: '白い薔薇の原っぱ', amb: 'forest', dark: 0.8, light: 56, outdoor: true,
    rows: [
      'TTWW,WW,WTT',
      'TTWWWWWWWTT',
      'TT,,,,,,,TT',
      'T,,,,,,,,,T',
      'T,,,,p,,,,T',
      'TT,,,p,,,TT',
      'TT,,,p,,,TT',
      'TTT,,p,,TTT',
      'TTT,,p,,TTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
    ],
    lights: [{ x: 5.5, y: 2, r: 30, c: 'fire' }],
    objs: [
      { x: 5, y: 2, art: 'mirrorWarm', solid: true, act: fieldMirror },
      { x: 2, y: 3, art: 'fallenDoor', solid: true, act: async () => { await say('たおれた大きな扉。\n……あの館の、玄関の扉だ。'); } },
      { x: 6, y: 9, art: 'sign', solid: true, act: async () => { await say('立て札。『しろばらの館　この先』\n……ソウタの字だ。'); } },
      ...[[2, 2], [3, 2], [7, 2], [8, 2], [1, 3], [9, 3], [8, 4]].map(([x, y]) => roseW4(x, y)),
    ],
  },

  c4_garden: {
    name: '鏡の庭', amb: 'forest', dark: 0.84, light: 54, outdoor: true, tint: 'rgba(80,90,160,.16)',
    rows: [
      'TWWWWWWWWWT',
      'TWWWWWWWWWT',
      'TWWWWdWWWWT',
      'T,,,,p,,,,T',
      'T,ww,p,,,,T',
      'T,ww,p,,,,T',
      'TT,,,p,,,TT',
      'TT,,,p,,,TT',
      'TTT,,p,,TTT',
      'TTT,,p,,TTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTTTTTTTTTT',
    ],
    warps: [{ x: 5, y: 2, to: 'c4_hall', tx: 6, ty: 9, dir: 'up', door: true }],
    lights: [{ x: 2.5, y: 1.5, r: 22, c: 'purple' }, { x: 8.5, y: 1.5, r: 22, c: 'purple' }],
    objs: [
      { x: 2, y: 1, art: 'fwindow', act: async () => { await say('館の窓。うす紫の明かりが、ぼんやりもれている。'); } },
      { x: 8, y: 1, art: 'fwindow', act: async () => { await say('窓の奥は、まっ暗だ。'); } },
      ...[[2, 3], [8, 4], [3, 7], [7, 6]].map(([x, y]) => roseB4(x, y)),
      { x: 3, y: 4, art: null, solid: true, act: async () => { await say('黒い水の池。\n……のぞいても、なにも映らない。'); } },
      { x: 3, y: 9, art: 'sign', solid: true, act: async () => { await say('古い立て札。\n『くろばらの館』\n……あの夜と、同じ字。'); } },
    ],
    both: [lantern4(7, 9, 'c4garden')],
    mirror: {
      name: '鏡の庭', amb: 'mirror', dark: 0.5, light: 66, tint: 'rgba(255,200,150,.28)',
      rows: [
        'TWWWWWWWWWT',
        'TWWWWWWWWWT',
        'TWWWWdWWWWT',
        'T,,,,p,,,,T',
        'T,ww,p,,,,T',
        'T,ww,p,,,,T',
        'TT,,,p,,,TT',
        'TT,,,p,,,TT',
        'TTT,,p,,TTT',
        'TTT,,p,,TTT',
        'TTTT,p,TTTT',
        'TTTT,p,TTTT',
        'TTTT,p,TTTT',
        'TTTTTpTTTTT',
      ],
      lights: [{ x: 2.5, y: 1.5, r: 24, c: 'fire' }, { x: 8.5, y: 1.5, r: 24, c: 'fire' }, { x: 5.5, y: 13.4, r: 20 }],
      objs: [
        { x: 2, y: 1, art: 'litWindow', act: async () => { await say('窓から、あたたかい明かりがもれている。\n……スープのにおいがする。'); } },
        { x: 8, y: 1, art: 'litWindow', act: async () => { await say('窓の中で、だれかの影が動いた……気がした。'); } },
        { x: 5, y: 0, art: 'curtainWin', act: async () => { await say('二階の窓。\nカーテンが、ぴったり閉まっている。'); } },
        ...[[2, 3], [8, 4], [3, 7], [7, 6], [8, 3]].map(([x, y]) => roseW4(x, y)),
        { x: 3, y: 4, art: null, solid: true, act: pond4 },
        { x: 3, y: 9, art: 'sign', solid: true, act: async () => { await say('立て札に、なにか書いてある。'); await msay('『ようこそ　かがみの　やかたへ』'); } },
        { x: 5, y: 13, art: 'exitFrame', act: async () => { await say('かえりの鏡。むこうに、夜の原っぱが見える。'); if (!flags().fleeing) await say('……ミナを置いては、帰れない。'); } },
      ],
      steps: [{ test: (x, y) => y === 13, act: async () => {
        if (flags().fleeing) { M = null; flags().fleeing = false; Snd.glass(); return ending('c4normal'); }
        await say('かえりの鏡。……ミナを置いては、帰れない。');
        G.p.dir = 'up'; await warp('c4_garden', 5, 12, 'up');
      } }],
      enter: async () => {
        if (flags().gardenIn) return;
        flags().gardenIn = true;
        await say('……あたたかい。\n夜なのに、春の夕方みたいなにおいがする。');
        await say('ふりかえると、いまくぐってきた鏡が、\nぽつんと立っている。むこうに、夜の原っぱ。');
        await say('目の前に、館があった。\n窓という窓に、明かりがともっている。');
        await say('……くろばらの館と、同じ形。\nでも、なにもかもが、左右はんたいだ。');
      },
    },
  },

  c4_hall: {
    name: '玄関ホール', amb: 'house', dark: 0.88, light: 50, tint: 'rgba(80,90,160,.16)',
    rows: [
      '#############',
      '######S######',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      'd...........d',
      '#...........#',
      '#...........#',
      '#...........#',
      '######d######',
    ],
    warps: [
      { x: 0, y: 6, to: 'c4_library', tx: 9, ty: 6, dir: 'left', door: true },
      { x: 12, y: 6, to: 'c4_corridor', tx: 1, ty: 3, dir: 'right', door: true },
      { x: 6, y: 10, to: 'c4_garden', tx: 5, ty: 3, dir: 'down', door: true },
    ],
    enter: async () => {
      if (flags().dHallIn) return;
      flags().dHallIn = true;
      await say('柱時計は、3時33分。\n階段は、黒い蔓で、びっしりふさがれている。');
    },
    objs: [
      { x: 6, y: 1, art: 'vineWall', solid: true, act: async () => { await say('階段は、黒い蔓でふさがれている。\n……こっちがわからは、のぼれない。'); } },
      { x: 1, y: 2, art: 'clock', solid: true, act: async () => { await say('大きな柱時計。\n針は、3時33分で止まっている。'); } },
      { x: 9, y: 1, art: 'painting_lady', act: async () => { await say('上品そうな女の人の絵。\n……目のところだけ、黒くぬりつぶされている。'); } },
      { x: 9, y: 2, art: 'rose', solid: true, act: async () => { await say('床から、黒い薔薇がしげっている。\nとげが、びっしり。'); } },
      { x: 2, y: 8, art: 'vase', solid: true, act: async () => { await say('枯れた薔薇の花びん。'); } },
    ],
    both: [glass4(3, 1), lantern4(10, 9, 'c4hall')],
    mirror: {
      name: '玄関ホール',
      warps: [{ x: 6, y: 1, to: 'c4_upstairs', tx: 6, ty: 7, dir: 'up', when: () => flags().gateOpen }],
      lights: LIT_LIGHTS([1.5, 2.2], [11.5, 2.2]),
      objs: [
        { x: 6, y: 1, art: 'gateIron', solid: true, when: () => !flags().gateOpen, act: gate4 },
        { x: 5, y: 1, art: 'plaque', act: async () => { await say('門のよこの、小さな札。'); await msay('『かいだんの　あいことば\n　あさが　くるまで　あそぼう』'); } },
        { x: 9, y: 1, art: 'mirrorThorn', act: async () => {
          await say('もうひとつの鏡。\n……むこうがわに、黒いものが、びっしり映っている。');
          const c = await choose('鏡を、くぐる？', ['くぐる', 'やめておく']);
          if (c === 0) await crossMirror();
        } },
        { x: 10, y: 1, art: 'paintFamily', act: async () => { await say('女の人と、黒い髪の女の子の絵。\nふたりとも、わらっている。'); await msay('『わたしたちの　あたらしい　おうち』'); } },
        { x: 1, y: 2, art: 'clock', solid: true, act: async () => { await say('柱時計。カチ、コチ、と動いている。\n……針が、ぎゃくに回っている。'); } },
        { x: 2, y: 8, art: 'bouquet', solid: true, act: async () => { await say('テーブルに、白い薔薇の花束。'); } },
      ],
      enter: async () => {
        if (flags().minaMet) return;
        flags().minaMet = true;
        await sleep(300);
        flags().minaShow = true;
        Snd.giggle();
        await say('階段の上に、白い服の女の子が立っていた。');
        await say('ミナ！');
        await say('……じゃ、ない？\nなにかが、ちがう。');
        await say('いらっしゃい、リコ。\nまってたよ。', '？？？');
        await say('わたし？　わたしは、ミナ。\n……リコの知ってるミナとは、ちょっとだけ、ちがうけど。', '鏡のミナ');
        await say('リコのミナなら、二階で　ねむってるよ。\nあの子、じぶんの　ほんとうの名前を、\nなくしちゃったの。', '鏡のミナ');
        await say('だから、かくれんぼ　しよう。\nあの子の日記を、この館の　あちこちに　かくしたの。', '鏡のミナ');
        await say('ぜんぶ　みつけて、あの子の　ほんとうの名前を\nあてられたら……かえしてあげる。', '鏡のミナ');
        await say('みつけられなかったら――\nリコも、ずっと、ここで　あそぼうね。', '鏡のミナ');
        Snd.giggle();
        await fade(true, 300, 'white');
        flags().minaShow = false;
        await fade(false, 400);
        await say('……女の子は、ふっと、消えていた。');
        await say('（あの子のリボン……左右が、はんたいだった）');
        await say('（館の鏡をしらべると、\n鏡のむこうがわへ、くぐれるみたいだ）');
      },
    },
  },

  c4_library: {
    name: '書斎', amb: 'house', dark: 0.88, light: 50, tint: 'rgba(80,90,160,.16)',
    rows: [
      '###########',
      '###########',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........d',
      '#.........#',
      '#.........#',
      '###########',
    ],
    warps: [{ x: 10, y: 6, to: 'c4_hall', tx: 1, ty: 6, dir: 'right', door: true }],
    objs: [
      ...['R', 'W', 'B'].map((k, i) => ({ x: 3 + i * 2, y: 1, art: 'candle' + k, act: async () => {
        await say(`燭台で、${['赤', '白', '青'][i]}い炎のろうそくが、ゆらゆら燃えている。`);
      } })),
      { x: 1, y: 1, art: 'shelf', act: async () => { await say('ほこりをかぶった本ばかりだ。'); } },
      { x: 5, y: 4, art: 'desk', solid: true, act: async () => {
        await say('机の上に、メモがある。');
        await paper('メモ', 'しょくだいに　火を　ともすこと。\n\nあか、しろ、あお　の　じゅんに。\n\n――鏡の　むこうでも、\n　　おなじ　ばしょに。');
      } },
      { x: 8, y: 7, art: 'chair', solid: true, act: async () => { await say('ひじかけ椅子。\nつめたい。'); } },
    ],
    both: [
      ...[2, 4, 6, 9].map((x, i) => ({ x, y: 1, art: 'shelf', act: async () => {
        if (flags().mir) return msay(['『もりの　どうぶつ　ずかん』', '『はじめての　ししゅう』', '『かがみの　くにの　おひめさま』', '『おいしい　おかし』'][i]);
        await say(['『黒薔薇の育て方』\n……ページが、黒くぬりつぶされている。', '本が、ぎっしり並んでいる。', '絵本。『ひとりぼっちの　おひめさま』', '古い地図。森のまんなかに、館がひとつ。'][i]);
      } })),
      glass4(8, 1),
    ],
    mirror: {
      name: '書斎',
      lights: LIT_LIGHTS([5.5, 2.2]),
      objs: [
        ...[0, 1, 2].map(i => ({ x: 3 + i * 2, y: 1, art: () => (flags().candleDone || (flags().cseq || []).includes(i) ? ['candleR', 'candleW', 'candleB'][i] : 'candleOff'), act: () => candle4(i) })),
        { x: 1, y: 1, art: 'shelfB', act: async () => {
          await say('一冊だけ、青い背表紙の本がとびだしている。');
          if (has('handMirror')) {
            await say('（手鏡にうつして、読んだ）');
            return paper('うらがえしの　おまじない', 'かがみの　なかで　かかれた　ことばを、\nうしろから　よんでは　いけません。\n\nよんだ　ひとは、\nかがみの　こちらがわに\nのこされて　しまいます。');
          }
          await msay('『うらがえしの　おまじない』');
          const c = await choose('声に出して、読んでみる？', ['読む', 'やめておく']);
          if (c !== 0) return say('……やめておこう。');
          await say('ひとつずつ、うしろから、読んでみた。\n「す、ま、い……」');
          await say('……自分の声が、ぜんぶ、さかさまに聞こえる。');
          await say('「て、け、す、た」\n声が、口の中へ、すいこまれていく――');
          await scare(true);
          await die('c4spell');
        } },
        { x: 5, y: 4, art: 'desk', solid: true, act: async () => {
          if (!hasPage(1)) { await say('机の上に、ノートのページが一枚。'); return getDiary4(1); }
          if (!flags().candleDone) return say('机の引き出しは、かたく閉まっている。\n……鍵穴は、ない。');
          await say('からっぽの引き出し。');
        } },
        { x: 8, y: 7, art: 'chair', solid: true, act: async () => { await say('ひじかけ椅子。\nまだ、少しだけあたたかい。'); } },
      ],
    },
  },

  c4_corridor: {
    name: '廊下', amb: 'house', dark: 0.88, light: 50, tint: 'rgba(80,90,160,.16)',
    rows: [
      '####################',
      '####d###############',
      '#..................#',
      'd..................#',
      '#..................#',
      '####################',
    ],
    warps: [{ x: 0, y: 3, to: 'c4_hall', tx: 11, ty: 6, dir: 'left', door: true }],
    dwarps: [{ x: 4, y: 1, to: 'c4_dress', tx: 5, ty: 7, dir: 'up', door: true, when: () => flags().vineCut }],
    objs: [
      { x: 4, y: 1, art: 'thornDoor', solid: true, when: () => !flags().vineCut, act: async () => {
        await say('扉に、黒い薔薇のつるが、びっしり巻きついている。');
        if (!has('scissors')) return say('……なにか、切るものがあれば。');
        await say('はさみで、つるを一本ずつ、切っていった。');
        Snd.click(); shake();
        G.F.items = G.F.items.filter(i => i !== 'scissors');
        flags().vineCut = true;
        await say('扉が、ぎい……と、ひらいた。');
      } },
      { x: 7, y: 1, art: 'painting_eyes', act: async () => { await say('たくさんの目が描かれた絵。\n……ぜんぶ、鏡のほうを見ている。'); } },
      { x: 14, y: 1, art: 'mirror', act: async () => {
        await say('古い鏡。\n……リコの姿が、ほんの少しだけ、おくれて動く。');
        const c = await choose('じっと、見てみる？', ['見る', 'やめておく']);
        if (c !== 0) return say('……見ないほうがいい。');
        await say('リコが手をあげると、\n鏡のリコは、一拍おくれて、手をあげた。');
        await say('……二拍。……三拍。');
        await say('とうとう、鏡のリコは、動かなくなった。\nかわりに、リコのからだが、動かない。');
        await scare();
        await say('鏡の中から、だれかが、リコを見ていた。');
        await die('c4lag');
      } },
      { x: 17, y: 4, art: 'vase', solid: true, act: async () => { await say('花びんに、黒い薔薇が一輪。'); } },
    ],
    both: [glass4(10, 1), lantern4(16, 4, 'c4corr')],
    mirror: {
      name: '廊下',
      rows: [
        '####################',
        '##################d#',
        '#..................#',
        'd..................#',
        '#..................#',
        '####################',
      ],
      warps: [{ x: 18, y: 1, to: 'c4_kitchen', tx: 5, ty: 7, dir: 'up', door: true }],
      lights: LIT_LIGHTS([5.5, 2], [14.5, 2]),
      objs: [
        { x: 7, y: 1, art: 'drawing', act: async () => { await say('子どもの絵。\n女の子がふたり、手をつないでいる。'); await msay('『わたしと　ミナ』'); } },
        { x: 13, y: 1, art: 'window', act: async () => { await say('窓の外は、ずっと夕方の色。\n……時間が、進んでいないみたいだ。'); } },
        { x: 4, y: 1, art: 'painting_land', act: async () => { await say('森の絵。まんなかに、明かりのともった館。'); } },
      ],
    },
  },

  c4_kitchen: {
    name: '台所', amb: 'house', dark: 0.89, light: 48, tint: 'rgba(80,90,160,.16)',
    rows: [
      '###########',
      '###########',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '###########',
    ],
    enter: async () => {
      if (flags().dKitchenIn) return;
      flags().dKitchenIn = true;
      await say('くろばらの館の台所。\n……出口が、ない。');
      await say('ここには、鏡からしか、来られないみたいだ。');
    },
    objs: [
      { x: 5, y: 4, art: 'tableDark', solid: true, act: async () => {
        await say('テーブルの上に、割れたお皿。');
        await say('かけらのひとつに、字が彫ってある。\n『ミ』……の、半分。');
      } },
      { x: 8, y: 6, art: 'ktable', solid: true, act: async () => { await say('台の上には、なにもない。'); } },
      { x: 7, y: 6, art: 'paper', glint: true, when: () => !hasPage(3), act: async () => { await say('床に、ノートのページが一枚。'); await getDiary4(3); } },
      roseB4(2, 6),
    ],
    both: [
      glass4(8, 1),
      { x: 2, y: 1, art: 'cupboard', act: async () => { await say(flags().mir ? '食器棚。お皿が、きちんと二まいずつ。' : '食器棚。ほとんど、からっぽ。'); } },
      { x: 4, y: 1, art: 'sink', act: async () => { await say(flags().mir ? '流し。水が、ちょろちょろ……\n下から上へ、のぼっていく。' : '流し。かわききっている。'); } },
    ],
    mirror: {
      name: '台所',
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
      warps: [{ x: 5, y: 8, to: 'c4_corridor', tx: 18, ty: 2, dir: 'down', door: true }],
      lights: LIT_LIGHTS([5.5, 3]),
      objs: [
        { x: 4, y: 4, art: 'teaPlates', solid: true, act: async () => {
          await say('テーブルに、お皿がふたつ。\nどちらにも、名前が彫ってある。');
          await msay('『ナミ』　　『ミナ』');
        } },
        { x: 6, y: 4, art: 'teaSet', solid: true, act: async () => {
          await say('紅茶のポットと、カップがふたつ。\nまだ、あたたかい湯気が立っている。');
          const c = await choose('飲んでみる？', ['飲む', 'やめておく']);
          if (c !== 0) return say('……やめておこう。');
          await say('ひとくち、飲んだ。\n……あまくて、おいしい。');
          await say('……手を見ると、指のむこうが、すけて見えた。');
          await say('からだが、だんだん、うすく、ひらべったく――\n鏡に映った、絵のように。');
          await die('c4tea');
        } },
        { x: 8, y: 6, art: () => (has('scissors') || flags().vineCut ? 'ktable' : 'tableScissors'), solid: true, act: async () => {
          if (has('scissors') || flags().vineCut) return say('台の上には、なにもない。');
          await say('台の上に、銀のはさみがある。');
          await getItem('scissors');
        } },
        { x: 2, y: 7, art: 'paper', glint: true, when: () => !hasPage(2), act: async () => { await say('すみに、ノートのページが一枚、落ちている。'); await getDiary4(2); } },
        lantern4(9, 7, 'c4kitchen'),
      ],
    },
  },

  c4_dress: {
    name: '衣装部屋', amb: 'house', dark: 0.88, light: 50, tint: 'rgba(80,90,160,.16)',
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
    warps: [{ x: 5, y: 8, to: 'c4_corridor', tx: 4, ty: 2, dir: 'down', door: true }],
    enter: async () => {
      if (flags().dressIn) return;
      flags().dressIn = true;
      await say('小さな白いワンピースが、たくさんかかっている。\n……どれも、同じ形。');
    },
    objs: [
      { x: 5, y: 2, art: () => (has('handMirror') ? 'vanityEmpty' : 'vanity'), solid: true, act: vanity4 },
      { x: 2, y: 2, art: 'wardrobe', solid: true, act: async () => { await say('たんす。白いワンピースが、ぎっしり。\nむねのところに、どれも、赤い糸のししゅう。'); } },
      { x: 8, y: 2, art: 'wardrobe', solid: true, act: async () => { await say('たんす。\n……内側に、鏡がはってある。のぞかないでおこう。'); } },
      { x: 2, y: 6, art: 'torsoBlack', solid: true, act: async () => { await say('黒い布をかぶせた、人台。'); } },
      lantern4(9, 7, 'c4dress'),
    ],
  },

  c4_upstairs: {
    name: '二階の廊下', amb: 'house', dark: 0.88, light: 50, tint: 'rgba(80,90,160,.16)',
    rows: [
      '#############',
      '###d#####d###',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#############',
    ],
    warps: [
      { x: 3, y: 1, to: 'c4_sewing', tx: 4, ty: 7, dir: 'up', door: true },
      { x: 9, y: 1, to: 'c4_nami', tx: 5, ty: 7, dir: 'up', door: true },
    ],
    enter: async () => {
      if (flags().dUpIn) return;
      flags().dUpIn = true;
      await say('くろばらの館の、二階。\nかべいちめんに、黒い薔薇が這っている。');
      await say('階段は……下まで、蔓でうまっている。');
    },
    objs: [
      { x: 1, y: 1, art: 'dollShelf', act: async () => { await say('人形の棚。\n……人形は、ひとつも残っていない。'); } },
      { x: 11, y: 1, art: 'fwindow', act: async () => { await say('窓の外は、黒い森。'); } },
      roseB4(10, 6),
    ],
    both: [glass4(6, 1), lantern4(11, 7, 'c4up')],
    mirror: {
      name: '二階の廊下',
      rows: [
        '#############',
        '###d#####d###',
        '#...........#',
        '#...........#',
        '#...........#',
        '#...........#',
        '#...........#',
        '#...........#',
        '######S######',
      ],
      warps: [{ x: 6, y: 8, to: 'c4_hall', tx: 6, ty: 2, dir: 'down' }],
      lights: LIT_LIGHTS([1.5, 2], [11.5, 2]),
      enter: async () => {
        if (flags().upIn) return;
        flags().upIn = true;
        await say('二階。……あたたかい廊下だ。\nどこかで、オルゴールが鳴っている。');
      },
      objs: [
        { x: 11, y: 1, art: 'curtainWin', act: async () => {
          await say('窓。カーテンが閉まっている。');
          const c = await choose('カーテンを、あけてみる？', ['あける', 'やめておく']);
          if (c !== 0) return;
          await say('すきまから、外が見えた。\n……夜の、白い薔薇の原っぱ。');
          await say('ひびだらけの鏡が、ぽつんと立っている。\nその前には、だれもいない。');
          await say('……あの朝、カーテンを閉めたのは、\nこの窓だったんだ。');
        } },
        { x: 1, y: 1, art: 'drawing', act: async () => { await say('かべに貼られた絵。\n大きな鏡と、そのむこうの女の子。'); } },
      ],
    },
  },

  c4_sewing: {
    name: 'おかあさんの部屋', amb: 'house', dark: 0.88, light: 50, tint: 'rgba(80,90,160,.16)',
    rows: [
      '#########',
      '#########',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '####d####',
    ],
    warps: [{ x: 4, y: 8, to: 'c4_upstairs', tx: 3, ty: 2, dir: 'down', door: true }],
    objs: [
      { x: 6, y: 3, art: 'torsoBlack', solid: true, act: async () => { await say('黒い布をかぶせた、人台。\n……だれの服を、作るつもりだったんだろう。'); } },
      { x: 6, y: 6, art: 'sewbox', solid: true, act: async () => {
        if (hasPage(4)) return say('さいほう箱。色とりどりの糸。');
        await say('さいほう箱。\n底に、白いハンカチが、ていねいにたたんである。');
        await getDiary4(4);
      } },
      { x: 2, y: 1, art: 'fwindow', act: async () => { await say('窓。カーテンは、やぶれている。'); } },
    ],
    both: [glass4(4, 1)],
    mirror: {
      name: 'おかあさんの部屋',
      lights: LIT_LIGHTS([4.5, 4]),
      objs: [
        { x: 2, y: 3, art: 'sewing', solid: true, act: async () => {
          await say('ミシン。\nつくりかけの、白いワンピースがはさまっている。');
          const c = await choose('ミシンを、うごかしてみる？', ['うごかす', 'やめておく']);
          if (c !== 0) return say('……やめておこう。');
          await say('ペダルをふむと、ミシンが、カタカタと動きだした。');
          await say('……針が、布ではなく、\n床にうつった、リコの影を、ぬいはじめた。');
          Snd.rustle(); shake();
          await say('カタカタカタカタ……\n足が、床から、はなれない――');
          await die('c4needle');
        } },
        { x: 6, y: 3, art: 'torso', solid: true, act: async () => {
          await say('人台に、つくりかけの白いワンピース。\nむねに、赤い糸で、ししゅうのとちゅう。');
          await msay('『ミ』');
          await say('……そこで、糸が止まっている。');
        } },
        { x: 2, y: 1, art: 'curtainWin', act: async () => { await say('窓。カーテンのすきまから、\nあたたかい明かりがもれている。'); } },
      ],
    },
  },

  c4_nami: {
    name: 'こども部屋', amb: 'house', dark: 0.88, light: 50, tint: 'rgba(80,90,160,.16)',
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
    warps: [{ x: 5, y: 8, to: 'c4_upstairs', tx: 9, ty: 2, dir: 'down', door: true }],
    enter: async () => {
      if (flags().dNamiIn) return;
      flags().dNamiIn = true;
      await say('くろばらの館の、二階のおく。\n……あの夜、「魔女の部屋」だと思っていた部屋だ。');
      await say('ほんとうは、女の子の部屋だったんだ。');
      await say('ベッドの上に、黒い薔薇が、いくつも。');
    },
    objs: [
      { x: 8, y: 3, art: 'bedRoses', solid: true, act: async () => { await say('ベッドの上に、黒い薔薇が散らばっている。\n……まくらに、小さなくぼみ。'); } },
      { x: 2, y: 5, art: 'desk', solid: true, act: async () => {
        await say('机の引き出しに、日記帳。\n……ほとんどのページが、黒くぬりつぶされている。');
        await say('のこっているのは、さいごのページだけ。\n『だれか、わたしの名前をよんで』');
        await say('……あの夜、リコが拾った日記と、同じ字だ。');
      } },
      { x: 2, y: 1, art: 'fwindow', act: async () => { await say('窓。外は、黒い森。'); } },
    ],
    both: [glass4(5, 1)],
    mirror: {
      name: 'こども部屋',
      lights: LIT_LIGHTS([8.5, 3], [2.5, 2]),
      enter: namiRoom4,
      objs: [
        { x: 8, y: 3, art: 'bedMina', solid: true, act: async () => {
          if (flags().fleeing) return;
          await say('ミナが、しずかに、ねむっている。\nよんでも、ゆすっても、目をさまさない。');
          await finalChoice4();
        } },
        { x: 6, y: 4, art: null, solid: true, when: () => !flags().fleeing, act: finalChoice4 },
        { x: 2, y: 1, art: 'curtainWin', act: async () => { await say('窓。カーテンが、ぴったり閉まっている。'); } },
        { x: 2, y: 6, art: 'toyboxOpen', solid: true, act: async () => { await say('おもちゃ箱。\nおままごとの、お皿とカップが、ふたりぶん。'); } },
      ],
    },
  },
});

// 第四章のマップのしあげ（both・dwarps をまとめる。鏡の館がわは mirrorVariant が作る）
for (const id of Object.keys(MAPS)) {
  const m = MAPS[id];
  if (m.id || !id.startsWith('c4_')) continue;
  m.id = id; m.h = m.rows.length; m.w = m.rows[0].length;
  m.rows.forEach((r, i) => { if (r.length !== m.w) console.warn('row length', id, i); });
  if (m.mirror && m.mirror.rows) m.mirror.rows.forEach((r, i) => { if (r.length !== m.w || m.mirror.rows.length !== m.h) console.warn('mirror row length', id, i); });
  m.warps0 = m.warps || [];
  m.warps = [...m.warps0, ...(m.dwarps || [])];
  m.both = m.both || [];
  m.objs = [...(m.objs || []), ...m.both];
  m.bsteps = m.bsteps || [];
  m.steps = [...(m.steps || []), ...m.bsteps];
  m.lights = m.lights || [];
}

// 鏡のミナ（玄関ホールの階段の上・こども部屋）
const _extra4 = extraSprites;
extraSprites = function (m, pp) {
  const out = _extra4(m, pp);
  if (CH !== 4) return out;
  const put = (img, x, y) => out.push({ y: y * T + 16, img, x: x * T, dy: y * T + 16 - img.height });
  const face = (x, y) => (pp ? faceTo(x * T, y * T, pp.x, pp.y) : 'down');
  if (m.id === 'c4_hall@mir' && flags().minaShow) { const x = vx4(m, 6); put(flippedGirl('mina', face(x, 2), 0), x, 2); }
  if (m.id === 'c4_nami@mir' && !flags().fleeing) { const x = vx4(m, 6); put(flippedGirl('mina', face(x, 4), 0), x, 4); }
  return out;
};

// ---------- はじまりの原っぱ・鏡の庭の池 ----------
async function fieldMirror() {
  await say('ひびだらけの大きな鏡。\n……鏡の表面に、うっすらと字が浮かんでいる。');
  $('msg-text').classList.add('mirtext');
  try { await say('リコ、たすけて'); } finally { $('msg-text').classList.remove('mirtext'); }
  await say('うらがえしの字。……でも、なんとなく、読める。\n「リコ、たすけて」。');
  await say('鏡の奥に、明かりのともった館が見える。\n二階の窓は、カーテンが閉まったままだ。');
  const c = await choose('鏡に、手をのばす？', ['のばす', 'やめておく']);
  if (c !== 0) return say('……。');
  await say('鏡の表面は、つめたい水みたいだった。\n指先が、するりと、むこうがわへ――');
  Snd.glass();
  await fade(true, 900, 'white');
  flags().mir = true;
  enterMap('c4_garden', 5, 12, 'up');
  await fade(false, 1000);
  const m = curMap();
  if (m.enter) await m.enter();
}
async function pond4() {
  await say('池の水面に、リコが映っている。\n……水の中の空は、まっ青な、昼の空だ。');
  const c = await choose('のぞきこむ？', ['のぞく', 'やめておく']);
  if (c !== 0) return say('……やめておこう。');
  await say('水面のリコと、目が合った。');
  await say('水面のリコは、にっこり笑って、\nゆっくりと、手をのばして――');
  Snd.rustle(); shake();
  await say('リコの手首を、つかんだ。');
  await die('c4pond');
}

// ---------- さいごの部屋 ----------
async function namiRoom4() {
  if (flags().namiIn) return;
  flags().namiIn = true;
  await say('あたたかい部屋。\nベッドで、ミナが、ねむっている。');
  await say('ミナ！');
  Snd.giggle();
  await say('しーっ。おこしちゃ、だめ。', '鏡のミナ');
  await say('ねえ、リコ。この子、ほんとうは、\n「ミナ」じゃないんだよ。', '鏡のミナ');
  await say('ミナは、わたし。\nこの子が、鏡の中のわたしに、つけてくれた名前。', '鏡のミナ');
  await say('この子は、魔女さんに　時間をあげたとき、\nじぶんの名前を、なくしちゃったの。\nおぼえてたのは、わたしの名前だけ。', '鏡のミナ');
  await say('だから、この子は、ずっと「ミナ」って　なのってた。\n……わたしの名前なのに。', '鏡のミナ');
  await say('かわりに、わたしが、この子の名前を　あずかってるの。\nわすれないように。なくさないように。', '鏡のミナ');
  if (G.F.pages.length === 4) await say('日記、ぜんぶ　みつけたね。\n……じゃあ、あててみて。あの子の、ほんとうの名前。', '鏡のミナ');
  else await say(`日記、まだ　${4 - G.F.pages.length}まい　たりないよ。\nそれじゃあ、あの子の名前、わからないでしょ？`, '鏡のミナ');
}
async function finalChoice4() {
  const f = flags();
  if (f.fleeing) return;
  if (!f.finalTalk) { f.finalTalk = true; }
  else await say(G.F.pages.length === 4 ? 'あの子の名前、わかった？' : 'まだ、かくれんぼの　とちゅうだよ？', '鏡のミナ');
  const opts = [];
  if (G.F.pages.length === 4) opts.push('名前をよぶ');
  opts.push('逃げる', 'わたしが、ここにのこる', 'やめておく');
  const c = await choose('どうする？', opts);
  const pick = opts[c];
  if (!pick || pick === 'やめておく') return;
  if (pick === '名前をよぶ') return callName4();
  if (pick === 'わたしが、ここにのこる') {
    const k = await choose('ほんとうに？', ['のこる', 'やっぱりやめる']);
    if (k !== 0) return;
    await say('……リコが？\nわたしと、ずっと、いっしょに？', '鏡のミナ');
    await say('うん。だから、あの子を、かえしてあげて。');
    return ending('c4another');
  }
  await say('……ごめん。いまは、まだ。');
  await say('どうして？\nまだ、かくれんぼの　とちゅうだよ？', '鏡のミナ');
  await say('にがさない。\n……リコも、ずっと、ここに　いるの！', '鏡のミナ');
  f.fleeing = true;
  Snd.crack(); shake();
  await say('逃げなきゃ！');
  const m = curMap();
  startChase(0, 'c4_nami', vx4(m, 6), 4, 900, 0.27);
  Object.assign(M, { kind: 'minaR', era: 'mirror', caughtId: 'c4mina', follow: true, safe: [], lag: 1.0 });
}
async function callName4() {
  const k = await choose('あの子の、ほんとうの名前は……', ['ミナ', 'ナミ', 'やっぱりやめる']);
  if (k === 2) return;
  if (k === 0) {
    await say('「……ミナ」');
    await say('……それは、わたしの名前だよ。', '鏡のミナ');
    await say('でも、うれしい。\nリコが、わたしを、よんでくれた。', '鏡のミナ');
    await say('じゃあ、ずっと、いっしょに　いてね。', '鏡のミナ');
    await say('つめたい手が、リコの手をにぎった。\nリコのリボンが、するりと、はんたいがわへ――');
    await die('c4name');
  }
  await say('「ナミ」');
  Snd.chime();
  await say('ベッドの女の子の、まつげが、ふるえた。');
  await say('……せいかい。', '鏡のミナ');
  await say('……ナミ。\nそう……わたし、ナミ。', 'ナミ');
  await say('ずっと、自分のこと、ミナだと思ってた。\n……いちばんの、おともだちの名前なのに。', 'ナミ');
  await say('だって、あなたが、わすれちゃったから。\nだから、わたしが、あずかってたの。', '鏡のミナ');
  await say('ミナ。……ごめんね。\nそれから、ありがとう。', 'ナミ');
  await ending('c4true');
}

// ---------- はじまり ----------
async function newGame4() {
  G = { map: 'c4_field', p: { x: 5, y: 12, dir: 'up' }, F: { items: [], pages: [], f: {}, lit: [] } };
  G.p = { x: 5, y: 12, dir: 'up', tx: 5, ty: 12, moving: false, t: 0, anim: 0 };
  await fade(true, 600);
  startPlay();
  enterMap('c4_field', 5, 12, 'up');
  await fade(false, 1000);
  run(async () => {
    await say('くろばらの館があった場所は、\nいまは、白い薔薇の原っぱになっている。');
    await say('まんなかに、ひびだらけの大きな鏡がひとつ。\nあの館の、二階にあった鏡だ。');
    await say('ときどき、その鏡にミナが映って、\nリコと、おしゃべりをした。');
    await say('でも、ここしばらく、鏡は、なにも映さない。');
    await say('今夜、窓の外で、\nだれかに名前をよばれた気がした。');
    await say('……ミナ？');
  });
}

if (window.KB) Object.assign(window.KB, { crossMirror, mirrorAct, candle4, gate4, vanity4, finalChoice4, callName4, getDiary4, fieldMirror, minaHint4 });
