"""
手機寬度截圖（不開伺服器、不佔 port）：用無畫面模式的 Chrome / Edge 直接開 index.html。

用法：
  python tools/screenshot.py 1 2 3        翻到第 1、2、3 頁各截一張
  python tools/screenshot.py 3f           翻到第 3 頁，並把那頁第一張「有寫字」的照片翻面
  python tools/screenshot.py 1b           翻到第 1 頁，並捲到那頁最底下
  python tools/screenshot.py 3z           翻到第 3 頁，並點開那頁第一張照片（燈箱）
  python tools/screenshot.py --demo 1 2   先塞示範文字再截圖（只在測試頁，不改 data.js）

輸出：tools/_shots/page_<參數>.png，以及全部並排的 tools/_shots/all.png
"""
import subprocess, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "tools" / "_shots"
BROWSERS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
]
W, H = 390, 780   # iPhone 寬度附近

DEMO = r"""<script>
const M = window.MEMORY;
M.to = M.to || '給 ○○';
M.heroTitle = M.heroTitle || '從六月，到現在';
M.heroSub = M.heroSub || '這是封面副標的示範文字';
M.preface.text = M.preface.text || '這是前言的示範文字。\n\n從六月到現在，我們一起去了六個地方。\n每一次出門，我都偷偷把那天記下來。';
M.trips[0].title = M.trips[0].title || '第一次一起出門';
M.trips[0].diary = M.trips[0].diary || '這是日記的示範文字。\n那天天氣很好，你手上抱著一大束向日葵。';
M.trips[0].photos[1].note = M.trips[0].photos[1].note || '寫在照片背面的示範文字';
M.epilogue.text = M.epilogue.text || '這是結語的示範。\n謝謝你陪我走過這些地方。';
</script>"""


def browser():
    for b in BROWSERS:
        if Path(b).exists() or b == "google-chrome":
            return b
    sys.exit("找不到 Chrome 或 Edge")


def main():
    args = sys.argv[1:]
    demo = "--demo" in args
    pages = [a for a in args if a != "--demo"] or ["0"]
    OUT.mkdir(parents=True, exist_ok=True)
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    exe = browser()
    shots = []
    for a in pages:
        flip = a.endswith("f")
        bottom = a.endswith("b")
        zoom = a.endswith("z")
        k = int(a.rstrip("fbz"))
        js = (f"for(let i=0;i<{k};i++) setTimeout(()=>document.dispatchEvent(new KeyboardEvent('keydown',{{key:'ArrowRight'}})),300+i*1150);"
              + (f"setTimeout(()=>document.querySelectorAll('.page')[{k}].querySelector('.snap.has-note')?.click(),{600 + k * 1150});" if flip else "")
              + (f"setTimeout(()=>{{const s=document.querySelectorAll('.page')[{k}].querySelector('.sheet');s.scrollTop=s.scrollHeight;s.dispatchEvent(new Event('scroll'));}},{600 + k * 1150});" if bottom else "")
              + (f"setTimeout(()=>document.querySelectorAll('.page')[{k}].querySelector('.snap')?.click(),{600 + k * 1150});" if zoom else ""))
        page = html.replace("<head>", f"<head><base href='{ROOT.as_uri()}/'>", 1)
        if demo:
            page = page.replace('<script src="script.js"></script>', DEMO + '<script src="script.js"></script>', 1)
        page = page.replace("</body>", f"<script>{js}</script></body>", 1)
        test = OUT / f"_page_{a}.html"
        test.write_text(page, encoding="utf-8")
        wrap = OUT / f"_wrap_{a}.html"
        wrap.write_text(f'<html><body style="margin:0"><iframe src="{test.name}" style="width:{W}px;height:{H}px;border:0;display:block"></iframe></body></html>', encoding="utf-8")
        png = OUT / f"page_{a}.png"
        subprocess.run([exe, "--headless=new", "--hide-scrollbars", "--allow-file-access-from-files",
                        f"--window-size={W + 110},{H}", "--force-device-scale-factor=2",
                        f"--virtual-time-budget={7000 + k * 1150}", f"--user-data-dir={OUT / '_profile'}",
                        f"--screenshot={png}", wrap.as_uri()], capture_output=True, timeout=240)
        im = Image.open(png).crop((0, 0, W * 2, H * 2))
        im.save(png)
        shots.append(im.resize((W, H)))
        print(png)
    sheet = Image.new("RGB", (W * len(shots) + 10 * (len(shots) - 1), H), "white")
    for i, im in enumerate(shots):
        sheet.paste(im, (i * (W + 10), 0))
    sheet.save(OUT / "all.png")
    print(OUT / "all.png")


if __name__ == "__main__":
    main()
