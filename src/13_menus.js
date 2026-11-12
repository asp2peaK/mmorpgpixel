// Меню (DOM поверх канваса): старт, Алтарь душ (Души / Слияние / Журнал), магазин
const Menus = (() => {
  const ui = document.getElementById('ui'); let st = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stars = n => '★'.repeat(starsOf(n)) + '<span class="q">' + '★'.repeat(3 - starsOf(n)) + '</span>';
  const elChip = el => '<span class="el" style="background:' + EL[el].c + '">' + EL[el].n + '</span>';
  let lastKey = '', lastTab = 'gear';
  const res = p => '<span class="res"><span>Ур. ' + p.lvl + '</span><span class="gd">● ' + p.gold + '</span><span class="sh">◆ ' + (p.shards | 0) + '</span><span class="bad">✚ ' + p.potions + '</span></span>';
  // Окно: шапка сверху, слева список, справа детали выбранного. Прокрутка не сбрасывается при клике.
  function show(html) {
    const key = st ? st.kind + ':' + (st.tab || '') : '', sc = {}; if (key === lastKey) for (const c of ['panel', 'cl', 'cr']) { const e = ui.querySelector('.' + c); if (e) sc[c] = e.scrollTop; }
    let wide = false, ti = html.indexOf('<div class="tabs">'), ci = ti >= 0 ? html.indexOf('</div>', ti) + 6 : (html.indexOf('</h2>') >= 0 ? html.indexOf('</h2>') + 5 : -1);
    if (ci >= 0) { const body = html.slice(ci), ri = body.indexOf('<!--R-->'); if (ri >= 0) { wide = true; html = html.slice(0, ci) + '<div class="cols"><div class="cl">' + body.slice(0, ri) + '</div><div class="cr">' + body.slice(ri + 8) + '</div></div>'; } else if (body.indexOf('bigmap') >= 0) wide = true; }
    ui.innerHTML = '<div class="panel' + (wide ? ' wide' : '') + '">' + html + '</div>'; ui.classList.add('on'); G.paused = true; Input.clear();
    for (const c in sc) { const e = ui.querySelector('.' + c); if (e) e.scrollTop = sc[c]; } lastKey = key;
  }
  function close() { if (!st || st.kind === 'title') return; ui.classList.remove('on'); ui.innerHTML = ''; st = null; G.paused = false; Input.clear(); G.noKeyUntil = performance.now() + 250; Bus.emit('menuClosed'); }
  const isOpen = () => !!st;
  function card(id, n, cls, act) { const d = soulDef(id); return '<div class="soul ' + (cls || '') + '" data-a="' + act + '" data-v="' + id + '"><img src="' + iconUrl(d.icon) + '"><div><b>' + esc(d.abName) + '</b><small>' + stars(n) + ' ×' + n + '</small></div></div>'; }

  // ---------- Старт ----------
  function title() {
    st = { kind: 'title', confirm: false, look: (st && st.look) || { cloak: 0, skin: 0, eyes: 0, scarf: 0 } }; const s = loadSave(); applyLook(st.look);
    const pv = scaled(SPR.hero_i.c, 6), sw = (k, nm) => '<div class="row" style="margin:5px 0"><span style="width:64px;font-size:13px;color:#7d7462">' + nm + '</span>' + LOOKS[k].map((o, i) => '<button class="btn" title="' + o[0] + '" data-a="look" data-v="' + k + ':' + i + '" style="width:30px;height:30px;padding:0;background:' + o[1] + ';border-color:' + (st.look[k] === i ? '#ffd870' : '#3a3024') + '"></button>').join('') + '</div>';
    const keepName = document.getElementById('nm') ? document.getElementById('nm').value : null;
    show('<h1>ПОЖИРАТЕЛЬ ДУШ</h1><div class="sub">изометрическая экшн-RPG · души вместо классов</div>' +
      (s ? '<button class="btn gold" style="width:100%;margin-bottom:10px" data-a="cont">Продолжить: ' + esc(s.name) + ', ур. ' + (s.lvl | 0) + '</button>' : '') +
      '<h3>Создание героя</h3><div class="row" style="align-items:flex-start;flex-wrap:nowrap"><img src="' + pv.toDataURL() + '" style="image-rendering:pixelated;width:84px;flex:none;background:#07060a;border:2px solid #3a3024;padding:6px"><div style="flex:1">' + sw('cloak', 'Плащ') + sw('skin', 'Кожа') + sw('eyes', 'Глаза') + sw('scarf', 'Шарф') + '</div></div>' +
      '<input class="name" id="nm" maxlength="12" placeholder="Имя героя" value="' + esc(keepName !== null ? keepName : (s ? '' : 'Герой')) + '" style="margin-top:8px">' +
      '<button class="btn" style="width:100%;margin-top:8px" data-a="new" id="newb">' + (s ? 'Новая игра (сотрёт сохранение)' : 'Начать игру') + '</button>' +
      '<div class="help"><b>ПК:</b> <kbd>WASD</kbd> движение · <kbd>мышь</kbd> прицел · <kbd>ЛКМ</kbd> удар · <kbd>Пробел</kbd> перекат · <kbd>1</kbd>–<kbd>4</kbd> души · <kbd>Q</kbd> зелье · <kbd>E</kbd> взаимодействие · <kbd>I</kbd> снаряжение · <kbd>K</kbd> души · <kbd>J</kbd> журнал · <kbd>M</kbd> карта<br>' +
      '<b>Телефон:</b> джойстик слева, кнопки справа, автоприцел на ближайшего врага.<br><br>' +
      'Мобы роняют свои <b>души</b> — способность + стихия. Стихии вступают в <b>реакции</b>. На Алтаре души сливаются в <b>химер</b>. А если погибнешь — твой труп встанет <b>Тенью</b> с твоими же душами.</div>');
  }
  function begin(save) {
    const nm = document.getElementById('nm'), name = (nm && nm.value.trim()) || 'Герой';
    const look = st && st.look; ui.classList.remove('on'); ui.innerHTML = ''; st = null; Sfx.init();
    if (save) startGame({ name: save.name, save }); else { wipeSave(); startGame({ name: name.slice(0, 12), look }); }
  }

  // ---------- Алтарь ----------
  function openAltar(atAltar, tab) { if (!G.started || G.me.dead) return; st = { kind: 'altar', tab: tab || (atAltar ? 'souls' : lastTab), sel: null, fa: null, fb: null, atAltar, res: null }; drawAltar(); }
  function drawAltar() {
    const p = G.me, t = st.tab; let h = '<button class="btn x" data-a="close">✕</button><h2>' + (st.atAltar ? 'Алтарь душ' : 'Герой: ' + esc(p.name)) + res(p) + '</h2>'; if (!st.atAltar) lastTab = t;
    h += '<div class="tabs">' + [['souls', 'Души', 'K'], ['gear', 'Снаряжение', 'I'], ['fuse', 'Слияние', ''], ['journal', 'Журнал', 'J'], ['map', 'Карта', 'M']].map(x => '<button class="btn ' + (t === x[0] ? 'act' : '') + '" data-a="tab" data-v="' + x[0] + '">' + x[1] + (x[2] && !V.touch ? '<small>[' + x[2] + ']</small>' : '') + '</button>').join('') + '</div>';
    if (t === 'souls') h += tabSouls(p); else if (t === 'gear') h += tabGear(p, false); else if (t === 'fuse') h += tabFuse(p); else if (t === 'map') h += '<canvas id="bigmap" width="570" height="285" style="width:100%;image-rendering:pixelated;background:#07060a;border:2px solid #3a3024"></canvas><div class="det"><span style="color:#fff">■</span> ты · <span style="color:#c9a0ff">■</span> город · <span style="color:#c82a3a">■</span> лагерь врагов · <span style="color:#ff7a1a">■</span> логово · <span style="color:#ff2a4a">■</span> Тень. Разведано: ' + Math.round(W.seen.reduce((a, c) => a + c, 0) / W.seen.length * 100) + '%. Лагерей зачищено: ' + (G.J.camps || 0) + '</div>'; else h += tabJournal(p);
    show(h);
    if (t === 'map') { if (W.mapDirty) renderMap(); const c = document.getElementById('bigmap'), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.setTransform(1.5, .75, -1.5, .75, MH * 1.5, 2); x.drawImage(W.map, 0, 0); const mk = (wx, wy, col, s) => { x.fillStyle = '#07060a'; x.fillRect(wx - s - 1, wy - s - 1, s * 2 + 2, s * 2 + 2); x.fillStyle = col; x.fillRect(wx - s, wy - s, s * 2, s * 2); }; if (!W.dun) { mk(TOWN.x, TOWN.y, '#c9a0ff', 2); if (W.seen[tIdx(LAIR.x, LAIR.y)]) mk(LAIR.x, LAIR.y, '#ff7a1a', 2); } for (const k of W.crypts) if (W.seen[tIdx(k.x, k.y)]) mk(k.x, k.y, '#b04ad8', 2); for (const k of W.camps) if (W.seen[tIdx(k.x, k.y)] && !k.cleared) mk(k.x, k.y, '#c82a3a', 1.5); if (G.nemesis && !G.nemesis.dead && !W.dun) mk(G.nemesis.x, G.nemesis.y, '#ff2a4a', 2); mk(p.x, p.y, '#ffffff', 1.5); }
  }
  function tabSouls(p) {
    let h = '<div class="slots">' + p.slots.map((id, i) => '<div class="slot" data-a="slot" data-v="' + i + '"><i>' + (i + 1) + '</i>' + (id ? '<img src="' + iconUrl(soulDef(id).icon) + '"><br>' + esc(soulDef(id).abName) : '<br><span class="q">пусто</span>') + '</div>').join('') + '</div>';
    const ids = Object.keys(p.souls); if (st.sel && !p.souls[st.sel]) st.sel = null;
    h += '<div class="grid">' + ids.map(id => card(id, p.souls[id], (st.sel === id ? 'sel' : ''), 'sel')).join('') + '</div>';
    h += '<!--R-->';
    if (st.sel) {
      const d = soulDef(st.sel), n = p.souls[st.sel], sN = starsOf(n);
      h += '<div class="det"><b style="font-size:16px">' + esc(d.name) + '</b> ' + stars(n) + '<br>' + d.els.map(elChip).join(' ') + ' · перезарядка ' + AB[d.ab].cd + ' с<br>' + esc(d.desc) + '<br>' +
        '<span class="gd">★3: ' + esc(d.s3 || '—') + '</span> · ' + (sN >= 3 ? '<span class="ok">максимум</span>' : 'до ★' + (sN + 1) + ': ' + n + '/' + (sN === 1 ? 3 : 6) + ' копий') + ' · урон +' + (sN - 1) * 25 + '%' +
        '<br><span class="q">Нажми на слот сверху, чтобы поставить душу' + (p.slots.indexOf(st.sel) >= 0 ? ' (или убрать)' : '') + '.</span></div>';
    } else h += '<div class="det q">Выбери душу, затем нажми на слот. Дубликаты усиливают душу: ★2 — 3 копии, ★3 — 6 копий.</div>';
    return h;
  }
  function icard(it, cls) { return '<div class="soul ' + (cls || '') + '" data-a="isel" data-v="' + it.uid + '" style="border-color:' + RANKS[it.rank].c + '"><img src="' + iconUrl(itemIcon(it)) + '"><div><b style="color:' + RANKS[it.rank].c + '">' + esc(itemName(it)) + (it.ench ? ' <span style="color:' + EL[soulDef(it.ench).el].c + '">✦</span>' : '') + '</b><small>ур. ' + it.lvl + ' · ' + AFF[it.base[0]].n + ' +' + baseVal(it) + AFF[it.base[0]].u + '</small></div></div>'; }
  const findItem = (p, uid) => p.bag.find(i => i.uid === uid) || ISLOTS.map(s => p.equip[s]).find(i => i && i.uid === uid);
  function idet(it, title) { return '<div class="det"><span class="q">' + title + '</span><br><b style="font-size:16px;color:' + RANKS[it.rank].c + '">' + esc(itemName(it)) + '</b><br>' + RANKS[it.rank].n + ' · ' + ISLOT_N[it.slot] + ' · ур. ' + it.lvl + '<br>' + itemLines(it).join('<br>') + '</div>'; }
  function tabGear(p, shop) {
    const g = p.gs; let h = '<div class="slots">' + ISLOTS.map(s => { const it = p.equip[s]; return '<div class="slot" data-a="isel" data-v="' + (it ? it.uid : '') + '" style="' + (it ? 'border-color:' + RANKS[it.rank].c : '') + '"><i>' + ISLOT_N[s] + '</i><br>' + (it ? '<img src="' + iconUrl(itemIcon(it)) + '"><br><span style="color:' + RANKS[it.rank].c + '">' + esc(itemName(it)) + '</span>' : '<span class="q">пусто</span>') + '</div>'; }).join('') + '</div>';
    h += '<div class="det" style="margin:0 0 8px">Здоровье <b>' + p.maxHp + '</b> · Урон <b>' + Math.round(p.atk) + '</b> · Крит <b>' + Math.round(p.crit * 100) + '%</b> · Скорость <b>+' + Math.min(30, g.spd) + '%</b> · Перезарядка <b>−' + Math.min(40, g.cdr) + '%</b> · Урон душ <b>+' + g.soul + '%</b>' + Object.keys(g.el).map(e => ' · ' + EL[e].n + ' <b>+' + g.el[e] + '%</b>').join('') + '</div>';
    h += '<h3>Сумка (' + p.bag.length + '/' + BAG_MAX + ')</h3><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">' + (p.bag.length ? p.bag.slice().sort((a, b) => itemScore(b) - itemScore(a)).map(it => icard(it, st.isel === it.uid ? 'sel' : '')).join('') : '<span class="q">Пусто. Предметы падают с врагов — чаще с проклятых и вожаков.</span>') + '</div>';
    h += '<!--R-->';
    const it = st.isel && findItem(p, st.isel);
    if (it) {
      const worn = p.equip[it.slot] === it; h += idet(it, worn ? 'Надето' : 'В сумке'); if (!worn && p.equip[it.slot]) h += idet(p.equip[it.slot], 'Сейчас надето');
      h += '<div class="row" style="margin-top:8px">' + (worn ? '<button class="btn" data-a="iun" data-v="' + it.slot + '"' + (p.bag.length >= BAG_MAX ? ' disabled' : '') + '>Снять</button>' : '<button class="btn gold" data-a="ieq">Надеть</button>') + (shop && !worn ? '<button class="btn" data-a="isell">Продать за ' + itemPrice(it) + '</button>' : '') + (!worn ? '<button class="btn red" data-a="ibreak">Разобрать (+' + shardsOf(it) + ' ◆)</button>' : '') + '</div>';
    }
    if (shop) { const junk = p.bag.filter(i => i.rank === 0); if (junk.length) h += '<button class="btn" style="width:100%;margin-top:8px" data-a="ijunk">Продать всё обычное (' + junk.length + ' шт. за ' + junk.reduce((a, i) => a + itemPrice(i), 0) + ')</button>'; }
    else h += '<div class="det q">Осколков: <span style="color:#8ad0ff">◆ ' + (p.shards | 0) + '</span>. Кузнец в городе куёт и зачаровывает вещи. Продать вещи можно у торговца в городе. При смерти Тень снимает с тебя самую ценную надетую вещь — убей её, чтобы вернуть.</div>';
    return h;
  }
  // ---------- Кузнец ----------
  function openSmith() { if (!G.started || G.me.dead) return; st = { kind: 'smith', tab: 'forge', isel: null, esel: null, msg: '' }; drawSmith(); }
  function drawSmith() {
    const p = G.me, all = ISLOTS.map(s => p.equip[s]).filter(Boolean).concat(p.bag.slice().sort((a, b) => itemScore(b) - itemScore(a)));
    let h = '<button class="btn x" data-a="close">✕</button><h2>Кузнец' + res(p) + '</h2>';
    h += '<div class="tabs">' + [['forge', 'Ковка'], ['ench', 'Зачарование']].map(x => '<button class="btn ' + (st.tab === x[0] ? 'act' : '') + '" data-a="stab" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
    h += '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));max-height:190px;overflow:auto">' + (all.length ? all.map(it => icard(it, st.isel === it.uid ? 'sel' : '')).join('') : '<span class="q">«Принеси железо — поговорим.» У тебя нет вещей.</span>') + '</div>';
    h += '<!--R-->';
    const it = st.isel && findItem(p, st.isel);
    if (st.msg) h += '<div class="det" style="font-size:16px">' + st.msg + '</div>';
    if (!it) h += '<div class="det q">' + (st.tab === 'forge' ? 'Ковка усиливает основное свойство вещи: +10% за уровень, до +10. Нужны золото и осколки (◆) — их дают проклятые, вожаки, боссы и разбор вещей. С +4 ковка может провалиться, а с +7 провал ещё и ослабляет вещь.' : 'Зачарование вплавляет душу в вещь и даёт ей стихию. Тратит одну копию души и ' + ENCH_COST + ' золота. Новое зачарование заменяет старое.') + '</div>';
    else if (st.tab === 'forge') {
      const pl = it.plus | 0;
      if (pl >= 10) h += idet(it, 'Выбрано') + '<div class="det ok">Предел ковки достигнут.</div>';
      else { const c = forgeCost(it), ch = FORGE_CH[pl], nx = Math.round(it.base[1] * (1 + .1 * (pl + 1))), can = p.gold >= c.gold && (p.shards | 0) >= c.sh;
        h += idet(it, 'Выбрано') + '<div class="det">' + AFF[it.base[0]].n + ': <b>' + baseVal(it) + '</b> → <b class="ok">' + nx + '</b>' + AFF[it.base[0]].u + '<br>Цена: <span class="gd">' + c.gold + ' золота</span> и <span style="color:#8ad0ff">' + c.sh + ' ◆</span> · Шанс: <b class="' + (ch >= 80 ? 'ok' : ch >= 40 ? 'gd' : 'bad') + '">' + ch + '%</b>' + (pl >= 6 ? '<br><span class="bad">При провале вещь упадёт до +' + (pl - 1) + '.</span>' : pl >= 3 ? '<br><span class="q">При провале материалы сгорят.</span>' : '') + '</div><button class="btn gold" style="width:100%;margin-top:8px" data-a="forge"' + (can ? '' : ' disabled') + '>Ковать до +' + (pl + 1) + (can ? '' : ' (не хватает)') + '</button>'; }
    } else {
      const base = Object.keys(p.souls).filter(id => SOULS[id]); if (st.esel && !p.souls[st.esel]) st.esel = null;
      h += idet(it, 'Выбрано') + '<h3>Какую душу вплавить</h3><div class="grid">' + (base.length ? base.map(id => card(id, p.souls[id], st.esel === id ? 'sel' : '', 'esel')).join('') : '<span class="q">Нет базовых душ</span>') + '</div>';
      if (st.esel) { const el = SOULS[st.esel].el; h += '<div class="det">' + elChip(el) + ' ' + enchDesc(it.slot, el) + '.' + (p.souls[st.esel] === 1 ? '<div class="bad">Последняя копия: «' + esc(SOULS[st.esel].name) + '» исчезнет.</div>' : '') + (it.ench ? '<div class="q">Заменит текущее зачарование.</div>' : '') + '</div>'; }
      h += '<button class="btn gold" style="width:100%;margin-top:8px" data-a="ench"' + (st.esel && p.gold >= ENCH_COST ? '' : ' disabled') + '>Зачаровать за ' + ENCH_COST + ' золота' + (p.gold < ENCH_COST ? ' (не хватает)' : '') + '</button>';
    }
    show(h);
  }
  function tabFuse(p) {
    if (!st.atAltar) return '<div class="det">Сливать души можно только у <b>Алтаря душ</b> в городе.</div>';
    if (st.res) { const d = soulDef(st.res.id), uq = Object.keys(G.J.recipes).filter(k => CHIMERAS[G.J.recipes[k]]).length; return '<div class="big"><img src="' + iconUrl(d.icon) + '"><div><b>' + esc(d.name) + '</b><br><small class="gd">' + (st.res.isNew ? (d.unique ? '✦ НОВАЯ УНИКАЛЬНАЯ ХИМЕРА (' + uq + '/10)' : 'Новая химера') : 'Ещё одна копия') + '</small></div></div><div class="det">' + d.els.map(elChip).join(' ') + '<br>' + esc(d.desc) + '</div><button class="btn" style="width:100%;margin-top:8px" data-a="again">Сливать ещё</button>'; }
    const base = Object.keys(p.souls).filter(id => SOULS[id]);
    const box = (id, k) => '<div class="slot" data-a="unf" data-v="' + k + '" style="min-height:66px">' + (id ? '<img src="' + iconUrl(soulDef(id).icon) + '"><br>' + esc(SOULS[id].mob) : '<br><span class="q">душа ' + (k === 'a' ? '1' : '2') + '</span>') + '</div>';
    let res = '<span class="q">???</span>', warn = '';
    if (st.fa && st.fb) { const known = G.J.recipes[recipeKey(st.fa, st.fb)] && CHIMERAS[G.J.recipes[recipeKey(st.fa, st.fb)]] ? G.J.recipes[recipeKey(st.fa, st.fb)] : G.J.recipes[st.fa + '>' + st.fb]; if (known) { const d = soulDef(known); res = '<img src="' + iconUrl(d.icon) + '"><br>' + esc(d.name); } for (const id of [st.fa, st.fb]) if (p.souls[id] === 1) warn += '<div class="bad">Последняя копия: «' + esc(SOULS[id].name) + '» исчезнет.</div>'; }
    let h = '<div class="slots" style="align-items:center">' + box(st.fa, 'a') + '<b style="font-size:22px">+</b>' + box(st.fb, 'b') + '<b style="font-size:22px">=</b><div class="slot" style="min-height:66px;border-color:#ffd870">' + res + '</div></div>';
    h += '<div class="grid">' + (base.length ? base.map(id => card(id, p.souls[id], (st.fa === id || st.fb === id ? 'sel' : ''), 'pick')).join('') : '<span class="q">Нет базовых душ</span>') + '</div>';
    h += '<!--R--><div class="det">Слияние тратит по одной копии каждой души и <span class="gd">' + FUSE_COST + ' золота</span>. Рецепты скрыты — открытые попадают в Журнал. Порядок душ бывает важен.' + warn + '</div>';
    h += '<button class="btn gold" style="width:100%;margin-top:8px" data-a="fuse"' + (canFuse(p, st.fa, st.fb) ? '' : ' disabled') + '>Слить души' + (p.gold < FUSE_COST ? ' (не хватает золота)' : '') + '</button>';
    return h;
  }
  function tabJournal(p) {
    const J = G.J; let h = '<h3>Реакции стихий (' + Object.keys(J.reactions).length + '/5)</h3><ul class="j">';
    for (const id in REACT) { const R = REACT[id], n = J.reactions[id]; h += n ? '<li><b style="color:' + R.c + '">' + R.n + '</b> ×' + n + ' — ' + R.d + '</li>' : '<li class="q">??? — ' + R.els.map(e => EL[e].n).join(' + ') + '</li>'; }
    const found = {}; for (const k in J.recipes) found[J.recipes[k]] = k;
    const uq = Object.keys(CHIMERAS), fu = uq.filter(id => found[id]);
    h += '</ul><h3>Уникальные химеры (' + fu.length + '/10)</h3><ul class="j">';
    for (const id of uq) { const c = CHIMERAS[id]; h += found[id] ? '<li><img src="' + iconUrl(soulDef(id).icon) + '" style="width:16px;height:16px;image-rendering:pixelated;vertical-align:middle"> ' + SOULS[c.from[0]].mob + ' + ' + SOULS[c.from[1]].mob + ' = <b>' + c.name + '</b></li>' : '<li class="q">??? + ??? = ???</li>'; }
    const pr = Object.keys(J.recipes).filter(k => !CHIMERAS[J.recipes[k]]);
    h += '</ul><h3>Прочие химеры (' + pr.length + ')</h3><ul class="j">' + (pr.length ? pr.map(k => { const ab = k.split('>'); return '<li>' + SOULS[ab[0]].mob + ' + ' + SOULS[ab[1]].mob + ' = <b>' + esc(soulDef(J.recipes[k]).name) + '</b></li>'; }).join('') : '<li class="q">Пока ни одной</li>') + '</ul>';
    h += '<h3>Души (' + Object.keys(SOULS).filter(id => J.obtained[id]).length + '/' + Object.keys(SOULS).length + ')</h3><div class="row">' + Object.keys(SOULS).map(id => J.obtained[id] ? '<img title="' + SOULS[id].name + '" src="' + iconUrl(soulDef(id).icon) + '" style="width:32px;height:32px;image-rendering:pixelated">' : '<span class="q" style="width:32px;text-align:center;font-size:22px">?</span>').join('') + '</div>';
    h += '<h3>Летопись</h3><ul class="j"><li>Убито врагов: ' + J.kills + '</li><li>Смертей: ' + J.deaths + '</li><li>Теней повержено: ' + J.nemKills + (G.nemesis && !G.nemesis.dead ? ' · <span class="bad">' + esc(G.nemesis.name) + ' ждёт (ур. ' + G.nemesis.lvl + ', держит ' + G.nemesis.nd.gold + ' зол.)</span>' : '') + '</li><li>Подземелий пройдено: ' + Object.values(J.dungeons || {}).reduce((a, c) => a + c, 0) + ' (' + Object.keys(J.dungeons || {}).length + '/' + DUNGEONS.length + ' разных)</li><li>Лагерей зачищено: ' + (J.camps || 0) + '</li><li>Пепельный Волк повержен: ' + J.bossKills + '</li></ul>';
    return h;
  }

  // ---------- Магазин ----------
  function openShop() { if (!G.started || G.me.dead) return; st = { kind: 'shop' }; drawShop(); }
  function drawShop() {
    const p = G.me, mx = Math.min(POTION_MAX - p.potions, Math.floor(p.gold / POTION_COST));
    show('<button class="btn x" data-a="close">✕</button><h2>Торговец' + res(p) + '</h2><div class="det">«Свежие зелья! Тени в лесу сами себя не убьют.»<br><br>Зелье лечения: восстанавливает 35% здоровья.<br>Цена: <span class="gd">' + POTION_COST + ' золота</span>. В сумке: <b>' + p.potions + ' / ' + POTION_MAX + '</b>. Золото: <span class="gd">● ' + p.gold + '</span></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn gold" data-a="buy" data-v="1"' + (mx >= 1 ? '' : ' disabled') + '>Купить 1</button><button class="btn gold" data-a="buy" data-v="' + mx + '"' + (mx >= 2 ? '' : ' disabled') + '>Купить ' + (mx >= 2 ? mx : 'все') + ' (' + Math.max(0, mx) * POTION_COST + ')</button><button class="btn" data-a="close">Уйти</button></div><h3>Твои вещи</h3>' + tabGear(p, true));
  }

  function act(a, v) {
    const p = G.me;
    if (a === 'close') return close();
    if (a === 'cont') return begin(loadSave());
    if (a === 'look') { const q = v.split(':'); st.look[q[0]] = +q[1]; return title(); }
    if (a === 'new') { if (loadSave() && !st.confirm) { st.confirm = true; const b = document.getElementById('newb'); b.textContent = 'Точно? Нажми ещё раз — сохранение сотрётся'; b.classList.add('red'); return; } return begin(null); }
    if (a === 'tab') { st.tab = v; st.res = null; return drawAltar(); }
    if (a === 'sel') { st.sel = st.sel === v ? null : v; return drawAltar(); }
    if (a === 'slot') { const i = +v; if (st.sel) { if (p.slots[i] === st.sel) { p.slots[i] = null; resetSlot(p, i); } else equip(p, st.sel, i); } else if (p.slots[i]) st.sel = p.slots[i]; return drawAltar(); }
    if (a === 'pick') { if (st.fa === v) st.fa = null; else if (st.fb === v) st.fb = null; else if (!st.fa) st.fa = v; else st.fb = v; return drawAltar(); }
    if (a === 'unf') { if (v === 'a') st.fa = null; else st.fb = null; return drawAltar(); }
    if (a === 'fuse') { const r = fuse(p, st.fa, st.fb); if (r) { st.res = r; st.fa = st.fb = null; } return drawAltar(); }
    if (a === 'again') { st.res = null; return drawAltar(); }
    const redraw = () => { if (st.kind !== 'smith') st.msg = ''; return st.kind === 'shop' ? drawShop() : st.kind === 'smith' ? drawSmith() : drawAltar(); };
    if (a === 'stab') { st.tab = v; st.msg = ''; return drawSmith(); }
    if (a === 'esel') { st.esel = st.esel === v ? null : v; st.msg = ''; return drawSmith(); }
    if (a === 'ibreak') { const it = findItem(p, st.isel), i = p.bag.indexOf(it); if (i >= 0) { p.bag.splice(i, 1); p.shards = (p.shards | 0) + shardsOf(it); st.isel = null; Sfx.play('hit'); } return redraw(); }
    if (a === 'forge') { const it = findItem(p, st.isel); if (!it) return; const pl = it.plus | 0, c = forgeCost(it); if (pl >= 10 || p.gold < c.gold || (p.shards | 0) < c.sh) return;
      p.gold -= c.gold; p.shards -= c.sh;
      if (chance(FORGE_CH[pl] / 100)) { it.plus = pl + 1; st.msg = '<span class="ok">Удар молота... Удача! Теперь ' + esc(itemName(it)) + '</span>'; Sfx.play('levelup'); }
      else if (pl >= 6) { it.plus = pl - 1; st.msg = '<span class="bad">Металл треснул. Вещь ослабла до +' + it.plus + '</span>'; Sfx.play('death'); }
      else { st.msg = '<span class="bad">Провал. Материалы сгорели в горне</span>'; Sfx.play('deny'); }
      recalc(p); saveGame(); return drawSmith(); }
    if (a === 'ench') { const it = findItem(p, st.isel); if (!it || !st.esel || !p.souls[st.esel] || p.gold < ENCH_COST) return; p.gold -= ENCH_COST; it.ench = st.esel; takeSoul(p, st.esel); st.msg = '<span style="color:' + EL[SOULS[it.ench].el].c + '">✦ Душа вплавлена: ' + esc(itemName(it)) + ' теперь несёт стихию «' + EL[SOULS[it.ench].el].n + '»</span>'; st.esel = null; Sfx.play('fuse'); recalc(p); saveGame(); return drawSmith(); }
    if (a === 'isel' && st.kind === 'smith') { st.isel = st.isel === v || !v ? null : v; st.msg = ''; return drawSmith(); }
    if (a === 'isel') { st.isel = st.isel === v || !v ? null : v; return redraw(); }
    if (a === 'ieq') { const it = findItem(p, st.isel); if (it) equipItem(p, it); return redraw(); }
    if (a === 'iun') { unequipItem(p, v); return redraw(); }
    if (a === 'isell') { const it = findItem(p, st.isel), i = p.bag.indexOf(it); if (i >= 0) { p.bag.splice(i, 1); p.gold += itemPrice(it); st.isel = null; Sfx.play('coin'); } return redraw(); }
    if (a === 'ijunk') { for (let i = p.bag.length - 1; i >= 0; i--) if (p.bag[i].rank === 0) { p.gold += itemPrice(p.bag[i]); p.bag.splice(i, 1); } Sfx.play('coin'); return redraw(); }
    if (a === 'buy') { const n = Math.min(+v, POTION_MAX - p.potions, Math.floor(p.gold / POTION_COST)); if (n > 0) { p.gold -= n * POTION_COST; p.potions += n; Sfx.play('coin'); } return drawShop(); }
  }
  ui.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (!t || t.disabled) return; Sfx.init(); Sfx.play('ui'); act(t.dataset.a, t.dataset.v); });
  window.addEventListener('keydown', e => {
    if (!st) return;
    if (st.kind === 'title') { if (e.code === 'Enter') { const s = loadSave(); if (s && !(document.getElementById('nm').value.trim())) begin(s); else if (!s) begin(null); } return; }
    const hk = { KeyI: 'gear', KeyK: 'souls', KeyJ: 'journal', KeyM: 'map' }[e.code];
    if (hk && st.kind === 'altar') { e.preventDefault(); if (st.tab === hk) close(); else { st.tab = hk; st.res = null; drawAltar(); } return; }
    if (e.code === 'Escape' || e.code === 'Tab' || e.code === 'KeyE') { e.preventDefault(); close(); }
  });
  Bus.on('menuKey', (t) => openAltar(false, t || lastTab));
  Bus.on('interact', (p, n) => {
    if (p !== G.me) return;
    if (n.o === O.ALTAR) openAltar(true); else if (n.o === O.MERCH) openShop(); else if (n.o === O.SMITH) openSmith();
    else if (n.o === O.STONE) { p.hp = p.maxHp; p.st = {}; floatText(p.x, p.y, 'Силы восстановлены. Игра сохранена', '#5af0ff', 7); Sfx.play('potion'); fxRing(n.x, n.y, .3, 2.5, '#5af0ff', .5); if (typeof saveGame === 'function') saveGame(); }
  });
  return { title, openAltar, openShop, close, isOpen };
})();
