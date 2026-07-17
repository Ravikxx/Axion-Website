# Torn-paper cutout behind the logo (removed, kept for reference)

This was a CSS/JS-only effect used briefly on the `.paper-banner` component
(see `paper-banner.css` / `paper-banner.js`) to make it look like the logo
sits in a torn opening in the paper, with a new random tear shape every
time the photo cycles. It was pulled from the live component in favor of a
hand-drawn PNG asset, but the technique is documented here in case it's
useful again (e.g. as a fallback, or combined with the PNG).

Removed in the commit right after "Darken logo and add a torn-paper cutout
behind it" — `git show a4cf9d9:assets/paper-banner.css` /
`git show a4cf9d9:assets/paper-banner.js` has the full working version.

## The idea

Three stacked layers behind the logo, back to front:

1. **Photo** — the paper background, already in the component.
2. **Rim** — a light, warm gradient shape (`#f2ecd9` → `#a89d80`), meant to
   read as the exposed lighter fiber you see at a torn paper edge.
3. **Hole** — a darker radial-gradient shape, slightly smaller than the rim
   and offset, sitting on top of it. Because it's smaller, a ring of the
   rim shows around it — that ring *is* the torn edge.

Both rim and hole are plain `<div>`s with a solid/gradient background;
the "torn" silhouette comes entirely from applying a jagged CSS
`clip-path: polygon(...)` to each one, not from any image.

The logo sits on top of both (darkened via `filter: brightness(.4)
contrast(1.15)` so it reads as near-black ink rather than the source PNG's
medium charcoal).

## Generating the jagged shape

A regular polygon (evenly spaced points around a circle) looks like a
sticker, not a tear. The trick is irregular point spacing and occasional
sharp inward spikes:

```js
function tornClipPath(baseRadius, jag) {
  var points = 16 + Math.floor(rand(0, 6)); // 16-21 points
  var out = [];
  for (var i = 0; i < points; i++) {
    var angle = (i / points) * Math.PI * 2;
    var r = baseRadius + rand(-jag, jag);
    if (Math.random() < 0.3) r -= jag * 1.4;   // occasional deep notch
    var x = 50 + r * Math.cos(angle);
    var y = 50 + r * Math.sin(angle) * 0.82;   // squash vertically
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    out.push(x.toFixed(1) + '% ' + y.toFixed(1) + '%');
  }
  return 'polygon(' + out.join(', ') + ')';
}
```

Called once for the rim (`tornClipPath(47, 9)`, bigger/gentler) and once
for the hole (`tornClipPath(39, 8)`, smaller/tighter) — using two
*independent* calls (not the same shape scaled down) so the rim and hole
edges don't line up perfectly, which is what makes the rim read as a
ragged ring instead of a uniform border.

## Making it different every cycle

The component already re-randomizes the photo crop (zoom/position) on a
timer (`paintLayer`, see `paper-banner.js`). The rip hooked into the same
`cycle()` function and just called `tornClipPath` again each time:

```js
function paintRip(rim, hole) {
  rim.style.clipPath = tornClipPath(47, 9);
  hole.style.clipPath = tornClipPath(39, 8);
}
```

Since `Math.random()` drives every point, no two tears ever come out the
same, and — combined with the plain CSS `clip-path` (no transition) — the
shape changes instantly along with the photo, no animation needed.

## Known limitation

`clip-path: polygon()` gives you straight edges between points, so at
close zoom the tear reads more like a faceted/angular shard than soft torn
paper fiber. Good enough at banner scale, but a real photographed/drawn
torn-edge PNG (like the one this doc is a placeholder for) will look more
convincing up close — hence swapping to a PNG asset instead of trying to
push this further with more points or an SVG turbulence filter.
