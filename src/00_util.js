// Утилиты, шум, изометрия, общее состояние игры
const TAU = Math.PI * 2, SEED = 1337;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const rand = (a, b) => a === undefined ? Math.random() : b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
function norm(x, y) { const l = Math.hypot(x, y); return l > 1e-6 ? [x / l, y / l] : [0, 0]; }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y, s) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) { return vnoise(x, y, s) * .5 + vnoise(x * 2, y * 2, s + 11) * .3 + vnoise(x * 4, y * 4, s + 23) * .2; }

// Изометрия: тайл 32x16
const isoX = (x, y) => (x - y) * 16, isoY = (x, y) => (x + y) * 8;
// Виртуальный экран (низкое разрешение)
const V = { w: 427, h: 240, scale: 3, dpr: 1, touch: false };
// Всё состояние симуляции — в одном объекте (удобно для будущей синхронизации по сети)
const G = {
  time: 0, nid: 0, ents: [], projs: [], zones: [], parts: [], texts: [], fx: [], pickups: [], players: [], me: null,
  cam: { x: 0, y: 0, sx: 0, sy: 0, shake: 0 }, paused: true, hitstop: 0, started: false,
  systems: [], hud: [], J: null, nemesis: null, banner: null, canvas: null, buf: null
};
// Шина событий: подсистемы (журнал, немезида, UI) не знают друг о друге
const Bus = { h: {}, on(e, f) { (this.h[e] = this.h[e] || []).push(f); }, emit(e, a, b, c) { const l = this.h[e]; if (l) for (const f of l) f(a, b, c); } };
function w2s(x, y) { return [Math.round(isoX(x, y) - G.cam.sx), Math.round(isoY(x, y) - G.cam.sy)]; }
function s2w(px, py) { const a = (px + G.cam.sx) / 16, b = (py + G.cam.sy) / 8; return [(a + b) / 2, (b - a) / 2]; }
function shake(n) { if (n > G.cam.shake) G.cam.shake = n; }
function newJournal() { return { reactions: {}, recipes: {}, obtained: {}, kills: 0, deaths: 0, nemKills: 0, bossKills: 0, hints: {} }; }
