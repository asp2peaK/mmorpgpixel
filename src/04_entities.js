// Сущности: общая модель для игрока, мобов и призванных существ. Команда — поле team.
// RX — точки подключения системы реакций стихий (см. 06_reactions.js)
const RX = { hit() { return false; }, tile() { }, mix(e) { delete e.st.burn; } };

function mkEnt(o) {
  return Object.assign({ id: ++G.nid, x: 0, y: 0, r: .32, team: 2, hp: 10, maxHp: 10, atk: 5, spd: 3, face: 1, dirx: 1, diry: 0, st: {}, kx: 0, ky: 0, flash: 0, inv: 0, dead: false, shield: 0, shieldT: 0, shieldEl: null, anim: rand(9), toss: 0, immune: {}, dotT: rand(.5), moving: false }, o);
}
const hostile = (a, b) => a.team !== b.team;
const inTown = e => !W.dun && dist(e.x, e.y, TOWN.x, TOWN.y) < TOWN.r;
const ownerOf = e => e ? (e.owner || e) : null;

// ---------- Статусы ----------
function addSt(e, n, t, v, src) {
  if (e.dead || e.immune[n]) return;
  if (e.boss && (n === 'root' || n === 'stun' || n === 'slow' || n === 'blind')) t *= .3;
  const s = e.st[n];
  if (s) { s.t = Math.max(s.t, t); if (v > s.v) s.v = v; if (src) s.src = src; } else e.st[n] = { t, v: v || 0, src };
}
// Базовый эффект стихии при попадании (без реакций)
function elStatus(t, el, src, amt) {
  switch (el) {
    case 'fire': addSt(t, 'burn', 3, Math.max(2, amt * .25), src); break;
    case 'ash': addSt(t, 'burn', 3, Math.max(2, amt * .25), src); addSt(t, 'blind', 1.2); break;
    case 'water': addSt(t, 'wet', 6); break;
    case 'storm': addSt(t, 'stun', .25); break;
    case 'poison': addSt(t, 'poison', 4, Math.max(2, amt * .3), src); break;
    case 'nature': addSt(t, 'root', .7); break;
    case 'bone': addSt(t, 'brittle', 4); break;
    case 'slime': addSt(t, 'slow', 2.5); break;
    case 'shadow': addSt(t, 'blind', .8); addSt(t, 'brittle', 2); break;
    case 'beast': addSt(t, 'bleed', 3, Math.max(1, amt * .15), src); break;
  }
}

// ---------- Урон / лечение / смерть ----------
function damage(t, amt, src, o) {
  o = o || {};
  if (t.dead || !(amt > 0)) return 0;
  if (t.inv > 0 && !o.dot) return 0;
  if (t.isPlayer && inTown(t)) return 0;
  if (t.st.brittle) amt *= 1.25;
  if (o.el && t.weak === o.el) amt *= 1.5;
  if (o.el && t.resist === o.el) amt *= .5;
  amt = Math.max(1, Math.round(amt));
  if (t.shield > 0) {
    const a = Math.min(t.shield, amt); t.shield -= a; amt -= a;
    if (!o.dot) { burst(t.x, t.y, '#6fe0b0', 4, 2, { z: 10 }); Sfx.play('shield'); }
    if (t.shieldEl && src && src !== t && !o.dot && !o.thorn && dist(src.x, src.y, t.x, t.y) < 2.4) damage(src, t.shieldDmg || 3, t, { el: t.shieldEl, thorn: 1 });
    if (t.shield <= 0) { t.shieldT = 0; burst(t.x, t.y, '#c0fff0', 10, 4, { z: 10 }); }
    if (amt <= 0) return 0;
  }
  t.hp -= amt;
  const col = o.color || (t.isPlayer ? '#ff5a5a' : o.crit ? '#ffe95a' : (o.el && typeof EL !== 'undefined' && EL[o.el] ? EL[o.el].c : '#ffffff'));
  floatNum(t.x, t.y, amt, col);
  if (!o.dot) {
    t.flash = .12;
    if (o.kb) { const k = t.boss ? .15 : t.heavy ? t.heavy : 1; t.kx += o.kb[0] * k; t.ky += o.kb[1] * k; }
    if (t.isPlayer) { shake(3); Sfx.play('hurt'); } else Sfx.play('hit');
    burst(t.x, t.y, t.blood || '#ffffff', 3, 3, { z: 8, life: .6 });
  }
  const so = ownerOf(src);
  if (so && t.ai && !t.target && hostile(t, so) && !so.dead) t.target = src.dead ? so : src;
  if (so && so.isPlayer) t.lastHitBy = so;
  if (o.el && !o.noReact && !t.dead) { if (!RX.hit(t, o.el, src, amt)) elStatus(t, o.el, src, amt); }
  if (t.hp <= 0 && !t.dead) kill(t, src);
  return amt;
}
function heal(e, amt) { if (e.dead || amt <= 0) return; const b = e.hp; e.hp = Math.min(e.maxHp, e.hp + amt); const d = Math.round(e.hp - b); if (d > 0) floatNum(e.x, e.y, d, '#6aff8a'); }
function kill(t, src) {
  t.dead = true; t.hp = 0; t.st = {}; t.dash = null; t.wu = null;
  burst(t.x, t.y, [t.blood || '#ffffff', '#c9a0ff', '#8a6aca'], 16, 5, { z: 8 });
  Bus.emit(t.isPlayer ? 'playerDeath' : 'mobDeath', t, src);
}

// ---------- Движение с коллизией по тайлам ----------
function blk(x, y, r, f) { return blocked(x - r, y - r, f) || blocked(x + r, y - r, f) || blocked(x - r, y + r, f) || blocked(x + r, y + r, f); }
function moveEnt(e, dx, dy) {
  const r = e.r * .8, f = e.fly;
  if (blk(e.x, e.y, r, f)) { e.x += dx; e.y += dy; e.x = clamp(e.x, 1.5, MW - 1.5); e.y = clamp(e.y, 1.5, MH - 1.5); return; } // застрял внутри — дать выйти
  const st = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / .4)); dx /= st; dy /= st;
  for (let i = 0; i < st; i++) { if (!blk(e.x + dx, e.y, r, f)) e.x += dx; if (!blk(e.x, e.y + dy, r, f)) e.y += dy; }
}

// ---------- Общий тик сущности ----------
function updateEntCommon(e, dt) {
  e.anim += dt; if (e.flash > 0) e.flash -= dt; if (e.inv > 0) e.inv -= dt; if (e.toss > 0) e.toss -= dt;
  if (e.shieldT > 0) { e.shieldT -= dt; if (e.shieldT <= 0) e.shield = 0; }
  if (e.sayT > 0) e.sayT -= dt;
  for (const k in e.st) { e.st[k].t -= dt; if (e.st[k].t <= 0) delete e.st[k]; }
  e.dotT -= dt;
  if (e.dotT <= 0) {
    e.dotT = .5; const s = e.st;
    if (s.burn) damage(e, s.burn.v * .5, s.burn.src, { dot: 1, color: '#ff9a3a' });
    if (s.poison && !e.dead) damage(e, s.poison.v * .5, s.poison.src, { dot: 1, color: '#a6e23c' });
    if (s.bleed && !e.dead) damage(e, s.bleed.v * .5, s.bleed.src, { dot: 1, color: '#d04848' });
    if (e.dead) return;
  }
  // частицы статусов
  if (chance(dt * 14)) {
    const s = e.st;
    if (s.burn) part(e.x + rand(-.3, .3), e.y + rand(-.3, .3), rand(4, 14), 0, 0, rand(20, 40), .4, pick(['#ffb02e', '#ff6a1a', '#fff3a0']), 1, -10, 1);
    if (s.poison) part(e.x + rand(-.3, .3), e.y + rand(-.3, .3), rand(6, 14), 0, 0, rand(8, 16), .6, '#a6e23c', 1, -5);
    if (s.wet) part(e.x + rand(-.3, .3), e.y + rand(-.3, .3), rand(8, 16), 0, 0, 0, .4, '#7ac0f0', 1, 60);
    if (s.blind) part(e.x + rand(-.2, .2), e.y + rand(-.2, .2), rand(14, 18), 0, 0, 5, .5, '#d0d0d8', 2, -4);
  }
  // отбрасывание
  if (e.kx || e.ky) { moveEnt(e, e.kx * dt, e.ky * dt); const f = Math.pow(.002, dt); e.kx *= f; e.ky *= f; if (Math.abs(e.kx) + Math.abs(e.ky) < .1) e.kx = e.ky = 0; }
  // рывок (способность)
  if (e.dash) {
    const d = e.dash, st = d.spd * dt; moveEnt(e, d.dx * st, d.dy * st); d.t -= dt;
    for (const o of G.ents) if (!o.dead && hostile(e, o) && !d.hit[o.id] && dist(e.x, e.y, o.x, o.y) < .95 + o.r) { d.hit[o.id] = 1; damage(o, d.dmg, e, { el: d.el, kb: [d.dx * 9, d.dy * 9] }); }
    const ti = tIdx(e.x, e.y); if (ti !== d.lt) { d.lt = ti; if (d.el !== 'beast' && d.el !== 'phys' && d.el !== 'bone') RX.tile(e.x, e.y, d.el, e, { trail: 1, force: d.force, dmg: d.dmg }); }
    part(e.x, e.y, 8, 0, 0, 0, .25, d.color || '#ffffff', 3, 0, d.el === 'fire');
    if (d.t <= 0) e.dash = null;
  }
  // среда: огонь жжёт всех, вода мочит
  if (!e.fly) {
    const ti = tIdx(e.x, e.y);
    if (W.fire[ti] > 0 && !(e.inv > 0) && !e.dash) addSt(e, 'burn', 1.2, Math.max(4, e.maxHp * .05));
    if (W.g[ti] === T.SHALLOW || W.puddle[ti] > 0) addSt(e, 'wet', 1.5);
  }
  if (e.st.wet && e.st.burn) RX.mix(e);
}

// ---------- Частицы, текст, эффекты ----------
function part(x, y, z, vx, vy, vz, life, color, size, grav, glow) { if (G.parts.length > 900) return; G.parts.push({ x, y, z, vx, vy, vz, life, max: life, color, size: size || 1, grav: grav === undefined ? 90 : grav, glow }); }
function burst(x, y, color, n, sp, o) {
  o = o || {};
  for (let i = 0; i < n; i++) { const a = rand(TAU), s = rand(.3, 1) * sp; part(x, y, o.z || 6, Math.cos(a) * s, Math.sin(a) * s, rand(15, 55) * (o.up === undefined ? 1 : o.up), rand(.25, .6) * (o.life || 1), Array.isArray(color) ? pick(color) : color, o.size || 1, o.grav, o.glow); }
}
function updateParts(dt) {
  for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.life -= dt; if (p.life <= 0) { G.parts[i] = G.parts[G.parts.length - 1]; G.parts.pop(); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= p.grav * dt; if (p.z < 0) { p.z = 0; p.vz *= -.4; p.vx *= .6; p.vy *= .6; } }
  for (let i = G.texts.length - 1; i >= 0; i--) { const t = G.texts[i]; t.life -= dt; t.z += (t.num !== undefined ? 26 : 14) * dt * (t.life / t.max + .3); t.x += (t.vx || 0) * dt; if (t.life <= 0) G.texts.splice(i, 1); }
  for (let i = G.fx.length - 1; i >= 0; i--) { G.fx[i].life -= dt; if (G.fx[i].life <= 0) G.fx.splice(i, 1); }
}
function floatNum(x, y, n, color) { if (G.texts.length > 80) G.texts.shift(); G.texts.push({ x: x + rand(-.25, .25), y: y + rand(-.25, .25), z: 20, num: n, color, life: .8, max: .8, vx: rand(-.4, .4) }); }
function floatText(x, y, s, color, size) { G.texts.push({ x, y, z: 26, s, color: color || '#fff', life: 1.5, max: 1.5, size: size || 7 }); }
function fxBolt(x0, y0, x1, y1, color, z0, z1) {
  const pts = [], n = Math.max(3, Math.ceil(dist(x0, y0, x1, y1) * 1.6));
  for (let i = 0; i <= n; i++) { const t = i / n, j = i === 0 || i === n ? 0 : .28; pts.push([lerp(x0, x1, t) + rand(-j, j), lerp(y0, y1, t) + rand(-j, j), lerp(z0 === undefined ? 10 : z0, z1 === undefined ? 8 : z1, t)]); }
  G.fx.push({ t: 'bolt', pts, life: .18, max: .18, color: color || '#ffe95a' });
}
function fxSlash(x, y, dx, dy, r, arc, color) { G.fx.push({ t: 'slash', x, y, a: Math.atan2(dy, dx), r, arc, life: .16, max: .16, color: color || '#ffffff' }); }
function fxRing(x, y, r0, r1, color, life) { G.fx.push({ t: 'ring', x, y, r0, r1, color, life: life || .3, max: life || .3 }); }

// ---------- Снаряды (не зависят от того, кто выпустил) ----------
function spawnProj(o) { const p = Object.assign({ age: 0, hit: {}, lt: -1, r: .3, life: 1 }, o); G.projs.push(p); return p; }
function projImpact(p, e) {
  if (p.aoe) {
    for (const o of G.ents) if (o !== e && !o.dead && o.team !== p.team && dist(p.x, p.y, o.x, o.y) < p.aoe + o.r) damage(o, p.dmg * .6, p.src, { el: p.el });
    fxRing(p.x, p.y, .2, p.aoe, p.color, .25); burst(p.x, p.y, [p.color, '#ffffff'], 12, 4, { glow: p.el === 'fire' || p.el === 'ash' });
    RX.tile(p.x, p.y, p.el, p.src, { impact: 1, dmg: p.dmg });
    if (p.el === 'fire' || p.el === 'ash') { Sfx.play('fire'); for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (chance(.6)) RX.tile(p.x + d[0], p.y + d[1], p.el, p.src, { trail: 1 }); }
  } else { burst(p.x, p.y, p.color, 4, 2); if (!e) RX.tile(p.x, p.y, p.el, p.src, { impact: 1, dmg: p.dmg }); }
}
function updateProjs(dt) {
  for (let i = G.projs.length - 1; i >= 0; i--) {
    const p = G.projs[i]; p.life -= dt; p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    let dead = false; const tx = p.x | 0, ty = p.y | 0;
    if (tx < 1 || ty < 1 || tx >= MW - 1 || ty >= MH - 1) dead = true;
    else {
      const ti = ty * MW + tx;
      if (ti !== p.lt) {
        p.lt = ti; const ob = W.o[ti];
        if (ob && ob !== O.LAMP && p.kind !== 'wave' && p.kind !== 'whirl') { projImpact(p, null); dead = true; }
        else {
          if (p.kind === 'whirl' && p.el === 'wind' && W.fire[ti] > 0) RX.whirlFire && RX.whirlFire(p);
          if (p.trail) RX.tile(tx + .5, ty + .5, p.el, p.src, { trail: 1, dmg: p.dmg, dur: p.pud });
          if (RX.projTile) RX.projTile(p);
        }
      }
    }
    if (!dead) for (const e of G.ents) {
      if (e.dead || e.team === p.team || dist(p.x, p.y, e.x, e.y) > p.r + e.r) continue;
      const last = p.hit[e.id]; if (last !== undefined && (!p.rehit || p.age - last < p.rehit)) continue;
      p.hit[e.id] = p.age;
      if (p.kind === 'whirl' && p.el === 'wind' && e.st.burn && RX.whirlFire) RX.whirlFire(p);
      let kb = null;
      if (p.toss) { const a = rand(TAU); kb = [Math.cos(a) * 9, Math.sin(a) * 9]; if (!e.boss) e.toss = .4; }
      else if (p.kb) { const n = norm(p.vx, p.vy); kb = [n[0] * p.kb, n[1] * p.kb]; }
      damage(e, p.dmg, p.src, { el: p.el, kb });
      if (p.pull && p.src && !p.src.dead && !e.dead) { const n = norm(p.src.x - e.x, p.src.y - e.y), k = e.boss ? .15 : e.heavy || 1; e.kx += n[0] * p.pull * k; e.ky += n[1] * p.pull * k; addSt(e, 'slow', 1.5); fxBolt(p.src.x, p.src.y, e.x, e.y, p.color); }
      if (p.chain && typeof chainFrom === 'function') chainFrom(p.src, e, p.dmg * .5, 2, p.team);
      if (!p.pierce) { projImpact(p, e); dead = true; break; }
    }
    if (!dead && p.life <= 0) { if (p.kind === 'ball') projImpact(p, null); dead = true; }
    if (dead) { G.projs.splice(i, 1); continue; }
    if (p.kind === 'ball' && chance(dt * 40)) part(p.x, p.y, 9, rand(-.5, .5), rand(-.5, .5), rand(0, 10), .3, p.color, 1, 0, p.el === 'fire');
    if (p.kind === 'wave' && chance(dt * 60)) { const n = norm(p.vx, p.vy), s = rand(-p.r, p.r); part(p.x - n[1] * s, p.y + n[0] * s, 2, 0, 0, rand(20, 40), .35, pick([p.color, '#ffffff']), 1); }
    if (p.kind === 'whirl' && chance(dt * 50)) { const a = rand(TAU); part(p.x + Math.cos(a) * p.r * .7, p.y + Math.sin(a) * p.r * .7, rand(2, 20), -Math.sin(a) * 3, Math.cos(a) * 3, 20, .4, p.el === 'fire' ? pick(['#ffb02e', '#ff6a1a']) : p.color, 1, 0, p.el === 'fire'); }
  }
}

// ---------- Зоны (области на земле). Поведение задаётся по kind — без замыканий, сериализуемо ----------
const ZK = {};
function addZone(z) { z.age = 0; z.tt = 0; z.id = ++G.nid; G.zones.push(z); const k = ZK[z.kind]; if (k.init) k.init(z); return z; }
function updateZones(dt) {
  for (let i = G.zones.length - 1; i >= 0; i--) {
    const z = G.zones[i], k = ZK[z.kind]; z.age += dt; z.life -= dt;
    if (z.follow) { if (z.follow.dead) z.life = 0; else { z.x = z.follow.x; z.y = z.follow.y; } }
    if (z.tick) { z.tt += dt; while (z.tt >= z.tick && z.life > -1) { z.tt -= z.tick; if (k.tick) k.tick(z); } }
    if (k.update) k.update(z, dt);
    if (z.life <= 0) { if (k.end) k.end(z); G.zones.splice(G.zones.indexOf(z), 1); }
  }
}

// ---------- Подбираемое: души и золото ----------
function dropPickup(kind, x, y, v) { const a = rand(TAU); G.pickups.push({ kind, x, y, v, age: 0, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5 }); }
function updatePickups(dt) {
  for (let i = G.pickups.length - 1; i >= 0; i--) {
    const k = G.pickups[i]; k.age += dt;
    if (k.age < .35) { const nx = k.x + k.vx * dt, ny = k.y + k.vy * dt; if (!blocked(nx, ny)) { k.x = nx; k.y = ny; } continue; }
    if (k.age > 90) { G.pickups.splice(i, 1); continue; }
    for (const p of G.players) {
      if (p.dead || (k.owner && k.owner !== p.id)) continue; const d = dist(k.x, k.y, p.x, p.y);
      if (k.kind === 'item' && p.bag.length >= BAG_MAX && p.equip[k.v.slot]) { if (d < 1 && !(k.fullT > G.time)) { k.fullT = G.time + 3; floatText(p.x, p.y, 'Сумка полна', '#ff7a7a', 6); } continue; }
      if (d < .6) { Bus.emit('pickup', p, k); G.pickups.splice(i, 1); break; }
      if (d < 3.2) { const n = norm(p.x - k.x, p.y - k.y), s = (3.4 - d) * 4; k.x += n[0] * s * dt; k.y += n[1] * s * dt; }
    }
  }
}
