#!/usr/bin/env python3
"""Rebuild assets/logo-spiral-wordmark-banner.png — the paper-banner wordmark.

WHY THIS EXISTS
The banner re-crops every 500 ms across paper photos spanning relative
luminance 0.05 (paper-8, near-black green) to 0.51 (paper-5, light khaki). The
brand wordmark (assets/logo-spiral-wordmark.svg) is a single flat gold
(#E8B534), which cannot hold contrast across that whole range: measured
directly, it composited at a worst case of 1.01:1 against paper-5, the gold
and the khaki paper are almost exactly the same lightness, and 1.48:1 against
paper-1. Both are far below WCAG AA (4.5:1), and it's invisible on the lightest
paper specifically, not just harder to read.

CSS filters are not an option here (AGENTS.md: a brightness() filter is what
made an earlier version of this subtext vanish), and a per-crop variant swap
would flicker at 2 Hz. So the gold glyph gets a soft dark halo baked in behind
it, colored with the brand's own --accent-ink token (#1a1408, "ink under an
accent fill"). The halo is only perceptible on the papers where the gold would
otherwise wash out, so it doesn't read as an outline on the darker papers where
gold already contrasts well on its own. Worst case becomes 5.13:1, every paper
passes AA.

This produces a RASTER used only by the paper banner. The plain
logo-spiral-wordmark.svg is untouched and still used wherever a clean vector
mark is wanted; nothing else references the banner-specific PNG this builds.

USAGE
    python3 .github/scripts/rebuild-wordmark.py

Reads the pristine single-ink raster from .github/assets/wordmark-flat.png
(itself rasterized from the SVG at 3x native resolution so the keyline stays
crisp) and writes assets/logo-spiral-wordmark-banner.png. It always reads the
flat source, never its own output, so re-running is safe and never compounds
the halo. If the brand SVG changes, regenerate the flat source first:

    python3 -c "import cairosvg; cairosvg.svg2png(
        url='assets/logo-spiral-wordmark.svg',
        write_to='.github/assets/wordmark-flat.png',
        output_width=2460, output_height=600)"
"""
from PIL import Image, ImageFilter
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / '.github/assets/wordmark-flat.png'
OUT = ROOT / 'assets/logo-spiral-wordmark-banner.png'

HALO_COLOR = (0x1a, 0x14, 0x08)  # --accent-ink token

# Tuned by sweeping radius/strength and measuring rendered contrast (glyph core
# vs. immediately surrounding ring) against all seven papers. Tight and dense
# on purpose: it reads as a keyline consistent with the torn-paper look, where
# wider/softer settings read as a sticker outline.
RADIUS, STRENGTH = 3.0, 3.6


def main():
    logo = Image.open(SRC).convert('RGBA')
    mask = logo.split()[3]  # single flat ink -> alpha channel is the glyph mask

    blur = mask.filter(ImageFilter.GaussianBlur(RADIUS))
    blur = blur.point(lambda v: min(255, int(v * STRENGTH)))
    halo = Image.new('RGBA', logo.size, HALO_COLOR + (0,))
    halo.putalpha(blur)

    canvas = Image.new('RGBA', logo.size, (0, 0, 0, 0))
    canvas.alpha_composite(halo)
    canvas.alpha_composite(logo)
    canvas.save(OUT, optimize=True)
    print(f'wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
