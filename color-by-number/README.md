# Color by Number 🎨

Pixel-grid coloring. Tap a numbered color, then tap every little square wearing
that number. Four season pictures: Spring 🌷, Summer 🏖️, Autumn 🍂, Winter ⛄.

Open `index.html` — no build step, works offline.

## How it plays

- Pick a picture (thumbnails show the finished version).
- Each picture is a 24×18 grid — 432 squares — so there are lots of squares of
  every number.
- The palette holds 24 colors, numbered 1–24. Numbers mean the same color in
  every picture, so 3 is always yellow.
- Tap a color: every square that wants it turns light blue. Tap or swipe across
  the squares to fill them — a swipe only fills the ones that match, and squares
  you brush past stay quiet. A deliberate tap on a wrong square blushes pink;
  nothing gets ruined.
- Fill every square to finish, then save the picture as a PNG.

Landscape puts the palette in a column beside the picture; portrait moves it to
a strip underneath.

## Adding a picture

Add an entry to `SCENES` in `game.js`. A scene is a `px(x, y)` function that
returns the palette number a square wants — first test that matches wins, so
foreground shapes go first and the background is the final `return`:

```js
px(x, y) {
  if (inC(x, y, 21, 2.5, 3)) return 3;   // sun
  if (y >= 13) return 6;                  // grass
  return 10;                              // sky
}
```

Helpers: `inC` (circle), `inE` (ellipse), `inR` (rect), `inCone` (pine tier).
No hand-placed labels — every square is the same size and gets its own number.

## Test

```
node test.js
```

Checks each grid is 432 squares of real palette colors using at least 6 colors,
that blank/half/finished renders make clean SVG with a number on every unpainted
square and none on painted ones, and the painting rules (wrong color never
fills, last square reports done).
