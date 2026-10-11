/* ==========================================================================
   COSMOGENESIS — shared chapter runtime  (classic script, no modules)
   Exposes window.Cosmos:
     Cosmos.CHAPTERS            the journey registry (order = cosmic time)
     Cosmos.chapter(cfg)        builds the chrome for a chapter page, returns `ch`
     Cosmos.gl.*                small WebGL2 toolkit (programs, targets, ping-pong)
     Cosmos.Chart               lightweight live line chart for the control deck
     Cosmos.util / Cosmos.fmt   seeded RNG, maths, number formatting
   ========================================================================== */
(function () {
  'use strict';

  const CHAPTERS = [
    { id: 'inflation', title: 'Quantum Foam', era: 't ≈ 10⁻³⁶ s', accent: '#cdb8ff', blurb: 'A patch of space smaller than a proton inflates by a factor of 10²⁶, and quantum jitter freezes into the seeds of every galaxy.' },
    { id: 'nucleosynthesis', title: 'The First Three Minutes', era: 't = 1 s → 20 min', accent: '#ffd37a', blurb: 'Protons and neutrons race a falling thermometer and a ticking neutron clock to forge the first helium.' },
    { id: 'first-light', title: 'First Light', era: 't = 380,000 yr', accent: '#ff9a62', blurb: 'The fog lifts. Sound waves from the infant cosmos are frozen into the oldest light there is.' },
    { id: 'cosmic-web', title: 'The Cosmic Web', era: 't = 100 Myr → 13.8 Gyr', accent: '#7fa8ff', blurb: 'Gravity pulls a quarter of a million dark-matter particles into walls, filaments and clusters.' },
    { id: 'galaxies', title: 'Island Universes', era: 't = 1 → 13.8 Gyr', accent: '#b3c7ff', blurb: 'Two galaxies collide. Stars almost never touch, yet gravity flings them into tidal tails 100,000 light-years long.' },
    { id: 'stars', title: 'The Lives of Stars', era: 'every star since t = 100 Myr', accent: '#ffe08a', blurb: 'Choose a mass and watch a star live and die, forging the elements you are made of.' },
    { id: 'black-hole', title: 'The Event Horizon', era: 'where the heaviest stars die', accent: '#ff7a2e', blurb: 'Light bends around a black hole in real time, traced along the geodesics of curved spacetime.' },
    { id: 'worlds', title: 'Birth of Worlds', era: '4.6 billion years ago', accent: '#d9a877', blurb: 'Dust becomes planetesimals, planetesimals collide, and a young star gathers a family of planets.' },
    { id: 'earth', title: 'The Pale Blue Dot', era: '4.5 billion years ago → today', accent: '#5cc8ff', blurb: 'Scrub through Earth’s history, from a magma ocean to a snowball to the blue marble.' },
    { id: 'primordial-soup', title: 'Primordial Soup', era: '≈ 4.0 billion years ago', accent: '#4fe3c1', blurb: 'A handful of attraction rules between a few kinds of particle, and membranes, cells and swimmers appear.' },
    { id: 'first-life', title: 'First Life', era: '≈ 3.8 billion years ago', accent: '#86e36a', blurb: 'Continuous cellular automata where lifelike creatures glide, divide and die.' },
    { id: 'dna', title: 'The Code of Life', era: 'in every cell, for 3.8 billion years', accent: '#6b8cff', blurb: 'Type your name. It becomes DNA, then RNA, then a protein that folds itself while you watch.' },
    { id: 'morphogenesis', title: 'Morphogenesis', era: '600 million years ago → every embryo', accent: '#f5b83d', blurb: 'How does a leopard get its spots? Two chemicals, one reacting and one spreading: Turing’s 1952 answer.' },
    { id: 'evolution', title: 'Endless Forms', era: '541 million years ago · the Cambrian', accent: '#c1e05a', blurb: 'Creatures with neural-network brains eat, breed, mutate and die. Natural selection runs live.' },
    { id: 'murmuration', title: 'Murmuration', era: 'any winter dusk', accent: '#c9d4e8', blurb: 'Tens of thousands of starlings, three local rules, one breathing cloud.' },
    { id: 'heart', title: 'The Beating Heart', era: 'now · 72 beats a minute', accent: '#ff4d5e', blurb: 'A living model of cardiac electricity. Trigger an arrhythmia, read the ECG, then shock it back.' },
    { id: 'neurons', title: 'The Spark of Thought', era: 'now · 86 billion neurons', accent: '#b48cff', blurb: 'Hodgkin and Huxley’s squid-axon equations, then a whole sheet of cortex firing.' },
    { id: 'immune', title: 'The War Within', era: 'now · two trillion immune cells', accent: '#ff7eb6', blurb: 'A virus lands. Innate and adaptive immunity fight back, and a vaccine changes the ending.' },
    { id: 'learning-machine', title: 'The Learning Machine', era: '1943 → now', accent: '#7ef0ff', blurb: 'A neural network written from scratch learns to paint a picture, pixel by pixel, while you watch.' },
    { id: 'civilization', title: 'Lights of Civilization', era: '10,000 BCE → now', accent: '#ffbe5c', blurb: 'Villages spread, roads link them, and the night side of a continent lights up.' },
    { id: 'last-light', title: 'The Last Light', era: 't = 10¹⁴ → 10¹⁰⁰ years', accent: '#7c86ff', blurb: 'The stars go out, black holes evaporate, and the universe runs down to its last photon.' },
    { id: 'you', title: 'You Are Here', era: 't = 13.8 billion years · now', accent: '#ffe9c7', blurb: 'Your cosmic receipt: where your atoms were forged, how far you have travelled, and the odds of you.' },
  ];
  CHAPTERS.forEach((c, i) => {
    c.n = i + 1;
    c.file = 'ch' + String(i + 1).padStart(2, '0') + '-' + c.id + '.html';
  });

  const Cosmos = (window.Cosmos = {});
  Cosmos.CHAPTERS = CHAPTERS;
  Cosmos.find = (id) => CHAPTERS.find((c) => c.id === id);
  Cosmos.debug = {};
  window.__cosmos = Cosmos.debug;

  /* ------------------------------------------------------------------ utils */
  const util = (Cosmos.util = {
    clamp: (x, a, b) => (x < a ? a : x > b ? b : x),
    lerp: (a, b, t) => a + (b - a) * t,
    smoothstep: (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); },
    /** Deterministic PRNG (mulberry32). rng() → [0,1) */
    rng(seed = 1) {
      let s = seed >>> 0;
      return function () { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    },
    /** Standard normal sample from a uniform rng */
    gauss(rng = Math.random) { let u = 0; while (u === 0) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); },
    hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; },
    hexToRgb(hex) { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; },
    /** hex → [r,g,b] floats 0..1 (for shaders) */
    rgbf(hex) { return util.hexToRgb(hex).map((v) => v / 255); },
    /** Blackbody colour (approx., Tanner Helland) for temperature in Kelvin → [r,g,b] 0..1 */
    blackbody(T) {
      const t = T / 100; let r, g, b;
      if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
      else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); b = 255; }
      return [r, g, b].map((v) => util.clamp(v, 0, 255) / 255);
    },
  });

  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  Cosmos.fmt = {
    sup: (s) => String(s).split('').map((c) => SUP[c] || c).join(''),
    /** 1.23e-36 → "1.23 × 10⁻³⁶" (plain for 1e-3..1e5) */
    sci(x, digits = 3) {
      if (x === 0 || !isFinite(x)) return String(x);
      const a = Math.abs(x);
      if (a >= 1e-3 && a < 1e5) return Number(x.toPrecision(digits)).toLocaleString('en-US');
      const e = Math.floor(Math.log10(a)); const m = x / Math.pow(10, e);
      const ms = Number(m.toPrecision(digits));
      return (ms === 1 ? '' : ms + ' × ') + '10' + Cosmos.fmt.sup(e);
    },
    num: (x, d = 0) => Number(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }),
    si(x, unit = '', digits = 3) {
      const pre = [['E', 1e18], ['P', 1e15], ['T', 1e12], ['G', 1e9], ['M', 1e6], ['k', 1e3], ['', 1], ['m', 1e-3], ['µ', 1e-6], ['n', 1e-9]];
      const a = Math.abs(x);
      for (const [p, v] of pre) if (a >= v) return Number((x / v).toPrecision(digits)) + ' ' + p + unit;
      return Cosmos.fmt.sci(x, digits) + ' ' + unit;
    },
    pct: (x, d = 1) => (x * 100).toFixed(d) + '%',
    /** seconds → human (s, min, h, d, yr, kyr, Myr, Gyr) */
    time(s) {
      const yr = 3.156e7;
      if (s < 60) return Cosmos.fmt.sci(s, 3) + ' s';
      if (s < 3600) return (s / 60).toFixed(1) + ' min';
      if (s < 86400) return (s / 3600).toFixed(1) + ' h';
      if (s < yr) return (s / 86400).toFixed(1) + ' days';
      const y = s / yr;
      if (y < 1e3) return y.toFixed(y < 10 ? 1 : 0) + ' yr';
      if (y < 1e6) return (y / 1e3).toFixed(1) + ' kyr';
      if (y < 1e9) return (y / 1e6).toFixed(1) + ' Myr';
      if (y < 1e12) return (y / 1e9).toFixed(2) + ' Gyr';
      return Cosmos.fmt.sci(y, 3) + ' yr';
    },
  };

  /* ------------------------------------------------------------------- DOM */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  Cosmos.h = h;

  const ICONS = {
    sound: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
    mute: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
    notes: '<svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z"/><path d="M9 11h7M9 15h7M9 7h3"/></svg>',
    sliders: '<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
    cinema: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .6-1.5 1.2-1.5 2.5M12 17h.01"/></svg>',
    fold: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
    unfold: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  };
  Cosmos.ICONS = ICONS;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('cosmos:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('cosmos:' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  Cosmos.store = store;

  /* ----------------------------------------------------------------- sound */
  const sound = (Cosmos.sound = {
    enabled: false, ctx: null, out: null, listeners: [],
    ensure() {
      if (!sound.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        sound.ctx = new AC();
        const comp = sound.ctx.createDynamicsCompressor();
        comp.threshold.value = -18; comp.ratio.value = 4;
        sound.out = sound.ctx.createGain();
        sound.out.gain.value = 0.8;
        sound.out.connect(comp).connect(sound.ctx.destination);
      }
      if (sound.ctx.state === 'suspended') sound.ctx.resume();
      return sound.ctx;
    },
    set(on) {
      sound.enabled = !!on;
      if (on) sound.ensure();
      if (sound.out) sound.out.gain.setTargetAtTime(on ? 0.8 : 0, sound.ctx.currentTime, 0.05);
      sound.listeners.forEach((fn) => { try { fn(sound.enabled); } catch (e) { console.error(e); } });
    },
  });

  /* --------------------------------------------------------------- chapter */
  Cosmos.chapter = function (cfg) {
    const meta = Cosmos.find(cfg.id);
    if (!meta) throw new Error('Cosmos.chapter: unknown chapter id "' + cfg.id + '"');
    const idx = meta.n - 1;
    // A publish may ship only some chapters (window.COSMOS_AVAILABLE = [file names]); navigation skips the rest.
    const AV = window.COSMOS_AVAILABLE;
    const isAv = (c) => !AV || AV.indexOf(c.file) >= 0;
    let prev = null, next = null;
    for (let i = idx - 1; i >= 0 && !prev; i--) if (isAv(CHAPTERS[i])) prev = CHAPTERS[i];
    for (let i = idx + 1; i < CHAPTERS.length && !next; i++) if (isAv(CHAPTERS[i])) next = CHAPTERS[i];
    const root = document.documentElement;
    const accent = cfg.accent || meta.accent;
    const [ar, ag, ab] = util.hexToRgb(accent);
    root.style.setProperty('--era', accent);
    root.style.setProperty('--era-soft', `rgba(${ar},${ag},${ab},0.16)`);
    document.body.classList.add('cz-page');
    document.body.dataset.chapter = meta.id;
    if (!document.title) document.title = meta.title + ' · Cosmogenesis';

    const listeners = { pause: [], resize: [], key: {} };
    const ch = { meta, cfg, prev, next, util, fmt: Cosmos.fmt, h, debug: Cosmos.debug };
    Cosmos.debug.chapter = meta.id;

    /* stage */
    let stage = document.querySelector('.cz-stage');
    if (!stage) { stage = h('div', { class: 'cz-stage' }); document.body.prepend(stage); }
    ch.stage = stage;
    /** Create a full-bleed canvas in the stage (or adopt an existing <canvas id>) */
    ch.canvas = function (id) {
      let c = id && document.getElementById(id);
      if (!c) { c = h('canvas', { id: id || null }); stage.append(c); }
      else if (c.parentElement !== stage) stage.append(c);
      return c;
    };

    /* top rail */
    const btn = (name, label, onclick, pressed) => {
      const b = h('button', { class: 'cz-icon', type: 'button', 'aria-label': label, title: label, html: ICONS[name] });
      if (pressed != null) b.setAttribute('aria-pressed', String(pressed));
      b.addEventListener('click', onclick);
      return b;
    };
    const wide = (b) => { b.classList.add('cz-wide'); return b; };
    const soundBtn = btn('mute', 'Sound', () => { sound.set(!sound.enabled); store.set('sound', sound.enabled); syncSound(); });
    const syncSound = () => { soundBtn.innerHTML = sound.enabled ? ICONS.sound : ICONS.mute; soundBtn.setAttribute('aria-pressed', String(sound.enabled)); soundBtn.title = sound.enabled ? 'Sound on (M)' : 'Sound off (M)'; };
    syncSound();
    const pauseBtn = btn('pause', 'Pause (Space)', () => ch.setPaused(!ch.paused));
    const deckBtn = btn('sliders', 'Controls (C)', () => toggleDeck());
    const notesBtn = btn('notes', 'Field notes (N)', () => toggleNotes());
    const bar = h('header', { class: 'cz-bar' },
      h('a', { class: 'cz-brand', href: 'index.html', title: 'Back to the timeline' }, h('span', { class: 'cz-arrow', text: '←' }), h('b', { class: 'cz-word', text: 'Cosmogenesis' })),
      h('span', { class: 'cz-sep' }),
      h('div', { class: 'cz-where' }, h('span', { class: 'cz-num', text: String(meta.n).padStart(2, '0') + ' / ' + CHAPTERS.length }), h('span', { class: 'cz-bar-title', text: meta.title })),
      h('span', { class: 'cz-spacer' }),
      h('div', { class: 'cz-actions' },
        pauseBtn, soundBtn, notesBtn, deckBtn,
        wide(btn('cinema', 'Hide interface (H)', () => toggleCinema())),
        wide(btn('full', 'Fullscreen (F)', () => toggleFull())),
        wide(btn('help', 'Keyboard shortcuts (?)', () => toggleHelp())))
    );

    /* HUD */
    const hudEl = h('div', { class: 'cz-hud', 'aria-live': 'off' });
    ch.hud = {
      el: hudEl,
      add(label, value = '') {
        const v = h('span', { text: value });
        const row = h('div', { class: 'cz-hud-row' }, h('span', { text: label }), v);
        hudEl.append(row);
        return { el: row, set: (x) => { if (v.textContent !== String(x)) v.textContent = x; } };
      },
    };

    /* field notes */
    const story = cfg.notes || cfg.story || '';
    const science = cfg.science || '';
    const tabs = [['story', 'Story', story], ['science', 'The science', science]].filter((t) => t[2]);
    if (cfg.tabs) cfg.tabs.forEach((t) => tabs.push([t.id, t.label, t.html]));
    const body = h('div', { class: 'cz-notes-body' });
    const tabBtns = tabs.map(([id, label]) => h('button', { class: 'cz-tab', type: 'button', role: 'tab', 'data-tab': id, text: label, onclick: () => showTab(id) }));
    const foldBtn = h('button', { class: 'cz-icon cz-collapse', type: 'button', 'aria-label': 'Fold notes', title: 'Fold notes', html: ICONS.fold, style: { width: '28px', height: '28px' } });
    const notes = h('aside', { class: 'cz-notes cz-panel', 'aria-label': 'Field notes' },
      h('div', { class: 'cz-notes-head' },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } }, h('span', { class: 'cz-era', text: meta.era }), h('span', { class: 'cz-spacer', style: { flex: '1' } }), foldBtn),
        h('h1', { class: 'cz-title', text: cfg.title || meta.title }),
        h('p', { class: 'cz-sub', text: cfg.subtitle || meta.blurb })),
      tabs.length ? h('div', { class: 'cz-tabs', role: 'tablist' }, tabBtns) : null,
      body);
    function showTab(id) {
      const t = tabs.find((x) => x[0] === id) || tabs[0];
      if (!t) return;
      body.innerHTML = t[2];
      tabBtns.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t[0])));
      body.scrollTop = 0;
      ch.tab = t[0];
    }
    showTab(tabs[0] && tabs[0][0]);
    ch.showTab = showTab;
    const small = () => window.matchMedia('(max-width: 760px)').matches;
    let notesFolded = cfg.notesFolded != null ? cfg.notesFolded : small();
    const setFold = (f) => {
      notesFolded = f; notes.classList.toggle('cz-folded', f);
      foldBtn.innerHTML = f ? ICONS.unfold : ICONS.fold;
      foldBtn.title = f ? 'Unfold notes' : 'Fold notes';
      notesBtn.setAttribute('aria-pressed', String(!f));
    };
    foldBtn.addEventListener('click', () => setFold(!notesFolded));
    notes.querySelector('.cz-notes-head').addEventListener('click', (e) => { if (notesFolded && !e.target.closest('button')) setFold(false); });
    const toggleNotes = () => setFold(!notesFolded);
    ch.foldNotes = setFold;

    /* control deck */
    const deck = h('aside', { class: 'cz-deck cz-panel', 'aria-label': 'Controls' });
    let deckOpen = !small() && cfg.deckOpen !== false;
    const setDeck = (open) => {
      deckOpen = open;
      deck.classList.toggle('cz-open', open);
      deck.classList.toggle('cz-closed', !open);
      deckBtn.setAttribute('aria-pressed', String(open));
      if (open && small()) setFold(true);
    };
    const toggleDeck = () => setDeck(!deckOpen);
    ch.openDeck = setDeck;

    /* foot */
    const line = h('nav', { class: 'cz-line', 'aria-label': 'Chapters' },
      CHAPTERS.map((c) => h(isAv(c) ? 'a' : 'span', { class: 'cz-tick' + (c.id === meta.id ? ' cur' : '') + (isAv(c) ? '' : ' pending'), href: isAv(c) ? c.file : null, style: { '--c': c.accent }, 'aria-label': c.n + '. ' + c.title + (isAv(c) ? '' : ' (still being built)'), 'aria-current': c.id === meta.id ? 'page' : null },
        h('i'), h('span', { class: 'cz-tip', text: String(c.n).padStart(2, '0') + ' · ' + c.title + (isAv(c) ? '' : ' · still being built') }))));
    const foot = h('footer', { class: 'cz-foot' },
      prev ? h('a', { class: 'cz-nav prev', href: prev.file }, h('small', { text: '← Before' }), h('span', { text: prev.title })) : h('a', { class: 'cz-nav prev', href: 'index.html' }, h('small', { text: '← Timeline' }), h('span', { text: 'Cosmogenesis' })),
      line,
      next ? h('a', { class: 'cz-nav next', href: next.file }, h('small', { text: 'Next →' }), h('span', { text: next.title })) : h('a', { class: 'cz-nav next', href: 'index.html' }, h('small', { text: 'Return →' }), h('span', { text: 'The timeline' })));

    const toast = h('div', { class: 'cz-toast', role: 'status' });
    const cinemaHint = h('div', { class: 'cz-cinema-hint', text: 'H · show interface' });
    document.body.append(bar, hudEl, deck, notes, foot, toast, cinemaHint);
    setFold(notesFolded);
    setDeck(deckOpen);

    let toastT = 0;
    ch.toast = (msg, ms = 2600) => { toast.textContent = msg; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), ms); };

    /* controls API */
    const makeUI = (container) => {
      const api = {
        el: container,
        group(title, opts = {}) {
          const g = h('section', { class: 'cz-group' }, title ? h('div', { class: 'cz-group-title', text: title }) : null);
          deck.append(g);
          return makeUI(g);
        },
        slider(o) {
          const id = o.id || 'cz-s-' + Math.random().toString(36).slice(2, 8);
          const fmt = o.format || ((v) => (o.log ? Cosmos.fmt.sci(v, 3) : String(Number(v.toFixed(o.digits != null ? o.digits : 3)))) + (o.unit ? ' ' + o.unit : ''));
          const toPos = (v) => (o.log ? Math.log(v / o.min) / Math.log(o.max / o.min) : (v - o.min) / (o.max - o.min));
          const fromPos = (p) => (o.log ? o.min * Math.pow(o.max / o.min, p) : o.min + p * (o.max - o.min));
          const input = h('input', { class: 'cz-range', type: 'range', id, min: 0, max: 1000, step: 1 });
          const out = h('output', { for: id });
          const field = h('div', { class: 'cz-field' }, h('label', { class: 'cz-label', for: id }, h('span', { text: o.label }), out), input, o.hint ? h('div', { class: 'cz-hint', html: o.hint }) : null);
          container.append(field);
          let value = o.value != null ? o.value : o.min;
          const quant = (v) => { if (o.step && !o.log) v = Math.round((v - o.min) / o.step) * o.step + o.min; return util.clamp(v, Math.min(o.min, o.max), Math.max(o.min, o.max)); };
          const paint = () => { const p = toPos(value); input.value = Math.round(p * 1000); input.style.setProperty('--p', (p * 100).toFixed(1) + '%'); out.textContent = fmt(value); };
          input.addEventListener('input', () => { value = quant(fromPos(input.value / 1000)); paint(); o.onInput && o.onInput(value); });
          input.addEventListener('change', () => o.onChange && o.onChange(value));
          paint();
          return { el: field, input, get value() { return value; }, set(v, fire) { value = quant(v); paint(); if (fire && o.onInput) o.onInput(value); } };
        },
        toggle(o) {
          const id = o.id || 'cz-t-' + Math.random().toString(36).slice(2, 8);
          const input = h('input', { type: 'checkbox', id });
          input.checked = !!o.value;
          const lab = h('label', { class: 'cz-toggle', for: id }, h('span', { text: o.label }), input, h('span', { class: 'cz-switch' }));
          const field = h('div', { class: 'cz-field' }, lab, o.hint ? h('div', { class: 'cz-hint', html: o.hint }) : null);
          container.append(field);
          input.addEventListener('change', () => o.onChange && o.onChange(input.checked));
          return { el: field, input, get value() { return input.checked; }, set(v, fire) { input.checked = !!v; if (fire && o.onChange) o.onChange(input.checked); } };
        },
        select(o) {
          const id = o.id || 'cz-sel-' + Math.random().toString(36).slice(2, 8);
          const opts = o.options.map((x) => (typeof x === 'string' ? { value: x, label: x } : x));
          const sel = h('select', { class: 'cz-select', id }, opts.map((x) => h('option', { value: x.value, text: x.label })));
          if (o.value != null) sel.value = o.value;
          const field = h('div', { class: 'cz-field' }, o.label ? h('label', { class: 'cz-label', for: id }, h('span', { text: o.label })) : null, sel, o.hint ? h('div', { class: 'cz-hint', html: o.hint }) : null);
          container.append(field);
          sel.addEventListener('change', () => o.onChange && o.onChange(sel.value));
          return { el: field, input: sel, get value() { return sel.value; }, set(v, fire) { sel.value = v; if (fire && o.onChange) o.onChange(sel.value); } };
        },
        text(o) {
          const id = o.id || 'cz-in-' + Math.random().toString(36).slice(2, 8);
          const inp = h('input', { class: 'cz-input', id, type: 'text', value: o.value || '', placeholder: o.placeholder || '', maxlength: o.maxlength || null, autocomplete: 'off', spellcheck: 'false' });
          const field = h('div', { class: 'cz-field' }, o.label ? h('label', { class: 'cz-label', for: id }, h('span', { text: o.label })) : null, inp, o.hint ? h('div', { class: 'cz-hint', html: o.hint }) : null);
          container.append(field);
          inp.addEventListener('input', () => o.onInput && o.onInput(inp.value));
          inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && o.onEnter) o.onEnter(inp.value); });
          return { el: field, input: inp, get value() { return inp.value; }, set(v) { inp.value = v; } };
        },
        button(o) { return api.buttons([o])[0]; },
        buttons(list) {
          const row = h('div', { class: 'cz-btns' });
          const out = list.map((o) => {
            const b = h('button', { class: 'cz-btn' + (o.kind ? ' ' + o.kind : ''), type: 'button', id: o.id || null, title: o.title || null, text: o.label });
            if (o.pressed != null) b.setAttribute('aria-pressed', String(!!o.pressed));
            b.addEventListener('click', (e) => o.onClick && o.onClick(e, b));
            row.append(b);
            return { el: b, setLabel: (t) => (b.textContent = t), setPressed: (p) => b.setAttribute('aria-pressed', String(!!p)) };
          });
          container.append(row);
          return out;
        },
        readouts(list) {
          const grid = h('div', { class: 'cz-readouts' });
          const out = {};
          list.forEach((o) => {
            const v = h('span', { text: o.value != null ? o.value : '—' });
            grid.append(h('div', { class: 'cz-readout' }, h('span', { text: o.label }), v));
            out[o.id || o.label] = { set: (x) => { if (v.textContent !== String(x)) v.textContent = x; }, el: v };
          });
          container.append(grid);
          return out;
        },
        note(html) { const n = h('div', { class: 'cz-deck-note', html }); container.append(n); return n; },
        chart(o = {}) {
          const c = h('canvas', { class: 'cz-chart', style: { height: (o.height || 110) + 'px' } });
          container.append(c);
          return new Chart(c, o);
        },
        canvas(heightPx = 120) { const c = h('canvas', { class: 'cz-chart', style: { height: heightPx + 'px' } }); container.append(c); return c; },
        html(el) { container.append(el); return el; },
      };
      return api;
    };
    ch.ui = makeUI(deck);

    /* pause / loop */
    ch.paused = false;
    ch.setPaused = (p) => {
      ch.paused = !!p;
      pauseBtn.innerHTML = ch.paused ? ICONS.play : ICONS.pause;
      pauseBtn.setAttribute('aria-pressed', String(ch.paused));
      pauseBtn.title = ch.paused ? 'Play (Space)' : 'Pause (Space)';
      listeners.pause.forEach((fn) => fn(ch.paused));
    };
    ch.onPause = (fn) => listeners.pause.push(fn);
    /**
     * ch.loop(fn) — fn(dt, t, frame) every animation frame while not paused.
     * dt: seconds since last frame (clamped ≤ 1/15). t: accumulated unpaused seconds.
     * Pass {always:true} to keep receiving frames while paused (for camera moves / rendering).
     */
    ch.loop = (fn, o = {}) => {
      let last = performance.now(), t = 0, frame = 0, alive = true;
      const step = (now) => {
        if (!alive) return;
        const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 15)); last = now;
        if (!ch.paused) t += dt;
        if (!ch.paused || o.always) {
          try { fn(ch.paused ? 0 : dt, t, frame++); }
          catch (e) { alive = false; console.error(e); ch.fatal('The simulation stopped with an error.', e); return; }
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      return () => { alive = false; };
    };
    ch.onResize = (fn) => { listeners.resize.push(fn); };
    let rzT = 0;
    window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => listeners.resize.forEach((fn) => fn()), 60); });

    /* sound */
    ch.sound = sound;
    ch.onSound = (fn) => { sound.listeners.push(fn); };

    /* keyboard */
    const keyHelp = [['Space', 'Pause / play'], ['H', 'Hide the interface'], ['N', 'Field notes'], ['C', 'Controls'], ['M', 'Sound'], ['F', 'Fullscreen'], ['[ ]', 'Previous / next chapter'], ['?', 'This help']];
    ch.onKey = (key, fn, desc) => { (listeners.key[key.toLowerCase()] = listeners.key[key.toLowerCase()] || []).push(fn); if (desc) keyHelp.push([key.length === 1 ? key.toUpperCase() : key, desc]); };
    const toggleCinema = () => document.body.classList.toggle('cz-cinema');
    const toggleFull = () => {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => ch.toast('Fullscreen is not available here'));
      } catch { ch.toast('Fullscreen is not available here'); }
    };
    let helpEl = null;
    const toggleHelp = () => {
      if (helpEl) { helpEl.remove(); helpEl = null; return; }
      helpEl = h('div', { class: 'cz-help', onclick: (e) => { if (e.target === helpEl) toggleHelp(); } },
        h('div', { class: 'cz-panel' }, h('h3', { text: 'Keyboard' }), h('dl', {}, keyHelp.map(([k, d]) => [h('dt', {}, h('kbd', { text: k })), h('dd', { style: { margin: 0 }, text: d })]))));
      document.body.append(helpEl);
    };
    window.addEventListener('keydown', (e) => {
      if (e.target.closest && e.target.closest('input[type=text], textarea, select, [contenteditable]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const custom = listeners.key[k] || (e.code === 'Space' ? listeners.key['space'] : null);
      if (custom && custom.length) { custom.forEach((fn) => fn(e)); e.preventDefault(); return; }
      if (e.code === 'Space') { e.preventDefault(); ch.setPaused(!ch.paused); }
      else if (k === 'h') toggleCinema();
      else if (k === 'n') toggleNotes();
      else if (k === 'c') toggleDeck();
      else if (k === 'm') { sound.set(!sound.enabled); store.set('sound', sound.enabled); syncSound(); }
      else if (k === 'f') toggleFull();
      else if (k === '?' || k === '/') toggleHelp();
      else if (k === 'escape' && helpEl) toggleHelp();
      else if (k === ']' && next) location.href = next.file;
      else if (k === '[' && prev) location.href = prev.file;
    });

    /* fatal error overlay */
    ch.fatal = (msg, err) => {
      if (document.querySelector('.cz-fatal')) return;
      console.error('[Cosmos fatal] ' + msg, err || '');
      document.body.append(h('div', { class: 'cz-fatal' }, h('div', {},
        h('h2', { text: 'This simulation cannot run here' }),
        h('p', { text: msg }),
        err ? h('pre', { text: String(err && (err.stack || err.message || err)) }) : null,
        h('p', {}, h('a', { href: next ? next.file : 'index.html', text: next ? 'Continue to ' + next.title + ' →' : 'Back to the timeline →' })))));
    };

    Cosmos.debug.ready = true;
    ch.meta = meta;
    return ch;
  };

  /* ----------------------------------------------------------------- Chart */
  /**
   * new Cosmos.Chart(canvas, { series:[{label,color}], yMin, yMax, maxPoints, xLabel, yLabel, log })
   *   .push([v0, v1, ...])  append one sample per series (time series)
   *   .setXY(i, [[x,y],...]) replace series i with XY data (then .draw())
   *   .clear()
   */
  class Chart {
    constructor(canvas, o = {}) {
      this.c = canvas; this.o = Object.assign({ maxPoints: 240, pad: [(o.series || []).some((s) => s.label) ? 20 : 8, 8, 18, 34] }, o);
      this.series = (o.series || [{ label: '', color: null }]).map((s) => ({ ...s, data: [] }));
      this.ctx = canvas.getContext('2d');
      this.dirty = true;
    }
    push(vals) { vals.forEach((v, i) => { const s = this.series[i]; if (!s) return; s.data.push(v); if (s.data.length > this.o.maxPoints) s.data.shift(); }); this.xy = false; this.draw(); }
    setXY(i, pts) { this.series[i].data = pts; this.xy = true; }
    clear() { this.series.forEach((s) => (s.data = [])); this.draw(); }
    draw() {
      const c = this.c, ctx = this.ctx, dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.round(c.clientWidth * dpr), H = Math.round(c.clientHeight * dpr);
      if (!W || !H) return;
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      const cs = getComputedStyle(document.documentElement);
      const era = cs.getPropertyValue('--era').trim() || '#fff', faint = cs.getPropertyValue('--faint').trim(), line = 'rgba(236,230,214,0.10)';
      const [pt, pr, pb, pl] = this.o.pad.map((v) => v * dpr);
      ctx.clearRect(0, 0, W, H);
      let lo = this.o.yMin, hi = this.o.yMax;
      if (lo == null || hi == null) {
        let mn = Infinity, mx = -Infinity;
        this.series.forEach((s) => s.data.forEach((d) => { const y = this.xy ? d[1] : d; if (isFinite(y)) { mn = Math.min(mn, y); mx = Math.max(mx, y); } }));
        if (!isFinite(mn)) { mn = 0; mx = 1; }
        if (mn === mx) { mn -= 1; mx += 1; }
        if (lo == null) lo = mn; if (hi == null) hi = mx;
      }
      const log = this.o.log;
      const ty = (y) => { const v = log ? (Math.log10(Math.max(y, 1e-30)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) : (y - lo) / (hi - lo); return H - pb - util.clamp(v, -0.05, 1.05) * (H - pt - pb); };
      let xlo = 0, xhi = this.o.maxPoints - 1;
      if (this.xy) { xlo = Infinity; xhi = -Infinity; this.series.forEach((s) => s.data.forEach((d) => { xlo = Math.min(xlo, d[0]); xhi = Math.max(xhi, d[0]); })); if (this.o.xMin != null) xlo = this.o.xMin; if (this.o.xMax != null) xhi = this.o.xMax; if (xlo === xhi) xhi = xlo + 1; }
      const tx = (x) => pl + ((x - xlo) / (xhi - xlo)) * (W - pl - pr);
      ctx.font = `${10 * dpr}px ${cs.getPropertyValue('--f-mono')}`;
      ctx.fillStyle = faint; ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      const ticks = log ? [lo, Math.sqrt(lo * hi), hi] : [lo, (lo + hi) / 2, hi];
      ticks.forEach((v) => { const y = ty(v); ctx.beginPath(); ctx.moveTo(pl, y); ctx.lineTo(W - pr, y); ctx.stroke(); ctx.fillText(this.o.yFormat ? this.o.yFormat(v) : Cosmos.fmt.sci(v, 2), pl - 5 * dpr, y); });
      if (this.o.xLabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText(this.o.xLabel, W - pr, H - 4 * dpr); }
      if (this.o.yLabel) { ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(this.o.yLabel, pl, H - 4 * dpr); }
      this.series.forEach((s, si) => {
        const d = s.data; if (d.length < 2) return;
        const col = s.color || (si === 0 ? era : faint);
        ctx.beginPath();
        d.forEach((v, i) => { const x = this.xy ? tx(v[0]) : tx(i + (this.o.maxPoints - d.length)); const y = ty(this.xy ? v[1] : v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.strokeStyle = col; ctx.lineWidth = 1.6 * dpr; ctx.lineJoin = 'round'; ctx.stroke();
        const lastV = d[d.length - 1]; const lx = this.xy ? tx(lastV[0]) : tx(this.o.maxPoints - 1); const ly = ty(this.xy ? lastV[1] : lastV);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx, ly, 2.4 * dpr, 0, 7); ctx.fill();
      });
      let lx = pl + 4 * dpr;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      this.series.forEach((s, si) => { if (!s.label) return; const col = s.color || (si === 0 ? era : faint); ctx.fillStyle = col; ctx.fillRect(lx, 8 * dpr, 8 * dpr, 2 * dpr); ctx.fillText(s.label, lx + 11 * dpr, 3 * dpr); lx += ctx.measureText(s.label).width + 22 * dpr; });
    }
  }
  Cosmos.Chart = Chart;

  /* ------------------------------------------------------------ WebGL2 kit */
  const G = (Cosmos.gl = {});
  /** Get a WebGL2 context. opts: {alpha, antialias, preserveDrawingBuffer, premultipliedAlpha, float:true (require float RT)} */
  G.context = function (canvas, opts = {}) {
    const gl = canvas.getContext('webgl2', Object.assign({ alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' }, opts));
    if (!gl) return null;
    gl.ext = { floatRT: !!gl.getExtension('EXT_color_buffer_float'), floatLinear: !!gl.getExtension('OES_texture_float_linear'), halfFloatRT: !!gl.getExtension('EXT_color_buffer_half_float') };
    return gl;
  };
  /** Resize canvas backing store to CSS size × dpr (capped). Returns true if size changed. */
  G.fit = function (canvas, maxDpr = 2, scale = 1) {
    const dpr = Math.min(maxDpr, window.devicePixelRatio || 1) * scale;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), hh = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; return true; }
    return false;
  };
  function annotate(src, log) {
    const lines = src.split('\n');
    const m = /ERROR: \d+:(\d+)/.exec(log);
    if (!m) return log;
    const n = +m[1];
    return log + '\n' + lines.slice(Math.max(0, n - 3), n + 2).map((l, i) => String(Math.max(1, n - 2) + i).padStart(4) + '| ' + l).join('\n');
  }
  G.shader = function (gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(s); throw new Error('Shader compile failed:\n' + annotate(src, log)); }
    return s;
  };
  /** Compile & link. Returns program with .uniforms {name: {loc,type,size}} and .attribs. Optional transform-feedback varyings. */
  G.program = function (gl, vs, fs, tfVaryings) {
    const p = gl.createProgram();
    gl.attachShader(p, G.shader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, G.shader(gl, gl.FRAGMENT_SHADER, fs));
    if (tfVaryings) gl.transformFeedbackVaryings(p, tfVaryings, gl.SEPARATE_ATTRIBS);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Program link failed: ' + gl.getProgramInfoLog(p));
    p.uniforms = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const name = info.name.replace(/\[0\]$/, ''); p.uniforms[name] = { loc: gl.getUniformLocation(p, info.name), type: info.type, size: info.size }; }
    p.attribs = {};
    const na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < na; i++) { const info = gl.getActiveAttrib(p, i); p.attribs[info.name] = gl.getAttribLocation(p, info.name); }
    return p;
  };
  /**
   * Set uniforms by name with type inferred from the program. Textures: pass {tex, unit} or a WebGLTexture
   * (auto-assigned units in call order). Unknown names are ignored (they may be optimised away).
   */
  G.uniforms = function (gl, p, values) {
    let unit = 0;
    for (const name in values) {
      const u = p.uniforms[name]; if (!u) continue;
      let v = values[name];
      switch (u.type) {
        case gl.FLOAT: u.size > 1 ? gl.uniform1fv(u.loc, v) : gl.uniform1f(u.loc, v); break;
        case gl.FLOAT_VEC2: gl.uniform2fv(u.loc, v); break;
        case gl.FLOAT_VEC3: gl.uniform3fv(u.loc, v); break;
        case gl.FLOAT_VEC4: gl.uniform4fv(u.loc, v); break;
        case gl.INT: case gl.BOOL: u.size > 1 ? gl.uniform1iv(u.loc, v) : gl.uniform1i(u.loc, v | 0); break;
        case gl.INT_VEC2: gl.uniform2iv(u.loc, v); break;
        case gl.INT_VEC3: gl.uniform3iv(u.loc, v); break;
        case gl.FLOAT_MAT3: gl.uniformMatrix3fv(u.loc, false, v); break;
        case gl.FLOAT_MAT4: gl.uniformMatrix4fv(u.loc, false, v); break;
        case gl.SAMPLER_2D: case gl.SAMPLER_3D: case gl.SAMPLER_CUBE: case gl.SAMPLER_2D_ARRAY: case gl.INT_SAMPLER_2D: case gl.UNSIGNED_INT_SAMPLER_2D: {
          const tex = v && v.tex ? v.tex : v; const un = v && v.unit != null ? v.unit : unit++;
          const target = u.type === gl.SAMPLER_3D ? gl.TEXTURE_3D : u.type === gl.SAMPLER_CUBE ? gl.TEXTURE_CUBE_MAP : u.type === gl.SAMPLER_2D_ARRAY ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D;
          gl.activeTexture(gl.TEXTURE0 + un); gl.bindTexture(target, tex); gl.uniform1i(u.loc, un); break;
        }
        default: break;
      }
    }
  };
  /** Full-screen triangle. Vertex shader: use Cosmos.gl.FS_VERT (gives vec2 vUv). Returns draw() */
  G.FS_VERT = '#version 300 es\nout vec2 vUv;\nvoid main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); vUv = p; gl_Position = vec4(p*2.0-1.0, 0.0, 1.0); }';
  G.quad = function (gl) {
    const vao = gl.createVertexArray();
    return () => { gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.bindVertexArray(null); };
  };
  /** Create texture. o: {w,h,internal,format,type,filter:'linear'|'nearest',wrap:'clamp'|'repeat'|'mirror',data} defaults RGBA16F/half-float if renderable */
  G.texture = function (gl, o) {
    const t = gl.createTexture();
    const internal = o.internal || gl.RGBA16F, format = o.format || gl.RGBA, type = o.type || (internal === gl.RGBA8 ? gl.UNSIGNED_BYTE : internal === gl.RGBA32F || internal === gl.R32F || internal === gl.RG32F ? gl.FLOAT : gl.HALF_FLOAT);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, o.w, o.h, 0, format, type, o.data || null);
    const f = o.filter === 'nearest' ? gl.NEAREST : gl.LINEAR;
    const w = o.wrap === 'repeat' ? gl.REPEAT : o.wrap === 'mirror' ? gl.MIRRORED_REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w);
    t.w = o.w; t.h = o.h;
    return t;
  };
  /** Render target: {tex, fbo, w, h, bind()} */
  G.target = function (gl, o) {
    const tex = G.texture(gl, o);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Framebuffer incomplete (0x' + status.toString(16) + ') — float render targets may be unsupported');
    return { tex, fbo, w: o.w, h: o.h, bind() { gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, o.w, o.h); } };
  };
  /** Ping-pong pair: {read, write, swap()} */
  G.pingpong = function (gl, o) {
    const a = G.target(gl, o), b = G.target(gl, o);
    const pp = { read: a, write: b, swap() { const t = pp.read; pp.read = pp.write; pp.write = t; } };
    return pp;
  };
  /** Bind default framebuffer with full-canvas viewport */
  G.screen = function (gl) { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); };

  /* minimal mat4 helpers (column-major, like GLSL) */
  const M = (Cosmos.mat4 = {
    perspective(fovy, aspect, near, far) { const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far); return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]); },
    lookAt(eye, at, up = [0, 1, 0]) {
      let zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2]; let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
      let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx; l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * eye[0] + xy * eye[1] + xz * eye[2]), -(yx * eye[0] + yy * eye[1] + yz * eye[2]), -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1]);
    },
    multiply(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; },
    invert(m) {
      const a = m, o = new Float32Array(16);
      const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
      const b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
      let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; if (!det) return null; det = 1 / det;
      o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * det; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * det; o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * det; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * det;
      o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * det; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * det; o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * det; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * det;
      o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * det; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * det; o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * det; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * det;
      o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * det; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * det; o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * det; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * det;
      return o;
    },
  });

  /**
   * Orbit camera driven by pointer drag / wheel / pinch on an element.
   * const cam = Cosmos.orbit(el, {dist, minDist, maxDist, theta, phi, target:[x,y,z], autoRotate:0.05})
   * cam.update(dt) each frame → cam.eye, cam.view (mat4), cam.proj(aspect,fov,near,far)
   */
  Cosmos.orbit = function (el, o = {}) {
    const cam = Object.assign({ dist: 5, minDist: 0.5, maxDist: 100, theta: 0.6, phi: 1.2, target: [0, 0, 0], autoRotate: 0, damping: 0.12, eye: [0, 0, 5], dragging: false }, o);
    let vt = 0, vp = 0, tgtDist = cam.dist, lastX = 0, lastY = 0;
    const pointers = new Map(); let pinch0 = 0;
    el.addEventListener('pointerdown', (e) => { if (e.button !== 0 && e.pointerType === 'mouse') return; pointers.set(e.pointerId, [e.clientX, e.clientY]); el.setPointerCapture && el.setPointerCapture(e.pointerId); lastX = e.clientX; lastY = e.clientY; cam.dragging = true; if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    el.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0) tgtDist = util.clamp(tgtDist * pinch0 / d, cam.minDist, cam.maxDist); pinch0 = d; return; }
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      vt = -dx * 0.005; vp = -dy * 0.005;
      cam.theta += vt; cam.phi = util.clamp(cam.phi + vp, 0.05, Math.PI - 0.05);
    });
    const up = (e) => { pointers.delete(e.pointerId); if (!pointers.size) cam.dragging = false; pinch0 = 0; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => { e.preventDefault(); tgtDist = util.clamp(tgtDist * Math.exp(e.deltaY * 0.0012), cam.minDist, cam.maxDist); }, { passive: false });
    cam.setDist = (d) => { tgtDist = util.clamp(d, cam.minDist, cam.maxDist); };
    cam.update = (dt = 1 / 60) => {
      if (!cam.dragging) { cam.theta += vt; cam.phi = util.clamp(cam.phi + vp, 0.05, Math.PI - 0.05); vt *= 0.92; vp *= 0.92; cam.theta += cam.autoRotate * dt; }
      cam.dist += (tgtDist - cam.dist) * Math.min(1, cam.damping * 60 * dt);
      const t = cam.target, s = Math.sin(cam.phi);
      cam.eye = [t[0] + cam.dist * s * Math.sin(cam.theta), t[1] + cam.dist * Math.cos(cam.phi), t[2] + cam.dist * s * Math.cos(cam.theta)];
      cam.view = M.lookAt(cam.eye, t);
      return cam;
    };
    cam.proj = (aspect, fov = 0.9, near = 0.01, far = 1000) => M.perspective(fov, aspect, near, far);
    cam.update(0);
    return cam;
  };

  /* restore sound preference on first user gesture (browsers require one) */
  if (store.get('sound', false)) {
    const arm = () => { sound.set(true); document.querySelectorAll('.cz-icon[title^="Sound"]').forEach((b) => { b.innerHTML = ICONS.sound; b.setAttribute('aria-pressed', 'true'); }); window.removeEventListener('pointerdown', arm); window.removeEventListener('keydown', arm); };
    window.addEventListener('pointerdown', arm, { once: true }); window.addEventListener('keydown', arm, { once: true });
  }
})();
