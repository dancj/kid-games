/* Color by Number — pixel grid. Tap a numbered color, tap every square wearing that number. */
'use strict';

const $ = (id) => document.getElementById(id);

/* ============================== PALETTE ============================== */
/* Numbers are stable across every scene, so kids learn "3 is yellow". */
const PALETTE = [
  { n: 1, name: 'Red', hex: '#e63946' },
  { n: 2, name: 'Orange', hex: '#ff8c42' },
  { n: 3, name: 'Yellow', hex: '#ffd23f' },
  { n: 4, name: 'Cream', hex: '#fff3d6' },
  { n: 5, name: 'Lime', hex: '#b6e26a' },
  { n: 6, name: 'Green', hex: '#5cb85c' },
  { n: 7, name: 'Pine', hex: '#2f7d4f' },
  { n: 8, name: 'Mint', hex: '#9ee6c9' },
  { n: 9, name: 'Teal', hex: '#2fb3a8' },
  { n: 10, name: 'Sky', hex: '#8fd6ff' },
  { n: 11, name: 'Blue', hex: '#3a86ff' },
  { n: 12, name: 'Navy', hex: '#23407a' },
  { n: 13, name: 'Purple', hex: '#8e5bd6' },
  { n: 14, name: 'Lavender', hex: '#d4bbff' },
  { n: 15, name: 'Pink', hex: '#ff8fc7' },
  { n: 16, name: 'Hot Pink', hex: '#ec3f8f' },
  { n: 17, name: 'Peach', hex: '#ffc7a1' },
  { n: 18, name: 'Brown', hex: '#8b5a2b' },
  { n: 19, name: 'Sand', hex: '#d2a35e' },
  { n: 20, name: 'Gray', hex: '#9aa5b1' },
  { n: 21, name: 'White', hex: '#ffffff' },
  { n: 22, name: 'Black', hex: '#3a3a48' },
  { n: 23, name: 'Berry', hex: '#b0305e' },
  { n: 24, name: 'Ice', hex: '#e6f4ff' },
];

const hexOf = (n) => (PALETTE.find((p) => p.n === n) || {}).hex;
const ink = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.62 ? '#3a3a48' : '#fff';
};

/* ============================== SCENES ============================== */
/* Every scene is a W×H grid of squares. px(x, y) says which palette number a
   square wants — first test that matches wins, so foreground goes on top. */
const W = 24, H = 18;

const inC = (x, y, cx, cy, r) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r;
const inE = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
const inR = (x, y, x0, y0, w, h) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h;
/* pine tier: cone widening as it falls from (cx, top) down to baseline */
const inCone = (x, y, cx, top, base, spread) =>
  y >= top && y <= base && Math.abs(x + 0.5 - cx) <= (y - top + 1) * spread;

const SCENES = [
  {
    id: 'spring', name: 'Spring', emoji: '🌷',
    px(x, y) {
      if (inR(x, y, 18, 4, 1, 3)) return 22;                       // butterfly body
      if (inC(x, y, 16.5, 5, 1.6)) return 16;                      // butterfly wings
      if (inC(x, y, 20.5, 5, 1.6)) return 2;
      if (inC(x, y, 21, 2.5, 3)) return 3;                         // sun
      if (inE(x, y, 7, 2.5, 3.5, 1.6) || inE(x, y, 9.5, 2.2, 2, 1.2)) return 21;  // cloud
      if (inC(x, y, 2.6, 8.2, 2)) return 7;                        // tree
      if (inC(x, y, 7.6, 8.2, 2)) return 5;
      if (inC(x, y, 5, 7, 3.5)) return 6;
      if (inR(x, y, 4, 9, 2, 4)) return 18;
      if (inC(x, y, 12.5, 13.5, 1.6)) return 1;                    // tulips
      if (inR(x, y, 12, 14, 1, 3)) return 7;
      if (inC(x, y, 15.5, 14.5, 1.5)) return 15;
      if (inR(x, y, 15, 15, 1, 2)) return 7;
      if (inC(x, y, 18.5, 14.5, 1.5)) return 13;
      if (inR(x, y, 18, 15, 1, 2)) return 7;
      if (inC(x, y, 22, 15.5, 2)) return 7;                        // bush
      if (inE(x, y, 2, 16, 2.5, 1.2)) return 20;                   // rock
      if (inC(x, y, 3, 14, 3) || inC(x, y, 20.5, 14, 3)) return 5; // hill bumps
      if (y >= 13) return 6;                                       // grass
      return 10;                                                   // sky
    },
  },
  {
    id: 'summer', name: 'Summer', emoji: '🏖️',
    px(x, y) {
      if (inC(x, y, 3, 2.5, 3)) return 3;                          // sun
      if (inE(x, y, 18, 2, 3.5, 1.5)) return 21;                   // cloud
      if (y >= 6 && y <= 9 && x >= 19 && x <= 19 + (y - 6)) return 15;  // sail
      if (inR(x, y, 17, 10, 6, 2)) return 18;                      // boat hull
      if (inR(x, y, 11, 8, 1, 6)) return 18;                       // umbrella pole
      if (y <= 8 && inC(x, y, 11.5, 8.5, 4.6)) {                   // umbrella panels
        if (x < 9) return 1;
        if (x < 11) return 21;
        if (x < 13) return 3;
        return 11;
      }
      if (inC(x, y, 19.5, 15, 3)) {                                // beach ball
        if (inE(x, y, 19.5, 15, 1.2, 3)) return 16;
        if (inE(x, y, 19.5, 15, 3, 1.2)) return 9;
        return 21;
      }
      if (inR(x, y, 3, 13, 4, 4)) return 1;                        // bucket
      if (inR(x, y, 9, 13, 1, 3)) return 18;                       // spade handle
      if (y >= 16 && y <= 17 && Math.abs(x - 9) <= 17 - y) return 20;   // spade blade
      if (inE(x, y, 14.5, 15.5, 2, 1.5)) return 15;                // shell
      if (inE(x, y, 22, 17, 2, 1)) return 20;                      // pebble
      if (y >= 12) return 19;                                      // sand
      if (y >= 8) return 11;                                       // sea
      return 10;                                                   // sky
    },
  },
  {
    id: 'autumn', name: 'Autumn', emoji: '🍂',
    px(x, y) {
      if (inC(x, y, 2.5, 2, 2.5)) return 2;                        // sun
      if (inE(x, y, 9, 2, 3, 1.4)) return 21;                      // clouds
      if (inE(x, y, 18.5, 3.5, 2.5, 1.2)) return 24;
      if (inC(x, y, 12, 2.8, 2.5)) return 23;                      // canopy
      if (inC(x, y, 8.5, 7.5, 2.5)) return 2;
      if (inC(x, y, 15.5, 7.5, 2.5)) return 3;
      if (inC(x, y, 12, 6, 4)) return 1;
      if (inR(x, y, 11, 8, 2, 5)) return 18;                       // trunk
      if (inC(x, y, 4, 10, 1)) return 2;                           // falling leaves
      if (inC(x, y, 6, 14, 1)) return 1;
      if (inC(x, y, 19.5, 10.5, 1)) return 3;
      if (inC(x, y, 22, 14, 1)) return 2;
      if (inR(x, y, 19, 12, 1, 1)) return 7;                       // pumpkin stem
      if (inE(x, y, 19.5, 15.5, 3, 2.5)) return 2;                 // pumpkin
      if (inR(x, y, 15, 15, 1, 1)) return 7;                       // little pumpkin
      if (inE(x, y, 15.5, 16.5, 2, 1.5)) return 3;
      if (inC(x, y, 3, 14, 2)) return 23;                          // bush
      if (inC(x, y, 2, 12.5, 3)) return 6;                         // grassy hill
      if (y >= 12) return 19;                                      // ground
      return 17;                                                   // sky
    },
  },
  {
    id: 'winter', name: 'Winter', emoji: '⛄',
    px(x, y) {
      if (inC(x, y, 20.5, 2.5, 2.5)) return 4;                     // moon
      for (const [sx, sy] of [[3, 1], [8, 3], [14, 1], [17, 5], [6, 7]]) {
        if (x === sx && y === sy) return 3;                        // stars
      }
      if (inR(x, y, 11, 1, 2, 2)) return 22;                       // hat top
      if (inR(x, y, 10, 3, 4, 1)) return 1;                        // hat band
      if (inR(x, y, 10, 4, 4, 1)) return 22;                       // hat brim
      if ((x === 11 || x === 13) && y === 6) return 22;            // eyes
      if (x === 13 && y === 7) return 2;                           // carrot nose
      if (inR(x, y, 13, 9, 1, 3) || inR(x, y, 10, 9, 4, 1)) return 16;  // scarf
      if (inR(x, y, 8, 10, 2, 1) || inR(x, y, 15, 10, 2, 1)) return 18; // arms
      if (x === 12 && (y === 11 || y === 12)) return 22;           // buttons
      if (x === 12 && y === 14) return 13;
      if (inC(x, y, 12.5, 7, 1.9) || inC(x, y, 12, 11, 2.4) || inC(x, y, 12, 15, 3.2)) return 21;  // snowman
      if (inR(x, y, 3, 12, 1, 2) || inR(x, y, 21, 12, 1, 2)) return 18;  // pine trunks
      if (inCone(x, y, 3.5, 9, 12, 0.8) || inCone(x, y, 21.5, 10, 12, 0.7)) return 6;  // lower boughs
      if (inCone(x, y, 3.5, 6, 9, 0.7) || inCone(x, y, 21.5, 7, 10, 0.6)) return 7;    // upper boughs
      if (y >= 11) return 24;                                      // snow
      return 12;                                                   // night sky
    },
  },
];

const BLANK = '#eceef3';
const buildCells = (scene) => {
  const cells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells.push(scene.px(x, y));
  return cells;
};

/* ============================== STATE ============================== */
const state = { scene: null, cells: [], painted: [], sel: 1 };

function startScene(id) {
  state.scene = SCENES.find((s) => s.id === id);
  state.cells = buildCells(state.scene);
  state.painted = state.cells.map(() => false);
  state.sel = 1;
}

/* Returns 'painted' | 'wrong' | 'done'. */
function paint(i) {
  if (state.painted[i] || state.cells[i] !== state.sel) return 'wrong';
  state.painted[i] = true;
  return isDone() ? 'done' : 'painted';
}

const isDone = () => state.painted.every(Boolean);
const leftToGo = () => state.painted.filter((p) => !p).length;

/* ============================== DRAWING ============================== */
/* One <g> per square: a rect plus its number, so painting can patch a single
   square instead of rebuilding 432 of them. sel = number to highlight (0 = none). */
function drawScene(scene, cells, painted, sel) {
  let body = '';
  for (let i = 0; i < cells.length; i++) {
    const x = i % W, y = (i / W) | 0;
    const n = cells[i];
    const done = painted[i];
    const cls = done ? 'cell done' : n === sel ? 'cell hl' : 'cell';
    body += `<g data-i="${i}"><rect x="${x}" y="${y}" width="1" height="1" fill="${done ? hexOf(n) : BLANK}" class="${cls}"/>`;
    body += done ? '' : `<text x="${x + 0.5}" y="${y + 0.68}" font-size="0.52" text-anchor="middle" fill="#7a7a8c" font-weight="600" pointer-events="none">${n}</text>`;
    body += '</g>';
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="scene" shape-rendering="crispEdges">` +
    `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${body}</svg>`;
}

const ALL_DONE = (cells) => cells.map(() => true);

/* ============================== UI ============================== */
function renderPalette() {
  $('palette').innerHTML = PALETTE.map((p) => `
    <button class="swatch ${p.n === state.sel ? 'sel' : ''}" data-n="${p.n}"
      style="background:${p.hex};color:${ink(p.hex)}" aria-label="${p.name}, number ${p.n}">
      <span class="sw-num">${p.n}</span>
    </button>`).join('');
}

function renderScene() {
  $('canvas').innerHTML = drawScene(state.scene, state.cells, state.painted, state.sel);
  updateProgress();
  $('sceneName').textContent = `${state.scene.emoji} ${state.scene.name}`;
}

function updateProgress() {
  const left = leftToGo();
  $('progress').textContent = left ? `${left} squares left` : 'All done! 🎉';
}

function renderPicker() {
  $('sceneList').innerHTML = SCENES.map((s) => {
    const cells = buildCells(s);
    return `<button class="scene-card" data-scene="${s.id}">
      <div class="thumb">${drawScene(s, cells, ALL_DONE(cells), 0)}</div>
      <div class="scene-title">${s.emoji} ${s.name}</div>
    </button>`;
  }).join('');
}

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $(id).classList.add('active');
}

/* Repaint highlights in place — cheaper than rebuilding the whole grid. */
function pickColor(n) {
  state.sel = n;
  document.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('sel', +b.dataset.n === n));
  document.querySelectorAll('#canvas g[data-i]').forEach((g) => {
    const i = +g.dataset.i;
    const rect = g.firstChild;
    rect.classList.toggle('hl', !state.painted[i] && state.cells[i] === n);
  });
}

/* quiet = mid-swipe, so squares you merely brush past don't scold you */
function tapCell(g, quiet) {
  const i = +g.dataset.i;
  const rect = g.firstChild;
  const res = paint(i);
  if (res === 'wrong') {
    if (quiet || state.painted[i]) return;
    rect.classList.remove('nope');
    void rect.getBoundingClientRect();
    rect.classList.add('nope');
    setTimeout(() => rect.classList.remove('nope'), 400);
    return;
  }
  rect.setAttribute('fill', hexOf(state.cells[i]));
  rect.setAttribute('class', 'cell done');
  const label = g.querySelector('text');
  if (label) label.remove();
  updateProgress();
  if (res === 'done') setTimeout(finish, 400);
}

/* Tap or swipe: dragging across squares fills every matching one it crosses. */
function wireCanvas() {
  const canvas = $('canvas');
  let drawing = false, last = -1;

  const at = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    return el && el.closest ? el.closest('g[data-i]') : null;
  };

  canvas.addEventListener('pointerdown', (e) => {
    const g = at(e);
    if (!g) return;
    drawing = true;
    last = +g.dataset.i;
    canvas.setPointerCapture(e.pointerId);
    tapCell(g, false);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const g = at(e);
    if (!g || +g.dataset.i === last) return;
    last = +g.dataset.i;
    tapCell(g, true);
  });

  const stop = () => { drawing = false; last = -1; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}

function finish() {
  $('doneTitle').textContent = `You colored ${state.scene.name}!`;
  $('donePic').innerHTML = drawScene(state.scene, state.cells, state.painted, 0);
  $('overlay-done').classList.remove('hidden');
}

function savePicture() {
  const svg = drawScene(state.scene, state.cells, state.painted, 0).replace('<svg ', '<svg width="800" height="600" ');
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = 800; cv.height = 680;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 800, 680);
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = '#4a2b5f';
    ctx.font = 'bold 40px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.scene.emoji} ${state.scene.name}`, 400, 650);
    cv.toBlob((b) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = `${state.scene.id}-coloring.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    });
  };
  img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}

function openScene(id) {
  startScene(id);
  renderPalette();
  renderScene();
  show('screen-color');
}

/* ============================== WIRING ============================== */
if (typeof document !== 'undefined' && document.addEventListener) {
  renderPicker();

  $('sceneList').addEventListener('click', (e) => {
    const card = e.target.closest('[data-scene]');
    if (card) openScene(card.dataset.scene);
  });

  $('palette').addEventListener('click', (e) => {
    const sw = e.target.closest('[data-n]');
    if (sw) pickColor(+sw.dataset.n);
  });

  wireCanvas();

  $('btnBack').addEventListener('click', () => {
    if (!isDone() && state.painted.some(Boolean) && !confirm('Leave this picture? Your colors will be lost.')) return;
    show('screen-pick');
  });

  $('btnSave').addEventListener('click', savePicture);
  $('btnAgain').addEventListener('click', () => { openScene(state.scene.id); $('overlay-done').classList.add('hidden'); });
  $('btnPickNew').addEventListener('click', () => { $('overlay-done').classList.add('hidden'); show('screen-pick'); });

  window.addEventListener('beforeunload', (e) => {
    if (state.scene && !isDone() && state.painted.some(Boolean)) { e.preventDefault(); e.returnValue = ''; }
  });
}
