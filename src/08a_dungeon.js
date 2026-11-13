// Подземелья: отдельный экземпляр мира (W подменяется, наземный мир ждёт в G.over). Комнаты, коридоры, ловушки, сундуки, босс.
const DUNGEONS = [
  { id: 'nest', name: 'Гнездо Грозы', z: 'thicket', lvl: 5, types: ['bat', 'root', 'skel'], boss: 'stormmother' },
  { id: 'mire', name: 'Утроба Топи', z: 'bog', lvl: 6, types: ['toad', 'slime', 'shroom', 'root'], boss: 'slimequeen' },
  { id: 'crypt', name: 'Склеп Костяного Короля', z: 'grave', lvl: 8, types: ['wraith', 'skel', 'bat', 'wolf'], boss: 'boneking' }
];
function placeCrypts() {
  W.crypts = [];
  for (const d of DUNGEONS) {
    let best = null;
    for (let t = 0; t < 4000 && !best; t++) {
      const x = 20 + Math.floor(hash2(t, 1, SEED + 30 + d.lvl) * (MW - 40)), y = 12 + Math.floor(hash2(t, 2, SEED + 31 + d.lvl) * (MH - 24));
      if (zoneAt(x + .5, y + .5) !== d.z || Math.abs(y - pathY(x)) < 8 || dist(x, y, LAIR.x, LAIR.y) < 20) continue;
      let ok = true; for (const c of W.camps) if (dist(x, y, c.x, c.y) < 9) ok = false; if (ok) best = [x, y];
    }
    if (!best) continue; const x = best[0], y = best[1];
    for (let j = -2; j <= 3; j++) for (let i = -2; i <= 2; i++) { const k = (y + j) * MW + x + i; W.o[k] = 0; if (W.g[k] === T.DEEP || W.g[k] === T.SHALLOW) W.g[k] = T.DIRT; if (Math.hypot(i, j) < 2.3) W.g[k] = T.DIRT; }
    W.o[y * MW + x] = O.CRYPT; W.crypts.push({ x: x + .5, y: y + .5, id: d.id });
  }
}
function genDungeon(def) {
  const n = MW * MH, R = mulberry((Math.random() * 1e9) | 0);
  const D = { g: new Uint8Array(n).fill(T.VOID), g0: new Uint8Array(n), o: new Uint8Array(n).fill(O.BLOCK), o0: new Uint8Array(n), zi: new Uint8Array(n).fill(1), fire: new Float32Array(n), puddle: new Float32Array(n), regrow: new Float32Array(n), burning: new Set(), puddles: new Set(), regrowing: new Set(), spawns: [], camps: [], crypts: [], seen: new Uint8Array(n), revT: 0, map: mkCanvas(MW, MH), mapDirty: true, tick: 0, dun: def, traps: [], trap: new Uint8Array(n), rooms: [], trapT: 0 };
  const rooms = [{ x: 74, y: 81, w: 8, h: 8 }];
  for (let t = 0; t < 200 && rooms.length < 7; t++) {
    const w = 8 + (R() * 5 | 0), h = 8 + (R() * 5 | 0), r = { x: 86 + (R() * (46 - w) | 0), y: 56 + (R() * (58 - h) | 0), w, h };
    if (rooms.every(q => r.x + r.w + 3 < q.x || q.x + q.w + 3 < r.x || r.y + r.h + 3 < q.y || q.y + q.h + 3 < r.y)) rooms.push(r);
  }
  rooms.sort((a, b) => a.x - b.x); rooms.push({ x: 136, y: 77, w: 15, h: 15 });
  const carve = (x, y) => { const k = y * MW + x; D.g[k] = T.DFLOOR; D.o[k] = 0; };
  for (const r of rooms) for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) carve(r.x + i, r.y + j);
  for (let i = 0; i + 1 < rooms.length; i++) {
    const a = rooms[i], b = rooms[i + 1], ax = a.x + (a.w >> 1), ay = a.y + (a.h >> 1), bx = b.x + (b.w >> 1), by = b.y + (b.h >> 1);
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) { carve(x, ay); carve(x, ay + 1); }
    for (let y = Math.min(ay, by); y <= Math.max(ay, by) + 1; y++) { carve(bx, y); carve(bx + 1, y); }
  }
  for (let y = 2; y < MH - 2; y++) for (let x = 2; x < MW - 2; x++) { const k = y * MW + x; if (D.g[k] !== T.VOID) continue; let adj = false; for (let j = -1; j <= 1 && !adj; j++) for (let i = -1; i <= 1; i++) if (D.g[k + j * MW + i] === T.DFLOOR) { adj = true; break; } if (adj) D.o[k] = O.WALL; }
  const E = rooms[0], B = rooms[rooms.length - 1];
  D.o[(E.y + 1) * MW + E.x + 1] = O.EXIT; D.start = [E.x + 4, E.y + 4.5]; D.rooms = rooms; D.bossRoom = B;
  for (const r of rooms) { D.o[(r.y) * MW + r.x] = O.LAMP; D.o[(r.y + r.h - 1) * MW + r.x + r.w - 1] = O.LAMP; D.o[(r.y) * MW + r.x + r.w - 1] = O.LAMP; }
  D.pop = [];
  for (let i = 1; i < rooms.length - 1; i++) {
    const r = rooms[i], cnt = 3 + (R() * 3 | 0);
    for (let m = 0; m < cnt; m++) D.pop.push({ t: def.types[(R() * def.types.length) | 0], x: r.x + 1.5 + R() * (r.w - 3), y: r.y + 1.5 + R() * (r.h - 3), elite: m === 0 && R() < .45 });
    for (let t = 0; t < 3; t++) { const tx = r.x + 1 + (R() * (r.w - 2) | 0), ty = r.y + 1 + (R() * (r.h - 2) | 0), k = ty * MW + tx; if (!D.o[k]) { D.trap[k] = 1; D.traps.push(k); } }
    if (i % 2 === 0) D.o[(r.y + r.h - 1) * MW + r.x] = O.CHEST;
  }
  D.g0.set(D.g); D.o0.set(D.o); return D;
}
function enterDungeon(def, c) {
  const p = G.me; G.over = { W, ents: G.ents.filter(e => !e.isPlayer), zones: G.zones, projs: G.projs, pickups: G.pickups, px: c.x, py: c.y + 1.6 };
  G.ents = G.players.slice(); G.zones = []; G.projs = []; G.pickups = []; G.parts = []; G.fx = [];
  W = genDungeon(def); for (const q of G.players) { q.x = W.start[0]; q.y = W.start[1]; q.kx = q.ky = 0; q.dash = q.roll = null; }
  for (const s of W.pop) { const m = mkMob(s.t, s.x, s.y, def.lvl); m.leash = 40; if (s.elite) makeElite(m); }
  const B = W.bossRoom, b = mkMob(def.boss, B.x + B.w / 2 + 2, B.y + B.h / 2, def.lvl + 2); b.leash = 12; b.dunBoss = true; setupBoss(b);
  G.cam.x = p.x; G.cam.y = p.y; G.dark = undefined; banner(def.name.toUpperCase(), 'Подземелье · ур. ' + def.lvl + ' · погибнешь — Тень встанет у входа', '#b04ad8'); Sfx.play('howl');
}
function leaveDungeon() {
  const o = G.over; if (!o) return; const keep = G.ents.filter(e => e.isNemesis && !e.dead);
  W = o.W; G.ents = G.players.concat(o.ents, keep); G.zones = o.zones; G.projs = o.projs; G.pickups = o.pickups; G.parts = []; G.fx = []; G.over = null;
  for (const n of keep) { n.x = n.hx = o.px + 1; n.y = n.hy = o.py + 1; }
  for (const q of G.players) if (!q.dead) { q.x = o.px; q.y = o.py; q.kx = q.ky = 0; q.dash = q.roll = null; }
  G.cam.x = G.me.x; G.cam.y = G.me.y; G.dark = undefined; W.mapDirty = true;
}
function openChest(p, n, boss) {
  W.o[tIdx(n.x, n.y)] = 0; const lvl = W.dun.lvl; Sfx.play('soul'); burst(n.x, n.y, ['#ffd870', '#ffffff'], 24, 5, { glow: 1 }); fxRing(n.x, n.y, .3, 2.5, '#ffd870', .5);
  for (let i = 0; i < (boss ? 3 : 2); i++) dropItem(n.x, n.y + .6, makeItem(lvl + (boss ? 2 : 0), rollRank(boss ? [0, 20, 45, 25, 10] : [25, 45, 22, 7, 1])), p);
  for (let i = 0; i < 5; i++) dropPickup('gold', n.x, n.y + .6, Math.ceil((boss ? 40 : 12) * lvl / 5)); const sh = boss ? 8 : randi(2, 3); p.shards = (p.shards || 0) + sh; floatText(n.x, n.y, '+' + sh + ' ◆', '#8ad0ff', 7);
}
Bus.on('interact', (p, n) => {
  if (n.o === O.CRYPT) { const c = W.crypts.find(q => dist(q.x, q.y, n.x, n.y) < 1), d = c && DUNGEONS.find(q => q.id === c.id); if (d) G.pendingEnter = [d, c]; }
  else if (n.o === O.EXIT) { G.pendingLeave = true; banner('ТЫ ВЫБРАЛСЯ', 'Подземелье изменится к следующему спуску', '#d8d0c0'); if (typeof saveGame === 'function') saveGame(); }
  else if (n.o === O.CHEST) openChest(p, n, W.bossChest === tIdx(n.x, n.y));
});
// Смерть в подземелье: героя выбрасывает наружу, Тень встаёт у входа
Bus.on('playerDeath', (p) => { if (W.dun && G.over) { p.x = G.over.px; p.y = G.over.py; G.pendingLeave = true; } });
Bus.on('mobDeath', (m) => {
  if (!m.dunBoss || !W.dun) return; const B = W.bossRoom, k = (B.y + (B.h >> 1)) * MW + B.x + (B.w >> 1); W.o[k] = O.CHEST; W.bossChest = k;
  G.J.dungeons = G.J.dungeons || {}; G.J.dungeons[W.dun.id] = (G.J.dungeons[W.dun.id] || 0) + 1;
});
G.systems.push(dt => {
  if (G.pendingLeave) { G.pendingLeave = false; leaveDungeon(); return; }
  if (G.pendingEnter) { const e = G.pendingEnter; G.pendingEnter = null; if (!W.dun) enterDungeon(e[0], e[1]); return; }
  if (!W.dun) return;
  // ловушки: решётки в полу периодически извергают пламя
  W.trapT += dt; const ph = W.trapT % 4.5;
  if (ph > 3 && ph < 3.9) for (const k of W.traps) if (W.fire[k] <= 0) { W.fire[k] = .35; W.burning.add(k); }
});
