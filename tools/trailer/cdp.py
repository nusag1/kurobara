# -*- coding: utf-8 -*-
"""予告動画の録画：headless Chrome を CDP で動かし、場面ごとに連続スクリーンショット（screencast）を撮る。

使い方:
  python cdp.py <作業フォルダ> <場面名> [<場面名> ...]
    作業フォルダ/site にゲームのコピー（http://127.0.0.1:8765/ で配信しておく）
    作業フォルダ/frames/<場面名>/ に jpg と frames.json（各コマの時刻）、sound.json（鳴った音の記録）を書く

外部ライブラリなし（websocket は自前の最小実装）。Chrome は自分で起動した PID だけ止める。
"""
import base64, json, os, socket, struct, subprocess, sys, time, urllib.request

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9333
SITE = "http://127.0.0.1:8765/index.html?debug"
HERE = os.path.dirname(os.path.abspath(__file__))
VIEW = dict(width=390, height=760, deviceScaleFactor=0, mobile=True)


class WS:
    def __init__(self, url):
        assert url.startswith("ws://")
        hostport, path = url[5:].split("/", 1)
        host, port = hostport.split(":")
        self.s = socket.create_connection((host, int(port)))
        key = base64.b64encode(os.urandom(16)).decode()
        req = (f"GET /{path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
               f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n")
        self.s.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)
        self.rest = buf.split(b"\r\n\r\n", 1)[1]

    def _read(self, n):
        while len(self.rest) < n:
            d = self.s.recv(1 << 20)
            if not d:
                raise EOFError
            self.rest += d
        out, self.rest = self.rest[:n], self.rest[n:]
        return out

    def send(self, text):
        data = text.encode()
        hdr = bytearray([0x81])
        n = len(data)
        if n < 126:
            hdr.append(0x80 | n)
        elif n < 65536:
            hdr.append(0x80 | 126); hdr += struct.pack(">H", n)
        else:
            hdr.append(0x80 | 127); hdr += struct.pack(">Q", n)
        mask = os.urandom(4)
        hdr += mask
        self.s.sendall(bytes(hdr) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def recv(self):
        msg = b""
        while True:
            b1, b2 = self._read(2)
            n = b2 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._read(8))[0]
            payload = self._read(n)
            op = b1 & 0x0F
            if op == 9:   # ping
                continue
            msg += payload
            if b1 & 0x80:
                return msg.decode("utf-8", "replace")


class CDP:
    def __init__(self, ws):
        self.ws, self.id, self.on_event = ws, 0, None

    def call(self, method, **params):
        self.id += 1
        my = self.id
        self.ws.send(json.dumps({"id": my, "method": method, "params": params}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("id") == my:
                if "error" in m:
                    raise RuntimeError(f"{method}: {m['error']}")
                return m.get("result", {})
            if "method" in m and self.on_event:
                self.on_event(m)

    def wait_event(self, name, timeout=20):
        t0 = time.time()
        while time.time() - t0 < timeout:
            m = json.loads(self.ws.recv())
            if m.get("method") == name:
                return m
            if "method" in m and self.on_event:
                self.on_event(m)
        raise TimeoutError(name)


def launch(work):
    prof = os.path.join(work, "chrome-profile")
    p = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={PORT}", f"--user-data-dir={prof}",
                          "--window-size=600,900", "--force-device-scale-factor=2", "--hide-scrollbars", "--mute-audio", "--no-first-run",
                          "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "about:blank"])
    for _ in range(60):
        try:
            tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
            pages = [t for t in tabs if t.get("type") == "page"]
            if pages:
                return p, pages[0]["webSocketDebuggerUrl"]
        except Exception:
            pass
        time.sleep(0.5)
    p.kill()
    raise RuntimeError("chrome did not start")


def record(cdp, work, scene, director):
    out = os.path.join(work, os.environ.get("TR_FRAMES", "frames"), scene)
    os.makedirs(out, exist_ok=True)
    frames = []

    def on_event(m):
        if m["method"] == "Page.screencastFrame":
            p = m["params"]
            fn = f"{len(frames):05d}.jpg"
            with open(os.path.join(out, fn), "wb") as f:
                f.write(base64.b64decode(p["data"]))
            frames.append({"f": fn, "t": p["metadata"]["timestamp"], "rt": time.time()})
            cdp.ws.send(json.dumps({"id": 0, "method": "Page.screencastFrameAck", "params": {"sessionId": p["sessionId"]}}))
    cdp.on_event = on_event

    cdp.call("Page.navigate", url=SITE)
    cdp.wait_event("Page.loadEventFired")
    time.sleep(0.8)
    cdp.call("Runtime.evaluate", expression=director)
    cdp.call("Runtime.evaluate", expression=f"TR.prep({json.dumps(scene)})", awaitPromise=True)
    cdp.call("Page.startScreencast", format="jpeg", quality=92, maxWidth=780, maxHeight=1520, everyNthFrame=1)
    r = cdp.call("Runtime.evaluate", expression=f"TR.play({json.dumps(scene)})", awaitPromise=True, returnByValue=True)
    cdp.call("Page.stopScreencast")
    # 止めたあとに届いたコマも拾う
    t_end = time.time() + 0.6
    cdp.ws.s.settimeout(0.3)
    try:
        while time.time() < t_end:
            m = json.loads(cdp.ws.recv())
            if "method" in m:
                on_event(m)
    except (socket.timeout, OSError):
        pass
    cdp.ws.s.settimeout(None)
    res = r.get("result", {}).get("value") or {}
    with open(os.path.join(out, "frames.json"), "w", encoding="utf-8") as f:
        json.dump(frames, f)
    with open(os.path.join(out, "sound.json"), "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False)
    span = frames[-1]["t"] - frames[0]["t"] if frames else 0
    print(f"{scene}: {len(frames)} frames, {span:.1f}s, sounds={len(res.get('snd', []))}, err={res.get('err')}", flush=True)


def main():
    work = sys.argv[1]
    scenes = sys.argv[2:]
    director = open(os.path.join(HERE, "director.js"), encoding="utf-8").read()
    proc, url = launch(work)
    print("chrome pid", proc.pid, flush=True)
    try:
        cdp = CDP(WS(url))
        cdp.call("Page.enable")
        cdp.call("Emulation.setDeviceMetricsOverride", **VIEW)
        for s in scenes:
            record(cdp, work, s, director)
    finally:
        subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], capture_output=True)
        print("chrome stopped", flush=True)


if __name__ == "__main__":
    main()
