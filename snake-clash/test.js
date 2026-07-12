/* Tiny smoke test: node test.js — stubs the DOM, loads game.js, checks the snake rules. */
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
global.localStorage = { getItem: () => null, setItem() {} };
global.document = {
  getElementById: fakeEl,
  querySelector: fakeEl,
  querySelectorAll: () => [],
  createElement: fakeEl,
  addEventListener: null, // skips the UI wiring block
};

const src = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
eval(src + '\nmodule.exports = { COLS, ROWS, BABY, BALLS, state, startGame, tick, turn, drawBoard, len, hatch };');
const g = module.exports;

const ok = (svg, label) => assert(svg.includes('<svg') && !svg.includes('undefined') && !svg.includes('NaN'), `bad svg: ${label}`);
const park = (s) => s.rivals.forEach((r) => { r.cells = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }]; r.alive = false; });
const clear = (s) => { s.balls = []; park(s); };

// a fresh game: one baby player, rivals hatched, balls scattered
g.startGame(7);
const s = g.state;
assert(g.len(s.player) === g.BABY, 'you start as a baby snake');
assert(s.rivals.length === 3 && s.rivals.every((r) => r.alive && g.len(r) === g.BABY), 'rivals hatch as babies too');
assert(s.balls.length === g.BALLS, 'the field is stocked with balls');
ok(g.drawBoard(s), 'fresh board');

// plain slithering: move along, no growth
clear(s);
s.player.cells = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
s.player.dir = s.player.nextDir = 'right';
assert(g.tick(s) === 'ok', 'a plain move is fine');
assert(g.len(s.player) === 3 && s.player.cells[0].x === 6, 'the snake moved without growing');

// U-turns refused, right angles fine
assert(!g.turn(s.player, 'left'), 'no doubling back into your own neck');
assert(g.turn(s.player, 'up'), 'a right-angle turn works');

// balls: eat one, get longer
clear(s);
s.player.cells = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
s.player.dir = s.player.nextDir = 'right';
s.balls = [{ x: 6, y: 5, color: '#ffd23f' }];
assert(g.tick(s) === 'eat', 'sliding onto a ball eats it');
assert(g.len(s.player) === 4, 'a ball makes you one longer');
assert(s.balls.length === g.BALLS, 'the field restocks itself');

// you can slither straight through your own tail
clear(s);
s.player.cells = [{ x: 8, y: 5 }, { x: 7, y: 5 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 9, y: 5 }];
s.player.dir = s.player.nextDir = 'right';
g.turn(s.player, 'down');
assert(g.tick(s) !== 'dead', 'your own body is safe to cross');
assert(!s.over, 'still alive after crossing yourself');

// a smaller snake is lunch
g.startGame(21);
clear(s);
s.player.cells = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }, { x: 1, y: 5 }, { x: 0, y: 5 }];
s.player.dir = s.player.nextDir = 'right';
const small = s.rivals[0];
small.alive = true;
small.cells = [{ x: 6, y: 5 }, { x: 6, y: 6 }];   // 2 long, right in front
small.dir = small.nextDir = 'down';
const wasLen = g.len(s.player);
assert(g.tick(s) === 'eat', 'bumping a smaller snake eats it');
assert(g.len(s.player) > wasLen, 'swallowing a snake makes you longer');
assert(!s.over, 'you survive eating a smaller snake');
assert(s.rivals.every((r) => r.alive && g.len(r) === g.BABY || g.len(r) > 0), 'an eaten rival hatches again');

// a bigger snake eats you
g.startGame(33);
clear(s);
s.player.cells = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
s.player.dir = s.player.nextDir = 'right';
const big = s.rivals[0];
big.alive = true;
big.cells = [{ x: 6, y: 5 }, { x: 6, y: 6 }, { x: 6, y: 7 }, { x: 6, y: 8 }, { x: 6, y: 9 }];
big.dir = big.nextDir = 'up';
assert(g.tick(s) === 'dead', 'bumping a bigger snake ends your run');
assert(s.over, 'game over');
assert(g.tick(s) === 'dead', 'a dead snake stays dead');
ok(g.drawBoard(s), 'board after being eaten');

// walls end the run
g.startGame(5);
clear(s);
s.player.cells = [{ x: g.COLS - 1, y: 5 }, { x: g.COLS - 2, y: 5 }, { x: g.COLS - 3, y: 5 }];
s.player.dir = s.player.nextDir = 'right';
assert(g.tick(s) === 'dead', 'the wall is the wall');

// rivals keep playing by themselves without falling apart
g.startGame(99);
for (let i = 0; i < 60 && !s.over; i++) {
  g.tick(s);
  assert(s.balls.length === g.BALLS, `balls restocked on tick ${i}`);
  assert(s.rivals.every((r) => r.alive && g.len(r) >= g.BABY), `rivals alive on tick ${i}`);
  assert(s.rivals.every((r) => r.cells.every((c) => c.x >= 0 && c.y >= 0 && c.x < g.COLS && c.y < g.ROWS)), `rivals stay on the board on tick ${i}`);
}
ok(g.drawBoard(s), 'board after a long run');

console.log('all checks passed');
