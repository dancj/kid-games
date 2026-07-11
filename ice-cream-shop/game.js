/* The Ice Cream Shop — build-your-own ice cream, no dependencies */
'use strict';

/* ============================== DATA ============================== */

const CONES = [
  { id: 'sugar', name: 'Sugar Cone' },
  { id: 'waffle', name: 'Waffle Cone' },
  { id: 'cake', name: 'Cake Cone' },
  { id: 'chocdip', name: 'Choco Dip Cone' },
  { id: 'cup', name: 'Cup' },
  { id: 'split', name: 'Banana Split' },
];

// Hard-packed tubs in the freezer
const FLAVORS = [
  { id: 'vanilla', name: 'Vanilla', c: '#fdf3dc' },
  { id: 'chocolate', name: 'Chocolate', c: '#7b4a2d' },
  { id: 'strawberry', name: 'Strawberry', c: '#ffb3c8' },
  { id: 'mintchip', name: 'Mint Chip', c: '#b8ecd0', bits: { c: '#4a3428', kind: 'chip' } },
  { id: 'cookiescream', name: 'Cookies & Cream', c: '#efeae0', bits: { c: '#3d2c22', kind: 'chunk' } },
  { id: 'blueberry', name: 'Blueberry', c: '#a8b8e8' },
  { id: 'mango', name: 'Mango', c: '#ffd28a' },
  { id: 'bubblegum', name: 'Bubblegum', c: '#ffa8e0' },
];

// Soft serve machine levers
const SOFT = [
  { id: 'softvanilla', name: 'Vanilla Swirl', c: '#fdf3dc' },
  { id: 'softchoc', name: 'Choco Swirl', c: '#7b4a2d' },
  { id: 'softstraw', name: 'Berry Swirl', c: '#ffb3c8' },
  { id: 'softtwist', name: 'Twist', c: '#fdf3dc', c2: '#7b4a2d' },
];

const MIXINS = [
  { id: 'chips', name: 'Choco Chips', icon: '🍫' },
  { id: 'cookiebits', name: 'Cookie Bits', icon: '🍪' },
  { id: 'gummies', name: 'Gummies', icon: '🐻' },
  { id: 'mallow', name: 'Marshmallow', icon: '⭐' },
];

const sprinkleJar = (colors) => `<svg viewBox="0 0 52 52"><rect x="12" y="14" width="28" height="32" rx="6" fill="#fff" stroke="#d9c9b0" stroke-width="2"/><rect x="16" y="8" width="20" height="8" rx="3" fill="#d9b97a"/>${colors.map((c, i) => `<rect x="${16 + (i % 3) * 8}" y="${20 + Math.floor(i / 3) * 9}" width="6" height="2.6" rx="1.3" fill="${c}" transform="rotate(${(i * 47) % 80 - 40} ${19 + (i % 3) * 8} ${21 + Math.floor(i / 3) * 9})"/>`).join('')}</svg>`;
const whipIcon = `<svg viewBox="0 0 52 52"><circle cx="16" cy="34" r="10" fill="#fff" stroke="#e8ddcc" stroke-width="1.5"/><circle cx="36" cy="34" r="10" fill="#fff" stroke="#e8ddcc" stroke-width="1.5"/><circle cx="26" cy="24" r="11" fill="#fff" stroke="#e8ddcc" stroke-width="1.5"/></svg>`;

const TOPPINGS = [
  { id: 'rainbow', name: 'Rainbow Sprinkles', svgIcon: sprinkleJar(['#e84a6f', '#ffd447', '#4fc3f7', '#8fd97f', '#c9a6f5', '#ff8a65']) },
  { id: 'chocsprk', name: 'Choco Sprinkles', svgIcon: sprinkleJar(['#5c4033', '#7b4a2d', '#4a3428', '#5c4033', '#7b4a2d', '#4a3428']) },
  { id: 'candy', name: 'Candy Gems', icon: '🍬' },
  { id: 'cherry', name: 'Cherry', icon: '🍒' },
  { id: 'whip', name: 'Whipped Cream', svgIcon: whipIcon },
  { id: 'cookie', name: 'Cookie', icon: '🍪' },
  { id: 'bear', name: 'Gummy Bear', icon: '🐻' },
];

const COMPLIMENTS = ['Yummy!', 'So tasty! 😋', 'Sweet masterpiece! 🍭', 'Brain freeze incoming! 🥶', 'Chef\'s kiss! 😘', 'The best in town! 🏆'];

/* ============================== STATE ============================== */

const build = {
  cone: CONES[0],
  scoops: [],        // up to 3 flavor objects, bottom first
  soft: null,        // soft-serve flavor replaces scoops
  mixins: new Set(),
  toppings: new Set(),
};

/* ============================== CREATION SVG ============================== */

const SCOOP_R = [46, 42, 38];

function scoopCenters() {
  if (build.cone.id === 'split') {
    // scoops sit in a row in the boat
    const rows = [[[150, 296, 44]], [[112, 298, 42], [188, 298, 42]], [[86, 302, 38], [150, 292, 42], [214, 302, 38]]];
    return (rows[build.scoops.length - 1] || []).map(([cx, cy, r]) => ({ cx, cy, r }));
  }
  const baseY = build.cone.id === 'cup' ? 280 : 262;
  let y = baseY;
  return build.scoops.map((f, i) => {
    const r = SCOOP_R[i];
    const c = { cx: 150, cy: y, r };
    y -= r + (SCOOP_R[i + 1] || 0) * 0.72;
    return c;
  });
}

// deterministic pseudo-random spots so the creation doesn't shimmer on re-render
function spots(seed, n, rMax) {
  const out = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const ang = (s / 233280) * Math.PI * 2;
    s = (s * 9301 + 49297) % 233280;
    const rad = (s / 233280) * rMax;
    out.push([Math.cos(ang) * rad, Math.sin(ang) * rad, s]);
  }
  return out;
}

function bitSvg(kind, x, y, s) {
  const sc = 0.7 + (s % 100) / 100 * 0.7;             // size varies
  const op = 0.65 + (s % 53) / 53 * 0.35;             // some bits sit deeper in the ice cream
  switch (kind) {
    case 'chip': return `<circle cx="${x}" cy="${y}" r="${3 * sc}" fill="#4a3428" opacity="${op}"/>`;
    case 'chunk': return `<rect x="${x - 4 * sc}" y="${y - 4 * sc}" width="${8 * sc}" height="${8 * sc}" rx="2" fill="#3d2c22" opacity="${op}" transform="rotate(${s % 90} ${x} ${y})"/>`;
    case 'gummy': { const cols = ['#e84a6f', '#8fd97f', '#ffd447', '#ff8a65']; return `<circle cx="${x}" cy="${y}" r="${3.5 * sc}" fill="${cols[s % 4]}" opacity="${op}"/>`; }
    case 'mallow': return `<rect x="${x - 4 * sc}" y="${y - 3.5 * sc}" width="${8 * sc}" height="${7 * sc}" rx="3" fill="#fff" stroke="#eee1d4" stroke-width="1" opacity="${op}" transform="rotate(${s % 60 - 30} ${x} ${y})"/>`;
    default: return '';
  }
}

const MIXIN_KIND = { chips: 'chip', cookiebits: 'chunk', gummies: 'gummy', mallow: 'mallow' };

let clipSeq = 0; // unique clip ids: creation is rendered twice on the page (counter + serve card)

function scoopBits(flavor, cx, cy, r, seed) {
  let out = '';
  if (flavor.bits) spots(seed, 7, r * 0.72).forEach(([dx, dy, s]) => { out += bitSvg(flavor.bits.kind, cx + dx, cy + dy, s); });
  let m = 0;
  build.mixins.forEach(id => {
    m++;
    // stir streaks so mix-ins look folded through, not sprinkled on
    out += `<path d="M${cx - r * 0.6} ${cy - r * 0.2} Q${cx} ${cy + r * 0.25 * m} ${cx + r * 0.6} ${cy - r * 0.1 * m}" fill="none" stroke="${shade(flavor.c, -26)}" stroke-width="3" opacity="0.35" stroke-linecap="round"/>`;
    spots(seed + m * 31, 8, r * 0.85).forEach(([dx, dy, s]) => { out += bitSvg(MIXIN_KIND[id], cx + dx, cy + dy, s); });
  });
  if (!out) return '';
  const id = 'scoopclip' + (++clipSeq);
  return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r - 1}"/></clipPath><g clip-path="url(#${id})">${out}</g>`;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, v + amt));
  return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0');
}

function scoopSvg(flavor, cx, cy, r, seed) {
  const drip = `M${cx - r * 0.8} ${cy + r * 0.5} Q${cx - r * 0.5} ${cy + r * 0.95} ${cx - r * 0.3} ${cy + r * 0.55}
    M${cx + r * 0.15} ${cy + r * 0.7} Q${cx + r * 0.35} ${cy + r * 1.05} ${cx + r * 0.55} ${cy + r * 0.6}`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${flavor.c}"/>
    <path d="${drip}" fill="${flavor.c}"/>
    <ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.35}" rx="${r * 0.3}" ry="${r * 0.18}" fill="#fff" opacity="0.45" transform="rotate(-25 ${cx - r * 0.35} ${cy - r * 0.35})"/>
    ${scoopBits(flavor, cx, cy, r, seed)}`;
}

function swirlBaseY() {
  return build.cone.id === 'cup' ? 302 : build.cone.id === 'split' ? 308 : 292;
}

function swirlSvg(f) {
  const baseY = swirlBaseY();
  const layers = [
    { cy: baseY - 12, rx: 47, ry: 20 },
    { cy: baseY - 38, rx: 37, ry: 17 },
    { cy: baseY - 60, rx: 27, ry: 14 },
  ];
  let out = layers.map((l, i) => `<ellipse cx="150" cy="${l.cy}" rx="${l.rx}" ry="${l.ry}" fill="${f.c2 && i % 2 ? f.c2 : f.c}"/>`).join('');
  out += `<path d="M138 ${baseY - 66} Q148 ${baseY - 100} 156 ${baseY - 72} Q160 ${baseY - 84} 162 ${baseY - 66} Z" fill="${f.c2 || f.c}"/>`;
  // a few mixin bits pressed into the swirl
  let m = 0;
  build.mixins.forEach(id => {
    m++;
    spots(77 + m * 31, 4, 30).forEach(([dx, dy, s]) => { out += bitSvg(MIXIN_KIND[id], 150 + dx, baseY - 38 + dy * 0.6, s); });
  });
  return out;
}

function coneSvg() {
  switch (build.cone.id) {
    case 'sugar': return `<path d="M110 300 L190 300 L150 452 Z" fill="#d9924f"/>
      <path d="M118 316 L182 316 M126 338 L176 338 M133 360 L169 360 M139 382 L163 382 M145 404 L157 404" stroke="#b5713a" stroke-width="2.5"/>
      <ellipse cx="150" cy="300" rx="40" ry="9" fill="#e8a860"/>`;
    case 'waffle': return `<path d="M104 296 L196 296 L150 456 Z" fill="#c97f3e"/>
      <path d="M112 312 L188 312 M120 336 L182 336 M128 360 L173 360 M136 384 L165 384 M143 408 L158 408 M128 300 L146 440 M150 300 L152 448 M172 300 L156 440" stroke="#a5642c" stroke-width="2.2"/>
      <rect x="102" y="288" width="96" height="14" rx="7" fill="#e8a860"/>`;
    case 'cake': return `<path d="M112 300 L188 300 L180 404 Q150 416 120 404 Z" fill="#e8c88f"/>
      <path d="M122 302 L126 404 M136 302 L138 409 M150 302 L150 411 M164 302 L162 409 M178 302 L174 404" stroke="#cfa863" stroke-width="2.5"/>
      <ellipse cx="150" cy="300" rx="38" ry="8" fill="#f2d9a8"/>`;
    case 'chocdip': return `<path d="M104 296 L196 296 L150 456 Z" fill="#c97f3e"/>
      <path d="M128 360 L173 360 M136 384 L165 384 M143 408 L158 408 M146 356 L150 440 M154 356 L152 448" stroke="#a5642c" stroke-width="2.2"/>
      <path d="M104 296 L196 296 L188 322 Q182 342 176 322 L168 326 Q164 348 156 326 Q150 344 144 326 L134 322 Q128 340 122 320 L112 318 Z" fill="#5c4033"/>
      <rect x="102" y="288" width="96" height="14" rx="7" fill="#5c4033"/>
      <circle cx="126" cy="302" r="2" fill="#ffd447"/><circle cx="148" cy="308" r="2" fill="#e84a6f"/><circle cx="170" cy="303" r="2" fill="#4fc3f7"/><circle cx="182" cy="310" r="2" fill="#8fd97f"/>`;
    case 'cup': return `<path d="M105 308 L195 308 L184 394 Q150 406 116 394 Z" fill="#ff8fb3"/>
      <path d="M105 308 L195 308 L192 330 L108 330 Z" fill="#ffb9d5"/>
      <ellipse cx="150" cy="308" rx="45" ry="9" fill="#e86f9a"/>
      <circle cx="150" cy="362" r="12" fill="#fff" opacity="0.7"/>`;
    case 'split': return `
      <path d="M32 330 Q28 276 74 252 Q84 256 79 264 Q48 286 54 326 Q50 334 32 330 Z" fill="#ffe28a" stroke="#e8c15a" stroke-width="2"/>
      <path d="M268 330 Q272 276 226 252 Q216 256 221 264 Q252 286 246 326 Q250 334 268 330 Z" fill="#ffe28a" stroke="#e8c15a" stroke-width="2"/>
      <path d="M36 322 Q150 356 264 322 L252 372 Q150 396 48 372 Z" fill="#cdeeff" opacity="0.9"/>
      <path d="M36 322 Q150 356 264 322 L261 336 Q150 368 39 336 Z" fill="#a8dcf5"/>
      <rect x="128" y="392" width="44" height="10" rx="5" fill="#a8dcf5"/>`;
    default: return '';
  }
}

function toppingsSvg(top) {
  // top = {cx, cy, r} of the highest scoop / swirl tip area
  let out = '';
  const centers = build.soft ? [top] : scoopCenters();
  if (build.toppings.has('rainbow') || build.toppings.has('chocsprk')) {
    const cols = build.toppings.has('rainbow') ? ['#e84a6f', '#ffd447', '#4fc3f7', '#8fd97f', '#c9a6f5', '#ff8a65'] : ['#5c4033', '#4a3428', '#3d2c22'];
    centers.forEach((c, ci) => {
      spots(11 + ci * 17, 9, c.r * 0.7).forEach(([dx, dy, s], i) => {
        if (dy > 0) dy = -dy; // upper half only
        out += `<rect x="${c.cx + dx - 4}" y="${c.cy + dy - 1.4}" width="8" height="2.8" rx="1.4" fill="${cols[i % cols.length]}" transform="rotate(${s % 120 - 60} ${c.cx + dx} ${c.cy + dy})"/>`;
      });
    });
  }
  if (build.toppings.has('candy')) {
    const cols = ['#e84a6f', '#4fc3f7', '#ffd447', '#8fd97f', '#c9a6f5'];
    spots(29, 6, top.r * 0.65).forEach(([dx, dy, s], i) => {
      if (dy > 0) dy = -dy;
      out += `<circle cx="${top.cx + dx}" cy="${top.cy + dy}" r="4.5" fill="${cols[i % cols.length]}"/><circle cx="${top.cx + dx - 1.2}" cy="${top.cy + dy - 1.2}" r="1.2" fill="#fff" opacity="0.8"/>`;
    });
  }
  if (build.toppings.has('cookie')) {
    const x = top.cx + top.r * 0.55, y = top.cy - top.r * 0.55;
    out += `<circle cx="${x}" cy="${y}" r="14" fill="#c9925c"/>` +
      [[-5, -3], [4, -6], [1, 4], [-6, 5], [7, 2]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="2" fill="#4a3428"/>`).join('');
  }
  if (build.toppings.has('bear')) {
    const bears = [
      ['#8fd97f', top.cx - top.r * 0.55, top.cy - top.r * 0.6],
      ['#e84a6f', top.cx + top.r * 0.5, top.cy - top.r * 0.45],
      ['#ffd447', top.cx - top.r * 0.05, top.cy - top.r * 0.95],
    ];
    bears.forEach(([c, x, y]) => {
      out += `<g fill="${c}" opacity="0.95"><circle cx="${x}" cy="${y + 6}" r="7"/><circle cx="${x}" cy="${y - 3}" r="5"/><circle cx="${x - 4.5}" cy="${y - 7}" r="2"/><circle cx="${x + 4.5}" cy="${y - 7}" r="2"/></g>`;
    });
  }
  let peakY = top.cy - top.r;
  if (build.toppings.has('whip')) {
    const y = peakY - 2;
    out += `<circle cx="${top.cx - 14}" cy="${y}" r="13" fill="#fff"/><circle cx="${top.cx + 14}" cy="${y}" r="13" fill="#fff"/><circle cx="${top.cx}" cy="${y - 10}" r="14" fill="#fff"/>`;
    peakY = y - 24;
  }
  if (build.toppings.has('cherry')) {
    out += `<circle cx="${top.cx}" cy="${peakY - 6}" r="8" fill="#d92645"/><circle cx="${top.cx - 2.5}" cy="${peakY - 8.5}" r="2.2" fill="#fff" opacity="0.7"/>
      <path d="M${top.cx} ${peakY - 13} Q${top.cx + 6} ${peakY - 24} ${top.cx + 12} ${peakY - 26}" fill="none" stroke="#5c8a3a" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  return out;
}

function drawCreation() {
  let iceCream = '';
  let top = null;
  if (build.soft) {
    iceCream = swirlSvg(build.soft);
    top = { cx: 150, cy: swirlBaseY() - 48, r: 34 };
  } else if (build.scoops.length) {
    const centers = scoopCenters();
    iceCream = build.scoops.map((f, i) => scoopSvg(f, centers[i].cx, centers[i].cy, centers[i].r, 7 + i * 13)).join('');
    top = centers.reduce((a, b) => (b.cy < a.cy ? b : a)); // highest scoop (middle one on a split)
  }
  return `<svg viewBox="0 0 300 470" xmlns="http://www.w3.org/2000/svg">
    ${iceCream}
    ${coneSvg()}
    ${top ? toppingsSvg(top) : ''}
  </svg>`;
}

/* ============================== SHOP UI ============================== */

const $ = (id) => document.getElementById(id);

function render() {
  $('creation').innerHTML = drawCreation();
  const n = build.soft ? 'Soft serve swirl!' : `Scoops: ${build.scoops.length} / 3`;
  $('scoopCount').textContent = build.scoops.length || build.soft ? n : 'Pick a cone, then scoop!';
  buildShelves();
}

function sparkle() {
  const counter = document.querySelector('.counter');
  const s = document.createElement('div');
  s.className = 'sparkle';
  s.textContent = '✨';
  s.style.left = (35 + Math.random() * 30) + '%';
  s.style.top = (25 + Math.random() * 35) + '%';
  counter.appendChild(s);
  setTimeout(() => s.remove(), 700);
}

function wobble(msg) {
  const el = $('scoopCount');
  el.textContent = msg;
  el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 });
}

function tubSvg(f) {
  return `<svg viewBox="0 0 52 52"><rect x="8" y="16" width="36" height="28" rx="5" fill="${shade(f.c, -18)}"/><ellipse cx="26" cy="17" rx="18" ry="7" fill="${f.c}"/>${f.bits ? `<circle cx="20" cy="16" r="2" fill="${f.bits.c}"/><circle cx="31" cy="19" r="2" fill="${f.bits.c}"/>` : ''}</svg>`;
}

function leverSvg(f) {
  return `<svg viewBox="0 0 52 52"><rect x="20" y="4" width="12" height="10" rx="3" fill="#9a9aae"/><ellipse cx="26" cy="40" rx="15" ry="7" fill="${f.c}"/><ellipse cx="26" cy="31" rx="11" ry="6" fill="${f.c2 || f.c}"/><ellipse cx="26" cy="23" rx="7" ry="5" fill="${f.c}"/><path d="M22 20 Q26 8 29 19 Z" fill="${f.c2 || f.c}"/></svg>`;
}

function miniConeSvg(c) {
  const old = build.cone;
  build.cone = c;
  const svg = `<svg viewBox="70 250 160 220">${coneSvg()}</svg>`;
  build.cone = old;
  return svg;
}

function buildShelves() {
  $('cones').innerHTML = CONES.map(c =>
    `<button class="shelf-item ${build.cone.id === c.id ? 'sel' : ''}" data-act="cone" data-id="${c.id}">${miniConeSvg(c)}<span class="item-name">${c.name}</span></button>`).join('');
  $('tubs').innerHTML = FLAVORS.map(f =>
    `<button class="tub" data-act="scoop" data-id="${f.id}">${tubSvg(f)}<span class="item-name">${f.name}</span></button>`).join('');
  $('levers').innerHTML = SOFT.map(f =>
    `<button class="lever ${build.soft && build.soft.id === f.id ? 'sel' : ''}" data-act="soft" data-id="${f.id}">${leverSvg(f)}<span class="item-name">${f.name}</span></button>`).join('');
  $('mixins').innerHTML = MIXINS.map(m =>
    `<button class="shelf-item ${build.mixins.has(m.id) ? 'sel' : ''}" data-act="mixin" data-id="${m.id}"><span class="big-emoji">${m.icon}</span><span class="item-name">${m.name}</span></button>`).join('');
  $('toppings').innerHTML = TOPPINGS.map(t =>
    `<button class="shelf-item ${build.toppings.has(t.id) ? 'sel' : ''}" data-act="topping" data-id="${t.id}">${t.svgIcon || `<span class="big-emoji">${t.icon}</span>`}<span class="item-name">${t.name}</span></button>`).join('');

  document.querySelectorAll('[data-act]').forEach(b => { b.onclick = () => act(b.dataset.act, b.dataset.id); });
}

function act(action, id) {
  if (action === 'cone') build.cone = CONES.find(c => c.id === id);
  else if (action === 'scoop') {
    build.soft = null;
    if (build.scoops.length >= 3) return wobble('Whoa, 3 scoops max! 🍨');
    build.scoops.push(FLAVORS.find(f => f.id === id));
    sparkle();
  } else if (action === 'soft') {
    build.scoops = [];
    build.soft = SOFT.find(f => f.id === id);
    sparkle();
  } else if (action === 'mixin') {
    build.mixins.has(id) ? build.mixins.delete(id) : build.mixins.add(id);
  } else if (action === 'topping') {
    build.toppings.has(id) ? build.toppings.delete(id) : build.toppings.add(id);
  }
  render();
}

/* ============================== SERVE ============================== */

function serve() {
  if (!build.scoops.length && !build.soft) return wobble('Scoop some ice cream first! 🍦');
  $('compliment').textContent = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
  $('servedCreation').innerHTML = drawCreation();
  $('overlay-serve').classList.remove('hidden');
}

function savePicture() {
  const svg = drawCreation().replace('<svg ', '<svg width="600" height="940" ');
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = 600; cv.height = 1000;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff6fb';
    ctx.fillRect(0, 0, 600, 1000);
    ctx.drawImage(img, 0, 20);
    ctx.fillStyle = '#e84a6f';
    ctx.font = 'bold 36px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍨 The Ice Cream Shop', 300, 980);
    cv.toBlob(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'my-ice-cream.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    });
  };
  img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}

function reset() {
  build.cone = CONES[0];
  build.scoops = [];
  build.soft = null;
  build.mixins.clear();
  build.toppings.clear();
  render();
}

/* ============================== BOOT ============================== */

// unsaved-creation guard: browser shows a "leave page?" confirm on back/close/navigation
window.addEventListener('beforeunload', (e) => {
  if (build.scoops.length || build.soft) { e.preventDefault(); e.returnValue = ''; }
});

$('btnUndo').onclick = () => {
  if (build.soft) build.soft = null;
  else build.scoops.pop();
  render();
};
$('btnClear').onclick = reset;
$('btnServe').onclick = serve;
$('btnSave').onclick = savePicture;
$('btnAnother').onclick = () => { $('overlay-serve').classList.add('hidden'); reset(); };

render();
