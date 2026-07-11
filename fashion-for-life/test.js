/* Tiny smoke test: node test.js — stubs the DOM, loads game.js, checks judging. */
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
    return t[k];
  },
  set(t, k, v) { t[k] = v; return true; },
});

global.document = {
  getElementById: fakeEl,
  querySelector: () => Object.assign(fakeEl(), { addEventListener() {} }),
  querySelectorAll: () => [],
  createElement: fakeEl,
};

const src = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
// expose internals for the test
eval(src + '\nmodule.exports = { state, freshLook, judgePlayer, THEMES, NAILS, LIPS, SHADOW, DRESSES, SHOES, ACCS, HAIR_COLORS, drawDoll, rivalScore };');
const g = module.exports;

// bare look = low score
g.state.round = 0;
g.state.look = g.freshLook();
const bare = g.judgePlayer();
assert(bare <= 2, `bare look should score low, got ${bare}`);

// full on-theme Princess Party look = high score
g.state.look = {
  nails: g.NAILS.find(n => n.id === 'n1'),        // pink
  lips: g.LIPS.find(l => l.id === 'l1'),          // pink
  shadow: g.SHADOW.find(s => s.id === 's4'),      // pink fancy
  blush: { id: 'b1', c: '#ffb3c8', tags: ['pink', 'cute'] },
  hairStyle: { id: 'h1', tags: ['fancy'] },
  hairColor: g.HAIR_COLORS[0],
  dress: g.DRESSES.find(d => d.id === 'd1'),      // fancy pink
  shoes: g.SHOES.find(s => s.id === 'sh3'),       // fancy
  acc: g.ACCS.find(a => a.id === 'a3'),           // fancy
};
const themed = g.judgePlayer();
assert(themed >= 4, `on-theme look should score >=4, got ${themed}`);
assert(themed > bare, 'themed must beat bare');

// off-theme look scores between
g.state.look.nails = g.NAILS.find(n => n.id === 'n4'); // mint
g.state.look.dress = g.DRESSES.find(d => d.id === 'd3'); // casual
const off = g.judgePlayer();
assert(off < themed, `off-theme (${off}) should be < themed (${themed})`);

// rival scores in range at every round
for (let r = 0; r < 5; r++) {
  g.state.round = r;
  for (let i = 0; i < 50; i++) {
    const s = g.rivalScore();
    assert(s >= 2 && s <= 4.5, `rival score out of range: ${s}`);
  }
}

// doll renders valid-ish SVG for every dress/shoe combo and every pose
g.state.round = 5;
const look = g.freshLook();
for (const d of g.DRESSES) for (const s of g.SHOES) {
  look.dress = d; look.shoes = s;
  const svg = g.drawDoll(look, '#e0ac69');
  assert(svg.includes('<svg') && !svg.includes('undefined'), `bad svg for ${d.id}/${s.id}`);
}
for (const pose of ['rest', 'hips', 'wave', 'star']) {
  const svg = g.drawDoll(look, '#8d5524', pose);
  assert(svg.includes('<svg') && !svg.includes('undefined'), `bad svg for pose ${pose}`);
}

console.log(`all checks passed (bare=${bare}, themed=${themed}, off=${off})`);
