// Меню (DOM поверх канваса): старт, Алтарь душ (Души / Слияние / Журнал), магазин
const Menus = (() => {
  const ui = document.getElementById('ui'); let st = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stars = n => '★'.repeat(starsOf(n)) + '<span class="q">' + '★'.repeat(3 - starsOf(n)) + '</span>';
  const elChip = el => '<span class="el" style="background:' + EL[el].c + '">' + EL[el].n + '</span>';
  function show(html) { ui.innerHTML = '<div class="panel">' + html + '</div>'; ui.classList.add('on'); G.paused = true; Input.clear(); }
  function close() { if (!st || st.kind === 'title') return; ui.classList.remove('on'); ui.innerHTML = ''; st = null; G.paused = false; Input.clear(); G.noKeyUntil = performance.now() + 250; Bus.emit('menuClosed'); }
  const isOpen = () => !!st;
  function card(id, n, cls, act) { const d = soulDef(id); return '<div class="soul ' + (cls || '') + '" data-a="' + act + '" data-v="' + id + '"><img src="' + iconUrl(d.icon) + '"><div><b>' + esc(d.abName) + '</b><small>' + stars(n) + ' ×' + n + '</small></div></div>'; }

  // ---------- Старт ----------
  function title() {
    st = { kind: 'title', confirm: false }; const s = loadSave();
    show('<h1>ПОЖИРАТЕЛЬ ДУШ</h1><div class="sub">изометрическая экшн-RPG · души вместо классов</div>' +
      (s ? '<button class="btn gold" style="width:100%;margin-bottom:10px" data-a="cont">Продолжить: ' + esc(s.name) + ', ур. ' + (s.lvl | 0) + '</button>' : '') +
      '<input class="name" id="nm" maxlength="12" placeholder="Имя героя" value="' + (s ? '' : 'Герой') + '">' +
      '<button class="btn" style="width:100%;margin-top:8px" data-a="new" id="newb">' + (s ? 'Новая игра (сотрёт сохранение)' : 'Начать игру') + '</button>' +
      '<div class="help"><b>ПК:</b> <kbd>WASD</kbd> движение · <kbd>мышь</kbd> прицел · <kbd>ЛКМ</kbd> удар · <kbd>Пробел</kbd> перекат · <kbd>1</kbd>–<kbd>4</kbd> души · <kbd>Q</kbd> зелье · <kbd>E</kbd> взаимодействие · <kbd>Tab</kbd> души и журнал<br>' +
      '<b>Телефон:</b> джойстик слева, кнопки справа, автоприцел на ближайшего врага.<br><br>' +
      'Мобы роняют свои <b>души</b> — способность + стихия. Стихии вступают в <b>реакции</b>. На Алтаре души сливаются в <b>химер</b>. А если погибнешь — твой труп встанет <b>Тенью</b> с твоими же душами.</div>');
  }
  function begin(save) {
    const nm = document.getElementById('nm'), name = (nm && nm.value.trim()) || 'Герой';
    ui.classList.remove('on'); ui.innerHTML = ''; st = null; Sfx.init();
    if (save) startGame({ name: save.name, save }); else { wipeSave(); startGame({ name: name.slice(0, 12) }); }
  }

  // ---------- Алтарь ----------
  function openAltar(atAltar, tab) { if (!G.started || G.me.dead) return; st = { kind: 'altar', tab: tab || 'souls', sel: null, fa: null, fb: null, atAltar, res: null }; drawAltar(); }
  function drawAltar() {
    const p = G.me, t = st.tab; let h = '<button class="btn x" data-a="close">✕</button><h2>' + (st.atAltar ? 'Алтарь душ' : 'Души и журнал') + ' <span class="gd" style="font-size:14px">● ' + p.gold + '</span></h2>';
    h += '<div class="tabs">' + [['souls', 'Души'], ['fuse', 'Слияние'], ['journal', 'Журнал']].map(x => '<button class="btn ' + (t === x[0] ? 'act' : '') + '" data-a="tab" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
    if (t === 'souls') h += tabSouls(p); else if (t === 'fuse') h += tabFuse(p); else h += tabJournal(p);
    show(h);
  }
  function tabSouls(p) {
    let h = '<div class="slots">' + p.slots.map((id, i) => '<div class="slot" data-a="slot" data-v="' + i + '"><i>' + (i + 1) + '</i>' + (id ? '<img src="' + iconUrl(soulDef(id).icon) + '"><br>' + esc(soulDef(id).abName) : '<br><span class="q">пусто</span>') + '</div>').join('') + '</div>';
    const ids = Object.keys(p.souls); if (st.sel && !p.souls[st.sel]) st.sel = null;
    h += '<div class="grid">' + ids.map(id => card(id, p.souls[id], (st.sel === id ? 'sel' : ''), 'sel')).join('') + '</div>';
    if (st.sel) {
      const d = soulDef(st.sel), n = p.souls[st.sel], sN = starsOf(n);
      h += '<div class="det"><b style="font-size:16px">' + esc(d.name) + '</b> ' + stars(n) + '<br>' + d.els.map(elChip).join(' ') + ' · перезарядка ' + AB[d.ab].cd + ' с<br>' + esc(d.desc) + '<br>' +
        '<span class="gd">★3: ' + esc(d.s3 || '—') + '</span> · ' + (sN >= 3 ? '<span class="ok">максимум</span>' : 'до ★' + (sN + 1) + ': ' + n + '/' + (sN === 1 ? 3 : 6) + ' копий') + ' · урон +' + (sN - 1) * 25 + '%' +
        '<br><span class="q">Нажми на слот сверху, чтобы поставить душу' + (p.slots.indexOf(st.sel) >= 0 ? ' (или убрать)' : '') + '.</span></div>';
    } else h += '<div class="det q">Выбери душу, затем нажми на слот. Дубликаты усиливают душу: ★2 — 3 копии, ★3 — 6 копий.</div>';
    return h;
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
    h += '<div class="det">Слияние тратит по одной копии каждой души и <span class="gd">' + FUSE_COST + ' золота</span>. Рецепты скрыты — открытые попадают в Журнал. Порядок душ бывает важен.' + warn + '</div>';
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
    h += '<h3>Души (' + Object.keys(SOULS).filter(id => J.obtained[id]).length + '/10)</h3><div class="row">' + Object.keys(SOULS).map(id => J.obtained[id] ? '<img title="' + SOULS[id].name + '" src="' + iconUrl(soulDef(id).icon) + '" style="width:32px;height:32px;image-rendering:pixelated">' : '<span class="q" style="width:32px;text-align:center;font-size:22px">?</span>').join('') + '</div>';
    h += '<h3>Летопись</h3><ul class="j"><li>Убито врагов: ' + J.kills + '</li><li>Смертей: ' + J.deaths + '</li><li>Теней повержено: ' + J.nemKills + (G.nemesis && !G.nemesis.dead ? ' · <span class="bad">' + esc(G.nemesis.name) + ' ждёт (ур. ' + G.nemesis.lvl + ', держит ' + G.nemesis.nd.gold + ' зол.)</span>' : '') + '</li><li>Пепельный Волк повержен: ' + J.bossKills + '</li></ul>';
    return h;
  }

  // ---------- Магазин ----------
  function openShop() { if (!G.started || G.me.dead) return; st = { kind: 'shop' }; drawShop(); }
  function drawShop() {
    const p = G.me, mx = Math.min(POTION_MAX - p.potions, Math.floor(p.gold / POTION_COST));
    show('<button class="btn x" data-a="close">✕</button><h2>Торговец зельями</h2><div class="det">«Свежие зелья! Тени в лесу сами себя не убьют.»<br><br>Зелье лечения: восстанавливает 45% здоровья.<br>Цена: <span class="gd">' + POTION_COST + ' золота</span>. В сумке: <b>' + p.potions + ' / ' + POTION_MAX + '</b>. Золото: <span class="gd">● ' + p.gold + '</span></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn gold" data-a="buy" data-v="1"' + (mx >= 1 ? '' : ' disabled') + '>Купить 1</button><button class="btn gold" data-a="buy" data-v="' + mx + '"' + (mx >= 2 ? '' : ' disabled') + '>Купить ' + (mx >= 2 ? mx : 'все') + ' (' + Math.max(0, mx) * POTION_COST + ')</button><button class="btn" data-a="close">Уйти</button></div>');
  }

  function act(a, v) {
    const p = G.me;
    if (a === 'close') return close();
    if (a === 'cont') return begin(loadSave());
    if (a === 'new') { if (loadSave() && !st.confirm) { st.confirm = true; const b = document.getElementById('newb'); b.textContent = 'Точно? Нажми ещё раз — сохранение сотрётся'; b.classList.add('red'); return; } return begin(null); }
    if (a === 'tab') { st.tab = v; st.res = null; return drawAltar(); }
    if (a === 'sel') { st.sel = st.sel === v ? null : v; return drawAltar(); }
    if (a === 'slot') { const i = +v; if (st.sel) { if (p.slots[i] === st.sel) { p.slots[i] = null; resetSlot(p, i); } else equip(p, st.sel, i); } else if (p.slots[i]) st.sel = p.slots[i]; return drawAltar(); }
    if (a === 'pick') { if (st.fa === v) st.fa = null; else if (st.fb === v) st.fb = null; else if (!st.fa) st.fa = v; else st.fb = v; return drawAltar(); }
    if (a === 'unf') { if (v === 'a') st.fa = null; else st.fb = null; return drawAltar(); }
    if (a === 'fuse') { const r = fuse(p, st.fa, st.fb); if (r) { st.res = r; st.fa = st.fb = null; } return drawAltar(); }
    if (a === 'again') { st.res = null; return drawAltar(); }
    if (a === 'buy') { const n = Math.min(+v, POTION_MAX - p.potions, Math.floor(p.gold / POTION_COST)); if (n > 0) { p.gold -= n * POTION_COST; p.potions += n; Sfx.play('coin'); } return drawShop(); }
  }
  ui.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (!t || t.disabled) return; Sfx.init(); Sfx.play('ui'); act(t.dataset.a, t.dataset.v); });
  window.addEventListener('keydown', e => {
    if (!st) return;
    if (st.kind === 'title') { if (e.code === 'Enter') { const s = loadSave(); if (s && !(document.getElementById('nm').value.trim())) begin(s); else if (!s) begin(null); } return; }
    if (e.code === 'Escape' || e.code === 'Tab' || e.code === 'KeyE' || e.code === 'KeyI') { e.preventDefault(); close(); }
  });
  Bus.on('menuKey', () => openAltar(false));
  Bus.on('interact', (p, n) => {
    if (p !== G.me) return;
    if (n.o === O.ALTAR) openAltar(true); else if (n.o === O.MERCH) openShop();
    else { p.hp = p.maxHp; p.st = {}; floatText(p.x, p.y, 'Силы восстановлены. Игра сохранена', '#5af0ff', 7); Sfx.play('potion'); fxRing(n.x, n.y, .3, 2.5, '#5af0ff', .5); if (typeof saveGame === 'function') saveGame(); }
  });
  return { title, openAltar, openShop, close, isOpen };
})();
