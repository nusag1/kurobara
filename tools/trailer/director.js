// 予告動画の録画用：cdp.py がゲームのページ（?debug）に読みこむ。ゲームの元ファイルは変えない。
// - 音：Snd の tone／noise／setAmb を「記録するだけ」に差しかえる（synth.py が同じ音を WAV で作る）
// - 場面：TR.prep(name) で場面のはじまりの状態を作り、TR.play(name) で操作して、終わると記録を返す
(function () {
  const now = () => Date.now() / 1000;
  const TR = window.TR = { snd: [], marks: [], err: null };
  const log = (k, a) => TR.snd.push([now(), k, a]);
  const mark = name => TR.marks.push([now(), name]);

  // ---- 音を記録に差しかえる ----
  Snd.on = true;
  Snd.ac = { get currentTime() { return performance.now() / 1000; }, state: 'running', resume() {}, suspend() {} };
  Snd.master = { gain: { setTargetAtTime() {}, value: 0.9 } };
  Snd.init = function () {};
  Snd.tone = function (f, dur, o = {}) { log('tone', [f, dur, o]); };
  Snd.noise = function (dur, o = {}) { log('noise', [dur, o]); };
  Snd.setAmb = function (kind) { if (this.ambKind === kind) return; this.ambKind = kind; log('amb', kind || null); };
  try { navigator.vibrate = () => true; } catch (e) {}
  // 予告では捕まらない・死なない（念のため）
  window.caught = function () {};

  // ---- 道具 ----
  const W = ms => new Promise(r => setTimeout(r, ms));
  async function until(fn, t = 8000) { const t0 = performance.now(); while (!fn() && performance.now() - t0 < t) await W(25); }
  const waitMsg = () => until(() => Msg.open && !Msg.typing);
  async function next(hold = 900) { await waitMsg(); await W(hold); advance(); await W(80); }
  async function choosePick(i, hold = 700) { await waitMsg(); await W(hold); Msg.sel = i; markSel(); await W(350); pick(i); await W(80); }
  async function walk(dir, n) {
    const [dx, dy] = DIRS[dir];
    const gx = G.p.x + dx * n, gy = G.p.y + dy * n;
    input.keys = [dir]; syncDir();
    await until(() => G.p.x === gx && G.p.y === gy, n * 600 + 2000);
    input.keys = []; syncDir();
    await until(() => !G.p.moving, 1000);
  }
  function setup(ch, state, map, x, y, dir, fl = {}, items = []) {
    CH = ch;
    G = state;
    G.p = { x, y, dir, tx: x, ty: y, moving: false, t: 0, anim: 0 };
    Object.assign(G.F.f, fl);
    G.F.items.push(...items);
    if (ch === 1) applyTiles();
    startPlay();
    enterMap(map, x, y, dir);
    setUI();
  }
  const st1 = () => newState();
  const blank = map => ({ map, p: {}, F: { items: [], pages: [], f: {}, lit: [] } });

  // ---- 場面 ----
  const S = {
    title: {
      prep: async () => {
        $('title-prog').hidden = true;
        ['title-ch2', 'title-ch3', 'title-ch4'].forEach(id => $(id).hidden = true);
        Snd.box = null; Snd.musicBox(true);
        Snd.setAmb('forest');
      },
      play: async () => { mark('start'); await W(7000); },
    },
    forest: {
      prep: async () => { setup(1, st1(), 'forest', 5, 13, 'up'); },
      play: async () => {
        mark('start'); await W(900);
        await walk('up', 3);          // y=10 で蔓が伸びる
        mark('roses');
        await next(700);              // ザザザ……ッ
        await next(2200);             // 振りかえると……
        await next(900);
        await W(300);
        await walk('down', 2);        // ふさがった道を見せる
        mark('vines');
        await W(1800);
      },
    },
    doll: {
      prep: async () => { setup(1, st1(), 'hall', 6, 7, 'up', { hallIn: true }); },
      play: async () => {
        mark('start'); await W(800);
        await walk('up', 4);
        await W(300);
        interact();
        await next(700);              // ……ねえ。
        mark('line');
        await next(2400);             // わたしの　オルゴール、しらない？
        await next(1800);
        await W(400);
      },
    },
    shelf: {
      prep: async () => { setup(1, st1(), 'library', 8, 4, 'up', { seq: 'rb' }); },
      play: async () => {
        mark('start'); await W(700);
        await walk('up', 2);
        await W(200);
        interact();
        await next(500);
        await choosePick(0, 500);
        mark('push');
        await next(900);              // ゴゴゴゴ……
        await next(1600);             // 本棚がひとつ……
        await W(200);
        await walk('left', 2);
        G.p.dir = 'up'; await W(300);
        await walk('up', 1);          // 隠し通路へ
        await W(1200);
      },
    },
    chase: {
      prep: async () => { setup(1, st1(), 'upstairs', 4, 8, 'left', { upIn: true, boxOpen: true }, ['smallKey', 'knife']); },
      play: async () => {
        mark('start'); await W(600);
        Snd.giggle();
        await W(500);
        startChase(1, 'upstairs', 3, 4, 200, 0.3);
        mark('chase');
        await W(1300);
        await walk('right', 3);
        await walk('up', 6);
        await W(900);
      },
    },
    ch2: {
      prep: async () => { setup(2, newState2(), 'c2_court', 6, 6, 'up', { courtIn: true, hallIn2: true }, ['watch']); $('btn-era').classList.remove('past'); },
      play: async () => {
        mark('start'); await W(1200);
        toggleEra();
        mark('past');
        await next(1800);
        await W(300);
        await walk('up', 3);
        await W(500);
        await walk('up', 1);
        await W(1000);
      },
    },
    ch3: {
      prep: async () => {
        S3.t = 0; S3.stopUntil = 0; S3.coolUntil = 0;
        setup(3, newState3(), 'c3_corr', 3, 11, 'up', { corrIn: true, stopTold: true, workIn: true });
      },
      play: async () => {
        mark('start'); await W(2600);
        stopTime();
        mark('stop');
        await W(500);
        await walk('up', 10);
        await W(3200);
      },
    },
    ch4: {
      prep: async () => { setup(4, blank('c4_field'), 'c4_field', 5, 6, 'up', { gardenIn: true }); },
      play: async () => {
        mark('start'); await W(600);
        await walk('up', 3);
        await W(200);
        interact();
        await next(500);
        mark('mirtext');
        await next(2000);             // リコ、たすけて（鏡文字）
        await next(300);
        await next(300);
        await choosePick(0, 300);
        mark('touch');
        await next(1400);             // 指先が、するりと……
        await W(2200);
        mark('garden');
        await walk('up', 8);          // 明かりのともった館へ
        await W(2200);
      },
    },
  };

  TR.prep = async name => { await S[name].prep(); await W(1200); TR.snd = []; TR.marks = []; };
  TR.play = async name => {
    log('amb', Snd.ambKind || null);
    try { await S[name].play(); } catch (e) { TR.err = String(e && e.stack || e); }
    mark('end');
    return { snd: TR.snd, marks: TR.marks, err: TR.err, amb: Snd.ambKind };
  };
})();
