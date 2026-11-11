// Реакции стихий. Работают для всех: игрока, мобов, Тени. Подключаются через RX.
const REACT = {
  discharge: { n: 'Разряд', d: 'Вода + молния: бьёт всех, кто мокрый или стоит в воде', c: '#ffe95a', els: ['water', 'storm'] },
  wildfire: { n: 'Пожар', d: 'Огонь + трава: высокая трава горит, огонь расползается сам', c: '#ff7a2a', els: ['fire', 'nature'] },
  firewhirl: { n: 'Огненный смерч', d: 'Ветер + огонь: вихрь, прошедший через огонь, загорается', c: '#ffb02e', els: ['wind', 'fire'] },
  steam: { n: 'Пар', d: 'Огонь + вода: облако пара, все внутри слепнут', c: '#e0e8f0', els: ['fire', 'water'] },
  explosion: { n: 'Взрыв', d: 'Яд + огонь: ядовитое облако взрывается', c: '#ff5a3a', els: ['poison', 'fire'] }
};
let rxCd = {}, dischT = -9;
Bus.on('start', () => { rxCd = {}; dischT = -9; });
function react(id, x, y) {
  const p = G.me; if (!p || dist(x, y, p.x, p.y) > 16) return;
  if (rxCd[id] !== undefined && G.time - rxCd[id] < 1.2) return; rxCd[id] = G.time;
  const R = REACT[id], first = !G.J.reactions[id]; G.J.reactions[id] = (G.J.reactions[id] || 0) + 1;
  floatText(x, y, R.n + '!', R.c, 8);
  if (first) { banner('НОВАЯ РЕАКЦИЯ: ' + R.n.toUpperCase(), R.d, R.c); Bus.emit('newReaction', id); }
}
const entInWater = e => !e.fly && isWaterTile(tIdx(e.x, e.y));
function discharge(x, y, src, amt) {
  if (G.time - dischT < .45) return false; dischT = G.time;
  const team = src ? src.team : 0, dmg = Math.max(8, amt * 1.3); let n = 0;
  for (const e of G.ents) {
    if (e.dead || dist(x, y, e.x, e.y) > 5.5 || !(e.st.wet || entInWater(e))) continue;
    fxBolt(x, y, e.x, e.y, '#ffe95a'); delete e.st.wet; n++;
    damage(e, dmg * (e.team === team ? .5 : 1), src, { noReact: 1, color: '#ffe95a' }); if (!e.dead) addSt(e, 'stun', .6);
  }
  for (let k = 0; k < 14; k++) { const tx = x + rand(-4, 4), ty = y + rand(-4, 4); if (tx > 1 && ty > 1 && tx < MW - 1 && ty < MH - 1 && isWaterTile(tIdx(tx, ty))) { burst(tx, ty, ['#ffe95a', '#ffffff'], 3, 2, { z: 2, glow: 1 }); if (chance(.4)) fxBolt(x, y, tx, ty, '#fff8b0', 4, 1); } }
  fxRing(x, y, .3, 5, '#ffe95a', .3); Sfx.play('zap'); shake(3); react('discharge', x, y); return true;
}
function explode(x, y, r, dmg, src) {
  const team = src ? src.team : 0;
  for (const e of G.ents) { if (e.dead) continue; const d = dist(x, y, e.x, e.y); if (d > r + e.r) continue; const n = norm(e.x - x, e.y - y); damage(e, dmg * (e.team === team ? .5 : 1), src, { noReact: 1, color: '#ff9a3a', kb: [n[0] * 14, n[1] * 14] }); if (!e.dead) addSt(e, 'burn', 2.5, Math.max(2, dmg * .15), src); }
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i, j) < r - .4 && chance(.7)) { const tx = x + i, ty = y + j; if (tx > 1 && ty > 1 && tx < MW - 1 && ty < MH - 1) ignite(tIdx(tx, ty), 1.5); }
  fxRing(x, y, .3, r, '#ffb02e', .35); fxRing(x, y, .2, r * .6, '#ffffff', .2); burst(x, y, ['#ffb02e', '#ff5a1a', '#fff3a0', '#a6e23c'], 34, 8, { glow: 1, up: 2 });
  Sfx.play('boom'); if (G.me && dist(x, y, G.me.x, G.me.y) < 12) { shake(8); G.hitstop = Math.max(G.hitstop, .05); } react('explosion', x, y);
}
function steam(x, y, src) {
  for (const z of G.zones) if (z.kind === 'steam' && dist(x, y, z.x, z.y) < 1.8) { z.life = Math.max(z.life, 4); return; }
  addZone({ kind: 'steam', x, y, r: 2.2, life: 5, tick: .4, team: 0, src }); Sfx.play('steam'); burst(x, y, '#e0e8f0', 14, 3, { grav: -10, size: 2 }); react('steam', x, y);
}
ZK.steam = {
  tick(z) {
    for (const e of G.ents) if (!e.dead && dist(z.x, z.y, e.x, e.y) < z.r + e.r) { addSt(e, 'blind', 1); delete e.st.burn; if (e.ai && e.st.blind && dist(e.x, e.y, e.target ? e.target.x : 1e9, e.target ? e.target.y : 1e9) > 1.8) e.target = null; }
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.hypot(i, j) < z.r) extinguish(tIdx(z.x + i, z.y + j));
  },
  update(z, dt) { if (chance(dt * 26)) { const a = rand(TAU), r = Math.sqrt(rand()) * z.r; part(z.x + Math.cos(a) * r, z.y + Math.sin(a) * r, rand(2, 16), rand(-.3, .3), rand(-.3, .3), rand(6, 14), rand(.7, 1.3), pick(['#e0e8f0', '#c0c8d8', '#ffffff']), 2, -3); } },
  draw(b, z) { isoEllipse(b, z.x, z.y, z.r, '#e0e8f0', .28 * clamp(z.life, 0, 1), '#ffffff'); },
  top(b, z) { const s = w2s(z.x, z.y); b.globalAlpha = .3 * clamp(z.life, 0, 1); b.fillStyle = '#e8eef8'; for (let i = 0; i < 6; i++) { const a = i * 1.05 + G.time * .4 + z.id; b.beginPath(); b.ellipse(s[0] + Math.cos(a) * z.r * 12, s[1] - 10 + Math.sin(a) * z.r * 5, 16, 9, 0, 0, TAU); b.fill(); } b.globalAlpha = 1; },
  topD: 1.5
};
function blowCloud(z, src) { if (z.blown) return; z.blown = true; z.life = 0; explode(z.x, z.y, z.r + .5, Math.max(14, (z.dmg || 3) * 6), src || z.src); }
const isFire = el => el === 'fire' || el === 'ash';

RX.hit = (t, el, src, amt) => {
  if (isFire(el)) {
    if (t.st.poison) { delete t.st.poison; explode(t.x, t.y, 1.7, Math.max(10, amt * 1.2), src); return true; }
    if (t.st.wet || entInWater(t)) { delete t.st.wet; steam(t.x, t.y, src); return true; }
  } else if (el === 'water') { if (t.st.burn) { delete t.st.burn; steam(t.x, t.y, src); } }
  else if (el === 'storm') { if (t.st.wet || entInWater(t)) { discharge(t.x, t.y, src, amt); return true; } }
  return false;
};
RX.tile = (x, y, el, src, o) => {
  if (x < 1 || y < 1 || x >= MW - 1 || y >= MH - 1) return; const i = tIdx(x, y); o = o || {};
  if (isFire(el)) {
    for (const z of G.zones) if ((z.kind === 'cloud' && z.el === 'poison' || z.kind === 'spore') && dist(x, y, z.x, z.y) < z.r) { blowCloud(z, src); return; }
    if (isWaterTile(i)) { if (!o.trail || chance(.35)) { steam(x, y, src); if (W.puddle[i] > 0) { W.puddle[i] = 0; W.puddles.delete(i); } } return; }
    const fl = flammable(i); if (ignite(i, o.force || 0) && fl) react('wildfire', x, y);
  } else if (el === 'water') { if (extinguish(i)) steam(x, y, src); addPuddle(i, o.dur || 10); }
  else if (el === 'storm') { if (isWaterTile(i)) discharge(x, y, src, o.dmg || 10); }
};
RX.mix = e => { delete e.st.burn; steam(e.x, e.y, null); };
RX.whirlFire = p => { p.el = 'fire'; p.dmg *= 1.6; p.color = EL.fire.c; Sfx.play('fire'); burst(p.x, p.y, ['#ffb02e', '#ff5a1a'], 16, 4, { glow: 1 }); react('firewhirl', p.x, p.y); };
RX.projTile = p => { if (!isFire(p.el)) return; for (const z of G.zones) if ((z.kind === 'cloud' && z.el === 'poison' || z.kind === 'spore') && dist(p.x, p.y, z.x, z.y) < z.r) { blowCloud(z, p.src); return; } };
RX.cloudCheck = z => {
  if (z.blown) return;
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i, j) < z.r && W.fire[tIdx(clamp(z.x + i, 1, MW - 2), clamp(z.y + j, 1, MH - 2))] > 0) { blowCloud(z); return; }
  for (const e of G.ents) if (!e.dead && e.st.burn && dist(e.x, e.y, z.x, z.y) < z.r) { blowCloud(z, e.st.burn.src); return; }
};
RX.explode = explode; RX.steam = steam;
