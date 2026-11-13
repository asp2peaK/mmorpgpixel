// Вступление: тысячу лет назад. Герой на пике силы идёт за душой Хранителя — и проигрывает. Потом просыпается у камня без памяти.
const NARR = 'Шёпот';
function genArena() {
  const n = MW * MH, cx = 110, cy = 85, R = 11.5;
  const D = { g: new Uint8Array(n).fill(T.GRASS), g0: new Uint8Array(n), o: new Uint8Array(n).fill(O.TREE), o0: new Uint8Array(n), zi: new Uint8Array(n), fire: new Float32Array(n), puddle: new Float32Array(n), regrow: new Float32Array(n), burning: new Set(), puddles: new Set(), regrowing: new Set(), spawns: [], camps: [], crypts: [], seen: new Uint8Array(n), revT: 0, map: mkCanvas(MW, MH), mapDirty: true, tick: 0, dun: { id: 'prologue', name: 'Сердце леса', lvl: 10, pro: true, dark: .2 }, traps: [], trap: new Uint8Array(n), rooms: [], trapT: 0, start: [cx - 7, cy], pop: [] };
  for (let y = cy - 14; y <= cy + 14; y++) for (let x = cx - 14; x <= cx + 14; x++) {
    const d = Math.hypot(x + .5 - cx, y + .5 - cy), k = y * MW + x; if (d > R + (hash2(x, y, 5) - .5) * 1.6) continue;
    D.o[k] = 0; D.g[k] = d < 2.2 ? T.PLAZA : fbm(x * .2, y * .2, 77) > .52 ? T.TALL : T.GRASS; if (d > 5 && hash2(x, y, 9) > .975) D.o[k] = O.ROCK;
  }
  D.o[cy * MW + cx] = O.ALTAR; D.g0.set(D.g); D.o0.set(D.o); return D;
}
function startPrologue() {
  const p = G.me;
  G.over = { W, ents: G.ents.filter(e => !e.isPlayer), zones: [], projs: [], pickups: [], px: TOWN.x, py: TOWN.y + 1.6 };
  G.ents = G.players.slice(); G.zones = []; G.projs = []; G.pickups = []; W = genArena(); p.x = W.start[0]; p.y = W.start[1];
  // герой на пике силы
  p.lvl = 10; p.souls = { ch_blazedash: 6, imp: 6, ch_pack: 6, stormmother: 6 }; p.slots = ['ch_blazedash', 'imp', 'ch_pack', 'stormmother'];
  for (const s of ISLOTS) { const it = makeItem(10, 3, s); it.plus = 7; p.equip[s] = it; } p.equip.weapon.ench = 'imp'; p.equip.armor.ench = 'imp';
  p.mpTrain = 40000; p.potions = POTION_MAX; recalc(p); p.hp = p.maxHp; p.mp = p.maxMp; for (let i = 0; i < 4; i++) resetSlot(p, i);
  const b = mkMob('guardian', 116, 85, 10); b.leash = 40; b.hx = 110; b.hy = 85; G.prologue = { t: 0, ph: 0, boss: b, said: 0 };
  G.cam.x = p.x; G.cam.y = p.y; G.dark = undefined;
  Menus.openDialog({ name: NARR, spr: 'hero', lines: ['Тысячу лет назад. Сердце Шепчущего леса.', 'Ты — Пожиратель. Сильнейший из всех, кто когда-либо ел души. В тебе их сотни, и каждая даёт тебе силу.', 'Осталась одна, которую ты ещё не пробовал. Душа Хранителя. Того, кто старше самого леса.', 'Говорят, его нельзя победить. Говорят, эту душу нельзя есть. Тебе всё равно. Ты голоден.'], last: 'В бой', end() { banner('СЕРДЦЕ ЛЕСА', 'Тысячу лет назад · ты на пике силы — используй всё: ЛКМ, Пробел, 1–4', '#ffe9a0'); b.target = p; b.state = 'chase'; Sfx.play('howl'); } });
}
function resetHero(p) {
  const h = G.J.hints || {}; G.J = newJournal(); G.J.hints = h; G.J.prologue = 1; delete G.J.hints.soul; delete G.J.hints.drop;
  p.lvl = 1; p.xp = 0; p.gold = 0; p.potions = 2; p.ess = 0; p.slv = {}; p.mpot = 1; p.scrolls = 0; p.souls = {}; p.slots = [null, null, null, null]; p.bag = []; p.shards = 0; p.mpTrain = 0; p.mast = {};
  for (const s of ISLOTS) p.equip[s] = null; recalc(p); giveSoul(p, 'wolf', 1, true); p.hp = p.maxHp; p.mp = p.maxMp; for (let i = 0; i < 4; i++) resetSlot(p, i);
}
const GUARD_SAY = [[2, 'Ты пришёл за последней душой.'], [11, 'Сотни голосов кричат в тебе. Ты их ещё слышишь?'], [21, 'Этот лес старше твоего голода.'], [32, 'Бей. Жги. Это ничего не изменит.']];
G.systems.push(dt => {
  const P = G.prologue; if (!P || !W.dun || !W.dun.pro) return; const b = P.boss, p = G.me; if (p.dead || b.dead) return;
  P.t += dt;
  if (P.said < GUARD_SAY.length && P.t > GUARD_SAY[P.said][0] && P.ph === 0) { b.sayS = GUARD_SAY[P.said][1]; b.sayT = 4; P.said++; }
  if (P.ph === 0 && (b.hp < b.maxHp * .6 || P.t > 50 || p.hp < p.maxHp * .12)) {
    P.ph = 1; P.jt = 3.2; b.inv = 99; b.wu = null; b.dash = null; b.state = 'recover'; b.stT = 99; b.sayS = 'ДОВОЛЬНО.'; b.sayT = 4;
    banner('СУД ЛЕСА', 'От этого не увернуться', '#ffffff'); Sfx.play('howl'); shake(8);
    addZone({ kind: 'blast', x: b.x, y: b.y, r: 15, life: 3.2, max: 3.2, team: b.team, src: b, dmg: 0, el: 'storm' });
  }
  if (P.ph === 1) {
    P.jt -= dt; shake(1.5 + (3.2 - P.jt)); if (chance(dt * 40)) { const a = rand(TAU), r = rand(2, 12); part(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, 0, 0, 0, rand(40, 90), .8, pick(['#ffffff', '#fff3a0', '#a8f0ff']), 2, -20, 1); }
    if (P.jt <= 0) { P.ph = 2; p.inv = 0; p.shield = 0; for (let i = 0; i < 6; i++) fxRing(b.x, b.y, .5, 4 + i * 2.5, '#ffffff', .5 + i * .12); for (let i = 0; i < 10; i++) fxBolt(b.x, b.y, p.x + rand(-3, 3), p.y + rand(-3, 3), '#ffffff', 30, 0); Sfx.play('boom'); Sfx.play('zap'); shake(14); damage(p, 1e9, b, { dot: 1 }); }
  }
});
Bus.on('playerDeath', () => { if (!G.prologue) return; G.deathMsg = 'Хранитель сжёг тебя дотла'; G.deathMsg2 = 'Но ты успел откусить от его души...'; });
Bus.on('respawn', (p) => {
  if (!G.prologue) return; G.prologue = null; resetHero(p); G.dark = undefined;
  Menus.openDialog({ name: NARR, spr: 'hero', lines: ['...', 'Холодно. Камень под спиной. Чужие голоса где-то рядом.', 'Камень возвращает мёртвых. Но не возвращает память. И не возвращает силу.', 'Ты не помнишь, кто ты. Не помнишь, что сделал. В тебе осталась одна-единственная душа — волчья.', 'А лес вокруг пахнет пеплом.'], last: 'Открыть глаза', end() { banner('ПОСЛЕДНИЙ ОЧАГ', 'Тысячу лет спустя · поговори со Старейшиной', '#c8a850'); if (typeof saveGame === 'function') saveGame(); } });
});
