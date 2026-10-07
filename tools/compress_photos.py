"""
把 photos/ 裡的原始照片壓縮成網頁用的版本，輸出到 images/
  - 依照 EXIF 自動轉正（手機直拍的照片才不會躺著）
  - 長邊縮到 1600px（大圖）、1000px（拼貼用，m/）與 480px（縮圖，s/）
  - 移除 EXIF（拍攝地點 GPS 等資訊不會跟著上網）
  - 原圖完全不會被修改

用法：python tools/compress_photos.py
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "photos"
DST = ROOT / "images"
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
SIZES = [("", 1600, 82), ("m", 1000, 80), ("s", 480, 78)]


def main():
    total_in = total_out = 0
    for folder in sorted(p for p in SRC.iterdir() if p.is_dir()):
        for f in sorted(folder.iterdir()):
            if f.suffix.lower() not in EXTS:
                continue
            outs = [DST / folder.name / sub / (f.stem + ".jpg") for sub, _, _ in SIZES]
            total_in += f.stat().st_size
            # 已經壓過、原圖也沒換過的就跳過
            if all(o.exists() and o.stat().st_mtime >= f.stat().st_mtime for o in outs):
                total_out += outs[0].stat().st_size
                continue
            with Image.open(f) as im:
                im = ImageOps.exif_transpose(im).convert("RGB")
                for sub, edge, quality in SIZES:
                    out_dir = DST / folder.name / sub
                    out_dir.mkdir(parents=True, exist_ok=True)
                    out = out_dir / (f.stem + ".jpg")
                    copy = im.copy()
                    copy.thumbnail((edge, edge), Image.LANCZOS)
                    copy.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
                    if not sub:
                        total_out += out.stat().st_size
            print(f"{folder.name}/{f.name}")
    # 原圖已刪除的，網頁版也一起清掉
    keep = {(f.parent.name, f.stem) for f in SRC.glob("*/*") if f.suffix.lower() in EXTS}
    for out in DST.glob("*/**/*.jpg"):
        folder = out.parent.parent.name if out.parent.name in ("s", "m") else out.parent.name
        if (folder, out.stem) not in keep:
            out.unlink()
            print(f"已移除 {out.relative_to(DST)}")
    # 照片尺寸表：網頁依原始比例排版，照片才不會被裁切
    sizes = {}
    for out in sorted(DST.glob("*/*.jpg")):
        with Image.open(out) as im:
            sizes[out.relative_to(ROOT).as_posix()] = list(im.size)
    lines = ",\n".join(f'  "{k}": [{w}, {h}]' for k, (w, h) in sizes.items())
    (DST / "sizes.js").write_text(
        "// 由 tools/compress_photos.py 自動產生，請勿手動修改\nwindow.PHOTO_SIZES = {\n" + lines + "\n};\n",
        encoding="utf-8")
    print(f"\n原圖 {total_in / 1048576:.1f} MB → 網頁大圖 {total_out / 1048576:.1f} MB")


if __name__ == "__main__":
    main()
