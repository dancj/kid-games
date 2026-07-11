# Pizzeria 🍕

Run your own pizza shop! Customers order in riddles — build the right pizza before their patience runs out.

**Play:** open `index.html` in any browser — no install, no build, works offline.

## How it works

1. A customer appears with a riddle order: *"Margot wants 3 toppings but does NOT like mushrooms!"*
2. Tap topping drawers to build the pizza (tap again to take one off)
3. Serve before the patience bar empties — slow service means grumpy faces, and they'll storm off!
4. Get paid per pizza; correct orders + fast service earn big tips
5. Earn money to unlock new toppings ($15, $30, $50, $75, $100 milestones)
6. At $50, **half & half orders** appear — different toppings on each side!

Wrong pizza = half price and no tip, with the real order revealed so you learn the riddle.

## Tech

Plain HTML/CSS/JavaScript, zero dependencies. Pizza is a generated top-down SVG; riddle orders are templates with a `check(pizza)` predicate, so every order is verifiable and always solvable with the toppings you've unlocked.

Smoke test: `node test.js`
