// Рендер: низкое разрешение -> целочисленное масштабирование без сглаживания. Текст — поверх в полном разрешении.
const TXT = [];
function txt(s, x, y, c, size, align, alpha) { TXT.push([s, x, y, c || '#fff', size || 7, align || 'left', alpha === undefined ? 1 : alpha]); }
function flushTxt(ctx) {
  const k = V.scale; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
  for (const t of TXT) {
    const px = Math.max(9, Math.round(t[4] * k)); ctx.font = 'bold ' + px + 'px "Lucida Console","DejaVu Sans Mono","Liberation Mono","Courier New",monospace';
    ctx.textAlign = t[5]; ctx.globalAlpha = t[6]; ctx.lineWidth = Math.max(2, px * .22); ctx.strokeStyle = '#0b0810';
    ctx.strokeText(t[0], t[1] * k, t[2] * k); ctx.fillStyle = t[3]; ctx.fillText(t[0], t[1] * k, t[2] * k);
  }
  ctx.globalAlpha = 1; TXT.length = 0;
}
function isoEllipse(b, x, y, r, fill, alpha, stroke) {
  const p = w2s(x, y); b.beginPath(); b.ellipse(p[0], p[1], Math.max(.5, r * 22.6), Math.max(.3, r * 11.3), 0, 0, TAU);
  if (fill) { b.globalAlpha = alpha; b.fillStyle = fill; b.fill(); }
  if (stroke) { b.globalAlpha = Math.min(1, (alpha || .5) * 2.2); b.strokeStyle = stroke; b.lineWidth = 1; b.stroke(); }
  b.globalAlpha = 1;
}
function worldPoly(b, pts, fill, alpha) { b.beginPath(); for (let i = 0; i < pts.length; i++) { const p = w2s(pts[i][0], pts[i][1]); if (i) b.lineTo(p[0], p[1]); else b.moveTo(p[0], p[1]); } b.closePath(); b.globalAlpha = alpha; b.fillStyle = fill; b.fill(); b.globalAlpha = 1; }
function teleLine(b, x, y, dx, dy, len, w, col, a) { const px = -dy * w / 2, py = dx * w / 2; worldPoly(b, [[x + px, y + py], [x + dx * len + px, y + dy * len + py], [x + dx * len - px, y + dy * len - py], [x - px, y - py]], col, a); }
function teleCone(b, x, y, dx, dy, len, ang, col, a) { const a0 = Math.atan2(dy, dx), pts = [[x, y]]; for (let i = 0; i <= 8; i++) { const t = a0 - ang + ang * 2 * i / 8; pts.push([x + Math.cos(t) * len, y + Math.sin(t) * len]); } worldPoly(b, pts, col, a); }
// Телеграф замаха моба: красная зона, куда прилетит способность
function drawTele(b, m) {
  const wu = m.wu, A = AB[wu.a.ab].ai, pr = clamp(1 - wu.t / wu.total, 0, 1), col = '#ff3030', a = .16 + .1 * Math.sin(G.time * 20) * pr;
  if (A.tele === 'line') { teleLine(b, m.x, m.y, wu.dx, wu.dy, A.len, A.w, col, a); teleLine(b, m.x, m.y, wu.dx, wu.dy, A.len * pr, A.w, col, .25); }
  else if (A.tele === 'cone' || A.tele === 'arc') { teleCone(b, m.x, m.y, wu.dx, wu.dy, A.len, A.ang, col, a); teleCone(b, m.x, m.y, wu.dx, wu.dy, A.len * pr, A.ang, col, .25); }
  else if (A.tele === 'circle') { isoEllipse(b, wu.tx, wu.ty, A.r, col, a, col); isoEllipse(b, wu.tx, wu.ty, A.r * pr, col, .25); }
  else isoEllipse(b, m.x, m.y, .8 + pr * .4, '#6fe0b0', .2, '#6fe0b0');
}

function drawObj(b, i, j, o, k) {
  const sx = (i - j) * 16 - G.cam.sx, sy = (i + j) * 8 - G.cam.sy + 12;
  if (o === O.ELDER || o === O.MERCH || o === O.SMITH) { const mk = Quests.mark(o === O.ELDER ? 'elder' : o === O.MERCH ? 'merch' : 'smith'); if (mk) txt(mk, sx, sy - 36 - Math.abs(Math.sin(G.time * 3)) * 3, mk === '?' ? '#8fd07a' : '#ffd870', 11, 'center'); }
  switch (o) {
    case O.ELDER: drawSpr(b, 'elder_i', sx, sy - 2, true); break;
    case O.TREE: drawSpr(b, 'tree' + W.zi[k] + '_' + ((i * 3 + j * 5) % 3), sx, sy + 1); break;
    case O.DEAD: drawSpr(b, 'dead' + ((i + j) & 1), sx, sy + 1); break;
    case O.ROCK: drawSpr(b, 'rock' + ((i ^ j) & 1), sx, sy + 2); break;
    case O.ALTAR: drawSpr(b, 'altar', sx, sy + 2 - (Math.sin(G.time * 2) > .5 ? 0 : 0)); break;
    case O.STONE: drawSpr(b, 'stone', sx, sy + 1); break;
    case O.MERCH: drawSpr(b, 'merch_i', sx, sy - 2, true); break;
    case O.CRATE: drawSpr(b, 'crate', sx, sy + 1); break;
    case O.LAMP: drawSpr(b, 'lamp', sx, sy - 2); break;
    case O.HOUSE: drawSpr(b, 'house' + (i > 14 ? 1 : 0), sx, sy + 6); break;
    case O.SMITH: drawSpr(b, 'smith_i', sx, sy - 2); break;
    case O.ANVIL: drawSpr(b, 'anvil', sx, sy + 1); break;
    case O.WALL: b.drawImage(WALLSPR, sx - 16, sy - 28); break;
    case O.CRYPT: case O.EXIT: drawSpr(b, 'crypt', sx, sy + 2); break;
    case O.CHEST: drawSpr(b, 'chest', sx, sy + 1); break;
    case O.TOMB: drawSpr(b, 'tomb', sx, sy); break;
    case O.TOTEM: drawSpr(b, 'totem', sx, sy + 1); break;
    case O.STAKE: drawSpr(b, 'stake', sx, sy + 1); break;
  }
}
function drawEnt(b, e) {
  const p = w2s(e.x, e.y), sx = p[0], sy = p[1]; let z = 0;
  if (e.fly) z += 9 + Math.sin(G.time * 6 + e.id) * 1.5;
  if (e.toss > 0) z += Math.sin(clamp(e.toss / .4, 0, 1) * Math.PI) * 10;
  if (e.hop && e.moving) z += Math.abs(Math.sin(e.anim * 7)) * 3;
  const k = (e.scale || 1) * e.r / .32;
  b.globalAlpha = .3; b.fillStyle = '#000'; b.beginPath(); b.ellipse(sx, sy, 6.5 * k, 3 * k, 0, 0, TAU); b.fill(); b.globalAlpha = 1;
  if (e.elite) { b.globalAlpha = .35 + .15 * Math.sin(G.time * 5); b.fillStyle = e.chief ? '#ff2a4a' : '#a04aff'; b.beginPath(); b.ellipse(sx, sy, 11 * k, 5 * k, 0, 0, TAU); b.fill(); b.globalAlpha = 1; }
  let name = e.spr; if (e.humanoid) name += e.moving ? (Math.floor(e.anim * 9) % 2 ? '_w1' : '_w2') : '_i';
  const bob = (!e.humanoid && e.moving && !e.fly && !e.hop) ? Math.floor(e.anim * 9) % 2 : 0, S = SPR[name]; if (!S) return;
  if (e.st.root) { b.fillStyle = '#5a3a1a'; b.fillRect(sx - 6, sy - 2, 12, 2); b.fillRect(sx - 4, sy - 5, 2, 4); b.fillRect(sx + 3, sy - 6, 2, 5); b.fillStyle = '#7ac84a'; b.fillRect(sx - 4, sy - 6, 2, 1); b.fillRect(sx + 3, sy - 7, 2, 1); }
  if (e.ghost) b.globalAlpha = .65;
  if (e.inv > 0 && !e.roll && e.isPlayer && Math.floor(G.time * 20) % 2) b.globalAlpha = .5;
  if (e.roll) { b.save(); b.translate(sx, sy - 7); b.rotate((1 - e.roll.t / e.roll.max) * TAU * e.face); b.drawImage(S.c, -(S.w >> 1), -(S.h >> 1)); b.restore(); }
  else {
    let sc = null; if (e.wu) { const s = Math.sin(G.time * 34) * .07; sc = [1 + s, 1 - s]; } else if (e.swing) sc = [1.06, .96];
    if (e.elite) { sc = sc || [1, 1]; sc = [sc[0] * 1.3, sc[1] * 1.3]; }
    drawSpr(b, name, sx, sy - z - bob, e.face < 0, e.flash > 0, sc);
    if (e.enraged && !(e.flash > 0)) { b.globalAlpha = .28 + .12 * Math.sin(G.time * 10); b.globalCompositeOperation = 'lighter'; drawSpr(b, name, sx, sy - z - bob, e.face < 0, true); b.globalCompositeOperation = 'source-over'; }
  }
  b.globalAlpha = 1;
  const top = sy - z - S.h * (e.elite ? 1.3 : 1);
  if (e.shield > 0) { b.strokeStyle = e.shieldEl && EL[e.shieldEl] ? EL[e.shieldEl].c : '#6fe0b0'; b.globalAlpha = .55 + .2 * Math.sin(G.time * 8); b.lineWidth = 1; b.beginPath(); b.ellipse(sx, sy - z - S.h / 2, S.w / 2 + 3, S.h / 2 + 3, 0, 0, TAU); b.stroke(); b.globalAlpha = .12; b.fillStyle = b.strokeStyle; b.fill(); b.globalAlpha = 1; }
  if (e.st.stun) { for (let i = 0; i < 3; i++) { const a = G.time * 7 + i * 2.1; b.fillStyle = '#ffe95a'; b.fillRect(sx + Math.cos(a) * 6 | 0, top - 3 + Math.sin(a) * 2 | 0, 2, 2); } }
  if (e.ai && !e.boss && !e.ghost && (e.hp < e.maxHp || e.isNemesis || e.elite)) {
    const w = e.isNemesis || e.elite ? 24 : 14; b.fillStyle = '#100a14'; b.fillRect(sx - w / 2 - 1, top - 5, w + 2, 4); b.fillStyle = e.isNemesis ? '#c82a4a' : '#e84a4a'; b.fillRect(sx - w / 2, top - 4, Math.ceil(w * clamp(e.hp / e.maxHp, 0, 1)), 2);
    if (e.shield > 0) { b.fillStyle = '#6fe0b0'; b.fillRect(sx - w / 2, top - 4, Math.ceil(w * clamp(e.shield / (e.shieldMax || e.shield), 0, 1)), 1); }
  }
  if (e.isNemesis) txt(e.name, sx, top - 14, '#ff5a6a', 6, 'center');
  else if (e.ai && !e.boss && !e.ghost && e.lvl && G.me && dist(e.x, e.y, G.me.x, G.me.y) < 7) txt(e.name + ' ' + e.lvl, sx, top - (e.hp < e.maxHp ? 13 : 9), e.chief ? '#ff5a6a' : e.elite ? '#c88aff' : e.lvl > G.me.lvl + 1 ? '#ff8a6a' : '#d8d0e0', 4.5, 'center', .85);
  if (e.sayT > 0 && e.sayS) txt('«' + e.sayS + '»', sx, top - 23, '#ffb0b8', 6.5, 'center', clamp(e.sayT, 0, 1));
}
function drawProj(b, p) {
  const s = w2s(p.x, p.y), sx = s[0], sy = s[1];
  if (p.kind === 'ball') { b.fillStyle = p.color; b.fillRect(sx - 2, sy - 12, 5, 5); b.fillRect(sx - 3, sy - 11, 7, 3); b.fillStyle = '#ffffff'; b.fillRect(sx - 1, sy - 11, 3, 3); b.globalAlpha = .3; b.fillStyle = '#000'; b.fillRect(sx - 2, sy - 1, 5, 2); b.globalAlpha = 1; }
  else if (p.kind === 'arrow') { const n = norm((p.vx - p.vy) * 2, p.vx + p.vy); b.fillStyle = p.color; pxLine(b, sx - n[0] * 5, sy - 9 - n[1] * 5, sx + n[0] * 3, sy - 9 + n[1] * 3, 1); b.fillStyle = '#ffffff'; b.fillRect(Math.round(sx + n[0] * 3), Math.round(sy - 9 + n[1] * 3), 2, 2); }
  else if (p.kind === 'wave') {
    const n = norm(p.vx, p.vy);
    for (let i = -6; i <= 6; i++) { const t = i / 6, c = (1 - t * t) * .5, q = w2s(p.x - n[1] * t * p.r + n[0] * c, p.y + n[0] * t * p.r + n[1] * c), h = 4 + (1 - t * t) * 5 + Math.sin(G.time * 20 + i) * 1; b.fillStyle = p.color; b.fillRect(q[0] - 1, q[1] - h, 3, h); b.fillStyle = '#ffffff'; b.fillRect(q[0] - 1, q[1] - h - 1, 3, 2); }
  } else if (p.kind === 'whirl') {
    const fiery = p.el === 'fire', n = 7 + Math.round(p.r * 2);
    for (let i = 0; i < n; i++) { const w = (3 + i * 2.6) * p.r, ox = Math.sin(G.time * 12 + i * .9) * (1 + i * .5); b.fillStyle = fiery ? ['#e8501c', '#ffb02e', '#fff3a0'][i % 3] : [p.color, '#ffffff', '#8ac8b8'][i % 3]; b.globalAlpha = .85; b.fillRect(Math.round(sx - w / 2 + ox), sy - 2 - i * 3, Math.round(w), 2); }
    b.globalAlpha = 1;
  }
}
function drawPickup(b, k) {
  const s = w2s(k.x, k.y), z = 4 + Math.abs(Math.sin(k.age * 4)) * 4;
  b.globalAlpha = .3; b.fillStyle = '#000'; b.fillRect(s[0] - 2, s[1] - 1, 5, 2); b.globalAlpha = 1;
  if (k.kind === 'item') { const c = RANKS[k.v.rank].c; b.fillStyle = '#0b0810'; b.fillRect(s[0] - 4, s[1] - z - 8, 9, 9); b.fillStyle = c; b.fillRect(s[0] - 3, s[1] - z - 7, 7, 7); b.fillStyle = '#1a1424'; b.fillRect(s[0] - 2, s[1] - z - 6, 5, 5); b.fillStyle = c; b.fillRect(s[0] - 1, s[1] - z - 5, 3, 3); if (k.v.rank >= 2 && chance(.3)) part(k.x, k.y, z + 6, rand(-.4, .4), rand(-.4, .4), 26, .6, c, 1, -10, 1); }
  else if (k.kind === 'gold') { b.fillStyle = '#8a5a10'; b.fillRect(s[0] - 2, s[1] - z - 3, 5, 5); b.fillStyle = '#ffd870'; b.fillRect(s[0] - 1, s[1] - z - 3, 3, 5); b.fillRect(s[0] - 2, s[1] - z - 2, 5, 3); b.fillStyle = '#fff8d0'; b.fillRect(s[0] - 1, s[1] - z - 2, 1, 2); }
  else { const c = (typeof soulDef === 'function' ? EL[soulDef(k.v).el].c : '#c9a0ff'); b.fillStyle = '#ffffff'; b.fillRect(s[0] - 2, s[1] - z - 7, 5, 7); b.fillRect(s[0] - 3, s[1] - z - 6, 7, 5); b.fillStyle = c; b.fillRect(s[0] - 2, s[1] - z - 6, 5, 5); b.fillStyle = '#ffffff'; b.fillRect(s[0] - 1, s[1] - z - 5, 2, 2); if (chance(.3)) part(k.x, k.y, z + 4, rand(-.4, .4), rand(-.4, .4), 22, .5, c, 1, -10, 1); }
}
const UIG = {
  sword: ['......##', '.....###', '....###.', '#..###..', '.####...', '.###....', '#.##....', '...#....'],
  rollg: ['..####..', '.#....#.', '#......#', '#.....##', '#....###', '.#....#.', '..##....', '........'],
  potion: ['..###..', '..#.#..', '..###..', '.#####.', '#######', '#######', '#######', '.#####.'],
  hand: ['..#.#.#.', '..#.#.#.', '#.#.#.#.', '#.######', '#.######', '.#######', '..#####.', '..####..'],
  menu: ['#######', '.......', '#######', '.......', '#######']
};
function drawGlyph(b, g, cx, cy, col) { g = UIG[g]; const w = g[0].length, ox = Math.round(cx - w / 2), oy = Math.round(cy - g.length / 2); b.fillStyle = col; for (let j = 0; j < g.length; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '#') b.fillRect(ox + i, oy + j, 1, 1); }
function drawSlotIcon(b, p, s, x, y) { // иконка души 16x16 + перезарядка
  const id = p.slots[s]; if (!id || typeof soulDef !== 'function') return;
  const def = soulDef(id), sl = p.sl[s]; b.drawImage(def.icon, x, y);
  const st = starsOf(p.souls[id]); b.fillStyle = '#ffd870'; for (let i = 0; i < st; i++) b.fillRect(x + 3 + i * 4, y + 17, 2, 2);
  if (sl.ch > 0 && p.mp < manaCost(AB[def.ab])) { b.globalAlpha = .6; b.fillStyle = '#10204a'; b.fillRect(x, y, 16, 16); b.globalAlpha = 1; }
  if (sl.ch <= 0) { const cd = AB[def.ab].cd, f = clamp(sl.cd / cd, 0, 1); b.globalAlpha = .72; b.fillStyle = '#0b0810'; b.fillRect(x, y + 16 - Math.ceil(16 * f), 16, Math.ceil(16 * f)); b.globalAlpha = 1; txt(sl.cd < 1 ? sl.cd.toFixed(1) : String(Math.ceil(sl.cd)), x + 8, y + 4, '#fff', 6, 'center'); }
  else if (maxCharges(def, st) > 1) txt('×' + sl.ch, x + 16, y + 9, '#ffe95a', 5, 'right');
}
function drawTouch(b) {
  if (!V.touch || !G.me) return; const p = G.me, J = Input.joy;
  const jx = J.id !== null ? J.bx : 44, jy = J.id !== null ? J.by : V.h - 46;
  b.globalAlpha = J.id !== null ? .35 : .16; b.strokeStyle = '#fff'; b.lineWidth = 1; b.beginPath(); b.arc(jx, jy, 22, 0, TAU); b.stroke(); b.fillStyle = '#fff'; b.globalAlpha *= .4; b.fill();
  b.globalAlpha = J.id !== null ? .6 : .25; b.beginPath(); b.arc(J.id !== null ? J.x : jx, J.id !== null ? J.y : jy, 9, 0, TAU); b.fill(); b.globalAlpha = 1;
  const near = nearInteract(p);
  for (const bt of Input.buttons()) {
    if (bt.id === 'use' && !near) continue;
    const dn = Input.held[bt.id]; b.globalAlpha = dn ? .7 : .42; b.fillStyle = bt.id === 'atk' ? '#5a1a22' : bt.id === 'use' ? '#6a4a10' : '#1a1424'; b.beginPath(); b.arc(bt.x, bt.y, bt.r, 0, TAU); b.fill();
    b.globalAlpha = .8; b.strokeStyle = bt.id === 'atk' ? '#ff8a8a' : bt.id === 'use' ? '#ffd870' : '#8a6aca'; b.lineWidth = 1; b.stroke(); b.globalAlpha = 1;
    if (bt.id === 'atk') drawGlyph(b, 'sword', bt.x, bt.y, '#ffffff');
    else if (bt.id === 'roll') { drawGlyph(b, 'rollg', bt.x, bt.y, p.rollCd > 0 ? '#6a5a80' : '#ffffff'); }
    else if (bt.id === 'pot') { drawGlyph(b, 'potion', bt.x, bt.y - 1, p.potions > 0 ? '#ff6a7a' : '#6a5a80'); txt(String(p.potions), bt.x + 5, bt.y + 2, '#fff', 5.5); }
    else if (bt.id === 'use') drawGlyph(b, 'hand', bt.x, bt.y, '#ffd870');
    else if (bt.id === 'menu') drawGlyph(b, 'menu', bt.x, bt.y, '#c9a0ff');
    else drawSlotIcon(b, p, +bt.id[1], bt.x - 8, bt.y - 8);
  }
}

function render() {
  const b = G.bctx, cam = G.cam;
  cam.sx = Math.round(isoX(cam.x, cam.y) - V.w / 2 + (cam.shake > 0 ? rand(-cam.shake, cam.shake) : 0));
  cam.sy = Math.round(isoY(cam.x, cam.y) - V.h / 2 + (cam.shake > 0 ? rand(-cam.shake, cam.shake) : 0));
  b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.fillStyle = '#0b0810'; b.fillRect(0, 0, V.w, V.h);
  if (!W) return;
  const D = [], glows = [];
  const c0 = s2w(0, 0), c1 = s2w(V.w, 0), c2 = s2w(0, V.h), c3 = s2w(V.w, V.h);
  const i0 = Math.max(0, Math.floor(c0[0]) - 1), i1 = Math.min(MW - 1, Math.ceil(c3[0]) + 5), j0 = Math.max(0, Math.floor(c1[1]) - 1), j1 = Math.min(MH - 1, Math.ceil(c2[1]) + 5);
  const wf = (G.time * 1.6 | 0) & 1;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const sx = (i - j) * 16 - cam.sx - 16, sy = (i + j) * 8 - cam.sy;
    if (sx < -32 || sx > V.w || sy < -18 || sy > V.h + 70) continue;
    const k = j * MW + i, g = W.g[k], v = ((i * 73856093) ^ (j * 19349663)) & 3;
    if (sy < V.h + 2) {
      if (g !== T.VOID) b.drawImage(((g === T.SHALLOW || g === T.DEEP) && ((wf + i + j) & 1)) ? TILE_W2[g][v] : TILE[g][v], sx, sy);
      if (W.puddle[k] > 0) { b.globalAlpha = Math.min(.8, W.puddle[k] * .4); b.drawImage(TILE[T.SHALLOW][v], sx + 5, sy + 2, 22, 11); b.globalAlpha = 1; }
      if (W.trap && W.trap[k]) { b.fillStyle = '#1a1420'; b.fillRect(sx + 9, sy + 5, 14, 6); b.fillStyle = (W.trapT % 4.5) > 2.2 ? '#ff5a1a' : '#4a2a20'; for (let q = 0; q < 4; q++) b.fillRect(sx + 10 + q * 3, sy + 6, 2, 4); }
      const ts = TALLSPR[g]; if (ts) b.drawImage(ts[v % 3], sx + (Math.sin(G.time * 2 + i * .7 + j * .9) > .55 ? 1 : 0), sy - 8);
    }
    if (W.fire[k] > 0) { D.push([i + j + 1.2, 3, i, j, W.o[k] === O.TREE ? 1 : 0]); if (sy < V.h + 20) glows.push(sx + 16, sy + 8); }
    const o = W.o[k]; if (o && o !== O.BLOCK) { D.push([i + j + 1, 0, i, j, o, k]); if (o === O.LAMP || o === O.ALTAR || o === O.STONE || o === O.ANVIL || o === O.CRYPT || o === O.EXIT || o === O.CHEST) glows.push(sx + 16, sy - 6); else if (o === O.TOTEM) glows.push(sx + 16, sy); }
  }
  // декали на земле: зоны и телеграфы
  for (const z of G.zones) { const K = ZK[z.kind]; if (K.draw) K.draw(b, z); if (K.top) D.push([z.x + z.y + (z.topD || 0), 5, z]); }
  for (const e of G.ents) if (e.wu && !e.dead) drawTele(b, e);
  for (const e of G.ents) { if (e.dead) continue; const s = w2s(e.x, e.y); if (s[0] < -40 || s[0] > V.w + 40 || s[1] < -20 || s[1] > V.h + 50) continue; D.push([e.x + e.y, 1, e]); }
  for (const p of G.projs) D.push([p.x + p.y, 2, p]);
  for (const k of G.pickups) D.push([k.x + k.y, 4, k]);
  D.sort((a, c) => a[0] - c[0]);
  for (const d of D) {
    switch (d[1]) {
      case 0: drawObj(b, d[2], d[3], d[4], d[5]); break;
      case 1: drawEnt(b, d[2]); break;
      case 2: drawProj(b, d[2]); break;
      case 3: { const sx = (d[2] - d[3]) * 16 - cam.sx, sy = (d[2] + d[3]) * 8 - cam.sy + 8, f = (G.time * 10 + d[2] * 3 + d[3]) | 0;
        if (d[4]) { b.drawImage(FLAME[f & 3], sx - 10, sy - 30); b.drawImage(FLAME[(f + 1) & 3], sx - 1, sy - 42); b.drawImage(FLAME[(f + 2) & 3], sx - 6, sy - 18); }
        else { b.drawImage(FLAME[f & 3], sx - 11, sy - 11); b.drawImage(FLAME[(f + 2) & 3], sx, sy - 9); }
        if (chance(.04)) part(d[2] + rand(), d[3] + rand(), d[4] ? 30 : 8, 0, 0, rand(20, 40), .7, pick(['#ffb02e', '#3a3436', '#ff6a1a']), 1, -10, 1); break; }
      case 4: drawPickup(b, d[2]); break;
      case 5: ZK[d[2].kind].top(b, d[2]); break;
    }
  }
  // свечение (аддитивно)
  b.globalCompositeOperation = 'lighter';
  for (let i = 0; i < glows.length; i += 2) b.drawImage(GLOW.fire, glows[i] - 32, glows[i + 1] - 22);
  for (const p of G.projs) if (p.el === 'fire' || p.el === 'ash' || p.el === 'storm') { const s = w2s(p.x, p.y); b.drawImage(p.el === 'storm' ? GLOW.storm : GLOW.fire, s[0] - 24, s[1] - 24, 48, 30); }
  for (const p of G.parts) if (p.glow) { const s = w2s(p.x, p.y); b.globalAlpha = clamp(p.life / p.max, 0, 1) * .5; b.fillStyle = p.color; b.fillRect(s[0] - 1, s[1] - p.z - 1, p.size + 2, p.size + 2); }
  b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
  // частицы и эффекты
  for (const p of G.parts) { const s = w2s(p.x, p.y); b.globalAlpha = clamp(p.life / p.max * 2, 0, 1); b.fillStyle = p.color; b.fillRect(s[0], Math.round(s[1] - p.z), p.size, p.size); }
  b.globalAlpha = 1;
  for (const f of G.fx) {
    const t = clamp(f.life / f.max, 0, 1);
    if (f.t === 'bolt') { b.globalAlpha = t; for (let pass = 0; pass < 2; pass++) { b.fillStyle = pass ? '#ffffff' : f.color; for (let i = 1; i < f.pts.length; i++) { const a = w2s(f.pts[i - 1][0], f.pts[i - 1][1]), c = w2s(f.pts[i][0], f.pts[i][1]); pxLine(b, a[0], a[1] - f.pts[i - 1][2], c[0], c[1] - f.pts[i][2], pass ? 1 : 2); } } b.globalAlpha = 1; }
    else if (f.t === 'slash') { b.fillStyle = f.color; b.globalAlpha = t; const n = 14, sw = 1 - t; for (let i = 0; i <= n; i++) { const u = i / n; if (u > sw + .5) continue; const a = f.a - f.arc / 2 + f.arc * u, s = w2s(f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r), q = w2s(f.x + Math.cos(a) * (f.r - .35), f.y + Math.sin(a) * (f.r - .35)); pxLine(b, q[0], q[1] - 8, s[0], s[1] - 8, 2); } b.globalAlpha = 1; }
    else if (f.t === 'ring') isoEllipse(b, f.x, f.y, lerp(f.r0, f.r1, 1 - t), f.color, t * .18, f.color);
  }
  // мрак: тьма с пятнами света вокруг героя, огня, фонарей
  if (G.me) {
    const L = G.light, lx = G.lctx; if (L.width !== V.w || L.height !== V.h) { L.width = V.w; L.height = V.h; }
    const target = (W.dun && W.dun.dark) || ZDARK[zoneAt(G.me.x, G.me.y)] || .5; G.dark = G.dark === undefined ? target : G.dark + (target - G.dark) * .03;
    lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, V.w, V.h); lx.globalAlpha = G.dark; lx.fillStyle = '#05040c'; lx.fillRect(0, 0, V.w, V.h); lx.globalAlpha = 1;
    lx.globalCompositeOperation = 'destination-out';
    const lit = (x, y, w, a) => { lx.globalAlpha = a; lx.drawImage(LIGHT, x - w / 2, y - w * .3125, w, w * .625); };
    for (const p of G.players) if (!p.dead) { const s = w2s(p.x, p.y); lit(s[0], s[1] - 6, 230 + Math.sin(G.time * 3) * 4, .95); }
    for (let i = 0; i < glows.length; i += 2) lit(glows[i], glows[i + 1], 110, .8);
    for (const p of G.projs) if (p.el !== 'bone' && p.el !== 'beast') { const s = w2s(p.x, p.y); lit(s[0], s[1] - 8, 70, .7); }
    for (const k of G.pickups) { const s = w2s(k.x, k.y); lit(s[0], s[1] - 6, 40, .6); }
    for (const z of G.zones) if (z.kind === 'blast' || z.kind === 'heal' || z.kind === 'thundercloud') { const s = w2s(z.x, z.y); lit(s[0], s[1], 90, .5); }
    for (const f of G.fx) if (f.t === 'bolt' || f.t === 'ring') { const q = f.t === 'bolt' ? f.pts[f.pts.length - 1] : [f.x, f.y], s = w2s(q[0], q[1]); lit(s[0], s[1], 100, .7 * clamp(f.life / f.max, 0, 1)); }
    for (const e of G.ents) if (!e.dead && (e.isNemesis || e.elite || e.boss || e.st.burn)) { const s = w2s(e.x, e.y); lit(s[0], s[1] - 8, 60, .45); }
    lx.globalAlpha = 1; b.drawImage(L, 0, 0);
    // виньетка
    const vg = b.createRadialGradient(V.w / 2, V.h / 2, V.h * .45, V.w / 2, V.h / 2, V.w * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); b.fillStyle = vg; b.fillRect(0, 0, V.w, V.h);
  }
  for (const t of G.texts) { const s = w2s(t.x, t.y); if (t.num !== undefined) drawNum(b, t.num, s[0], s[1] - t.z, t.color); else txt(t.s, s[0], s[1] - t.z, t.color, t.size, 'center', clamp(t.life * 2, 0, 1)); }
  for (const f of G.hud) f(b);
  drawTouch(b);
  // на экран
  const c = G.ctx; c.imageSmoothingEnabled = false; c.drawImage(G.buf, 0, 0, V.w * V.scale, V.h * V.scale);
  flushTxt(c);
}
