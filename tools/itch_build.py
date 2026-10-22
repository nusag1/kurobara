# itch.io 用の zip を作る（index.html が一番上。オフライン機能＝Service Worker とホーム画面用の設定は外す）
#   python -I tools/itch_build.py [出力先フォルダ]
import os, sys, zipfile
sys.stdout.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'dist')
os.makedirs(OUT, exist_ok=True)
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()

html = rd('index.html')
for line in ['<link rel="manifest" href="manifest.webmanifest">', '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">']:
    assert line in html, line
    html = html.replace(line + '\n', '').replace(line, '')
game = rd('game.js')
sw = "if ('serviceWorker' in navigator && location.protocol === 'https:') {\n  navigator.serviceWorker.register('sw.js').catch(() => {});\n}"
assert sw in game
game = game.replace(sw, '// itch.io 版：オフライン機能（Service Worker）は使わない')

files = {'index.html': html, 'game.js': game, 'ch2.js': rd('ch2.js'), 'ch3.js': rd('ch3.js'), 'ch4.js': rd('ch4.js'), 'omake.js': rd('omake.js'), 'style.css': rd('style.css')}
dest = os.path.join(OUT, 'kurobara_itch.zip')
with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, text in files.items():
        z.writestr(name, text.encode('utf-8'))
    z.write(os.path.join(HERE, 'icons', 'icon-192.png'), 'icons/icon-192.png')
print(dest, os.path.getsize(dest) // 1024, 'KB')
