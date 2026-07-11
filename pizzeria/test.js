/* Tiny smoke test: node test.js — stubs the DOM, loads game.js, checks riddles & rendering. */
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
eval(src + '\nmodule.exports = { state, freshPizza, unionSet, TEMPLATES, TOPPINGS, newOrder, drawPizza, ovenSvg, pieceSvg, spotsFor, HALF_UNLOCK, UPGRADES, bakeMs, decoCount, canBuy, buyUpgrade, CUTS_NEEDED, speak, stopSpeaking };');
const g = module.exports;

const P = (whole = [], left = [], right = []) => ({ whole: new Set(whole), left: new Set(left), right: new Set(right) });
const tpl = (id) => g.TEMPLATES.find(t => t.id === id);

g.state.earned = 0;
const nonBase = g.TOPPINGS.filter(t => !t.tags.includes('base'));

// plain: sauce and cheese are always allowed
let o = tpl('plain').make('Andy');
assert(o.check(P()), 'plain: empty pizza correct');
assert(o.check(P(['sauce', 'xcheese'])), 'plain: sauce + extra cheese still counts as plain');
assert(!o.check(P(['olive'])), 'plain: topping = wrong');

// meats: "cheesy pizza with N meats"
g.state.earned = 999; // unlock everything so templates can use all toppings
for (let i = 0; i < 50; i++) {
  o = tpl('meats').make('Andy');
  const n = +o.text.match(/(\d+) different meats/)[1];
  const meats = nonBase.filter(t => t.tags.includes('meat')).slice(0, n).map(t => t.id);
  assert(o.check(P(['sauce', 'xcheese', ...meats])), `meats: cheese + ${n} meats correct`);
  assert(!o.check(P(['sauce', ...meats])), 'meats: missing cheese = wrong');
  assert(!o.check(P(['xcheese', ...meats, 'olive'])), 'meats: extra veggie = wrong');
}

// dislike: cheese on top must not break the count
for (let i = 0; i < 50; i++) {
  o = tpl('dislike').make('Margot');
  const n = +o.text.match(/wants (\d+) toppings/)[1];
  const hatedName = o.text.match(/NOT like (.+)\./)[1];
  const hated = g.TOPPINGS.find(t => t.name.toLowerCase() === hatedName);
  assert(hated, `dislike: hated topping "${hatedName}" resolvable`);
  const others = nonBase.filter(t => t.id !== hated.id).slice(0, n).map(t => t.id);
  assert(o.check(P(others)), 'dislike: n others correct');
  assert(o.check(P(['sauce', 'xcheese', ...others])), 'dislike: extra cheese does not spoil the count');
  assert(!o.check(P([hated.id, ...others.slice(1)])), 'dislike: includes hated = wrong');
}

// veggie only
o = tpl('veggie').make('Zoe');
{
  const n = +o.text.match(/(\d+) toppings/)[1];
  const veg = nonBase.filter(t => t.tags.includes('veggie')).slice(0, n).map(t => t.id);
  assert(o.check(P(veg)), 'veggie: all veggies correct');
  assert(o.check(P(['xcheese', ...veg])), 'veggie: cheese allowed');
  assert(!o.check(P([...veg.slice(1), 'pepperoni'])), 'veggie: meat = wrong');
}

// half & half
o = tpl('half').make('Leo');
{
  const m = o.text.match(/wants (.+) on one half and (.+) on the other/);
  const a = g.TOPPINGS.find(t => t.name.toLowerCase() === m[1]);
  const b = g.TOPPINGS.find(t => t.name.toLowerCase() === m[2]);
  assert(o.check(P([], [a.id], [b.id])), 'half: correct split');
  assert(o.check(P(['sauce', 'xcheese'], [b.id], [a.id])), 'half: base items on whole are fine');
  assert(!o.check(P([a.id, b.id])), 'half: both on whole = wrong');
  assert(!o.check(P([], [a.id, b.id], [])), 'half: both on same half = wrong');
}

// every unlocked-state generator produces valid orders without throwing
for (const earned of [0, 20, 40, 60, 80, 120]) {
  g.state.earned = earned;
  for (let i = 0; i < 100; i++) {
    g.state.served = i % 10;
    const ord = g.newOrder();
    assert(ord.text && ord.text.length > 10, 'order has text');
    assert(typeof ord.check === 'function', 'order has check');
    ord.check(P());          // never throws on empty
    ord.check(P(['olive'])); // or simple pizza
  }
}

// pizza renders every topping in every region, no NaN/undefined
g.state.earned = 999;
for (const t of g.TOPPINGS) {
  for (const region of ['whole', 'left', 'right']) {
    g.state.pizza = P();
    g.state.pizza[region].add(t.id);
    const svg = g.drawPizza();
    assert(svg.includes('<svg') && !svg.includes('undefined') && !svg.includes('NaN'), `bad svg ${t.id} ${region}`);
  }
}

// half spots stay on their half
for (const t of g.TOPPINGS) {
  g.spotsFor(t.id, 'left', 8).forEach(([x]) => assert(x <= 131, `left spot leaked right: ${t.id} x=${x}`));
  g.spotsFor(t.id, 'right', 8).forEach(([x]) => assert(x >= 129, `right spot leaked left: ${t.id} x=${x}`));
}

// baked + sliced pizza and oven render clean
g.state.pizza = P(['sauce', 'pepperoni']);
for (let cuts = 0; cuts <= g.CUTS_NEEDED; cuts++) {
  const svg = g.drawPizza({ baked: true, cuts });
  assert(!svg.includes('undefined') && !svg.includes('NaN'), `bad sliced svg cuts=${cuts}`);
  assert(svg.split('<line').length - 1 >= cuts, `missing cut lines at cuts=${cuts}`);
}
{
  const svg = g.ovenSvg();
  assert(svg.includes('<svg') && !svg.includes('undefined') && !svg.includes('NaN'), 'bad oven svg');
}

// oven upgrades shorten bake time
g.state.owned = new Set();
const slow = g.bakeMs();
g.state.owned.add('oven2');
const fast = g.bakeMs();
g.state.owned.add('oven3');
const turbo = g.bakeMs();
assert(slow > fast && fast > turbo, 'each oven upgrade bakes faster');

// store: buy rules — afford, no double-buy, oven3 needs oven2, spending never re-locks toppings
g.state.owned = new Set();
g.state.money = 50;
g.state.earned = 999;
assert(!g.canBuy(g.UPGRADES.find(u => u.id === 'oven3')), 'oven3 locked without oven2');
g.buyUpgrade('plant');
assert(g.state.money === 35 && g.state.owned.has('plant'), 'plant bought, money deducted');
g.buyUpgrade('plant');
assert(g.state.money === 35, 'no double-buy');
g.buyUpgrade('cat'); // costs 100 > 35
assert(!g.state.owned.has('cat') && g.state.money === 35, 'cannot afford cat');
assert(g.decoCount() === 1, 'one decoration owned');
assert(g.TOPPINGS.every(t => t.unlock <= g.state.earned), 'earned untouched by spending — toppings stay unlocked');

// speech is a safe no-op where speechSynthesis is unavailable
g.speak();
g.stopSpeaking();

console.log('all checks passed');
