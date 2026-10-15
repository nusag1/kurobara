# アイコン（黒い薔薇のドット絵）を作る。外部ライブラリなし
import zlib, struct, os
ART = [
"................................",
"................................",
"................................",
"................................",
"............rrrrrr..............",
"..........rrRRRRrrrr............",
".........rRRrrrrRRRrr...........",
"........rRrrRRRRrrRRr...........",
"........rRrRRrrRRrrRrr..........",
".......rRrRrrRRrrRrRRr..........",
".......rRrRrRrrRRrRrRr..........",
".......rRrRrRRRrrRrRRr..........",
".......rrRrRrrrRRrRRrr..........",
"........rRRrRRRrrRRrr...........",
"........rrRRrrrRRRrr............",
".........rrrRRRRrrr.............",
"...........rrrrrr...............",
"..............g.................",
".......gggg...g.................",
"......gGGGGg..g.................",
".......gGGGGg.g.................",
"........gggggggg.....t..........",
"..............g.gggg.t..........",
"..............g.gGGGGg..........",
"..............ggGGGGg...........",
"..............g.gggg............",
"..............g.................",
"..............g.................",
"..............g.................",
"................................",
"................................",
"................................",
]
COL = {'.': (12, 7, 14), 'r': (40, 4, 14), 'R': (122, 18, 44), 'g': (16, 34, 22), 'G': (30, 60, 38), 't': (70, 80, 60)}
def png(path, size, pad):
    n = 32; inner = size - pad * 2; sc = inner / n
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            ix, iy = int((x - pad) / sc), int((y - pad) / sc)
            c = COL['.']
            if 0 <= ix < n and 0 <= iy < n and 0 <= x - pad < inner and 0 <= y - pad < inner:
                c = COL[ART[iy][ix]]
            # 中心をほんのり赤く
            d = ((x - size * .45) ** 2 + (y - size * .4) ** 2) ** .5 / size
            glow = max(0, .35 - d) * 60
            if ART[min(n-1, max(0, iy))][min(n-1, max(0, ix))] == '.' or not (0 <= ix < n and 0 <= iy < n):
                c = (int(c[0] + glow), c[1], int(c[2] + glow * .3))
            row += bytes(c)
        rows.append(bytes(row))
    raw = b''.join(rows)
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)
here = os.path.join(os.path.dirname(__file__), '..', 'icons')
png(os.path.join(here, 'icon-192.png'), 192, 16)
png(os.path.join(here, 'icon-512.png'), 512, 64)
png(os.path.join(here, 'apple-touch-icon.png'), 180, 14)
