// HUD: HP, опыт, золото, зелья, слоты душ, миникарта, полоса босса, баннеры и подсказки
let zoneShown = '', zoneT = 0, hint = null;
function setHint(id, s, dur) { if (G.J.hints[id]) return; G.J.hints[id] = 1; hint = { s, t: dur || 7 }; }
function bar(b, x, y, w, h, f, col, bg) { b.fillStyle = '#0b0810'; b.fillRect(x - 1, y - 1, w + 2, h + 2); b.fillStyle = bg || '#2a2030'; b.fillRect(x, y, w, h); b.fillStyle = col; b.fillRect(x, y, Math.round(w * clamp(f, 0, 1)), h); }
function mmPos(cx, cy, p, x, y, lim) { let mx = (x - p.x) - (y - p.y), my = ((x - p.x) + (y - p.y)) * .5; const k = Math.max(Math.abs(mx) / lim, Math.abs(my) / lim); if (k > 1) { mx /= k; my /= k; } return [Math.round(cx + mx), Math.round(cy + my), k > 1]; }
function drawHud(b) {
  const p = G.me; if (!p || !G.started) return; const dtf = 1 / 60;
  // слепота (Пар): темнеет обзор
  if (p.st.blind && !p.dead) { const g = b.createRadialGradient(V.w / 2, V.h / 2, 22, V.w / 2, V.h / 2, 90); g.addColorStop(0, 'rgba(210,210,220,0)'); g.addColorStop(1, 'rgba(210,210,220,.93)'); b.fillStyle = g; b.fillRect(0, 0, V.w, V.h); }
  if (p.hp < p.maxHp * .3 && !p.dead) { b.globalAlpha = .12 + .1 * Math.sin(G.time * 7); b.fillStyle = '#ff2020'; b.fillRect(0, 0, V.w, 5); b.fillRect(0, V.h - 5, V.w, 5); b.fillRect(0, 0, 5, V.h); b.fillRect(V.w - 5, 0, 5, V.h); b.globalAlpha = 1; }
  // левый верх
  b.globalAlpha = .6; b.fillStyle = '#0b0810'; b.fillRect(2, 2, 96, 37); b.globalAlpha = 1;
  txt(p.name, 5, 3, '#fff', 6); txt('Ур. ' + p.lvl, 95, 3, '#ffd870', 6, 'right');
  bar(b, 5, 13, 90, 6, p.hp / p.maxHp, p.hp < p.maxHp * .3 ? '#ff4a4a' : '#d83a4a');
  if (p.shield > 0) { b.fillStyle = '#6fe0b0'; b.fillRect(5, 13, Math.round(90 * clamp(p.shield / (p.shieldMax || 1), 0, 1)), 2); }
  txt(Math.ceil(p.hp) + ' / ' + p.maxHp, 50, 12.5, '#fff', 5, 'center');
  bar(b, 5, 22, 90, 2, p.lvl >= MAXLVL ? 1 : p.xp / xpNext(p.lvl), '#8a6aff');
  b.fillStyle = '#8a5a10'; b.fillRect(5, 28, 6, 6); b.fillStyle = '#ffd870'; b.fillRect(6, 28, 4, 6); b.fillRect(5, 29, 6, 4); txt(String(p.gold), 13, 27, '#ffd870', 6);
  drawGlyph(b, 'potion', 54, 31, '#ff6a7a'); txt('×' + p.potions, 60, 27, '#fff', 6);
  if (!V.touch) txt('Q', 80, 28, '#9a8ab0', 5);
  // слоты душ (на ПК — снизу по центру; на телефоне это кнопки справа)
  if (!V.touch) {
    const x0 = Math.round(V.w / 2 - 44);
    for (let s = 0; s < 4; s++) { const x = x0 + s * 23, y = V.h - 25; b.globalAlpha = .7; b.fillStyle = '#0b0810'; b.fillRect(x - 2, y - 2, 20, 23); b.globalAlpha = 1; b.fillStyle = '#3a2a5a'; b.fillRect(x - 1, y - 1, 18, 18); b.fillStyle = '#120c1c'; b.fillRect(x, y, 16, 16); drawSlotIcon(b, p, s, x, y); txt(String(s + 1), x - 1, y - 8, '#c9a0ff', 5); }
  }
  // миникарта
  const ms = 58, mx = V.w - ms - 4, my = 4, cx = mx + ms / 2, cy = my + ms / 2;
  if (W.mapDirty) renderMap();
  b.fillStyle = '#0b0810'; b.fillRect(mx - 2, my - 2, ms + 4, ms + 4); b.fillStyle = '#6a4a9a'; b.fillRect(mx - 1, my - 1, ms + 2, ms + 2); b.fillStyle = '#120c1c'; b.fillRect(mx, my, ms, ms);
  b.save(); b.beginPath(); b.rect(mx, my, ms, ms); b.clip(); b.imageSmoothingEnabled = false; b.transform(1, .5, -1, .5, cx, cy); b.drawImage(W.map, -p.x, -p.y); b.restore();
  const mk = (x, y, c, s, blink) => { const q = mmPos(cx, cy, p, x, y, ms / 2 - 3); if (blink && Math.floor(G.time * 4) % 2) return; b.fillStyle = '#0b0810'; b.fillRect(q[0] - s, q[1] - s, s * 2 + 1, s * 2 + 1); b.fillStyle = c; b.fillRect(q[0] - s + 1, q[1] - s + 1, s * 2 - 1, s * 2 - 1); };
  for (const e of G.ents) if (e.ai && !e.dead && !e.boss && !e.isNemesis && e.team !== p.team && dist(e.x, e.y, p.x, p.y) < 22) { const q = mmPos(cx, cy, p, e.x, e.y, ms / 2 - 2); if (!q[2]) { b.fillStyle = '#ff5a5a'; b.fillRect(q[0], q[1], 1, 1); } }
  if (!W.dun) { mk(TOWN.x, TOWN.y, '#c9a0ff', 2); if (W.seen[tIdx(LAIR.x, LAIR.y)]) mk(LAIR.x, LAIR.y, '#ff7a1a', 2); } else mk(W.start[0] - 3, W.start[1] - 3, '#b04ad8', 2);
  for (const c of W.crypts) if (W.seen[tIdx(c.x, c.y)]) mk(c.x, c.y, '#b04ad8', 2);
  for (const c of W.camps) if (!c.cleared && W.seen[tIdx(c.x, c.y)] && dist(c.x, c.y, p.x, p.y) < 40) mk(c.x, c.y, '#c82a3a', 1);
  if (G.nemesis && !G.nemesis.dead && !W.dun) mk(G.nemesis.x, G.nemesis.y, '#ff2a4a', 2, true);
  b.fillStyle = '#fff'; b.fillRect(cx - 1, cy - 1, 3, 3);
  const z = zoneAt(p.x, p.y); if (z !== zoneShown) { zoneShown = z; zoneT = 4; }
  const zn = W.dun ? W.dun.name : ZNAME[z], zl = W.dun ? 'подземелье · ур. ' + W.dun.lvl : ZLVL[z];
  txt(zn, V.w - 4, my + ms + 3, '#d8d0e0', 5, 'right');
  if (zoneT > 0) { zoneT -= dtf; const a = clamp(zoneT, 0, 1) * clamp((4 - zoneT) * 2, 0, 1); txt(zn, V.w / 2, 30, '#fff', 11, 'center', a); if (zl) txt(zl, V.w / 2, 44, '#ffd870', 6, 'center', a); }
  // босс
  const boss = activeBoss();
  if (boss && boss.target) { const w = Math.min(170, V.w - 150), x = Math.round(V.w / 2 - w / 2); bar(b, x, 14, w, 5, boss.hp / boss.maxHp, boss.enraged ? '#ff5a1a' : '#c82a3a'); b.fillStyle = '#ffd870'; b.fillRect(x + Math.round(w / 2), 13, 1, 7); txt(boss.name + (boss.enraged ? ' — ЯРОСТЬ' : ''), V.w / 2, 4, '#ffb090', 6.5, 'center'); }
  // баннер
  const B = G.banner; if (B) { const a = clamp(B.t * 2, 0, 1) * clamp((B.max - B.t) * 4, 0, 1), y = Math.round(V.h * .24); b.globalAlpha = .55 * a; b.fillStyle = '#0b0810'; b.fillRect(0, y - 4, V.w, 34); b.globalAlpha = a; b.fillStyle = B.color; b.fillRect(0, y - 4, V.w, 1); b.fillRect(0, y + 29, V.w, 1); b.globalAlpha = 1; txt(B.title, V.w / 2, y, B.color, 12, 'center', a); txt(B.sub, V.w / 2, y + 17, '#fff', 6.5, 'center', a); }
  // подсказки новичку
  if (!hint && !p.dead) {
    const H = G.J.hints;
    if (!H.move) setHint('move', V.touch ? 'Джойстик слева — движение. Кнопка с мечом — удар (комбо из 3)' : 'WASD — движение. ЛКМ — удар (комбо из 3 ударов)', 9);
    else if (!H.roll && p.moved > 2.5) setHint('roll', V.touch ? 'Кнопка-круг — перекат с неуязвимостью. Красные зоны — уворачивайся!' : 'ПРОБЕЛ — перекат с неуязвимостью. Красные зоны — уворачивайся!', 8);
    else if (!H.soul && H.roll && p.moved > 7) setHint('soul', V.touch ? 'Кнопки с иконками — твои души. Сейчас у тебя душа волка: рывок' : 'Клавиши 1–4 — души. Сейчас у тебя душа волка: рывок (1)', 8);
    else if (!H.drop && H.soul && !inTown(p)) setHint('drop', 'С мобов падают души — их способности. Дубликаты усиливают душу: ★2 за 3 копии, ★3 за 6', 9);
    else if (!H.potion && p.hp < p.maxHp * .45 && p.potions > 0) setHint('potion', V.touch ? 'Мало здоровья! Кнопка с зельем лечит' : 'Мало здоровья! Q — выпить зелье', 6);
    else if (!H.dark && H.drop && p.moved > 20) setHint('dark', 'Лес не прощает. Карта открывается только там, где ты прошёл. Красные тотемы — лагеря врагов с вожаком', 10);
    else if (!H.altar && Object.keys(p.souls).length >= 2) setHint('altar', 'Две души! На Алтаре в городе их можно слить в химеру. Рецепты скрыты — экспериментируй', 10);
    else if (!H.react && Object.keys(p.souls).length >= 3) setHint('react', 'Стихии вступают в реакции: огонь жжёт траву, молния бьёт по мокрым, огонь взрывает яд...', 10);
  }
  if (hint) { hint.t -= dtf; const a = clamp(hint.t, 0, 1), y = V.h - (V.touch ? 16 : 44), w = Math.min(V.w - 8, hint.s.length * 3.3 + 12); b.globalAlpha = .7 * a; b.fillStyle = '#0b0810'; b.fillRect(Math.round(V.w / 2 - w / 2), y - 2, Math.round(w), 11); b.globalAlpha = 1; txt(hint.s, V.w / 2, y, '#ffe9a0', 5.5, 'center', a); if (hint.t <= 0) hint = null; }
  // «E — использовать»
  const n = !p.dead && nearInteract(p); if (n) { const s = w2s(p.x, p.y); txt((V.touch ? '' : 'E — ') + n.label, s[0], s[1] - 36, '#ffd870', 6.5, 'center'); }
  if (p.dead) { b.globalAlpha = .6; b.fillStyle = '#1a0408'; b.fillRect(0, 0, V.w, V.h); b.globalAlpha = 1; txt('ТЫ ПОГИБ', V.w / 2, V.h / 2 - 22, '#ff4a5a', 16, 'center'); txt(G.deathMsg || 'Возрождение в городе...', V.w / 2, V.h / 2 + 2, '#fff', 7, 'center'); if (G.deathMsg2) txt(G.deathMsg2, V.w / 2, V.h / 2 + 14, '#ffb0b8', 6, 'center'); }
}
G.hud.push(drawHud);
