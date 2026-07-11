/* Pizzeria — riddle orders, patience clock, tips & topping unlocks. No dependencies. */
'use strict';

/* ============================== DATA ============================== */

// unlock = money threshold to earn the topping (0 = start)
// 'base' items (sauce, extra cheese) never count as "toppings" in riddles
const TOPPINGS = [
  { id: 'sauce', name: 'Tomato Sauce', tags: ['base'], unlock: 0 },
  { id: 'xcheese', name: 'Extra Cheese', tags: ['base', 'cheese'], unlock: 0 },
  { id: 'pepperoni', name: 'Pepperoni', tags: ['meat'], unlock: 0 },
  { id: 'sausage', name: 'Sausage', tags: ['meat'], unlock: 0 },
  { id: 'mushroom', name: 'Mushrooms', tags: ['veggie'], unlock: 0 },
  { id: 'pepper', name: 'Green Peppers', tags: ['veggie', 'green'], unlock: 0 },
  { id: 'olive', name: 'Olives', tags: ['veggie'], unlock: 0 },
  { id: 'tomato', name: 'Tomatoes', tags: ['veggie'], unlock: 0 },
  { id: 'ham', name: 'Ham', tags: ['meat'], unlock: 15 },
  { id: 'onion', name: 'Red Onions', tags: ['veggie'], unlock: 15 },
  { id: 'bacon', name: 'Bacon', tags: ['meat'], unlock: 30 },
  { id: 'pineapple', name: 'Pineapple', tags: ['fruit'], unlock: 30 },
  { id: 'basil', name: 'Basil', tags: ['veggie', 'green'], unlock: 50 },
  { id: 'chicken', name: 'Chicken', tags: ['meat'], unlock: 75 },
  { id: 'jalapeno', name: 'Jalapeños', tags: ['veggie', 'green', 'spicy'], unlock: 75 },
  { id: 'spinach', name: 'Spinach', tags: ['veggie', 'green'], unlock: 100 },
  { id: 'corn', name: 'Sweet Corn', tags: ['veggie'], unlock: 100 },
];

const HALF_UNLOCK = 50; // $ earned before half-and-half orders appear

// Store upgrades — bought with spendable money (unlocks key off lifetime earnings, so
// spending never re-locks toppings). Decorations each add +$1 to every tip.
const UPGRADES = [
  { id: 'oven2', name: 'Speedy Oven', emoji: '🔥', cost: 40, desc: 'Bakes twice as fast!' },
  { id: 'oven3', name: 'Turbo Oven', emoji: '🚀', cost: 120, desc: 'Bakes in a flash!', needs: 'oven2' },
  { id: 'plant', name: 'Potted Plant', emoji: '🪴', cost: 15, desc: 'A touch of green. +$1 tips!', deco: true },
  { id: 'lights', name: 'Fairy Lights', emoji: '✨', cost: 25, desc: 'Cozy sparkle. +$1 tips!', deco: true },
  { id: 'jukebox', name: 'Jukebox', emoji: '📻', cost: 50, desc: 'Parlor tunes. +$1 tips!', deco: true },
  { id: 'disco', name: 'Disco Ball', emoji: '🪩', cost: 75, desc: 'Pizza party! +$1 tips!', deco: true },
  { id: 'cat', name: 'Pizzeria Cat', emoji: '🐈', cost: 100, desc: 'Purr-fect greeter. +$1 tips!', deco: true },
];

const CUTS_NEEDED = 4; // taps to slice a pizza into 8

const NAMES = ['Andy', 'Margot', 'Zoe', 'Leo', 'Ruby', 'Max', 'Mia', 'Sam', 'Lily', 'Oscar', 'Nina', 'Theo'];
const FACES = ['🧑', '👧', '👦', '👵', '👴', '🧔', '👩', '🧒', '👱', '🧕'];

/* ============================== STATE ============================== */

const CUSTOMERS_PER_DAY = 5;

const state = {
  money: 0,        // spendable at the store
  earned: 0,       // lifetime earnings — drives topping unlocks
  owned: new Set(),
  served: 0,
  day: 1,
  dayServed: 0,
  dayEarned: 0,
  dayHappy: 0,
  customer: null,     // {name, face, order}
  patience: 1,        // 1 → 0
  patienceTotal: 50,  // seconds
  tickId: null,
  bakeId: null,
  slicing: false,
  cuts: 0,
  target: 'whole',
  pizza: null,        // {whole:Set, left:Set, right:Set}
};

function freshPizza() { return { whole: new Set(['sauce']), left: new Set(), right: new Set() }; }

function unlocked() { return TOPPINGS.filter(t => t.unlock <= state.earned); }
function pickable() { return unlocked().filter(t => !t.tags.includes('base')); } // riddle candidates
function halvesUnlocked() { return state.earned >= HALF_UNLOCK; }
function decoCount() { return UPGRADES.filter(u => u.deco && state.owned.has(u.id)).length; }
function bakeMs() { return state.owned.has('oven3') ? 1200 : state.owned.has('oven2') ? 2200 : 4000; }
function byId(id) { return TOPPINGS.find(t => t.id === id); }
function isBase(id) { return byId(id).tags.includes('base'); }

// union of all placements (generous: a half-topping still "counts" on whole-pizza orders)
function unionSet(p) { return new Set([...p.whole, ...p.left, ...p.right]); }
// real toppings only — sauce and cheese are free extras in every riddle except "cheesy" ones
function topsOf(p) { return [...unionSet(p)].filter(id => !isBase(id)); }

/* ============================== RIDDLE ORDERS ============================== */

const rnd = (n) => Math.floor(Math.random() * n);
const pickOne = (arr) => arr[rnd(arr.length)];
function pickSome(arr, n) {
  const pool = arr.slice();
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(rnd(pool.length), 1)[0]);
  return out;
}

// Each template returns {text, check(pizza), explain} — riddles only use unlocked toppings.
const TEMPLATES = [
  {
    id: 'plain',
    make(name) {
      return {
        text: `${name} wants a plain cheese pizza — nothing on top!`,
        check: (p) => topsOf(p).length === 0,
        explain: 'No toppings at all (sauce and cheese are fine).',
      };
    },
  },
  {
    id: 'exact',
    make(name) {
      const n = 2 + rnd(3);
      return {
        text: `${name} wants exactly ${n} toppings — chef's choice!`,
        check: (p) => topsOf(p).length === n,
        explain: `Any ${n} different toppings.`,
      };
    },
  },
  {
    id: 'meats',
    make(name) {
      const meats = pickable().filter(t => t.tags.includes('meat'));
      const n = Math.min(2 + rnd(2), meats.length);
      return {
        text: `${name} wants a cheesy pizza with ${n} different meats.`,
        check: (p) => {
          const tops = topsOf(p);
          return unionSet(p).has('xcheese') && tops.length === n && tops.every(id => byId(id).tags.includes('meat'));
        },
        explain: `Extra cheese plus ${n} meats — no other toppings.`,
      };
    },
  },
  {
    id: 'dislike',
    make(name) {
      const hated = pickOne(pickable());
      const n = 2 + rnd(2);
      return {
        text: `${name} wants ${n} toppings, but does NOT like ${hated.name.toLowerCase()}.`,
        check: (p) => { const tops = topsOf(p); return tops.length === n && !tops.includes(hated.id); },
        explain: `Any ${n} toppings, as long as none of them are ${hated.name.toLowerCase()}.`,
      };
    },
  },
  {
    id: 'duo',
    make(name) {
      const [a, b] = pickSome(pickable(), 2);
      return {
        text: `${name} wants ${a.name.toLowerCase()} and ${b.name.toLowerCase()} — that's it!`,
        check: (p) => { const tops = topsOf(p); return tops.length === 2 && tops.includes(a.id) && tops.includes(b.id); },
        explain: `Just ${a.name} and ${b.name}.`,
      };
    },
  },
  {
    id: 'veggie',
    make(name) {
      const veggies = pickable().filter(t => t.tags.includes('veggie'));
      const n = Math.min(2 + rnd(2), veggies.length);
      return {
        text: `${name} is vegetarian: ${n} toppings, veggies only!`,
        check: (p) => {
          const tops = topsOf(p);
          return tops.length === n && tops.every(id => byId(id).tags.includes('veggie'));
        },
        explain: `${n} toppings and every one a veggie.`,
      };
    },
  },
  {
    id: 'green',
    make(name) {
      const greens = pickable().filter(t => t.tags.includes('green'));
      const n = Math.min(1 + rnd(2), greens.length);
      return {
        text: `${name} wants a pizza as green as a frog — ${n} green topping${n > 1 ? 's' : ''} only!`,
        check: (p) => {
          const tops = topsOf(p);
          return tops.length === n && tops.every(id => byId(id).tags.includes('green'));
        },
        explain: `${n} green topping${n > 1 ? 's' : ''} (like peppers or basil) and nothing else.`,
      };
    },
    need: () => pickable().some(t => t.tags.includes('green')),
  },
  {
    id: 'spicy',
    make(name) {
      const n = 2 + rnd(2);
      return {
        text: `${name} dares you: ${n} toppings and at least one SPICY! 🌶`,
        check: (p) => {
          const tops = topsOf(p);
          return tops.length === n && tops.some(id => byId(id).tags.includes('spicy'));
        },
        explain: `${n} toppings including something spicy (jalapeños!).`,
      };
    },
    need: () => pickable().some(t => t.tags.includes('spicy')),
  },
  {
    id: 'fruity',
    make(name) {
      const n = 1 + rnd(2);
      return {
        text: `${name} wants something fruity — ${n} topping${n > 1 ? 's' : ''}, one must be a fruit!`,
        check: (p) => {
          const tops = topsOf(p);
          return tops.length === n && tops.some(id => byId(id).tags.includes('fruit'));
        },
        explain: `${n} topping${n > 1 ? 's' : ''} including pineapple.`,
      };
    },
    need: () => pickable().some(t => t.tags.includes('fruit')),
  },
  {
    id: 'half',
    make(name) {
      const [a, b] = pickSome(pickable(), 2);
      return {
        text: `${name} wants ${a.name.toLowerCase()} on one half and ${b.name.toLowerCase()} on the other!`,
        check: (p) => {
          if ([...p.whole].some(id => !isBase(id))) return false; // base items on the whole are fine
          const l = p.left, r = p.right;
          const is = (s, id) => s.size === 1 && s.has(id);
          return (is(l, a.id) && is(r, b.id)) || (is(l, b.id) && is(r, a.id));
        },
        explain: `${a.name} on one half, ${b.name} on the other — nothing extra on the whole pizza.`,
      };
    },
    need: () => halvesUnlocked(),
  },
];

function newOrder() {
  const easy = ['plain', 'exact', 'duo', 'dislike'];
  let pool = TEMPLATES.filter(t => !t.need || t.need());
  if (state.served < 3) pool = pool.filter(t => easy.includes(t.id));
  const name = pickOne(NAMES);
  const t = pickOne(pool);
  return { name, face: pickOne(FACES), ...t.make(name) };
}

/* ============================== PIZZA SVG ============================== */

// deterministic scatter positions inside the pizza (or one half)
function spotsFor(id, region, n) {
  let s = [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const pts = [];
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    let ang = (s / 233280) * Math.PI * 2;
    if (region === 'left') ang = Math.PI / 2 + (s / 233280) * Math.PI;        // x < center
    if (region === 'right') ang = -Math.PI / 2 + (s / 233280) * Math.PI;      // x > center
    s = (s * 9301 + 49297) % 233280;
    const rad = 18 + (s / 233280) * 58;
    pts.push([130 + Math.cos(ang) * rad, 130 + Math.sin(ang) * rad, s]);
  }
  return pts;
}

function pieceSvg(id, x, y, s) {
  switch (id) {
    case 'sauce': return `<circle cx="${x}" cy="${y}" r="11" fill="#d94f35"/><circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#ef6a56"/>`;
    case 'xcheese': return `<ellipse cx="${x}" cy="${y}" rx="13" ry="9" fill="#ffe9a8" opacity="0.9" transform="rotate(${s % 90} ${x} ${y})"/>`;
    case 'pepperoni': return `<circle cx="${x}" cy="${y}" r="10" fill="#c0392b"/><circle cx="${x}" cy="${y}" r="7.5" fill="#d95445"/><circle cx="${x - 2}" cy="${y - 2}" r="1.4" fill="#a52f22"/><circle cx="${x + 3}" cy="${y + 2}" r="1.4" fill="#a52f22"/>`;
    case 'sausage': return `<path d="M${x - 7} ${y} Q${x - 4} ${y - 7} ${x + 2} ${y - 5} Q${x + 8} ${y - 3} ${x + 6} ${y + 3} Q${x + 3} ${y + 7} ${x - 3} ${y + 5} Q${x - 8} ${y + 4} ${x - 7} ${y} Z" fill="#9c6644"/><circle cx="${x - 2}" cy="${y}" r="1.3" fill="#7a4c30"/>`;
    case 'mushroom': return `<path d="M${x - 8} ${y} Q${x - 8} ${y - 9} ${x} ${y - 9} Q${x + 8} ${y - 9} ${x + 8} ${y} Z" fill="#e8d5b8" stroke="#c9b28c" stroke-width="1.5"/><rect x="${x - 2.5}" y="${y}" width="5" height="7" rx="2" fill="#e8d5b8" stroke="#c9b28c" stroke-width="1.5"/>`;
    case 'pepper': return `<path d="M${x - 8} ${y - 4} Q${x} ${y - 12} ${x + 8} ${y - 4} Q${x + 4} ${y + 2} ${x} ${y - 2} Q${x - 4} ${y + 2} ${x - 8} ${y - 4} Z" fill="none" stroke="#5e9e4d" stroke-width="4" stroke-linecap="round" transform="rotate(${s % 180} ${x} ${y})"/>`;
    case 'olive': return `<circle cx="${x}" cy="${y}" r="7" fill="#3d3a33"/><circle cx="${x}" cy="${y}" r="3" fill="#d94f35"/>`;
    case 'tomato': return `<circle cx="${x}" cy="${y}" r="9" fill="#e04b3a"/><circle cx="${x}" cy="${y}" r="6" fill="#ef6a56"/><circle cx="${x - 2}" cy="${y - 2}" r="1.6" fill="#f7a08f"/>`;
    case 'ham': return `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="3" fill="#f2a0a8" transform="rotate(${s % 90} ${x} ${y})"/>`;
    case 'onion': return `<path d="M${x - 8} ${y} Q${x} ${y - 10} ${x + 8} ${y}" fill="none" stroke="#b07fc9" stroke-width="3.5" stroke-linecap="round" transform="rotate(${s % 180} ${x} ${y})"/><path d="M${x - 5} ${y + 3} Q${x} ${y - 4} ${x + 5} ${y + 3}" fill="none" stroke="#d8b3e8" stroke-width="2.5" stroke-linecap="round" transform="rotate(${s % 180} ${x} ${y})"/>`;
    case 'bacon': return `<path d="M${x - 9} ${y - 4} Q${x - 4} ${y - 8} ${x} ${y - 4} Q${x + 4} ${y} ${x + 9} ${y - 4} L${x + 9} ${y + 2} Q${x + 4} ${y + 6} ${x} ${y + 2} Q${x - 4} ${y - 2} ${x - 9} ${y + 2} Z" fill="#b5533c" transform="rotate(${s % 60 - 30} ${x} ${y})"/><path d="M${x - 8} ${y - 2} Q${x} ${y - 4} ${x + 8} ${y - 2}" stroke="#f2c9b8" stroke-width="2" fill="none" transform="rotate(${s % 60 - 30} ${x} ${y})"/>`;
    case 'pineapple': return `<path d="M${x - 9} ${y - 7} L${x + 9} ${y - 7} L${x + 4} ${y + 8} L${x - 4} ${y + 8} Z" fill="#ffd447" stroke="#e8b420" stroke-width="1.5" transform="rotate(${s % 120} ${x} ${y})"/>`;
    case 'basil': return `<path d="M${x} ${y - 9} Q${x + 9} ${y - 2} ${x} ${y + 9} Q${x - 9} ${y - 2} ${x} ${y - 9} Z" fill="#4e8a3d"/><path d="M${x} ${y - 7} L${x} ${y + 7}" stroke="#3a6b2c" stroke-width="1.4"/>`;
    case 'chicken': return `<path d="M${x - 7} ${y - 3} Q${x - 2} ${y - 8} ${x + 5} ${y - 5} Q${x + 9} ${y} ${x + 4} ${y + 5} Q${x - 3} ${y + 8} ${x - 7} ${y + 2} Z" fill="#f2dfc0" stroke="#d9bc94" stroke-width="1.5"/>`;
    case 'jalapeno': return `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="#5e9e4d" stroke-width="3.5"/><circle cx="${x}" cy="${y}" r="2.5" fill="#8fc97a"/>`;
    case 'spinach': return `<path d="M${x} ${y - 8} Q${x + 7} ${y - 3} ${x + 3} ${y + 6} Q${x} ${y + 8} ${x - 3} ${y + 6} Q${x - 7} ${y - 3} ${x} ${y - 8} Z" fill="#2e6b3d"/>`;
    case 'corn': return [[0, -4], [-5, 2], [5, 2], [0, 5], [-3, -1]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="2.6" fill="#ffd447" stroke="#e8b420" stroke-width="0.8"/>`).join('');
    default: return '';
  }
}

const CUT_ANGLES = [90, 0, 45, 135]; // degrees, in tap order

function cutLinesSvg(n) {
  return CUT_ANGLES.slice(0, n).map(deg => {
    const a = deg * Math.PI / 180;
    const dx = Math.cos(a) * 118, dy = Math.sin(a) * 118;
    return `<line x1="${130 - dx}" y1="${130 - dy}" x2="${130 + dx}" y2="${130 + dy}" stroke="#8a4b23" stroke-width="4" stroke-linecap="round" opacity="0.75"/>`;
  }).join('');
}

function drawPizzaInner(opts = {}) {
  const p = state.pizza;
  let bits = '';
  const put = (set, region) => set.forEach(id => {
    if (id === 'sauce') return; // sauce is a layer, not scattered pieces
    spotsFor(id, region, region === 'whole' ? 8 : 4).forEach(([x, y, s]) => { bits += pieceSvg(id, x, y, s); });
  });
  put(p.whole, 'whole'); put(p.left, 'left'); put(p.right, 'right');

  const divider = !opts.baked && halvesUnlocked() && (p.left.size || p.right.size)
    ? `<line x1="130" y1="34" x2="130" y2="226" stroke="#e8b45a" stroke-width="2" stroke-dasharray="6 6" opacity="0.7"/>` : '';
  const sauce = p.whole.has('sauce') ? `<circle cx="130" cy="130" r="102" fill="#d94f35"/>` : '';
  const bakedTint = opts.baked ? `<circle cx="130" cy="130" r="122" fill="#a85f1e" opacity="0.16"/>` : '';

  return `<circle cx="130" cy="130" r="122" fill="#e8b45a"/>
    <circle cx="130" cy="130" r="121" fill="none" stroke="#d09a3e" stroke-width="6" stroke-dasharray="2 9" opacity="0.6"/>
    ${sauce}
    <circle cx="130" cy="130" r="97" fill="#f7d872"/>
    <circle cx="112" cy="112" r="30" fill="#fbe28f" opacity="0.8"/>
    <circle cx="155" cy="150" r="24" fill="#fbe28f" opacity="0.6"/>
    ${bits}
    ${divider}
    ${bakedTint}
    ${cutLinesSvg(opts.cuts || 0)}`;
}

function drawPizza(opts) {
  return `<svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">${drawPizzaInner(opts)}</svg>`;
}

function ovenSvg() {
  const flames = [70, 120, 170, 220, 270].map((x, i) =>
    `<path class="flame f${i}" d="M${x} 252 Q${x - 9} 236 ${x} 220 Q${x + 9} 236 ${x} 252 Z" fill="#ff9f3a"/>
     <path class="flame f${(i + 2) % 5}" d="M${x} 250 Q${x - 4} 240 ${x} 232 Q${x + 4} 240 ${x} 250 Z" fill="#ffd447"/>`).join('');
  return `<svg viewBox="0 0 340 316" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="14" width="320" height="290" rx="20" fill="#9c6644"/>
    <rect x="10" y="14" width="320" height="52" rx="20" fill="#8a5a3b"/>
    <circle cx="262" cy="40" r="9" fill="#3a2417"/><circle cx="292" cy="40" r="9" fill="#3a2417"/>
    <circle cx="262" cy="40" r="3" fill="#e8b45a"/><circle cx="292" cy="40" r="3" fill="#e8b45a"/>
    <rect x="30" y="78" width="280" height="184" rx="14" fill="#2b1a10"/>
    <g transform="translate(98 90) scale(0.55)">${drawPizzaInner()}</g>
    ${flames}
    <rect x="30" y="78" width="280" height="184" rx="14" fill="none" stroke="#5c3a21" stroke-width="8"/>
    <rect x="120" y="284" width="100" height="10" rx="5" fill="#5c3a21"/>
  </svg>`;
}

/* ============================== SHOP UI ============================== */

const $ = (id) => document.getElementById(id);

function binSvg(t) {
  const [x, y, s] = [23, 23, 41];
  return `<svg viewBox="0 0 46 46"><circle cx="23" cy="23" r="21" fill="#f7d872" opacity="0.35"/>${pieceSvg(t.id, x, y, s)}</svg>`;
}

function regionOf(id) {
  const p = state.pizza;
  return p.whole.has(id) ? 'whole' : p.left.has(id) ? 'left' : p.right.has(id) ? 'right' : null;
}

function buildBins() {
  const bin = (t) => {
    const locked = t.unlock > state.earned;
    const on = !!regionOf(t.id);
    return `<button class="bin ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-id="${t.id}">
      ${binSvg(t)}
      ${locked ? `<span class="lock-badge">🔒</span><span class="price-tag">earn $${t.unlock}</span>` : ''}
      <span class="item-name">${t.name}</span></button>`;
  };
  $('baseBins').innerHTML = TOPPINGS.filter(t => t.tags.includes('base')).map(bin).join('');
  $('bins').innerHTML = TOPPINGS.filter(t => !t.tags.includes('base')).map(bin).join('');
  document.querySelectorAll('.bin[data-id]').forEach(b => { b.onclick = () => tapBin(b.dataset.id); });
}

function tapBin(id) {
  const t = byId(id);
  if (t.unlock > state.earned) return;
  startClock();
  const p = state.pizza;
  const cur = regionOf(id);
  const target = isBase(id) ? 'whole' : state.target; // sauce & cheese always cover the whole pizza
  ['whole', 'left', 'right'].forEach(r => p[r].delete(id));
  if (cur !== target) p[target].add(id); // same region tap = remove, else move/add
  refreshPizza();
}

function refreshPizza() {
  $('pizza').innerHTML = drawPizza();
  buildBins();
}

function setTarget(t) {
  state.target = t;
  $('targetChips').querySelectorAll('.chip').forEach(c => c.classList.toggle('sel', c.dataset.target === t));
}

/* ============================== SPEECH ============================== */

// pre-readers: riddles can be read aloud; the patience clock waits for the first build tap
const canSpeak = typeof window.speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

function speak() {
  if (!canSpeak || !state.customer) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(state.customer.text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

function stopSpeaking() { if (canSpeak) window.speechSynthesis.cancel(); }

/* ============================== CUSTOMER / PATIENCE ============================== */

function faceFor(frac) { return frac > 0.75 ? '😊' : frac > 0.5 ? '🙂' : frac > 0.3 ? '😐' : frac > 0.15 ? '😟' : '😡'; }

function nextCustomer() {
  state.customer = newOrder();
  state.pizza = freshPizza();
  state.patience = 1;
  state.patienceTotal = Math.max(25, 50 - state.served * 2);
  setTarget('whole');
  $('targetChips').classList.toggle('hidden', !halvesUnlocked());
  $('custName').textContent = state.customer.name;
  $('custFace').textContent = state.customer.face;
  $('riddle').textContent = state.customer.text;
  refreshPizza();
  updatePatience();

  clearInterval(state.tickId);
  state.tickId = null; // clock starts on the first build tap, so the riddle can be heard first
  speak();
}

function startClock() {
  if (state.tickId) return;
  state.tickId = setInterval(() => {
    state.patience -= 0.5 / state.patienceTotal;
    if (state.patience <= 0) { clearInterval(state.tickId); state.tickId = null; customerLeaves(); return; }
    updatePatience();
  }, 500);
}

function updatePatience() {
  const bar = $('patienceBar');
  bar.style.width = (state.patience * 100) + '%';
  bar.classList.toggle('low', state.patience < 0.3);
  $('custFace').textContent = state.patience >= 1 ? state.customer.face : faceFor(state.patience);
}

function customerLeaves() {
  stopSpeaking();
  state.served++;
  state.dayServed++;
  updateHud();
  showResult('😡', `${state.customer.name} stormed off!`, 'Too slow — try to serve before the patience bar runs out.', 'No sale. $0');
}

/* ============================== SERVE & SCORE ============================== */

function servePizza() {
  clearInterval(state.tickId);
  state.tickId = null;
  stopSpeaking();
  state.slicing = false;
  state.cuts = 0;
  $('ovenLabel').textContent = 'Into the oven! 🔥';
  $('ovenStage').innerHTML = ovenSvg();
  $('ovenTrack').classList.remove('hidden');
  $('ovenBar').style.width = '0%';
  $('overlay-oven').classList.remove('hidden');
  const ms = bakeMs();
  let elapsed = 0;
  clearInterval(state.bakeId);
  state.bakeId = setInterval(() => {
    elapsed += 100;
    $('ovenBar').style.width = Math.min(100, (elapsed / ms) * 100) + '%';
    if (elapsed >= ms) { clearInterval(state.bakeId); startSlicing(); }
  }, 100);
}

function startSlicing() {
  state.slicing = true;
  $('ovenLabel').textContent = 'Ding! 🔔 Tap the pizza to slice it! 🔪';
  $('ovenTrack').classList.add('hidden');
  $('ovenStage').innerHTML = `<div class="slice-wrap">${drawPizza({ baked: true, cuts: 0 })}</div>`;
}

function tapSlice() {
  if (!state.slicing) return;
  state.cuts++;
  $('ovenStage').innerHTML = `<div class="slice-wrap">${drawPizza({ baked: true, cuts: state.cuts })}</div>`;
  if (state.cuts >= CUTS_NEEDED) {
    state.slicing = false;
    $('ovenLabel').textContent = '8 perfect slices! 🍕';
    setTimeout(() => { $('overlay-oven').classList.add('hidden'); scoreAndShow(); }, 800);
  } else {
    $('ovenLabel').textContent = ['', 'Keep slicing! 🔪', 'Halfway there! 🔪', 'One more cut! 🔪'][state.cuts];
  }
}

function scoreAndShow() {
  const c = state.customer;
  const count = topsOf(state.pizza).length + (unionSet(state.pizza).has('xcheese') ? 1 : 0);
  const price = 8 + count;
  const correct = c.check(state.pizza);
  state.served++;
  state.dayServed++;

  if (correct) {
    const tip = Math.ceil(state.patience * (3 + count)) + decoCount();
    const total = price + tip;
    state.money += total;
    state.earned += total;
    state.dayEarned += total;
    state.dayHappy++;
    showResult(faceFor(Math.max(state.patience, 0.4)), `${c.name} loves it!`,
      state.patience > 0.6 ? 'Fast and delicious — amazing service!' : 'Tasty! A little faster next time for a bigger tip.',
      `+$${price} pizza  +$${tip} tip  =  $${total}`);
  } else {
    const total = Math.floor(price / 2);
    state.money += total;
    state.earned += total;
    state.dayEarned += total;
    showResult('😕', `${c.name} frowns… that's not the order!`,
      `The order was: ${c.explain}`,
      `Half price only: +$${total}, no tip`);
  }
  updateHud();
}

let pendingUnlocks = null;

function showResult(face, title, detail, money) {
  $('resultFace').textContent = face;
  $('resultTitle').textContent = title;
  $('resultDetail').textContent = detail;
  $('resultMoney').textContent = money;
  $('overlay-result').classList.remove('hidden');
}

function updateHud() {
  $('money').textContent = `💰 $${state.money}`;
  $('served').textContent = `Day ${state.day} · ${Math.min(state.dayServed, CUSTOMERS_PER_DAY)}/${CUSTOMERS_PER_DAY}`;
}

// unlock check runs when leaving the result screen so the reveal doesn't stack overlays
let lastUnlockEarned = 0;
function checkUnlocks() {
  const fresh = TOPPINGS.filter(t => t.unlock > lastUnlockEarned && t.unlock <= state.earned);
  const halfFresh = lastUnlockEarned < HALF_UNLOCK && state.earned >= HALF_UNLOCK;
  lastUnlockEarned = state.earned;
  if (!fresh.length && !halfFresh) return false;
  $('unlockList').innerHTML = fresh.map(t =>
    `<div class="bin">${binSvg(t)}<span class="item-name">${t.name}</span></div>`).join('') +
    (halfFresh ? `<div class="bin"><span style="font-size:2rem">◐</span><span class="item-name">Half &amp; Half orders!</span></div>` : '');
  $('overlay-unlock').classList.remove('hidden');
  return true;
}

/* ============================== STORE ============================== */

function canBuy(u) {
  return !state.owned.has(u.id) && state.money >= u.cost && (!u.needs || state.owned.has(u.needs));
}

function buyUpgrade(id) {
  const u = UPGRADES.find(x => x.id === id);
  if (!canBuy(u)) return;
  state.money -= u.cost;
  state.owned.add(id);
  updateHud();
  buildStore();
  drawDecor();
}

function buildStore() {
  $('storeMoney').textContent = `💰 $${state.money} to spend`;
  $('storeList').innerHTML = UPGRADES.map(u => {
    const owned = state.owned.has(u.id);
    const needsMissing = u.needs && !state.owned.has(u.needs);
    const cls = owned ? 'owned' : (needsMissing || state.money < u.cost) ? 'locked' : '';
    const tag = owned ? '✓ yours!'
      : needsMissing ? `🔒 needs ${UPGRADES.find(x => x.id === u.needs).name}`
      : `$${u.cost}`;
    return `<button class="store-item ${cls}" data-id="${u.id}">
      <span class="store-emoji">${u.emoji}</span>
      <span class="item-name">${u.name}</span>
      <span class="store-desc">${u.desc}</span>
      <span class="store-price">${tag}</span></button>`;
  }).join('');
  document.querySelectorAll('.store-item[data-id]').forEach(b => { b.onclick = () => buyUpgrade(b.dataset.id); });
}

function drawDecor() {
  const decos = UPGRADES.filter(u => u.deco && state.owned.has(u.id));
  $('decorShelf').innerHTML = decos.map(u => `<span title="${u.name}">${u.emoji}</span>`).join('');
  $('decorShelf').classList.toggle('hidden', !decos.length);
}

/* ============================== BOOT ============================== */

window.addEventListener('beforeunload', (e) => {
  if (state.customer && state.served > 0) { e.preventDefault(); e.returnValue = ''; }
});

$('btnOpen').onclick = () => {
  $('screen-title').classList.remove('active');
  $('screen-shop').classList.add('active');
  nextCustomer();
};
$('btnServePizza').onclick = servePizza;
$('btnClearPizza').onclick = () => { state.pizza = freshPizza(); refreshPizza(); };
function dayOver() { return state.dayServed >= CUSTOMERS_PER_DAY; }

function showDaySummary() {
  $('dayTitle').textContent = `Day ${state.day} complete!`;
  $('daySummary').textContent = `${state.dayHappy} of ${state.dayServed} customers left happy. Time to close up and rest.`;
  $('dayMoney').textContent = `Earned today: $${state.dayEarned}  ·  Total: $${state.money}`;
  $('btnNextDay').textContent = `Open Day ${state.day + 1} 🔔`;
  $('overlay-day').classList.remove('hidden');
}

function proceed() {
  if (dayOver()) { showDaySummary(); return; }
  nextCustomer();
}

$('btnNextCust').onclick = () => {
  $('overlay-result').classList.add('hidden');
  if (!checkUnlocks()) proceed();
};
$('btnUnlockOk').onclick = () => { $('overlay-unlock').classList.add('hidden'); proceed(); };
$('ovenStage').onclick = tapSlice;
$('btnStoreOpen').onclick = () => {
  $('overlay-day').classList.add('hidden');
  buildStore();
  $('overlay-store').classList.remove('hidden');
};
$('btnStoreDone').onclick = () => {
  $('overlay-store').classList.add('hidden');
  $('overlay-day').classList.remove('hidden');
};
$('btnNextDay').onclick = () => {
  state.day++;
  state.dayServed = 0;
  state.dayEarned = 0;
  state.dayHappy = 0;
  $('overlay-day').classList.add('hidden');
  nextCustomer();
};
$('targetChips').querySelectorAll('.chip').forEach(c => { c.onclick = () => { startClock(); setTarget(c.dataset.target); }; });
$('btnSpeak').onclick = speak; // re-listen any time; never starts the clock
if (!canSpeak) $('btnSpeak').classList.add('hidden');

updateHud();
