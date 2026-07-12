# Snake Clash 🐍

You start as a baby snake in a garden full of rival snakes. Gobble the little
balls to get longer — and eat any snake **smaller** than you. Bump into a
**bigger** snake, or a wall, and you're the snack.

Open `index.html` — no build step, works offline.

## Rules

- 24×18 garden, everybody moves one square per tick (220ms).
- Balls: +1 length each. Ten are always on the field.
- Snake vs snake: sizes are compared as they were at the *start* of the tick, so
  a head-on clash always has one clear winner. Winner gains half the loser's
  length (at least 2). The loser hatches again as a baby somewhere else.
- Your own tail is safe to slither through — kids kept dying to it, so it's out.
- Walls are fatal. A new rock-free garden every run.
- Best length is kept in `localStorage`.

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
