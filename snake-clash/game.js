/* Snake Clash — start as a baby snake, eat balls and smaller snakes, grow long. */
'use strict';

const $ = (id) => document.getElementById(id);

const COLS = 24, ROWS = 18;
const TICK = 220;          // ms per move — slow enough for little hands
const BALLS = 10;          // balls on the field at once
const BABY = 3;            // every snake starts this long
const RIVALS = 3;
const BEST_KEY = 'snakeClashBest';

const DIRS = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
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
const onBoard = (c) => c.x >= 0 && c.y >= 0 && c.x < COLS && c.y < ROWS;
const snakes = (s) => [s.player, ...s.rivals].filter((sn) => sn && sn.alive);
const hits = (snake, c) => snake.cells.some((seg) => same(seg, c));

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
  const free = freeCells(s).filter((c) => c.x > 2 && c.x < COLS - 3 && c.y > 1 && c.y < ROWS - 2);
  const head = free.length ? pick(s, free) : { x: 2, y: 2 };
  const dir = pick(s, DIR_NAMES);
  const back = DIRS[OPPOSITE[dir]];
  snake.cells = Array.from({ length: BABY }, (_, i) => ({ x: head.x + back.x * i, y: head.y + back.y * i }));
  snake.dir = snake.nextDir = dir;
  snake.alive = true;
  return snake;
}

function startGame(seed) {
  state.seed = seed;
  state.over = false;
  state.balls = [];
  state.player = { id: 'you', cells: [], dir: 'right', nextDir: 'right', alive: true, skin: { body: '#5cb85c', head: '#2f7d4f' } };
  state.rivals = [];
  state.player.cells = [{ x: 5, y: 9 }, { x: 4, y: 9 }, { x: 3, y: 9 }];
  for (let i = 0; i < RIVALS; i++) {
    const r = { id: `rival${i}`, cells: [], dir: 'left', nextDir: 'left', alive: true, skin: RIVAL_SKINS[i % RIVAL_SKINS.length] };
    state.rivals.push(hatch(state, r));
  }
  while (state.balls.length < BALLS) newBall(state);
}

const len = (sn) => sn.cells.length;

/* A turn sticks unless it doubles back into your own neck. */
function turn(sn, dir) {
  if (!DIRS[dir] || dir === OPPOSITE[sn.dir]) return false;
  sn.nextDir = dir;
  return true;
}

/* Rivals chase the nearest ball and stay clear of snakes their own size or bigger.
   Snakes never die on their own body — you can slither straight through yourself. */
function rivalDir(s, sn) {
  const head = sn.cells[0];
  const scary = snakes(s).filter((o) => o !== sn && len(o) >= len(sn));
  const target = s.balls
    .map((b) => ({ b, d: Math.abs(b.x - head.x) + Math.abs(b.y - head.y) }))
    .sort((a, b) => a.d - b.d)[0];

  const options = DIR_NAMES
    .filter((d) => d !== OPPOSITE[sn.dir])
    .map((d) => ({ d, c: { x: head.x + DIRS[d].x, y: head.y + DIRS[d].y } }))
    .filter(({ c }) => onBoard(c) && !scary.some((o) => hits(o, c)));

  if (!options.length) return sn.dir;
  if (!target) return pick(s, options).d;
  options.sort((a, b) =>
    (Math.abs(a.c.x - target.b.x) + Math.abs(a.c.y - target.b.y)) -
    (Math.abs(b.c.x - target.b.x) + Math.abs(b.c.y - target.b.y)));
  return options[0].d;
}

const grow = (sn, n) => {
  const tail = sn.cells[sn.cells.length - 1];
  for (let i = 0; i < n; i++) sn.cells.push({ ...tail });
};

/* One tick: everybody moves, then we work out who bumped into whom.
   Bumping a snake SHORTER than you: you swallow it and grow. Same size or
   bigger, or a wall: you're done. Returns 'ok' | 'eat' | 'dead' (for the player). */
function tick(s) {
  if (s.over) return 'dead';
  const movers = snakes(s);
  const before = movers.map((sn) => ({ sn, cells: sn.cells, size: len(sn) }));

  // 1. where does everyone want to go?
  for (const sn of movers) {
    if (sn !== s.player) sn.nextDir = rivalDir(s, sn);
    sn.dir = sn.nextDir;
    const d = DIRS[sn.dir];
    sn.head = { x: sn.cells[0].x + d.x, y: sn.cells[0].y + d.y };
  }

  const doomed = new Set();
  const gains = new Map();

  // 2. walls
  for (const sn of movers) if (!onBoard(sn.head)) doomed.add(sn);

  // 3. snake vs snake — sizes are compared as they were at the start of the tick
  for (const { sn, size } of before) {
    if (doomed.has(sn)) continue;
    for (const other of before) {
      if (other.sn === sn) continue;                       // your own body is safe to cross
      const bumped = other.cells.some((seg) => same(seg, sn.head)) || same(other.sn.head, sn.head);
      if (!bumped) continue;
      if (size > other.size) gains.set(sn, Math.max(2, Math.floor(other.size / 2)));
      else doomed.add(sn);
    }
  }

  // 4. balls
  let ate = false;
  for (const sn of movers) {
    if (doomed.has(sn)) continue;
    const i = s.balls.findIndex((b) => same(b, sn.head));
    if (i < 0) continue;
    s.balls.splice(i, 1);
    gains.set(sn, (gains.get(sn) || 0) + 1);
    if (sn === s.player) ate = true;
  }

  // 5. everybody slithers forward
  for (const sn of movers) {
    if (doomed.has(sn)) continue;
    sn.cells.unshift(sn.head);
    const gain = gains.get(sn) || 0;
    if (gain) grow(sn, gain - 1); else sn.cells.pop();
    if (gain && sn === s.player) ate = true;
  }

  // 6. clean up the fallen: rivals hatch again as babies, the player's run ends
  for (const sn of doomed) {
    sn.alive = false;
    if (sn === s.player) s.over = true;
  }
  for (const r of s.rivals) if (!r.alive) hatch(s, r);
  while (s.balls.length < BALLS) newBall(s);
  for (const sn of movers) delete sn.head;

  if (s.over) return 'dead';
  return ate || gains.has(s.player) ? 'eat' : 'ok';
}

/* ============================== DRAWING ============================== */
function drawSnake(sn) {
  const body = sn.cells.slice(1).map((seg, i) => {
    const fade = i % 2 ? .88 : 1;
    return `<rect x="${seg.x + .06}" y="${seg.y + .06}" width=".88" height=".88" rx=".3" fill="${sn.skin.body}" opacity="${fade}"/>`;
  }).join('');
  const h = sn.cells[0];
  const d = DIRS[sn.dir];
  const across = { x: -d.y, y: d.x };
  const eye = (side) => {
    const ex = h.x + .5 + across.x * side * .22 + d.x * .16;
    const ey = h.y + .5 + across.y * side * .22 + d.y * .16;
    return `<circle cx="${ex}" cy="${ey}" r=".14" fill="#fff"/>
      <circle cx="${ex + d.x * .05}" cy="${ey + d.y * .05}" r=".07" fill="#3a3a48"/>`;
  };
  return `${body}
    <rect x="${h.x + .02}" y="${h.y + .02}" width=".96" height=".96" rx=".34" fill="${sn.skin.head}"/>
    ${eye(1)}${eye(-1)}`;
}

function drawBoard(s) {
  let grid = '';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if ((x + y) % 2 === 0) grid += `<rect x="${x}" y="${y}" width="1" height="1" fill="#c9ecab"/>`;
    }
  }
  const balls = s.balls.map((b) => `
    <circle cx="${b.x + .5}" cy="${b.y + .5}" r=".3" fill="${b.color}"/>
    <circle cx="${b.x + .38}" cy="${b.y + .38}" r=".09" fill="#fff" opacity=".65"/>`).join('');

  /* smallest first, so the big snakes sit on top */
  const drawn = snakes(s).sort((a, b) => len(a) - len(b)).map(drawSnake).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COLS} ${ROWS}" class="board">
    <rect x="0" y="0" width="${COLS}" height="${ROWS}" fill="#b8e394"/>
    ${grid}${balls}${drawn}</svg>`;
}

/* ============================== LOOP + UI ============================== */
let timer = null;

function loop() {
  const res = tick(state);
  render();
  if (res === 'dead') return gameOver();
  timer = setTimeout(loop, TICK);
}

function render() {
  $('board').innerHTML = drawBoard(state);
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
  $('overlay-over').classList.add('hidden');
  show('screen-play');
  render();
  timer = setTimeout(loop, 800);   // a beat to get your finger ready
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
    if (!document.hidden) timer = setTimeout(loop, TICK);
  });
  window.addEventListener('beforeunload', (e) => {
    if (state.player && !state.over && len(state.player) > BABY) { e.preventDefault(); e.returnValue = ''; }
  });
}
