'use strict';
// くろばらの館 ― 探索ホラーアドベンチャー
// 画像素材は使わず、キャラ・マップはすべてコードで1ドットずつ描いている

const T = 16;                 // 1マスのドット数
const STEP = 0.2;             // 1マス歩く秒数
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DEAD = Symbol('dead');
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function hash(x, y, k = 0) {
  let h = Math.imul(x + 1013, 374761393) ^ Math.imul(y + 7919, 668265263) ^ Math.imul(k + 31, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------- 保存 ----------
const SAVE_KEY = 'kurobara-save-v1', META_KEY = 'kurobara-meta-v1';
function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
const meta = Object.assign({ deaths: [], endings: [], sound: true }, load(META_KEY) || {});
const saveMeta = () => store(META_KEY, meta);

// ---------- 音（WebAudio で合成） ----------
const Snd = {
  ac: null, master: null, amb: null, ambKind: null, on: meta.sound, noiseBuf: null,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain();
    this.master.gain.value = this.on ? 0.9 : 0;
    this.master.connect(this.ac.destination);
    const b = this.ac.createBuffer(1, this.ac.sampleRate * 2, this.ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
  },
  setOn(v) {
    this.on = v; meta.sound = v; saveMeta();
    if (this.master) this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ac.currentTime, 0.05);
  },
  tone(f, dur, o = {}) {
    if (!this.ac) return;
    const { type = 'sine', vol = 0.2, at = 0, slide = 0, attack = 0.008 } = o;
    const t = this.ac.currentTime + at;
    const osc = this.ac.createOscillator(), g = this.ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t); osc.stop(t + dur + 0.05);
  },
  noise(dur, o = {}) {
    if (!this.ac) return;
    const { vol = 0.2, at = 0, freq = 1000, q = 1, type = 'bandpass', slide = 0, attack = 0.005 } = o;
    const t = this.ac.currentTime + at;
    const src = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    src.buffer = this.noiseBuf;
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  },
  step(outdoor) {
    if (outdoor) this.noise(0.09, { vol: 0.05, freq: 1800 + Math.random() * 600, q: 0.8 });
    else this.noise(0.06, { vol: 0.07, freq: 260 + Math.random() * 80, q: 1.5, type: 'lowpass' });
  },
  blip() { this.tone(1100 + Math.random() * 60, 0.025, { type: 'square', vol: 0.012 }); },
  door() {
    this.tone(160, 0.45, { type: 'sawtooth', vol: 0.035, slide: 1.7, attack: 0.05 });
    this.noise(0.18, { vol: 0.18, freq: 180, type: 'lowpass', at: 0.4 });
  },
  slam() {
    this.noise(0.5, { vol: 0.6, freq: 160, type: 'lowpass' });
    this.tone(50, 0.5, { vol: 0.5, slide: 0.5 });
  },
  pick() {
    this.tone(784, 0.18, { type: 'triangle', vol: 0.1 });
    this.tone(1175, 0.4, { type: 'triangle', vol: 0.08, at: 0.09 });
  },
  save() {
    this.tone(523, 0.9, { type: 'triangle', vol: 0.09 });
    this.tone(659, 0.9, { type: 'triangle', vol: 0.07, at: 0.15 });
    this.tone(784, 1.2, { type: 'triangle', vol: 0.06, at: 0.3 });
  },
  click() { this.tone(420, 0.05, { type: 'square', vol: 0.05 }); this.noise(0.05, { vol: 0.1, freq: 800 }); },
  scare() {
    this.noise(1.0, { vol: 0.7, freq: 2400, q: 0.4 });
    [233, 247, 262, 277, 466].forEach(f => this.tone(f, 1.1, { type: 'sawtooth', vol: 0.09 }));
    this.tone(70, 1.2, { vol: 0.6, slide: 0.4 });
  },
  death() {
    this.tone(220, 2.6, { type: 'sawtooth', vol: 0.08, slide: 0.25 });
    this.tone(233, 2.6, { type: 'sawtooth', vol: 0.06, slide: 0.25 });
    this.tone(55, 3, { vol: 0.4, slide: 0.6 });
  },
  thump(v = 0.5) {
    this.tone(62, 0.18, { vol: v, slide: 0.6 });
    this.tone(55, 0.2, { vol: v * 0.8, slide: 0.6, at: 0.2 });
  },
  knock() { [0, 0.32, 0.64].forEach(at => this.noise(0.09, { vol: 0.45, freq: 260, type: 'lowpass', at })); },
  giggle() {
    [1046, 1175, 1046, 1175, 988].forEach((f, i) =>
      this.tone(f, 0.09, { type: 'triangle', vol: 0.035, at: i * 0.12 }));
  },
  rustle() {
    this.noise(1.6, { vol: 0.25, freq: 500, q: 2, slide: 3, attack: 0.3 });
    this.tone(45, 1.6, { vol: 0.3, attack: 0.3 });
  },
  crack() {
    this.noise(0.6, { vol: 0.5, freq: 4000, type: 'highpass' });
    this.tone(1800, 0.35, { vol: 0.07, slide: 0.3 });
  },
  crash() { this.noise(1.2, { vol: 0.7, freq: 220, type: 'lowpass' }); this.tone(40, 1, { vol: 0.5 }); },
  chime() {
    [523, 659, 784, 1046, 1318].forEach((f, i) =>
      this.tone(f, 1.6, { type: 'triangle', vol: 0.07, at: i * 0.18 }));
  },
  // 環境音（森の風／館のうなり）
  setAmb(kind) {
    if (!this.ac || this.ambKind === kind) return;
    this.ambKind = kind;
    const now = this.ac.currentTime;
    if (this.amb) {
      const old = this.amb;
      old.g.gain.setTargetAtTime(0.0001, now, 0.4);
      setTimeout(() => old.nodes.forEach(n => { try { n.stop(); } catch (e) {} }), 2500);
      this.amb = null;
    }
    if (!kind) return;
    const g = this.ac.createGain();
    g.gain.value = 0.0001;
    g.connect(this.master);
    const nodes = [];
    const osc = (f, type, vol) => {
      const o = this.ac.createOscillator(), og = this.ac.createGain();
      o.type = type; o.frequency.value = f; og.gain.value = vol;
      o.connect(og).connect(g); o.start(); nodes.push(o); return o;
    };
    const wind = (freq, vol) => {
      const s = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), wg = this.ac.createGain();
      s.buffer = this.noiseBuf; s.loop = true;
      f.type = 'lowpass'; f.frequency.value = freq; wg.gain.value = vol;
      const lfo = this.ac.createOscillator(), lg = this.ac.createGain();
      lfo.frequency.value = 0.08; lg.gain.value = freq * 0.6;
      lfo.connect(lg).connect(f.frequency); lfo.start();
      s.connect(f).connect(wg).connect(g); s.start();
      nodes.push(s, lfo);
    };
    let vol = 0.5;
    if (kind === 'forest') { wind(500, 0.35); osc(41, 'sine', 0.25); vol = 0.6; }
    if (kind === 'house') { osc(55, 'sine', 0.3); osc(58.3, 'sine', 0.25); osc(164.8, 'triangle', 0.025); wind(180, 0.12); }
    if (kind === 'chase') { osc(49, 'sawtooth', 0.05); osc(51.9, 'sawtooth', 0.05); osc(73.4, 'sine', 0.25); wind(900, 0.12); vol = 0.6; }
    g.gain.setTargetAtTime(vol, now, 0.8);
    this.amb = { g, nodes };
  },
  // オルゴール（タイトル・エンディング）
  box: null,
  musicBox(on) {
    if (!on) { this.box = null; return; }
    if (this.box) return;
    const N = { D5: 587, Ds5: 622, E5: 659, Fs5: 740, G5: 784, A5: 880, B5: 988, C6: 1047, D6: 1175, E6: 1319 };
    const song = ['E5', 'G5', 'B5', 'A5', 'G5', 'Fs5', 'E5', '', 'Ds5', 'Fs5', 'A5', 'G5', 'Fs5', 'E5', 'Ds5', '',
      'E5', 'G5', 'B5', 'E6', 'D6', 'B5', 'C6', 'A5', 'G5', 'E5', 'Fs5', 'Ds5', 'E5', '', '', ''];
    this.box = { song, N, i: 0, next: 0 };
  },
  tickBox() {
    const b = this.box;
    if (!b || !this.ac) return;
    const now = this.ac.currentTime;
    if (b.next < now) b.next = now + 0.05;
    while (b.next < now + 0.3) {
      const n = b.song[b.i % b.song.length];
      if (n) {
        const at = b.next - now;
        this.tone(b.N[n], 1.4, { type: 'triangle', vol: 0.05, at, attack: 0.004 });
        this.tone(b.N[n] * 2, 0.5, { type: 'sine', vol: 0.015, at, attack: 0.004 });
      }
      b.i++; b.next += 0.46;
    }
  },
};

// ---------- ドット絵 ----------
const artCache = new Map();
function art(key, w, h, draw) {
  let c = artCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw(g, (col, x, y, ww = 1, hh = 1) => { if (!col) return; g.fillStyle = col; g.fillRect(x, y, ww, hh); });
    artCache.set(key, c);
  }
  return c;
}

const PAL = {
  riko: { hair: '#5a3626', hairL: '#7f5236', skin: '#f2d0b5', eye: '#24141c', dress: '#3a4872', dressD: '#283258',
    collar: '#f0ebe2', sock: '#e8e2d8', shoe: '#3a2420', ribbon: '#c0303a', cheek: '#e9a69a' },
  shadow: { hair: '#0b0710', hairL: '#140c1a', skin: '#0b0710', eye: '#0b0710', dress: '#0b0710', dressD: '#060409',
    collar: '#0b0710', sock: '#0b0710', shoe: '#060409', ribbon: null, cheek: null, long: true },
  doll: { hair: '#c9a24e', hairL: '#ead07c', skin: '#f6e9e2', eye: '#1a0a14', dress: '#7a2a48', dressD: '#561a32',
    collar: '#f4f0ea', sock: '#f4f0ea', shoe: '#2a1018', ribbon: '#1a1418', cheek: '#eaa2ac' },
  mina: { hair: '#1a1418', hairL: '#2e2630', skin: '#f2e4e0', eye: '#2a1820', dress: '#e6e2ec', dressD: '#c4bccc',
    collar: '#ffffff', sock: '#ffffff', shoe: '#6a5a66', ribbon: '#6d1530', cheek: '#eab0b8', long: true },
};

// 女の子（16x20）。dir = down/up/right（left は反転）、frame = 0 立ち / 1・2 歩き
function girl(palName, dir, frame) {
  const flip = dir === 'left';
  const d = flip ? 'right' : dir;
  return art(`girl-${palName}-${dir}-${frame}`, 16, 20, (g, R) => {
    const P = PAL[palName];
    if (flip) { g.translate(16, 0); g.scale(-1, 1); }
    R('rgba(0,0,0,.4)', 4, 18, 8, 2);
    // 足
    const leg = (x, lift) => { R(P.sock, x, 15, 2, 3 - lift); R(P.shoe, x, 18 - lift, 2, 1); };
    if (d === 'right') {
      if (frame === 0) { leg(6, 0); leg(8, 0); }
      else if (frame === 1) { leg(5, 0); leg(9, 1); }
      else { leg(5, 1); leg(9, 0); }
    } else {
      leg(5, frame === 2 ? 1 : 0); leg(9, frame === 1 ? 1 : 0);
    }
    // 服
    R(P.dress, 5, 10, 6, 2); R(P.dress, 4, 12, 8, 2); R(P.dressD, 3, 14, 10, 1);
    R(P.dressD, 4, 13, 1, 1); R(P.dressD, 11, 13, 1, 1);
    if (d === 'right') {
      R(P.dressD, 7, 11, 2, 2); R(P.skin, 7, 13, 2, 1);
    } else {
      R(P.dress, 3, 11, 2, 2); R(P.dress, 11, 11, 2, 2);
      R(P.skin, 3, 13, 2, 1); R(P.skin, 11, 13, 2, 1);
      if (d === 'down') { R(P.collar, 6, 10, 4, 1); R(P.collar, 7, 11, 2, 1); }
    }
    // 頭
    R(P.hair, 4, 1, 8, 1); R(P.hair, 3, 2, 10, 7);
    if (P.long) { R(P.hair, 3, 9, 10, 4); R(P.hair, 3, 13, 2, 1); R(P.hair, 6, 13, 1, 2); R(P.hair, 9, 13, 2, 1); R(P.hair, 12, 13, 1, 1); }
    if (d === 'down') {
      R(P.skin, 4, 4, 8, 5); R(P.skin, 5, 9, 6, 1);
      R(P.hair, 4, 4, 8, 1); R(P.hair, 4, 5, 1, 1); R(P.hair, 11, 5, 1, 1);
      if (P.long) { R(P.hair, 4, 5, 3, 1); R(P.hair, 9, 5, 2, 1); }
      R(P.eye, 5, 6, 1, 2); R(P.eye, 10, 6, 1, 2);
      R(P.cheek, 5, 8, 1, 1); R(P.cheek, 10, 8, 1, 1);
      R(P.hairL, 5, 2, 4, 1);
      R(P.ribbon, 10, 0, 3, 2); R(P.ribbon, 9, 1, 1, 1);
    } else if (d === 'up') {
      R(P.hair, 3, 2, 10, 8); R(P.hairL, 5, 3, 6, 1); R(P.hairL, 4, 6, 1, 2);
      R(P.ribbon, 10, 0, 3, 2); R(P.ribbon, 9, 1, 1, 1);
    } else {
      R(P.skin, 7, 4, 5, 5); R(P.skin, 8, 9, 3, 1);
      R(P.hair, 7, 4, 5, 1); R(P.hair, 3, 2, 4, 9);
      R(P.eye, 10, 6, 1, 2); R(P.cheek, 10, 8, 1, 1);
      R(P.hairL, 5, 2, 4, 1);
      R(P.ribbon, 3, 1, 3, 2);
    }
  });
}

// 物のドット絵
const ARTS = {
  lantern: [16, 22, (g, R) => {
    R('#1a1418', 7, 8, 2, 13); R('#1a1418', 5, 20, 6, 2);
    R('#2a2228', 5, 2, 6, 7); R('#2a2a30', 6, 3, 4, 5); R('#2a2228', 6, 1, 4, 1); R('#2a2228', 7, 0, 2, 1);
  }],
  lanternLit: [16, 22, (g, R) => {
    R('#1a1418', 7, 8, 2, 13); R('#1a1418', 5, 20, 6, 2);
    R('#3a2a20', 5, 2, 6, 7); R('#ffcf6a', 6, 3, 4, 5); R('#fff4c8', 7, 5, 2, 2);
    R('#3a2a20', 6, 1, 4, 1); R('#3a2a20', 7, 0, 2, 1);
  }],
  sign: [16, 16, (g, R) => {
    R('#2e2216', 7, 8, 2, 8); R('#4a3624', 2, 2, 12, 7); R('#3a2a1a', 2, 8, 12, 1);
    R('#241810', 4, 4, 8, 1); R('#241810', 4, 6, 6, 1);
  }],
  rose: [16, 16, (g, R) => {
    R('#0c1a10', 2, 6, 12, 9); R('#13261a', 3, 4, 10, 4); R('#0c1a10', 1, 9, 14, 5);
    [[3, 5], [8, 4], [10, 9], [4, 10], [7, 8]].forEach(([x, y]) => {
      R('#22040c', x, y, 3, 3); R('#5a0e22', x + 1, y, 1, 1); R('#3a0716', x, y + 1, 1, 1);
    });
  }],
  roseWall: [16, 18, (g, R) => {
    R('#0a140c', 0, 3, 16, 15); R('#10201a', 1, 1, 14, 4);
    for (let i = 0; i < 9; i++) {
      const x = (i * 5 + 1) % 13, y = 2 + (i * 7) % 13;
      R('#1e030a', x, y, 3, 3); R('#6a1028', x + 1, y, 1, 1);
    }
    for (let i = 0; i < 7; i++) R('#3a4a30', (i * 9) % 15, 4 + (i * 5) % 12, 1, 1);
  }],
  table: [16, 16, (g, R) => {
    R('#d8ccbc', 2, 4, 12, 7); R('#b0a594', 2, 10, 12, 2); R('#c8bcaa', 3, 5, 10, 1);
    R('#24180f', 4, 12, 2, 4); R('#24180f', 10, 12, 2, 4);
  }],
  tableNote: [16, 16, (g, R) => {
    R('#d8ccbc', 2, 4, 12, 7); R('#b0a594', 2, 10, 12, 2);
    R('#24180f', 4, 12, 2, 4); R('#24180f', 10, 12, 2, 4);
    R('#f6eedc', 6, 5, 5, 4); R('#8a7a6a', 7, 6, 3, 1); R('#8a7a6a', 7, 8, 2, 1);
  }],
  clock: [16, 30, (g, R) => {
    R('#24160e', 3, 2, 10, 28); R('#3a2416', 4, 3, 8, 26); R('#24160e', 2, 0, 12, 3);
    R('#d6cab0', 5, 5, 6, 6); R('#2a1a10', 7, 6, 1, 3); R('#2a1a10', 8, 8, 2, 1);
    R('#120a06', 6, 14, 4, 10); R('#a8823a', 7, 19, 2, 3); R('#a8823a', 8, 15, 0.5, 4);
  }],
  vase: [16, 16, (g, R) => {
    R('#2e2636', 5, 8, 6, 7); R('#3e3448', 6, 7, 4, 1); R('#241e2a', 5, 14, 6, 1);
    R('#2a3020', 7, 2, 1, 6); R('#2a3020', 9, 3, 1, 5); R('#2a3020', 5, 4, 1, 4);
    R('#24040c', 6, 1, 3, 2); R('#24040c', 9, 2, 2, 2); R('#24040c', 4, 3, 2, 2);
  }],
  painting_land: [16, 16, (g, R) => {
    R('#6a5020', 2, 2, 12, 10); R('#18202c', 3, 3, 10, 8); R('#0e1a12', 3, 8, 10, 3);
    R('#0e1a12', 4, 6, 2, 2); R('#0e1a12', 10, 6, 2, 2); R('#2e2430', 7, 6, 3, 3); R('#8a7a40', 8, 7, 1, 1);
    R('#c8ccd8', 11, 4, 1, 1); R('#8a7040', 6, 13, 4, 1);
  }],
  painting_lady: [16, 16, (g, R) => {
    R('#6a5020', 2, 2, 12, 10); R('#2a2018', 3, 3, 10, 8);
    R('#3a2418', 5, 3, 6, 7); R('#cdb4a2', 6, 4, 4, 4); R('#2a1410', 6, 6, 1, 1); R('#2a1410', 9, 6, 1, 1);
    R('#3a1020', 5, 8, 6, 3); R('#8a7040', 6, 13, 4, 1);
  }],
  painting_hands: [16, 16, (g, R) => {
    R('#4a3a1a', 2, 2, 12, 10); R('#0a0808', 3, 3, 10, 8);
    R('#d8d0c8', 5, 6, 1, 4); R('#d8d0c8', 4, 5, 1, 2); R('#d8d0c8', 9, 4, 1, 5); R('#d8d0c8', 10, 3, 1, 2);
    R('#d8d0c8', 7, 8, 1, 3); R('#a89c94', 11, 6, 1, 3);
    R('#c8b070', 5, 13, 6, 2); R('#3a2a10', 6, 14, 4, 0.5);
  }],
  painting_eyes: [16, 16, (g, R) => {
    R('#6a5020', 2, 2, 12, 10); R('#1a1018', 3, 3, 10, 8);
    [[4, 4], [8, 4], [5, 7], [9, 8], [11, 5], [4, 9]].forEach(([x, y]) => { R('#e8e0d8', x, y, 2, 1); R('#200810', x + 1, y, 1, 1); });
    R('#8a7040', 6, 13, 4, 1);
  }],
  painting_girl: [16, 16, (g, R) => {
    R('#6a5020', 2, 2, 12, 10); R('#201820', 3, 3, 10, 8);
    R('#141014', 5, 3, 6, 7); R('#ece2de', 6, 4, 4, 4); R('#d8d4dc', 5, 8, 6, 3);
    R('#6a6060', 6, 13, 4, 1);
  }],
  painting_scary: [16, 16, (g, R) => {
    R('#4a1010', 2, 2, 12, 10); R('#1a0006', 3, 3, 10, 8);
    R('#d8ccc4', 5, 3, 6, 8); R('#000', 6, 5, 2, 2); R('#000', 9, 5, 1, 2); R('#ff2030', 6, 5, 1, 1);
    R('#000', 7, 8, 2, 3); R('#8a0010', 6, 13, 4, 1);
  }],
  shelf: [16, 16, (g, R) => shelfArt(R, null)],
  shelfR: [16, 16, (g, R) => shelfArt(R, '#b0202e')],
  shelfB: [16, 16, (g, R) => shelfArt(R, '#2a52b0')],
  shelfG: [16, 16, (g, R) => shelfArt(R, '#2a8a44')],
  shelfOpen: [16, 16, (g, R) => { R('#2a1a10', 0, 0, 16, 16); R('#050304', 2, 2, 12, 14); }],
  dollShelf: [16, 16, (g, R) => {
    R('#2a1a10', 0, 0, 16, 16); R('#120a08', 1, 1, 14, 14);
    R('#3a2618', 1, 7, 14, 1); R('#3a2618', 1, 14, 14, 2);
    [2, 6, 10].forEach((x, i) => {
      R('#e8dcd6', x, 3, 3, 3); R('#1a0a10', x, 4, 1, 1); R('#1a0a10', x + 2, 4, 1, 1);
      R(['#c9a24e', '#1a1418', '#7a4a2a'][i], x, 2, 3, 1); R('#5a1a32', x, 6, 3, 1);
      R('#e8dcd6', x + 1, 9, 3, 3); R('#1a0a10', x + 1, 10, 1, 1); R('#1a0a10', x + 3, 10, 1, 1);
      R(['#1a1418', '#c9a24e', '#3a2a1a'][i], x + 1, 8, 3, 1); R('#2a3a5a', x + 1, 12, 3, 2);
    });
  }],
  desk: [16, 18, (g, R) => {
    R('#3a2618', 0, 4, 16, 4); R('#4a3220', 0, 4, 16, 1); R('#2a1a10', 0, 8, 16, 9);
    R('#3a2618', 2, 10, 5, 4); R('#3a2618', 9, 10, 5, 4); R('#a8823a', 4, 12, 1, 1); R('#a8823a', 11, 12, 1, 1);
    R('#e8dcc4', 2, 3, 7, 3); R('#8a7a6a', 3, 4, 4, 0.5);
  }],
  deskKey: [16, 18, (g, R) => {
    R('#3a2618', 0, 4, 16, 4); R('#4a3220', 0, 4, 16, 1); R('#2a1a10', 0, 8, 16, 9);
    R('#3a2618', 2, 10, 5, 4); R('#3a2618', 9, 10, 5, 4);
    R('#e8dcc4', 1, 3, 6, 3); R('#3a2a20', 2, 2, 4, 1);
    R('#c8a040', 9, 5, 4, 1); R('#c8a040', 12, 4, 2, 3); R('#f0d070', 9, 5, 1, 1);
  }],
  chair: [16, 16, (g, R) => {
    R('#2a1a10', 4, 1, 8, 7); R('#4a1a24', 5, 2, 6, 5); R('#2a1a10', 3, 8, 10, 3);
    R('#4a1a24', 4, 8, 8, 2); R('#1a100a', 4, 11, 1, 5); R('#1a100a', 11, 11, 1, 5);
  }],
  pot: [16, 16, (g, R) => {
    R('#1a1618', 2, 6, 12, 8); R('#2e2a2e', 1, 5, 14, 2); R('#3a0e14', 3, 5, 10, 1);
    R('#6a1a22', 5, 4, 2, 1); R('#6a1a22', 9, 4, 1, 1); R('#242024', 3, 8, 2, 4);
    R('#c04010', 4, 14, 2, 2); R('#c04010', 9, 14, 2, 2); R('#f0a020', 5, 15, 1, 1); R('#f0a020', 9, 15, 1, 1);
  }],
  cupboard: [16, 16, (g, R) => {
    R('#3a2416', 1, 0, 14, 16); R('#1a1410', 3, 2, 4, 6); R('#1a1410', 9, 2, 4, 6);
    R('#c8c0b4', 4, 3, 2, 2); R('#c8c0b4', 10, 3, 2, 2); R('#c8c0b4', 4, 6, 2, 1); R('#c8c0b4', 10, 6, 2, 1);
    R('#2e1c10', 3, 10, 4, 5); R('#2e1c10', 9, 10, 4, 5); R('#a8823a', 6, 12, 1, 1); R('#a8823a', 9, 12, 1, 1);
  }],
  jars: [16, 16, (g, R) => {
    R('#2a1a10', 0, 0, 16, 16); R('#120a08', 1, 1, 14, 14); R('#3a2618', 1, 7, 14, 1); R('#3a2618', 1, 14, 14, 2);
    [['#5a6a2a', 2, 3], ['#6a1a20', 6, 2], ['#4a3a5a', 10, 3], ['#7a5a20', 3, 10], ['#3a0a10', 8, 9], ['#5a5a50', 11, 10]]
      .forEach(([c, x, y]) => { R('#8a8a90', x, y - 1, 3, 1); R(c, x, y, 3, 7 - (y % 7) - 1); });
  }],
  sink: [16, 16, (g, R) => {
    R('#3a2616', 0, 8, 16, 8); R('#5a5a62', 2, 6, 12, 4); R('#2a2a30', 3, 7, 10, 2);
    R('#7a7a84', 7, 1, 2, 5); R('#7a7a84', 7, 1, 4, 1); R('#5a1a10', 10, 2, 1, 1);
  }],
  ktable: [16, 16, (g, R) => {
    R('#3a2618', 1, 4, 14, 7); R('#4a3220', 1, 4, 14, 1); R('#2a1a10', 1, 11, 14, 1);
    R('#1a100a', 2, 12, 2, 4); R('#1a100a', 12, 12, 2, 4);
  }],
  ktableKnife: [16, 16, (g, R) => {
    R('#3a2618', 1, 4, 14, 7); R('#4a3220', 1, 4, 14, 1); R('#2a1a10', 1, 11, 14, 1);
    R('#1a100a', 2, 12, 2, 4); R('#1a100a', 12, 12, 2, 4);
    R('#d4d8de', 4, 7, 6, 1); R('#9aa0a8', 4, 8, 5, 0.5); R('#2a1208', 10, 7, 3, 1);
  }],
  bed: [16, 26, (g, R) => {
    R('#2a1a12', 1, 0, 14, 7); R('#3a2618', 2, 1, 12, 5);
    R('#e4dce6', 3, 6, 10, 4); R('#c8c0cc', 3, 9, 10, 1);
    R('#6a2a3a', 1, 10, 14, 14); R('#5a2030', 1, 13, 14, 1); R('#5a2030', 1, 18, 14, 1); R('#7a3a4a', 2, 11, 12, 1);
    R('#2a1a12', 0, 23, 16, 3);
  }],
  toybox: [16, 16, (g, R) => {
    R('#5a3a22', 1, 6, 14, 9); R('#6a4a2a', 0, 4, 16, 3); R('#8a6a3a', 0, 9, 16, 1);
    R('#c8a040', 7, 6, 2, 2);
    R('#b01e30', 2, 4, 1, 11); R('#b01e30', 13, 4, 1, 11); R('#b01e30', 0, 7, 16, 1); R('#b01e30', 4, 5, 8, 1);
    R('#b01e30', 5, 9, 1, 5); R('#b01e30', 10, 8, 1, 6);
  }],
  toyboxOpen: [16, 16, (g, R) => {
    R('#5a3a22', 1, 6, 14, 9); R('#3a2414', 2, 6, 12, 3); R('#6a4a2a', 0, 2, 16, 3); R('#8a6a3a', 0, 9, 16, 1);
    R('#e8dcd6', 4, 6, 3, 2); R('#3a2a6a', 9, 6, 3, 2); R('#b01e30', 3, 13, 4, 1);
  }],
  window: [16, 16, (g, R) => {
    R('#2a1c14', 2, 1, 12, 13); R('#0c1424', 3, 2, 10, 11); R('#16203a', 3, 2, 10, 4);
    R('#2a1c14', 7, 2, 2, 11); R('#2a1c14', 3, 7, 10, 1); R('#c8d0e0', 10, 3, 2, 2);
    R('#3a2a20', 1, 13, 14, 2);
  }],
  fwindow: [16, 16, (g, R) => {
    R('#100810', 3, 3, 10, 10); R('#3a2044', 4, 4, 8, 8); R('#5a3060', 5, 5, 2, 3);
    R('#100810', 7, 4, 2, 8); R('#100810', 4, 7, 8, 1);
  }],
  mirror: [16, 26, (g, R) => {
    R('#6a5020', 3, 0, 10, 25); R('#8a6a2a', 3, 0, 10, 1); R('#9aa4b4', 4, 1, 8, 23);
    R('#b8c2d0', 5, 2, 1, 9); R('#b8c2d0', 6, 3, 1, 3); R('#7a8494', 4, 20, 8, 4); R('#4a3a18', 2, 24, 12, 2);
  }],
  mirrorCrack: [16, 26, (g, R) => {
    R('#6a5020', 3, 0, 10, 25); R('#4a5060', 4, 1, 8, 23);
    R('#d0d8e0', 8, 3, 1, 3); R('#d0d8e0', 7, 6, 1, 3); R('#d0d8e0', 8, 9, 1, 4); R('#d0d8e0', 5, 10, 3, 1);
    R('#d0d8e0', 9, 12, 2, 1); R('#d0d8e0', 7, 14, 1, 5); R('#1a1a24', 6, 16, 3, 3); R('#4a3a18', 2, 24, 12, 2);
  }],
  bear: [16, 16, (g, R) => {
    const b = '#7a5030', d = '#5a3820';
    R(b, 5, 3, 6, 5); R(b, 4, 2, 2, 2); R(b, 10, 2, 2, 2); R(d, 4, 2, 1, 1); R(d, 11, 2, 1, 1);
    R(b, 4, 8, 8, 6); R(b, 3, 9, 1, 3); R(b, 12, 9, 1, 3); R(b, 4, 14, 3, 1); R(b, 9, 14, 3, 1);
    R('#c8a080', 7, 5, 2, 2); R('#1a0a08', 6, 4, 1, 1); R('#e0d0c0', 9, 4, 1, 1); R('#1a0a08', 7, 5, 1, 1);
    R('#a07850', 6, 9, 4, 3); R('#b01e30', 5, 8, 6, 1);
  }],
  paper: [16, 16, (g, R) => {
    R('#d8ccb0', 5, 9, 6, 4); R('#b8a888', 5, 12, 6, 1); R('#8a7a6a', 6, 10, 4, 0.5); R('#8a7a6a', 6, 11, 3, 0.5);
  }],
  rosePot: [16, 16, (g, R) => {
    R('#3a2a2a', 4, 10, 8, 5); R('#4a3636', 3, 9, 10, 2);
    R('#0c1a10', 4, 4, 8, 6); R('#22040c', 5, 3, 3, 3); R('#22040c', 9, 4, 2, 3); R('#5a0e22', 6, 3, 1, 1); R('#5a0e22', 9, 4, 1, 1);
  }],
  bigdoor: [16, 16, (g, R) => {
    R('#1a0e08', 1, 0, 14, 16); R('#3a2414', 2, 1, 12, 15); R('#2a1a0e', 7, 1, 2, 15);
    R('#4a2e1a', 3, 2, 3, 13); R('#4a2e1a', 10, 2, 3, 13); R('#c8a040', 6, 8, 1, 2); R('#c8a040', 9, 8, 1, 2);
  }],
};
function shelfArt(R, hi) {
  R('#2a1a10', 0, 0, 16, 16); R('#120a08', 1, 1, 14, 14);
  R('#3a2618', 1, 5, 14, 1); R('#3a2618', 1, 10, 14, 1); R('#3a2618', 0, 15, 16, 1);
  const cols = ['#4a2a2a', '#2a3a4a', '#3a4a2a', '#4a4030', '#3a2a44', '#2a2a2a'];
  [1, 6, 11].forEach((y, row) => {
    let x = 1;
    let k = row * 3;
    while (x < 15) {
      const w = 1 + ((k * 7) % 3 === 0 ? 1 : 0);
      R(cols[(k * 5 + row) % cols.length], x, y + (k % 2), Math.min(w, 15 - x), 4 - (k % 2));
      x += w; k++;
    }
  });
  if (hi) { R(hi, 7, 6, 2, 4); R('#f0e0c0', 7, 7, 2, 0.5); }
}
const getArt = key => { const a = ARTS[key]; return a ? art(key, a[0], a[1], a[2]) : null; };

// ---------- タイル ----------
const WALK = new Set(['.', ':', '=', ',', 'p', 'd', 'S']);
function drawTile(g, m, x, y) {
  const ch = tileAt(m, x, y);
  const R = (c, xx, yy, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x * T + xx, y * T + yy, w, h); };
  const rnd = k => hash(x, y, k);
  const below = tileAt(m, x, y + 1);
  switch (ch) {
    case '.': {
      R('#38271c', 0, 0, 16, 16);
      for (let r = 0; r < 4; r++) {
        R('#2a1d15', 0, r * 4 + 3, 16, 1);
        const s = (rnd(r) * 16) | 0; R('#2a1d15', s, r * 4, 1, 3);
        if (rnd(r + 9) < 0.4) R('#43301f', (rnd(r + 4) * 14) | 0, r * 4 + 1, 2, 1);
      }
      break;
    }
    case ':': {
      R('#4a1020', 0, 0, 16, 16);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) R('#5c1a2c', i * 4 + 1, j * 4 + 1, 2, 2);
      if (tileAt(m, x - 1, y) !== ':') { R('#7a5a2a', 0, 0, 1, 16); R('#3a0c18', 1, 0, 1, 16); }
      if (tileAt(m, x + 1, y) !== ':') { R('#7a5a2a', 15, 0, 1, 16); R('#3a0c18', 14, 0, 1, 16); }
      if (tileAt(m, x, y - 1) !== ':' && WALK.has(tileAt(m, x, y - 1))) R('#7a5a2a', 0, 0, 16, 1);
      if (!WALK.has(below) || below !== ':' && below !== 'D') { if (below !== ':') R('#7a5a2a', 0, 15, 16, 1); }
      break;
    }
    case '=': {
      R('#2e2c33', 0, 0, 16, 16); R('#232128', 0, 0, 16, 1); R('#232128', 0, 8, 16, 1);
      R('#232128', ((y % 2) * 8), 0, 1, 8); R('#232128', ((y % 2) * 8 + 8) % 16, 8, 1, 8);
      if (rnd(1) < 0.5) R('#38363e', (rnd(2) * 12) | 0, 2 + ((rnd(3) * 10) | 0), 2, 1);
      break;
    }
    case ',': case 'T': case 'W': {
      R('#121e15', 0, 0, 16, 16);
      for (let i = 0; i < 5; i++) R(rnd(i) < 0.5 ? '#1c2e20' : '#203626', (rnd(i + 10) * 15) | 0, (rnd(i + 20) * 14) | 0, 1, 2);
      break;
    }
    case 'p': {
      R('#2c241c', 0, 0, 16, 16);
      for (let i = 0; i < 4; i++) R('#3a3026', (rnd(i) * 14) | 0, (rnd(i + 5) * 14) | 0, 2, 1);
      if (tileAt(m, x - 1, y) !== 'p') R('#1a2418', 0, 0, 1, 16);
      if (tileAt(m, x + 1, y) !== 'p') R('#1a2418', 15, 0, 1, 16);
      break;
    }
    case '#': {
      if (WALK.has(below) || below === 'D') {
        // 壁の正面（壁紙＋腰板）
        R('#3b2230', 0, 0, 16, 16);
        for (let i = 0; i < 4; i++) R('#311a27', i * 4 + 1, 0, 1, 11);
        R('#1c1016', 0, 0, 16, 2); R('#4a2c3a', 0, 2, 16, 1);
        R('#2a1a14', 0, 11, 16, 5); R('#4a3020', 0, 11, 16, 1); R('#1a100c', 0, 15, 16, 1);
        R('#22150f', 0, 12, 1, 3);
      } else {
        R('#120a10', 0, 0, 16, 16);
        R('#1a1018', 1, 1, 14, 14);
      }
      break;
    }
    case 'D': {
      R('#3b2230', 0, 0, 16, 16); R('#1c1016', 0, 0, 16, 2);
      break;
    }
    case 'd': {
      if (WALK.has(below)) {
        // 正面の出入り口
        R('#0a0608', 0, 0, 16, 16); R('#4a3020', 0, 0, 2, 16); R('#4a3020', 14, 0, 2, 16); R('#4a3020', 0, 0, 16, 2);
        R('#140c0e', 2, 12, 12, 4);
      } else {
        R('#1a1012', 0, 0, 16, 16); R('#0c0809', 2, 2, 12, 12);
      }
      if (m.outdoor) {
        R('#1a0e08', 1, 0, 14, 16); R('#3a2414', 2, 1, 12, 15); R('#2a1a0e', 7, 1, 2, 15);
        R('#c8a040', 6, 9, 1, 2); R('#c8a040', 9, 9, 1, 2); R('#100810', 3, 0, 10, 1);
      }
      break;
    }
    case 'S': {
      R('#120a10', 0, 0, 16, 16);
      for (let i = 0; i < 5; i++) { R('#4a3426', 2, 15 - i * 3 - 2, 12, 2); R('#2a1c14', 2, 15 - i * 3, 12, 1); }
      R('#2a1a10', 0, 0, 2, 16); R('#2a1a10', 14, 0, 2, 16);
      break;
    }
    default: R('#000', 0, 0, 16, 16);
  }
}
function drawTrees(g, m) {
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const ch = tileAt(m, x, y);
    if (ch === 'W') {
      const R = (c, xx, yy, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x * T + xx, y * T + yy, w, h); };
      R('#1e1620', 0, 0, 16, 16);
      for (let r = 0; r < 4; r++) {
        R('#140e16', 0, r * 4 + 3, 16, 1);
        R('#140e16', (r % 2) * 8 + 3, r * 4, 1, 3); R('#140e16', (r % 2) * 8 + 11, r * 4, 1, 3);
      }
      if (y === 0) R('#0c080e', 0, 0, 16, 3);
    }
  }
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (tileAt(m, x, y) !== 'T') continue;
    const cx = x * T + 8 + (hash(x, y, 1) - 0.5) * 6, cy = y * T + 6 + (hash(x, y, 2) - 0.5) * 6;
    g.fillStyle = '#0a1209'; g.fillRect(cx - 2, cy + 4, 4, 8);
    [[0, 0, 11, '#08100a'], [-3, -2, 7, '#0e1a10'], [3, 1, 6, '#0e1a10'], [-1, -4, 5, '#152418']].forEach(([dx, dy, r, c]) => {
      g.fillStyle = c; g.beginPath(); g.arc(cx + dx, cy + dy, r, 0, Math.PI * 2); g.fill();
    });
  }
}
function tileAt(m, x, y) {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return ' ';
  return m.rows[y][x];
}

// ---------- 状態 ----------
let G = null;              // ゲームの状態（保存されるもの： map, p, F）
let mode = 'title';        // title / play / dead / ending
let busy = false;          // イベント中（歩けない）
let paused = false;        // メニューを開いている
let M = null;              // 追いかけてくるもの
let shakeT = 0;
let now = 0;
const flags = () => (G ? G.F.f : {});
const has = id => !!G && G.F.items.includes(id);
const hasPage = n => !!G && G.F.pages.includes(n);

function newState() {
  return { map: 'forest', p: { x: 5, y: 13, dir: 'up' }, F: { items: [], pages: [], f: {}, lit: [] } };
}

// ---------- アイテム・日記・死に方 ----------
const ITEMS = {
  knife: { name: 'ナイフ', desc: 'よく研がれた小さなナイフ。台所で見つけた。' },
  bear: { name: 'くまのぬいぐるみ', desc: 'つぎはぎだらけのくま。片目のボタンがとれている。' },
  smallKey: { name: '小さな鍵', desc: 'おもちゃ箱に入っていた。黒い薔薇の飾りがついている。' },
  frontKey: { name: '玄関の鍵', desc: '重たい鉄の鍵。これで外に出られる……はず。' },
};
const PAGES = {
  1: 'きょうも、まどから森を見ていた。\nおそとに出ると、おねつが上がるから\nだめなんだって。\nだれか、あそびにきてくれたらいいのに。',
  2: '森のおくの魔女さんに、おねがいをした。\n「ずっと、ひとりにならないように」って。\n魔女さんは、黒い薔薇をくれた。',
  3: '薔薇が館をかこんでから、\nおともだちが来るようになった。\nでも、みんな「かえりたい」ってなく。\nだから、おにんぎょうにしてあげた。\nもう、どこにもいかないように。',
  4: 'ほんとうは、わかってるの。\nわたしは、もう、ずっと前に……\n\nだれか、わたしの名前をよんで。\nそうしたら、きっと、おわりにできる。',
};
const DEATHS = [
  ['rose', '薔薇の抱擁', '森の薔薇にさわる'],
  ['painting', '絵の中へ', 'さわってはいけない絵'],
  ['pot', '今夜の献立', '台所の大きな鍋'],
  ['shelf', '知識の重み', '書斎の本棚'],
  ['doll', 'あたらしいおにんぎょう', '人形のさそい'],
  ['thread', 'からまる糸', 'おもちゃ箱の糸'],
  ['window', 'のぞくもの', '子ども部屋の窓'],
  ['mirror', '入れかわり', '魔女の鏡'],
  ['caught', 'つかまえた', '追いかけっこ'],
];
const ENDINGS = [
  ['normal', 'NORMAL END『またきてね』'],
  ['true', 'TRUE END『朝がきた』'],
];

// ---------- マップ ----------
const MAPS = {
  forest: {
    name: '森の小道', amb: 'forest', dark: 0.74, light: 58, outdoor: true,
    rows: [
      'TWWWWWWWWWT',
      'TWWWWWWWWWT',
      'TWWWWdWWWWT',
      'T,,,,p,,,,T',
      'TT,,,p,,,TT',
      'TT,,,p,,,TT',
      'TTT,,p,,TTT',
      'TTT,,p,,TTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
      'TTTT,p,TTTT',
    ],
    warps: [{ x: 5, y: 2, to: 'hall', tx: 6, ty: 9, dir: 'up', door: true }],
    lights: [{ x: 2.5, y: 1.5, r: 22, c: 'purple' }, { x: 8.5, y: 1.5, r: 22, c: 'purple' }],
    objs: [
      { x: 2, y: 1, art: 'fwindow', act: async () => { await say('館の窓。うす紫の明かりがもれている。'); await say('……カーテンの向こうで、なにかが動いた気がした。'); } },
      { x: 8, y: 1, art: 'fwindow', act: async () => { await say('窓の奥は、うす暗くてよく見えない。'); } },
      { x: 6, y: 9, art: 'sign', solid: true, act: async () => { await say('古い立て札だ。\n『くろばらの館　この先』\n……かすれた文字で、そう書いてある。'); } },
      ...[[2, 3], [8, 3], [3, 5], [7, 6], [4, 7]].map(([x, y]) => ({
        x, y, art: 'rose', solid: true,
        act: async () => { await say('黒い薔薇が咲いている。\nいいにおい……なのに、少しだけ鉄のにおいがする。'); },
      })),
      ...[4, 5, 6].map(x => ({
        x, y: 14, art: 'roseWall', solid: true, when: () => flags().roses,
        act: async () => {
          await say('黒い薔薇が、びっしりと道をふさいでいる。');
          const c = await choose('むしってみる？', ['むしる', 'やめておく']);
          if (c !== 0) return say('……やめておこう。とげが鋭い。');
          await say('薔薇のつるに、手をのばした。');
          shake(); Snd.rustle();
          await say('つるが、しゅるりと手首に巻きついた。');
          await say('ひっぱっても、ひっぱっても、ほどけない。\nとげが、どんどん食いこんで――');
          await die('rose');
        },
      })),
    ],
    steps: [{
      test: (x, y) => y <= 10, when: () => !flags().roses,
      act: async () => {
        flags().roses = true;
        Snd.rustle(); shake();
        await say('ザザザ……ッ');
        G.p.dir = 'down';
        await sleep(300);
        await say('……振りかえると、来た道が\n黒い薔薇でふさがれていた。');
        await say('もう、前に進むしかない。');
      },
    }],
  },

  hall: {
    name: '玄関ホール', amb: 'house', dark: 0.87, light: 50,
    rows: [
      '#############',
      '######S######',
      '#.....:.....#',
      '#.....:.....#',
      '#.....:.....#',
      '#.....:.....#',
      'd.....:.....d',
      '#.....:.....#',
      '#.....:.....#',
      '#.....:.....#',
      '######D######',
    ],
    warps: [
      { x: 0, y: 6, to: 'library', tx: 9, ty: 6, dir: 'left', door: true },
      { x: 12, y: 6, to: 'corridor', tx: 1, ty: 3, dir: 'right', door: true },
      { x: 6, y: 1, to: 'upstairs', tx: 2, ty: 9, dir: 'right' },
    ],
    enter: async () => {
      if (flags().hallIn) return;
      flags().hallIn = true;
      await sleep(300);
      Snd.slam(); shake();
      await say('バタン！');
      await say('……うしろで、扉が閉まった。\nいくら押しても、びくともしない。');
      await say('中は暗くて、ひんやりしている。\nだれか、いませんか……？');
    },
    objs: [
      { x: 6, y: 10, art: 'bigdoor', solid: true, bump: () => has('frontKey'), act: frontDoor },
      { x: 3, y: 1, art: 'painting_lady', act: async () => { await say('上品そうな女の人の絵。\n……目が、ちょっとだけ動いた気がする。'); } },
      { x: 9, y: 1, art: 'painting_land', act: async () => { await say('黒い森の絵。\nまんなかに、この館が小さく描かれている。'); } },
      { x: 1, y: 2, art: 'clock', solid: true, act: async () => { await say('大きな柱時計。\n針は 3時33分 で止まっている。'); } },
      { x: 9, y: 4, art: 'tableNote', solid: true, act: async () => {
        await say('テーブルの上に、メモがある。');
        await paper('メモ', 'ようこそ、あたらしい　おともだち。\n\nずっと　ずっと　あそぼうね。');
      } },
      { x: 2, y: 8, art: 'vase', solid: true, act: async () => { await say('枯れた薔薇がさしてある花びん。\n花びらが、黒くちぢれている。'); } },
      { x: 10, y: 9, art: 'lantern', lantern: 'hall', solid: true, act: () => lantern('hall') },
      { x: 6, y: 2, art: 'doll', solid: true, when: () => !flags().dollMoved, act: dollTalk },
      { x: 5, y: 2, art: 'doll', solid: true, when: () => flags().dollMoved, act: async () => {
        Snd.giggle();
        await say('……くすくす。', 'にんぎょう');
        await say('（人形はくまを抱いて、じっとこちらを見ている）');
      } },
    ],
  },

  library: {
    name: '書斎', amb: 'house', dark: 0.87, light: 50,
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
    warps: [
      { x: 10, y: 6, to: 'hall', tx: 1, ty: 6, dir: 'right', door: true },
      { x: 6, y: 1, to: 'secret', tx: 3, ty: 5, dir: 'up', when: () => flags().shelfOpen },
    ],
    objs: [
      ...[1, 3, 4, 7, 9].map((x, i) => ({
        x, y: 1, art: 'shelf', act: async () => {
          await say([
            'むずかしそうな本ばかりだ。',
            '『黒薔薇の育て方』\n……ページが、ぜんぶ黒くぬりつぶされている。',
            '『魔女との契約について』\n読めない文字で書かれている。',
            '子ども向けの絵本だ。\n『ひとりぼっちの　おひめさま』',
            'ほこりをかぶった本が、ぎっしり並んでいる。',
          ][i]);
        },
      })),
      { x: 2, y: 1, art: 'shelfR', act: () => pushBook('r', '赤い') },
      { x: 5, y: 1, art: 'shelfB', act: () => pushBook('b', '青い') },
      { x: 8, y: 1, art: 'shelfG', act: () => pushBook('g', '緑の') },
      { x: 6, y: 1, art: () => flags().shelfOpen ? 'shelfOpen' : 'shelf', when: () => true,
        act: async () => { if (!flags().shelfOpen) await say('本棚だ。ほかの本棚より、少しだけ手前に出ている。'); } },
      { x: 5, y: 4, art: 'desk', solid: true, act: async () => {
        await say('机の上に、古いメモがある。');
        await paper('古いメモ', 'ゆうやけが　しずんで\nよるが　おとずれ\nさいごに　もりが　めをさます');
      } },
      { x: 8, y: 7, art: 'chair', solid: true, act: async () => { await say('ひじかけ椅子。\nまだ、少しだけあたたかい。'); } },
      { x: 2, y: 7, art: 'paper', glint: true, when: () => !hasPage(1), act: () => getPage(1) },
    ],
  },

  secret: {
    name: '隠し部屋', amb: 'house', dark: 0.89, light: 46,
    rows: [
      '#######',
      '#######',
      '#.....#',
      '#.....#',
      '#.....#',
      '#.....#',
      '###d###',
    ],
    warps: [{ x: 3, y: 6, to: 'library', tx: 6, ty: 2, dir: 'down' }],
    enter: async () => {
      if (flags().secretIn) return;
      flags().secretIn = true;
      await say('せまい部屋に、人形がぎっしり並んでいる。');
    },
    objs: [
      ...[1, 2, 4, 5].map(x => ({ x, y: 1, art: 'dollShelf', act: async () => {
        await say('人形がならんでいる。\n……みんな、こっちを見ている。');
        if (x === 4) await say('よく見ると、どの人形も\nちがう服を着た「女の子」だ。');
      } })),
      { x: 3, y: 2, art: 'bear', solid: true, when: () => !flags().gotBear, act: async () => {
        flags().gotBear = true;
        await getItem('bear');
      } },
      { x: 5, y: 3, art: 'paper', glint: true, when: () => !hasPage(2), act: () => getPage(2) },
    ],
  },

  corridor: {
    name: '東の廊下', amb: 'house', dark: 0.88, light: 50,
    rows: [
      '####################',
      '##################d#',
      '#..................#',
      'd::::::::::::::::::#',
      '#..................#',
      '####################',
    ],
    warps: [
      { x: 0, y: 3, to: 'hall', tx: 11, ty: 6, dir: 'left', door: true },
      { x: 18, y: 1, to: 'kitchen', tx: 5, ty: 7, dir: 'up', door: true },
    ],
    objs: [
      { x: 3, y: 1, art: () => flags().scaring ? 'painting_scary' : 'painting_lady', act: async () => { await say('女の人の絵。\nこっちを見て、ほほえんでいる。'); } },
      { x: 6, y: 1, art: () => flags().scaring ? 'painting_scary' : 'painting_land', act: async () => { await say('夜の森の絵。\n木のかげに、白いものが描かれている。'); } },
      { x: 9, y: 1, art: () => flags().scaring ? 'painting_scary' : 'painting_hands', act: async () => {
        await say('まっ黒な絵。\n金のプレートに『さわらないで』と彫ってある。');
        const c = await choose('さわってみる？', ['さわる', 'やめておく']);
        if (c !== 0) return say('……やめておこう。');
        await say('そっと、絵にふれてみた。');
        await scare();
        await say('絵の中から、白い手が何本も伸びてきて――');
        await die('painting');
      } },
      { x: 12, y: 1, art: () => flags().scaring ? 'painting_scary' : 'painting_eyes', act: async () => { await say('たくさんの目が描かれた絵。\n目をそらしても、視線を感じる。'); } },
      { x: 15, y: 1, art: () => flags().scaring ? 'painting_scary' : 'painting_girl', act: async () => {
        await say('白い服の、女の子の絵。\n名前のプレートは、けずりとられている。');
      } },
      { x: 17, y: 4, art: 'vase', solid: true, act: async () => { await say('花びんに、黒い薔薇が一輪だけさしてある。'); } },
    ],
    steps: [{
      test: x => x === 10, when: () => !flags().corrScare,
      act: async () => {
        flags().corrScare = true;
        flags().scaring = true;
        Snd.scare(); shake(); vibrate([60, 30, 90]);
        await sleep(900);
        flags().scaring = false;
        await sleep(300);
        await say('……！？\nいま、絵が、ぜんぶ……');
        await say('……気のせい、だよね。');
      },
    }],
  },

  kitchen: {
    name: '台所', amb: 'house', dark: 0.86, light: 50,
    rows: [
      '###########',
      '###########',
      '#=========#',
      '#=========#',
      '#=========#',
      '#=========#',
      '#=========#',
      '#=========#',
      '#####d#####',
    ],
    warps: [{ x: 5, y: 8, to: 'corridor', tx: 18, ty: 2, dir: 'down', door: true }],
    lights: [{ x: 5.5, y: 4.9, r: 20, c: 'fire' }],
    objs: [
      { x: 2, y: 1, art: 'cupboard', act: async () => {
        await say('食器棚。お皿がきちんと並んでいる。');
        await say('一枚だけ、名前が彫ってあるお皿がある。\n\n『ミナ』');
        if (!hasPage(3)) { await say('お皿のうしろに、紙がはさまっている。'); await getPage(3); }
      } },
      { x: 4, y: 1, art: 'jars', act: async () => { await say('びんづめが並んでいる。\n……中身は、見ないほうがいい気がする。'); } },
      { x: 8, y: 1, art: 'sink', act: async () => { await say('流し台。蛇口をひねると、赤い水が――\n……いや、さびているだけだ。'); } },
      { x: 5, y: 4, art: 'pot', solid: true, act: async () => {
        await say('大きな鍋で、なにかがぐつぐつ煮えている。\nだれが、火をつけたんだろう。');
        const c = await choose('中をのぞいてみる？', ['のぞく', 'やめておく']);
        if (c !== 0) return say('……やめておこう。いやなにおいがする。');
        await say('鍋をのぞきこんだ。');
        await scare();
        await say('スープの中から、無数の手が――');
        await say('リコは、鍋の中へ引きずりこまれた。');
        await die('pot');
      } },
      { x: 8, y: 5, art: () => has('knife') || flags().gotKnife ? 'ktable' : 'ktableKnife', solid: true, act: async () => {
        if (flags().gotKnife) return say('テーブルの上には、もうなにもない。');
        await say('テーブルの上に、よく研がれたナイフがある。');
        flags().gotKnife = true;
        await getItem('knife');
        await sleep(300);
        Snd.knock();
        await say('……コン、コン、コン。');
        await say('どこかで、ノックの音がした。');
      } },
      { x: 1, y: 7, art: 'lantern', lantern: 'kitchen', solid: true, act: () => lantern('kitchen') },
    ],
  },

  upstairs: {
    name: '二階', amb: 'house', dark: 0.89, light: 48,
    rows: [
      '#############',
      '#######D#####',
      '#.....#.....#',
      '#.....#.....#',
      '#.....#.....#',
      '#.....#.....#',
      '###.###.....#',
      '#...........#',
      '#...........#',
      '#S..........#',
      '#############',
    ],
    warps: [{ x: 1, y: 9, to: 'hall', tx: 6, ty: 2, dir: 'down' }],
    lights: [{ x: 10.5, y: 1.5, r: 18, c: 'moon' }],
    enter: async () => {
      if (flags().upIn) return;
      flags().upIn = true;
      await say('二階は、ひどく静かだ。\n自分の足音が、やけに大きく聞こえる。');
    },
    objs: [
      { x: 7, y: 1, art: 'bigdoor', solid: true, bump: () => has('smallKey'), act: witchDoor },
      { x: 10, y: 1, art: 'window', act: async () => { await say('窓の外は、まっ暗な森だ。\n月が、黒い薔薇を照らしている。'); } },
      { x: 3, y: 1, art: 'window', act: async () => {
        await say('子ども部屋の窓。\nガラスが、内側からくもっている。');
        const c = await choose('外をのぞいてみる？', ['のぞく', 'やめておく']);
        if (c !== 0) return say('……やめておこう。');
        await say('窓に顔をよせて、外をのぞいた。');
        await scare(true);
        await say('逆さまの顔が、こちらをのぞいていた。');
        await die('window');
      } },
      { x: 1, y: 2, art: 'bed', solid: true, act: async () => {
        await say('小さなベッド。\nシーツに、だれかが寝ていたあとがある。');
        if (!hasPage(4)) { await say('まくらの下に、紙がある。'); await getPage(4); }
      } },
      { x: 4, y: 2, art: () => flags().boxOpen ? 'toyboxOpen' : 'toybox', solid: true, act: toyBox },
      { x: 11, y: 2, art: 'vase', solid: true, act: async () => { await say('花びんの薔薇から、しずくが落ちた。\n……赤い。'); } },
      { x: 11, y: 8, art: 'lantern', lantern: 'up', solid: true, act: () => lantern('up') },
    ],
  },

  witch: {
    name: '魔女の部屋', amb: 'house', dark: 0.88, light: 50,
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
    warps: [{ x: 4, y: 8, to: 'upstairs', tx: 7, ty: 2, dir: 'down' }],
    lights: [{ x: 4.5, y: 1.3, r: 16, c: 'moon' }],
    enter: async () => {
      if (M && M.phase === 1) {
        M = null;
        Snd.slam(); shake();
        await say('バタン！');
        await sleep(400);
        Snd.knock();
        await say('ドン！　ドン！　ドン！');
        await sleep(600);
        Snd.knock();
        await sleep(1400);
        await say('…………');
        await say('……音が、やんだ。');
        Snd.setAmb('house');
        flags().chase1Done = true;
      }
    },
    objs: [
      { x: 4, y: 1, art: () => flags().mirrorBroken ? 'mirrorCrack' : 'mirror', act: mirror },
      { x: 1, y: 1, art: 'shelf', act: async () => { await say('魔法の本がならんでいる。\n背表紙の文字は、どれも読めない。'); } },
      { x: 2, y: 1, art: 'shelf', act: async () => { await say('『名前と魂について』\n……ひらいたページに、しおりがはさまっている。\n「名を呼ばれぬ魂は、かたちを失う」'); } },
      { x: 6, y: 3, art: () => has('frontKey') ? 'desk' : 'deskKey', solid: true, act: witchDesk },
      { x: 1, y: 4, art: 'rosePot', solid: true, act: async () => { await say('鉢植えの黒い薔薇。\nこの館の薔薇は、ぜんぶここから広がったみたいだ。'); } },
      { x: 7, y: 7, art: 'lantern', lantern: 'witch', solid: true, act: () => lantern('witch') },
    ],
  },
};
for (const [id, m] of Object.entries(MAPS)) {
  m.id = id; m.h = m.rows.length; m.w = m.rows[0].length;
  m.rows.forEach((r, i) => { if (r.length !== m.w) console.warn('row length', id, i); });
  m.objs = m.objs || []; m.warps = m.warps || []; m.steps = m.steps || []; m.lights = m.lights || [];
}

// ---------- イベント ----------
async function dollTalk() {
  if (!has('bear')) {
    Snd.giggle();
    await say('……ねえ。', 'にんぎょう');
    await say('わたしの　くまさん、しらない？', 'にんぎょう');
    await say('くまさんが　いないと、\nここ、とおしてあげない。', 'にんぎょう');
    return;
  }
  await say('あっ！　くまさん！', 'にんぎょう');
  G.F.items = G.F.items.filter(i => i !== 'bear');
  await say('（くまのぬいぐるみを わたした）');
  await say('ありがとう。……ねえ、おねえちゃん。', 'にんぎょう');
  const c = await choose('いっしょに　あそぶ？', ['あそぶ', 'あそばない']);
  if (c === 0) {
    await say('わあい！', 'にんぎょう');
    await say('じゃあ、ずっと、ずっと、いっしょだよ。', 'にんぎょう');
    await say('人形の冷たい手が、リコの手をにぎった。');
    await say('指先から、だんだん、かたく、\nつめたく――');
    await die('doll');
  }
  await say('……そっか。', 'にんぎょう');
  await say('じゃあ、また「あとで」ね。', 'にんぎょう');
  Snd.door();
  flags().dollMoved = true;
  await say('人形は、すっと横によけた。\n階段が、上へとつづいている。');
}

async function pushBook(c, label) {
  if (flags().shelfOpen) return say(`${label}背表紙の本。もう押しこまれている。`);
  await say(`${label}背表紙の本がある。\n少しだけ、ほかの本より出ている。`);
  const k = await choose('押してみる？', ['押す', 'やめておく']);
  if (k !== 0) return;
  Snd.click();
  const seq = flags().seq = (flags().seq || '') + c;
  if (seq.length < 3) return say('カチッ……');
  flags().seq = '';
  if (seq === 'rbg') {
    Snd.door(); shake();
    flags().shelfOpen = true;
    setTile('library', 6, 1, 'd');
    await say('ゴゴゴゴ……');
    await say('本棚がひとつ、横にずれた。\n奥に、せまい通路がある。');
    return;
  }
  flags().wrong = (flags().wrong || 0) + 1;
  if (flags().wrong === 1) { Snd.crash(); return say('ガタン！\n押した本が、ぜんぶもとにもどった。'); }
  if (flags().wrong === 2) { Snd.crash(); shake(); return say('ガタガタッ！\n本棚が、ぐらりとゆれた……\nつぎにまちがえたら、あぶないかもしれない。'); }
  Snd.crash(); shake();
  await say('ギギギギ……');
  await say('本棚が、こっちに倒れてくる――！');
  await die('shelf');
}

async function toyBox() {
  if (flags().boxOpen) return say('からっぽのおもちゃ箱。');
  await say('おもちゃ箱。\n赤い糸が、ぐるぐるに巻きついている。');
  if (has('knife')) {
    await say('ナイフで、糸を切った。');
    flags().boxOpen = true;
    Snd.click();
    await say('中には、古いおもちゃと……');
    await getItem('smallKey');
    await sleep(500);
    Snd.giggle();
    await say('……くすくす。');
    await say('うしろで、だれかが笑った。');
    startChase(1, 'upstairs', 2, 2, 1300, 0.28);
    return;
  }
  const c = await choose('糸をひっぱってみる？', ['ひっぱる', 'やめておく']);
  if (c !== 0) return say('……なにか、切るものがあればいいのに。');
  await say('糸を思いきりひっぱった。');
  await say('すると糸は、するすると腕をのぼって……');
  Snd.rustle();
  await say('首に――');
  await die('thread');
}

async function witchDoor() {
  if (M && M.phase === 1) { Snd.door(); await warp('witch', 4, 7, 'up'); return; }
  if (!has('smallKey') && !flags().chase1Done) {
    return say('大きな扉。鍵がかかっている。\n小さな鍵穴に、薔薇のもようが彫ってある。');
  }
  Snd.door();
  await warp('witch', 4, 7, 'up');
}

async function mirror() {
  if (flags().mirrorBroken) return say('鏡は、こなごなに割れている。');
  if (G.F.pages.length === 4) {
    await say('鏡の中に、白い服の女の子が映っている。\nうつむいて、泣いているみたいだ。');
    const c = await choose('どうする？', ['名前をよぶ', 'さわる', 'やめる']);
    if (c === 0) return trueEnd();
    if (c === 2) return;
  } else {
    await say('大きな鏡。リコの顔が映っている。\n……ひどい顔色だ。');
    const c = await choose('鏡にさわってみる？', ['さわる', 'やめておく']);
    if (c !== 0) return;
  }
  await say('鏡にふれた。');
  await say('鏡の中のリコが、にやりと笑った。');
  await scare();
  await say('……手を、つかまれた。');
  await die('mirror');
}

async function witchDesk() {
  if (has('frontKey')) return say('机の上には、魔女の手記だけが残っている。');
  await say('机の上に、手記がある。');
  await paper('魔女の手記', 'あの子の願いは叶えた。\n館は、あの子を手放さない。\nあの子が自分の名を思い出すまで。\n\n名を呼ばれれば、願いはとける。');
  await say('手記のよこに、大きな鉄の鍵がある。');
  const c = await choose('鍵を取る？', ['取る', 'やめておく']);
  if (c !== 0) return;
  await getItem('frontKey');
  await sleep(400);
  Snd.crack(); shake();
  flags().mirrorBroken = true;
  await say('パキン――');
  await say('鏡が、割れた。');
  await say('割れ目の奥から、なにかが這い出てくる！');
  await say('……逃げなきゃ！');
  startChase(2, 'witch', 4, 2, 700, 0.235);
}

async function frontDoor() {
  if (!has('frontKey')) return say('玄関の扉。鍵がかかっていて、びくともしない。');
  M = null;
  Snd.door();
  await ending('normal');
}

async function lantern(id) {
  if (M) return say('いまは、それどころじゃない！');
  if (!G.F.lit.includes(id)) G.F.lit.push(id);
  Snd.save();
  writeSave();
  await say('ランプに火をともした。\n……少しだけ、心が落ちつく。\n\n（ここまでを記録しました）');
}

async function getItem(id) {
  if (!G.F.items.includes(id)) G.F.items.push(id);
  Snd.pick();
  await say(`「${ITEMS[id].name}」を手に入れた。`);
}
async function getPage(n) {
  if (!G.F.pages.includes(n)) G.F.pages.push(n);
  Snd.pick();
  await say(`日記の切れはしを見つけた。（${G.F.pages.length}/4）`);
  await paper(`日記の切れはし ${'①②③④'[n - 1]}`, PAGES[n]);
}

// ---------- 追いかけっこ ----------
function startChase(phase, map, x, y, delay, speed) {
  M = { phase, map, x, y, tx: x, ty: y, t: 0, moving: false, dir: 'down', speed, spawnAt: now + delay / 1000, beat: 0, frame: 0 };
  Snd.setAmb('chase');
}
function bfs(m, sx, sy, gx, gy) {
  if (sx === gx && sy === gy) return null;
  const key = (x, y) => y * m.w + x;
  const prev = new Map([[key(sx, sy), -1]]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of Object.values(DIRS)) {
      const nx = x + d[0], ny = y + d[1];
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      if (!(nx === gx && ny === gy) && !passable(m, nx, ny)) continue;
      prev.set(k, key(x, y));
      if (nx === gx && ny === gy) {
        let c = k, p = prev.get(c);
        while (p !== key(sx, sy)) { c = p; p = prev.get(c); }
        return [c % m.w, (c / m.w) | 0];
      }
      q.push([nx, ny]);
    }
  }
  return null;
}
function updateChase(dt) {
  if (!M || busy || paused || mode !== 'play') return;
  if (M.map !== G.map) return;
  if (now < M.spawnAt) return;
  if (!M.shown) { M.shown = true; Snd.scare(); vibrate(80); shake(); }
  const m = MAPS[G.map];
  if (M.moving) {
    M.t += dt / M.speed;
    if (M.t >= 1) { M.moving = false; M.x = M.tx; M.y = M.ty; M.t = 0; }
  }
  if (!M.moving) {
    const p = G.p;
    const gx = p.moving ? p.tx : p.x, gy = p.moving ? p.ty : p.y;
    const nxt = bfs(m, M.x, M.y, gx, gy);
    if (nxt) {
      const [nx, ny] = nxt;
      M.dir = nx > M.x ? 'right' : nx < M.x ? 'left' : ny > M.y ? 'down' : 'up';
      M.tx = nx; M.ty = ny; M.moving = true; M.t = 0;
    }
  }
  M.frame += dt;
  // 心臓の音
  const p = pos(G.p), mp = monsterPos();
  const dist = Math.hypot(p.x - mp.x, p.y - mp.y);
  M.beat -= dt;
  if (M.beat <= 0) { Snd.thump(dist < 48 ? 0.7 : 0.45); M.beat = dist < 48 ? 0.42 : dist < 96 ? 0.6 : 0.85; }
  if (dist < 11) caught();
}
function monsterPos() {
  const t = M.moving ? M.t : 0;
  return { x: (M.x + (M.tx - M.x) * t) * T, y: (M.y + (M.ty - M.y) * t) * T };
}
function caught() {
  M = null;
  G.p.moving = false;
  run(async () => {
    await scare();
    await die('caught');
  });
}

// ---------- 移動 ----------
function objsOf(m) { return m.objs.filter(o => !o.when || o.when()); }
function objAt(m, x, y) { return objsOf(m).find(o => o.x === x && o.y === y); }
function passable(m, x, y) {
  if (!WALK.has(tileAt(m, x, y))) return false;
  const o = objAt(m, x, y);
  return !(o && o.solid);
}
function pos(p) {
  const t = p.moving ? p.t : 0;
  return { x: (p.x + (p.tx - p.x) * t) * T, y: (p.y + (p.ty - p.y) * t) * T };
}
let bumpCool = 0;
function updatePlayer(dt) {
  const p = G.p, m = MAPS[G.map];
  if (p.moving) {
    p.t += dt / STEP;
    p.anim += dt;
    if (p.t >= 1) {
      const over = p.t - 1;
      p.moving = false; p.x = p.tx; p.y = p.ty; p.t = 0;
      if (arrive()) return;
      if (input.dir && canMove()) tryMove(input.dir, over);
    }
  } else if (input.dir && canMove()) {
    tryMove(input.dir, 0);
  }
  if (!p.moving) p.anim = 0;
  bumpCool -= dt;
  void m;
}
function canMove() { return mode === 'play' && !busy && !paused && !Msg.open; }
function tryMove(dir, over) {
  const p = G.p, m = MAPS[G.map];
  p.dir = dir;
  const [dx, dy] = DIRS[dir];
  const nx = p.x + dx, ny = p.y + dy;
  if (passable(m, nx, ny)) {
    p.tx = nx; p.ty = ny; p.moving = true; p.t = over;
    Snd.step(m.outdoor);
  } else {
    const o = objAt(m, nx, ny);
    if (o && o.bump && o.bump() && bumpCool <= 0) { bumpCool = 0.5; run(o.act); }
  }
}
function arrive() {
  const p = G.p, m = MAPS[G.map];
  const w = m.warps.find(w => w.x === p.x && w.y === p.y && (!w.when || w.when()));
  if (w) {
    if (w.door) Snd.door(); else Snd.step(false);
    run(() => warp(w.to, w.tx, w.ty, w.dir));
    return true;
  }
  const s = m.steps.find(s => s.test(p.x, p.y) && (!s.when || s.when()));
  if (s) { run(s.act); return true; }
  return false;
}
function interact() {
  const p = G.p, m = MAPS[G.map];
  const [dx, dy] = DIRS[p.dir];
  const o = objAt(m, p.x + dx, p.y + dy);
  if (o && o.act) run(o.act);
}

async function warp(to, tx, ty, dir) {
  await fade(true, 220);
  enterMap(to, tx, ty, dir);
  if (M && M.phase === 2) {
    M.map = to; M.x = M.tx = tx; M.y = M.ty = ty; M.moving = false; M.spawnAt = now + 1.1; M.shown = false;
  } else if (M && M.phase === 1 && to !== 'witch') {
    M.map = to; M.x = M.tx = tx; M.y = M.ty = ty; M.moving = false; M.spawnAt = now + 1.4; M.shown = false;
  }
  await fade(false, 220);
  const m = MAPS[to];
  if (m.enter) await m.enter();
}
function enterMap(id, x, y, dir) {
  G.map = id;
  Object.assign(G.p, { x, y, tx: x, ty: y, dir, moving: false, t: 0, anim: 0 });
  const m = MAPS[id];
  if (!M) Snd.setAmb(m.amb);
  showPlace(m.name);
}
function setTile(id, x, y, ch) {
  const m = MAPS[id];
  m.rows[y] = m.rows[y].slice(0, x) + ch + m.rows[y].slice(x + 1);
  layerCache.delete(id);
}

// ---------- 画面 ----------
const layerCache = new Map();
function mapLayer(m) {
  let c = layerCache.get(m.id);
  if (!c) {
    c = document.createElement('canvas');
    c.width = m.w * T; c.height = m.h * T;
    const g = c.getContext('2d');
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) drawTile(g, m, x, y);
    drawTrees(g, m);
    layerCache.set(m.id, c);
  }
  return c;
}

const view = { s: 4, w: 0, h: 0, focusH: 0, dpr: 1 };
const lightCv = document.createElement('canvas'), lg = lightCv.getContext('2d');
let grain = [];
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cw = cv.clientWidth, ch = cv.clientHeight;
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  const padH = mode === 'play' ? $('pad').offsetHeight || 190 : 0;
  const focusPx = (ch - padH) * dpr;
  const s = Math.max(1, Math.floor(Math.min(cv.width / (7.5 * T), focusPx / (7 * T))));
  view.s = s; view.dpr = dpr;
  view.w = Math.ceil(cv.width / s); view.h = Math.ceil(cv.height / s);
  view.focusH = focusPx / s;
  lightCv.width = view.w; lightCv.height = view.h;
  ctx.imageSmoothingEnabled = false;
  if (!grain.length) {
    for (let k = 0; k < 3; k++) {
      const c = document.createElement('canvas'); c.width = c.height = 96;
      const g = c.getContext('2d');
      for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < 0.5 ? '#fff' : '#000'; g.fillRect((Math.random() * 96) | 0, (Math.random() * 96) | 0, 1, 1); }
      grain.push(c);
    }
  }
}

function camera(m, fx, fy) {
  const mw = m.w * T, mh = m.h * T;
  let cx = mw <= view.w ? (mw - view.w) / 2 : Math.max(0, Math.min(mw - view.w, fx - view.w / 2));
  let cy = mh <= view.focusH ? (mh - view.focusH) / 2 : Math.max(0, Math.min(mh - view.focusH, fy - view.focusH / 2));
  return [Math.round(cx), Math.round(cy)];
}

function render() {
  const m = MAPS[G ? G.map : 'forest'];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cv.width, cv.height);
  if (mode === 'dead' || mode === 'ending') return;
  const s = view.s;
  let camX, camY;
  const title = mode === 'title';
  const pp = G && !title ? pos(G.p) : null;
  if (title) {
    camX = Math.round((m.w * T - view.w) / 2); camY = -8;
  } else {
    [camX, camY] = camera(m, pp.x + 8, pp.y + 8);
  }
  let sx = 0, sy = 0;
  if (shakeT > 0) { sx = ((Math.random() - 0.5) * 6) | 0; sy = ((Math.random() - 0.5) * 6) | 0; }
  ctx.setTransform(s, 0, 0, s, (-camX + sx) * s, (-camY + sy) * s);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mapLayer(m), 0, 0);

  // 物とキャラを手前順に
  const list = [];
  for (const o of objsOf(m)) {
    let key = typeof o.art === 'function' ? o.art() : o.art;
    if (!key) continue;
    let img;
    if (key === 'doll') {
      const d = pp ? faceTo(o.x * T, o.y * T, pp.x, pp.y) : 'down';
      img = girl('doll', d, 0);
    } else if (o.lantern && G && G.F.lit.includes(o.lantern)) img = getArt('lanternLit');
    else img = getArt(key);
    if (!img) continue;
    list.push({ y: o.y * T + 16 + (WALK.has(tileAt(m, o.x, o.y)) ? 0 : -16), img, x: o.x * T, dy: o.y * T + 16 - img.height, glint: o.glint });
  }
  if (pp) {
    const p = G.p;
    const fr = p.moving ? (Math.floor(p.anim / 0.13) % 2 ? 1 : 2) : 0;
    list.push({ y: pp.y + 16.5, img: girl('riko', p.dir, fr), x: Math.round(pp.x), dy: Math.round(pp.y) - 4 });
  }
  let mp = null;
  if (M && M.map === m.id && now >= M.spawnAt && mode === 'play') {
    mp = monsterPos();
    const fr = M.moving ? (Math.floor(M.frame / 0.14) % 2 ? 1 : 2) : 0;
    list.push({ y: mp.y + 16.4, img: girl('shadow', M.dir, fr), x: Math.round(mp.x), dy: Math.round(mp.y) - 4, monster: true });
  }
  list.sort((a, b) => a.y - b.y);
  for (const it of list) {
    if (it.monster) { ctx.globalAlpha = 0.85 + Math.random() * 0.15; ctx.drawImage(it.img, it.x + (Math.random() < 0.1 ? 1 : 0), it.dy); ctx.globalAlpha = 1; }
    else ctx.drawImage(it.img, it.x, it.dy);
    if (it.glint && (now % 1.6) < 0.35) { ctx.fillStyle = '#fff8e0'; ctx.fillRect(it.x + 10, it.dy + 8, 1, 1); ctx.fillRect(it.x + 9, it.dy + 9, 3, 0.5); }
  }

  // 闇と明かり
  const flick = Math.sin(now * 9) * 1.2 + Math.sin(now * 23) * 0.8 + (Math.random() - 0.5);
  lg.globalCompositeOperation = 'source-over';
  lg.clearRect(0, 0, view.w, view.h);
  const dark = title ? 0.55 : m.dark;
  lg.fillStyle = `rgba(3,1,6,${dark})`;
  lg.fillRect(0, 0, view.w, view.h);
  lg.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a = 1) => {
    const gx = x - camX, gy = y - camY;
    const gr = lg.createRadialGradient(gx, gy, 0, gx, gy, r);
    gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.55, `rgba(0,0,0,${a * 0.6})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = gr; lg.fillRect(gx - r, gy - r, r * 2, r * 2);
  };
  if (pp) hole(pp.x + 8, pp.y + 6, m.light * 1.3 + flick);
  if (title) { hole(m.w * T / 2, 30, 120, 0.6); }
  for (const l of m.lights) hole(l.x * T, l.y * T, l.r + (l.c === 'fire' ? flick * 2 : 0), 0.8);
  for (const o of objsOf(m)) if (o.lantern && G && G.F.lit.includes(o.lantern)) hole(o.x * T + 8, o.y * T + 2, 40 + flick, 0.9);
  ctx.setTransform(s, 0, 0, s, sx * s, sy * s);
  ctx.drawImage(lightCv, 0, 0);
  // 色味
  ctx.globalCompositeOperation = 'lighter';
  for (const o of objsOf(m)) if (o.lantern && G && G.F.lit.includes(o.lantern)) glow(o.x * T + 8 - camX, o.y * T + 2 - camY, 26, 'rgba(255,150,60,.10)');
  for (const l of m.lights) glow(l.x * T - camX, l.y * T - camY, l.r, l.c === 'purple' ? 'rgba(140,60,180,.12)' : l.c === 'fire' ? 'rgba(255,90,30,.14)' : 'rgba(120,140,200,.08)');
  if (pp) glow(pp.x + 8 - camX, pp.y + 6 - camY, 40, 'rgba(255,170,90,.05)');
  ctx.globalCompositeOperation = 'source-over';
  // 闇の中で光る目
  if (mp) {
    const ex = mp.x - camX, ey = mp.y - camY - 4;
    const col = M.phase === 2 ? '#ff2a3a' : '#f4f0ff';
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.9;
    if (M.dir === 'down') { ctx.fillRect(ex + 5, ey + 6, 1, 2); ctx.fillRect(ex + 10, ey + 6, 1, 2); }
    else if (M.dir === 'right') ctx.fillRect(ex + 10, ey + 6, 1, 2);
    else if (M.dir === 'left') ctx.fillRect(ex + 5, ey + 6, 1, 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    glow(ex + 8, ey + 7, 7, M.phase === 2 ? 'rgba(255,30,40,.25)' : 'rgba(200,200,255,.18)');
    ctx.globalCompositeOperation = 'source-over';
  }
  // 粒子・ビネット
  ctx.globalAlpha = 0.035;
  const gc = grain[(now * 24 | 0) % 3];
  for (let y = 0; y < view.h; y += 96) for (let x = 0; x < view.w; x += 96) ctx.drawImage(gc, x, y);
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const W = cv.width, H = cv.height;
  const vg = ctx.createRadialGradient(W / 2, H * 0.4, Math.min(W, H) * 0.3, W / 2, H * 0.4, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, M && mode === 'play' ? `rgba(70,0,12,${0.55 + Math.sin(now * 8) * 0.15})` : 'rgba(0,0,0,.7)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
function glow(x, y, r, col) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function faceTo(x, y, px, py) {
  const dx = px - x, dy = py - y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

// ---------- 演出 ----------
function shake() { shakeT = 0.35; $('app').classList.remove('shake'); void $('app').offsetWidth; $('app').classList.add('shake'); }
function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }
function fade(on, ms = 500, color = '') {
  const f = $('fade');
  f.style.transitionDuration = ms + 'ms';
  f.className = (on ? 'on ' : '') + color;
  return sleep(ms);
}
async function scare(flip) {
  hideMsg();
  const c = $('scare'), W = 48, H = Math.round(48 * (c.clientHeight || innerHeight) / (c.clientWidth || innerWidth)) || 80;
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  c.hidden = false;
  Snd.scare(); vibrate([90, 40, 140]); shake();
  const t0 = performance.now();
  while (performance.now() - t0 < 750) {
    drawFace(g, W, H, flip, (Math.random() - 0.5) * 2);
    await sleep(45);
  }
  c.hidden = true;
}
function drawFace(g, W, H, flip, jit) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { g.fillStyle = Math.random() < 0.5 ? '#2a0008' : '#100004'; g.fillRect(Math.random() * W | 0, Math.random() * H | 0, 1, 1); }
  if (flip) { g.translate(W, H); g.scale(-1, -1); }
  const cx = W / 2 + jit, cy = H / 2;
  g.fillStyle = '#0a0608';
  g.fillRect(cx - 16, cy - 22, 32, 46);
  for (let r = -15; r <= 15; r++) {
    const hw = Math.round(12 * Math.sqrt(1 - (r / 16) ** 2));
    g.fillStyle = Math.abs(r) > 12 ? '#9a928e' : '#cfc6c0';
    g.fillRect(cx - hw, cy + r, hw * 2, 1);
  }
  g.fillStyle = '#a8a09c'; g.fillRect(cx - 12, cy - 2, 2, 8); g.fillRect(cx + 10, cy - 2, 2, 8);
  [-5, 5].forEach(dx => {
    g.fillStyle = '#000'; g.fillRect(cx + dx - 3, cy - 6, 6, 7); g.fillRect(cx + dx - 2, cy - 7, 4, 9);
    g.fillStyle = '#ff1a2e'; g.fillRect(cx + dx - (Math.random() < 0.5 ? 1 : 0), cy - 3, 1, 1);
    g.fillStyle = '#2a0a0a'; g.fillRect(cx + dx - 1, cy + 2, 1, 8);
  });
  g.fillStyle = '#000'; g.fillRect(cx - 2, cy + 5, 4, 9); g.fillRect(cx - 3, cy + 7, 6, 5);
  g.fillStyle = '#3a0008'; g.fillRect(cx - 1, cy + 8, 2, 4);
  g.fillStyle = '#0a0608';
  for (let i = 0; i < 7; i++) g.fillRect(cx - 11 + i * 3 + (i % 2), cy - 16, 1, 4 + (i * 5) % 7);
}

function showPlace(name) {
  const el = $('place');
  el.textContent = name;
  el.hidden = false;
  el.style.opacity = 1;
  clearTimeout(showPlace.t);
  showPlace.t = setTimeout(() => { el.style.transition = 'opacity 1s'; el.style.opacity = 0; }, 2200);
  el.style.transition = 'none';
}

// ---------- メッセージ ----------
const Msg = { open: false, full: '', shown: 0, acc: 0, typing: false, resolve: null, choices: null, sel: 0 };
function showMsg(text, name, choices) {
  return new Promise(res => {
    Object.assign(Msg, { open: true, full: text, shown: 0, acc: 0, typing: true, resolve: res, choices: choices || null, sel: 0 });
    const el = $('msg');
    el.hidden = false;
    el.classList.add('typing'); el.classList.remove('choosing');
    $('msg-name').hidden = !name; $('msg-name').textContent = name || '';
    $('msg-text').textContent = '';
    $('msg-choices').hidden = true; $('msg-choices').innerHTML = '';
  });
}
const say = (text, name) => showMsg(text, name);
const choose = (text, opts) => showMsg(text, null, opts);
function updateMsg(dt) {
  if (!Msg.open || !Msg.typing) return;
  Msg.acc += dt;
  while (Msg.acc > 0.03 && Msg.typing) {
    Msg.acc -= 0.03;
    Msg.shown++;
    if (Msg.shown % 2 === 0) Snd.blip();
    $('msg-text').textContent = Msg.full.slice(0, Msg.shown);
    if (Msg.shown >= Msg.full.length) finishTyping();
  }
}
function finishTyping() {
  Msg.typing = false; Msg.shown = Msg.full.length;
  $('msg-text').textContent = Msg.full;
  $('msg').classList.remove('typing');
  if (Msg.choices) {
    $('msg').classList.add('choosing');
    const box = $('msg-choices');
    box.hidden = false;
    Msg.choices.forEach((c, i) => {
      const b = document.createElement('button');
      b.textContent = c;
      b.addEventListener('click', e => { e.stopPropagation(); pick(i); });
      box.appendChild(b);
    });
    markSel();
  }
}
function markSel() { [...$('msg-choices').children].forEach((b, i) => b.classList.toggle('sel', i === Msg.sel)); }
function pick(i) {
  const r = Msg.resolve;
  Msg.resolve = null;
  $('msg-choices').hidden = true;
  $('msg').classList.remove('choosing');
  if (r) r(i);
}
function advance() {
  if (!Msg.open) return;
  if (Msg.typing) return finishTyping();
  if (Msg.choices) return pick(Msg.sel);
  const r = Msg.resolve;
  Msg.resolve = null;
  if (r) r();
}
function hideMsg() { Msg.open = false; Msg.resolve = null; $('msg').hidden = true; }

async function run(fn) {
  if (busy) return;
  busy = true;
  try { await fn(); }
  catch (e) { if (e !== DEAD) console.error(e); }
  finally { busy = false; hideMsg(); }
}

function paper(title, text) {
  return new Promise(res => {
    $('paper-title').textContent = title;
    $('paper-text').textContent = text;
    openOverlay('paper', res);
  });
}

// ---------- オーバーレイ ----------
let overlayDone = null;
function openOverlay(id, done) {
  $(id).hidden = false;
  paused = true;
  overlayDone = { id, done };
}
function closeOverlay(id) {
  $(id).hidden = true;
  if (overlayDone && overlayDone.id === id) {
    const d = overlayDone.done;
    overlayDone = null;
    if (d) d();
  }
  paused = ['help', 'records', 'inv', 'paper'].some(k => !$(k).hidden);
}
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeOverlay(b.closest('.overlay').id)));

function openInventory() {
  if (mode !== 'play' || busy || Msg.open) return;
  const ul = $('inv-list');
  ul.innerHTML = '';
  if (!G.F.items.length) ul.innerHTML = '<li class="unk">なにも持っていない</li>';
  for (const id of G.F.items) {
    const li = document.createElement('li');
    li.innerHTML = `<b></b><span class="d"></span>`;
    li.querySelector('b').textContent = ITEMS[id].name;
    li.querySelector('.d').textContent = ITEMS[id].desc;
    ul.appendChild(li);
  }
  [...G.F.pages].sort().forEach(n => {
    const li = document.createElement('li');
    li.innerHTML = `<b>日記の切れはし ${'①②③④'[n - 1]}</b><span class="d">タップで読む</span>`;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      closeOverlay('inv');
      run(() => paper(`日記の切れはし ${'①②③④'[n - 1]}`, PAGES[n]));
    });
    ul.appendChild(li);
  });
  $('inv-pages').textContent = `日記の切れはし ${G.F.pages.length}/4`;
  openOverlay('inv');
}

function openRecords() {
  const dl = $('death-list'), el = $('end-list');
  dl.innerHTML = ''; el.innerHTML = '';
  for (const [id, name, hint] of DEATHS) {
    const li = document.createElement('li');
    const got = meta.deaths.includes(id);
    li.className = got ? '' : 'unk';
    li.innerHTML = got ? `<b></b><span class="d"></span>` : `？？？<span class="d"></span>`;
    if (got) li.querySelector('b').textContent = name;
    li.querySelector('.d').textContent = got ? hint : '';
    dl.appendChild(li);
  }
  for (const [id, name] of ENDINGS) {
    const li = document.createElement('li');
    const got = meta.endings.includes(id);
    li.className = got ? '' : 'unk';
    li.textContent = got ? name : '？？？';
    el.appendChild(li);
  }
  $('death-count').textContent = `${meta.deaths.length}/${DEATHS.length}`;
  $('end-count').textContent = `${meta.endings.length}/${ENDINGS.length}`;
  openOverlay('records');
}

// ---------- 死亡・エンディング ----------
async function die(id) {
  M = null;
  hideMsg();
  Snd.setAmb(null);
  Snd.death(); vibrate([200, 80, 300]);
  if (!meta.deaths.includes(id)) { meta.deaths.push(id); saveMeta(); }
  await fade(true, 900, 'red');
  mode = 'dead';
  const d = DEATHS.find(x => x[0] === id);
  $('dead-name').textContent = `『${d[1]}』`;
  $('dead-count').textContent = `死に方 ${meta.deaths.length}/${DEATHS.length}`;
  $('dead').hidden = false;
  setUI();
  await fade(false, 600);
  throw DEAD;
}

async function ending(kind) {
  M = null;
  hideMsg();
  Snd.setAmb(null);
  await fade(true, 1200, kind === 'true' ? 'white' : '');
  mode = 'ending';
  setUI();
  if (!meta.endings.includes(kind)) { meta.endings.push(kind); saveMeta(); }
  store(SAVE_KEY, null);
  const box = $('ending-text');
  box.innerHTML = '';
  $('ending-name').textContent = ''; $('ending-hint').textContent = '';
  $('ending-menu').hidden = true;
  $('ending').classList.toggle('dawn', kind === 'true');
  $('ending').hidden = false;
  await fade(false, 1200);
  Snd.musicBox(true);
  const lines = kind === 'true' ? [
    '黒い薔薇が、いっせいに散っていく。\n館じゅうの人形が、光のつぶになってほどけていく。',
    '「ごめんね。ありがとう、リコ。\nもう、だれも引きとめないよ」',
    '気がつくと、リコは森の入口に立っていた。\n東の空が、白みはじめている。',
    '足もとに、小さな黒い薔薇が一輪。\nそっと拾うと、それはもう、こわくなかった。',
  ] : [
    '鍵を回すと、重い扉がひらいた。',
    'リコは振りかえらずに走った。\n薔薇の道は、いつのまにか消えていた。',
    '夜の森を抜けて、家の明かりが見えたとき、\nリコは声をあげて泣いた。',
    '――あの館がどうなったのか、リコは知らない。',
    'ただ、ときどき夢を見る。\n窓の向こうで、小さな女の子が\n手をふっている夢を。',
    '「またきてね」',
  ];
  for (const l of lines) {
    const p = document.createElement('p');
    p.textContent = l;
    box.appendChild(p);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    await sleep(3200);
  }
  if (kind === 'true') Snd.chime();
  $('ending-name').textContent = ENDINGS.find(e => e[0] === kind)[1];
  if (kind === 'normal' && !meta.endings.includes('true')) $('ending-hint').textContent = '日記の切れはしを4枚集めて、鏡の前へ行くと……？';
  else $('ending-hint').textContent = `死に方 ${meta.deaths.length}/${DEATHS.length}　エンディング ${meta.endings.length}/${ENDINGS.length}`;
  $('ending-menu').hidden = false;
  throw DEAD;
}

async function trueEnd() {
  await say('「…………ミナ」');
  Snd.chime();
  await say('その名前を呼ぶと、\n鏡の中の女の子が、顔を上げた。');
  await say('……そう。わたし、ミナ。', 'ミナ');
  await say('ずっと、だれかに\n呼んでほしかったの。', 'ミナ');
  await say('おともだちが、ほしかっただけなのに……\nたくさん、こわい思いをさせちゃった。', 'ミナ');
  await ending('true');
}

// ---------- 保存・開始 ----------
function writeSave() {
  store(SAVE_KEY, { map: G.map, x: G.p.x, y: G.p.y, dir: G.p.dir, F: G.F, tiles: { shelf: !!G.F.f.shelfOpen } });
}
function applyTiles() {
  setTile('library', 6, 1, G.F.f.shelfOpen ? 'd' : '#');
}
function startPlay() {
  mode = 'play';
  M = null; busy = false; paused = false;
  hideMsg();
  ['title', 'dead', 'ending'].forEach(id => $(id).hidden = true);
  Snd.musicBox(false);
  setUI();
}
async function newGame() {
  Snd.init();
  G = newState();
  G.p = { x: 5, y: 13, dir: 'up', tx: 5, ty: 13, moving: false, t: 0, anim: 0 };
  applyTiles();
  await fade(true, 600);
  startPlay();
  enterMap('forest', 5, 13, 'up');
  await fade(false, 1000);
  run(async () => {
    await say('……ここ、どこ……？');
    await say('森で道に迷ったリコは、\n気がつくと、見知らぬ館の前にいた。');
    await say('木のあいだから、うす紫の明かりが見える。');
  });
}
async function continueGame() {
  const s = load(SAVE_KEY);
  if (!s) return newGame();
  Snd.init();
  G = { map: s.map, p: { x: s.x, y: s.y, dir: s.dir }, F: s.F };
  G.F.f = G.F.f || {};
  applyTiles();
  await fade(true, 500);
  startPlay();
  enterMap(s.map, s.x, s.y, s.dir);
  await fade(false, 700);
}
function toTitle() {
  mode = 'title';
  M = null; busy = false; paused = false;
  hideMsg();
  ['dead', 'ending', 'inv', 'paper'].forEach(id => $(id).hidden = true);
  $('title').hidden = false;
  $('btn-continue').hidden = !load(SAVE_KEY);
  Snd.setAmb('forest');
  Snd.musicBox(true);
  setUI();
}
function setUI() {
  const play = mode === 'play';
  $('pad').hidden = !play; $('bar').hidden = !play;
  if (!play) $('place').hidden = true;
  resize();
}

// ---------- 入力 ----------
const input = { dir: null, stick: null, keys: [] };
function syncDir() {
  input.dir = input.stick || input.keys[input.keys.length - 1] || null;
}
function moveSel(d) {
  if (!Msg.open || Msg.typing || !Msg.choices) return;
  const n = Msg.choices.length;
  if (d === 'left' || d === 'up') Msg.sel = (Msg.sel + n - 1) % n;
  else Msg.sel = (Msg.sel + 1) % n;
  Snd.blip(); markSel();
}
function pressA() {
  Snd.init();
  if (mode !== 'play' || paused) return;
  if (Msg.open) return advance();
  if (!busy && !G.p.moving) interact();
}

const stick = $('stick'), knob = $('knob');
let stickId = null;
function stickMove(e) {
  const r = stick.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy;
  const len = Math.hypot(dx, dy), max = r.width * 0.32;
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  let d = null;
  if (len > 12) d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  if (d !== input.stick) { if (d) moveSel(d); input.stick = d; syncDir(); }
}
stick.addEventListener('pointerdown', e => { Snd.init(); stickId = e.pointerId; stick.setPointerCapture(e.pointerId); stickMove(e); e.preventDefault(); });
stick.addEventListener('pointermove', e => { if (e.pointerId === stickId) stickMove(e); });
const stickUp = e => { if (e.pointerId !== stickId) return; stickId = null; input.stick = null; syncDir(); knob.style.transform = ''; };
stick.addEventListener('pointerup', stickUp);
stick.addEventListener('pointercancel', stickUp);

const btnA = $('btn-a');
btnA.addEventListener('pointerdown', e => { e.preventDefault(); btnA.classList.add('on'); pressA(); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => btnA.addEventListener(t, () => btnA.classList.remove('on')));
$('msg').addEventListener('click', () => { if (!Msg.choices || Msg.typing) advance(); });
$('pad').addEventListener('contextmenu', e => e.preventDefault());

const KEYDIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
addEventListener('keydown', e => {
  const d = KEYDIR[e.key];
  if (d) {
    e.preventDefault();
    if (!e.repeat) { moveSel(d); if (!input.keys.includes(d)) input.keys.push(d); syncDir(); }
    return;
  }
  if (e.repeat) return;
  if (['z', 'Z', 'Enter', ' '].includes(e.key)) {
    e.preventDefault();
    if (!$('paper').hidden) return closeOverlay('paper');
    pressA();
  }
  if (['x', 'X', 'Escape'].includes(e.key)) {
    const open = ['paper', 'inv', 'help', 'records'].find(k => !$(k).hidden);
    if (open) closeOverlay(open); else openInventory();
  }
});
addEventListener('keyup', e => {
  const d = KEYDIR[e.key];
  if (d) { input.keys = input.keys.filter(k => k !== d); syncDir(); }
});
addEventListener('blur', () => { input.keys = []; input.stick = null; syncDir(); });

$('btn-new').addEventListener('click', () => {
  if (load(SAVE_KEY) && !confirm('記録が消えますが、はじめからにしますか？')) return;
  store(SAVE_KEY, null);
  newGame();
});
$('btn-continue').addEventListener('click', continueGame);
$('btn-help').addEventListener('click', () => { Snd.init(); openOverlay('help'); });
$('btn-records').addEventListener('click', () => { Snd.init(); openRecords(); });
$('btn-menu').addEventListener('click', openInventory);
$('btn-sound').addEventListener('click', () => { Snd.init(); Snd.setOn(!Snd.on); soundBtn(); });
$('btn-totitle').addEventListener('click', () => { closeOverlay('inv'); toTitle(); });
$('btn-retry').addEventListener('click', () => { $('dead').hidden = true; continueGame(); });
$('btn-dead-title').addEventListener('click', toTitle);
$('btn-end-title').addEventListener('click', toTitle);
$('title').addEventListener('pointerdown', () => { Snd.init(); Snd.setAmb('forest'); Snd.musicBox(true); });
function soundBtn() { $('btn-sound').textContent = Snd.on ? '🔊' : '🔇'; $('btn-sound').classList.toggle('off', !Snd.on); }
soundBtn();

document.addEventListener('visibilitychange', () => {
  if (!Snd.ac) return;
  if (document.hidden) Snd.ac.suspend(); else Snd.ac.resume();
  input.keys = []; input.stick = null; syncDir();
});
addEventListener('resize', resize);

// ---------- ループ ----------
let last = performance.now();
let ambT = 25;
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  now += dt;
  if (shakeT > 0) shakeT -= dt;
  updateMsg(dt);
  if (mode === 'play' && G && !paused) {
    updatePlayer(dt);
    updateChase(dt);
    // ときどき、どこかで物音がする
    ambT -= dt;
    if (ambT <= 0) {
      ambT = 25 + Math.random() * 30;
      if (!M && !busy && MAPS[G.map].amb === 'house') [() => Snd.knock(), () => Snd.giggle(), () => Snd.door()][Math.random() * 3 | 0]();
    }
  }
  if (mode === 'title' || mode === 'ending') Snd.tickBox();
  render();
  requestAnimationFrame(loop);
}

// ---------- 起動 ----------
G = null;
toTitle();
requestAnimationFrame(loop);
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (/[?&]debug/.test(location.search)) {
  window.KB = { get G() { return G; }, get M() { return M; }, get mode() { return mode; }, get busy() { return busy; },
    MAPS, warp: (id, x, y, d = 'down') => enterMap(id, x, y, d), give: id => G.F.items.push(id), newGame, run, advance, pressA, input, syncDir,
    startChase, ending, flags: () => G.F.f, page: n => G.F.pages.push(n), get msg() { return Msg; } };
}
