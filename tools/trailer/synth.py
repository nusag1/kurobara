# -*- coding: utf-8 -*-
"""予告動画の音：ゲーム（game.js の Snd）と同じ作り方の音を numpy で合成する。

director.js が記録した [時刻, 'tone'|'noise'|'amb', 引数] を、そのまま WAV にする。
- tone  : Snd.tone(f, dur, {type, vol, at, slide, attack}) と同じ（指数のエンベロープ・周波数のスライド）
- noise : Snd.noise(dur, {vol, at, freq, q, type, slide, attack})（白色雑音＋バイクワッド）
- amb   : Snd.setAmb(kind) の環境音（森の風・館のうなり・追いかけっこ など）
"""
import math
import numpy as np

SR = 44100
MASTER = 0.9
rng = np.random.default_rng(7)


def _wave(phase, kind):
    p = (phase / (2 * math.pi)) % 1.0
    if kind == 'sine':
        return np.sin(phase)
    if kind == 'square':
        return np.where(p < 0.5, 1.0, -1.0)
    if kind == 'sawtooth':
        return 2 * p - 1
    if kind == 'triangle':
        return 1 - 4 * np.abs(p - 0.5)
    return np.sin(phase)


def _env(n, dur, vol, attack):
    """setValueAtTime(0.0001) → exp ramp to vol (attack) → exp ramp to 0.0001 (dur)."""
    t = np.arange(n) / SR
    g = np.empty(n)
    a = t < attack
    g[a] = 0.0001 * (vol / 0.0001) ** (t[a] / attack)
    b = ~a & (t < dur)
    g[b] = vol * (0.0001 / vol) ** ((t[b] - attack) / max(1e-6, dur - attack))
    g[t >= dur] = 0.0
    return g


def tone(buf, t, f, dur, o):
    typ = o.get('type', 'sine'); vol = o.get('vol', 0.2); at = o.get('at', 0); slide = o.get('slide', 0)
    attack = o.get('attack', 0.008)
    start = t + at
    n = int((dur + 0.05) * SR)
    tt = np.arange(n) / SR
    if slide:
        fr = f * np.power(max(20, f * slide) / f, np.minimum(tt / dur, 1.0))
    else:
        fr = np.full(n, float(f))
    phase = np.cumsum(2 * math.pi * fr / SR)
    sig = _wave(phase, typ) * _env(n, dur, vol, attack)
    _add(buf, start, sig)


def _coef(kind, f, q):
    f = min(max(f, 10.0), SR * 0.45)
    w0 = 2 * math.pi * f / SR
    c, s = math.cos(w0), math.sin(w0)
    if kind in ('lowpass', 'highpass'):
        q = 10 ** (q / 20)          # WebAudio の lowpass/highpass の Q は dB
    alpha = s / (2 * max(q, 1e-4))
    if kind == 'lowpass':
        b = ((1 - c) / 2, 1 - c, (1 - c) / 2)
    elif kind == 'highpass':
        b = ((1 + c) / 2, -(1 + c), (1 + c) / 2)
    else:  # bandpass（ピーク 0dB）
        b = (alpha, 0.0, -alpha)
    a0 = 1 + alpha
    return (b[0] / a0, b[1] / a0, b[2] / a0, -2 * c / a0, (1 - alpha) / a0)


def biquad(x, kind, freqs, q, block=32):
    """freqs: 長さ len(x) の配列か定数。block ごとに係数を更新する。"""
    y = np.empty_like(x)
    x1 = x2 = y1 = y2 = 0.0
    const = np.isscalar(freqs)
    co = _coef(kind, freqs, q) if const else None
    xl = x.tolist()
    out = [0.0] * len(xl)
    for i0 in range(0, len(xl), block):
        if not const:
            co = _coef(kind, float(freqs[i0]), q)
        b0, b1, b2, a1, a2 = co
        for i in range(i0, min(i0 + block, len(xl))):
            xi = xl[i]
            yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
            x2, x1, y2, y1 = x1, xi, y1, yi
            out[i] = yi
    y[:] = out
    return y


def noise(buf, t, dur, o):
    vol = o.get('vol', 0.2); at = o.get('at', 0); freq = o.get('freq', 1000); q = o.get('q', 1)
    typ = o.get('type', 'bandpass'); slide = o.get('slide', 0); attack = o.get('attack', 0.005)
    n = int((dur + 0.05) * SR)
    x = rng.uniform(-1, 1, n)
    if slide:
        tt = np.arange(n) / SR
        fr = freq * np.power(max(30, freq * slide) / freq, np.minimum(tt / dur, 1.0))
    else:
        fr = float(freq)
    sig = biquad(x, typ, fr, q) * _env(n, dur, vol, attack)
    _add(buf, t + at, sig)


def _add(buf, start, sig):
    i = int(round(start * SR))
    if i >= len(buf) or i + len(sig) <= 0:
        return
    s0 = max(0, -i)
    i = max(0, i)
    m = min(len(sig) - s0, len(buf) - i)
    buf[i:i + m] += sig[s0:s0 + m]


# ---- 環境音 ----
AMB = {
    'forest': (0.6, [('wind', 500, 0.35), ('sine', 41, 0.25)]),
    'house': (0.5, [('sine', 55, 0.3), ('sine', 58.3, 0.25), ('triangle', 164.8, 0.025), ('wind', 180, 0.12)]),
    'tower': (0.5, [('sine', 46, 0.3), ('sine', 69.3, 0.12), ('triangle', 92.5, 0.015), ('wind', 240, 0.1)]),
    'past': (0.4, [('sine', 65.4, 0.18), ('sine', 98, 0.08), ('triangle', 196, 0.012), ('wind', 700, 0.04)]),
    'mirror': (0.4, [('sine', 196, 0.06), ('sine', 293.7, 0.035), ('triangle', 392.4, 0.008), ('wind', 1100, 0.04)]),
    'chase': (0.6, [('sawtooth', 49, 0.05), ('sawtooth', 51.9, 0.05), ('sine', 73.4, 0.25), ('wind', 900, 0.12)]),
}


def amb_layer(kind, n):
    vol, parts = AMB[kind]
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for typ, f, v in parts:
        if typ == 'wind':
            lfo = np.sin(2 * math.pi * 0.08 * tt)
            fr = f + f * 0.6 * lfo
            out += biquad(rng.uniform(-1, 1, n), 'lowpass', np.maximum(fr, 20), 1, block=64) * v
        else:
            out += _wave(2 * math.pi * f * tt, typ) * v
    return out, vol


def ambience(buf, events):
    """events: [(t, kind)]。最初のものは最初から鳴っている（録画の前に始まっているため）。"""
    n = len(buf)
    tt = np.arange(n) / SR
    for k, (t, kind) in enumerate(events):
        if not kind or kind not in AMB:
            continue
        t_end = events[k + 1][0] if k + 1 < len(events) else None
        sig, vol = amb_layer(kind, n)
        if k == 0:
            g = np.full(n, vol)
        else:
            g = np.where(tt < t, 0.0, vol * (1 - np.exp(-(tt - t) / 0.8)))
        if t_end is not None:
            gend = np.interp(t_end, tt, g) if t_end < tt[-1] else vol
            fall = gend * np.exp(-(tt - t_end) / 0.4)
            g = np.where(tt >= t_end, fall, g)
            g[tt >= t_end + 2.5] = 0
        buf += sig * g


def render_log(snd, t0, dur):
    """director.js の記録（絶対時刻）から、t0 を 0 秒とした dur 秒の音を作る。"""
    buf = np.zeros(int(dur * SR) + SR)
    ambs = []
    for t, kind, a in snd:
        rt = t - t0
        if kind == 'tone':
            f, d, o = a
            tone(buf, rt, f, d, o)
        elif kind == 'noise':
            d, o = a
            noise(buf, rt, d, o)
        elif kind == 'amb':
            ambs.append((max(0.0, rt), a))
    ambience(buf, ambs)
    return buf[:int(dur * SR)] * MASTER


# ---- 予告用の追加の音（ゲームの音と同じ部品で） ----
SONG = ['E5', 'G5', 'B5', 'A5', 'G5', 'Fs5', 'E5', '', 'Ds5', 'Fs5', 'A5', 'G5', 'Fs5', 'E5', 'Ds5', '',
        'E5', 'G5', 'B5', 'E6', 'D6', 'B5', 'C6', 'A5', 'G5', 'E5', 'Fs5', 'Ds5', 'E5', '', '', '']
NOTE = {'D5': 587, 'Ds5': 622, 'E5': 659, 'Fs5': 740, 'G5': 784, 'A5': 880, 'B5': 988, 'C6': 1047, 'D6': 1175, 'E6': 1319}


def music_box(buf, t, length, start_i=0, vol=1.0, step=0.46):
    i = start_i
    x = t
    while x < t + length:
        nm = SONG[i % len(SONG)]
        if nm:
            tone(buf, x, NOTE[nm], 1.4, {'type': 'triangle', 'vol': 0.05 * vol, 'attack': 0.004})
            tone(buf, x, NOTE[nm] * 2, 0.5, {'type': 'sine', 'vol': 0.015 * vol, 'attack': 0.004})
        i += 1
        x += step
    return i


def boom(buf, t):
    tone(buf, t, 50, 1.6, {'vol': 0.55, 'slide': 0.5})
    noise(buf, t, 1.2, {'vol': 0.35, 'freq': 160, 'type': 'lowpass'})


def bell(buf, t):
    for f, v in zip([196, 392, 588, 790], [0.25, 0.1, 0.05, 0.03]):
        tone(buf, t, f, 4, {'type': 'sine', 'vol': v, 'attack': 0.004})
