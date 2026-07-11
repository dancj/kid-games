# CLAUDE.md

Kid-friendly browser games, built for iPad Safari, hosted on GitHub Pages.

## Rules

- **Plain HTML/CSS/JS only.** No frameworks, no build step, no dependencies. Each game must run by opening its `index.html` (works offline; Google Fonts degrade gracefully).
- One folder per game: `index.html` + `style.css` + `game.js` + `test.js` + `README.md`.
- Root `index.html` is the arcade landing page — add a card for every new game. Also add a row to root `README.md` (with a Pages play link).
- Audience is young kids on iPads: tap-only (no drag), big touch targets, `touch-action: manipulation`, no-zoom viewport, bright friendly visuals, minimal reading. Fredoka font with Chalkboard SE fallback.
- Support landscape and portrait via `max-aspect-ratio` media queries. Respect `prefers-reduced-motion`.
- Add a `beforeunload` guard when leaving mid-game would lose progress.

## Patterns that work here

- All art is generated inline SVG built from template strings in `game.js` (layered groups; swap paths/fills to change looks). No image assets.
- Random-looking placement (sprinkles, toppings) must be deterministic — seeded LCG (`s = (s * 9301 + 49297) % 233280`) so re-renders don't shimmer.
- Screens are sibling `<div class="screen">`s toggled with an `.active` class; overlays use `.overlay` + `.hidden`.
- Progression = items with an `unlock` threshold (round number or money earned); locked items render grayed with 🔒 instead of hidden.
- "Save picture" buttons rasterize the SVG through a canvas → PNG download.
- Game rules that judge the player (star scoring, riddle checks) live in pure functions so tests can call them directly.

## Testing

Each game has `test.js`: run `node test.js` from the game folder. It stubs `document`/`window` with a tiny Proxy, `eval`s `game.js`, and asserts on the pure logic (scoring, generators, SVG output contains no `undefined`/`NaN`). Keep new logic testable the same way; run tests before committing.

## Publishing

GitHub Pages serves `main` branch root. `git push` = deploy (~1 min). Commit only when asked; never push without an explicit OK.

## Process

Games are designed with/for kids: build fast, they playtest on an iPad, feedback arrives as bullet lists, iterate. Keep prose short. When a riddle/scoring rule confuses a kid playtester, favor the generous interpretation (e.g. cheese never counts against a topping count in Pizzeria).
