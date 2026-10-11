#!/usr/bin/env node
// publish-prep.mjs — make an Artifact-ready copy of index.html.
// The Artifact host wraps the main page in its own <!doctype><html><head><body> skeleton,
// so the published page must not carry those wrapper tags. Chapter pages are served as
// separate files and keep their full documents.
// Usage: node tools/publish-prep.mjs [--only 04,05,07] [outDir=.snap/publish]
//   --only  publish just these chapter numbers (an interim publish while others are being built):
//           the published cosmos.js gets window.COSMOS_AVAILABLE so chapter navigation skips the rest,
//           and hub links to unpublished chapters are shown as "Still being built".
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
let only = null;
const oi = args.indexOf('--only');
if (oi >= 0) { only = args[oi + 1].split(',').map((x) => x.trim().padStart(2, '0')); args.splice(oi, 2); }
let SRC = ROOT;
const si = args.indexOf('--src');
if (si >= 0) { SRC = path.resolve(ROOT, args[si + 1]); args.splice(si, 2); }
const out = path.resolve(ROOT, args[0] || '.snap/publish');
fs.mkdirSync(out, { recursive: true });
let src = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');

const headM = src.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
const bodyM = src.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
if (!headM || !bodyM) { console.error('index.html: could not find <head> and <body>'); process.exit(1); }
let head = headM[1]
  .replace(/<meta\s+charset[^>]*>\s*/gi, '')
  .replace(/<meta\s+name=["']viewport["'][^>]*>\s*/gi, '');
const title = (head.match(/<title>[\s\S]*?<\/title>/i) || [''])[0];
head = head.replace(title, '');
const attrs = bodyM[1].trim();
let bodyAttrScript = '';
if (attrs) {
  const cls = attrs.match(/class=["']([^"']*)["']/i);
  const data = [...attrs.matchAll(/(data-[\w-]+)=["']([^"']*)["']/gi)];
  const sets = [];
  if (cls) sets.push(`document.body.className=${JSON.stringify(cls[1])};`);
  for (const [, k, v] of data) sets.push(`document.body.setAttribute(${JSON.stringify(k)},${JSON.stringify(v)});`);
  if (sets.length) bodyAttrScript = `<script>${sets.join('')}</script>\n`;
}
const allChapters = fs.readdirSync(SRC).filter(f => /^ch\d\d-.*\.html$/.test(f)).sort();
const chapters = only ? allChapters.filter(f => only.includes(f.slice(2, 4))) : allChapters;
const pendingScript = only ? `
<style>
  a.cg-pending { cursor: default !important; filter: saturate(.35) brightness(.8); opacity: .55; }
  a.cg-pending:hover, a.cg-pending:focus { transform: none !important; }
  .cg-interim { position: relative; z-index: 50; padding: 9px 16px; text-align: center; background: #0b0e1a; color: #979db2;
    border-bottom: 1px solid rgba(236, 230, 214, .12); font: 500 11px/1.4 "JetBrains Mono", ui-monospace, monospace; letter-spacing: .08em; }
  .cg-badge { position: absolute; z-index: 6; top: 10px; right: 10px; font: 600 10px/1 "JetBrains Mono", ui-monospace, monospace;
    letter-spacing: .14em; text-transform: uppercase; color: #ece6d6; background: rgba(5, 6, 12, .82);
    border: 1px solid rgba(236, 230, 214, .28); padding: 6px 8px; border-radius: 4px; pointer-events: none; }
</style>
<script>
(function () {
  var AV = window.COSMOS_AVAILABLE || [];
  function mark() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var f = a.getAttribute('href');
      if (!/^ch\\d\\d-[\\w-]+\\.html$/.test(f) || AV.indexOf(f) >= 0) return;
      if (/^\\s*Begin/i.test(a.textContent) && AV.length) {
        var first = (window.Cosmos && Cosmos.CHAPTERS || []).filter(function (c) { return c.file === AV[0]; })[0];
        a.setAttribute('href', AV[0]);
        a.textContent = 'Start with ' + (first ? first.title : 'the first ready chapter') + ' →';
        return;
      }
      a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); a.classList.add('cg-pending');
      a.title = 'Still being built. It will appear here when it is ready.';
      if (a.querySelector('img, canvas') && !a.querySelector('.cg-badge')) {
        if (getComputedStyle(a).position === 'static') a.style.position = 'relative';
        var b = document.createElement('span'); b.className = 'cg-badge'; b.textContent = 'Still being built'; a.appendChild(b);
      }
    });
  }
  mark();
  new MutationObserver(function () { mark(); }).observe(document.body, { childList: true, subtree: true });
  var total = (window.Cosmos && Cosmos.CHAPTERS) ? Cosmos.CHAPTERS.length : 22;
  var bar = document.createElement('div');
  bar.className = 'cg-interim';
  bar.textContent = 'Preview · ' + AV.length + ' of ' + total + ' chapters are ready · the dimmed ones are still being built';
  document.body.insertBefore(bar, document.body.firstChild);
})();
</script>` : '';
const page = `${title}\n${head.trim()}\n${bodyAttrScript}${bodyM[2].trim()}\n${pendingScript}\n`;
if (/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(page.replace(/<script[\s\S]*?<\/script>/gi, ''))) {
  console.error('warning: wrapper-like tags remain in published page');
}
fs.writeFileSync(path.join(out, 'index.html'), page);
let cosmosSrc = 'cosmos.js';
if (only) {
  const js = fs.readFileSync(path.join(ROOT, 'cosmos.js'), 'utf8');
  fs.writeFileSync(path.join(out, 'cosmos.js'), `window.COSMOS_AVAILABLE = ${JSON.stringify(chapters)};\n` + js);
  cosmosSrc = path.relative(ROOT, path.join(out, 'cosmos.js'));
}
const thumbs = fs.existsSync(path.join(ROOT, 'thumbs')) ? fs.readdirSync(path.join(ROOT, 'thumbs')).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).filter(f => !only || only.includes(f.slice(2, 4))).map(f => 'thumbs/' + f) : [];
const map = Object.fromEntries([...chapters.map(f => [f, path.relative(ROOT, path.join(SRC, f))]), ['cosmos.css', 'cosmos.css'], ['cosmos.js', cosmosSrc], ...thumbs.map(f => [f, f])]);
fs.writeFileSync(path.join(out, 'files.json'), JSON.stringify(map, null, 2));
const bytes = Object.values(map).reduce((s, f) => s + fs.statSync(path.join(ROOT, f)).size, 0) + page.length;
console.log(`wrote ${path.relative(ROOT, path.join(out, 'index.html'))} (${page.length} bytes); ${chapters.length} chapters, ${thumbs.length} thumbs, ${Object.keys(map).length} supporting files, ${(bytes / 1e6).toFixed(2)} MB total`);
