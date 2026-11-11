// Сохранение в localStorage (всё в try/catch — в приватном режиме может быть недоступно)
const SAVE_KEY = 'soul_eater_save_v1';
function saveGame() {
  if (!G.started || !G.me) return; const p = G.me, n = G.nemesis && !G.nemesis.dead ? Object.assign({}, G.nemesis.nd, { x: G.nemesis.x, y: G.nemesis.y }) : null;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, name: p.name, lvl: p.lvl, xp: p.xp, gold: p.gold, potions: p.potions, souls: p.souls, slots: p.slots, J: G.J, nem: n })); } catch (e) { }
}
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.v === 1 && s.name ? s : null; } catch (e) { return null; } }
function wipeSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
const validSoul = id => typeof id === 'string' && (!!SOULS[id] || !!CHIMERAS[id] || (id.slice(0, 2) === 'p_' && !!SOULS[id.split('_')[1]] && !!SOULS[id.split('_')[2]]));
function applySave(p, s) {
  p.name = String(s.name).slice(0, 14); p.lvl = clamp(s.lvl | 0, 1, MAXLVL); p.xp = Math.max(0, +s.xp || 0); p.gold = Math.max(0, s.gold | 0); p.potions = clamp(s.potions | 0, 0, POTION_MAX);
  p.souls = {}; for (const id in (s.souls || {})) if (validSoul(id) && s.souls[id] >= 1) p.souls[id] = s.souls[id] | 0;
  if (!Object.keys(p.souls).length) p.souls.wolf = 1;
  p.slots = [0, 1, 2, 3].map(i => { const id = s.slots && s.slots[i]; return id && p.souls[id] ? id : null; });
  G.J = Object.assign(newJournal(), s.J || {}); for (const k of ['reactions', 'recipes', 'obtained', 'hints']) if (!G.J[k] || typeof G.J[k] !== 'object') G.J[k] = {};
  recalc(p); p.hp = p.maxHp; for (let i = 0; i < 4; i++) resetSlot(p, i);
  if (s.nem && s.nem.x > 1 && s.nem.y > 1 && Array.isArray(s.nem.souls)) { s.nem.souls = s.nem.souls.filter(q => q && validSoul(q.id)); try { spawnNemesis(s.nem); } catch (e) { G.nemesis = null; } }
}
let saveT = 10;
G.systems.push(dt => { saveT -= dt; if (saveT <= 0) { saveT = 10; saveGame(); } });
for (const ev of ['fused', 'bossDeath', 'nemesisDeath', 'respawn', 'menuClosed']) Bus.on(ev, () => setTimeout(saveGame, 0));
window.addEventListener('pagehide', saveGame); document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
