# COSMOGENESIS — Chapter Build Guide

**Cosmogenesis** is a 22-chapter interactive journey from the Big Bang to the reader, in which every chapter is a
real simulation running live in the browser. It opens from `index.html`. People will open it cold, on a laptop
or a phone, and it should leave them amazed. Each chapter should be museum-grade: grounded in real physics or
biology, beautiful from the first frame, and deeply interactive.

Project root: `/Users/nikhil/Codebase/random` (flat layout). **Work only inside this folder.**

```
index.html            hub / timeline (separate agent)
cosmos.css            shared chrome styles        (DO NOT EDIT)
cosmos.js             shared runtime + registry    (DO NOT EDIT)
_template.html        working example of every shared API — copy its <head> exactly
ch01-inflation.html … ch22-you.html   one self-contained page per chapter
tools/snap.mjs        headless-Chrome test harness
.snap/                screenshots + temp (scratch; never referenced by pages)
```

The chapter registry lives in `cosmos.js` (`Cosmos.CHAPTERS`): id, title, era stamp, accent colour, blurb. Your file
name is `chNN-<id>.html` exactly as listed there. `Cosmos.chapter({id})` builds the chrome automatically: the top rail,
field notes, control deck, HUD, and the cosmic-timeline footer with prev/next.

## Hard rules

1. **One file.** Your chapter is a single HTML file. Inline all chapter CSS and JS. It must load `cosmos.css` and `cosmos.js`
   with relative paths, exactly like `_template.html`, and use the same Google Fonts `<link>`.
2. **Classic scripts only**: no `type="module"`, no `import`. Pages must work from `file://` (double-click) *and* when served.
   - No `fetch`/XHR of local files. No external scripts, images or data (CSP blocks them in the published artifact).
     If a library is truly unavoidable, only pinned `https://cdnjs.cloudflare.com/ajax/libs/...` UMD builds are allowed, but
     avoid them: write it yourself.
   - Web Workers only via `new Worker(URL.createObjectURL(new Blob([src], {type:'text/javascript'})))`.
   - Never `alert/confirm/prompt`, `window.open`, downloads, `<iframe>`, camera/mic/geolocation.
   - `localStorage` only inside try/catch, and only for conveniences.
3. **Do not edit `cosmos.js`, `cosmos.css`, `_template.html`, `tools/*`, or any other chapter.** If you need something the shared
   runtime lacks, implement it locally in your file and mention it in `sharedRequests` in your final report.
4. **Zero console errors, zero uncaught exceptions, no console spam** (at most a couple of `console.info` lines).
5. **Opens in action.** The first frame, about 2 seconds after load, must already be stunning and moving: no "click to start",
   no empty canvas, no blank loading state longer than a second. If something must precompute, show a live
   intermediate visual while it runs, or precompute in chunks or in a worker.
6. **Robust.** Feature-detect WebGL2 and `EXT_color_buffer_float`. Fall back to half-float targets or reduced modes where you can,
   otherwise call `ch.fatal('…human explanation…')`. Guard against NaN/Inf blow-ups: clamp, renormalise, and reset
   gracefully. Handle resize, including devicePixelRatio. Pause heavy work while `document.hidden`; `ch.loop` already uses rAF.
7. **Performance.** Target 60 fps on an Apple M3 laptop at 1440×900. Cap the DPR (usually 1.5–2), scale the simulation
   resolution to the device, and use typed arrays with no per-frame allocation in hot loops. On phones
   (`matchMedia('(max-width: 760px)')`) use smaller workloads.
8. **Phone-ready.** Must work at 390×844 with touch. Use pointer events, set `touch-action: none` on the stage (already set on
   `.cz-stage`), and handle pinch where zoom matters. On phones the deck becomes a bottom sheet and notes fold: check
   both in the mobile screenshots.

## Shared API (read `cosmos.js` for details; `_template.html` shows each in use)

```js
const ch = Cosmos.chapter({ id, notes: html, science: html, tabs?: [{id,label,html}], deckOpen?, notesFolded? });
ch.meta                 // registry entry {n,id,title,era,accent,blurb,file}
ch.canvas(id?)          // full-bleed <canvas> inside the stage (.cz-stage); stack several for layers
ch.stage                // the stage element (put extra overlays/SVG here or position:fixed in your own CSS)
ch.loop((dt,t,frame) => {...}, {always?})   // rAF loop, respects pause; dt clamped ≤ 1/15 s
ch.paused / ch.setPaused(bool) / ch.onPause(fn)
ch.onResize(fn)  ch.onKey('r', fn, 'Description shown in ? help')   // avoid Space H N C M F [ ] ?
ch.toast('message')     ch.fatal('message', err)
ch.hud.add(label, value) → {set(v)}     // small live readouts, top-left
ch.showTab(id)  ch.foldNotes(bool)  ch.openDeck(bool)
ch.sound.enabled, ch.sound.ensure() → AudioContext, ch.sound.out (GainNode master), ch.onSound(on => ...)
// Control deck (right panel):
const g = ch.ui.group('Title');
g.slider({id,label,min,max,step,value,unit,log,digits,format,hint,onInput,onChange}) → {value,set(v,fire)}
g.toggle({id,label,value,hint,onChange}) → {value,set}
g.select({id,label,options:[{value,label}],value,onChange}) → {value,set}
g.text({id,label,value,placeholder,maxlength,onInput,onEnter}) → {value,set}
g.buttons([{label,kind:'primary'|'danger'|undefined,onClick,pressed,id,title}]) → [{el,setLabel,setPressed}]
g.readouts([{id,label,value}]) → {id:{set}}
g.chart({height,series:[{label,color}],yMin,yMax,log,maxPoints,yFormat,xLabel}) → Chart {push([v...]), setXY(i,pts), draw(), clear()}
g.canvas(heightPx) → a deck-width <canvas class="cz-chart"> for your own drawings (HR diagrams, spectra, rasters…)
g.note(html)  g.html(el)
// WebGL2 kit:
Cosmos.gl.context(canvas, opts) → gl (with gl.ext.floatRT/floatLinear)  |  Cosmos.gl.fit(canvas, maxDpr, scale)
Cosmos.gl.program(gl, vs, fs, tfVaryings?) → program (+ .uniforms map)  |  Cosmos.gl.uniforms(gl, prog, {uName: value, uTex: texture})
Cosmos.gl.FS_VERT (full-screen triangle VS with vUv) + Cosmos.gl.quad(gl) → draw()
Cosmos.gl.texture(gl,{w,h,internal,format,type,filter,wrap,data}) | Cosmos.gl.target(...) → {tex,fbo,bind()} | Cosmos.gl.pingpong(...) → {read,write,swap()}
Cosmos.gl.screen(gl) | Cosmos.mat4.{perspective,lookAt,multiply,invert} | Cosmos.orbit(el,{dist,theta,phi,target,autoRotate}) → cam.update(dt), cam.view, cam.eye, cam.proj(aspect)
// Utilities:
Cosmos.util.{clamp,lerp,smoothstep,rng(seed),gauss(rng),hash(str),hexToRgb,rgbf(hex),blackbody(K)}
Cosmos.fmt.{sci(x) → "1.2 × 10⁻³⁶", num(x,d), si(x,unit), pct(x), time(seconds), sup(str)}
Cosmos.debug            // put a function here: Cosmos.debug.state = () => ({...key sim numbers...}) (used by QA)
```

## Design language (shared, not negotiable)

- The page is a **dark planetarium**. The simulation is the hero and fills the screen, with the instruments floating at the edges.
  Keep your controls in the deck, your prose in the notes, and live numbers in the HUD or deck readouts. Don't restyle the chrome.
- Colour: the page background is `--void` (#05060c). Your epoch colour `--era` is the chapter accent; use it for highlights in the
  simulation and in your own overlays. Build the simulation palette around it, plus physically meaningful colours
  (blackbody temperatures, fluorescence stains, ECG green, and so on). Avoid generic rainbow ramps unless they carry meaning.
- Type: display is `var(--f-display)` (Bodoni Moda, italic for titles), UI is `var(--f-ui)` (Hanken Grotesk), numbers and labels are
  `var(--f-mono)` (JetBrains Mono, tabular). If you draw text on canvas, use these families.
- No emoji in the UI. Use real units everywhere (Mpc, K, MeV, mV, ms, µm, M☉, AU, bpm, …) and the subject's own notation.
- Overlays you add (labels in the scene, legends, an inset diagram) should be restrained, hairline, and in mono or italic display type,
  like annotations on an astronomical plate or a lab instrument.
- Motion: purposeful. Include one orchestrated "wow" moment reachable within 10 seconds (a preset, a button, or an automatic
  opening sequence), and give the ambient state life of its own.
- Sound (optional, but lovely): only after the user turns it on (`ch.onSound`). Keep it subtle and meaningful (a sonification of the
  simulation), and route it through `ch.sound.out`.

## Writing

- **Story tab**: 3–5 short paragraphs, vivid and plain. Say what the viewer is looking at, why it matters, and what to try
  ("Try this:" list with 2–4 concrete things). Use active voice and short sentences. Avoid em-dash asides, "not X but Y"
  constructions, and filler such as "worth noting" or "delve".
- **Science tab**: the actual model. Give the governing equations in `<span class="eq">…</span>` using HTML sub/sup and Unicode
  maths, then the parameter values with units, what is simplified or scaled for the screen (be honest about it), and 3–6
  real citations in `<span class="cite">Author, A. (year). Title. Journal.</span>`. Every number you state must be correct.
- Use `<h4>` for sub-headings inside tabs, and `<kbd>` for keys.

## Testing (mandatory; iterate until it passes and looks spectacular)

```bash
node tools/snap.mjs chNN-id.html                          # desktop 1440×900: console + 3 timed shots in .snap/shots/chNN-id/
node tools/snap.mjs chNN-id.html --mobile --quiet         # 390×844 @2x
node tools/snap.mjs chNN-id.html --shots 2 --interval 4000 --wait 6000   # later in time (does it stay beautiful? no NaN blow-up?)
node tools/snap.mjs chNN-id.html --shots 1 --actions '[{"click":[700,450]},{"wait":1500},{"shot":"after-click"},{"drag":[[600,400],[900,500]]},{"key":"r"},{"eval":"Cosmos.debug.state && Cosmos.debug.state()"}]'
```

- Look at every screenshot with the Read tool (it displays PNGs). Judge them as a demanding art director **and** a domain
  scientist. Screenshots are the only way you can see your work, so use them a lot.
- Actions: `click [x,y]`, `dblclick`, `move`, `drag [[x1,y1],[x2,y2]]`, `wheel [x,y,dy]`, `key "r"|"Space"|"ArrowLeft"`,
  `type "text"`, `eval "js"`, `wait ms`, `shot "name"`. Use `eval` to click deck buttons, e.g.
  `document.querySelector('#my-btn').click()`, or to read `Cosmos.debug.state()`.
- Exit code 1 means errors occurred. The summary also reports fps, the WebGL renderer and horizontal overflow.
- Other agents share this machine and GPU while you test, so fps can read low under contention. Judge real cost by
  frame-time headroom, and don't cut quality just because a contended run reported 30–40 fps.
- Definition of done: zero errors on desktop and mobile; beautiful at t≈2 s and still beautiful ≥10 s later; every deck
  control does something visible; notes and science are complete and accurate; `Cosmos.debug.state()` returns sane numbers.

## Note for whoever works on the hub (index.html)

`index.html` already exists and is strong: a WebGL2 particle-spiral hero plus a six-scale logarithmic timeline laid out in
script. If your task is the hub, **improve it in place**: keep its structure and layout engine, and refine, fix and extend it.
Do not rewrite it from scratch. Thumbnails in `thumbs/` get regenerated at the end.
