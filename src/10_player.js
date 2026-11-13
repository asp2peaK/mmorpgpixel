// Игрок. Управляется через «намерение» (intent) — локальный ввод или, в будущем, сеть.
const MAXLVL = 10, POTION_MAX = 6, POTION_COST = 40, MPOT_MAX = 4, SCROLL_MAX = 3;
const xpNext = l => Math.round(45 * Math.pow(l, 1.85));
function mkPlayer(name) {
  const p = mkEnt({ isPlayer: true, humanoid: true, name: name || 'Герой', team: 1, spr: 'hero', r: .3, spd: 4.3, lvl: 1, xp: 0, gold: 0, potions: 2, souls: {}, ess: 0, slv: {}, mpot: 1, scrolls: 0, style: 'melee', mp: 60, mpTrain: 0, mast: {}, shards: 0, equip: { weapon: null, armor: null, amulet: null, ring: null }, bag: [], slots: [null, null, null, null], sl: [0, 1, 2, 3].map(() => ({ cd: 0, ch: 1 })), combo: 0, comboT: 0, swing: null, roll: null, rollCd: 0, potCd: 0, respawn: 0, blood: '#ff5a5a', x: TOWN.x, y: TOWN.y + 1.6 });
  recalc(p); p.hp = p.maxHp; return p;
}
function recalc(p) {
  const g = gearStats(ISLOTS.map(s => p.equip[s])); p.gs = g;
  p.maxHp = Math.round((100 + 22 * (p.lvl - 1) + g.hp) * (1 - .08 * g.curse) * (p.style === 'ranged' ? .85 : 1)); p.atk = (10 + 2.2 * (p.lvl - 1) + g.atk) * (p.buffT > G.time ? 1.2 : 1); p.spd = 4.3 * (1 + Math.min(30, g.spd) / 100);
  p.cdm = 1 - Math.min(40, g.cdr) / 100; p.crit = .1 + g.crit / 100; p.potB = 1 + g.pot / 100; p.maxMp = 60 + 6 * (p.lvl - 1) + manaBonus(p); if (p.mp > p.maxMp) p.mp = p.maxMp;
  const en = s => p.equip[s] && p.equip[s].ench ? soulDef(p.equip[s].ench).el : null; p.wEl = en('weapon'); p.resist = en('armor'); p.aEl = en('amulet'); p.rEl = en('ring');
  p.immune = {}; const im = { fire: 'burn', ash: 'burn', poison: 'poison', slime: 'slow', beast: 'bleed', nature: 'root', bone: 'brittle', storm: 'stun' }[p.resist]; if (im) p.immune[im] = 1; if (p.hp > p.maxHp) p.hp = p.maxHp;
}
const starsOf = n => n >= 6 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;
function maxCharges(def, stars) { return def && def.ab === 'dash' && stars >= 3 ? 2 : 1; }
function resetSlot(p, s) { const id = p.slots[s]; p.sl[s] = { cd: 0, ch: id ? maxCharges(soulDef(id), starsOf(p.souls[id])) : 1 }; }
function equip(p, id, s) { for (let i = 0; i < 4; i++) if (p.slots[i] === id) { p.slots[i] = p.slots[s]; resetSlot(p, i); } p.slots[s] = id; resetSlot(p, s); }
function giveSoul(p, id, n, quiet) {
  const before = starsOf(p.souls[id] || 0); p.souls[id] = (p.souls[id] || 0) + (n || 1); G.J.obtained[id] = 1;
  const after = starsOf(p.souls[id]), def = soulDef(id);
  if (p.slots.indexOf(id) < 0) { const f = p.slots.indexOf(null); if (f >= 0) equip(p, id, f); }
  if (!quiet) {
    floatText(p.x, p.y, '+ ' + def.name, '#c9a0ff', 8); Sfx.play('soul');
    if (before === 0) banner('НОВАЯ ДУША', def.name + ' — ' + def.abName, '#c9a0ff');
    else if (after > before) { banner('★'.repeat(after) + ' ' + def.name, after === 3 && def.s3 ? 'Бонус: ' + def.s3 : 'Душа стала сильнее', '#ffd870'); for (let i = 0; i < 4; i++) if (p.slots[i] === id) resetSlot(p, i); }
  }
}
function takeSoul(p, id) { p.souls[id]--; if (p.souls[id] <= 0) { delete p.souls[id]; for (let i = 0; i < 4; i++) if (p.slots[i] === id) { p.slots[i] = null; resetSlot(p, i); } } }
function gainXp(p, n) {
  if (p.lvl >= MAXLVL) return; p.xp += n;
  while (p.lvl < MAXLVL && p.xp >= xpNext(p.lvl)) {
    p.xp -= xpNext(p.lvl); p.lvl++; recalc(p); p.hp = p.maxHp;
    banner('УРОВЕНЬ ' + p.lvl, 'Здоровье и урон выросли', '#ffd870'); Sfx.play('levelup'); burst(p.x, p.y, ['#ffd870', '#ffffff'], 30, 6, { z: 10, glow: 1 }); fxRing(p.x, p.y, .3, 3, '#ffd870', .5);
  }
  if (p.lvl >= MAXLVL) p.xp = 0;
}
function banner(title, sub, color) { G.banner = { title, sub: sub || '', color: color || '#ffffff', t: 3.2, max: 3.2 }; Sfx.play('banner'); }

// Что рядом можно использовать (Алтарь, торговец, камень возрождения)
function nearInteract(p) {
  let best = null, bd = 2.3;
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
    const tx = (p.x | 0) + i, ty = (p.y | 0) + j, o = W.o[ty * MW + tx];
    if (o !== O.ALTAR && o !== O.MERCH && o !== O.STONE && o !== O.SMITH && o !== O.CRYPT && o !== O.EXIT && o !== O.CHEST && o !== O.ELDER) continue;
    const d = dist(p.x, p.y, tx + .5, ty + .5); if (d < bd) { bd = d; best = { o, x: tx + .5, y: ty + .5, label: o === O.ALTAR ? 'Алтарь душ' : o === O.MERCH ? 'Торговец' : o === O.SMITH ? 'Кузнец' : o === O.CRYPT ? 'Спуститься в подземелье' : o === O.EXIT ? 'Выйти наружу' : o === O.CHEST ? 'Открыть сундук' : o === O.ELDER ? 'Старейшина' : 'Камень возрождения' }; }
  }
  return best;
}
function usePotion(p) {
  if (p.potCd > 0 || p.dead) return;
  if (p.potions <= 0 || p.hp >= p.maxHp) { Sfx.play('deny'); return; }
  p.potions--; p.potCd = 1; heal(p, p.maxHp * .35 * p.potB); Sfx.play('potion'); burst(p.x, p.y, ['#6aff8a', '#ffffff'], 12, 3, { z: 10, grav: -20 });
}
// Мана растёт от использования: чем больше потратил за жизнь, тем больше запас (с убывающей отдачей)
const manaBonus = p => Math.min(140, Math.floor(Math.sqrt((p.mpTrain || 0) / 6)));
const manaCost = (ab) => Math.round(5 + ab.cd * 2.1);
// Владение стихией: растёт от кастов и реакций, усиливает души этой стихии
const MAST_T = [0, 15, 45, 110, 240, 500], MAST_N = ['Послушник', 'Адепт', 'Мастер', 'Магистр', 'Архонт', 'Владыка'];
function mastRank(p, el) { const v = (p.mast && p.mast[el]) || 0; let r = 0; while (r < 5 && v >= MAST_T[r + 1]) r++; return r; }
function mastGain(p, el, n) { if (!EL[el] || el === 'phys') return; p.mast = p.mast || {}; const b = mastRank(p, el); p.mast[el] = (p.mast[el] || 0) + n; const a = mastRank(p, el); if (a > b) { banner('СТИХИЯ «' + EL[el].n.toUpperCase() + '»: ' + MAST_N[a].toUpperCase(), 'Души этой стихии: урон +' + a * 6 + '%' + (a >= 3 ? ', перезарядка −10%' : ''), EL[el].c); Sfx.play('levelup'); } }
Bus.on('newReaction', () => { }); 
function castSlot(p, s, dx, dy, ax, ay) {
  const id = p.slots[s]; if (!id) return; const sl = p.sl[s];
  if (sl.ch <= 0) { Sfx.play('deny'); return; }
  const def = soulDef(id), stars = starsOf(p.souls[id]), ab = AB[def.ab], mr = ab.maxRange || 6, cost = manaCost(ab), mr0 = mastRank(p, def.el);
  if (p.mp < cost) { Sfx.play('deny'); if (!(p.noMpT > G.time)) { p.noMpT = G.time + 1; floatText(p.x, p.y, 'Нет маны', '#6a9aff', 6); } return; }
  p.mp -= cost; const tb = manaBonus(p); p.mpTrain = (p.mpTrain || 0) + cost * (p.mp < p.maxMp * .15 ? 2 : 1); if (manaBonus(p) > tb) { recalc(p); floatText(p.x, p.y, 'Запас маны вырос: ' + p.maxMp, '#6a9aff', 6); } mastGain(p, def.el, 1);
  let tx = ax, ty = ay; const d = dist(p.x, p.y, ax, ay); if (d > mr) { tx = p.x + (ax - p.x) / d * mr; ty = p.y + (ay - p.y) / d * mr; }
  castSoul(p, def, stars, dx, dy, tx, ty, 1 + (p.gs.soul + (p.gs.el[def.el] || 0) + (p.aEl === def.el ? 25 : 0) + mr0 * 6 + ((p.slv && p.slv[id]) | 0) * 8) / 100);
  sl.ch--; if (sl.cd <= 0) sl.cd = ab.cd * p.cdm * (p.rEl === def.el ? .8 : 1) * (mr0 >= 3 ? .9 : 1); p.swing = null; p.usedSoul = true;
}
const SWING = [{ dur: .24, at: .08, r: 1.6, cos: .2, k: 1, kb: 4 }, { dur: .24, at: .08, r: 1.6, cos: .2, k: 1.1, kb: 4 }, { dur: .4, at: .15, r: 2, cos: -.15, k: 1.9, kb: 12 }];
function swingHit(p, s) {
  const S = SWING[s.n - 1]; let any = false;
  if (p.style === 'ranged') { // дальний бой: вместо удара — выстрел сгустком душ, третий взрывается
    const crit = chance(p.crit), col = p.wEl ? EL[p.wEl].c : '#c9a0ff', big = s.n === 3;
    spawnProj({ kind: big ? 'ball' : 'arrow', x: p.x + s.dx * .5, y: p.y + s.dy * .5, vx: s.dx * 13, vy: s.dy * 13, r: big ? .45 : .3, life: .6, team: p.team, src: p, dmg: p.atk * S.k * .8 * rand(.9, 1.1) * (crit ? 1.6 : 1), el: p.wEl || undefined, color: col, kb: S.kb * .6, aoe: big ? 1.2 : 0 });
    Sfx.play('arrow'); return;
  }
  for (const e of G.ents) {
    if (e.dead || !hostile(p, e)) continue; const d = dist(p.x, p.y, e.x, e.y); if (d > S.r + e.r) continue;
    if (d > .4 && ((e.x - p.x) * s.dx + (e.y - p.y) * s.dy) / d < S.cos) continue;
    const crit = chance(p.crit); damage(e, p.atk * S.k * rand(.9, 1.1) * (crit ? 1.6 : 1), p, { kb: [s.dx * S.kb, s.dy * S.kb], crit, el: p.wEl || undefined }); any = true;
  }
  if (any) { if (s.n === 3) { G.hitstop = .06; shake(4); } else shake(1.5); }
}

function updatePlayer(p, dt, I) {
  if (p.dead) { p.respawn -= dt; if (p.respawn <= 0) respawnPlayer(p); return; }
  if (p.rollCd > 0) p.rollCd -= dt; if (p.potCd > 0) p.potCd -= dt; if (p.comboT > 0) p.comboT -= dt;
  for (let s = 0; s < 4; s++) {
    const id = p.slots[s], sl = p.sl[s]; if (!id) continue;
    const def = soulDef(id), mx = maxCharges(def, starsOf(p.souls[id]));
    if (sl.ch < mx) { sl.cd -= dt; if (sl.cd <= 0) { sl.ch++; sl.cd = sl.ch < mx ? AB[def.ab].cd * p.cdm * (p.rEl === def.el ? .8 : 1) : 0; } }
  }
  let a = norm(I.ax - p.x, I.ay - p.y); if (!a[0] && !a[1]) a = [p.dirx, p.diry];
  if (!p.swing && !p.roll && !p.dash) { p.dirx = a[0]; p.diry = a[1]; const f = a[0] - a[1]; if (Math.abs(f) > .15) p.face = f > 0 ? 1 : -1; }
  p.moving = false;
  if (p.roll) {
    moveEnt(p, p.roll.dx * 10.5 * dt, p.roll.dy * 10.5 * dt); p.roll.t -= dt; p.moving = true;
    if (chance(dt * 30)) part(p.x, p.y, 2, 0, 0, 10, .3, '#c8c0d8', 1, 0);
    if (p.roll.t <= 0) p.roll = null;
  } else if (!p.dash && !p.st.stun) {
    if (I.roll && p.rollCd <= 0 && !p.st.root) {
      const d = (I.mx || I.my) ? [I.mx, I.my] : a; p.roll = { dx: d[0], dy: d[1], t: .32, max: .32 }; p.inv = Math.max(p.inv, .34); p.rollCd = .75; p.swing = null; Sfx.play('roll'); p.rolled = true;
      const f = d[0] - d[1]; if (Math.abs(f) > .15) p.face = f > 0 ? 1 : -1;
    } else {
      for (let s = 0; s < 4; s++) if (I.cast[s]) castSlot(p, s, a[0], a[1], I.ax, I.ay);
      if (I.atk && !p.swing && !p.dash) {
        const n = p.comboT > 0 ? p.combo % 3 + 1 : 1; p.combo = n; p.swing = { n, t: 0, done: false, dx: a[0], dy: a[1] };
        p.kx += a[0] * (n === 3 ? 6 : 3); p.ky += a[1] * (n === 3 ? 6 : 3);
        if (p.style === 'ranged') { p.kx -= a[0] * (n === 3 ? 9 : 4.5); p.ky -= a[1] * (n === 3 ? 9 : 4.5); } else fxSlash(p.x, p.y, a[0], a[1], SWING[n - 1].r, n === 3 ? 2.6 : 1.7, p.wEl ? EL[p.wEl].c : n === 3 ? '#ffe9a0' : '#ffffff'); Sfx.play('swing'); p.attacked = true;
      }
      const sp = p.spd * (p.st.slow ? .5 : 1) * (p.swing ? .35 : 1) * (p.st.root ? 0 : 1);
      if ((I.mx || I.my) && sp > 0) { moveEnt(p, I.mx * sp * dt, I.my * sp * dt); p.moving = true; p.moved = (p.moved || 0) + dt; }
    }
  }
  if (p.swing) { const s = p.swing, S = SWING[s.n - 1]; s.t += dt; if (!s.done && s.t >= S.at) { s.done = true; swingHit(p, s); } if (s.t >= S.dur) { p.swing = null; p.comboT = .5; } }
  if (I.potion) usePotion(p);
  if (I.mpot && p.mpot > 0 && p.mp < p.maxMp) { p.mpot--; p.mp = Math.min(p.maxMp, p.mp + p.maxMp * .6); Sfx.play('potion'); burst(p.x, p.y, ['#6a9aff', '#ffffff'], 12, 3, { z: 10, grav: -20 }); } else if (I.mpot) Sfx.play('deny');
  if (I.scroll) { if (p.scrolls > 0 && !p.tp && !G.prologue && !(inTown(p))) { p.scrolls--; p.tp = { t: 2.5, hp: p.hp }; floatText(p.x, p.y, 'Свиток возврата...', '#c8a850', 6); Sfx.play('fuse'); } else Sfx.play('deny'); }
  if (p.tp) {
    p.tp.t -= dt; if (chance(dt * 40)) { const q = rand(TAU); part(p.x + Math.cos(q) * .8, p.y + Math.sin(q) * .8, 0, 0, 0, 50, .6, pick(['#c8a850', '#ffffff']), 1, -20, 1); }
    if (p.hp < p.tp.hp - 1) { p.tp = null; p.scrolls++; floatText(p.x, p.y, 'Возврат прерван', '#ff7a7a', 6); }
    else if (p.tp.t <= 0) { p.tp = null; Sfx.play('soul'); if (W.dun) { G.pendingLeave = true; G.tpAfter = true; } else { p.x = TOWN.x; p.y = TOWN.y + 1.6; G.cam.x = p.x; G.cam.y = p.y; fxRing(p.x, p.y, .3, 3, '#c8a850', .5); } }
  }
  if (p.buffT && G.time > p.buffT) { p.buffT = 0; recalc(p); floatText(p.x, p.y, 'Заточка сошла', '#c8c8d0', 6); }
  if (I.interact) { const n = nearInteract(p); if (n) Bus.emit('interact', p, n); }
  if (p.mp < p.maxMp) p.mp = Math.min(p.maxMp, p.mp + p.maxMp * (inTown(p) ? .2 : .05) * dt);
  if (inTown(p) && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .12 * dt);
}
function respawnPlayer(p) {
  p.mp = p.maxMp; p.dead = false; p.x = TOWN.x; p.y = TOWN.y + 1.6; p.hp = p.maxHp; p.st = {}; p.kx = p.ky = 0; p.inv = 2; p.shield = 0; p.swing = p.roll = p.dash = null;
  for (let s = 0; s < 4; s++) resetSlot(p, s);
  G.cam.x = p.x; G.cam.y = p.y; Bus.emit('respawn', p);
}
Bus.on('playerDeath', (p) => {
  p.respawn = 3.2; G.J.deaths++; Sfx.play('death'); shake(8);
  for (const e of G.ents) if (e.ai && e.target === p) e.target = null;
});
Bus.on('pickup', (p, k) => {
  if (k.kind === 'gold') { p.gold += k.v; floatNum(p.x, p.y, k.v, '#ffd870'); Sfx.play('coin'); }
  else if (k.kind === 'soul') giveSoul(p, k.v, 1);
  else if (k.kind === 'item') { const it = k.v; giveItem(p, it); floatText(p.x, p.y, it.name, RANKS[it.rank].c, 7); Sfx.play(it.rank >= 3 ? 'soul' : 'pickup'); if (it.rank >= 3) banner(RANKS[it.rank].n.toUpperCase() + ' ПРЕДМЕТ', it.name, RANKS[it.rank].c); setHint('gear', 'Предмет! Tab → «Снаряжение»: надень, сравни. Лишнее продай торговцу. Тень при смерти снимет с тебя лучшую вещь', 10); }
});
