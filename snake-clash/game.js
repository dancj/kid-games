/* Snake Clash — start as a baby snake, eat balls and smaller snakes, grow long. */
'use strict';

const $ = (id) => document.getElementById(id);

const COLS = 24, ROWS = 18;
const SLOW = 400;          // ms per move for a baby snake — nice and gentle
const FAST = 130;          // the quickest it ever gets
const RAMP = 9;            // ms shaved off per segment you grow
const BALLS = 10;          // balls on the field at once
const BABY = 3;            // every snake starts this long
const RIVALS = 3;
const BEST_KEY = 'snakeClashBest';

const DIRS = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const ANGLE = { right: 0, down: 90, left: 180, up: 270 };
const DIR_NAMES = Object.keys(DIRS);

const RIVAL_SKINS = [
  { body: '#8e5bd6', head: '#6b3fb0' },
  { body: '#ff8c42', head: '#d96a20' },
  { body: '#3a86ff', head: '#2361c9' },
  { body: '#ec3f8f', head: '#b92468' },
];
const BALL_COLORS = ['#ffd23f', '#e63946', '#2fb3a8', '#ff8fc7', '#b6e26a'];

/* ============================== STATE ============================== */
const state = { player: null, rivals: [], balls: [], seed: 1, over: false };

/* Seeded LCG — same seed, same game (so the tests can pin it down). */
function rnd(s) {
  s.seed = (s.seed * 9301 + 49297) % 233280;
  return s.seed / 233280;
}
const pick = (s, arr) => arr[Math.floor(rnd(s) * arr.length)];

const same = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y;
/* The garden has no walls — slither off one edge and you come back on the other. */
const wrap = (c) => ({ x: (c.x + COLS) % COLS, y: (c.y + ROWS) % ROWS });
const ahead = (cell, dir) => wrap({ x: cell.x + DIRS[dir].x, y: cell.y + DIRS[dir].y });
const snakes = (s) => [s.player, ...s.rivals].filter((sn) => sn && sn.alive);
const hits = (snake, c) => snake.cells.some((seg) => same(seg, c));
const len = (sn) => sn.cells.length;

/* Bigger snake = faster snake. */
const speedOf = (s) => Math.max(FAST, SLOW - (len(s.player) - BABY) * RAMP);

function freeCells(s) {
  const out = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = { x, y };
      if (!snakes(s).some((sn) => hits(sn, c)) && !s.balls.some((b) => same(b, c))) out.push(c);
    }
  }
  return out;
}

function newBall(s) {
  const free = freeCells(s);
  if (free.length) s.balls.push({ ...pick(s, free), color: pick(s, BALL_COLORS) });
}

/* A baby snake, dropped somewhere with room to slither. */
function hatch(s, snake) {
  const free = freeCells(s);
  const head = free.length ? pick(s, free) : { x: 2, y: 2 };
  const dir = pick(s, DIR_NAMES);
  const back = DIRS[OPPOSITE[dir]];
  snake.cells = Array.from({ length: BABY }, (_, i) => wrap({ x: head.x + back.x * i, y: head.y + back.y * i }));
  snake.dir = snake.nextDir = dir;
  snake.alive = true;
  return snake;
}

function startGame(seed) {
  state.seed = seed;
  state.over = false;
  state.balls = [];
  state.player = { id: 'you', cells: [], dir: 'right', nextDir: 'right', alive: true, skin: { body: '#5cb85c', head: '#2f7d4f' } };
  state.player.cells = [{ x: 5, y: 9 }, { x: 4, y: 9 }, { x: 3, y: 9 }];
  state.rivals = [];
  for (let i = 0; i < RIVALS; i++) {
    const r = { id: `rival${i}`, cells: [], dir: 'left', nextDir: 'left', alive: true, skin: RIVAL_SKINS[i % RIVAL_SKINS.length] };
    state.rivals.push(hatch(state, r));
  }
  while (state.balls.length < BALLS) newBall(state);
}

/* A turn sticks unless it doubles back into your own neck. */
function turn(sn, dir) {
  if (!DIRS[dir] || dir === OPPOSITE[sn.dir]) return false;
  sn.nextDir = dir;
  return true;
}

/* Shortest gap between two cells, remembering the board wraps. */
function gap(a, b) {
  const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
  return Math.min(dx, COLS - dx) + Math.min(dy, ROWS - dy);
}

/* Rivals chase the nearest ball and stay clear of snakes BIGGER than they are.
   Snakes never die on their own body — you can slither straight through yourself. */
function rivalDir(s, sn) {
  const head = sn.cells[0];
  const scary = snakes(s).filter((o) => o !== sn && len(o) > len(sn));
  const target = s.balls.map((b) => ({ b, d: gap(b, head) })).sort((a, b) => a.d - b.d)[0];

  const options = DIR_NAMES
    .filter((d) => d !== OPPOSITE[sn.dir])
    .map((d) => ({ d, c: ahead(head, d) }))
    .filter(({ c }) => !scary.some((o) => hits(o, c)));

  if (!options.length) return sn.dir;
  if (!target) return pick(s, options).d;
  options.sort((a, b) => gap(a.c, target.b) - gap(b.c, target.b));
  return options[0].d;
}

const grow = (sn, n) => {
  const tail = sn.cells[sn.cells.length - 1];
  for (let i = 0; i < n; i++) sn.cells.push({ ...tail });
};

/* One tick: everybody moves, then we work out who bumped into whom.
   Bumping a snake SHORTER than you: you swallow it and grow. Bumping a BIGGER
   one: you're done. Same size: you slide past each other, no harm done.
   Returns 'ok' | 'eat' | 'dead' (for the player). */
function tick(s) {
  if (s.over) return 'dead';
  const movers = snakes(s);
  const before = movers.map((sn) => ({ sn, cells: sn.cells, size: len(sn) }));

  for (const sn of movers) {
    if (sn !== s.player) sn.nextDir = rivalDir(s, sn);
    sn.dir = sn.nextDir;
    sn.head = ahead(sn.cells[0], sn.dir);
  }

  const doomed = new Set();
  const gains = new Map();

  // snake vs snake — sizes are compared as they stood at the start of the tick
  for (const { sn, size } of before) {
    for (const other of before) {
      if (other.sn === sn) continue;                       // your own body is safe to cross
      const bumped = other.cells.some((seg) => same(seg, sn.head)) || same(other.sn.head, sn.head);
      if (!bumped || size === other.size) continue;        // same size: no harm either way
      if (size > other.size) gains.set(sn, Math.max(2, Math.floor(other.size / 2)));
      else doomed.add(sn);
    }
  }

  // balls
  let ate = false;
  for (const sn of movers) {
    if (doomed.has(sn)) continue;
    const i = s.balls.findIndex((b) => same(b, sn.head));
    if (i < 0) continue;
    s.balls.splice(i, 1);
    gains.set(sn, (gains.get(sn) || 0) + 1);
    if (sn === s.player) ate = true;
  }

  // everybody slithers forward
  for (const sn of movers) {
    if (doomed.has(sn)) continue;
    sn.cells.unshift(sn.head);
    const gain = gains.get(sn) || 0;
    if (gain) grow(sn, gain - 1); else sn.cells.pop();
    if (gain && sn === s.player) ate = true;
  }

  // the fallen: rivals hatch again as babies, the player's run ends
  for (const sn of doomed) {
    sn.alive = false;
    if (sn === s.player) s.over = true;
  }
  for (const r of s.rivals) if (!r.alive) hatch(s, r);
  while (s.balls.length < BALLS) newBall(s);
  for (const sn of movers) delete sn.head;

  if (s.over) return 'dead';
  return ate ? 'eat' : 'ok';
}

/* ============================== DRAWING ============================== */
/* The board is built once and then nudged: each segment keeps its own element
   and CSS eases it to its new square, so the snakes glide instead of snapping.
   drawBoard() is the from-scratch version — used for the first paint. */
function drawBoard(s) {
  let grid = '';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if ((x + y) % 2 === 0) grid += `<rect x="${x}" y="${y}" width="1" height="1" fill="#c9ecab"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COLS} ${ROWS}" class="board">
    <rect x="0" y="0" width="${COLS}" height="${ROWS}" fill="#b8e394"/>
    ${grid}<g id="ballLayer"></g><g id="snakeLayer"></g></svg>`;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs) => {
  const n = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

/* Move a node, but never let it slide across the whole board: a snake that
   wrapped round the edge (or a rival that just hatched) must teleport. */
function place(node, x, y, angle) {
  const prev = node._at;
  const jump = !prev || Math.abs(prev.x - x) > 1.01 || Math.abs(prev.y - y) > 1.01;
  if (jump) node.style.transition = 'none';
  node.setAttribute('transform', `translate(${x} ${y})${angle === undefined ? '' : ` rotate(${angle} .5 .5)`}`);
  if (jump) {
    void node.getBoundingClientRect();     // let the jump land before easing resumes
    node.style.transition = '';
  }
  node._at = { x, y };
}

const skins = new Map();   // snake id -> { g, segs, eyes }

function renderSnakes(s) {
  const layer = $('snakeLayer');
  const alive = snakes(s).sort((a, b) => len(a) - len(b));   // big snakes ride on top

  for (const [id, kit] of skins) {
    if (!alive.some((sn) => sn.id === id)) { kit.g.remove(); skins.delete(id); }
  }

  for (const sn of alive) {
    let kit = skins.get(sn.id);
    if (!kit) {
      const g = el('g', {});
      const eyes = el('g', { class: 'eyes' });
      for (const side of [-1, 1]) {
        eyes.appendChild(el('circle', { cx: .66, cy: .5 + side * .22, r: .14, fill: '#fff' }));
        eyes.appendChild(el('circle', { cx: .72, cy: .5 + side * .22, r: .07, fill: '#3a3a48' }));
      }
      kit = { g, segs: [], eyes };
      g.appendChild(eyes);
      layer.appendChild(g);
      skins.set(sn.id, kit);
    }
    layer.appendChild(kit.g);   // re-stack smallest-first

    while (kit.segs.length < len(sn)) {
      const r = el('rect', { width: .9, height: .9, rx: .3, class: 'seg' });
      kit.segs.push(r);
      kit.g.insertBefore(r, kit.eyes);
    }
    while (kit.segs.length > len(sn)) kit.segs.pop().remove();

    sn.cells.forEach((c, i) => {
      const r = kit.segs[i];
      r.setAttribute('fill', i === 0 ? sn.skin.head : sn.skin.body);
      r.setAttribute('opacity', i && i % 2 ? .9 : 1);
      place(r, c.x + .05, c.y + .05);
    });
    place(kit.eyes, sn.cells[0].x, sn.cells[0].y, ANGLE[sn.dir]);
  }
}

function renderBalls(s) {
  $('ballLayer').innerHTML = s.balls.map((b) => `
    <circle cx="${b.x + .5}" cy="${b.y + .5}" r=".3" fill="${b.color}" class="ball"/>
    <circle cx="${b.x + .38}" cy="${b.y + .38}" r=".09" fill="#fff" opacity=".65"/>`).join('');
}

/* ============================== LOOP + UI ============================== */
let timer = null;

function loop() {
  const res = tick(state);
  render();
  if (res === 'dead') return gameOver();
  timer = setTimeout(loop, speedOf(state));
}

function render() {
  const board = $('board');
  if (!board.querySelector('svg')) { board.innerHTML = drawBoard(state); skins.clear(); }
  board.querySelector('svg').style.setProperty('--tick', `${speedOf(state)}ms`);
  renderBalls(state);
  renderSnakes(state);

  $('score').textContent = `🐍 ${len(state.player)}`;
  $('best').textContent = `🏆 ${best()}`;
  const biggest = state.rivals.filter((r) => r.alive).reduce((m, r) => Math.max(m, len(r)), 0);
  $('rivalSize').textContent = `Biggest rival: ${biggest}`;
}

const best = () => { try { return +localStorage.getItem(BEST_KEY) || 0; } catch { return 0; } };
const saveBest = (n) => { try { if (n > best()) localStorage.setItem(BEST_KEY, n); } catch { /* private mode */ } };

function gameOver() {
  clearTimeout(timer);
  const score = len(state.player);
  const wasBest = score > best();
  saveBest(score);
  $('overTitle').textContent = wasBest ? 'New best! 🏆' : 'Gulp! 😵';
  $('overScore').textContent = `You grew to ${score} long`;
  $('overlay-over').classList.remove('hidden');
}

function play() {
  clearTimeout(timer);
  startGame(Date.now() % 233280);
  $('board').innerHTML = '';
  skins.clear();
  $('overlay-over').classList.add('hidden');
  show('screen-play');
  render();
  timer = setTimeout(loop, 900);   // a beat to get your finger ready
}

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $(id).classList.add('active');
}

/* Swipe anywhere on the board to steer; arrow keys work on a laptop. */
function wireControls() {
  const board = $('board');
  let sx = 0, sy = 0;
  board.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
  board.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;   // a tap, not a swipe
    turn(state.player, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  window.addEventListener('keydown', (e) => {
    const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
    if (dir) { e.preventDefault(); turn(state.player, dir); }
  });
}

/* ============================== WIRING ============================== */
if (typeof document !== 'undefined' && document.addEventListener) {
  wireControls();
  $('btnPlay').addEventListener('click', play);
  $('btnAgain').addEventListener('click', play);
  $('btnQuit').addEventListener('click', () => {
    $('overlay-over').classList.add('hidden');
    show('screen-title');
  });
  $('best').textContent = `🏆 ${best()}`;

  document.addEventListener('visibilitychange', () => {
    if (!state.player || state.over) return;
    clearTimeout(timer);
    if (!document.hidden) timer = setTimeout(loop, speedOf(state));
  });
  window.addEventListener('beforeunload', (e) => {
    if (state.player && !state.over && len(state.player) > BABY) { e.preventDefault(); e.returnValue = ''; }
  });
}
