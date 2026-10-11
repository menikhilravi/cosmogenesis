# Cosmogenesis

**13.8 billion years. 22 live simulations. One browser tab.**

Cosmogenesis is an interactive journey from the first 10⁻³⁶ seconds of the universe to the person reading this page.
Each of its 22 chapters is a working model of its subject, computed in your browser as you watch: an N-body
universe condensing into filaments, light bending around a black hole, Turing patterns spotting a leopard, a heart
you can throw into fibrillation and shock back, a neural network that learns to paint. Every chapter comes with a
Story tab that says what you are looking at and a Science tab that gives the equations, the parameter values, what
was scaled down for the screen, and the papers the model comes from.

## Opening it

- **Double-click `index.html`.** Everything works from `file://`. No install, no build, no network except Google Fonts.
- Or serve the folder: `python3 -m http.server` in this directory, then open <http://localhost:8000>.

Best on a laptop with a GPU in a recent Chrome, Edge, Safari or Firefox. It also works on phones: the controls become
a bottom sheet and the notes fold away.

## The chapters

| #  | Chapter                  | Era                                    | Model |
|----|--------------------------|----------------------------------------|-------|
| 01 | Quantum Foam             | t ≈ 10⁻³⁶ s                            | Slow-roll inflaton · Gaussian random field |
| 02 | The First Three Minutes  | t = 1 s → 20 min                       | Big Bang nucleosynthesis reaction network · stiff ODE solver |
| 03 | First Light              | t = 380,000 yr                         | Saha equation · CMB acoustic peaks |
| 04 | The Cosmic Web           | t = 100 Myr → 13.8 Gyr                 | Particle-mesh N-body, 262,144 particles |
| 05 | Island Universes         | t = 1 → 13.8 Gyr                       | Restricted N-body galaxy encounter (Toomre & Toomre) |
| 06 | The Lives of Stars       | every star since t = 100 Myr           | Stellar evolution tracks · HR diagram |
| 07 | The Event Horizon        | where the heaviest stars die           | Schwarzschild geodesics, GPU ray tracing |
| 08 | Birth of Worlds          | 4.6 billion years ago                  | Planetesimal N-body · Kepler orbits |
| 09 | The Pale Blue Dot        | 4.5 billion years ago → today          | Rayleigh + Mie scattering · plate motion |
| 10 | Primordial Soup          | ≈ 4.0 billion years ago                | Particle Life with non-reciprocal forces |
| 11 | First Life               | ≈ 3.8 billion years ago                | Lenia continuous cellular automata |
| 12 | The Code of Life         | in every cell, for 3.8 billion years   | Central dogma (DNA → RNA → protein) · Langevin folding |
| 13 | Morphogenesis            | 600 million years ago → every embryo   | Gray–Scott reaction–diffusion |
| 14 | Endless Forms            | 541 million years ago · the Cambrian   | Neuroevolution ecosystem |
| 15 | Murmuration              | any winter dusk                        | Topological flocking (7 nearest neighbours) |
| 16 | The Beating Heart        | now · 72 beats a minute                | Aliev–Panfilov cardiac tissue · pseudo-ECG |
| 17 | The Spark of Thought     | now · 86 billion neurons               | Hodgkin–Huxley axon · Izhikevich network |
| 18 | The War Within           | now · two trillion immune cells        | Target-cell viral dynamics · clonal selection |
| 19 | The Learning Machine     | 1943 → now                             | Backprop MLP with Fourier features, written from scratch |
| 20 | Lights of Civilization   | 10,000 BCE → now                       | Logistic growth · Zipf’s law |
| 21 | The Last Light           | t = 10¹⁴ → 10¹⁰⁰ years                 | Five ages of the universe · Hawking evaporation |
| 22 | You Are Here             | t = 13.8 billion years · now           | Stardust accounting |

The hub (`index.html`) lays all 22 on a single logarithmic clock that changes scale five times, retells the story
as one calendar year, and keeps live counters of what the universe did while you were reading.

## Keyboard

These work in every chapter. Press <kbd>?</kbd> inside a chapter for its own extra keys (most have <kbd>R</kbd> to
restart or reverse, plus presets).

| Key | Action |
|-----|--------|
| <kbd>Space</kbd> | Pause or play the simulation |
| <kbd>H</kbd> | Hide the interface (cinema mode) |
| <kbd>N</kbd> | Open or fold the field notes |
| <kbd>C</kbd> | Show or hide the controls |
| <kbd>M</kbd> | Sound on or off (off until you turn it on) |
| <kbd>F</kbd> | Fullscreen |
| <kbd>[</kbd> <kbd>]</kbd> | Previous or next chapter |
| <kbd>?</kbd> | All shortcuts |

Drag, click, scroll and pinch inside the simulations; most respond to touch.

## Technical notes

- **Zero dependencies.** No frameworks, no bundler, no libraries, no network data. About 3.8 MB of hand-written
  HTML, CSS, JavaScript and GLSL in 25 files. Each chapter is one self-contained HTML file that shares a small runtime
  (`cosmos.js`) and stylesheet (`cosmos.css`).
- **WebGL2 first.** The heavy simulations (N-body, reaction–diffusion, Lenia, cardiac tissue, ray tracing) run as
  fragment-shader passes on floating-point render targets, with half-float and reduced-quality fallbacks. Pages cap the
  device pixel ratio, scale their workloads down on phones, and pause while the tab is hidden.
- **Honest science.** Where something is scaled for the screen (particle counts, time steps, distances), the Science tab
  says so. Every chapter cites its sources.
- **Private.** Everything runs locally. Nothing is sent anywhere; `localStorage` only remembers small conveniences.
- **Headless test harness.** `tools/snap.mjs` drives headless Chrome over the DevTools protocol: it loads a page,
  records console errors and uncaught exceptions, measures frame rate, runs scripted interactions (clicks, drags, keys,
  `eval`), and saves screenshots at desktop (1440×900) or phone (390×844 @2×) size.

  ```bash
  node tools/snap.mjs ch07-black-hole.html                 # desktop: errors, fps, 3 timed shots in .snap/shots/
  node tools/snap.mjs ch07-black-hole.html --mobile --quiet
  tools/thumbs.sh                                          # regenerate the hub thumbnails in thumbs/
  ```

  In the final integration pass all 22 chapters and the hub loaded with zero console errors, at 51–60 fps on an Apple M3.

## Layout

```
index.html              the hub: spiral hero, logarithmic timeline, one-year calendar, models, how to explore
ch01-inflation.html …   the 22 chapters (file names come from the registry in cosmos.js)
cosmos.js / cosmos.css  shared runtime (chapter chrome, controls, HUD, WebGL helpers) and styles
thumbs/                 chapter thumbnails for the hub
tools/                  test harness and publishing helpers
.snap/                  scratch screenshots (not used by the pages)
```
