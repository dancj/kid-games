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

const NAMES = ['Andy', 'Margot', 'Zoe', 'Leo', 'Ruby', 'Max', 'Mia', 'Sam', 'Lily', 'Oscar', 'Nina', 'Theo'];
const FACES = ['🧑', '👧', '👦', '👵', '👴', '🧔', '👩', '🧒', '👱', '🧕'];

/* ============================== STATE ============================== */

const CUSTOMERS_PER_DAY = 5;

const state = {
  money: 0,
  served: 0,
  day: 1,
  dayServed: 0,
  dayEarned: 0,
  dayHappy: 0,
  customer: null,     // {name, face, order}
  patience: 1,        // 1 → 0
  patienceTotal: 50,  // seconds
  tickId: null,
  target: 'whole',
  pizza: null,        // {whole:Set, left:Set, right:Set}
};

function freshPizza() { return { whole: new Set(['sauce']), left: new Set(), right: new Set() }; }

function unlocked() { return TOPPINGS.filter(t => t.unlock <= state.money); }
function pickable() { return unlocked().filter(t => !t.tags.includes('base')); } // riddle candidates
function halvesUnlocked() { return state.money >= HALF_UNLOCK; }
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

function drawPizza() {
  const p = state.pizza;
  let bits = '';
  const put = (set, region) => set.forEach(id => {
    if (id === 'sauce') return; // sauce is a layer, not scattered pieces
    spotsFor(id, region, region === 'whole' ? 8 : 4).forEach(([x, y, s]) => { bits += pieceSvg(id, x, y, s); });
  });
  put(p.whole, 'whole'); put(p.left, 'left'); put(p.right, 'right');

  const divider = halvesUnlocked() && (p.left.size || p.right.size)
    ? `<line x1="130" y1="34" x2="130" y2="226" stroke="#e8b45a" stroke-width="2" stroke-dasharray="6 6" opacity="0.7"/>` : '';
  const sauce = p.whole.has('sauce') ? `<circle cx="130" cy="130" r="102" fill="#d94f35"/>` : '';

  return `<svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
    <circle cx="130" cy="130" r="122" fill="#e8b45a"/>
    <circle cx="130" cy="130" r="121" fill="none" stroke="#d09a3e" stroke-width="6" stroke-dasharray="2 9" opacity="0.6"/>
    ${sauce}
    <circle cx="130" cy="130" r="97" fill="#f7d872"/>
    <circle cx="112" cy="112" r="30" fill="#fbe28f" opacity="0.8"/>
    <circle cx="155" cy="150" r="24" fill="#fbe28f" opacity="0.6"/>
    ${bits}
    ${divider}
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
    const locked = t.unlock > state.money;
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
  if (t.unlock > state.money) return;
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
  state.tickId = setInterval(() => {
    state.patience -= 0.5 / state.patienceTotal;
    if (state.patience <= 0) { clearInterval(state.tickId); customerLeaves(); return; }
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
  state.served++;
  state.dayServed++;
  updateHud();
  showResult('😡', `${state.customer.name} stormed off!`, 'Too slow — try to serve before the patience bar runs out.', 'No sale. $0');
}

/* ============================== SERVE & SCORE ============================== */

function servePizza() {
  clearInterval(state.tickId);
  $('overlay-bake').classList.remove('hidden');
  setTimeout(() => {
    $('overlay-bake').classList.add('hidden');
    scoreAndShow();
  }, 1200);
}

function scoreAndShow() {
  const c = state.customer;
  const count = topsOf(state.pizza).length + (unionSet(state.pizza).has('xcheese') ? 1 : 0);
  const price = 8 + count;
  const correct = c.check(state.pizza);
  state.served++;
  state.dayServed++;

  if (correct) {
    const tip = Math.ceil(state.patience * (3 + count));
    const total = price + tip;
    state.money += total;
    state.dayEarned += total;
    state.dayHappy++;
    showResult(faceFor(Math.max(state.patience, 0.4)), `${c.name} loves it!`,
      state.patience > 0.6 ? 'Fast and delicious — amazing service!' : 'Tasty! A little faster next time for a bigger tip.',
      `+$${price} pizza  +$${tip} tip  =  $${total}`);
  } else {
    const total = Math.floor(price / 2);
    state.money += total;
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
let lastUnlockMoney = 0;
function checkUnlocks() {
  const fresh = TOPPINGS.filter(t => t.unlock > lastUnlockMoney && t.unlock <= state.money);
  const halfFresh = lastUnlockMoney < HALF_UNLOCK && state.money >= HALF_UNLOCK;
  lastUnlockMoney = state.money;
  if (!fresh.length && !halfFresh) return false;
  $('unlockList').innerHTML = fresh.map(t =>
    `<div class="bin">${binSvg(t)}<span class="item-name">${t.name}</span></div>`).join('') +
    (halfFresh ? `<div class="bin"><span style="font-size:2rem">◐</span><span class="item-name">Half &amp; Half orders!</span></div>` : '');
  $('overlay-unlock').classList.remove('hidden');
  return true;
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
$('btnNextDay').onclick = () => {
  state.day++;
  state.dayServed = 0;
  state.dayEarned = 0;
  state.dayHappy = 0;
  $('overlay-day').classList.add('hidden');
  nextCustomer();
};
$('targetChips').querySelectorAll('.chip').forEach(c => { c.onclick = () => setTarget(c.dataset.target); });

updateHud();
