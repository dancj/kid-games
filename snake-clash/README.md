# Snake Clash 🐍

You start as a baby snake in a garden full of rival snakes. Gobble the little
balls to get longer — and eat any snake **smaller** than you. Bump into a
**bigger** snake, or a wall, and you're the snack.

Open `index.html` — no build step, works offline.

## Rules

- 24×18 garden with **no walls** — slither off an edge and you come back on the
  other side. The dashed border is the hint.
- Balls: +1 length each. Ten are always on the field.
- Snake vs snake: bump a **smaller** snake and you eat it (gaining half its
  length, at least 2). Bump a **bigger** one and you're done. **Same size and
  nobody gets hurt.** Sizes are compared as they stood at the *start* of the
  tick, so a head-on clash always has one clear winner.
- Your own tail is safe to slither through.
- Speed ramps with your size: `SLOW` (400ms/move) as a baby down to `FAST`
  (130ms) — 9ms quicker per segment. Being long is the difficulty.
- Best length is kept in `localStorage`.

## Smooth motion

Snakes aren't redrawn each tick. Each segment keeps its own `<rect>` and gets a
new `transform`, with `transition: transform var(--tick) linear` easing it into
the next square; `--tick` is set to the current speed so the glide always lasts
exactly one move. `place()` kills the transition for one frame when a segment
wraps the edge or a rival hatches, so those teleport instead of sliding across
the whole board.

## Controls

Swipe anywhere on the board to turn. Arrow keys work on a laptop. No U-turns —
you can't double back into your own neck.

## Rivals

Rival snakes chase the nearest ball and avoid any snake their own size or
bigger (`rivalDir`). They don't hunt you on purpose — they just get in the way,
which is what makes the garden crowded.

## Test

```
node test.js
```

Runs on the pure logic: `tick()` for moving, eating, being eaten, walls, and
self-crossing, plus a 60-tick auto-run asserting the rivals stay on the board
and the field restocks.
