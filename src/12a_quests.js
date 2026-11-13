// Сюжет и задания. Задания — данные; прогресс лежит в журнале игрока (G.J.quests) и сохраняется.
const NPCS = { elder: { name: 'Старейшина Мирра', spr: 'elder' }, merch: { name: 'Торговец Гнус', spr: 'merch' }, smith: { name: 'Кузнец Бран', spr: 'smith' } };
const QUESTS = {
  m1: { main: 1, giver: 'elder', title: 'Пробуждение', intro: ['Очнулся. Значит, камень ещё помнит, как возвращать мёртвых.', 'Это Последний Очаг. Всё, что осталось от людей по эту сторону леса. Дальше — только Шёпот.', 'Ты — Пожиратель. Души зверей не уходят из тебя, а остаются. Это дар. И это то, что тебя убьёт.', 'Сначала докажи, что годен. Опушка кишит тварями. Убей шестерых и возвращайся.'], obj: [{ t: 'kill', n: 6, s: 'Убей тварей' }], done: ['Шестеро. И ты всё ещё стоишь.', 'Ты слышал их, когда они умирали? Шёпот. Запомни его — он будет становиться громче.'], reward: { xp: 40, gold: 40, potions: 1 } },
  m2: { main: 1, giver: 'elder', req: 'm1', title: 'Чужие голоса', intro: ['Одной волчьей души мало. Каждая тварь в лесу носит свою — огонь, воду, яд, грозу.', 'Собери две разные души. Не бойся, если начнёшь слышать их по ночам. Бойся, если перестанешь.'], obj: [{ t: 'souls', n: 2, s: 'Собери разные души' }], done: ['Две. Они уже спорят внутри тебя, верно?', 'Стихии не терпят друг друга. Огонь жжёт траву, молния ищет воду. Заставь их драться за тебя.'], reward: { xp: 60, gold: 50 } },
  m3: { main: 1, giver: 'elder', req: 'm2', title: 'Химера', intro: ['Видишь алтарь? Его сложили те, кто был до тебя. Пожиратели.', 'На нём две души можно сплавить в одну — в химеру. Никто не знает заранее, что выйдет. Рецепты умерли вместе с ними.', 'Создай химеру. Любую. Понадобится по две копии каждой души — алтарь берёт плату.'], obj: [{ t: 'chim', n: 1, s: 'Слей души на Алтаре' }], done: ['Она кричала, когда рождалась? Они всегда кричат.', 'Возьми. Это носил тот, кто пришёл до тебя. Ему уже не нужно.'], reward: { xp: 80, item: 1 } },
  m4: { main: 1, giver: 'elder', req: 'm3', title: 'Красные тотемы', intro: ['Твари в лесу больше не бродят поодиночке. Они ставят частоколы. Тотемы. У них появились вожаки.', 'Звери так не делают. Кто-то их учит.', 'Найди лагерь с красным тотемом и вырежи его весь. Принеси мне душу вожака — хочу знать, чей голос в ней звучит.'], obj: [{ t: 'camp', n: 1, s: 'Зачисти лагерь врагов' }], done: ['Дай взглянуть... Так я и думала. В ней пепел.', 'Весь лес дышит пеплом. Он идёт с востока, из-за Выжженной поляны. Но сперва — три гнезда, что питают его.'], reward: { xp: 120, gold: 80, shards: 5 } },
  m5: { main: 1, giver: 'elder', req: 'm4', title: 'Гнездо Грозы', intro: ['В Чаще, под корнями, есть провал. Оттуда по ночам бьют молнии — снизу вверх.', 'Там сидит Грозовая Матка. Её выводок ослепил троих наших охотников.', 'Спустись и убей её. И запомни: умрёшь внизу — твоя Тень встанет у входа и будет ждать.'], obj: [{ t: 'boss', id: 'stormmother', n: 1, s: 'Убей Грозовую Матку' }], done: ['Гром стих. Впервые за год.', 'Её душа теперь в тебе. Чувствуешь, как она бьётся? Это ещё не самое страшное, что ты проглотишь.'], reward: { xp: 200, gold: 120, item: 2 } },
  m6: { main: 1, giver: 'elder', req: 'm5', title: 'Гниль и кость', intro: ['Осталось два гнезда. На юге, в топях, — Матерь Слизи. Она растворяет всё, к чему прикасается.', 'На севере, на погосте, — Костяной Король. Он был человеком. Пожирателем, как ты.', 'Да. Вот что бывает с теми, кто слушает шёпот слишком долго. Убей обоих.'], obj: [{ t: 'boss', id: 'slimequeen', n: 1, s: 'Убей Матерь Слизи' }, { t: 'boss', id: 'boneking', n: 1, s: 'Убей Костяного Короля' }], done: ['Король узнал тебя перед смертью? Они всегда узнают своих.', 'Теперь лес открыт до самого востока. Остался тот, кто начал всё это.'], reward: { xp: 350, gold: 200, shards: 12 } },
  m7: { main: 1, giver: 'elder', req: 'm6', title: 'Пепельный Волк', intro: ['Его звали Хранителем. Он берёг этот лес тысячу лет.', 'Потом первый Пожиратель съел душу, которую нельзя было есть. Лес загорелся изнутри. Хранитель сгорел вместе с ним — но не умер.', 'Иди на восток, за Выжженную поляну. Убей Пепельного Волка. Дай ему наконец уснуть.'], obj: [{ t: 'boss', id: 'ashwolf', n: 1, s: 'Убей Пепельного Волка' }], done: ['Значит, он мёртв. Тысяча лет — и всё кончилось от руки голодного мертвеца.', 'Ты ждёшь, что я скажу «лес спасён»?'], reward: { xp: 500, gold: 400, item: 3 } },
  m8: { main: 1, giver: 'elder', req: 'm7', title: 'Последняя душа', intro: ['Пепел не шёл от Волка. Волк его сдерживал.', 'Пепел идёт от тебя. От каждой души, что ты проглотил. Ты — тот самый первый Пожиратель. Камень возвращает тебя снова и снова, и ты каждый раз забываешь.', 'А твоя Тень — помнит. Потому и хочет тебя убить. Она — всё, что в тебе осталось человеческого.', 'Лес будет гореть, пока ты ешь. Но теперь ты хотя бы знаешь. Живи с этим, Пожиратель.'], obj: [], done: ['Иди. Тени ждут. И подземелья каждый раз новые — им всегда есть чем тебя встретить.'], reward: { item: 4, shards: 20 } },
  s1: { giver: 'merch', title: 'Грохот в лесу', intro: ['Эй, мертвяк. Ты ж с душами балуешься?', 'Говорят, если их правильно столкнуть — бабахнет так, что зверьё разбегается. Мне бы знать как: караваны целее будут.', 'Открой три разные реакции стихий и расскажи. За мной не заржавеет.'], obj: [{ t: 'react', n: 3, s: 'Открой реакции стихий' }], done: ['Огонь по яду — и взрыв?! Ха! Вот это я понимаю, наука.', 'Держи. Честная сделка.'], reward: { gold: 90, potions: 3 } },
  s2: { giver: 'smith', title: 'Проба железа', intro: ['Ты носишь хлам. Не спорь.', 'Принеси осколки, заплати — и я покажу, чем ковка отличается от ржавчины. Доведи любую надетую вещь до +3.', 'Справишься — отдам клинок, который берёг для того, кто не помрёт в первую же ночь.'], obj: [{ t: 'forge', n: 3, s: 'Надень вещь с ковкой +3' }], done: ['Плюс три. Держит удар. Может, из тебя и выйдет толк.', 'Забирай. Не сломай раньше, чем сломают тебя.'], reward: { xp: 100, slot: 'weapon', item: 2 } },
  s3: { giver: 'elder', req: 'm3', side: 1, title: 'Белые пятна', intro: ['Наши карты сгорели вместе с теми, кто их чертил.', 'Ты всё равно бродишь по лесу. Смотри по сторонам. Разведай четверть земель — мне нужно знать, куда ещё можно отступать.'], obj: [{ t: 'seen', n: 25, s: 'Разведай земли, %' }], done: ['Четверть леса. Больше, чем видел любой из живых.', 'Отступать некуда. Но спасибо, что проверил.'], reward: { xp: 150, shards: 10, gold: 60 } }
};
const QORDER = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 's3', 's1', 's2'];
const Quests = (() => {
  const S = () => (G.J.quests = G.J.quests || {});
  const turned = id => S()[id] && S()[id].st === 'turned';
  function prog(id, i) {
    const o = QUESTS[id].obj[i], s = S()[id], p = G.me;
    switch (o.t) {
      case 'souls': return Object.keys(p.souls).length;
      case 'chim': return Object.keys(G.J.recipes).length;
      case 'react': return Object.keys(G.J.reactions).length;
      case 'seen': { const a = (G.over ? G.over.W : W).seen; let n = 0; for (let k = 0; k < a.length; k += 7) n += a[k]; return Math.floor(n / (a.length / 7) * 100); }
      case 'forge': return Math.max(0, ...ISLOTS.map(k => p.equip[k] ? (p.equip[k].plus | 0) : 0));
      default: return s ? (s.p[i] || 0) : 0;
    }
  }
  const isDone = id => QUESTS[id].obj.every((o, i) => prog(id, i) >= o.n);
  const active = () => QORDER.filter(id => S()[id] && S()[id].st === 'active');
  function avail(g) { for (const id of QORDER) { const q = QUESTS[id]; if (q.giver !== g || S()[id] || (q.req && !turned(q.req))) continue; if (q.main && active().some(a => QUESTS[a].main)) continue; return id; } return null; }
  const ready = g => active().find(id => QUESTS[id].giver === g && isDone(id)) || null;
  function reward(q) {
    const p = G.me, r = q.reward || {}, out = [];
    if (r.xp) { gainXp(p, r.xp); out.push(r.xp + ' опыта'); } if (r.gold) { p.gold += r.gold; out.push(r.gold + ' золота'); }
    if (r.potions) { p.potions = Math.min(POTION_MAX, p.potions + r.potions); out.push('зелья ×' + r.potions); } if (r.shards) { p.shards = (p.shards | 0) + r.shards; out.push(r.shards + ' ◆'); }
    if (r.item !== undefined) { const it = makeItem(Math.max(2, p.lvl + 1), r.item, r.slot); giveItem(p, it); out.push(it.name); }
    return out.join(', ');
  }
  function talk(g) {
    const N = NPCS[g], r = ready(g);
    if (r) { const q = QUESTS[r]; return { name: N.name, spr: N.spr, lines: q.done, last: 'Забрать награду', end() { const txt = reward(q); S()[r].st = 'turned'; banner('ЗАДАНИЕ ВЫПОЛНЕНО', q.title + (txt ? ' · ' + txt : ''), '#e0c060'); Sfx.play('levelup'); if (typeof saveGame === 'function') saveGame(); } }; }
    const a = avail(g);
    if (a) { const q = QUESTS[a]; return { name: N.name, spr: N.spr, lines: q.intro, last: q.obj.length ? 'Принять задание' : 'Дальше', end() { S()[a] = { st: 'active', p: q.obj.map(() => 0) }; if (q.obj.length) { banner(q.main ? 'ГЛАВА: ' + q.title.toUpperCase() : 'ЗАДАНИЕ: ' + q.title.toUpperCase(), q.obj.map(o => o.s).join(' · '), q.main ? '#b8323a' : '#c8a850'); } else return talk(g); } }; }
    if (g !== 'elder') return null;
    const cur = active().find(id => QUESTS[id].giver === g);
    return { name: N.name, spr: N.spr, lines: [cur ? 'Ты ещё не закончил. «' + QUESTS[cur].title + '» — помнишь? Шёпот не ждёт.' : turned('m8') ? 'Камень снова вернёт тебя. Он всегда возвращает.' : 'Мне нечего тебе сказать. Пока.'], last: 'Уйти' };
  }
  const mark = g => ready(g) ? '?' : avail(g) ? '!' : '';
  Bus.on('mobDeath', (m) => { if (m.owner || m.summoned || !G.me || dist(m.x, m.y, G.me.x, G.me.y) > 25) return; for (const id of active()) QUESTS[id].obj.forEach((o, i) => { if (o.t === 'kill') S()[id].p[i]++; else if (o.t === 'boss' && o.id === m.type) S()[id].p[i] = 1; }); });
  Bus.on('campClear', () => { for (const id of active()) QUESTS[id].obj.forEach((o, i) => { if (o.t === 'camp') S()[id].p[i]++; }); });
  // трекер на экране
  G.hud.push(() => {
    if (!G.started || !G.me || G.me.dead || G.prologue) return; let y = 76; const x = V.w - 4, A = active();
    if (!A.length && !turned('m1') && !S().m1) { txt('! Поговори со Старейшиной', x, y, '#e0c060', 5.5, 'right'); return; }
    for (const id of A.slice(0, 3)) {
      const q = QUESTS[id], dn = isDone(id); txt((q.main ? '◆ ' : '◇ ') + q.title, x, y, q.main ? '#ff8a8a' : '#e0c060', 5.5, 'right'); y += 8;
      if (dn) { txt('Вернись: ' + NPCS[q.giver].name, x, y, '#8fd07a', 5, 'right'); y += 7; }
      else q.obj.forEach((o, i) => { const v = Math.min(o.n, prog(id, i)); txt(o.s + (o.n > 1 ? ' ' + v + '/' + o.n : ''), x, y, v >= o.n ? '#8fd07a' : '#d6cdb8', 5, 'right'); y += 7; });
      y += 3;
    }
  });
  return { talk, mark, active, isDone, prog, turned, S };
})();
