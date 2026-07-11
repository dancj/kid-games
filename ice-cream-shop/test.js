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
    return t[k];
  },
  set(t, k, v) { t[k] = v; return true; },
});

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

// every flavor as 1, 2, 3 scoops on every cone
for (const c of g.CONES) {
  g.build.cone = c;
  for (const f of g.FLAVORS) {
    g.build.scoops = [f];
    ok(g.drawCreation(), `1 scoop ${f.id} on ${c.id}`);
    g.build.scoops = [f, f, f];
    ok(g.drawCreation(), `3 scoops ${f.id} on ${c.id}`);
  }
}

// soft serve on every cone
for (const c of g.CONES) {
  g.build.cone = c;
  for (const s of g.SOFT) { g.build.soft = s; g.build.scoops = []; ok(g.drawCreation(), `soft ${s.id} on ${c.id}`); }
}

// everything at once: 3 scoops + all mixins + all toppings
g.reset();
g.build.scoops = [g.FLAVORS[3], g.FLAVORS[4], g.FLAVORS[0]];
g.MIXINS.forEach(m => g.build.mixins.add(m.id));
g.TOPPINGS.forEach(t => g.build.toppings.add(t.id));
ok(g.drawCreation(), 'kitchen sink');

// act() rules: 3-scoop cap, soft replaces scoops
g.reset();
g.act('scoop', 'vanilla'); g.act('scoop', 'chocolate'); g.act('scoop', 'mango'); g.act('scoop', 'bubblegum');
assert(g.build.scoops.length === 3, 'max 3 scoops');
g.act('soft', 'softtwist');
assert(g.build.soft && g.build.scoops.length === 0, 'soft serve replaces scoops');
g.act('scoop', 'vanilla');
assert(!g.build.soft && g.build.scoops.length === 1, 'scooping clears soft serve');

console.log('all checks passed');
