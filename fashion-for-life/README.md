# Fashion for Life 💖

A kid-friendly fashion styling game for the browser, made for iPads. Style your model's nails, makeup, hair, and outfit before the timer runs out, then hit the stage and get rated by the judges!

**Play:** open `index.html` in any browser — no install, no build, works offline.

## How to play

1. Pick your model and press **Play**
2. Each round has a theme (Princess Party, Beach Day, Rock Star…) — match it!
3. Style away in the salon: 💅 Nails · 💄 Makeup · 💇 Hair · 👗 Outfit
4. Tap the floor to walk around; press **Done** when ready (or beat the clock)
5. Walk the stage, strike a pose, and get your stars from the judges
6. Beat Zoe, Kai, and Mimi across 6 rounds to become Fashion Champion 🏆

Rounds get shorter as you go (90s down to 25s), but you earn new supplies after each one — glitter polish, gowns, tiaras, and more.

## Tech

Plain HTML/CSS/JavaScript, zero dependencies. The model is a layered inline SVG; outfits, hair, makeup, and poses swap layers in and out.

- `index.html` — screens and layout
- `style.css` — styling and animations
- `game.js` — game data, doll rendering, round/judging logic
- `test.js` — smoke test: `node test.js`
