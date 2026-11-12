// Сохранение в localStorage (всё в try/catch — в приватном режиме может быть недоступно)
const SAVE_KEY = 'soul_eater_save_v1';
function saveGame() {
  if (!G.started || !G.me) return; const p = G.me, n = G.nemesis && !G.nemesis.dead ? Object.assign({}, G.nemesis.nd, { x: G.nemesis.x, y: G.nemesis.y }) : null;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, name: p.name, lvl: p.lvl, xp: p.xp, gold: p.gold, potions: p.potions, souls: p.souls, slots: p.slots, J: G.J, equip: p.equip, bag: p.bag, shards: p.shards | 0, nem: n, look: p.look || {}, seen: packSeen() })); } catch (e) { }
}
function packSeen() { let s = ''; const a = (G.over ? G.over.W : W).seen; for (let i = 0; i < a.length; i += 6) { let v = 0; for (let k = 0; k < 6; k++) if (a[i + k]) v |= 1 << k; s += String.fromCharCode(48 + v); } return s; }
function unpackSeen(s) { if (typeof s !== 'string') return; const a = W.seen; for (let i = 0, j = 0; i < a.length && j < s.length; i += 6, j++) { const v = s.charCodeAt(j) - 48; for (let k = 0; k < 6 && i + k < a.length; k++) a[i + k] = (v >> k) & 1; } W.mapDirty = true; }
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.v === 1 && s.name ? s : null; } catch (e) { return null; } }
function wipeSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
const validSoul = id => typeof id === 'string' && (!!SOULS[id] || !!CHIMERAS[id] || (id.slice(0, 2) === 'p_' && !!SOULS[id.split('_')[1]] && !!SOULS[id.split('_')[2]]));
function applySave(p, s) {
  p.name = String(s.name).slice(0, 14); p.lvl = clamp(s.lvl | 0, 1, MAXLVL); p.xp = Math.max(0, +s.xp || 0); p.gold = Math.max(0, s.gold | 0); p.potions = clamp(s.potions | 0, 0, POTION_MAX);
  p.souls = {}; for (const id in (s.souls || {})) if (validSoul(id) && s.souls[id] >= 1) p.souls[id] = s.souls[id] | 0;
  if (!Object.keys(p.souls).length) p.souls.wolf = 1;
  p.slots = [0, 1, 2, 3].map(i => { const id = s.slots && s.slots[i]; return id && p.souls[id] ? id : null; });
  G.J = Object.assign(newJournal(), s.J || {}); for (const k of ['reactions', 'recipes', 'obtained', 'hints']) if (!G.J[k] || typeof G.J[k] !== 'object') G.J[k] = {};
  p.shards = Math.max(0, s.shards | 0);
  const okIt0 = it => { if (it && it.ench && !SOULS[it.ench]) delete it.ench; if (it) it.plus = clamp(it.plus | 0, 0, 10); return true; };
  const okIt = it => okIt0(it) && it && ISLOTS.indexOf(it.slot) >= 0 && RANKS[it.rank] && AFF[it.base && it.base[0]] && Array.isArray(it.aff) && it.aff.every(a => AFF[a[0]]);
  if (s.equip) for (const k of ISLOTS) p.equip[k] = okIt(s.equip[k]) && s.equip[k].slot === k ? s.equip[k] : null; if (Array.isArray(s.bag)) p.bag = s.bag.filter(okIt).slice(0, BAG_MAX + 8);
  if (s.nem && Array.isArray(s.nem.items)) s.nem.items = s.nem.items.filter(okIt);
  recalc(p); p.hp = p.maxHp; for (let i = 0; i < 4; i++) resetSlot(p, i); unpackSeen(s.seen);
  if (s.nem && s.nem.x > 1 && s.nem.y > 1 && Array.isArray(s.nem.souls)) { s.nem.souls = s.nem.souls.filter(q => q && validSoul(q.id)); try { spawnNemesis(s.nem); } catch (e) { G.nemesis = null; } }
}
let saveT = 10;
G.systems.push(dt => { saveT -= dt; if (saveT <= 0) { saveT = 10; saveGame(); } });
for (const ev of ['campClear', 'fused', 'bossDeath', 'nemesisDeath', 'respawn', 'menuClosed']) Bus.on(ev, () => setTimeout(saveGame, 0));
window.addEventListener('pagehide', saveGame); document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
