# The Ice Cream Shop 🍨

Build your dream ice cream! A kid-friendly sandbox for the browser, made for iPads.

**Play:** open `index.html` in any browser — no install, no build, works offline.

## How it works

1. Pick a cone — sugar, waffle, cake, or a cup
2. Scoop from the freezer: up to **3 scoops**, each can be a different flavor
3. Or pull a lever on the soft serve machine for a swirl (twist too!)
4. Toggle mix-ins (banana, choco chips, cookie bits, gummies, marshmallows) — they show up inside the ice cream
5. Pile on toppings: sprinkles, candy gems, whipped cream, cherry, cookie, gummy bear
6. **Serve it!** Everything costs $0.00 — free ice cream 🍒

## Tech

Plain HTML/CSS/JavaScript, zero dependencies. The creation is one generated SVG; scoops, swirls, bits, and toppings are layered shapes with deterministic sprinkle placement (no shimmer on re-render).

Smoke test: `node test.js`
