// Души: способность + стихия. Химеры: 10 уникальных рецептов + процедурные (способность первой + стихия второй).
const SOULS = {
  wolf: { name: 'Душа волка', mob: 'Волк', ab: 'dash', el: 'beast', abName: 'Рывок', desc: 'Рывок сквозь врагов с уроном. Неуязвимость на время рывка.', s3: 'Два заряда' },
  imp: { name: 'Душа беса', mob: 'Бес', ab: 'ball', el: 'fire', abName: 'Огненный шар', desc: 'Взрывается, поджигает врагов и траву.', s3: 'Три шара веером' },
  water: { name: 'Душа водяного духа', mob: 'Водяной дух', ab: 'wave', el: 'water', abName: 'Волна', desc: 'Отталкивает врагов, мочит их и оставляет лужи.', s3: 'Шире волна, лужи дольше' },
  bat: { name: 'Душа грозовой мыши', mob: 'Грозовая мышь', ab: 'chain', el: 'storm', abName: 'Цепная молния', desc: 'Перескакивает между врагами. Мокрые получают «Разряд».', s3: 'До 6 целей' },
  falcon: { name: 'Душа ветряного сокола', mob: 'Сокол', ab: 'whirl', el: 'wind', abName: 'Вихрь', desc: 'Летящий вихрь раскидывает врагов. Пройдя через огонь — загорается.', s3: 'Больше и дольше' },
  shroom: { name: 'Душа ядогриба', mob: 'Ядогриб', ab: 'cloud', el: 'poison', abName: 'Ядовитое облако', desc: 'Облако травит всех внутри. Огонь его взрывает.', s3: 'Больше радиус' },
  root: { name: 'Душа корня-хваталы', mob: 'Корень', ab: 'roots', el: 'nature', abName: 'Хватка корней', desc: 'Линия корней бьёт и обездвиживает.', s3: 'Длиннее, держит 3 сек' },
  skel: { name: 'Душа скелета-лучника', mob: 'Скелет', ab: 'arrows', el: 'bone', abName: 'Веер стрел', desc: 'Пять стрел веером. Делают цель хрупкой.', s3: 'Пробивают насквозь' },
  slime: { name: 'Душа слизня', mob: 'Слизень', ab: 'shield', el: 'slime', abName: 'Щит слизи', desc: 'Щит поглощает урон 6 секунд.', s3: 'Замедляет атакующих' },
  boneking: { name: 'Душа Костяного Короля', mob: 'Костяной Король', ab: 'bonecage', el: 'bone', abName: 'Костяная клеть', desc: 'Ульта: кольцо костяных шипов оглушает и ранит всех внутри.', s3: 'Больше шипов', boss: true },
  slimequeen: { name: 'Душа Матери Слизи', mob: 'Матерь Слизи', ab: 'tidal', el: 'poison', abName: 'Гнилой прилив', desc: 'Ульта: три ядовитые волны веером отбрасывают врагов.', s3: 'Пять волн', boss: true },
  stormmother: { name: 'Душа Грозовой Матки', mob: 'Грозовая Матка', ab: 'tempest', el: 'storm', abName: 'Гроза', desc: 'Ульта: молнии бьют с неба по всем врагам вокруг.', s3: 'Больше молний', boss: true },
  ashwolf: { name: 'Душа Пепельного Волка', mob: 'Пепельный Волк', ab: 'ashstorm', el: 'ash', abName: 'Пепельная буря', desc: 'Ульта: град горящего пепла по области.', s3: 'Больше ударов', boss: true }
};
const CHIMERAS = {
  ch_blazedash: { name: 'Пылающий рывок', ab: 'blazedash', el: 'fire', els: ['beast', 'fire'], glyph: 'dash', from: ['wolf', 'imp'], desc: 'Рывок оставляет за собой полосу огня.' },
  ch_thundercloud: { name: 'Грозовая туча', ab: 'thundercloud', el: 'storm', els: ['storm', 'water'], glyph: 'cloud', from: ['bat', 'water'], desc: 'Туча над головой: мочит и бьёт молнией ближайших врагов.' },
  ch_firewhirl: { name: 'Огненный смерч', ab: 'firewhirl', el: 'fire', els: ['wind', 'fire'], glyph: 'whirl', from: ['falcon', 'imp'], desc: 'Большой огненный вихрь: раскидывает и поджигает всё на пути.' },
  ch_rotbomb: { name: 'Гнилая бомба', ab: 'rotbomb', el: 'poison', els: ['poison', 'fire'], glyph: 'bomb', from: ['shroom', 'imp'], desc: 'Бомба оставляет ядовитое облако, которое через секунду взрывается.' },
  ch_swamp: { name: 'Болотная топь', ab: 'swamp', el: 'nature', els: ['nature', 'water'], glyph: 'wave', from: ['root', 'water'], desc: 'Топь замедляет, мочит и ранит врагов.' },
  ch_thunderarrows: { name: 'Громовые стрелы', ab: 'thunderarrows', el: 'storm', els: ['bone', 'storm'], glyph: 'arrows', from: ['skel', 'bat'], desc: 'Стрелы, от которых молния перескакивает на соседей.' },
  ch_healbubble: { name: 'Лечащий пузырь', ab: 'healbubble', el: 'water', els: ['slime', 'water'], glyph: 'bubble', from: ['slime', 'water'], desc: 'Пузырь лечит союзников и снимает огонь и яд.' },
  ch_pack: { name: 'Призрачная стая', ab: 'pack', el: 'beast', els: ['beast', 'wind'], glyph: 'paw', from: ['wolf', 'falcon'], desc: 'Три призрачных волка на 6 секунд.' },
  ch_sporeforest: { name: 'Споровый лес', ab: 'sporeforest', el: 'poison', els: ['nature', 'poison'], glyph: 'roots', from: ['root', 'shroom'], desc: 'Грибная поляна травит и хватает врагов корнями.' },
  ch_geyser: { name: 'Паровой гейзер', ab: 'geyser', el: 'water', els: ['fire', 'water'], glyph: 'geyser', from: ['imp', 'water'], desc: 'Гейзер подбрасывает врагов и оставляет облако пара.' }
};
const RECIPES = {};
for (const id in CHIMERAS) RECIPES[CHIMERAS[id].from.slice().sort().join('+')] = id;
const FUSE_COST = 40;
const SDEF = {};
function soulDef(id) {
  if (SDEF[id]) return SDEF[id]; let d = null;
  if (SOULS[id]) { const s = SOULS[id]; d = Object.assign({ id, base: true, els: [s.el], icon: makeIcon(id, s.ab, EL[s.el].c) }, s); }
  else if (CHIMERAS[id]) { const c = CHIMERAS[id]; d = Object.assign({ id, chimera: true, unique: true, abName: c.name, mult: 1.15, s3: 'Сильнее и дольше', icon: makeIcon(id, c.glyph, EL[c.els[0]].c, EL[c.els[1]].c) }, c); }
  else if (id.slice(0, 2) === 'p_') {
    const pp = id.split('_'), a = SOULS[pp[1]], b = SOULS[pp[2]]; if (!a || !b) return SDEF[id] = soulDef('wolf');
    const A = AB[a.ab], nm = EL[b.el].adj[A.g] + ' ' + A.noun;
    d = { id, chimera: true, name: nm, abName: nm, ab: a.ab, el: b.el, els: [a.el, b.el], mult: 1.3, from: [pp[1], pp[2]], desc: a.abName + ' со стихией «' + EL[b.el].n + '». Урон +30%.', s3: a.s3, icon: makeIcon(id, a.ab, EL[a.el].c, EL[b.el].c) };
  } else return soulDef('wolf');
  return SDEF[id] = d;
}
const recipeKey = (a, b) => [a, b].sort().join('+');
// Что получится из a+b (порядок важен только для процедурных)
function fuseResult(a, b) { return RECIPES[recipeKey(a, b)] || ('p_' + a + '_' + b); }
function canFuse(p, a, b) { return a && b && a !== b && SOULS[a] && SOULS[b] && p.souls[a] >= 1 && p.souls[b] >= 1 && p.gold >= FUSE_COST; }
function fuse(p, a, b) {
  if (!canFuse(p, a, b)) return null;
  const id = fuseResult(a, b), isNew = !G.J.recipes[a + '>' + b] && !(CHIMERAS[id] && G.J.recipes[recipeKey(a, b)]);
  p.gold -= FUSE_COST; takeSoul(p, a); takeSoul(p, b);
  G.J.recipes[CHIMERAS[id] ? recipeKey(a, b) : a + '>' + b] = id;
  giveSoul(p, id, 1, true); Sfx.play('fuse'); Bus.emit('fused', id, isNew);
  return { id, isNew };
}
