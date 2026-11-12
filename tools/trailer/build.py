# -*- coding: utf-8 -*-
"""予告動画を組み立てる：録ったコマ（cdp.py）＋字幕カード＋合成した音（synth.py）→ mp4

使い方: python build.py <作業フォルダ> <コマのフォルダ名(rec)> <出力mp4>
横 1920x1080・30fps。ゲーム画面（縦長）をまんなかに、両わきは同じ画面を暗くぼかして敷く。
"""
import json, os, shutil, subprocess, sys, wave
import numpy as np
import synth

FF = os.path.expanduser(r"~/tools/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe")
W, H, FPS = 1920, 1080, 30

# 場面の並び（録画の頭からの秒で in/out）
CARD_A = 'その館は、黒い薔薇に　閉ざされている'
CARD_C = '見つかったら、にげて'
CARD_D = 'その館には、時計の止まった部屋がある'
CARD_E = '鏡の向こうにも、もうひとつの館'
EDIT = [
    ('scene', 'title', 0.4, 4.6),
    ('card', CARD_A, 2.3),
    ('scene', 'forest', 1.0, 6.0),
    ('scene', 'doll', 2.1, 6.1),
    ('scene', 'shelf', 3.5, 8.6),
    ('card', CARD_C, 2.0),
    ('scene', 'chase', 0.7, 5.3),
    ('card', CARD_D, 2.5),
    ('scene', 'ch2', 0.5, 4.7),
    ('scene', 'ch3', 1.4, 6.6),
    ('card', CARD_E, 2.3),
    ('scene', 'ch4', 2.9, 5.4),
    ('scene', 'ch4', 9.2, 11.4),
    ('scene', 'ch4', 12.8, 17.6),
    ('end', None, 5.5),
]


def run(args, cwd=None):
    r = subprocess.run([FF, '-v', 'error', '-y'] + args, cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode:
        print(r.stderr[-3000:])
        raise SystemExit('ffmpeg failed')


def frames_of(rec, scene):
    d = os.path.join(rec, scene)
    fr = json.load(open(os.path.join(d, 'frames.json'), encoding='utf-8'))
    snd = json.load(open(os.path.join(d, 'sound.json'), encoding='utf-8'))
    return d, fr, snd


def scene_video(work, rec, scene, t_in, t_out, out, first=False):
    d, fr, _ = frames_of(rec, scene)
    t0 = fr[0]['t']
    lst = os.path.join(work, 'tmp', os.path.basename(out) + '.txt')
    lines, last = [], None
    for i, f in enumerate(fr):
        a = f['t'] - t0
        b = fr[i + 1]['t'] - t0 if i + 1 < len(fr) else a + 1 / 60
        if b <= t_in or a >= t_out:
            continue
        a, b = max(a, t_in), min(b, t_out)
        p = os.path.join(d, f['f']).replace('\\', '/')
        lines.append(f"file '{p}'\nduration {b - a:.5f}")
        last = p
    lines.append(f"file '{last}'")
    open(lst, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    dur = t_out - t_in
    fin = 0.6 if first else 0.2
    vf = (f"fps={FPS},eq=gamma=1.18:saturation=1.05,split[a][b];"
          f"[a]scale=240:468,gblur=sigma=6,scale=1920:3744,crop={W}:{H},eq=brightness=0.02:saturation=0.85[bg];"
          f"[b]scale=554:1080:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:0,vignette=PI/5,"
          f"fade=in:st=0:d={fin},fade=out:st={dur - 0.25:.3f}:d=0.25,format=yuv420p")
    run(['-f', 'concat', '-safe', '0', '-i', lst, '-filter_complex', vf, '-t', f'{dur:.3f}', '-r', str(FPS),
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-an', out])
    return dur


def text_file(work, name, text):
    p = os.path.join(work, 'tmp', name)
    open(p, 'w', encoding='utf-8').write(text)
    return os.path.relpath(p, work).replace('\\', '/')


def dt(tf, font, size, color, y, extra=''):
    return f"drawtext=fontfile={font}:textfile={tf}:fontsize={size}:fontcolor={color}:x=(w-text_w)/2:y={y}{extra}"


def card_video(work, k, text, dur, out):
    tf = text_file(work, f'card{k}.txt', text)
    vf = (dt(tf, 'fonts/yumin.ttf', 58, '0xe6dcd2', '(h-text_h)/2') +
          f",fade=in:st=0:d=0.45,fade=out:st={dur - 0.45:.3f}:d=0.45,format=yuv420p")
    run(['-f', 'lavfi', '-i', f'color=c=0x050306:s={W}x{H}:r={FPS}:d={dur}', '-vf', vf, '-t', str(dur),
         '-c:v', 'libx264', '-crf', '17', '-an', out], cwd=work)
    return dur


def end_video(work, dur, out):
    sub = text_file(work, 'end_sub.txt', '― 探索ホラーアドベンチャー ―')
    ttl = text_file(work, 'end_title.txt', 'くろばらの館')
    free = text_file(work, 'end_free.txt', '無料で遊べます')
    cr = text_file(work, 'end_credit.txt', '作　よるのうさぎ')
    vf = ','.join([
        dt(ttl, 'fonts/yumindb.ttf', 150, '0xb3122a', 380),
        'gblur=sigma=16',
        dt(ttl, 'fonts/yumindb.ttf', 150, '0xf2e8e0', 380),
        dt(sub, 'fonts/yumin.ttf', 32, '0x9a8c94', 300),
        dt(free, 'fonts/yumin.ttf', 54, '0xe6dcd2', 640, ":alpha='if(lt(t,1.0),0,min(1,(t-1.0)/0.6))'"),
        dt(cr, 'fonts/yumin.ttf', 32, '0x8a7c84', 790, ":alpha='if(lt(t,1.4),0,min(1,(t-1.4)/0.6))'"),
        f"fade=in:st=0:d=0.8,fade=out:st={dur - 1.0:.3f}:d=1.0,format=yuv420p",
    ])
    run(['-f', 'lavfi', '-i', f'color=c=black:s={W}x{H}:r={FPS}:d={dur}', '-vf', vf, '-t', str(dur),
         '-c:v', 'libx264', '-crf', '17', '-an', out], cwd=work)
    return dur


def fade_arr(n, fin, fout):
    g = np.ones(n)
    a, b = int(fin * synth.SR), int(fout * synth.SR)
    if a: g[:a] = np.linspace(0, 1, a)
    if b: g[-b:] = np.minimum(g[-b:], np.linspace(1, 0, b))
    return g


def main():
    work, recname, out = sys.argv[1], sys.argv[2], sys.argv[3]
    rec = os.path.join(work, recname)
    os.makedirs(os.path.join(work, 'tmp'), exist_ok=True)
    os.makedirs(os.path.join(work, 'fonts'), exist_ok=True)
    for f in ('yumin.ttf', 'yumindb.ttf'):
        dst = os.path.join(work, 'fonts', f)
        if not os.path.exists(dst):
            shutil.copy(os.path.join(r'C:\Windows\Fonts', f), dst)

    # ---- 映像 ----
    segs, T = [], 0.0
    plan = []
    for k, item in enumerate(EDIT):
        p = os.path.join(work, 'tmp', f'seg{k:02d}.mp4')
        if item[0] == 'scene':
            d = scene_video(work, rec, item[1], item[2], item[3], p, first=(k == 0))
        elif item[0] == 'card':
            d = card_video(work, k, item[1], item[2], p)
        else:
            d = end_video(work, item[2], p)
        plan.append((T, d, item))
        segs.append(p)
        T += d
        print(f'{k:02d} {item[0]:5s} {item[1] or "":30s} {T - d:5.2f}-{T:5.2f}', flush=True)
    lst = os.path.join(work, 'tmp', 'segs.txt')
    open(lst, 'w', encoding='utf-8').write(''.join(f"file '{s.replace(chr(92), '/')}'\n" for s in segs))
    video = os.path.join(work, 'tmp', 'video.mp4')
    run(['-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', video])

    # ---- 音 ----
    SR = synth.SR
    total = np.zeros(int((T + 1) * SR))
    cache = {}
    box_i = 8
    for t, d, item in plan:
        if item[0] == 'scene':
            name, a, b = item[1], item[2], item[3]
            if name not in cache:
                _, fr, snd = frames_of(rec, name)
                t0 = fr[0]['t']
                cache[name] = synth.render_log(snd['snd'], t0, fr[-1]['t'] - t0 + 1.0)
                print('audio', name, flush=True)
            s = cache[name][int(a * SR):int(b * SR)]
            s = s * fade_arr(len(s), 0.5 if t == 0 else 0.08, 0.2)
            i = int(t * SR)
            total[i:i + len(s)] += s
        elif item[0] == 'card':
            buf = np.zeros(int((d + 2) * SR))
            synth.boom(buf, 0.02)
            box_i = synth.music_box(buf, 0.3, d - 0.4, box_i, vol=0.9)
            buf = buf[:int(d * SR)] * fade_arr(int(d * SR), 0.01, 0.35) * synth.MASTER
            i = int(t * SR)
            total[i:i + len(buf)] += buf
        else:
            buf = np.zeros(int((d + 4) * SR))
            synth.bell(buf, 0.25)
            synth.music_box(buf, 0.6, d - 1.0, 0, vol=1.0)
            buf = buf[:int(d * SR)] * fade_arr(int(d * SR), 0.01, 1.6) * synth.MASTER
            i = int(t * SR)
            total[i:i + len(buf)] += buf
    total = total[:int(T * SR)]
    peak = np.max(np.abs(total))
    total *= 0.89 / peak
    pcm = (np.clip(total, -1, 1) * 32767).astype('<i2')
    wav = os.path.join(work, 'tmp', 'audio.wav')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(np.repeat(pcm, 2).tobytes())
    print(f'audio peak before norm {peak:.3f}', flush=True)

    run(['-i', video, '-i', wav, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out])
    json.dump([(t, d, list(item)) for t, d, item in plan], open(os.path.join(work, 'tmp', 'plan.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print('done', out, f'{T:.2f}s', os.path.getsize(out) // 1024, 'KB')


if __name__ == '__main__':
    main()
