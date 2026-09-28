#!/usr/bin/env python3
"""
Take Recraft SVG output to the Speak Sarthi file spec.

    python3 to_webp.py <input-dir> <output-dir> [--map map.csv]

Input:  .svg files (Recraft vector output), or .png/.jpg if you have raster.
Output: 1200x900 WebP, each under 45 KB, named <WordId>.webp.

Why a script rather than one imagemagick line: the 45 KB cap is a *result*, not
a setting. Quality 80 lands anywhere between 12 KB and 90 KB depending on how
much detail is in the drawing, so this searches for the highest quality that
still fits and reports what it found. A flat run at q80 would silently ship
files twice the budget on the busier illustrations.

Renaming: pass --map with a CSV of `source_stem,WordId` to rename as it
converts. Without it, files keep their stems and you rename afterwards.

Requires: pillow, and cairosvg OR rsvg-convert OR inkscape for SVG input.
    pip install pillow cairosvg
"""
import argparse
import csv
import io
import shutil
import subprocess
import sys
from pathlib import Path

TARGET_W, TARGET_H = 1200, 900
MAX_BYTES = 45 * 1024

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")


def rasterise_svg(path: Path) -> Image.Image:
    """SVG -> PIL image at target size, via whichever renderer is installed."""
    try:
        import cairosvg
        png = cairosvg.svg2png(
            url=str(path), output_width=TARGET_W, output_height=TARGET_H
        )
        return Image.open(io.BytesIO(png))
    except ImportError:
        pass

    for tool, cmd in (
        ("rsvg-convert", ["rsvg-convert", "-w", str(TARGET_W), "-h", str(TARGET_H), str(path)]),
        ("inkscape", ["inkscape", str(path), "--export-type=png", "--export-filename=-",
                      f"--export-width={TARGET_W}", f"--export-height={TARGET_H}"]),
    ):
        if shutil.which(tool):
            out = subprocess.run(cmd, capture_output=True, check=True).stdout
            return Image.open(io.BytesIO(out))

    sys.exit("No SVG renderer found. Install one:  pip install cairosvg")


def load(path: Path) -> Image.Image:
    img = rasterise_svg(path) if path.suffix.lower() == ".svg" else Image.open(path)

    # Flatten transparency onto the app's paper colour. Left alone, a
    # transparent background renders black in WebP on some Android decoders —
    # which looks like a broken image rather than a styled one.
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        paper = Image.new("RGB", img.size, (0xF2, 0xF5, 0xF4))
        paper.paste(img, mask=img.split()[-1])
        img = paper
    else:
        img = img.convert("RGB")

    if img.size != (TARGET_W, TARGET_H):
        # LANCZOS for the raster path; SVGs already came out at target size.
        img = img.resize((TARGET_W, TARGET_H), Image.LANCZOS)
    return img


def save_under_budget(img: Image.Image, dest: Path) -> tuple[int, int]:
    """Highest quality that still fits the budget. Returns (quality, bytes)."""
    best = None
    for quality in (90, 85, 80, 75, 70, 65, 60, 55, 50):
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=quality, method=6)
        size = buf.tell()
        if size <= MAX_BYTES:
            best = (quality, size, buf.getvalue())
            break
        best = (quality, size, buf.getvalue())  # keep the smallest tried so far

    quality, size, data = best
    dest.write_bytes(data)
    return quality, size


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("dest")
    ap.add_argument("--map", help="CSV of source_stem,WordId")
    args = ap.parse_args()

    src, dst = Path(args.source), Path(args.dest)
    dst.mkdir(parents=True, exist_ok=True)

    rename = {}
    if args.map:
        with open(args.map) as fh:
            rename = {row[0].strip(): row[1].strip() for row in csv.reader(fh) if len(row) >= 2}

    files = sorted(
        p for p in src.iterdir()
        if p.suffix.lower() in (".svg", ".png", ".jpg", ".jpeg", ".webp")
    )
    if not files:
        print(f"No images in {src}")
        return 1

    over = []
    for path in files:
        name = rename.get(path.stem, path.stem)
        dest = dst / f"{name}.webp"
        quality, size = save_under_budget(load(path), dest)
        flag = "" if size <= MAX_BYTES else "  ** OVER BUDGET **"
        if size > MAX_BYTES:
            over.append(dest.name)
        print(f"{dest.name:16} {size/1024:6.1f} KB  q{quality}{flag}")

    print(f"\n{len(files)} converted to {TARGET_W}x{TARGET_H} WebP in {dst}")
    if over:
        # Never silently ship an oversized file: on a budget phone on mobile
        # data, the illustrations are the only thing in this app that costs
        # bandwidth at all.
        print(f"{len(over)} still over {MAX_BYTES//1024} KB — simplify those drawings: {', '.join(over)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
