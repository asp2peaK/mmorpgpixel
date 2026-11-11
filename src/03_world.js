// Мир: генерация карты шумом, зоны, огонь/лужи/зарастание, точки спавна
const MW = 210, MH = 100;
const O = { NONE: 0, TREE: 1, DEAD: 2, ROCK: 3, ALTAR: 4, STONE: 5, MERCH: 6, HOUSE: 7, CRATE: 8, LAMP: 9, BLOCK: 10 };
const TOWN = { x: 14.5, y: 50.5, r: 11 }, LAIR = { x: 196.5, y: 50.5, r: 8.5 };
const ZNAME = { town: 'Город', edge: 'Опушка', thicket: 'Чаща', scorch: 'Выжженная поляна', lair: 'Логово Пепельного Волка' };
const ZLVL = { town: '', edge: 'ур. 1–3', thicket: 'ур. 3–6', scorch: 'ур. 6–9', lair: 'босс, ур. 10' };
// Горючесть тайлов: топливо (сек) и шанс перекинуться на соседа
const FL = {}; FL[T.TALL] = { fuel: 5, sp: .2 }; FL[T.DTALL] = { fuel: 5, sp: .16 }; FL[T.DRY] = { fuel: 2.2, sp: .2 }; FL[T.DRYTALL] = { fuel: 4, sp: .45 };
let W = null;

function pathY(x) { const t = clamp((x - 26) / 22, 0, 1) * clamp((184 - x) / 16, 0, 1), s = t * t * (3 - 2 * t); return 50.5 + (vnoise(x * .045, 3.3, SEED) - .5) * 46 * s; }
function zoneAt(x, y) {
  if (dist(x, y, TOWN.x, TOWN.y) < TOWN.r + 1) return 'town';
  if (dist(x, y, LAIR.x, LAIR.y) < LAIR.r + 3) return 'lair';
  const w = x + (vnoise(y * .08, 7.7, SEED) - .5) * 8;
  return w < 80 ? 'edge' : w < 136 ? 'thicket' : 'scorch';
}
const tIdx = (x, y) => (y | 0) * MW + (x | 0);
function blocked(x, y, fly) {
  if (x < 1.2 || y < 1.2 || x >= MW - 1.2 || y >= MH - 1.2) return true;
  if (fly) return false;
  const k = (y | 0) * MW + (x | 0), o = W.o[k];
  return (o !== 0 && o !== O.LAMP) || W.g[k] === T.DEEP;
}
const isWaterTile = i => W.g[i] === T.SHALLOW || W.g[i] === T.DEEP || W.puddle[i] > 0;

function genWorld() {
  const n = MW * MH;
  W = { g: new Uint8Array(n), g0: new Uint8Array(n), o: new Uint8Array(n), o0: new Uint8Array(n), zi: new Uint8Array(n), fire: new Float32Array(n), puddle: new Float32Array(n), regrow: new Float32Array(n), burning: new Set(), puddles: new Set(), regrowing: new Set(), spawns: [], map: mkCanvas(MW, MH), mapDirty: true, tick: 0 };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = y * MW + x, cx = x + .5, cy = y + .5, z = zoneAt(cx, cy);
    const onPath = cx > TOWN.x && cx < LAIR.x && Math.abs(cy - pathY(cx)) < 1.5;
    const border = x < 3 || y < 3 || x >= MW - 3 || y >= MH - 3;
    const nz = fbm(x * .09, y * .09, SEED + 1), lake = fbm(x * .055, y * .055, SEED + 2), tr = fbm(x * .13, y * .13, SEED + 3), h = hash2(x, y, SEED + 4);
    let g = T.GRASS, o = O.NONE;
    if (z === 'town') { const d = dist(cx, cy, TOWN.x, TOWN.y); g = d < 7.2 ? T.PLAZA : d < 9 ? T.DIRT : T.GRASS; W.zi[i] = 0; }
    else if (z === 'lair') { const d = dist(cx, cy, LAIR.x, LAIR.y); g = d < LAIR.r ? T.LAIR : T.SCORCH; if (d >= LAIR.r && d < LAIR.r + 2.6) o = O.ROCK; W.zi[i] = 2; }
    else if (z === 'edge') {
      W.zi[i] = 0; g = nz > .58 ? T.TALL : T.GRASS; if (lake > .7) g = T.SHALLOW;
      if (g !== T.SHALLOW) { if ((tr > .5 && h < .13) || h < .018) o = O.TREE; else if (h > .988) o = O.ROCK; }
    } else if (z === 'thicket') {
      W.zi[i] = 1; g = nz > .54 ? T.DTALL : T.DGRASS; if (lake > .6) g = T.SHALLOW; if (lake > .655) g = T.DEEP;
      if (g !== T.SHALLOW && g !== T.DEEP) { if ((tr > .44 && h < .2) || h < .04) o = O.TREE; else if (h > .985) o = O.ROCK; }
    } else {
      W.zi[i] = 2; g = nz > .5 ? T.DRYTALL : T.DRY; if (tr > .64) g = T.SCORCH; if (lake > .73) g = T.SHALLOW;
      if (g !== T.SHALLOW) { if (h < .045) o = hash2(x, y, SEED + 5) < .4 ? O.DEAD : O.TREE; else if (h > .972) o = O.ROCK; }
    }
    if (onPath && z !== 'town') { g = z === 'lair' && dist(cx, cy, LAIR.x, LAIR.y) < LAIR.r ? T.LAIR : T.DIRT; o = O.NONE; }
    if (border) { if (g === T.SHALLOW || g === T.DEEP) g = T.GRASS; o = O.TREE; }
    W.g[i] = g; W.o[i] = o;
  }
  // Город
  const put = (x, y, o) => { W.o[y * MW + x] = o; };
  put(14, 50, O.STONE); put(10, 46, O.ALTAR); put(18, 45, O.MERCH); put(19, 46, O.CRATE);
  put(7, 53, O.HOUSE); put(6, 53, O.BLOCK); put(7, 52, O.BLOCK); put(6, 52, O.BLOCK);
  put(21, 54, O.HOUSE); put(20, 54, O.BLOCK); put(21, 53, O.BLOCK); put(20, 53, O.BLOCK);
  put(12, 53, O.LAMP); put(17, 49, O.LAMP); put(11, 48, O.LAMP);
  W.g0.set(W.g); W.o0.set(W.o);

  // Точки спавна мобов по сетке
  const CS = 9, used = {};
  for (let cy = 0; cy * CS < MH; cy++) for (let cx = 0; cx * CS < MW; cx++) {
    if (hash2(cx, cy, SEED + 9) > .7) continue;
    for (let t = 0; t < 8; t++) {
      const x = cx * CS + 1 + Math.floor(hash2(cx * 7 + t, cy, SEED + 10) * (CS - 1)), y = cy * CS + 1 + Math.floor(hash2(cx, cy * 7 + t, SEED + 11) * (CS - 1));
      if (x < 4 || y < 4 || x >= MW - 4 || y >= MH - 4) continue;
      const z = zoneAt(x + .5, y + .5), i = y * MW + x;
      if (z === 'town' || z === 'lair' || dist(x, y, TOWN.x, TOWN.y) < TOWN.r + 5 || dist(x, y, LAIR.x, LAIR.y) < LAIR.r + 5) continue;
      if (W.o[i] || W.g[i] === T.DEEP || Math.abs(y - pathY(x)) < 2.5) continue;
      const r = hash2(cx, cy, SEED + 12); let type, lvl, cnt = 1;
      if (z === 'edge') { lvl = clamp(1 + Math.floor((x - 26) / 18), 1, 3); type = r < .4 ? 'wolf' : r < .72 ? 'slime' : 'shroom'; if (type === 'wolf' && lvl > 1) cnt = 2; }
      else if (z === 'thicket') { lvl = clamp(3 + Math.floor((x - 80) / 14), 3, 6); type = W.g[i] === T.SHALLOW ? 'water' : r < .34 ? 'root' : r < .67 ? 'bat' : 'skel'; if (type === 'bat') cnt = 2; }
      else { lvl = clamp(6 + Math.floor((x - 136) / 12), 6, 9); type = r < .55 ? 'imp' : 'falcon'; if (type === 'imp' && r < .25) cnt = 2; }
      W.spawns.push({ x: x + .5, y: y + .5, type, lvl, n: cnt, list: [], t: 0 }); used[cx + '_' + cy] = 1; break;
    }
  }
  // Водяные духи — у озёр Чащи
  for (let cy = 0; cy * 6 < MH; cy++) for (let cx = 0; cx * 6 < MW; cx++) {
    if (hash2(cx, cy, SEED + 14) > .55) continue; let done = false;
    for (let y = cy * 6; y < cy * 6 + 6 && !done; y++) for (let x = cx * 6; x < cx * 6 + 6 && !done; x++) {
      if (x < 4 || y < 4 || x >= MW - 4 || y >= MH - 4) continue;
      if (W.g[y * MW + x] === T.SHALLOW && zoneAt(x, y) === 'thicket') { W.spawns.push({ x: x + .5, y: y + .5, type: 'water', lvl: clamp(3 + Math.floor((x - 80) / 14), 3, 6), n: 1, list: [], t: 0 }); done = true; }
    }
  }
  W.spawns.push({ x: LAIR.x, y: LAIR.y, type: 'ashwolf', lvl: 10, n: 1, list: [], t: 0, boss: true });
  return W;
}

// ---------- Огонь, лужи, зарастание ----------
const flammable = i => !!FL[W.g[i]] || W.o[i] === O.TREE;
function ignite(i, force) {
  if (i < 0 || i >= W.g.length || W.fire[i] > 0) return false;
  if (W.g[i] === T.SHALLOW || W.g[i] === T.DEEP || W.puddle[i] > 0) return false;
  const f = FL[W.g[i]];
  if (W.o[i] === O.TREE) W.fire[i] = 7; else if (f) W.fire[i] = f.fuel * rand(.8, 1.2); else if (force) W.fire[i] = force; else return false;
  W.burning.add(i); return true;
}
function burnOut(i) {
  W.fire[i] = 0; W.burning.delete(i); let ch = false;
  if (FL[W.g[i]]) { W.g[i] = T.ASH; ch = true; }
  if (W.o[i] === O.TREE) { W.o[i] = O.DEAD; ch = true; }
  if (ch) { W.regrow[i] = G.time + (W.o[i] === O.DEAD && W.o0[i] === O.TREE ? rand(110, 150) : rand(50, 80)); W.regrowing.add(i); W.mapDirty = true; }
}
function extinguish(i) { if (W.fire[i] > 0) { W.fire[i] = 0; W.burning.delete(i); return true; } return false; }
function addPuddle(i, dur) {
  if (i < 0 || i >= W.g.length || W.g[i] === T.SHALLOW || W.g[i] === T.DEEP || (W.o[i] && W.o[i] !== O.LAMP)) return;
  W.puddle[i] = Math.max(W.puddle[i], dur || 10); W.puddles.add(i);
}
function updateWorld(dt) {
  for (const i of W.burning) { W.fire[i] -= dt; if (W.fire[i] <= 0) burnOut(i); }
  W.tick -= dt; if (W.tick > 0) return; W.tick = .3;
  // Огонь расползается сам
  const lit = [];
  for (const i of W.burning) {
    if (!flammable(i)) continue;
    for (let d = 0; d < 8; d++) {
      const n = i + [1, -1, MW, -MW, MW + 1, MW - 1, -MW + 1, -MW - 1][d]; if (n < 0 || n >= W.g.length || W.fire[n] > 0) continue;
      const f = FL[W.g[n]], p = (f ? f.sp : 0) + (W.o[n] === O.TREE ? (W.zi[n] === 2 ? .2 : .08) : 0);
      if (p > 0 && chance(d < 4 ? p : p * .5)) lit.push(n);
    }
  }
  for (const n of lit) ignite(n);
  for (const i of W.puddles) { W.puddle[i] -= .3; if (W.puddle[i] <= 0) { W.puddle[i] = 0; W.puddles.delete(i); } }
  // Выгоревшее зарастает
  for (const i of W.regrowing) if (G.time >= W.regrow[i]) {
    let near = false; for (const p of G.players) if (dist(p.x, p.y, i % MW + .5, (i / MW | 0) + .5) < 1.2) near = true;
    if (near) { W.regrow[i] = G.time + 5; continue; }
    W.g[i] = W.g0[i]; if (W.o[i] === O.DEAD && W.o0[i] === O.TREE) W.o[i] = O.TREE; W.regrowing.delete(i); W.mapDirty = true;
  }
}
function renderMap() {
  const x = W.map.getContext('2d'), im = x.createImageData(MW, MH), d = im.data;
  for (let i = 0; i < MW * MH; i++) {
    let c = TMAP[W.g[i]]; const o = W.o[i];
    if (o === O.TREE) c = W.zi[i] === 2 ? '#8a6a2a' : '#1f5a2c'; else if (o === O.DEAD) c = '#2a2428'; else if (o === O.ROCK) c = '#6a6a78'; else if (o >= O.ALTAR) c = '#c8b890';
    const v = parseInt(c.slice(1), 16); d[i * 4] = v >> 16; d[i * 4 + 1] = (v >> 8) & 255; d[i * 4 + 2] = v & 255; d[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0); W.mapDirty = false;
}
