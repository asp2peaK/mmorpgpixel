// Мобы: каждый дерётся СВОЕЙ душой-способностью, с замахом-телеграфом. ИИ целится в ближайшего врага по team.
const MOBS = {
  wolf: { name: 'Волк', hp: 38, atk: 7, spd: 3.6, abils: ['dash', 'bite'], el: 'beast', soul: 'wolf', blood: '#c8c8d0' },
  slime: { name: 'Слизень', hp: 55, atk: 6, spd: 2.2, abils: ['shield', 'bite'], el: 'slime', soul: 'slime', hop: true, blood: '#6fe0a0' },
  shroom: { name: 'Ядогриб', hp: 34, atk: 6, spd: 1.7, abils: ['cloud'], el: 'poison', soul: 'shroom', keep: 3.6, weak: 'fire', immune: { poison: 1 }, blood: '#8fcc2a' },
  root: { name: 'Корень-хватала', hp: 70, atk: 8, spd: 0, abils: ['roots', 'bite'], el: 'nature', soul: 'root', weak: 'fire', immune: { root: 1 }, heavy: .2, blood: '#7a5230' },
  bat: { name: 'Грозовая мышь', hp: 30, atk: 7, spd: 4, abils: ['chain'], el: 'storm', soul: 'bat', fly: true, keep: 4.2, blood: '#7a4ab8' },
  skel: { name: 'Скелет-лучник', hp: 40, atk: 7, spd: 2.8, abils: ['arrows'], el: 'bone', soul: 'skel', keep: 5.6, immune: { poison: 1, bleed: 1 }, blood: '#f0ecd8' },
  water: { name: 'Водяной дух', hp: 48, atk: 7, spd: 2.6, abils: ['wave'], el: 'water', soul: 'water', keep: 3.2, weak: 'storm', immune: { burn: 1 }, blood: '#5aa8f0' },
  imp: { name: 'Огненный бес', hp: 44, atk: 8, spd: 3.2, abils: ['ball'], el: 'fire', soul: 'imp', keep: 4.6, weak: 'water', immune: { burn: 1 }, blood: '#e8502a' },
  falcon: { name: 'Ветряной сокол', hp: 40, atk: 8, spd: 4.4, abils: ['whirl', 'bite'], el: 'wind', soul: 'falcon', fly: true, keep: 4, blood: '#7ae0c8' },
  ashwolf: { name: 'Пепельный Волк', hp: 1500, atk: 25, spd: 3.5, abils: [{ ab: 'blazedash', el: 'fire', cdm: 1 }, { ab: 'ashstorm', el: 'ash', cdm: .5 }, { ab: 'bite', el: 'ash', cdm: 1 }], el: 'ash', soul: 'ashwolf', boss: true, r: .7, immune: { burn: 1, blind: 1 }, aggro: 9, leash: 13, blood: '#ff7a1a', scale: 1 },
  spirit: { name: 'Призрачный волк', spr: 'spirit', hp: 30, atk: 5, spd: 5, abils: [{ ab: 'dash', cdm: .6 }, { ab: 'bite', cdm: .7 }], el: 'beast', aggro: 9, leash: 99, blood: '#a8f0ff' },
  nemesis: { name: 'Тень', spr: 'nem', hp: 100, atk: 10, spd: 3.6, abils: [], el: 'phys', aggro: 8.5, leash: 14, heavy: .5, blood: '#8a1a2a' }
};
function mkMob(type, x, y, lvl, o) {
  const d = MOBS[type], sc = d.boss || type === 'nemesis' || type === 'spirit';
  const m = mkEnt({
    ai: true, type, name: d.name, spr: d.spr || type, x, y, hx: x, hy: y, lvl, team: 2, r: d.r || .32, fly: !!d.fly, hop: !!d.hop, spd: d.spd, weak: d.weak, resist: d.resist, immune: d.immune || {}, heavy: d.heavy, blood: d.blood,
    maxHp: Math.round(d.hp * (sc ? 1 : 1 + .32 * (lvl - 1))), atk: d.atk * (sc ? 1 : 1 + .2 * (lvl - 1)), state: 'idle', stT: 0, target: null, wu: null, scanT: rand(.3), wt: rand(1, 3), wx: x, wy: y,
    abils: d.abils.map(a => ({ ab: a.ab || a, el: a.el || d.el, mult: a.mult || 1, stars: 1, cd: rand(.8, 2.5), cdm: a.cdm || 1.5 })), keep: d.keep || 0, aggro: d.aggro || 7.5, leash: d.leash || 15, boss: !!d.boss, scale: d.scale, humanoid: type === 'nemesis', stuck: 0, avoid: 0, strafe: chance(.5) ? 1 : -1, strT: rand(1, 3)
  });
  if (o) Object.assign(m, o);
  m.hp = m.maxHp; G.ents.push(m); return m;
}
function findTarget(m) {
  let best = null, bd = m.st.blind ? 1.6 : m.aggro;
  for (const e of G.ents) { if (e.dead || !hostile(m, e) || (e.isPlayer && inTown(e)) || e.inv > 1) continue; const d = dist(m.x, m.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
  return best;
}
function mobMove(m, dx, dy, sp, dt) {
  if (m.avoid > 0) { m.avoid -= dt; const px = -dy * m.avoidDir, py = dx * m.avoidDir; dx = dx * .3 + px; dy = dy * .3 + py; const n = norm(dx, dy); dx = n[0]; dy = n[1]; }
  const ox = m.x, oy = m.y; moveEnt(m, dx * sp * dt, dy * sp * dt); m.moving = true;
  if (dist(ox, oy, m.x, m.y) < sp * dt * .35) { m.stuck += dt; if (m.stuck > .25) { m.stuck = 0; m.avoid = .7; m.avoidDir = chance(.5) ? 1 : -1; } } else m.stuck = 0;
  if (m.team !== 1) { const d = dist(m.x, m.y, TOWN.x, TOWN.y); if (d < TOWN.r + .5) { m.x = TOWN.x + (m.x - TOWN.x) / d * (TOWN.r + .5); m.y = TOWN.y + (m.y - TOWN.y) / d * (TOWN.r + .5); m.target = null; } }
}
function updateMob(m, dt) {
  m.moving = false;
  for (const a of m.abils) a.cd -= dt;
  if (m.lifeT !== undefined) { m.lifeT -= dt; if (m.lifeT <= 0) { m.dead = true; burst(m.x, m.y, '#a8f0ff', 10, 3); return; } }
  if (m.st.stun || m.dash || m.toss > 0) return;
  let t = m.target;
  if (t && (t.dead || (t.isPlayer && inTown(t)) || (!m.owner && dist(m.x, m.y, m.hx, m.hy) > m.leash * 1.4))) { t = m.target = null; m.state = 'idle'; m.wu = null; }
  if (!t) { m.scanT -= dt; if (m.scanT <= 0) { m.scanT = .3; t = m.target = findTarget(m); if (t) { m.state = 'chase'; Bus.emit('aggro', m, t); } } }
  if (m.onUpdate) m.onUpdate(m, dt);
  if (m.state === 'windup' && m.wu) {
    const wu = m.wu; wu.t -= dt; const f = wu.dx - wu.dy; if (Math.abs(f) > .15) m.face = f > 0 ? 1 : -1;
    if (wu.t <= 0) { m.wu = null; m.state = 'recover'; m.stT = m.enraged ? .25 : .45; castAb(m, wu.a, wu); wu.a.cd = AB[wu.a.ab].cd * wu.a.cdm * (m.enraged ? .6 : 1) + rand(.4); }
    return;
  }
  if (m.state === 'recover') { m.stT -= dt; if (m.stT <= 0) m.state = 'chase'; return; }
  const slow = (m.st.slow ? .5 : 1) * (m.st.root ? 0 : 1) * (m.enraged ? 1.3 : 1);
  if (!t) {
    if (m.owner) { const d = dist(m.x, m.y, m.owner.x, m.owner.y); if (d > 2.5) { const n = norm(m.owner.x - m.x, m.owner.y - m.y); mobMove(m, n[0], n[1], m.spd * slow, dt); m.face = n[0] - n[1] > 0 ? 1 : -1; } return; }
    const dh = dist(m.x, m.y, m.hx, m.hy);
    if (dh > 5) { const n = norm(m.hx - m.x, m.hy - m.y); mobMove(m, n[0], n[1], m.spd * slow, dt); m.face = n[0] - n[1] > 0 ? 1 : -1; if (m.hp < m.maxHp) m.hp = Math.min(m.maxHp, m.hp + m.maxHp * .2 * dt); if (m.boss && m.enraged && m.hp >= m.maxHp) m.enraged = false; }
    else if (m.spd > 0) {
      if (m.hp < m.maxHp) m.hp = Math.min(m.maxHp, m.hp + m.maxHp * .05 * dt);
      m.wt -= dt; if (m.wt <= 0) { m.wt = rand(2, 5); m.wx = m.hx + rand(-3, 3); m.wy = m.hy + rand(-3, 3); }
      if (dist(m.x, m.y, m.wx, m.wy) > .4 && m.wt > 1) { const n = norm(m.wx - m.x, m.wy - m.y); mobMove(m, n[0], n[1], m.spd * .35 * slow, dt); m.face = n[0] - n[1] > 0 ? 1 : -1; }
    }
    return;
  }
  const d = dist(m.x, m.y, t.x, t.y), n = norm(t.x - m.x, t.y - m.y), f = n[0] - n[1]; if (Math.abs(f) > .15) m.face = f > 0 ? 1 : -1;
  m.dirx = n[0]; m.diry = n[1];
  if (!m.st.blind || d < 1.8) for (const a of m.abils) {
    if (a.cd > 0) continue; const A = AB[a.ab].ai;
    if (d > A.range || d < (A.min || 0)) continue;
    if (A.cond === 'hurt' && m.hp > m.maxHp * .7) continue;
    if (a.ab === 'shield' && m.shield > 0) continue;
    let dx = n[0], dy = n[1]; if (m.st.blind) { const q = rand(TAU); dx = Math.cos(q); dy = Math.sin(q); }
    const wt = A.windup * (m.enraged ? .75 : 1); m.state = 'windup'; m.wu = { a, t: wt, total: wt, dx, dy, tx: t.x, ty: t.y }; return;
  }
  let mx = 0, my = 0;
  if (m.keep) {
    if (d < m.keep - 1) { mx = -n[0]; my = -n[1]; } else if (d > m.keep + .8) { mx = n[0]; my = n[1]; }
    else { m.strT -= dt; if (m.strT <= 0) { m.strT = rand(1, 3); m.strafe = -m.strafe; } mx = -n[1] * m.strafe * .6; my = n[0] * m.strafe * .6; }
  } else if (d > 1.05) { mx = n[0]; my = n[1]; }
  if ((mx || my) && m.spd > 0) mobMove(m, mx, my, m.spd * slow, dt);
}
// Мобы не слипаются
function separateMobs() {
  const L = G.ents;
  for (let i = 0; i < L.length; i++) { const a = L[i]; if (!a.ai || a.dead || a.dash || a.spd === 0) continue; for (let j = i + 1; j < L.length; j++) { const c = L[j]; if (!c.ai || c.dead || c.dash) continue; const dx = c.x - a.x, dy = c.y - a.y; if (Math.abs(dx) > 1 || Math.abs(dy) > 1) continue; const d = Math.hypot(dx, dy), mn = a.r + c.r; if (d < mn && d > .001) { const p = (mn - d) / d * .5; if (!blk(a.x - dx * p, a.y - dy * p, a.r * .8, a.fly)) { a.x -= dx * p; a.y -= dy * p; } if (c.spd !== 0 && !blk(c.x + dx * p, c.y + dy * p, c.r * .8, c.fly)) { c.x += dx * p; c.y += dy * p; } } } }
}
// Спавнер: мобы возрождаются, когда игрок далеко
let spawnT = 0;
function updateSpawner(dt) {
  separateMobs();
  spawnT -= dt; if (spawnT > 0) return; spawnT = .5;
  for (const s of W.spawns) {
    for (let i = s.list.length - 1; i >= 0; i--) if (s.list[i].dead) s.list.splice(i, 1);
    if (s.list.length) { s.armed = true; continue; }
    if (s.armed) { s.armed = false; s.t = s.boss ? 100 : rand(35, 55); }
    if (s.t > 0) { s.t -= .5; continue; }
    let near = false; for (const p of G.players) if (dist(p.x, p.y, s.x, s.y) < (G.time < 1 ? 0 : 13)) near = true;
    if (near) continue;
    for (let i = 0; i < s.n; i++) {
      let x = s.x + (i ? rand(-1.2, 1.2) : 0), y = s.y + (i ? rand(-1.2, 1.2) : 0); if (blocked(x, y, MOBS[s.type].fly)) { x = s.x; y = s.y; }
      const m = mkMob(s.type, x, y, s.lvl); s.list.push(m);
      if (s.boss) setupBoss(m);
    }
  }
}
G.systems.push(updateSpawner);

// ---------- Босс: Пепельный Волк ----------
function setupBoss(m) {
  m.onUpdate = (b) => {
    if (!b.enraged && b.target && b.hp <= b.maxHp * .5) {
      b.enraged = true; banner('ПЕПЕЛЬНЫЙ ВОЛК В ЯРОСТИ', 'Он призывает бесов!', '#ff5a3a'); Sfx.play('howl'); shake(8); fxRing(b.x, b.y, .5, 6, '#ff5a3a', .6);
      for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + rand(.5), x = b.x + Math.cos(a) * 3, y = b.y + Math.sin(a) * 3; const im = mkMob('imp', blocked(x, y) ? b.x : x, blocked(x, y) ? b.y : y, 8, { summoned: true }); im.target = b.target; im.hx = LAIR.x; im.hy = LAIR.y; burst(im.x, im.y, ['#ff7a2a', '#ffe04a'], 14, 4, { glow: 1 }); }
    }
    if (!b.target && b.hp >= b.maxHp) b.enraged = false;
  };
}
function activeBoss() { for (const e of G.ents) if (e.boss && !e.dead && G.me && dist(e.x, e.y, G.me.x, G.me.y) < 15) return e; return null; }

// ---------- Смерть моба: опыт, золото, душа ----------
Bus.on('mobDeath', (m, src) => {
  if (m.owner || m.type === 'spirit') return;
  let p = ownerOf(src); if (!p || !p.isPlayer) p = m.lastHitBy; if (!p || !p.isPlayer) { let bd = 20; p = null; for (const q of G.players) { const d = dist(q.x, q.y, m.x, m.y); if (d < bd) { bd = d; p = q; } } }
  if (!p) return;
  if (m.isNemesis) { Bus.emit('nemesisDeath', m, p); return; }
  G.J.kills++;
  gainXp(p, m.boss ? 400 : 5 + 5 * m.lvl);
  const g = m.boss ? 250 : randi(2, 4) * m.lvl; for (let i = 0, n = m.boss ? 10 : 1 + (g > 12 ? 1 : 0); i < n; i++) dropPickup('gold', m.x, m.y, Math.ceil(g / n));
  const soul = MOBS[m.type].soul;
  if (soul && !m.summoned) { const ch = m.boss ? (G.J.obtained[soul] ? .35 : 1) : (G.J.obtained[soul] ? .15 : .6); if (chance(ch)) dropPickup('soul', m.x, m.y, soul); }
  if (m.boss) { G.J.bossKills++; banner('ПЕПЕЛЬНЫЙ ВОЛК ПОВЕРЖЕН', 'Шепчущий лес свободен... пока что', '#ffd870'); Sfx.play('levelup'); shake(10); for (let i = 0; i < 5; i++) fxRing(m.x, m.y, .5, 4 + i * 1.5, '#ff7a2a', .5 + i * .15); Bus.emit('bossDeath', m, p); }
});
