/* Tiny smoke test: node test.js — stubs the DOM, loads game.js, checks rendering. */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const fakeEl = () => new Proxy({}, {
  get(t, k) {
    if (k === 'classList') return { add() {}, remove() {}, toggle() {} };
    if (k === 'querySelectorAll') return () => [];
    if (k === 'style') return {};
    if (k === 'dataset') return {};
    if (k === 'appendChild') return () => {};
    if (k === 'animate') return () => {};
    if (k === 'remove') return () => {};
    if (k === 'addEventListener') return () => {};
    return t[k];
  },
  set(t, k, v) { t[k] = v; return true; },
});

global.window = { addEventListener() {} };
global.document = {
  getElementById: fakeEl,
  querySelector: fakeEl,
  querySelectorAll: () => [],
  createElement: fakeEl,
};

const src = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
eval(src + '\nmodule.exports = { build, drawCreation, act, reset, CONES, FLAVORS, SOFT, MIXINS, TOPPINGS };');
const g = module.exports;

const ok = (svg, label) => assert(svg.includes('<svg') && !svg.includes('undefined') && !svg.includes('NaN'), `bad svg: ${label}`);

// every cone renders empty
for (const c of g.CONES) { g.build.cone = c; ok(g.drawCreation(), `cone ${c.id}`); }

const scoop = (f) => ({ f, tops: new Set() });

// every flavor as 1, 2, 3 scoops on every cone
for (const c of g.CONES) {
  g.build.cone = c;
  for (const f of g.FLAVORS) {
    g.build.scoops = [scoop(f)];
    ok(g.drawCreation(), `1 scoop ${f.id} on ${c.id}`);
    g.build.scoops = [scoop(f), scoop(f), scoop(f)];
    ok(g.drawCreation(), `3 scoops ${f.id} on ${c.id}`);
    ok(g.drawCreation(true), `interactive 3 scoops on ${c.id}`);
  }
}

// soft serve on every cone
for (const c of g.CONES) {
  g.build.cone = c;
  for (const s of g.SOFT) { g.build.soft = s; g.build.scoops = []; ok(g.drawCreation(), `soft ${s.id} on ${c.id}`); }
}

// everything at once: 3 scoops, all mixins, all toppings on every scoop
g.reset();
g.build.scoops = [scoop(g.FLAVORS[3]), scoop(g.FLAVORS[4]), scoop(g.FLAVORS[0])];
g.MIXINS.forEach(m => g.build.mixins.add(m.id));
g.build.scoops.forEach(s => g.TOPPINGS.forEach(t => s.tops.add(t.id)));
ok(g.drawCreation(true), 'kitchen sink');

// act() rules: 3-scoop cap, soft replaces scoops, per-scoop topping target
g.reset();
g.act('scoop', 'vanilla'); g.act('scoop', 'chocolate'); g.act('scoop', 'mango'); g.act('scoop', 'bubblegum');
assert(g.build.scoops.length === 3, 'max 3 scoops');
assert(g.build.sel === 2, 'newest scoop selected');
g.act('topping', 'cherry');
assert(g.build.scoops[2].tops.has('cherry') && !g.build.scoops[0].tops.has('cherry'), 'topping lands on selected scoop only');
g.build.sel = 0;
g.act('topping', 'bear');
assert(g.build.scoops[0].tops.has('bear') && !g.build.scoops[2].tops.has('bear'), 'topping follows selection');
g.act('soft', 'softtwist');
assert(g.build.soft && g.build.scoops.length === 0, 'soft serve replaces scoops');
g.act('topping', 'rainbow');
assert(g.build.softTops.has('rainbow'), 'toppings work on soft serve');
g.act('scoop', 'vanilla');
assert(!g.build.soft && g.build.scoops.length === 1, 'scooping clears soft serve');

console.log('all checks passed');
