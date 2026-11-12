// Способности. Ни одна не знает, кто её кастует: игрок, моб, Тень или (в будущем) другой игрок.
// cast(c, x): c — любой кастер {x,y,team,atk}; x = {dx,dy — направление, tx,ty — точка, stars, el — стихия, mult}
const EL = {
  phys: { n: 'Удар', c: '#e8e8f0' },
  beast: { n: 'Зверь', c: '#d8c8b0', adj: ['Звериный', 'Звериная', 'Звериное', 'Звериные'] },
  fire: { n: 'Огонь', c: '#ff7a2a', adj: ['Огненный', 'Огненная', 'Огненное', 'Огненные'] },
  water: { n: 'Вода', c: '#4aa8ff', adj: ['Водяной', 'Водяная', 'Водяное', 'Водяные'] },
  storm: { n: 'Молния', c: '#ffe95a', adj: ['Грозовой', 'Грозовая', 'Грозовое', 'Грозовые'] },
  wind: { n: 'Ветер', c: '#b8f0e0', adj: ['Вихревой', 'Вихревая', 'Вихревое', 'Вихревые'] },
  poison: { n: 'Яд', c: '#a6e23c', adj: ['Ядовитый', 'Ядовитая', 'Ядовитое', 'Ядовитые'] },
  nature: { n: 'Трава', c: '#6fae4a', adj: ['Терновый', 'Терновая', 'Терновое', 'Терновые'] },
  bone: { n: 'Кость', c: '#e8e4d0', adj: ['Костяной', 'Костяная', 'Костяное', 'Костяные'] },
  slime: { n: 'Слизь', c: '#6fe0b0', adj: ['Слизистый', 'Слизистая', 'Слизистое', 'Слизистые'] },
  ash: { n: 'Пепел', c: '#ff5a3a', adj: ['Пепельный', 'Пепельная', 'Пепельное', 'Пепельные'] }
};
const ELSFX = { fire: 'fire', ash: 'fire', water: 'water', storm: 'zap', wind: 'wind', poison: 'poison', nature: 'roots', bone: 'arrow', slime: 'shield', beast: 'dash', phys: 'swing' };
const elSfx = el => Sfx.play(ELSFX[el] || 'swing');
function areaDmg(src, team, x, y, r, dmg, el, o) {
  let n = 0;
  for (const e of G.ents) {
    if (e.dead || e.team === team || dist(x, y, e.x, e.y) > r + e.r) continue;
    let kb = null; if (o && o.kb) { const d = norm(e.x - x, e.y - y); kb = [d[0] * o.kb, d[1] * o.kb]; }
    if (dmg > 0) damage(e, dmg, src, { el, kb }); if (o && o.st && !e.dead) addSt(e, o.st[0], o.st[1]); n++;
  }
  return n;
}
// Цепная молния от цели к цели
function chainFrom(src, from, dmg, max, team, el, hitSet) {
  let px = from.x, py = from.y; const hit = hitSet || {}; hit[from.id] = 1; el = el || 'storm';
  for (let n = 0; n < max; n++) {
    let best = null, bd = 3.8;
    for (const e of G.ents) if (!e.dead && e.team !== team && !hit[e.id]) { const d = dist(px, py, e.x, e.y); if (d < bd) { bd = d; best = e; } }
    if (!best) break; hit[best.id] = 1; fxBolt(px, py, best.x, best.y, EL[el].c); damage(best, dmg, src, { el }); px = best.x; py = best.y;
  }
}
function doDash(c, x, k, len, force) {
  let dx = x.dx, dy = x.dy; if (!dx && !dy) { dx = c.dirx; dy = c.diry; }
  c.dash = { dx, dy, t: .2, spd: 4.2 * len / .2, dmg: c.atk * k * x.mult, el: x.el, hit: {}, lt: -1, force, color: EL[x.el].c };
  c.inv = Math.max(c.inv, .2); Sfx.play('dash'); burst(c.x, c.y, EL[x.el].c, 8, 3);
}
function doArrows(c, x, k, chain) {
  const a0 = Math.atan2(x.dy, x.dx);
  for (let i = 0; i < 5; i++) { const a = a0 + (i - 2) * .14; spawnProj({ kind: 'arrow', x: c.x + Math.cos(a) * .4, y: c.y + Math.sin(a) * .4, vx: Math.cos(a) * 13, vy: Math.sin(a) * 13, r: .28, life: .62, team: c.team, src: c, dmg: c.atk * k * x.mult, el: x.el, color: EL[x.el].c, pierce: x.stars >= 3, chain }); }
  Sfx.play('arrow');
}
function doWhirl(c, x, k, big) {
  spawnProj({ kind: 'whirl', x: c.x + x.dx * .6, y: c.y + x.dy * .6, vx: x.dx * 4.6, vy: x.dy * 4.6, r: big ? 1.5 : 1.15, life: big ? 3.2 : 2.4, team: c.team, src: c, dmg: c.atk * k * x.mult, el: x.el, color: EL[x.el].c, pierce: true, rehit: .5, toss: true, trail: true });
  Sfx.play('wind');
}
function clampPt(c, x, r) { const d = dist(c.x, c.y, x.tx, x.ty); return d > r ? [c.x + (x.tx - c.x) / d * r, c.y + (x.ty - c.y) / d * r] : [x.tx, x.ty]; }

const AB = {
  // --- базовые ---
  bite: { noun: 'укус', g: 0, cd: 1.5, k: .9, ai: { range: 1.5, windup: .42, tele: 'arc', len: 1.8, ang: .9 }, cast(c, x) { fxSlash(c.x, c.y, x.dx, x.dy, 1.5, 1.8, EL[x.el].c); Sfx.play('swing'); for (const e of G.ents) { if (e.dead || !hostile(c, e)) continue; const d = dist(c.x, c.y, e.x, e.y); if (d < 1.8 + e.r && (d < .5 || ((e.x - c.x) * x.dx + (e.y - c.y) * x.dy) / d > .3)) damage(e, c.atk * this.k * x.mult, c, { el: x.el === 'phys' ? null : x.el, kb: [x.dx * 5, x.dy * 5] }); } } },
  dash: { noun: 'рывок', g: 0, cd: 4, k: 1.4, ai: { range: 5, min: 1.6, windup: .55, tele: 'line', len: 4.6, w: .9 }, cast(c, x) { doDash(c, x, this.k, 1); } },
  ball: { noun: 'шар', g: 0, cd: 3.5, k: 1.5, ai: { range: 7, windup: .6, tele: 'line', len: 7, w: .5 }, cast(c, x) { const n = x.stars >= 3 ? 3 : 1, a0 = Math.atan2(x.dy, x.dx); for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * .28; spawnProj({ kind: 'ball', x: c.x + Math.cos(a) * .5, y: c.y + Math.sin(a) * .5, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, r: .38, life: .85, team: c.team, src: c, dmg: c.atk * this.k * x.mult * (n > 1 ? .75 : 1), el: x.el, color: EL[x.el].c, aoe: 1.3 }); } elSfx(x.el); } },
  wave: { noun: 'волна', g: 1, cd: 6, k: 1.1, ai: { range: 5, windup: .7, tele: 'line', len: 5.6, w: 2.2 }, cast(c, x) { spawnProj({ kind: 'wave', x: c.x + x.dx * .5, y: c.y + x.dy * .5, vx: x.dx * 7, vy: x.dy * 7, r: x.stars >= 3 ? 1.6 : 1.1, life: .75, team: c.team, src: c, dmg: c.atk * this.k * x.mult, el: x.el, color: EL[x.el].c, pierce: true, kb: 13, trail: true, pud: x.stars >= 3 ? 18 : 10 }); elSfx(x.el === 'water' ? 'water' : x.el); Sfx.play('water'); } },
  chain: { noun: 'молния', g: 1, cd: 5, k: 1.2, ai: { range: 6, windup: .65, tele: 'cone', len: 6.3, ang: .42 }, cast(c, x) {
      const dmg = c.atk * this.k * x.mult, col = EL[x.el].c; let first = null, bd = 6.5;
      for (const e of G.ents) { if (e.dead || !hostile(c, e)) continue; const d = dist(c.x, c.y, e.x, e.y); if (d < bd && (d < .6 || ((e.x - c.x) * x.dx + (e.y - c.y) * x.dy) / d > .82)) { bd = d; first = e; } }
      elSfx(x.el); Sfx.play('zap');
      if (!first) { const ex = c.x + x.dx * 4.5, ey = c.y + x.dy * 4.5; fxBolt(c.x, c.y, ex, ey, col, 10, 0); burst(ex, ey, col, 5, 2); RX.tile(ex, ey, x.el, c, { impact: 1, dmg }); return; }
      fxBolt(c.x, c.y, first.x, first.y, col); const hs = {}; hs[first.id] = 1; damage(first, dmg, c, { el: x.el }); chainFrom(c, first, dmg * .85, (x.stars >= 3 ? 6 : 3) - 1, c.team, x.el, hs); RX.tile(first.x, first.y, x.el, c, { impact: 1, dmg });
    } },
  whirl: { noun: 'вихрь', g: 0, cd: 7, k: .7, ai: { range: 6, windup: .7, tele: 'line', len: 7, w: 1.8 }, cast(c, x) { doWhirl(c, x, this.k, x.stars >= 3); } },
  cloud: { noun: 'облако', g: 2, cd: 8, k: .45, maxRange: 5.5, ai: { range: 5.5, windup: .8, tele: 'circle', r: 2 }, cast(c, x) { const p = clampPt(c, x, 5.5); addZone({ kind: 'cloud', x: p[0], y: p[1], r: x.stars >= 3 ? 2.7 : 2, life: 6, tick: .5, team: c.team, src: c, dmg: c.atk * this.k * x.mult, el: x.el }); elSfx(x.el); } },
  roots: { noun: 'корни', g: 3, cd: 7, k: 1.1, ai: { range: 6, windup: .7, tele: 'line', len: 6.5, w: 1 }, cast(c, x) { addZone({ kind: 'rootline', x: c.x, y: c.y, dx: x.dx, dy: x.dy, len: x.stars >= 3 ? 8.5 : 6.5, prog: .6, done: .6, pts: [], hit: {}, life: 1.6, team: c.team, src: c, dmg: c.atk * this.k * x.mult, el: x.el, rootT: x.stars >= 3 ? 3 : 2 }); Sfx.play('roots'); } },
  arrows: { noun: 'стрелы', g: 3, cd: 5, k: .6, ai: { range: 8, windup: .7, tele: 'cone', len: 8, ang: .34 }, cast(c, x) { doArrows(c, x, this.k, false); } },
  shield: { noun: 'щит', g: 0, cd: 12, k: 0, ai: { range: 99, windup: .35, tele: 'self', cond: 'hurt' }, cast(c, x) { c.shield = Math.round(c.maxHp * (.3 + .1 * (x.stars - 1)) * Math.min(1.5, x.mult)); c.shieldMax = c.shield; c.shieldT = 6; c.shieldEl = (x.el === 'slime' && x.stars < 3) ? null : x.el; c.shieldDmg = c.atk * .5; Sfx.play('shield'); fxRing(c.x, c.y, .2, 1.4, EL[x.el].c, .35); } },
  ashstorm: { noun: 'буря', g: 1, cd: 22, k: 1.3, maxRange: 6, ai: { range: 8, windup: 1.3, tele: 'circle', r: 5 }, cast(c, x) { const p = clampPt(c, x, 8); addZone({ kind: 'ashstorm', x: p[0], y: p[1], r: 5, life: 2.7, tick: x.stars >= 3 ? .15 : .22, team: c.team, src: c, dmg: c.atk * this.k * x.mult, el: x.el }); Sfx.play('howl'); shake(4); } },
  // --- уникальные химеры ---
  blazedash: { noun: 'рывок', g: 0, cd: 4.5, k: 1.7, ai: { range: 6, min: 1.6, windup: .55, tele: 'line', len: 5.4, w: 1 }, cast(c, x) { doDash(c, x, this.k, 1.18, 3.5 + x.stars * .5); Sfx.play('fire'); } },
  thundercloud: { noun: 'туча', g: 1, cd: 16, k: .8, ai: { range: 6, windup: .5, tele: 'self' }, cast(c, x) { addZone({ kind: 'thundercloud', x: c.x, y: c.y, follow: c, r: 4.6, life: 8 + (x.stars - 1) * 1.5, tick: .7, team: c.team, src: c, dmg: c.atk * this.k * x.mult, el: 'storm' }); Sfx.play('zap'); } },
  firewhirl: { noun: 'смерч', g: 0, cd: 8, k: 1.1, ai: { range: 6, windup: .7, tele: 'line', len: 7, w: 2 }, cast(c, x) { doWhirl(c, x, this.k, true); Sfx.play('fire'); } },
  rotbomb: { noun: 'бомба', g: 1, cd: 9, k: 1.2, maxRange: 6, ai: { range: 6, windup: .6, tele: 'circle', r: 1.8 }, cast(c, x) { const p = clampPt(c, x, 6); addZone({ kind: 'blast', x: p[0], y: p[1], r: 1.8, life: .55, max: .55, lob: [c.x, c.y], team: c.team, src: c, dmg: c.atk * this.k * x.mult, el: 'poison', after: 'rot' }); Sfx.play('poison'); } },
  swamp: { noun: 'топь', g: 1, cd: 11, k: .35, maxRange: 5.5, ai: { range: 5.5, windup: .7, tele: 'circle', r: 2.8 }, cast(c, x) { const p = clampPt(c, x, 5.5); addZone({ kind: 'swamp', x: p[0], y: p[1], r: 2.8 + (x.stars - 1) * .3, life: 8, tick: .5, team: c.team, src: c, dmg: c.atk * this.k * x.mult, el: 'nature' }); Sfx.play('water'); Sfx.play('roots'); } },
  thunderarrows: { noun: 'стрелы', g: 3, cd: 6, k: .7, ai: { range: 8, windup: .7, tele: 'cone', len: 8, ang: .34 }, cast(c, x) { doArrows(c, x, this.k, true); Sfx.play('zap'); } },
  healbubble: { noun: 'пузырь', g: 0, cd: 18, k: 0, ai: { range: 99, windup: .4, tele: 'self', cond: 'hurt' }, cast(c, x) { addZone({ kind: 'heal', x: c.x, y: c.y, r: 2.3, life: 6, tick: .5, team: c.team, src: c, pct: .035 + .01 * (x.stars - 1) }); Sfx.play('water'); Sfx.play('shield'); } },
  pack: { noun: 'стая', g: 1, cd: 18, k: .6, ai: { range: 7, windup: .5, tele: 'self' }, cast(c, x) {
      const n = x.stars >= 3 ? 4 : 3;
      for (let i = 0; i < n; i++) { const a = Math.atan2(x.dy, x.dx) + (i - (n - 1) / 2) * .9; let sx = c.x + Math.cos(a) * 1.2, sy = c.y + Math.sin(a) * 1.2; if (blocked(sx, sy)) { sx = c.x; sy = c.y; } const w = mkMob('spirit', sx, sy, 1, { team: c.team, owner: c, lifeT: 6, ghost: true, target: null }); w.atk = c.atk * this.k * x.mult; w.maxHp = w.hp = Math.round(c.maxHp * .4); burst(sx, sy, '#a8f0ff', 8, 3); }
      Sfx.play('howl');
    } },
  sporeforest: { noun: 'лес', g: 0, cd: 12, k: .4, maxRange: 5.5, ai: { range: 5.5, windup: .8, tele: 'circle', r: 2.6 }, cast(c, x) { const p = clampPt(c, x, 5.5); addZone({ kind: 'spore', x: p[0], y: p[1], r: 2.6 + (x.stars - 1) * .3, life: 7, tick: .5, team: c.team, src: c, dmg: c.atk * this.k * x.mult, el: 'poison', rooted: {} }); Sfx.play('roots'); Sfx.play('poison'); } },
  geyser: { noun: 'гейзер', g: 0, cd: 9, k: 2.2, maxRange: 6, ai: { range: 6, windup: .5, tele: 'circle', r: 1.9 }, cast(c, x) { const p = clampPt(c, x, 6); addZone({ kind: 'blast', x: p[0], y: p[1], r: 1.9, life: .7, max: .7, team: c.team, src: c, dmg: c.atk * this.k * x.mult, el: 'water', stun: 1, after: 'steam' }); Sfx.play('steam'); } }
};
function castAb(c, a, aim) { AB[a.ab].cast(c, { dx: aim.dx, dy: aim.dy, tx: aim.tx, ty: aim.ty, stars: a.stars || 1, el: a.el, mult: a.mult || 1 }); }
function castSoul(c, def, stars, dx, dy, tx, ty, bonus) { AB[def.ab].cast(c, { dx, dy, tx, ty, stars, el: def.el, mult: (def.mult || 1) * (1 + .25 * (stars - 1)) * (bonus || 1) }); }

// ---------- Виды зон ----------
const zoneCol = z => EL[z.el] ? EL[z.el].c : '#ffffff';
ZK.cloud = {
  tick(z) { areaDmg(z.src, z.team, z.x, z.y, z.r, z.dmg, z.el); if (z.el !== 'poison' && z.el !== 'wind' && z.el !== 'beast' && z.el !== 'bone' && z.el !== 'slime') RX.tile(z.x + rand(-z.r, z.r) * .6, z.y + rand(-z.r, z.r) * .6, z.el, z.src, { trail: 1, dmg: z.dmg }); if (z.el === 'poison' && RX.cloudCheck) RX.cloudCheck(z); },
  update(z, dt) {
    if (chance(dt * 22)) { const a = rand(TAU), r = Math.sqrt(rand()) * z.r; part(z.x + Math.cos(a) * r, z.y + Math.sin(a) * r, rand(2, 12), rand(-.3, .3), rand(-.3, .3), rand(2, 8), rand(.6, 1.2), zoneCol(z), 2, -2); }
    if (z.fuse !== undefined) { z.fuse -= dt; if (z.fuse <= 0 && !z.blown) { z.blown = true; z.life = 0; if (RX.explode) RX.explode(z.x, z.y, 2.5, z.fuseDmg, z.src); else { areaDmg(z.src, z.team, z.x, z.y, 2.5, z.fuseDmg, 'fire', { kb: 10 }); fxRing(z.x, z.y, .3, 2.5, '#ffb02e'); Sfx.play('boom'); shake(6); } } }
  },
  draw(b, z) { isoEllipse(b, z.x, z.y, z.r, zoneCol(z), .16 + .05 * Math.sin(G.time * 5), zoneCol(z)); }
};
ZK.rootline = {
  update(z, dt) {
    z.prog = Math.min(z.len, z.prog + 24 * dt);
    while (z.done + .7 <= z.prog) {
      z.done += .7; const x = z.x + z.dx * z.done, y = z.y + z.dy * z.done, ob = W.o[tIdx(x, y)];
      if (x < 2 || y < 2 || x > MW - 2 || y > MH - 2 || (ob && ob !== O.LAMP)) { z.len = z.done; break; }
      z.pts.push([x, y, G.time]); burst(x, y, ['#7a5230', '#7ac84a'], 3, 2, { z: 2 });
      for (const e of G.ents) if (!e.dead && e.team !== z.team && !z.hit[e.id] && dist(x, y, e.x, e.y) < .85 + e.r) { z.hit[e.id] = 1; damage(e, z.dmg, z.src, { el: z.el }); addSt(e, 'root', z.rootT); }
      if (z.el !== 'nature') RX.tile(x, y, z.el, z.src, { trail: 1, dmg: z.dmg });
    }
  },
  draw(b, z) {
    for (const p of z.pts) { const s = w2s(p[0], p[1]), h = Math.min(9, (G.time - p[2]) * 60) * clamp(z.life * 3, 0, 1); b.fillStyle = '#4a2e18'; b.fillRect(s[0] - 3, s[1] - h * .6, 2, h * .6 + 1); b.fillRect(s[0] + 2, s[1] - h * .8, 2, h * .8 + 1); b.fillStyle = '#7a5230'; b.fillRect(s[0] - 1, s[1] - h, 2, h + 1); b.fillStyle = zoneCol(z); b.fillRect(s[0] - 1, s[1] - h - 1, 2, 2); }
  }
};
// Отложенный удар по области (гейзер, бомба, удары пепельной бури) — с телеграфом
ZK.blast = {
  draw(b, z) {
    const pr = clamp(1 - z.life / z.max, 0, 1), col = (G.me && z.team !== G.me.team) ? '#ff3030' : zoneCol(z);
    isoEllipse(b, z.x, z.y, z.r, col, .14, col); isoEllipse(b, z.x, z.y, z.r * pr, col, .26);
    if (z.lob) { const x = lerp(z.lob[0], z.x, pr), y = lerp(z.lob[1], z.y, pr), s = w2s(x, y), h = Math.sin(pr * Math.PI) * 26 + 8; b.fillStyle = '#3a5a1a'; b.fillRect(s[0] - 2, s[1] - h - 2, 5, 5); b.fillStyle = '#a6e23c'; b.fillRect(s[0] - 1, s[1] - h - 1, 3, 3); }
    else if (z.sky) { const s = w2s(z.x, z.y), h = (1 - pr) * 90; b.fillStyle = '#ff5a1a'; b.fillRect(s[0] - 2 + h * .3, s[1] - h - 4, 4, 5); b.fillStyle = '#ffd870'; b.fillRect(s[0] - 1 + h * .3, s[1] - h - 3, 2, 3); }
  },
  end(z) {
    const col = zoneCol(z); areaDmg(z.src, z.team, z.x, z.y, z.r, z.dmg, z.el, { kb: 7, st: z.stun ? ['stun', z.stun] : null });
    fxRing(z.x, z.y, .2, z.r, col, .3); burst(z.x, z.y, [col, '#ffffff'], 16, 5, { glow: z.el === 'ash' || z.el === 'fire', up: 1.6 });
    if (G.me && dist(z.x, z.y, G.me.x, G.me.y) < 9) { shake(z.sky ? 2.5 : 4); Sfx.play(z.el === 'water' ? 'water' : 'boom'); }
    RX.tile(z.x, z.y, z.el, z.src, { impact: 1, dmg: z.dmg, force: z.force });
    if (z.el === 'water') for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) RX.tile(z.x + d[0], z.y + d[1], 'water', z.src, { trail: 1 });
    if (z.after === 'rot') addZone({ kind: 'cloud', x: z.x, y: z.y, r: 2.1, life: 3, tick: .5, team: z.team, src: z.src, dmg: z.dmg * .25, el: 'poison', fuse: 1.1, fuseDmg: z.dmg * 1.6 });
    else if (z.after === 'steam' && RX.steam) RX.steam(z.x, z.y, z.src);
  }
};
ZK.ashstorm = {
  tick(z) { const a = rand(TAU), r = Math.sqrt(rand()) * z.r; addZone({ kind: 'blast', x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r, r: 1.4, life: .7, max: .7, sky: true, team: z.team, src: z.src, dmg: z.dmg, el: z.el, force: 2 }); },
  draw(b, z) { isoEllipse(b, z.x, z.y, z.r, zoneCol(z), .06, zoneCol(z)); }
};
ZK.thundercloud = {
  tick(z) {
    let best = null, bd = z.r; for (const e of G.ents) if (!e.dead && e.team !== z.team) { const d = dist(z.x, z.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
    if (!best) return; addSt(best, 'wet', 3); fxBolt(z.x, z.y, best.x, best.y, '#ffe95a', 30, 6); Sfx.play('zap'); damage(best, z.dmg, z.src, { el: 'storm' });
  },
  update(z, dt) { if (chance(dt * 30)) part(z.x + rand(-1, 1), z.y + rand(-1, 1), 28, 0, 0, -60, .45, '#7ac0f0', 1, 0); },
  top(b, z) { const s = w2s(z.x, z.y), y = s[1] - 40 + Math.sin(G.time * 3) * 1.5, f = z.life < 1.5 && Math.floor(G.time * 10) % 2; if (f) return; b.fillStyle = '#3a3a4c'; b.fillRect(s[0] - 13, y + 3, 26, 6); b.fillRect(s[0] - 9, y, 10, 5); b.fillRect(s[0] + 1, y + 1, 9, 4); b.fillStyle = '#5a5a70'; b.fillRect(s[0] - 8, y + 1, 8, 2); b.fillRect(s[0] + 2, y + 2, 6, 1); b.fillStyle = '#ffe95a'; if (z.tt < .12) b.fillRect(s[0] - 13, y + 8, 26, 1); },
  topD: .3
};
ZK.swamp = {
  init(z) { for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i, j) < z.r - .3) addPuddle(tIdx(z.x + i, z.y + j), z.life); },
  tick(z) { for (const e of G.ents) if (!e.dead && e.team !== z.team && !e.fly && dist(z.x, z.y, e.x, e.y) < z.r + e.r) { addSt(e, 'slow', 1.2); addSt(e, 'wet', 2); damage(e, z.dmg, z.src, { el: null, color: '#6fae4a' }); } },
  update(z, dt) { if (chance(dt * 10)) { const a = rand(TAU), r = Math.sqrt(rand()) * z.r; part(z.x + Math.cos(a) * r, z.y + Math.sin(a) * r, 1, 0, 0, 14, .6, pick(['#4a6a2a', '#6fae4a']), 2, 0); } },
  draw(b, z) { isoEllipse(b, z.x, z.y, z.r, '#3a5a2a', .4 * clamp(z.life, 0, 1), '#6fae4a'); }
};
ZK.heal = {
  tick(z) { for (const e of G.ents) if (!e.dead && e.team === z.team && dist(z.x, z.y, e.x, e.y) < z.r + e.r) { heal(e, e.maxHp * z.pct); delete e.st.burn; delete e.st.poison; delete e.st.bleed; } },
  update(z, dt) { if (chance(dt * 16)) { const a = rand(TAU), r = Math.sqrt(rand()) * z.r; part(z.x + Math.cos(a) * r, z.y + Math.sin(a) * r, 1, 0, 0, rand(14, 30), .8, pick(['#6aff8a', '#a8f0ff']), 1, -4); } },
  draw(b, z) { isoEllipse(b, z.x, z.y, z.r, '#6fe0d0', .18 + .05 * Math.sin(G.time * 4), '#a8fff0'); },
  top(b, z) { const s = w2s(z.x, z.y); b.strokeStyle = '#a8fff0'; b.globalAlpha = .4 * clamp(z.life, 0, 1); b.lineWidth = 1; b.beginPath(); b.ellipse(s[0], s[1], z.r * 22.6, z.r * 20, 0, Math.PI, TAU); b.stroke(); b.globalAlpha = 1; },
  topD: 2
};
ZK.spore = {
  tick(z) { for (const e of G.ents) if (!e.dead && e.team !== z.team && dist(z.x, z.y, e.x, e.y) < z.r + e.r) { damage(e, z.dmg, z.src, { el: 'poison' }); if (!e.dead && (!z.rooted[e.id] || G.time - z.rooted[e.id] > 3.2)) { z.rooted[e.id] = G.time; addSt(e, 'root', 1.6); } } if (RX.cloudCheck) RX.cloudCheck(z); },
  update(z, dt) { if (chance(dt * 14)) { const a = rand(TAU), r = Math.sqrt(rand()) * z.r; part(z.x + Math.cos(a) * r, z.y + Math.sin(a) * r, rand(4, 10), rand(-.2, .2), rand(-.2, .2), 6, .9, '#b04ad8', 1, -2); } },
  draw(b, z) {
    isoEllipse(b, z.x, z.y, z.r, '#5a7a1a', .22, '#a6e23c'); const g = clamp(z.age * 4, 0, 1) * clamp(z.life * 2, 0, 1);
    for (let i = 0; i < 9; i++) { const a = i * 2.4 + z.id, r = z.r * (.25 + .7 * hash2(i, z.id, 5)), s = w2s(z.x + Math.cos(a) * r, z.y + Math.sin(a) * r), h = Math.round(6 * g); b.fillStyle = '#f0e8c8'; b.fillRect(s[0] - 1, s[1] - h, 2, h); b.fillStyle = '#8fcc2a'; b.fillRect(s[0] - 3, s[1] - h - 2, 6, 3); b.fillStyle = '#b04ad8'; b.fillRect(s[0] - 1, s[1] - h - 2, 1, 1); }
  }
};
