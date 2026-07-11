/* Fashion for Life — all game logic, no dependencies */
'use strict';

/* ============================== DATA ============================== */

const SKINS = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#ffdbac'];

const THEMES = [
  { name: 'Princess Party', emoji: '👑', tags: ['fancy', 'pink', 'sparkle'], hint: 'Think fancy, pink and sparkly!', time: 90 },
  { name: 'Beach Day', emoji: '🏖️', tags: ['sunny', 'blue', 'casual'], hint: 'Sunny colors and easy-breezy looks!', time: 75 },
  { name: 'Garden Picnic', emoji: '🌸', tags: ['green', 'floral', 'cute'], hint: 'Flowers, greens and cuteness!', time: 60 },
  { name: 'Rock Star', emoji: '🎸', tags: ['bold', 'dark', 'sparkle'], hint: 'Bold, dark and dazzling!', time: 45 },
  { name: 'Winter Ball', emoji: '❄️', tags: ['white', 'blue', 'formal', 'sparkle'], hint: 'Icy, elegant and glittering!', time: 35 },
  { name: 'Diamond Gala', emoji: '💎', tags: ['formal', 'fancy', 'sparkle'], hint: 'Elegant gowns and dazzling jewels!', time: 25 },
];

const RIVALS = [
  { name: 'Zoe', face: '🦄' },
  { name: 'Kai', face: '🐱' },
  { name: 'Mimi', face: '🦋' },
];

const JUDGES = [
  { name: 'Coco', face: '🐩' },
  { name: 'Stella', face: '⭐' },
  { name: 'Fifi', face: '🦩' },
];

// Every item: {id, name, c(olor), tags, unlock (round # earned, 0 = start)}
const NAILS = [
  { id: 'n1', name: 'Pink Pop', c: '#ff6fb5', tags: ['pink', 'cute'] },
  { id: 'n2', name: 'Cherry', c: '#e8384f', tags: ['bold', 'fancy'] },
  { id: 'n3', name: 'Sky', c: '#4fc3f7', tags: ['blue', 'sunny'] },
  { id: 'n4', name: 'Minty', c: '#66e0b8', tags: ['green', 'cute'] },
  { id: 'n5', name: 'Grape', c: '#9c6ade', tags: ['bold'] },
  { id: 'n6', name: 'Lemon', c: '#ffd447', tags: ['sunny'] },
  { id: 'n7', name: 'Snow', c: '#f6f6f6', tags: ['white', 'fancy'] },
  { id: 'n12', name: 'Coral', c: '#ff8a65', tags: ['sunny', 'cute'] },
  { id: 'n13', name: 'Lavender', c: '#c9a6f5', tags: ['fancy', 'cute'] },
  { id: 'n14', name: 'Silver Shine', c: '#d7dbe4', tags: ['formal', 'sparkle', 'white'] },
  { id: 'n8', name: 'Midnight', c: '#3a3a3a', tags: ['dark', 'bold'], unlock: 1 },
  { id: 'n15', name: 'Emerald', c: '#2e9e6b', tags: ['green', 'formal'], unlock: 1 },
  { id: 'n9', name: 'Glitter Rose', c: '#ff8cc6', tags: ['pink', 'sparkle'], glitter: true, unlock: 2 },
  { id: 'n10', name: 'Glitter Gold', c: '#ffce54', tags: ['fancy', 'sparkle'], glitter: true, unlock: 3 },
  { id: 'n16', name: 'Rose Gold', c: '#e8a09a', tags: ['formal', 'sparkle'], glitter: true, unlock: 4 },
  { id: 'n11', name: 'Glitter Ice', c: '#a8dcff', tags: ['blue', 'white', 'sparkle'], glitter: true, unlock: 4 },
  { id: 'n17', name: 'Diamond Dust', c: '#f0f4ff', tags: ['formal', 'sparkle', 'white'], glitter: true, unlock: 5 },
];

const LIPS = [
  { id: 'l0', name: 'None', c: 'none', tags: [] },
  { id: 'l1', name: 'Bubblegum', c: '#ff6fb5', tags: ['pink', 'cute'] },
  { id: 'l2', name: 'Ruby', c: '#d92645', tags: ['bold', 'fancy'] },
  { id: 'l3', name: 'Coral', c: '#ff8a65', tags: ['sunny'] },
  { id: 'l4', name: 'Rose', c: '#e57fa3', tags: ['cute', 'floral'] },
  { id: 'l7', name: 'Nude', c: '#cf9080', tags: ['formal', 'casual'] },
  { id: 'l5', name: 'Berry', c: '#8e3a80', tags: ['bold', 'dark'], unlock: 1 },
  { id: 'l8', name: 'Wine', c: '#7a1f3d', tags: ['formal', 'dark'], unlock: 2 },
  { id: 'l6', name: 'Frost Pink', c: '#ffb3d9', tags: ['white', 'sparkle'], unlock: 3 },
];

const SHADOW = [
  { id: 's0', name: 'None', c: 'none', tags: [] },
  { id: 's1', name: 'Peach', c: '#ffbfa0', tags: ['sunny'] },
  { id: 's2', name: 'Lilac', c: '#c9a6f5', tags: ['fancy'] },
  { id: 's3', name: 'Seafoam', c: '#9fe8d0', tags: ['green', 'blue'] },
  { id: 's4', name: 'Rose Gold', c: '#f2b8c6', tags: ['pink', 'fancy'] },
  { id: 's7', name: 'Mauve', c: '#b48ba4', tags: ['formal'] },
  { id: 's5', name: 'Smoky', c: '#8b7d99', tags: ['dark', 'bold'], unlock: 2 },
  { id: 's8', name: 'Gold Shimmer', c: '#e8c672', tags: ['formal', 'sparkle'], unlock: 3 },
  { id: 's6', name: 'Ice Blue', c: '#b8e4ff', tags: ['blue', 'white', 'sparkle'], unlock: 4 },
];

const BLUSH = [
  { id: 'b0', name: 'None', c: 'none', tags: [] },
  { id: 'b1', name: 'Petal', c: '#ffb3c8', tags: ['pink', 'cute'] },
  { id: 'b2', name: 'Sunset', c: '#ffab8a', tags: ['sunny'] },
  { id: 'b3', name: 'Doll', c: '#ff8fb0', tags: ['cute', 'fancy'], unlock: 1 },
  { id: 'b4', name: 'Soft Glow', c: '#e8a8a0', tags: ['formal'], unlock: 2 },
];

const HAIR_STYLES = [
  { id: 'h1', name: 'Long Waves', tags: ['fancy'] },
  { id: 'h2', name: 'Bouncy Bob', tags: ['cute', 'casual'] },
  { id: 'h3', name: 'Ponytail', tags: ['sunny', 'casual'] },
  { id: 'h7', name: 'Elegant Updo', tags: ['formal', 'fancy'] },
  { id: 'h4', name: 'Space Buns', tags: ['cute', 'bold'], unlock: 1 },
  { id: 'h8', name: 'Pixie', tags: ['bold', 'casual'], unlock: 1 },
  { id: 'h5', name: 'Curly Cloud', tags: ['bold', 'fancy'], unlock: 2 },
  { id: 'h9', name: 'Princess Curls', tags: ['formal', 'fancy', 'sparkle'], unlock: 3 },
  { id: 'h6', name: 'Braids', tags: ['cute', 'floral'], unlock: 3 },
];

const HAIR_COLORS = [
  { id: 'hc1', name: 'Cocoa', c: '#5b3a29', tags: [] },
  { id: 'hc2', name: 'Black', c: '#2b2b2b', tags: ['dark'] },
  { id: 'hc3', name: 'Sunny Blonde', c: '#e8c15a', tags: ['sunny'] },
  { id: 'hc4', name: 'Auburn', c: '#a14d2a', tags: [] },
  { id: 'hc9', name: 'Caramel', c: '#b5834a', tags: [] },
  { id: 'hc5', name: 'Candy Pink', c: '#ff7fc0', tags: ['pink', 'bold'], unlock: 1 },
  { id: 'hc6', name: 'Ocean Blue', c: '#4faee8', tags: ['blue', 'bold'], unlock: 2 },
  { id: 'hc7', name: 'Violet', c: '#8f5fd6', tags: ['bold', 'fancy'], unlock: 3 },
  { id: 'hc10', name: 'Platinum', c: '#dfe2e8', tags: ['formal', 'white'], unlock: 4 },
  { id: 'hc8', name: 'Snow White', c: '#eef2f7', tags: ['white', 'sparkle'], unlock: 4 },
];

// Dresses: paths drawn in doll coordinate space (see drawDoll)
const DRESSES = [
  {
    id: 'd1', name: 'Party Dress', tags: ['fancy', 'pink', 'cute'],
    paths: [{ d: 'M120 192 Q160 180 200 192 L206 252 L238 382 Q160 404 82 382 L114 252 Z', fill: '#ff6fb5' },
            { d: 'M112 248 L208 248 L210 262 L110 262 Z', fill: '#ffd447' }],
  },
  {
    id: 'd2', name: 'Sundress', tags: ['sunny', 'cute'],
    paths: [{ d: 'M122 192 Q160 182 198 192 L204 250 L226 360 Q160 380 94 360 L116 250 Z', fill: '#ffd447' },
            { d: 'M116 250 L204 250 L206 264 L114 264 Z', fill: '#ff8a65' }],
  },
  {
    id: 'd3', name: 'Tee & Skirt', tags: ['casual', 'blue', 'sunny'],
    paths: [{ d: 'M118 192 Q160 180 202 192 L204 262 Q160 274 116 262 Z', fill: '#4fc3f7' },
            { d: 'M116 258 L204 258 L216 332 Q160 346 104 332 Z', fill: '#3a5fa8' }],
  },
  {
    id: 'd10', name: 'Ruby Gown', tags: ['formal', 'fancy', 'bold'],
    paths: [{ d: 'M120 192 Q160 180 200 192 L204 258 Q244 360 238 456 Q160 476 82 456 Q76 360 116 258 Z', fill: '#a3123f' },
            { d: 'M116 254 L204 254 L206 266 L114 266 Z', fill: '#d4526e' }],
  },
  {
    id: 'd4', name: 'Flower Frock', tags: ['green', 'floral', 'cute'], unlock: 1,
    paths: [{ d: 'M120 192 Q160 180 200 192 L206 252 L232 372 Q160 392 88 372 L114 252 Z', fill: '#8fd97f' },
            { d: 'M0 0', fill: 'none', flowers: true }],
  },
  {
    id: 'd5', name: 'Ball Gown', tags: ['fancy', 'formal', 'sparkle'], unlock: 1,
    paths: [{ d: 'M120 192 Q160 180 200 192 L206 248 Q274 344 262 452 Q160 480 58 452 Q46 344 114 248 Z', fill: '#b79cff' },
            { d: 'M114 246 L206 246 L208 260 L112 260 Z', fill: '#ffffff' }],
  },
  {
    id: 'd11', name: 'Little Black Dress', tags: ['formal', 'dark', 'bold'], unlock: 1,
    paths: [{ d: 'M122 192 Q160 182 198 192 L202 256 L212 356 Q160 372 108 356 L118 256 Z', fill: '#26222b' }],
  },
  {
    id: 'd6', name: 'Mermaid Gown', tags: ['fancy', 'formal', 'blue'], unlock: 2,
    paths: [{ d: 'M120 192 Q160 180 200 192 L204 262 L194 382 Q224 432 210 464 Q160 480 110 464 Q96 432 126 382 L116 262 Z', fill: '#3fd0c9' }],
  },
  {
    id: 'd12', name: 'Emerald Gown', tags: ['formal', 'green', 'fancy'], unlock: 2,
    paths: [{ d: 'M120 192 Q160 180 200 192 L204 256 Q250 356 242 458 Q160 478 78 458 Q70 356 116 256 Z', fill: '#1d7a54' },
            { d: 'M114 252 L206 252 L208 264 L112 264 Z', fill: '#ffce54' }],
  },
  {
    id: 'd7', name: 'Rock Dress', tags: ['dark', 'bold', 'sparkle'], unlock: 2,
    paths: [{ d: 'M120 192 Q160 180 200 192 L206 252 L228 356 L212 348 L204 366 L188 352 L172 370 L156 352 L140 370 L124 352 L112 366 L104 348 L92 356 L114 252 Z', fill: '#3a3a3a' },
            { d: 'M114 248 L206 248 L208 260 L112 260 Z', fill: '#e8384f' }],
  },
  {
    id: 'd8', name: 'Tutu Sparkle', tags: ['pink', 'fancy', 'cute', 'sparkle'], unlock: 3,
    paths: [{ d: 'M122 192 Q160 182 198 192 L202 268 Q160 278 118 268 Z', fill: '#ff8cc6' },
            { d: 'M112 264 Q60 300 74 330 Q120 350 160 348 Q200 350 246 330 Q260 300 208 264 Q160 280 112 264 Z', fill: '#ffc2e0' }],
  },
  {
    id: 'd13', name: 'Starlight Gown', tags: ['formal', 'dark', 'sparkle'], unlock: 4,
    paths: [{ d: 'M120 192 Q160 180 200 192 L204 256 Q252 356 244 458 Q160 478 76 458 Q68 356 116 256 Z', fill: '#232a5c' },
            { d: 'M0 0', fill: 'none', stars: true }],
  },
  {
    id: 'd9', name: 'Snow Gown', tags: ['white', 'blue', 'formal', 'sparkle'], unlock: 4,
    paths: [{ d: 'M120 192 Q160 180 200 192 L206 248 Q268 348 256 452 Q160 478 64 452 Q52 348 114 248 Z', fill: '#eef6ff' },
            { d: 'M114 246 L206 246 L208 262 L112 262 Z', fill: '#a8dcff' }],
  },
  {
    id: 'd14', name: 'Champagne Gown', tags: ['formal', 'fancy', 'sparkle', 'white'], unlock: 5,
    paths: [{ d: 'M120 192 Q160 180 200 192 L204 258 Q248 358 240 456 Q160 476 80 456 Q72 358 116 258 Z', fill: '#e8d5b0' },
            { d: 'M114 254 L206 254 L208 266 L112 266 Z', fill: '#c9a86a' }],
  },
];

const SHOES = [
  { id: 'sh1', name: 'Ballet Flats', c: '#ff6fb5', kind: 'flat', tags: ['pink', 'cute'] },
  { id: 'sh2', name: 'Sneakers', c: '#ffffff', kind: 'sneaker', tags: ['casual', 'sunny'] },
  { id: 'sh3', name: 'Red Heels', c: '#d92645', kind: 'heel', tags: ['fancy', 'bold', 'formal'] },
  { id: 'sh4', name: 'Sandals', c: '#e8b45a', kind: 'flat', tags: ['sunny', 'casual'] },
  { id: 'sh9', name: 'Silver Pumps', c: '#c9cfdd', kind: 'heel', tags: ['formal', 'sparkle', 'white'] },
  { id: 'sh5', name: 'Rock Boots', c: '#3a3a3a', kind: 'boot', tags: ['dark', 'bold'], unlock: 1 },
  { id: 'sh10', name: 'Black Pumps', c: '#26222b', kind: 'heel', tags: ['formal', 'dark'], unlock: 1 },
  { id: 'sh6', name: 'Glitter Heels', c: '#ffce54', kind: 'heel', tags: ['fancy', 'formal', 'sparkle'], unlock: 2 },
  { id: 'sh7', name: 'Garden Clogs', c: '#8fd97f', kind: 'flat', tags: ['green', 'floral'], unlock: 3 },
  { id: 'sh8', name: 'Ice Boots', c: '#dceeff', kind: 'boot', tags: ['white', 'blue', 'sparkle'], unlock: 4 },
];

const ACCS = [
  { id: 'a0', name: 'None', kind: 'none', tags: [] },
  { id: 'a1', name: 'Pink Bow', kind: 'bow', c: '#ff6fb5', tags: ['pink', 'cute'] },
  { id: 'a2', name: 'Sunnies', kind: 'glasses', c: '#3a3a3a', tags: ['sunny', 'bold'] },
  { id: 'a3', name: 'Necklace', kind: 'necklace', c: '#ffce54', tags: ['fancy'] },
  { id: 'a7', name: 'Pearl Earrings', kind: 'earrings', c: '#f2f0e8', tags: ['formal', 'fancy'] },
  { id: 'a4', name: 'Flower Clip', kind: 'flower', c: '#ff8a65', tags: ['floral', 'green', 'cute'], unlock: 1 },
  { id: 'a8', name: 'Tiara', kind: 'tiara', c: '#dfe3ec', tags: ['formal', 'fancy', 'sparkle'], unlock: 1 },
  { id: 'a5', name: 'Gold Crown', kind: 'crown', c: '#ffce54', tags: ['fancy', 'sparkle'], unlock: 2 },
  { id: 'a6', name: 'Star Clip', kind: 'star', c: '#ffd447', tags: ['sparkle', 'bold'], unlock: 3 },
  { id: 'a9', name: 'Pearl Necklace', kind: 'pearls', c: '#f2f0e8', tags: ['formal', 'fancy'], unlock: 3 },
];

const CATALOG = { nails: NAILS, lips: LIPS, shadow: SHADOW, blush: BLUSH, hairStyle: HAIR_STYLES, hairColor: HAIR_COLORS, dress: DRESSES, shoes: SHOES, acc: ACCS };

/* ============================== STATE ============================== */

const state = {
  skin: SKINS[2],
  round: 0,          // 0-based round index
  totals: { player: 0, Zoe: 0, Kai: 0, Mimi: 0 },
  look: null,
  pose: 'rest',
  timeLeft: 0,
  timerId: null,
};

function freshLook() {
  return { nails: null, lips: null, shadow: null, blush: null, hairStyle: HAIR_STYLES[0], hairColor: HAIR_COLORS[0], dress: null, shoes: null, acc: null };
}

function isUnlocked(item) { return (item.unlock || 0) <= state.round; }

/* ============================== DOLL SVG ============================== */

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, v + amt));
  return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0');
}

// Poses: arm curves + hand placement. Hands drawn fingers-down at rot 0.
const POSES = {
  rest: {
    armL: 'M124 202 Q102 262 92 314', handL: { x: 91, y: 318, r: 4 },
    armR: 'M196 202 Q218 262 228 314', handR: { x: 229, y: 318, r: -4 },
  },
  hips: {
    armL: 'M124 202 Q84 246 106 282', handL: { x: 111, y: 284, r: -55 },
    armR: 'M196 202 Q236 246 214 282', handR: { x: 209, y: 284, r: 55 },
  },
  wave: {
    armL: 'M124 202 Q102 262 92 314', handL: { x: 91, y: 318, r: 4 },
    armR: 'M196 202 Q246 172 252 126', handR: { x: 253, y: 122, r: 172 },
  },
  star: {
    armL: 'M124 202 Q92 158 80 118', handL: { x: 78, y: 114, r: 165 },
    armR: 'M196 202 Q228 158 240 118', handR: { x: 242, y: 114, r: -165 },
  },
};

function handSvg(skin, nail, h, flip) {
  const nc = nail || shade(skin, 30);
  const edge = shade(skin, -28);
  let fingers = '';
  [[-10, 13], [-3.5, 16], [3.5, 15], [10, 12]].forEach(([fx, len]) => {
    fingers += `<rect x="${fx - 3.4}" y="7" width="6.8" height="${len}" rx="3.4" fill="${skin}"/>` +
      `<ellipse cx="${fx}" cy="${5 + len}" rx="2.6" ry="3.2" fill="${nc}" stroke="${edge}" stroke-width="0.6"/>`;
  });
  const thumb = `<rect x="-20" y="3" width="6.5" height="12" rx="3.2" fill="${skin}" transform="rotate(28 -16.5 5)"/>` +
    `<ellipse cx="-16.5" cy="15" rx="2.4" ry="2.9" fill="${nc}" stroke="${edge}" stroke-width="0.6" transform="rotate(28 -16.5 5)"/>`;
  return `<g transform="translate(${h.x},${h.y}) rotate(${h.r}) ${flip ? 'scale(-1,1)' : ''}">
    <ellipse cx="0" cy="6" rx="14.5" ry="11" fill="${skin}"/>${fingers}${thumb}</g>`;
}

function hairPaths(styleId, color) {
  const dark = shade(color, -24);
  const P = (d, f = color) => `<path d="${d}" fill="${f}"/>`;
  const topCap = P('M104 112 Q106 44 160 44 Q214 44 216 112 Q206 68 160 64 Q114 68 104 112 Z') +
    `<path d="M118 70 Q140 58 160 58" fill="none" stroke="${dark}" stroke-width="2" opacity="0.5"/>`;
  switch (styleId) {
    case 'h1': // long waves
      return {
        back: P('M100 110 Q92 260 126 310 Q160 322 194 310 Q228 260 220 110 Q212 46 160 46 Q108 46 100 110 Z') +
          `<path d="M112 150 Q106 240 126 292 M208 150 Q214 240 194 292" fill="none" stroke="${dark}" stroke-width="2.5" opacity="0.4"/>`,
        front: topCap,
      };
    case 'h2': // bob
      return {
        back: P('M100 118 Q96 188 128 202 L192 202 Q224 188 220 118 Q214 46 160 46 Q106 46 100 118 Z') +
          `<path d="M110 130 Q108 176 126 192 M210 130 Q212 176 194 192" fill="none" stroke="${dark}" stroke-width="2.5" opacity="0.4"/>`,
        front: topCap,
      };
    case 'h3': // ponytail
      return {
        back: P('M210 88 Q252 118 246 204 Q240 248 216 258 Q230 192 204 128 Z') + `<circle cx="214" cy="86" r="12" fill="${color}"/>` +
          `<circle cx="214" cy="86" r="5" fill="${dark}" opacity="0.5"/>`,
        front: topCap,
      };
    case 'h4': // space buns
      return {
        back: `<circle cx="106" cy="62" r="24" fill="${color}"/><circle cx="214" cy="62" r="24" fill="${color}"/>` +
          `<circle cx="106" cy="62" r="12" fill="${dark}" opacity="0.35"/><circle cx="214" cy="62" r="12" fill="${dark}" opacity="0.35"/>`,
        front: topCap,
      };
    case 'h5': { // curly cloud
      let c = '';
      const pts = [[104, 96], [112, 62], [138, 44], [160, 38], [182, 44], [208, 62], [216, 96], [212, 126], [108, 126]];
      pts.forEach(([x, y]) => { c += `<circle cx="${x}" cy="${y}" r="24" fill="${color}"/>`; });
      c += `<circle cx="126" cy="70" r="8" fill="${dark}" opacity="0.3"/><circle cx="192" cy="60" r="8" fill="${dark}" opacity="0.3"/>`;
      return { back: c, front: '' };
    }
    case 'h6': // braids
      return {
        back: P('M88 100 Q84 110 86 128 L92 282 Q100 296 112 282 L116 128 Q116 108 110 98 Z') +
              P('M232 100 Q236 110 234 128 L228 282 Q220 296 208 282 L204 128 Q204 108 210 98 Z') +
              `<circle cx="102" cy="290" r="8" fill="${color}"/><circle cx="218" cy="290" r="8" fill="${color}"/>` +
              `<path d="M92 140 L112 152 M92 176 L112 188 M92 212 L112 224 M92 248 L110 258 M228 140 L208 152 M228 176 L208 188 M228 212 L208 224 M228 248 L210 258" stroke="${dark}" stroke-width="2" opacity="0.5"/>`,
        front: topCap,
      };
    case 'h7': // elegant updo
      return {
        back: '',
        front: topCap + `<circle cx="160" cy="34" r="24" fill="${color}"/>` +
          `<path d="M142 34 Q160 20 178 34" fill="none" stroke="${dark}" stroke-width="2.5" opacity="0.5"/>` +
          `<path d="M108 118 Q104 132 110 142" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>` +
          `<path d="M212 118 Q216 132 210 142" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`,
      };
    case 'h8': // pixie
      return {
        back: P('M102 116 Q100 142 116 148 L204 148 Q220 142 218 116 Q214 44 160 44 Q106 44 102 116 Z'),
        front: P('M104 112 Q106 44 160 44 Q214 44 216 112 Q210 66 172 66 Q188 84 170 96 Q140 66 114 84 Q106 94 104 112 Z'),
      };
    case 'h9': // princess curls
      return {
        back: P('M98 110 Q88 200 100 270 Q112 322 140 330 Q160 338 180 330 Q208 322 220 270 Q232 200 222 110 Q214 44 160 44 Q106 44 98 110 Z') +
          `<circle cx="118" cy="316" r="17" fill="${color}"/><circle cx="202" cy="316" r="17" fill="${color}"/>` +
          `<path d="M112 150 Q100 230 114 290 M208 150 Q220 230 206 290 M160 340 Q160 340 160 340" fill="none" stroke="${dark}" stroke-width="2.5" opacity="0.4"/>`,
        front: topCap,
      };
    default: return { back: '', front: topCap };
  }
}

function shoesSvg(item) {
  if (!item) return '';
  const one = (x) => {
    switch (item.kind) {
      case 'boot': return `<rect x="${x - 13}" y="432" width="26" height="52" rx="8" fill="${item.c}"/><ellipse cx="${x + 2}" cy="484" rx="18" ry="8" fill="${item.c}"/>`;
      case 'heel': return `<ellipse cx="${x}" cy="478" rx="15" ry="8" fill="${item.c}"/><rect x="${x + 8}" y="478" width="5" height="14" rx="2" fill="${item.c}"/>`;
      case 'sneaker': return `<ellipse cx="${x + 1}" cy="478" rx="17" ry="9" fill="${item.c}" stroke="#cfcfcf" stroke-width="1.5"/><ellipse cx="${x + 1}" cy="482" rx="17" ry="5" fill="#f2607a"/>`;
      default: return `<ellipse cx="${x}" cy="478" rx="16" ry="8" fill="${item.c}"/>`;
    }
  };
  return one(140) + one(180);
}

function accSvg(item) {
  if (!item || item.kind === 'none') return '';
  switch (item.kind) {
    case 'bow': return `<path d="M196 62 L216 50 L214 74 Z" fill="${item.c}"/><path d="M232 62 L214 50 L216 74 Z" fill="${item.c}"/><circle cx="215" cy="62" r="6" fill="#d94f94"/>`;
    case 'glasses': return `<circle cx="140" cy="112" r="14" fill="${item.c}" opacity="0.85"/><circle cx="180" cy="112" r="14" fill="${item.c}" opacity="0.85"/><rect x="150" y="108" width="20" height="4" fill="${item.c}"/>`;
    case 'necklace': return `<path d="M140 186 Q160 204 180 186" fill="none" stroke="${item.c}" stroke-width="4"/><circle cx="160" cy="198" r="5" fill="${item.c}"/>`;
    case 'pearls': return `<path d="M138 184 Q160 202 182 184" fill="none" stroke="none"/>` +
      [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(i => `<circle cx="${160 + i * 5.5}" cy="${190 + Math.cos(i * 0.4) * 6}" r="3.2" fill="${item.c}" stroke="#d8d2c0" stroke-width="0.6"/>`).join('');
    case 'earrings': return `<circle cx="106" cy="136" r="4" fill="${item.c}" stroke="#cfc9b8" stroke-width="0.8"/><circle cx="214" cy="136" r="4" fill="${item.c}" stroke="#cfc9b8" stroke-width="0.8"/>`;
    case 'crown': return `<path d="M128 52 L136 24 L150 44 L160 18 L170 44 L184 24 L192 52 Z" fill="${item.c}" stroke="#d9a520" stroke-width="2"/>`;
    case 'tiara': return `<path d="M132 50 Q160 22 188 50 Q160 40 132 50 Z" fill="${item.c}" stroke="#b8bfd0" stroke-width="1.5"/><circle cx="160" cy="30" r="4" fill="#8fd4f5"/><circle cx="145" cy="39" r="2.5" fill="#f5c2dd"/><circle cx="175" cy="39" r="2.5" fill="#f5c2dd"/>`;
    case 'flower': return `<g transform="translate(120,58)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-9" rx="5" ry="9" fill="${item.c}" transform="rotate(${a})"/>`).join('')}<circle r="5" fill="#ffd447"/></g>`;
    case 'star': return `<path d="M206 46 L210 56 L221 57 L213 64 L215 75 L206 69 L197 75 L199 64 L191 57 L202 56 Z" fill="${item.c}"/>`;
    default: return '';
  }
}

function dressSvg(item) {
  if (!item) return '';
  let out = item.paths.map(p => (p.flowers || p.stars) ? '' : `<path d="${p.d}" fill="${p.fill}"/>`).join('');
  if (item.paths.some(p => p.flowers)) {
    [[140, 300], [180, 330], [150, 350], [190, 285]].forEach(([x, y]) => {
      out += `<g transform="translate(${x},${y})">${[0, 90, 180, 270].map(a => `<ellipse cx="0" cy="-6" rx="3.5" ry="6" fill="#ff8fb0" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="#ffd447"/></g>`;
    });
  }
  if (item.paths.some(p => p.stars)) {
    [[136, 290], [184, 320], [152, 370], [200, 400], [120, 400], [160, 430]].forEach(([x, y]) => {
      out += `<path d="M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6} Z" fill="#ffe9a0"/>`;
    });
  }
  return out;
}

function drawDoll(look, skin, pose = 'rest') {
  const p = POSES[pose] || POSES.rest;
  const dark = shade(skin, -30);
  const hair = hairPaths(look.hairStyle.id, look.hairColor.c);
  const nailC = look.nails ? look.nails.c : null;

  const shadowOn = look.shadow && look.shadow.c !== 'none';
  const shadowMk = shadowOn ? `<path d="M130 106 Q140 98 150 106 Q140 102 130 106 Z" fill="${look.shadow.c}"/><path d="M170 106 Q180 98 190 106 Q180 102 170 106 Z" fill="${look.shadow.c}"/>
    <ellipse cx="140" cy="103" rx="10" ry="5" fill="${look.shadow.c}" opacity="0.7"/><ellipse cx="180" cy="103" rx="10" ry="5" fill="${look.shadow.c}" opacity="0.7"/>` : '';
  const blush = (look.blush && look.blush.c !== 'none') ? `<ellipse cx="126" cy="140" rx="9" ry="6" fill="${look.blush.c}" opacity="0.5"/><ellipse cx="194" cy="140" rx="9" ry="6" fill="${look.blush.c}" opacity="0.5"/>` : '';
  const lips = (look.lips && look.lips.c !== 'none')
    ? `<path d="M146 152 Q153 146 160 152 Q167 146 174 152 Q167 164 160 162 Q153 164 146 152 Z" fill="${look.lips.c}"/>
       <path d="M150 152 Q160 156 170 152" fill="none" stroke="${shade(look.lips.c, -40)}" stroke-width="1" opacity="0.6"/>`
    : `<path d="M148 154 Q160 164 172 154" fill="none" stroke="#c96f6f" stroke-width="3" stroke-linecap="round"/>`;

  const eye = (cx) => `
    <ellipse cx="${cx}" cy="114" rx="8" ry="9.5" fill="#fff"/>
    <circle cx="${cx}" cy="115.5" r="5" fill="#6b4226"/>
    <circle cx="${cx}" cy="116" r="2.4" fill="#241408"/>
    <circle cx="${cx + 1.8}" cy="113" r="1.6" fill="#fff"/>
    <circle cx="${cx - 2}" cy="118" r="0.8" fill="#fff" opacity="0.8"/>
    <path d="M${cx - 8} 108 Q${cx} 102 ${cx + 8} 108" fill="none" stroke="#3d2418" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M${cx + 7} 107 L${cx + 10} 104 M${cx + 4.5} 105.5 L${cx + 7} 102" stroke="#3d2418" stroke-width="1.4" stroke-linecap="round"/>`;

  return `<svg viewBox="0 0 320 510" xmlns="http://www.w3.org/2000/svg">
    <g>${hair.back}</g>
    <!-- legs + feet -->
    <path d="M144 300 L142 468" stroke="${skin}" stroke-width="19" stroke-linecap="round"/>
    <path d="M176 300 L178 468" stroke="${skin}" stroke-width="19" stroke-linecap="round"/>
    <ellipse cx="139" cy="476" rx="12" ry="6" fill="${skin}"/>
    <ellipse cx="181" cy="476" rx="12" ry="6" fill="${skin}"/>
    <g>${shoesSvg(look.shoes)}</g>
    <!-- arms -->
    <path d="${p.armL}" stroke="${skin}" stroke-width="15" stroke-linecap="round" fill="none"/>
    <path d="${p.armR}" stroke="${skin}" stroke-width="15" stroke-linecap="round" fill="none"/>
    <!-- torso with waist -->
    <path d="M122 190 Q160 176 198 190 Q204 238 194 260 Q204 288 204 304 Q160 318 116 304 Q116 288 126 260 Q116 238 122 190 Z" fill="${skin}"/>
    <!-- base clothes: always dressed -->
    <path d="M126 194 Q160 184 194 194 L198 264 Q160 274 122 264 Z" fill="#ffffff"/>
    <path d="M126 194 Q160 184 194 194 L193 202 Q160 192 127 202 Z" fill="#f0eaf5"/>
    <path d="M122 258 L198 258 L205 344 L169 344 L160 312 L151 344 L115 344 Z" fill="#cfd8ea"/>
    <g>${dressSvg(look.dress)}</g>
    <!-- hands with fingers -->
    ${handSvg(skin, nailC, p.handL, false)}
    ${handSvg(skin, nailC, p.handR, true)}
    <!-- neck, ears, head -->
    <rect x="148" y="162" width="24" height="28" rx="9" fill="${skin}"/>
    <path d="M148 166 Q160 176 172 166" fill="${dark}" opacity="0.25"/>
    <ellipse cx="106" cy="124" rx="7" ry="11" fill="${skin}"/>
    <ellipse cx="214" cy="124" rx="7" ry="11" fill="${skin}"/>
    <ellipse cx="160" cy="115" rx="53" ry="58" fill="${skin}"/>
    <ellipse cx="160" cy="120" rx="46" ry="50" fill="${shade(skin, 12)}" opacity="0.35"/>
    <g>${shadowMk}</g>
    ${eye(140)}${eye(180)}
    <path d="M129 95 Q140 89 151 94" fill="none" stroke="#5a4030" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M169 94 Q180 89 191 95" fill="none" stroke="#5a4030" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M157 128 Q155 135 160 137" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    <g>${blush}</g>
    <g>${lips}</g>
    <g>${hair.front}</g>
    <g>${accSvg(look.acc)}</g>
  </svg>`;
}

/* ============================== UI HELPERS ============================== */

const $ = (id) => document.getElementById(id);

function show(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(screenId).classList.add('active');
}

function renderDoll() {
  $('dollWrap').innerHTML = drawDoll(state.look, state.skin);
}

function sparkle() {
  const wrap = $('dollWrap');
  const s = document.createElement('div');
  s.className = 'sparkle';
  s.textContent = '✨';
  s.style.left = (30 + Math.random() * 40) + '%';
  s.style.top = (20 + Math.random() * 40) + '%';
  wrap.appendChild(s);
  setTimeout(() => s.remove(), 700);
}

function starString(score) {
  const full = '★'.repeat(Math.floor(score));
  return (full + (score % 1 >= 0.5 ? '½' : '')) || '☆';
}

/* ============================== SALON PANEL ============================== */

const TABS = [
  { id: 'nails', label: 'Nails', emoji: '💅' },
  { id: 'makeup', label: 'Makeup', emoji: '💄' },
  { id: 'hair', label: 'Hair', emoji: '💇' },
  { id: 'outfit', label: 'Outfit', emoji: '👗' },
];
let currentTab = 'nails';

function buildTabs() {
  $('tabs').innerHTML = TABS.map(t =>
    `<button class="tab ${t.id === currentTab ? 'sel' : ''}" data-tab="${t.id}"><span class="tab-emoji">${t.emoji}</span>${t.label}</button>`).join('');
  $('tabs').querySelectorAll('.tab').forEach(b => b.onclick = () => { currentTab = b.dataset.tab; buildTabs(); buildTabContent(); });
}

function swatchRow(title, items, lookKey) {
  const btns = items.map(it => {
    const locked = !isUnlocked(it);
    const sel = state.look[lookKey] && state.look[lookKey].id === it.id;
    const bg = it.c === 'none' ? 'background:#fff' : `background:${it.c}`;
    const label = locked ? '🔒' : (it.c === 'none' ? '🚫' : '');
    return `<button class="swatch ${sel ? 'sel' : ''} ${it.glitter ? 'glitter' : ''} ${locked ? 'locked' : ''}" style="${bg}" data-key="${lookKey}" data-id="${it.id}" aria-label="${it.name}${locked ? ' (locked)' : ''}">${label}</button>`;
  }).join('');
  return `<div class="opt-group"><h3>${title}</h3><div class="opt-row">${btns}</div></div>`;
}

function itemThumb(it, lookKey) {
  let inner;
  if (lookKey === 'dress') {
    inner = `<svg viewBox="40 170 240 320">${dressSvg(it)}</svg>`;
  } else if (lookKey === 'hairStyle') {
    const h = hairPaths(it.id, state.look.hairColor.c);
    inner = `<svg viewBox="60 0 200 340">${h.back}<ellipse cx="160" cy="115" rx="53" ry="58" fill="${state.skin}"/>${h.front}</svg>`;
  } else if (lookKey === 'shoes') {
    inner = `<svg viewBox="110 420 100 80">${shoesSvg(it)}</svg>`;
  } else if (lookKey === 'acc') {
    inner = it.kind === 'none' ? `<span class="item-emoji">🚫</span>` : `<svg viewBox="80 10 160 200">${accSvg(it)}</svg>`;
  }
  const locked = !isUnlocked(it);
  const sel = state.look[lookKey] && state.look[lookKey].id === it.id;
  return `<button class="item-btn ${sel ? 'sel' : ''} ${locked ? 'locked' : ''}" data-key="${lookKey}" data-id="${it.id}">
    ${inner}${locked ? '<span class="lock-badge">🔒</span>' : ''}<span class="item-name">${it.name}</span></button>`;
}

function itemRow(title, items, lookKey) {
  const btns = items.map(it => itemThumb(it, lookKey)).join('');
  return `<div class="opt-group"><h3>${title}</h3><div class="opt-row">${btns}</div></div>`;
}

function buildTabContent() {
  const c = $('tabContent');
  if (currentTab === 'nails') c.innerHTML = swatchRow('Polish', NAILS, 'nails');
  else if (currentTab === 'makeup') c.innerHTML =
    swatchRow('Lipstick', LIPS, 'lips') + swatchRow('Eyeshadow', SHADOW, 'shadow') + swatchRow('Blush', BLUSH, 'blush');
  else if (currentTab === 'hair') c.innerHTML =
    itemRow('Style', HAIR_STYLES, 'hairStyle') + swatchRow('Color', HAIR_COLORS, 'hairColor');
  else c.innerHTML =
    itemRow('Dresses', DRESSES, 'dress') + itemRow('Shoes', SHOES, 'shoes') + itemRow('Extras', ACCS, 'acc');

  c.querySelectorAll('[data-key]').forEach(b => {
    b.onclick = () => {
      if (b.classList.contains('locked')) {
        b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 250 });
        return;
      }
      const { key, id } = b.dataset;
      state.look[key] = CATALOG[key].find(i => i.id === id);
      renderDoll();
      sparkle();
      buildTabContent(); // refresh selection rings
    };
  });
}

/* ============================== WALK AROUND (salon) ============================== */

function setupWalk() {
  const area = document.querySelector('.doll-area');
  const wrap = $('dollWrap');
  area.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#dollWrap')) return; // tapping doll itself does nothing
    const rect = area.getBoundingClientRect();
    const max = rect.width * 0.32;
    const x = Math.max(-max, Math.min(max, e.clientX - rect.left - rect.width / 2));
    wrap.classList.add('walking');
    wrap.style.transform = `translateX(${x}px)`;
    setTimeout(() => wrap.classList.remove('walking'), 950);
  });
}

/* ============================== TIMER ============================== */

function startTimer(seconds) {
  clearInterval(state.timerId);
  state.timeLeft = seconds;
  updateTimer();
  state.timerId = setInterval(() => {
    state.timeLeft--;
    updateTimer();
    if (state.timeLeft <= 0) { clearInterval(state.timerId); goToStage(); }
  }, 1000);
}

function updateTimer() {
  const t = $('timer');
  t.textContent = '⏰ ' + state.timeLeft;
  t.classList.toggle('low', state.timeLeft <= 10);
}

/* ============================== JUDGING ============================== */

function judgePlayer() {
  const theme = THEMES[state.round];
  const picks = [state.look.nails, state.look.lips, state.look.shadow, state.look.blush,
                 state.look.hairStyle, state.look.hairColor, state.look.dress, state.look.shoes, state.look.acc];
  let pts = 0;
  let styled = 0;
  picks.forEach(it => {
    if (!it || it.c === 'none' || it.kind === 'none') return;
    styled++;
    pts += it.tags.filter(t => theme.tags.includes(t)).length * 0.3;
  });
  pts += Math.min(styled * 0.15, 1.2); // reward finishing the whole look
  const stars = Math.max(1, Math.min(5, Math.round((0.6 + pts) * 2) / 2));
  return stars;
}

function rivalScore() {
  const s = 2 + Math.random() * 2 + state.round * 0.15;
  return Math.min(4.5, Math.round(s * 2) / 2);
}

/* ============================== STAGE FLOW ============================== */

const STAGE_POSES = [
  { id: 'rest', emoji: '🧍', name: 'Stand' },
  { id: 'hips', emoji: '💁', name: 'Sassy' },
  { id: 'wave', emoji: '👋', name: 'Wave' },
  { id: 'star', emoji: '🌟', name: 'Star' },
];

function renderStageDoll() {
  $('stageDoll').innerHTML = drawDoll(state.look, state.skin, state.pose);
}

function goToStage() {
  clearInterval(state.timerId);
  state.pose = 'rest';
  show('screen-stage');
  const theme = THEMES[state.round];
  $('stageTitle').textContent = `${theme.emoji} ${theme.name}`;
  renderStageDoll();
  $('stageDoll').classList.remove('stage-walk');
  void $('stageDoll').offsetWidth; // restart animation
  $('stageDoll').classList.add('stage-walk');
  $('judges').innerHTML = '';
  $('playerStars').innerHTML = '';
  $('scoreboard').classList.add('hidden');
  $('btnNext').classList.add('hidden');
  $('btnPhoto').classList.add('hidden');
  buildPoseBar();
  $('poseBar').classList.remove('hidden');
}

function buildPoseBar() {
  $('poseBtns').innerHTML = STAGE_POSES.map(p =>
    `<button class="pose-btn ${state.pose === p.id ? 'sel' : ''}" data-pose="${p.id}"><span>${p.emoji}</span>${p.name}</button>`).join('');
  $('poseBtns').querySelectorAll('.pose-btn').forEach(b =>
    b.onclick = () => { state.pose = b.dataset.pose; renderStageDoll(); buildPoseBar(); });
}

function startJudging() {
  $('poseBar').classList.add('hidden');
  $('stageTitle').textContent = `${THEMES[state.round].emoji} ${THEMES[state.round].name} — Judging!`;

  const stars = judgePlayer();
  const judgeScores = JUDGES.map(() =>
    Math.max(1, Math.min(5, stars + (Math.random() < 0.34 ? -0.5 : Math.random() < 0.5 ? 0 : 0.5))));

  $('judges').innerHTML = JUDGES.map((j, i) =>
    `<div class="judge"><div class="j-face">${j.face}</div><div class="j-name">${j.name}</div><div class="j-stars" id="jstars${i}"></div></div>`).join('');

  JUDGES.forEach((j, i) => {
    setTimeout(() => { $('jstars' + i).textContent = starString(judgeScores[i]); }, 800 + i * 700);
  });
  setTimeout(() => {
    const el = $('playerStars');
    let n = 0;
    const target = Math.floor(stars);
    const iv = setInterval(() => {
      n++;
      el.innerHTML = '<span class="star-pop">★</span>'.repeat(n) + (n === target && stars % 1 >= 0.5 ? '<span class="star-pop">½</span>' : '');
      if (n >= target) { clearInterval(iv); showScoreboard(stars); }
    }, 350);
    if (target === 0) showScoreboard(stars);
  }, 800 + JUDGES.length * 700 + 400);
}

function showScoreboard(playerStars) {
  const results = [{ name: 'You', face: '💖', stars: playerStars, player: true }]
    .concat(RIVALS.map(r => ({ name: r.name, face: r.face, stars: rivalScore() })));
  results.sort((a, b) => b.stars - a.stars);

  state.totals.player += playerStars;
  RIVALS.forEach(r => { const row = results.find(x => x.name === r.name); state.totals[r.name] += row.stars; });

  setTimeout(() => {
    $('scoreboard').innerHTML = results.map((r, i) =>
      `<div class="score-row ${i === 0 ? 'winner' : ''}">
        <span class="s-face">${r.face}</span><span class="s-name">${r.name}${i === 0 ? ' 👑' : ''}</span>
        <span class="s-stars">${starString(r.stars)} ${r.stars}</span></div>`).join('');
    $('scoreboard').classList.remove('hidden');
    $('btnNext').textContent = state.round + 1 >= THEMES.length ? 'See Results 🏆' : 'Next Round ➜';
    $('btnNext').classList.remove('hidden');
    $('btnPhoto').classList.remove('hidden');
    $('btnNext').scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 600);
}

function nextStep() {
  state.round++;
  if (state.round >= THEMES.length) { showFinal(); return; }
  const fresh = Object.values(CATALOG).flat().filter(it => (it.unlock || 0) === state.round);
  if (fresh.length) showUnlocks(fresh);
  else startRound();
}

function showUnlocks(items) {
  $('unlockItems').innerHTML = items.map((it, i) => {
    const chip = it.c && it.c !== 'none'
      ? `<span class="swatch ${it.glitter ? 'glitter' : ''}" style="background:${it.c};display:inline-block"></span>`
      : `<span class="item-emoji">🎀</span>`;
    return `<div class="item-btn" style="animation-delay:${i * 0.12}s">${chip}<span class="item-name">${it.name}</span></div>`;
  }).join('');
  $('overlay-unlock').classList.remove('hidden');
}

function showFinal() {
  show('screen-final');
  const rows = [{ name: 'You', face: '💖', stars: state.totals.player }]
    .concat(RIVALS.map(r => ({ name: r.name, face: r.face, stars: state.totals[r.name] })));
  rows.sort((a, b) => b.stars - a.stars);
  const won = rows[0].name === 'You';
  $('finalTitle').textContent = won ? 'You are the Fashion Champion!' : `${rows[0].name} wins this time!`;
  $('finalBoard').innerHTML = rows.map((r, i) =>
    `<div class="score-row"><span class="s-face">${r.face}</span><span class="s-name">${r.name}${i === 0 ? ' 👑' : ''}</span>
      <span class="s-stars">★ ${Math.round(r.stars * 10) / 10}</span></div>`).join('');
}

function savePhoto() {
  const svg = drawDoll(state.look, state.skin, state.pose).replace('<svg ', '<svg width="640" height="1020" ');
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = 640; cv.height = 1110;
    const ctx = cv.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 1110);
    grad.addColorStop(0, '#ffd9ec');
    grad.addColorStop(1, '#d9c8ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 1110);
    ctx.drawImage(img, 0, 20);
    ctx.fillStyle = '#e84a97';
    ctx.font = 'bold 40px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💖 Fashion for Life', 320, 1070);
    const theme = THEMES[state.round];
    if (theme) {
      ctx.fillStyle = '#4a2b5f';
      ctx.font = '600 28px Fredoka, sans-serif';
      ctx.fillText(`${theme.emoji} ${theme.name}`, 320, 1030);
    }
    cv.toBlob(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'my-fashion-look.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    });
  };
  img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}

/* ============================== ROUND FLOW ============================== */

function startRound() {
  const theme = THEMES[state.round];
  state.look = freshLook();

  $('themeRound').textContent = `Round ${state.round + 1} of ${THEMES.length}`;
  $('themeEmoji').textContent = theme.emoji;
  $('themeName').textContent = theme.name;
  $('themeHint').textContent = theme.hint;
  $('themeTime').textContent = `⏰ ${theme.time} seconds!`;
  $('overlay-theme').classList.remove('hidden');

  setTimeout(() => {
    $('overlay-theme').classList.add('hidden');
    show('screen-salon');
    $('salonTheme').textContent = `${theme.emoji} ${theme.name}`;
    currentTab = 'nails';
    $('dollWrap').style.transform = '';
    buildTabs();
    buildTabContent();
    renderDoll();
    startTimer(theme.time);
  }, 2600);
}

function newGame() {
  state.round = 0;
  state.totals = { player: 0, Zoe: 0, Kai: 0, Mimi: 0 };
  startRound();
}

/* ============================== BOOT ============================== */

function buildSkinRow() {
  $('skinRow').innerHTML = SKINS.map(c =>
    `<button class="skin-dot ${c === state.skin ? 'sel' : ''}" style="background:${c}" data-skin="${c}" aria-label="skin tone"></button>`).join('');
  $('skinRow').querySelectorAll('.skin-dot').forEach(b =>
    b.onclick = () => { state.skin = b.dataset.skin; buildSkinRow(); });
}

// mid-round guard: browser shows a "leave page?" confirm on back/close/navigation
window.addEventListener('beforeunload', (e) => {
  if ($('screen-salon').classList.contains('active')) { e.preventDefault(); e.returnValue = ''; }
});

buildSkinRow();
setupWalk();
$('btnPlay').onclick = newGame;
$('btnDone').onclick = goToStage;
$('btnReady').onclick = startJudging;
$('btnNext').onclick = nextStep;
$('btnPhoto').onclick = savePhoto;
$('btnPhotoFinal').onclick = savePhoto;
$('btnUnlockOk').onclick = () => { $('overlay-unlock').classList.add('hidden'); startRound(); };
$('btnAgain').onclick = () => { show('screen-title'); };
