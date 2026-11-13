// Весь пиксель-арт генерируется в коде: ASCII-спрайты с палитрой + процедурные тайлы
const SPR = {};
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function silhouette(c, color) { const o = mkCanvas(c.width, c.height), x = o.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return o; }
function outlineCanvas(c, color) {
  const o = mkCanvas(c.width + 2, c.height + 2), x = o.getContext('2d'), s = silhouette(c, color || '#120c18');
  x.drawImage(s, 0, 1); x.drawImage(s, 2, 1); x.drawImage(s, 1, 0); x.drawImage(s, 1, 2); x.drawImage(c, 1, 1); return o;
}
function ascii(rows, pal, noOutline) {
  const h = rows.length, w = Math.max.apply(null, rows.map(r => r.length)), c = mkCanvas(w, h), x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < rows[j].length; i++) { const col = pal[rows[j][i]]; if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } }
  return noOutline ? c : outlineCanvas(c);
}
function scaled(c, k) { const o = mkCanvas(c.width * k, c.height * k), x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, o.width, o.height); return o; }
function reg(n, c) { return SPR[n] = { c, w: c.width, h: c.height, white: silhouette(c, '#fff') }; }
// Рисует спрайт с якорем «ноги по центру снизу»
function drawSpr(ctx, n, sx, sy, flip, white, sc) {
  const s = SPR[n]; if (!s) return; const img = white ? s.white : s.c;
  if (flip || sc) { ctx.save(); ctx.translate(sx, sy); ctx.scale((flip ? -1 : 1) * (sc ? sc[0] : 1), sc ? sc[1] : 1); ctx.drawImage(img, -(s.w >> 1), -s.h); ctx.restore(); }
  else ctx.drawImage(img, sx - (s.w >> 1), sy - s.h);
}

// ---------- Персонажи ----------
const HERO_TOP = [
  '....hhhh....',
  '...hhhhhh...',
  '..hhHHHHhh..',
  '..hHssssHh..',
  '..hsesseHh..',
  '..hHssssHh..',
  '...hmmmmh...',
  '..cCccccCc..',
  '.cCccbbccCc.',
  '.sCccccccCs.',
  '.sCccccccCs.',
  '..CccccccC..'];
const HERO_LEGS = {
  i: ['..ccc..ccc..', '..ppp..ppp..', '..ppp..ppp..', '..BBB..BBB..'],
  w1: ['..ccc..ccc..', '.ppp....ppp.', '.ppp....ppp.', '.BBB....BBB.'],
  w2: ['..ccc..ccc..', '...ppp.ppp..', '...pp...pp..', '...BB...BB..']
};
function regHumanoid(name, pal) { for (const k in HERO_LEGS) reg(name + '_' + k, ascii(HERO_TOP.concat(HERO_LEGS[k]), pal)); }
// Внешность героя: выбирается при создании персонажа
const LOOKS = {
  cloak: [['Пепел', '#4a4658', '#2e2c3a'], ['Кровь', '#8a2a34', '#5a1a22'], ['Сумрак', '#5a3a9a', '#3a2466'], ['Мох', '#3a6a44', '#244a2e'], ['Бездна', '#2a3a6a', '#18244a'], ['Кость', '#b8b0a0', '#8a8474']],
  skin: [['Бледная', '#e8d0c0'], ['Светлая', '#f0c8a0'], ['Смуглая', '#b88860'], ['Тёмная', '#6a4630'], ['Мертвенная', '#a8b8b0']],
  eyes: [['Лёд', '#8ff0ff'], ['Янтарь', '#ffc84a'], ['Яд', '#a6e23c'], ['Кровь', '#ff4a4a'], ['Пустота', '#e8e0ff']],
  scarf: [['Багровый', '#8a2a3a'], ['Ржавый', '#a85a2a'], ['Серый', '#6a6a78'], ['Болотный', '#4a6a3a'], ['Чёрный', '#1e1a24']]
};
function shadeHex(h, k) { const v = parseInt(h.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return '#' + ((1 << 24) | (f(v >> 16) << 16) | (f((v >> 8) & 255) << 8) | f(v & 255)).toString(16).slice(1); }
function applyLook(l) {
  l = l || {}; const c = LOOKS.cloak[l.cloak | 0] || LOOKS.cloak[0], s = LOOKS.skin[l.skin | 0] || LOOKS.skin[0], e = LOOKS.eyes[l.eyes | 0] || LOOKS.eyes[0], m = LOOKS.scarf[l.scarf | 0] || LOOKS.scarf[0];
  regHumanoid('hero', { h: shadeHex(c[1], .8), H: shadeHex(c[2], .7), s: s[1], e: e[1], m: m[1], c: c[1], C: c[2], b: '#c8a850', p: '#2a2636', B: '#1a1620' });
}
applyLook({});
regHumanoid('nem', { h: '#1a1024', H: '#0c0812', s: '#3a2a48', e: '#ff2a2a', m: '#5a0a1a', c: '#2a1a3a', C: '#180e24', b: '#8a1a2a', p: '#140c1c', B: '#0a0610' });
regHumanoid('merch', { h: '#8a5a2a', H: '#5a3a1a', s: '#f0c8a0', e: '#2a2030', m: '#e0e0d0', c: '#3a8a5a', C: '#2a6a44', b: '#ffd870', p: '#5a4a3a', B: '#3a2a20' });

const WOLF = [
  '............gg..',
  '...........gGGg.',
  '.g........gGGeG.',
  'gGg.....ggGGGGGn',
  '.gGgggggGGGGGGw.',
  '..gGGGGGGGGGGg..',
  '..gGGGGGGGGGg...',
  '..gGGGgggGGGg...',
  '..gGg....gGg....',
  '..gG.....gG.....',
  '..dd.....dd.....'];
reg('wolf', ascii(WOLF, { g: '#6a6a7a', G: '#a0a0b0', e: '#ffe04a', n: '#1a1420', w: '#ffffff', d: '#3a3a48' }));
reg('spirit', ascii(WOLF, { g: '#4ab8d8', G: '#a8f0ff', e: '#ffffff', n: '#2a7a9a', w: '#ffffff', d: '#2a8ab0' }, true));
reg('ashwolf', scaled(ascii(WOLF, { g: '#2a2428', G: '#4a4046', e: '#ff7a1a', n: '#ff4a1a', w: '#ffd870', d: '#ff5a1a' }), 2));
reg('imp', ascii([
  '.r........r.',
  '.rr......rr.',
  '..rRRRRRRr..',
  '.rRRRRRRRRr.',
  '.rRyRRRRyRr.',
  '.rRRRRRRRRr.',
  '..rRwwwwRr..',
  '...rRRRRr...',
  '.o.rRRRRr.o.',
  'oOorRRRRroOo',
  '.o..rr.rr.o.',
  '....rr.rr...',
  '....dd.dd...'], { r: '#a02a1a', R: '#e8502a', y: '#ffe04a', w: '#fff0d0', o: '#ff9a2a', O: '#ffe04a', d: '#5a1a12' }));
reg('water', ascii([
  '.....bb.....',
  '....bBBb....',
  '....bBBb....',
  '...bBBBBb...',
  '..bBBWBBBb..',
  '..bBWBBBBb..',
  '.bBBBBBBBBb.',
  '.bBkBBBBkBb.',
  '.bBkBBBBkBb.',
  '.bBBBBBBBBb.',
  '.bBBBkkBBBb.',
  '..bBBBBBBb..',
  '...bbbbbb...',
  '..l..ll..l..'], { b: '#2a6ac8', B: '#5aa8f0', W: '#e0f4ff', k: '#12244a', l: '#8ad0ff' }));
reg('bat', ascii([
  '.p............p.',
  'pPp....pp....pPp',
  'pPPp..pPPp..pPPp',
  'pPPPppPPPPppPPPp',
  '.pPPPPPyPyPPPPp.',
  '..pPPPPPPPPPPp..',
  '...pp.PwwP.pp...',
  '......pPPp......',
  '.......pp..z....',
  '..........zz....'], { p: '#4a2a7a', P: '#7a4ab8', y: '#ffe95a', w: '#ffffff', z: '#ffe95a' }));
reg('falcon', ascii([
  '.......cc.......',
  '......cCCc..o...',
  '.....cCCkCoo....',
  'cc...cCCCCc.....',
  'cCc.cCCCCCc.....',
  '.cCcCCWWCCc.....',
  '..cCCWWWWCCc....',
  '...cCCWWCCCCcc..',
  '....cCCCCc.cCCc.',
  '.....cc.c...cc..',
  '.....y..y.......'], { c: '#2a8a7a', C: '#7ae0c8', k: '#12241e', o: '#ff9a2a', W: '#f0fff8', y: '#ffb84a' }));
reg('shroom', ascii([
  '...gggggg...',
  '..gGGGGGGg..',
  '.gGGvGGGGGg.',
  'gGGGGGGvGGGg',
  'gGvGGGGGGGGg',
  'gGGGGGvGGGGg',
  '.gggggggggg.',
  '...sSSSSs...',
  '...sSkSkS...',
  '...sSSSSs...',
  '...sSmmSs...',
  '...sSSSSs...',
  '....ssss....'], { g: '#4a7a1a', G: '#8fcc2a', v: '#b04ad8', s: '#a89a78', S: '#f0e8c8', k: '#2a1a30', m: '#7a2a4a' }));
reg('root', ascii([
  '..b........b..',
  '.bB..l..l..Bb.',
  '.bB.lLl.lL.Bb.',
  '..bB.l...lBb..',
  '..bBb.bbb.Bb..',
  '...bBbBBBbBb..',
  '...bBBBBBBb...',
  '..bBByBByBBb..',
  '..bBBBBBBBBb..',
  '..bBBkkkkBBb..',
  '.bBBBBBBBBBBb.',
  '.bBbBBbBBbBBb.',
  'bBb.bBb.bBb.bB',
  'b...b...b....b'], { b: '#4a2e18', B: '#7a5230', l: '#3f8a2e', L: '#7ac84a', y: '#d8ff4a', k: '#1a1008' }));
reg('skel', ascii([
  '....wwww.....',
  '...wWWWWw....',
  '...wkWWkw..n.',
  '...wWWWWw...n',
  '....wkkw....n',
  '.....ww.....n',
  '..wwwWWwww..n',
  '.w..wWWw..wwn',
  '.w..wkkw....n',
  '.w..wWWw....n',
  '....wWWw...n.',
  '....wwww.....',
  '....w..w.....',
  '....w..w.....',
  '....w..w.....',
  '...ww..ww....'], { w: '#b8b4a0', W: '#f0ecd8', k: '#2a2030', n: '#8a5a2a' }));
reg('slime', ascii([
  '....gggggg....',
  '..ggGGGGGGgg..',
  '.gGGWGGGGGGGg.',
  '.gGWGGGGGGGGg.',
  'gGGGGkGGGkGGGg',
  'gGGGGkGGGkGGGg',
  'gGGGGGGGGGGGGg',
  'gGGGGGmmGGGGGg',
  '.gGGGGGGGGGGg.',
  '..gggggggggg..'], { g: '#2a9a6a', G: '#6fe0a0', W: '#e0fff0', k: '#12302a', m: '#1a6a4a' }));

// ---------- Объекты города ----------
reg('altar', ascii([
  '.......vv.......',
  '......vVVv......',
  '.....vVWVVv.....',
  '.....vVVVVv.....',
  '......vVVv......',
  '.......vv.......',
  '................',
  '....ssssssss....',
  '...sSSSSSSSSs...',
  '....sSSrrSSs....',
  '.....sSSSSs.....',
  '.....sSrrSs.....',
  '....sSSSSSSs....',
  '..ssSSSSSSSSss..',
  '.sSSSSSSSSSSSSs.',
  '.ssssssssssssss.'], { v: '#8a3ae8', V: '#c88aff', W: '#ffffff', s: '#5a5a6a', S: '#9a9aaa', r: '#c88aff' }));
reg('stone', ascii([
  '...ssss...',
  '..sSSSSs..',
  '..sSccSs..',
  '..sScSSs..',
  '..sSccSs..',
  '..sSSSSs..',
  '..sScSSs..',
  '..sSccSs..',
  '..sSScSs..',
  '..sSSSSs..',
  '.sSSSSSSs.',
  'sSSSSSSSSs',
  'ssssssssss'], { s: '#4a5a6a', S: '#8a9aaa', c: '#5af0ff' }));
reg('crate', ascii([
  '..r..g..r...',
  '.rRr.gG.rRr.',
  '.rRr.gG.rRr.',
  'bbbbbbbbbbbb',
  'bBBBbBBBBbBb',
  'bBBBbBBBBbBb',
  'bbbbbbbbbbbb',
  'bBBBbBBBBbBb',
  'bbbbbbbbbbbb'], { r: '#c82a3a', R: '#ff6a7a', g: '#2a9a4a', G: '#6ae08a', b: '#5a3a1a', B: '#9a6a3a' }));
reg('lamp', ascii([
  '.yyy.',
  'yYYYy',
  'yYYYy',
  '.kkk.',
  '..k..',
  '..k..',
  '..k..',
  '..k..',
  '..k..',
  '..k..',
  '..k..',
  '.kkk.'], { y: '#ffb82a', Y: '#fff0a0', k: '#3a3440' }));
function genHouse(ra, rb) {
  const c = mkCanvas(38, 36), x = c.getContext('2d');
  for (let py = 0; py < 16; py++) { const ins = Math.max(0, 9 - py); for (let px = ins; px < 38 - ins; px++) { x.fillStyle = ((px + py * 3) % 6 < 1 || py % 4 === 3) ? rb : ra; x.fillRect(px, py, 1, 1); } }
  for (let py = 16; py < 36; py++) for (let px = 3; px < 35; px++) { x.fillStyle = (px === 3 || px === 34 || px === 19 || py === 16) ? '#6b4a2a' : px > 19 ? '#c8b890' : '#d8c8a0'; x.fillRect(px, py, 1, 1); }
  x.fillStyle = '#5a3a22'; x.fillRect(8, 24, 7, 12); x.fillStyle = '#ffd870'; x.fillRect(13, 30, 1, 1);
  x.fillStyle = '#ffd870'; x.fillRect(23, 21, 8, 7); x.fillStyle = '#6b4a2a'; x.fillRect(26, 21, 1, 7); x.fillRect(23, 24, 8, 1);
  return outlineCanvas(c);
}
reg('house0', genHouse('#b8463a', '#8a2e28')); reg('house1', genHouse('#4a6ab8', '#34508a'));

regHumanoid('elder', { h: '#b8b0a0', H: '#8a8474', s: '#d8b898', e: '#5af0ff', m: '#6a6a78', c: '#8a8474', C: '#6a6458', b: '#b8323a', p: '#4a4640', B: '#2a2620' });
regHumanoid('smith', { h: '#3a2a20', H: '#2a1c14', s: '#c89870', e: '#1a1014', m: '#5a3a22', c: '#6a4a3a', C: '#4a3226', b: '#8a8a98', p: '#2a2630', B: '#1a1620' });
reg('anvil', ascii(['.kkkkkkkkk..', 'kKKKKKKKKKkk', '.kKKKKKKKKk.', '...kKKKk....', '...kKKKk....', '..kKKKKKk...', '.kkkkkkkkk..'], { k: '#2a2a34', K: '#6a6a7a' }));
function tinted(c, col, a) { const o = mkCanvas(c.width, c.height), x = o.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = a; x.fillStyle = col; x.fillRect(0, 0, o.width, o.height); return o; }
reg('boneking', tinted(scaled(SPR.skel.c, 2), '#8a3ae8', .28)); reg('slimequeen', tinted(scaled(SPR.slime.c, 3), '#3a1a4a', .35)); reg('stormmother', tinted(scaled(SPR.bat.c, 2), '#ffe95a', .22));
reg('crypt', ascii(['....ssssssss....', '..ssSSSSSSSSss..', '.sSSSSssssSSSSs.', '.sSSssvvvvssSSs.', 'sSSsvvkkkkvvsSSs', 'sSSsvkkkkkkvsSSs', 'sSSsvkkkkkkvsSSs', 'sSSsvkkkkkkvsSSs', 'sSSsvkkkkkkvsSSs', 'sSSsvkkkkkkvsSSs', 'sSSsvkkkkkkvsSSs', 'ssssssssssssssss'], { s: '#3a3640', S: '#6a6470', v: '#8a3ae8', k: '#0a0610' }));
reg('chest', ascii(['.bbbbbbbbbb.', 'bBBBBggBBBBb', 'bBBBBggBBBBb', 'bbbbbggbbbbb', 'bBBBBgGBBBBb', 'bBBBBBBBBBBb', 'bBBBBBBBBBBb', 'bbbbbbbbbbbb'], { b: '#4a2e18', B: '#8a5a2a', g: '#c8a850', G: '#fff0a0' }));
function genWall() {
  const c = mkCanvas(32, 32), x = c.getContext('2d');
  for (let py = 0; py < 32; py++) for (let px = 0; px < 32; px++) {
    const dx = Math.abs(px + .5 - 16) / 16, top = dx + Math.abs(py + .5 - 8) / 8 <= 1, e0 = 8 + (1 - dx) * 8, side = !top && py >= e0 - 1 && py < e0 + 16;
    if (!top && !side) continue; const r = hash2(px, py, 91); let col;
    if (top) col = r < .8 ? '#4a4452' : '#3e3846';
    else { const d = Math.floor(py - e0), row = d >> 2, brick = (row + ((px + row * 4) >> 3)) & 1, seam = (d & 3) === 3 || ((px + row * 4) & 7) === 0; col = px < 16 ? (seam ? '#1e1a24' : brick ? '#342e3c' : '#2c2634') : (seam ? '#120e16' : brick ? '#241f2a' : '#1e1a24'); }
    x.fillStyle = col; x.fillRect(px, py, 1, 1);
  }
  return c;
}
const WALLSPR = genWall();
reg('toad', ascii(['...gg....gg...', '..gyyg..gyyg..', '..gkyg..gkyg..', '.gGGGggggGGGg.', 'gGGGGGGGGGGGGg', 'gGvGGGGGGGGvGg', 'gGGGwwwwwwGGGg', '.gGGGGGGGGGGg.', 'gg.gGGggGGg.gg', 'gGg.gg..gg.gGg'], { g: '#2a4a1a', G: '#5a8a2a', y: '#e8d84a', k: '#1a1408', v: '#8a5ab8', w: '#c8d8a0' }));
reg('wraith', ascii(['....pppp....', '...pPPPPp...', '..pPPPPPPp..', '..pPrPPrPp..', '..pPPPPPPp..', '.pPPPkkPPPp.', '.pPPPPPPPPp.', 'pPPpPPPPpPPp', 'pPp.pPPp.pPp', '.p..pPPp..p.', '....pPPp....', '.....pp.....'], { p: '#3a2a5a', P: '#8a7ab8', r: '#ff3a4a', k: '#1a1024' }));
reg('guardian', tinted(scaled(SPR.wolf.c, 3), '#fff8d0', .5));
reg('tomb', ascii(['..ssss..', '.sSSSSs.', '.sSkkSs.', '.sSSSSs.', '.sSkSSs.', '.sSSSSs.', '.sSSSSs.', 'ssssssss'], { s: '#3a3a48', S: '#6a6a7a', k: '#2a2a36' }));
reg('totem', ascii(['..r..r..', '.rRr.rRr', '..bbbb..', '.bWkkWb.', '.bWWWWb.', '.bkWWkb.', '..bWWb..', '..bbbb..', '...bb...', '...bb...', '..rbbr..', '...bb...', '...bb...', '..bbbb..'], { r: '#8a1a2a', R: '#ff2a4a', b: '#3a2a20', W: '#d8d0b8', k: '#1a1014' }));
reg('stake', ascii(['..w..', '.wWw.', '.bBb.', '.bBb.', '.bBb.', '.bBb.', '.bBb.', '.bBb.', '.bBb.', 'bbBbb'], { w: '#b8b4a0', W: '#e8e4d0', b: '#2e2018', B: '#4a3626' }));
// ---------- Деревья и камни (процедурно) ----------
function pxLine(x, x0, y0, x1, y1, w) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); w = w || 1;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx - dy, n = 0;
  while (n++ < 600) { x.fillRect(x0, y0, w, w); if (x0 === x1 && y0 === y1) break; const e2 = err * 2; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; } }
}
function genTree(seed, pal, dead) {
  const c = mkCanvas(40, 58), x = c.getContext('2d'), R = mulberry(seed);
  for (let py = 36; py < 57; py++) { const w = py > 53 ? 7 : 5; for (let px = 0; px < w; px++) { x.fillStyle = px < w / 2 ? pal.t1 : pal.t2; x.fillRect(20 - (w >> 1) + px, py, 1, 1); } }
  if (dead) {
    x.fillStyle = pal.t2; [[20, 37, 11, 20], [20, 37, 28, 16], [20, 40, 20, 9], [16, 28, 7, 28], [25, 24, 33, 25], [13, 23, 14, 13], [20, 20, 25, 11]].forEach(l => pxLine(x, l[0], l[1], l[2] + (R() * 4 - 2), l[3] + (R() * 4 - 2), 2));
    x.fillStyle = pal.t1; pxLine(x, 19, 38, 19, 12, 1);
  } else {
    const blobs = [[20, 28, 13], [11 + R() * 3, 31, 9], [28 - R() * 3, 31, 9], [15 + R() * 4, 20, 10], [25 - R() * 4, 21, 9], [20, 13 + R() * 2, 9]];
    for (const b of blobs) for (let py = Math.floor(b[1] - b[2]); py <= b[1] + b[2]; py++) for (let px = Math.floor(b[0] - b[2]); px <= b[0] + b[2]; px++) {
      const dx = px - b[0], dy = (py - b[1]) * 1.15; if (dx * dx + dy * dy > b[2] * b[2]) continue;
      const l = (-dx * .4 - dy * .9) / b[2] + (R() - .5) * .55;
      x.fillStyle = l > .5 ? pal.l3 : l > .05 ? pal.l2 : l > -.45 ? pal.l1 : pal.l0; x.fillRect(px, py, 1, 1);
    }
  }
  return outlineCanvas(c, '#0e1218');
}
const TREE_PAL = [
  { l0: '#1f4d2b', l1: '#2f6e34', l2: '#3f8f3c', l3: '#63b04a', t1: '#6a4628', t2: '#3e2616' },
  { l0: '#12332a', l1: '#1c4c36', l2: '#27653e', l3: '#3a844c', t1: '#4a3424', t2: '#2a1c14' },
  { l0: '#6e4a1e', l1: '#96672a', l2: '#b8862e', l3: '#d8a83c', t1: '#5a4030', t2: '#32221a' }];
for (let z = 0; z < 3; z++) for (let v = 0; v < 3; v++) reg('tree' + z + '_' + v, genTree(z * 10 + v + 1, TREE_PAL[z]));
for (let v = 0; v < 2; v++) reg('dead' + v, genTree(50 + v, { t1: '#3a3236', t2: '#1e1a1e' }, true));
function genRock(seed) {
  const c = mkCanvas(22, 16), x = c.getContext('2d'), R = mulberry(seed);
  for (let py = 0; py < 16; py++) for (let px = 0; px < 22; px++) {
    const dx = (px - 11) / (9 + (seed % 2)), dy = (py - 9) / 6.5; if (dx * dx + dy * dy > 1 + (R() - .5) * .12) continue;
    const l = -dx * .5 - dy * .9 + (R() - .5) * .4; x.fillStyle = l > .45 ? '#b0b0bc' : l > 0 ? '#8a8a98' : l > -.5 ? '#6a6a78' : '#4a4a58'; x.fillRect(px, py, 1, 1);
  }
  return outlineCanvas(c, '#16141c');
}
reg('rock0', genRock(3)); reg('rock1', genRock(8));

// ---------- Тайлы ----------
const T = { GRASS: 0, TALL: 1, DIRT: 2, SHALLOW: 3, DEEP: 4, PLAZA: 5, ASH: 6, DRY: 7, DRYTALL: 8, SCORCH: 9, LAIR: 10, DGRASS: 11, DTALL: 12, MUD: 13, GRAVE: 14, DFLOOR: 15, VOID: 16 };
const TPAL = [
  ['#4a9a3c', '#3f8a36', '#5aac46'], null, ['#a8845a', '#96744c', '#ba966a'], ['#4a9ad8', '#3f8cc8', '#7ac0f0'], ['#2a5aa0', '#244e8e', '#3a70b8'],
  ['#8a8a96', '#74747f', '#9c9ca8'], ['#3a3436', '#2a2628', '#4c4240'], ['#b0a04a', '#9c8c3e', '#c4b45c'], null, ['#6a4a38', '#583c2e', '#7c5844'],
  ['#4a3038', '#3c262e', '#5c3c44'], ['#357a3a', '#2a6832', '#408a40'], null, ['#4a4a34', '#3a3c2a', '#5a5a3e'], ['#5a5e5a', '#4a4e4c', '#6a6e68'], ['#5a5460', '#48424e', '#6a6470'], ['#05040a', '#05040a', '#05040a']];
// мрачная гамма: всё приглушено
for (let i = 0; i < TPAL.length; i++) if (TPAL[i]) TPAL[i] = TPAL[i].map(c => { const v = parseInt(c.slice(1), 16), r = v >> 16, g = (v >> 8) & 255, b = v & 255, l = (r + g + b) / 3, f = x => Math.round((x * .72 + l * .28) * .8); return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | Math.min(255, f(b) + 6)).toString(16).slice(1); });
TPAL[T.TALL] = TPAL[T.GRASS]; TPAL[T.DRYTALL] = TPAL[T.DRY]; TPAL[T.DTALL] = TPAL[T.DGRASS];
const TMAP = ['#3a7a34', '#2e6a2c', '#8a6c4c', '#3a7ab0', '#224a84', '#74747e', '#3a3436', '#8e8240', '#a08a34', '#5a4032', '#4a3038', '#2c6232', '#24562a', '#4a4a34', '#5a5e5a', '#5a5460', '#0b0810'];
function genTile(pal, seed, style) {
  const c = mkCanvas(32, 16), x = c.getContext('2d');
  for (let py = 0; py < 16; py++) {
    const w = py < 8 ? 4 * py + 2 : 4 * (15 - py) + 2, x0 = 16 - w / 2;
    for (let px = x0; px < x0 + w; px++) {
      const r = hash2(px + seed * 57, py, seed); let col = r < .72 ? pal[0] : r < .88 ? pal[1] : pal[2];
      if (style === 'water') col = ((px + py * 2 + seed * 7) % 13 < 3 && r > .35) ? pal[2] : (r < .85 ? pal[0] : pal[1]);
      else if (style === 'plaza') { const a = Math.floor(px / 2 + py + 64), b = Math.floor(px / 2 - py + 64); if (a % 8 === 0 || b % 8 === 0) col = pal[1]; else col = r < .9 ? pal[0] : pal[2]; }
      x.fillStyle = col; x.fillRect(px, py, 1, 1);
    }
  }
  return c;
}
const TILE = [], TILE_W2 = [];
for (let t = 0; t < TPAL.length; t++) { TILE[t] = []; for (let v = 0; v < 4; v++) TILE[t][v] = genTile(TPAL[t], t * 13 + v + 1, t === T.SHALLOW || t === T.DEEP ? 'water' : t === T.PLAZA || t === T.DFLOOR ? 'plaza' : ''); }
for (const t of [T.SHALLOW, T.DEEP]) { TILE_W2[t] = []; for (let v = 0; v < 4; v++) TILE_W2[t][v] = genTile(TPAL[t], t * 13 + v + 40, 'water'); }
// Высокая трава — накладка поверх тайла
function genTall(pal, seed) {
  const c = mkCanvas(32, 24), x = c.getContext('2d'), R = mulberry(seed), bl = [];
  for (let n = 0; n < 60; n++) { const bx = 2 + R() * 28, by = 9 + R() * 14; if (Math.abs(bx - 16) / 16 + Math.abs(by - 16) / 8 > .92) continue; bl.push([bx | 0, by | 0, 3 + (R() * 5 | 0), R()]); }
  bl.sort((a, b) => a[1] - b[1]);
  for (const b of bl) { x.fillStyle = pal[b[3] < .5 ? 0 : 1]; x.fillRect(b[0], b[1] - b[2], 1, b[2]); x.fillStyle = pal[2]; x.fillRect(b[0] + (b[3] < .3 ? -1 : b[3] > .7 ? 1 : 0), b[1] - b[2] - 1, 1, 1); }
  return c;
}
const TALLSPR = {};
TALLSPR[T.TALL] = [0, 1, 2].map(v => genTall(['#2f7a2e', '#3f9a38', '#7ad058'], 70 + v));
TALLSPR[T.DTALL] = [0, 1, 2].map(v => genTall(['#1f5a2c', '#2c7436', '#52a84e'], 80 + v));
TALLSPR[T.DRYTALL] = [0, 1, 2].map(v => genTall(['#8a7428', '#b89a38', '#e8d068'], 90 + v));

// ---------- Эффекты ----------
function genFlame(seed) {
  const c = mkCanvas(12, 14), x = c.getContext('2d');
  for (let py = 0; py < 14; py++) {
    const t = py / 13, hw = Math.sin(Math.min(1, t * 1.1) * Math.PI * .62) * 5.2, cx = 6 + Math.sin(py * .9 + seed * 2.1) * (1 - t) * 1.8;
    for (let px = 0; px < 12; px++) { const d = Math.abs(px + .5 - cx); if (d < hw) { const k = d / hw + (1 - t) * .5; x.fillStyle = k < .45 ? '#fff3a0' : k < .8 ? '#ffb02e' : '#e8501c'; x.fillRect(px, py, 1, 1); } }
  }
  return c;
}
const FLAME = [0, 1, 2, 3].map(genFlame);
function genGlow(w, h, rgb) {
  const c = mkCanvas(w, h), x = c.getContext('2d'), g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(' + rgb + ',.13)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
  x.save(); x.translate(0, h / 2); x.scale(1, h / w); x.translate(0, -w / 2); x.fillStyle = g; x.fillRect(0, 0, w, w); x.restore(); return c;
}
function genLight() { const c = mkCanvas(128, 80), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.save(); x.scale(1, 80 / 128); x.fillStyle = g; x.fillRect(0, 0, 128, 128); x.restore(); return c; }
const LIGHT = genLight();
const GLOW = { fire: genGlow(64, 40, '255,140,40'), storm: genGlow(48, 30, '255,240,120'), soul: genGlow(40, 26, '190,120,255') };

// ---------- Пиксельные цифры (урон) ----------
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111'];
const NUMC = {};
function numStrip(color) {
  if (NUMC[color]) return NUMC[color];
  const c = mkCanvas(50, 7), x = c.getContext('2d');
  for (let d = 0; d < 10; d++) {
    x.fillStyle = '#100a14'; for (let i = 0; i < 15; i++) if (DIG[d][i] === '1') x.fillRect(d * 5 + i % 3, (i / 3 | 0), 3, 3);
    x.fillStyle = color; for (let i = 0; i < 15; i++) if (DIG[d][i] === '1') x.fillRect(d * 5 + 1 + i % 3, 1 + (i / 3 | 0), 1, 1);
  }
  return NUMC[color] = c;
}
function drawNum(ctx, n, x, y, color) { const s = String(Math.abs(n | 0)), st = numStrip(color), w = s.length * 4; for (let i = 0; i < s.length; i++) ctx.drawImage(st, (s.charCodeAt(i) - 48) * 5, 0, 5, 7, Math.round(x - w / 2) + i * 4, Math.round(y), 5, 7); }

// ---------- Иконки душ ----------
const GLYPH = {
  dash: ['....#....', '....##...', '#######..', '########.', '#######..', '....##...', '....#....'],
  ball: ['..###....', '.#####.#.', '#######..', '#######.#', '#######..', '.#####.#.', '..###....'],
  wave: ['..##...##', '.#..#.#..', '#....#...', '.........', '..##...##', '.#..#.#..', '#....#...'],
  chain: ['....###', '...###.', '..###..', '.#####.', '...##..', '..##...', '.##....', '#......'],
  whirl: ['#######', '.#####.', '.#####.', '..###..', '..###..', '...#...', '...#...'],
  cloud: ['..##.....', '.####.##.', '#########', '#########', '.#######.', '.........', '.#..#..#.'],
  roots: ['#...#...#', '#...#..#.', '.#..#..#.', '.#.#..#..', '..###.#..', '...###...', '...###...'],
  arrows: ['.#..#..#.', '###.#.###', '.#.###.#.', '.#..#..#.', '.#..#..#.', '.#..#..#.'],
  shield: ['#######', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
  ashstorm: ['#..#..#', '.#..#..', '..#..#.', '#..#..#', '.#..#..', '..#..#.', '#######'],
  bomb: ['.....#.', '....#..', '..###..', '.#####.', '#######', '#######', '.#####.', '..###..'],
  bubble: ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..'],
  paw: ['.#.#.#.', '.#.#.#.', '.......', '..###..', '.#####.', '.#####.', '..###..'],
  i_weapon: ['......##', '.....###', '....###.', '#..###..', '.####...', '.###....', '#.##....', '...#....'], i_armor: ['##.#.##', '#######', '#######', '.#####.', '.#####.', '.#####.', '.#####.'], i_amulet: ['.#...#.', '#.....#', '#.....#', '.#...#.', '..###..', '.#####.', '..###..'], i_ring: ['..###..', '.#####.', '..###..', '.#...#.', '#.....#', '.#...#.', '..###..'],
  bonecage: ['#.#.#.#', '#.#.#.#', '#.#.#.#', '#.#.#.#', '#.#.#.#', '#######'], tidal: ['#....#...', '.#..#.#..', '..##...##', '#....#...', '.#..#.#..', '..##...##', '#########'], tempest: ['.#####.', '#######', '.#####.', '..#.#..', '.#.#...', '..#.#..', '.#.#...'],
  hook: ['..###..', '.#...#.', '.....#.', '....#..', '...#...', '...#...', '#..#...', '.###...'], drain: ['#.....#', '.#...#.', '..#.#..', '...#...', '..###..', '.#####.', '..###..'],
  i_weapon0: ['......#', '.....##', '....##.', '.#.##..', '..##...', '.#.#...', '#......'], i_weapon1: ['......##', '.....###', '....###.', '#..###..', '.####...', '.###....', '#.##....', '...#....'], i_weapon2: ['.......#', '......##', '.....##.', '#...##..', '.#.##...', '..##....', '.#.#....', '#...#...'], i_weapon3: ['.#####.', '#....##', '......#', '.....#.', '....#..', '...#...', '..#....', '.#.....'],
  i_armor0: ['..###..', '.#####.', '.#####.', '#######', '#######', '###.###', '##...##'], i_armor1: ['##.#.##', '#######', '#######', '.#####.', '.#####.', '.#####.', '.#####.'], i_armor2: ['##.#.##', '#######', '#.#.#.#', '.#.#.#.', '.#####.', '.#.#.#.', '.#####.'], i_armor3: ['###.###', '#######', '#######', '.#####.', '.##.##.', '.#####.', '..###..'],
  i_amulet0: ['.#...#.', '#.....#', '#.....#', '.#...#.', '..###..', '.#####.', '..###..'], i_amulet1: ['.#...#.', '#.....#', '.#...#.', '..###..', '.#.#.#.', '.#####.', '..###..'],
  i_ring0: ['..###..', '.#####.', '..###..', '.#...#.', '#.....#', '.#...#.', '..###..'], i_ring1: ['...#...', '..###..', '..###..', '.#...#.', '#.....#', '.#...#.', '..###..'],
  geyser: ['#..#..#', '.#.#.#.', '..###..', '..###..', '..###..', '.#####.', '#######']
};
const ICONC = {};
function makeIcon(key, glyph, c1, c2) {
  if (ICONC[key]) return ICONC[key];
  const c = mkCanvas(16, 16), x = c.getContext('2d'), g = GLYPH[glyph] || GLYPH.ball;
  x.fillStyle = c1; x.fillRect(1, 0, 14, 16); x.fillRect(0, 1, 16, 14);
  x.fillStyle = '#1a1424'; x.fillRect(2, 1, 12, 14); x.fillRect(1, 2, 14, 12);
  const gw = Math.max.apply(null, g.map(r => r.length)), ox = 8 - (gw >> 1) - (gw % 2 ? 1 : 0) + (gw % 2), oy = 8 - (g.length >> 1);
  for (let j = 0; j < g.length; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '#') { x.fillStyle = j < g.length / 2 ? c1 : (c2 || c1); x.fillRect(ox + i - 1, oy + j, 1, 1); }
  c.url = null; return ICONC[key] = c;
}
function iconUrl(c) { return c.url || (c.url = c.toDataURL()); }
