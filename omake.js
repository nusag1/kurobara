'use strict';
// くろばらの館 おまけ（三つの章の TRUE END をすべて見ると解放）
//   エピローグ『白い薔薇の朝』：館のあとの原っぱで、鏡の中のミナにもう一度会う（CH = 4 として遊ぶ。記録はしない）
//   設定資料室：人物・部屋の作者メモ・死に方とエンディングの図鑑（作者のひとこと）・クリアタイム・章えらび
//   タイムアタックの計測そのものは game.js（meta.run／meta.best）

// ---------- 絵 ----------
Object.assign(ARTS, {
  // 鏡の中にミナ（ガラスの内側だけに描く）
  mirrorMina: [16, 26, g => {
    g.drawImage(getArt('mirror'), 0, 0);
    g.save(); g.beginPath(); g.rect(4, 1, 8, 19); g.clip();
    g.globalAlpha = 0.85; g.drawImage(girl('mina', 'down', 0), 0, 2);
    g.restore();
  }],
  // 鏡の向こうの館（こちらにはもうない、明かりのともった館）
  mirrorHouse: [16, 26, (g, R) => {
    R('#6a5020', 3, 0, 10, 25); R('#8a6a2a', 3, 0, 10, 1); R('#1a1430', 4, 1, 8, 23); R('#2a2048', 4, 1, 8, 8);
    R('#d8d0f0', 10, 3, 1, 1);
    R('#0c0814', 5, 10, 6, 10); R('#0c0814', 6, 8, 4, 2); R('#0c0814', 7, 7, 2, 1);
    R('#ffcf6a', 6, 12, 1, 2); R('#ffcf6a', 9, 12, 1, 2); R('#ffcf6a', 6, 16, 1, 2); R('#5a4a70', 9, 16, 1, 2);
    R('#3a2a20', 7, 18, 2, 2); R('#0e1a10', 4, 20, 8, 4); R('#e8e4ec', 5, 20, 1, 1); R('#e8e4ec', 10, 21, 1, 1);
    R('#4a3a18', 2, 24, 12, 2);
  }],
  bouquet: [16, 16, (g, R) => {
    R('#24402a', 7, 8, 2, 6); R('#24402a', 5, 9, 1, 4); R('#24402a', 10, 9, 1, 4);
    [[3, 4], [7, 2], [10, 4], [5, 6], [9, 6]].forEach(([x, y]) => { R('#e8e4ec', x, y, 3, 3); R('#ffffff', x + 1, y, 1, 1); });
    R('#c0303a', 6, 11, 4, 1); R('#c0303a', 6, 12, 1, 2); R('#c0303a', 9, 12, 1, 2);
    R('#f4eedc', 10, 12, 4, 3); R('#8a7a6a', 11, 13, 2, 0.5);
  }],
  roseTurn: [16, 16, (g, R) => {
    R('#24402a', 7, 9, 1, 5); R('#24402a', 8, 11, 2, 1);
    R('#e8e4ec', 6, 6, 4, 4); R('#ffffff', 7, 6, 1, 1); R('#22040c', 7, 8, 2, 2);
  }],
  fallenDoor: [16, 16, (g, R) => {
    R('#1a0e08', 0, 6, 16, 9); R('#3a2414', 1, 7, 14, 7); R('#2a1a0e', 1, 10, 14, 1);
    R('#c8a040', 11, 9, 2, 1); R('#24402a', 2, 6, 4, 2); R('#24402a', 9, 13, 5, 2); R('#e8e4ec', 3, 5, 2, 2);
  }],
});

// ---------- 持ち物・エンディング ----------
Object.assign(ITEMS, {
  blackRose: { name: '黒い薔薇', desc: 'あの館の前でひろった、小さな一輪。何年たっても、枯れずにいる。' },
});
ENDINGS.push(['epilogue', 'EPILOGUE『白い薔薇の朝』', 4]);
Object.assign(ENDING_TEXT, {
  epilogue: [
    '鏡の表面が、水のようにゆれて、\nもとの、ひびだらけの古い鏡にもどった。',
    'ソウタとならんで、森の道をかえる。\n木のあいだから、朝日が差しこんでくる。',
    'ポケットの中で、懐中時計が\nちゃんと、今の時刻をきざんでいる。',
    'ふりかえると、白い薔薇の中で、\n鏡が一度だけ、きらりと光った。',
    '――鏡の向こうにも、朝は来るのだろうか。',
  ],
});
ENDING_HINT4 = '鏡の向こうの館のお話は……いつか、また。';

// ---------- エピローグのマップ ----------
const epMirrorArt = () => (flags().epHouse ? 'mirrorHouse' : flags().epMina ? 'mirrorMina' : 'mirror');
Object.assign(MAPS, {
  ep_garden: {
    name: '白い薔薇の原っぱ', amb: 'dawn', dark: 0.36, light: 90, outdoor: true, tint: 'rgba(255,176,130,.32)',
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
    lights: [{ x: 5.5, y: 2.2, r: 34 }],
    objs: [
      { x: 5, y: 2, art: epMirrorArt, solid: true, act: epMirror },
      { x: 6, y: 3, art: 'bouquet', solid: true, when: () => !flags().epMina, act: epLetter },
      { x: 6, y: 6, art: null, solid: true, act: epSota },
      { x: 2, y: 3, art: 'fallenDoor', solid: true, act: async () => { await say('たおれた大きな扉。\n金色の取っ手に、見おぼえがある。'); await say('……あの夜、何度押しても\nびくともしなかった扉だ。'); } },
      { x: 6, y: 9, art: 'sign', solid: true, act: async () => {
        await say('古い立て札。\n『くろばらの館　この先』');
        await say('「くろばら」の字の上から、白いペンキで\n『しろばら』と書きなおしてある。\n……下手な字だ。');
        await say('それ、ぼくが書いた。', 'ソウタ');
      } },
      ...[[2, 2], [3, 2], [7, 2], [8, 2], [1, 3], [9, 3], [8, 4]].map(([x, y]) => ({
        x, y, art: 'roseWhite', solid: true,
        act: async () => { await say('白い薔薇が、いちめんに咲いている。\nとげに、朝つゆが光っている。'); },
      })),
      { x: 4, y: 3, art: 'roseTurn', when: () => flags().epMina, act: async () => { await say('リコが置いた薔薇。\n花びらが、すっかり白くなっている。'); } },
    ],
    steps: [{
      test: (x, y) => y <= 8, when: () => !flags().epBell,
      act: async () => {
        flags().epBell = true;
        Snd.bell();
        await say('遠くで、時計塔の鐘が鳴った。');
        await say('ひとつ、ふたつ……六つ。\n……ちゃんと、今の時刻を打っている。');
      },
    }],
  },
});
for (const [id, m] of Object.entries(MAPS)) {
  if (m.id) continue;
  m.id = id; m.h = m.rows.length; m.w = m.rows[0].length;
  m.objs = m.objs || []; m.warps = m.warps || []; m.steps = m.steps || []; m.lights = m.lights || [];
}

// ソウタ（原っぱで待っている。リコのほうを向く）
const _extra3 = extraSprites;
extraSprites = function (m, pp) {
  const out = _extra3(m, pp);
  if (m.id !== 'ep_garden') return out;
  const img = boy(pp ? faceTo(6 * T, 6 * T, pp.x, pp.y) : 'down', 0);
  out.push({ y: 6 * T + 16, img, x: 6 * T, dy: 6 * T + 16 - img.height });
  return out;
};

// ---------- エピローグのできごと ----------
async function epSota() {
  const f = flags();
  if (f.epMina) return say('……おねえちゃん、かえろ。\nおなか、すいた。', 'ソウタ');
  if (!f.epLetter) {
    await say('おねえちゃん。\nほんとに、ここに、こわい館があったの？', 'ソウタ');
    await say('いまは、薔薇の原っぱにしか見えないや。', 'ソウタ');
    await say('……うん。あったよ。\nちゃんと、ここに。');
    return;
  }
  await say('魔女さん、毎朝、塔のぜんまいを巻いてるんだって。', 'ソウタ');
  await say('……こわい人だと思ってたけど。\nちょっとだけ、さびしい人だったのかな。', 'ソウタ');
}

async function epLetter() {
  await say('鏡の前に、白い薔薇の花束が置いてある。\nリボンに、手紙がはさまっている。');
  await paper('リラの手紙', '鏡の中の　ミナへ\n\n塔の時計は、いまも動いています。\n毎朝、ぜんまいを巻くのが\nわたしの仕事になりました。\n\nセナが好きだった白い薔薇を、あなたにも。\nあなたの時間を借りたままで、ごめんなさい。\n\n　　　　　　　　　時計塔の　リラ');
  if (!flags().epLetter) {
    flags().epLetter = true;
    await say('……魔女さんも、ここに来たんだ。');
  }
}

async function epMirror() {
  const f = flags();
  if (f.epMina) return say('ひびだらけの、古い鏡。');
  await say('ひびだらけの、大きな鏡。\n……館の二階にあった、あの鏡だ。');
  if (!f.epLetter) return say('いまは、リコとうしろの森しか映っていない。');
  const c = await choose('ポケットの黒い薔薇を、鏡の前に置く？', ['置く', 'やめておく']);
  if (c !== 0) return;
  G.F.items = G.F.items.filter(i => i !== 'blackRose');
  f.epMina = true;
  await say('黒い薔薇を、鏡の前に、そっと置いた。');
  Snd.chime();
  await say('花びらが、ふちのほうから\nゆっくり、白くそまっていく。');
  await sleep(400);
  await say('鏡の中で、リコのうしろに\n白い服の女の子が立っていた。');
  await say('リコ。……ひさしぶり。', 'ミナ');
  await say('ミナ！');
  await say('お花、ありがとう。\n魔女さんのも、ちゃんと、とどいてるよ。', 'ミナ');
  await say('わたしね、鏡の中にいるから、\nいろんな「時間」が見えるの。', 'ミナ');
  await say('リコがソウタくんを、たすけにいった朝も。\nソウタくんがリコを、むかえにきた朝も。\nどっちも、ほんとうのこと。', 'ミナ');
  await say('……ミナは、ずっと、そこにいるの？');
  await say('…………。', 'ミナ');
  await say('ねえ、リコ。\n鏡の、ずっと奥。……見える？', 'ミナ');
  Snd.rewind();
  await fade(true, 500, 'white');
  f.epHouse = true;
  await fade(false, 700);
  await say('鏡の奥に、館が映っていた。');
  await say('崩れても、薔薇に囲まれてもいない。\n窓という窓に、あたたかい明かりがともっている。');
  await say('こちら側には、もう、どこにもない館。');
  Snd.giggle();
  await say('二階の窓で、だれかが、\nそっとカーテンを閉めた。');
  await say('あれは……？');
  await say('わたしが、ほんとうにいた場所。\n……たぶん、ね。', 'ミナ');
  await say('まだ、ぜんぶは思い出せないの。\nあの館のことも、わたしの、ほんとうの名前も。', 'ミナ');
  const k = await choose('ぜんぶ思い出したら……\nまた、名前をよんでくれる？', ['よぶよ', 'むかえにいく']);
  if (k === 0) await say('うん。何度でも、よぶよ。');
  else await say('こんどは、わたしが、むかえにいく。\nソウタが、そうしてくれたみたいに。');
  await say('……ふふ。\nやくそく、だよ。', 'ミナ');
  f.epHouse = false;
  await sleep(300);
  await say('おねえちゃーん？\nだれと、しゃべってるの？', 'ソウタ');
  await say('……おともだち。');
  await ending('epilogue');
}

// ---------- はじまり ----------
async function newGame4() {
  G = { map: 'ep_garden', p: { x: 5, y: 12, dir: 'up' }, F: { items: ['blackRose'], pages: [], f: {}, lit: [] } };
  G.p = { x: 5, y: 12, dir: 'up', tx: 5, ty: 12, moving: false, t: 0, anim: 0 };
  $('archive').hidden = true;
  await fade(true, 700, 'white');
  startPlay();
  enterMap('ep_garden', 5, 12, 'up');
  await fade(false, 1200);
  run(async () => {
    await say('――ずっと、あとの、ある春の朝。');
    await say('リコとソウタは、森のおくの\nあの場所に来ていた。');
    await say('くろばらの館が、あったところ。\n黒い薔薇は、もう、どこにもない。');
  });
}

// ---------- 設定資料室 ----------
// 人物（need：その行を見せるのに要るエンディング。どれか一つ見ていればよい）
const PROFILES = [
  { name: 'リコ', art: () => girl('riko', 'down', 0), lines: [
    ['第一章・第二章の主人公。森で迷って、黒い薔薇の館に閉じこめられた女の子。こわがりだけど、だれかの名前を呼ぶ勇気がある。'],
    ['赤いリボンは、おかあさんに結んでもらったもの。'],
    ['ある時間では、弟のかわりに自分の時間をさしだし、二代目の時計守になった。', ['c2another', 'c3normal', 'c3true', 'c3another']],
  ] },
  { name: 'ソウタ', art: () => boy('down', 0), lines: [
    ['リコの弟。帽子をよくなくす。第二章では、黒い花びらを追いかけて森に消えてしまう。', ['c2normal', 'c2true', 'c2another']],
    ['第三章の主人公。十二歳。懐中時計で時を止めて、姉をむかえに塔へ行く。', ['c3normal', 'c3true', 'c3another']],
    ['しろばらの立て札を書いたのはソウタ。字は、まだ練習中。', ['epilogue']],
  ] },
  { name: 'ミナ', art: () => girl('mina', 'down', 0), lines: [
    ['館に引っこしてきて、ひとりぼっちだった女の子。「ずっと、ひとりにならないように」と魔女に願った。'],
    ['名前を呼ばれて願いがとけたあとも、鏡の中から、リコたちを見守っている。', ['true', 'c2normal', 'c2true', 'c2another']],
    ['どうして鏡の中にいられるのかは……まだ、ひみつ。'],
    ['鏡の向こうには、もうひとつの館がある……らしい。', ['epilogue']],
  ] },
  { name: '魔女リラ', art: () => monsterArt('lila', 'down', 0, 0), lines: [
    ['森のおくの時計塔の魔女。白い薔薇が好き。', ['c2normal', 'c2true', 'c2another']],
    ['病気の娘セナを失いたくなくて、最後の一秒の前で塔の時間を止めた。その時間を保つため、ひとりぼっちの子どもたちに黒い薔薇をわたしてきた。', ['c2true', 'c3true']],
    ['いまは毎朝、塔のぜんまいを巻いている。', ['epilogue']],
  ] },
  { name: 'セナ', art: () => girl('sena', 'down', 0), lines: [
    ['リラの娘。春の朝、7時40分に生まれた。おかあさんに手紙を書くのが好き。', ['c2normal', 'c2true', 'c2another']],
    ['「とけいは　とめないで」。いちばん言いたかったのは、たぶん「だいすき」のほう。', ['c2true']],
  ] },
  { name: 'にんぎょう', art: () => girl('doll', 'down', 0), lines: [
    ['館のホールにいる、金色の髪の人形。オルゴールを返すと、道をあけてくれる。'],
    ['「あそぶ？」と聞かれたら、よく考えてから答えること。'],
  ] },
  { name: '時計守', art: () => monsterArt('keeper', 'down', 0, 0), lines: [
    ['時計の頭をした、塔の見まわり番。「今」にしかいられない。', ['c2normal', 'c2true', 'c2another']],
    ['二代目には、赤いリボンがついている。', ['c3normal', 'c3true', 'c3another']],
  ] },
];

// 部屋の作者メモ（章ごと）
const ROOM_NOTES = {
  1: [
    ['森の小道', '来た道が蔓でふさがる場面は、いちばん最初に決めました。'],
    ['玄関ホール', '柱時計は 3時33分。この数字、あとの章でずっと使うことになります。'],
    ['書斎', '赤・青・緑。メモはちゃんと読みましょう。'],
    ['隠し部屋', 'オルゴールの曲は、全部の章で同じメロディです。'],
    ['東の廊下', '絵は、全部さわりたくなるように描きました。ごめんなさい。'],
    ['台所', 'ミナの名前のお皿は、気づいた人だけのごほうびです。'],
    ['二階', '子ども部屋の窓は、のぞかないほうがいい窓です。'],
    ['魔女の部屋', '鏡が割れる音は、ガラスの音を三つ重ねて作りました。'],
  ],
  2: [
    ['森のはずれ', 'ソウタの帽子は青。第三章のシャツと同じ色です。'],
    ['時計塔の中庭', '噴水の底は「昔」と「今」で水の色がちがいます。'],
    ['時計のホール', '「昔」の振り子は、本当にゆれています。近づきすぎ注意。'],
    ['台所', '「昔」の台所は、塔でいちばんあたたかい場所のつもりで描きました。'],
    ['温室', '種をうめて、何十年後にのぼる。時計を作ったときから、やりたかった仕掛けです。'],
    ['書庫', '合わせ鏡の奥は、作者もまだ行ったことがありません。'],
    ['セナの部屋', '「いっしょにねる？」は、セナのいちばんの本音です。'],
    ['地下工房', '作りかけの人形を、ソウタが見なくてよかった。'],
    ['歯車の間', '7時40分。セナの絵を見た人なら、きっとわかります。'],
    ['文字盤の部屋', '三つの選択肢、どれもリコらしい答えにしたつもりです。'],
  ],
  3: [
    ['森の入口', '小さなお墓は、だれのものか書いていません。'],
    ['枯れた中庭', '七年たって、噴水の水も止まってしまいました。'],
    ['止まったホール', '鏡のミナ、ソウタにも「おおきくなったね」と言っています。'],
    ['刃の廊下', '時を止めるしくみは、この廊下のために作りました。'],
    ['人形の工房', '空いている椅子は、ソウタのためのもの……でした。'],
    ['書庫', '二代目の時計守は、ホールには入ってきません。リコの最後の意地です。'],
    ['上の回廊', '鉄の扉は 2.6秒に 0.32秒だけ。止めればかんたんです。'],
    ['時計守の部屋', '手帳の字が乱れていくところは、何度も書きなおしました。'],
    ['歯車の間', '転がる歯車は三列。止めて、歩いて、また止めて。'],
    ['鐘の間', '赤いリボンだけは、七年たっても色あせていません。'],
  ],
};

// 図鑑：作者のひとこと
const DEATH_NOTES = {
  rose: '最初の死に方。「さわらないで」と言われると、さわりたくなりますよね。',
  painting: '絵の中は意外と快適……という設定は、ありません。',
  pot: '今夜の献立は、聞かないでください。',
  shelf: '三回まちがえるまで待ってくれる、やさしい本棚です。',
  doll: '人形は本気でよろこんでいました。悪気はないんです。',
  thread: 'ナイフがあれば、一瞬だったのに。',
  window: 'のぞくと、のぞき返してくる窓です。',
  mirror: '「さわる」を選んだ勇気に、拍手をおくります。',
  caught: '逃げ道は、ちゃんとあります。たぶん。',
  well: '井戸をのぞきこむのは、ホラーの世界では禁止です。',
  vine: '温室の黒い薔薇は、肥料をほしがっていました。',
  pendulum: '振り子のテンポは、塔の時計とそろえてあります。',
  between: '「昔」と「今」をまたぐときは、足もとを確認してから。',
  keeper: '時計守は足がおそいかわりに、あきらめが悪いです。',
  found: 'たんすの中で、息を止めていたのに……。',
  sleep: 'セナは、さびしかっただけなんです。',
  infinite: 'どこまでも続く書庫。帰り道は、ありません。',
  gear: '「つぎにまちがえたら、あぶない」と、ちゃんと書きました。',
  lila: '魔女は、本気を出すと速いんです。',
  grave: '名前のないお墓には、さわらないのがお約束。',
  blade: '時を止めれば、刃の前でも昼寝ができます（しないでください）。',
  doll3: '空いている椅子には、座らないのがマナーです。',
  mirror3: '映らない鏡には、映らない理由があります。',
  rkeeper: '二代目は、初代よりちょっとだけ足が速いです。',
  door: '0.32秒は短すぎたかも、と少し反省しています。',
  found3: '「みいつけた」の声、だれの声だったか気づきましたか。',
  teeth: '歯車の上は、止めてから歩きましょう。',
  bell: '鐘の綱は、ひっぱりたくなる長さにしてあります。わざとです。',
  lila3: '七年たっても、魔女の足は速いままでした。',
};
const ENDING_NOTES = {
  normal: 'いちばん最初に作ったエンディング。「またきてね」は、ちょっとだけ本気です。',
  true: 'ミナの名前を呼んでくれて、ありがとうございます。',
  c2normal: '鐘の数を数えた人とは、気が合いそうです。',
  c2true: '3時33分から、たった1分。いちばん長い1分でした。',
  c2another: 'リコは、こういう子です。だから第三章ができました。',
  c3normal: 'ソウタは今夜も、ぜんまいを巻いています。いつか、きっと。',
  c3true: '「ただいま」を書くために、ここまで来ました。',
  c3another: '時計はめぐる。……作者として、ちょっと胸が痛いです。',
  epilogue: 'ミナのお話は、まだ終わっていません。',
};

const ARC_TABS = [['people', '人物'], ['rooms', '部屋'], ['book', '図鑑'], ['time', 'タイム'], ['jump', '章えらび']];
let arcTab = 'people';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const seenAny = need => !need || need.some(e => meta.endings.includes(e));

function openArchive() {
  if (!omakeOpen()) return;
  const tabs = $('arc-tabs');
  tabs.innerHTML = '';
  for (const [id, label] of ARC_TABS) {
    const b = el('button', '', label);
    b.setAttribute('role', 'tab');
    b.dataset.tab = id;
    b.addEventListener('click', () => { Snd.blip(); showArcTab(id); });
    tabs.appendChild(b);
  }
  showArcTab(arcTab);
  openOverlay('archive');
}
function showArcTab(id) {
  arcTab = id;
  [...$('arc-tabs').children].forEach(b => { b.classList.toggle('on', b.dataset.tab === id); b.setAttribute('aria-selected', b.dataset.tab === id); });
  const body = $('arc-body');
  body.innerHTML = '';
  ({ people: arcPeople, rooms: arcRooms, book: arcBook, time: arcTime, jump: arcJump })[id](body);
  body.parentElement.scrollTop = 0;
}

function arcPeople(body) {
  body.appendChild(el('p', 'lead', '見たエンディングがふえると、書いてあることもふえます。'));
  for (const p of PROFILES) {
    const lines = p.lines.filter(([, need]) => seenAny(need));
    if (!lines.length) continue;
    const box = el('div', 'prof');
    const img = p.art(), c = el('canvas', 'face');
    c.width = img.width; c.height = img.height;
    c.style.height = (img.height * 3) + 'px'; c.style.width = (img.width * 3) + 'px';
    c.getContext('2d').drawImage(img, 0, 0);
    const txt = el('div');
    txt.appendChild(el('b', '', p.name));
    for (const [t] of lines) txt.appendChild(el('p', '', t));
    box.append(c, txt);
    body.appendChild(box);
  }
}

function arcRooms(body) {
  for (const [ch, no, name] of CH_LIST) {
    if (!chCleared(ch)) continue;
    body.appendChild(el('p', 'rec-ch', `${no}　${name}`));
    const ul = el('ul');
    for (const [room, note] of ROOM_NOTES[ch]) {
      const li = el('li');
      li.append(el('b', '', room), el('span', 'd', note));
      ul.appendChild(li);
    }
    body.appendChild(ul);
  }
}

function arcBook(body) {
  const chs = [...CH_LIST, [4, 'おまけ', 'エピローグ']];
  for (const [ch, no, name] of chs) {
    const ds = DEATHS.filter(d => chOf(d) === ch), es = ENDINGS.filter(e => chOf(e) === ch);
    if (ch === 4 && !meta.endings.includes('epilogue')) continue;
    body.appendChild(el('p', 'rec-ch', `${no}　${name}`));
    const list = (title, items, got, notes) => {
      if (!items.length) return;
      body.appendChild(el('h3', '', `${title} ${items.filter(x => got.includes(x[0])).length}/${items.length}`));
      const ul = el('ul');
      for (const [id, nm] of items) {
        const has = got.includes(id), li = el('li', has ? '' : 'unk');
        if (has) li.append(el('b', '', nm), el('span', 'c', notes[id] || ''));
        else li.textContent = '？？？';
        ul.appendChild(li);
      }
      body.appendChild(ul);
    };
    list('死に方', ds, meta.deaths, DEATH_NOTES);
    list('エンディング', es, meta.endings, ENDING_NOTES);
  }
}

function arcTime(body) {
  body.appendChild(el('p', 'lead', '「はじめから」遊んだ回の、クリアまでの時間。ランプからのやりなおしも時間に入ります（メニューを開いているあいだは止まります）。'));
  const ul = el('ul');
  for (const [ch, no, name] of CH_LIST) {
    const b = meta.best[ch], li = el('li', b ? 'time' : 'time unk');
    li.append(el('b', '', `${no}　${name}`));
    const t = el('span', 't', b ? fmtTime(b.t) : '--:--');
    li.appendChild(t);
    const e = b && ENDINGS.find(x => x[0] === b.end);
    li.appendChild(el('span', 'd', e ? e[1] : 'まだ記録がありません'));
    if (typeof meta.run[ch] === 'number' && load(saveKey(ch))) li.appendChild(el('span', 'd', `いま遊んでいる回：${fmtTime(meta.run[ch])}`));
    ul.appendChild(li);
  }
  body.appendChild(ul);
}

function arcJump(body) {
  body.appendChild(el('p', 'lead', 'クリアした章の、はじめから遊べます。'));
  const box = el('div', 'title-menu');
  for (const [ch, no, name] of CH_LIST) {
    if (!chCleared(ch)) continue;
    const b = el('button', 'tbtn');
    b.append(el('small', '', no), name);
    b.addEventListener('click', () => {
      if (load(saveKey(ch)) && !confirm(`${no}の記録が消えますが、はじめからにしますか？`)) return;
      store(saveKey(ch), null);
      closeOverlay('archive');
      newGame(ch);
    });
    box.appendChild(b);
  }
  const ep = el('button', 'tbtn epi');
  ep.append(el('small', '', 'エピローグ'), '白い薔薇の朝');
  ep.addEventListener('click', () => { closeOverlay('archive'); newGame(4); });
  box.appendChild(ep);
  body.appendChild(box);
}

// 資料室では ←→ でタブを切りかえる
addEventListener('keydown', e => {
  if ($('archive').hidden || e.repeat || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  const i = ARC_TABS.findIndex(t => t[0] === arcTab), n = ARC_TABS.length;
  Snd.blip();
  showArcTab(ARC_TABS[(i + (e.key === 'ArrowLeft' ? n - 1 : 1)) % n][0]);
});

// タイトルの「おまけ」ボタンは、このファイルが読みこまれてから出す
$('btn-omake').hidden = !omakeOpen();
