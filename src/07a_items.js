// Снаряжение: 4 слота, 5 рангов, случайные свойства. Предметы — простые данные, лежат в данных игрока (задел под сеть).
const ISLOTS = ['weapon', 'armor', 'amulet', 'ring'];
const ISLOT_N = { weapon: 'Оружие', armor: 'Броня', amulet: 'Амулет', ring: 'Кольцо' };
const RANKS = [{ n: 'Обычный', c: '#c8c8d0', aff: 0, m: 1 }, { n: 'Редкий', c: '#4aa8ff', aff: 1, m: 1.25 }, { n: 'Эпический', c: '#b04ad8', aff: 2, m: 1.55 }, { n: 'Легендарный', c: '#ffb02e', aff: 3, m: 1.9 }, { n: 'Проклятый', c: '#ff2a4a', aff: 4, m: 2.3 }];
const BAG_MAX = 24;
const AFF = {
  atk: { n: 'Урон', f: l => 1 + .6 * l, u: '', sx: 'ярости' }, hp: { n: 'Здоровье', f: l => 8 + 4 * l, u: '', sx: 'стойкости' },
  spd: { n: 'Скорость', f: () => 4, u: '%', sx: 'ветра' }, cdr: { n: 'Перезарядка душ −', f: () => 5, u: '%', sx: 'спешки' },
  crit: { n: 'Шанс крита', f: () => 4, u: '%', sx: 'меткости' }, soul: { n: 'Урон душ', f: l => 5 + .5 * l, u: '%', sx: 'пожирателя' }, pot: { n: 'Сила зелий', f: () => 12, u: '%', sx: 'лекаря' }
};
for (const el of ['fire', 'water', 'storm', 'wind', 'poison', 'nature', 'bone', 'beast']) AFF['el_' + el] = { n: 'Урон стихии «' + EL[el].n + '»', f: l => 8 + .8 * l, u: '%', sx: { fire: 'пламени', water: 'глубин', storm: 'грозы', wind: 'бури', poison: 'гнили', nature: 'терний', bone: 'костей', beast: 'зверя' }[el], el };
const INAMES = {
  weapon: ['Ржавый клинок', 'Охотничий тесак', 'Клинок сумерек', 'Жнец душ'], armor: ['Рваный плащ', 'Кожаный доспех', 'Кольчуга стража', 'Панцирь бездны'],
  amulet: ['Костяной оберег', 'Амулет шёпота', 'Око чащи', 'Сердце пепла'], ring: ['Медное кольцо', 'Кольцо охотника', 'Перстень теней', 'Печать пожирателя']
};
let itemUid = 1;
function rollRank(w) { let r = rand(w.reduce((a, c) => a + c, 0)); for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; } return 0; }
function makeItem(lvl, rank, slot) {
  slot = slot || pick(ISLOTS); const R = RANKS[rank], m = R.m; lvl = clamp(lvl | 0, 1, 12);
  const base = slot === 'weapon' ? ['atk', Math.round((3 + 1.5 * lvl) * m)] : slot === 'armor' ? ['hp', Math.round((15 + 8 * lvl) * m)] : slot === 'amulet' ? ['soul', Math.round((6 + .8 * lvl) * m)] : ['crit', Math.round((3 + .3 * lvl) * m)];
  const keys = Object.keys(AFF).filter(k => k !== base[0]), aff = [];
  for (let i = 0; i < R.aff; i++) { const k = keys.splice(Math.floor(rand(keys.length)), 1)[0]; aff.push([k, Math.max(1, Math.round(AFF[k].f(lvl) * rand(.8, 1.2) * Math.pow(m, .6)))]); }
  const nm = INAMES[slot][clamp(Math.floor((lvl - 1) / 3), 0, 3)] + (aff.length ? ' ' + AFF[aff[0][0]].sx : '');
  return { uid: Date.now().toString(36) + (itemUid++), slot, rank, lvl, base, aff, name: nm, curse: rank === 4 };
}
function itemLines(it) {
  const L = ['<b>' + AFF[it.base[0]].n + ' +' + it.base[1] + AFF[it.base[0]].u + '</b>'];
  for (const a of it.aff) L.push(AFF[a[0]].n + (a[0] === 'cdr' ? '' : ' +') + a[1] + AFF[a[0]].u);
  if (it.curse) L.push('<span class="bad">Проклятие: −8% здоровья</span>');
  return L;
}
const itemPrice = it => Math.round((4 + 2 * it.lvl) * (it.rank + 1) * (it.rank + 1) * .5);
const itemScore = it => it.rank * 100 + it.lvl;
function itemIcon(it) { return makeIcon('it_' + it.slot + it.rank, 'i_' + it.slot, RANKS[it.rank].c); }
// Суммарные бонусы надетого
function gearStats(list) {
  const s = { atk: 0, hp: 0, spd: 0, cdr: 0, crit: 0, soul: 0, pot: 0, el: {}, curse: 0 };
  for (const it of list) { if (!it) continue; for (const a of [it.base].concat(it.aff)) { const d = AFF[a[0]]; if (d.el) s.el[d.el] = (s.el[d.el] || 0) + a[1]; else s[a[0]] += a[1]; } if (it.curse) s.curse++; }
  return s;
}
function equipItem(p, it) { const i = p.bag.indexOf(it); if (i < 0) return; p.bag.splice(i, 1); const old = p.equip[it.slot]; p.equip[it.slot] = it; if (old) p.bag.push(old); recalc(p); Sfx.play('pickup'); }
function unequipItem(p, slot) { const it = p.equip[slot]; if (!it || p.bag.length >= BAG_MAX) return; p.equip[slot] = null; p.bag.push(it); recalc(p); }
function giveItem(p, it) { if (!p.equip[it.slot]) { p.equip[it.slot] = it; recalc(p); } else p.bag.push(it); }
function dropItem(x, y, it, owner) { const a = rand(TAU); G.pickups.push({ kind: 'item', x, y, v: it, age: 0, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, owner: owner ? owner.id : 0 }); }
// Дроп с мобов: ранг зависит от того, кого убил
const DROP = { mob: [.09, [70, 24, 5, 1, 0]], elite: [.6, [30, 45, 20, 5, 0]], chief: [1, [0, 45, 38, 12, 5]], boss: [1, [0, 0, 50, 35, 15]] };
Bus.on('mobDeath', (m) => {
  if (m.owner || m.type === 'spirit' || m.isNemesis || m.summoned) return; const p = m.lastHitBy || G.me; if (!p || dist(p.x, p.y, m.x, m.y) > 22) return;
  const D = DROP[m.boss ? 'boss' : m.chief ? 'chief' : m.elite ? 'elite' : 'mob'];
  for (let i = 0, n = m.boss ? 2 : 1; i < n; i++) if (chance(D[0])) dropItem(m.x, m.y, makeItem(m.lvl, rollRank(D[1])), p);
});
