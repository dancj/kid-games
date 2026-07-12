/* Tiny smoke test: node test.js — stubs the DOM, loads game.js, checks the grids + painting. */
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
    if (k === 'appendChild' || k === 'remove' || k === 'animate' || k === 'addEventListener') return () => {};
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
  addEventListener: null, // skips the UI wiring block
};

const src = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
eval(src + '\nmodule.exports = { PALETTE, SCENES, W, H, state, buildCells, startScene, paint, isDone, leftToGo, drawScene, ink };');
const g = module.exports;

const nums = new Set(g.PALETTE.map((p) => p.n));
assert(nums.size === g.PALETTE.length, 'palette numbers are unique');

for (const scene of g.SCENES) {
  const cells = g.buildCells(scene);
  assert(cells.length === g.W * g.H, `${scene.id}: one square per grid slot`);
  cells.forEach((n, i) => assert(nums.has(n), `${scene.id}: square ${i} wants palette colour ${n}`));

  // a picture nobody wants to colour: needs a decent spread of numbers
  const used = new Set(cells);
  assert(used.size >= 6, `${scene.id}: uses at least 6 colours (got ${used.size})`);

  const blank = cells.map(() => false);
  const done = cells.map(() => true);
  const half = cells.map((_, i) => i % 2 === 0);
  for (const [painted, label] of [[blank, 'blank'], [half, 'half'], [done, 'done']]) {
    const svg = g.drawScene(scene, cells, painted, 3);
    assert(svg.startsWith('<svg') && !svg.includes('undefined') && !svg.includes('NaN'), `${scene.id} ${label}: bad svg`);
  }
  // numbers show only while unpainted; every square is its own tappable group
  assert((g.drawScene(scene, cells, blank, 0).match(/<text/g) || []).length === cells.length, `${scene.id}: every blank square shows its number`);
  assert(!g.drawScene(scene, cells, done, 0).includes('<text'), `${scene.id}: finished picture has no numbers`);
  assert((g.drawScene(scene, cells, blank, 0).match(/data-i=/g) || []).length === cells.length, `${scene.id}: every square is tappable`);
}

// painting rules
g.startScene('spring');
const total = g.state.cells.length;
g.state.sel = g.state.cells[0] === 1 ? 2 : 1;
assert(g.paint(0) === 'wrong', 'wrong colour does not paint');
assert(!g.state.painted[0], 'square stays blank after a wrong tap');

g.state.sel = g.state.cells[0];
assert(g.paint(0) === 'painted', 'right colour paints');
assert(g.paint(0) === 'wrong', 'an already-painted square cannot be repainted');
assert(g.leftToGo() === total - 1, 'progress counts down');

g.state.cells.forEach((n, i) => { g.state.sel = n; const res = g.paint(i); if (i === total - 1) assert(res === 'done', 'last square reports done'); });
assert(g.isDone(), 'scene is finished');

// starting a scene clears the paint
g.startScene('winter');
assert(g.leftToGo() === g.state.cells.length, 'new scene starts blank');

// swatch text contrast flips on light colours
assert(g.ink('#ffffff') === '#3a3a48' && g.ink('#23407a') === '#fff', 'label ink contrasts with the swatch');

console.log('all checks passed');
