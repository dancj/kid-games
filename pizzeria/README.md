# Pizzeria 🍕

Run your own pizza shop! Customers order in riddles — build the right pizza before their patience runs out.

**Play:** open `index.html` in any browser — no install, no build, works offline.

## How it works

1. A customer appears with a riddle order: *"Margot wants 3 toppings but does NOT like mushrooms!"* — read aloud automatically, and the 🔊 button repeats it (great for pre-readers). The patience clock only starts on your first build tap.
2. Tap topping drawers to build the pizza (tap again to take one off)
3. Bake it before the patience bar empties — slow service means grumpy faces, and they'll storm off!
4. When the oven dings, tap the pizza to slice it into 8 perfect slices
5. Get paid per pizza; correct orders + fast service earn big tips
6. Earning money unlocks new toppings ($15, $30, $50, $75, $100 milestones)
7. At $50 earned, **half & half orders** appear — different toppings on each side!
8. Between days, visit the **store**: buy faster ovens, or decorations that spruce up your shop and add +$1 to every tip (spending never re-locks toppings — unlocks track lifetime earnings)

Wrong pizza = half price and no tip, with the real order revealed so you learn the riddle.

## Tech

Plain HTML/CSS/JavaScript, zero dependencies. Pizza is a generated top-down SVG; riddle orders are templates with a `check(pizza)` predicate, so every order is verifiable and always solvable with the toppings you've unlocked.

Smoke test: `node test.js`
