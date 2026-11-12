// Главный цикл
function resize() {
  const c = G.canvas, dpr = Math.min(window.devicePixelRatio || 1, 3), dw = Math.max(200, Math.round(window.innerWidth * dpr)), dh = Math.max(150, Math.round(window.innerHeight * dpr));
  c.width = dw; c.height = dh; V.dpr = dpr;
  V.scale = Math.max(1, Math.min(Math.round(dh / 240), Math.floor(dw / 200)));
  V.w = Math.ceil(dw / V.scale); V.h = Math.ceil(dh / V.scale); G.buf.width = V.w; G.buf.height = V.h;
}
function nearestPlayerDist(e) { let d = 1e9; for (const p of G.players) { const q = dist(e.x, e.y, p.x, p.y); if (q < d) d = q; } return d; }
function update(dt) {
  G.time += dt;
  const I = Input.intent(G.me);
  if (performance.now() < (G.noKeyUntil || 0)) { I.menu = I.interact = false; }
  if (I.menu) Bus.emit('menuKey', I.mtab);
  for (const e of G.ents) {
    if (e.isPlayer) { if (!e.dead) updateEntCommon(e, dt); updatePlayer(e, dt, e === G.me ? I : (e.intent || NO_INTENT)); continue; }
    if (e.dead || nearestPlayerDist(e) > 30) continue;
    updateEntCommon(e, dt); if (e.ai && !e.dead) updateMob(e, dt);
  }
  for (let i = G.ents.length - 1; i >= 0; i--) if (G.ents[i].dead && !G.ents[i].isPlayer) G.ents.splice(i, 1);
  updateProjs(dt); updateZones(dt); updateWorld(dt); updatePickups(dt);
  for (const f of G.systems) f(dt);
  const p = G.me, cam = G.cam, k = Math.min(1, dt * 7);
  cam.x += (p.x + (V.touch ? 0 : p.dirx * .6) - cam.x) * k; cam.y += (p.y + (V.touch ? 0 : p.diry * .6) - cam.y) * k;
}
let lastT = 0;
function frame(t) {
  requestAnimationFrame(frame);
  let dt = Math.min(.05, (t - lastT) / 1000 || 0); lastT = t;
  if (G.started) {
    if (G.cam.shake > 0) G.cam.shake = Math.max(0, G.cam.shake - dt * 22);
    if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
    if (!G.paused) { if (G.hitstop > 0) G.hitstop -= dt; else update(dt); updateParts(dt); }
  }
  Input.endFrame();
  render();
}
// Старт: новая игра или загрузка сохранения
function startGame(o) {
  G.ents = []; G.projs = []; G.zones = []; G.parts = []; G.texts = []; G.fx = []; G.pickups = []; G.players = []; G.nemesis = null; G.time = 0; G.over = null; G.pendingLeave = false;
  genWorld(); G.J = newJournal();
  const look = (o && o.save && o.save.look) || (o && o.look) || {}; applyLook(look);
  const p = mkPlayer(o && o.name); p.look = look; G.me = p; G.dark = undefined; G.players.push(p); G.ents.push(p);
  if (o && o.save && typeof applySave === 'function') applySave(p, o.save);
  else if (typeof giveSoul === 'function' && typeof soulDef === 'function') giveSoul(p, 'wolf', 1, true);
  G.cam.x = p.x; G.cam.y = p.y; G.started = true; G.paused = false; Input.clear();
  Bus.emit('start', p);
}
function boot() {
  G.canvas = document.getElementById('c'); G.ctx = G.canvas.getContext('2d'); G.buf = mkCanvas(V.w, V.h); G.bctx = G.buf.getContext('2d'); G.light = mkCanvas(V.w, V.h); G.lctx = G.light.getContext('2d');
  resize(); window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  Input.init(G.canvas);
  if (typeof Menus !== 'undefined') Menus.title(); else startGame({ name: 'Герой' });
  requestAnimationFrame(frame);
}
window.__G = G; // для отладки и автотестов
G.dbg = { enterDungeon, leaveDungeon, DUNGEONS, makeItem, giveItem, dropItem, recalc, Menus, saveGame, loadSave, spawnNemesis, castSoul, soulDef, mkMob, giveSoul, addSt, damage, fuse, SOULS, CHIMERAS, T, O, tIdx, getW: () => W, ignite, addPuddle, kill, gainXp, zoneAt };
boot();
