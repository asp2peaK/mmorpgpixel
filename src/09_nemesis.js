// Немезида: труп игрока встаёт элитной «Тенью», дерётся ЕГО душами и держит 20% его золота
const NEM_SAY = {
  aggro: ['Твои души теперь мои.', 'Я — это ты. Только лучше.', 'Соскучился по своему золоту?', 'Опять пришёл умирать?', 'Узнаёшь свой билд?'],
  kill: ['Слабак. Я становлюсь сильнее.', 'Спасибо за новые души.', 'И это всё?'],
  low: ['Нет... это МОИ души!', 'Ты не можешь победить себя!'],
  die: ['Я... ещё... вернусь...']
};
// Тень снимает с игрока самую ценную надетую вещь
function nemSteal(p, d) { let best = null; for (const s of ISLOTS) { const it = p.equip[s]; if (it && (!best || itemScore(it) > itemScore(best))) best = it; } if (!best) return ''; p.equip[best.slot] = null; d.items = d.items || []; d.items.push(best); recalc(p); p.hp = Math.min(p.hp, p.maxHp); return best.name; }
const nemSouls = p => p.slots.filter(Boolean).map(id => ({ id, stars: starsOf(p.souls[id]) }));
function nemSay(m, kind) { m.sayS = pick(NEM_SAY[kind]); m.sayT = 3.2; }
function spawnNemesis(d) {
  let x = d.x, y = d.y; if (blocked(x, y)) for (let r = 1; r < 6 && blocked(x, y); r++) for (let a = 0; a < 8; a++) { const tx = d.x + Math.cos(a * .785) * r, ty = d.y + Math.sin(a * .785) * r; if (!blocked(tx, ty)) { x = tx; y = ty; break; } }
  const m = mkMob('nemesis', x, y, d.lvl, { isNemesis: true, nd: d });
  m.name = 'Тень ' + d.name + (d.tier > 1 ? ' ×' + d.tier : '');
  m.maxHp = m.hp = Math.round((100 + 22 * (d.lvl - 1)) * 2.2 * (1 + .3 * (d.tier - 1)));
  d.items = d.items || []; const gs = gearStats(d.items);
  m.maxHp = m.hp = m.maxHp + gs.hp * 3; m.atk = ((10 + 3 * (d.lvl - 1)) * .7 + gs.atk * .7) * (1 + .15 * (d.tier - 1)) * (1 + (gs.soul + gs.crit) / 200);
  m.abils = [{ ab: 'bite', el: 'phys', mult: 1.1, stars: 1, cd: 1, cdm: .8 }].concat(d.souls.map(s => { const f = soulDef(s.id); return { ab: f.ab, el: f.el, mult: (f.mult || 1) * (1 + .25 * (s.stars - 1)) * .85, stars: s.stars, cd: rand(1.5, 4), cdm: 1.5 }; }));
  m.onUpdate = (n) => { if (!n.saidLow && n.hp < n.maxHp * .3) { n.saidLow = true; nemSay(n, 'low'); } if (chance(.02)) part(n.x + rand(-.3, .3), n.y + rand(-.3, .3), rand(2, 16), 0, 0, 12, .7, pick(['#2a1a3a', '#8a1a2a']), 2, -4); };
  G.nemesis = m; return m;
}
Bus.on('aggro', (m) => { if (m.isNemesis && !(m.sayT > 0)) nemSay(m, 'aggro'); });
Bus.on('playerDeath', (p, src) => {
  if (G.prologue) return;
  const killer = ownerOf(src), n = G.nemesis && !G.nemesis.dead ? G.nemesis : null;
  G.deathMsg = 'Возрождение в городе...'; G.deathMsg2 = '';
  if (n) {
    if (killer !== n) { G.deathMsg2 = n.name + ' всё ещё ждёт тебя'; return; }
    // Тень убила снова — растёт и забирает новый билд
    const d = n.nd, steal = Math.floor(p.gold * .2); p.gold -= steal;
    d.tier++; d.lvl++; d.gold += steal; d.souls = nemSouls(p); d.x = n.x; d.y = n.y; const took = nemSteal(p, d);
    n.dead = true; const m = spawnNemesis(d); nemSay(m, 'kill'); fxRing(m.x, m.y, .3, 3, '#ff2a4a', .6);
    G.deathMsg2 = m.name + ' стала сильнее и забрала ещё ' + steal + ' золота' + (took ? ' и «' + took + '»' : '');
  } else {
    if (inTown(p)) return;
    const steal = Math.floor(p.gold * .2); p.gold -= steal;
    const nd0 = { x: p.x, y: p.y, lvl: p.lvl + 1, tier: 1, gold: steal, souls: nemSouls(p), name: p.name, items: [] }, took = nemSteal(p, nd0);
    const m = spawnNemesis(nd0);
    burst(m.x, m.y, ['#2a1a3a', '#8a1a2a', '#ff2a4a'], 30, 5, { z: 10 }); nemSay(m, 'aggro');
    G.deathMsg2 = 'На месте гибели встала ' + m.name + ' и забрала ' + steal + ' золота' + (took ? ' и «' + took + '»' : '');
    G.J.hints.nem = 0;
  }
});
Bus.on('respawn', (p) => { if (G.nemesis && !G.nemesis.dead && !G.J.hints.nem) setHint('nem', 'Твоя Тень отмечена красным на миникарте. Убей её — вернёшь золото и получишь копии её душ', 10); });
Bus.on('nemesisDeath', (m, p) => {
  const d = m.nd, gold = d.gold + 25 * d.lvl; p.gold += gold; gainXp(p, 60 * d.lvl); G.J.nemKills++; G.nemesis = null;
  for (const it of (d.items || [])) { giveItem(p, it); floatText(p.x, p.y, 'Возвращено: ' + it.name, RANKS[it.rank].c, 6); }
  dropItem(m.x, m.y, makeItem(Math.min(10, d.lvl), rollRank([0, 30, 40, 20, 10 + 5 * d.tier])), p);
  const names = []; for (const s of d.souls) { giveSoul(p, s.id, 1, true); names.push(soulDef(s.id).abName); }
  floatText(m.x, m.y, '«' + NEM_SAY.die[0] + '»', '#ffb0b8', 7); floatNum(p.x, p.y, gold, '#ffd870');
  banner('ТЕНЬ ПОВЕРЖЕНА', '+' + gold + ' золота' + (names.length ? ', копии душ: ' + names.join(', ') : ''), '#ff5a6a'); Sfx.play('soul'); shake(8);
  for (let i = 0; i < 3; i++) fxRing(m.x, m.y, .3, 3 + i * 1.5, '#ff2a4a', .4 + i * .15);
});
