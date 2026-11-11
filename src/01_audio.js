// Звук: всё синтезируется через WebAudio
const Sfx = (() => {
  let ac = null, master = null, nbuf = null; const last = {};
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .32; master.connect(ac.destination); } catch (e) { ac = null; }
  }
  function tone(type, f0, f1, dur, vol, delay) {
    const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol || .25, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, vol, freq, type, delay) {
    if (!nbuf) { nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = ac.currentTime + (delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = nbuf; f.type = type || 'lowpass'; f.frequency.value = freq || 1200;
    g.gain.setValueAtTime(vol || .25, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * .5, dur + .02);
  }
  const lib = {
    swing() { noise(.09, .14, 2600, 'highpass'); },
    hit() { noise(.07, .28, 900); tone('square', 190, 60, .08, .16); },
    hurt() { tone('sawtooth', 240, 70, .18, .25); noise(.1, .2, 500); },
    roll() { noise(.16, .12, 1500, 'bandpass'); },
    dash() { noise(.2, .2, 2200, 'bandpass'); tone('sawtooth', 300, 90, .15, .1); },
    fire() { noise(.3, .25, 700); tone('sawtooth', 160, 60, .25, .12); },
    water() { noise(.35, .22, 1800, 'bandpass'); tone('sine', 500, 180, .3, .1); },
    zap() { tone('square', 1400, 120, .14, .16); noise(.12, .22, 5000, 'highpass'); },
    wind() { noise(.5, .16, 900, 'bandpass'); },
    poison() { tone('sine', 180, 320, .25, .14); noise(.3, .1, 500); },
    roots() { noise(.25, .22, 300); tone('triangle', 110, 60, .2, .18); },
    arrow() { noise(.07, .16, 4000, 'highpass'); tone('triangle', 900, 500, .06, .08); },
    shield() { tone('sine', 300, 700, .25, .18); },
    boom() { noise(.5, .5, 350); tone('sine', 120, 30, .45, .4); },
    steam() { noise(.6, .18, 6000, 'highpass'); },
    pickup() { tone('square', 700, 1100, .07, .1); },
    coin() { tone('square', 1100, 1500, .05, .08); tone('square', 1500, 1900, .06, .08, .05); },
    soul() { tone('sine', 440, 880, .25, .2); tone('sine', 660, 1320, .3, .16, .12); tone('triangle', 880, 1760, .4, .12, .24); },
    levelup() { [523, 659, 784, 1046].forEach((f, i) => tone('square', f, f, .14, .14, i * .09)); },
    death() { tone('sawtooth', 300, 40, .9, .3); noise(.6, .2, 300); },
    banner() { tone('triangle', 392, 392, .15, .2); tone('triangle', 587, 587, .15, .2, .12); tone('triangle', 784, 784, .35, .2, .24); },
    ui() { tone('square', 600, 700, .04, .08); },
    deny() { tone('square', 160, 120, .1, .1); },
    potion() { tone('sine', 300, 600, .12, .16); tone('sine', 450, 900, .14, .14, .1); },
    howl() { tone('sawtooth', 180, 420, .5, .25); tone('sawtooth', 420, 140, .7, .25, .5); },
    fuse() { tone('sine', 200, 900, .6, .2); noise(.6, .12, 3000, 'bandpass'); tone('triangle', 900, 1400, .4, .18, .55); }
  };
  function play(n) { if (!ac) return; const now = performance.now(); if (last[n] && now - last[n] < 45) return; last[n] = now; try { lib[n] && lib[n](); } catch (e) { } }
  return { init, play };
})();
