// Ввод: клавиатура + мышь, а на сенсорных устройствах — виртуальный джойстик и кнопки
const Input = (() => {
  const keys = {}, pr = {}, held = {}, joy = { id: null, bx: 0, by: 0, x: 0, y: 0 }, tb = {};
  let mx = 0, my = 0, mdown = false;
  const vpos = e => [e.clientX * V.dpr / V.scale, e.clientY * V.dpr / V.scale];
  function buttons() {
    const w = V.w, h = V.h;
    return [{ id: 'atk', x: w - 32, y: h - 36, r: 19 }, { id: 'roll', x: w - 76, y: h - 24, r: 13 }, { id: 's0', x: w - 86, y: h - 54, r: 11 }, { id: 's1', x: w - 67, y: h - 78, r: 11 }, { id: 's2', x: w - 40, y: h - 89, r: 11 }, { id: 's3', x: w - 14, y: h - 80, r: 11 },
    { id: 'pot', x: w - 16, y: h - 112, r: 10 }, { id: 'use', x: w - 44, y: h - 117, r: 10 }, { id: 'menu', x: w - 76, y: 14, r: 9 }];
  }
  function init(c) {
    V.touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    window.addEventListener('keydown', e => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (!e.repeat) pr[e.code] = true; keys[e.code] = true; Sfx.init();
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; mdown = false; });
    c.addEventListener('mousedown', e => { Sfx.init(); const p = vpos(e); mx = p[0]; my = p[1]; if (e.button === 0) mdown = true; else if (e.button === 2) pr.Space = true; V.touch = false; });
    window.addEventListener('mouseup', e => { if (e.button === 0) mdown = false; });
    window.addEventListener('mousemove', e => { const p = vpos(e); mx = p[0]; my = p[1]; });
    c.addEventListener('contextmenu', e => e.preventDefault());
    c.addEventListener('touchstart', e => {
      e.preventDefault(); Sfx.init(); V.touch = true;
      for (const t of e.changedTouches) {
        const p = vpos(t); let hit = null;
        for (const b of buttons()) if (dist(p[0], p[1], b.x, b.y) < b.r + 4) { hit = b; break; }
        if (hit) { tb[t.identifier] = hit.id; held[hit.id] = true; pr['T' + hit.id] = true; }
        else if (p[0] < V.w * .5 && joy.id === null) { joy.id = t.identifier; joy.bx = joy.x = p[0]; joy.by = joy.y = p[1]; }
      }
    }, { passive: false });
    c.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === joy.id) { const p = vpos(t); joy.x = p[0]; joy.y = p[1]; const d = dist(joy.bx, joy.by, joy.x, joy.y); if (d > 22) { joy.bx = joy.x - (joy.x - joy.bx) / d * 22; joy.by = joy.y - (joy.y - joy.by) / d * 22; } } }, { passive: false });
    const end = e => { e.preventDefault(); for (const t of e.changedTouches) { if (t.identifier === joy.id) joy.id = null; const b = tb[t.identifier]; if (b) { held[b] = false; delete tb[t.identifier]; } } };
    c.addEventListener('touchend', end, { passive: false }); c.addEventListener('touchcancel', end, { passive: false });
  }
  // Собирает намерение локального игрока. По сети можно слать этот же объект.
  function intent(p) {
    let sx = 0, sy = 0;
    if (keys.KeyW || keys.ArrowUp) sy -= 1; if (keys.KeyS || keys.ArrowDown) sy += 1; if (keys.KeyA || keys.ArrowLeft) sx -= 1; if (keys.KeyD || keys.ArrowRight) sx += 1;
    if (joy.id !== null) { const dx = joy.x - joy.bx, dy = joy.y - joy.by, l = Math.hypot(dx, dy); if (l > 5) { sx = dx / l; sy = dy / l; } }
    const m = norm(sx + 2 * sy, 2 * sy - sx);
    let ax, ay;
    if (V.touch) {
      let best = null, bd = 9; for (const e of G.ents) if (!e.dead && hostile(p, e)) { const d = dist(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
      if (best) { ax = best.x; ay = best.y; } else if (m[0] || m[1]) { ax = p.x + m[0] * 4; ay = p.y + m[1] * 4; } else { ax = p.x + p.dirx * 4; ay = p.y + p.diry * 4; }
    } else { const w = s2w(mx, my + 6); ax = w[0]; ay = w[1]; }
    return {
      mx: m[0], my: m[1], ax, ay, atk: mdown || !!held.atk, roll: !!(pr.Space || pr.Troll),
      cast: [!!(pr.Digit1 || pr.Ts0), !!(pr.Digit2 || pr.Ts1), !!(pr.Digit3 || pr.Ts2), !!(pr.Digit4 || pr.Ts3)],
      potion: !!(pr.KeyQ || pr.Tpot), interact: !!(pr.KeyE || pr.Tuse), menu: !!(pr.Tab || pr.KeyI || pr.Tmenu), esc: !!pr.Escape
    };
  }
  function endFrame() { for (const k in pr) delete pr[k]; }
  function clear() { for (const k in keys) keys[k] = false; for (const k in held) held[k] = false; mdown = false; joy.id = null; endFrame(); }
  return { init, intent, endFrame, clear, buttons, joy, held };
})();
const NO_INTENT = { mx: 0, my: 0, ax: 0, ay: 0, atk: false, roll: false, cast: [false, false, false, false], potion: false, interact: false };
