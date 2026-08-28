import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = await new Promise((resolve) => {
  const s = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(DIST, url);
    if (url.endsWith('/')) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(DIST, url + '.html');
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end('nf');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  s.listen(4332, () => resolve(s));
});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) =>
  errors.push(`reqfail: ${r.url().slice(-70)} ${r.failure()?.errorText}`),
);

await page.goto('http://localhost:4332/', { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1200);

const report = await page.evaluate(() => {
  const rows = [];
  const probe = (sel) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      rows.push({
        sel: `${sel}[${i}]`,
        cls: (el.className || '').toString().slice(0, 40),
        display: cs.display,
        opacity: cs.opacity,
        visibility: cs.visibility,
        zIndex: cs.zIndex,
        transform: cs.transform === 'none' ? 'none' : 'set',
        box: `${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top + scrollY)}`,
      });
    });
  };
  probe('.gallery');
  probe('.gallery__layout');
  probe('.mosaic');
  probe('.tile');
  probe('.mosaic__letter');
  probe('.gallery__sound');
  probe('.set');
  probe('.set__layout');
  probe('.set__caption');
  probe('.set__player');
  probe('.set__texture');
  probe('.set__texture img');
  probe('.embed');

  const imgs = [...document.querySelectorAll('img')].map((i) => ({
    src: i.currentSrc.split('/').pop()?.slice(0, 30),
    nat: `${i.naturalWidth}x${i.naturalHeight}`,
    box: `${Math.round(i.getBoundingClientRect().width)}x${Math.round(i.getBoundingClientRect().height)}`,
    op: getComputedStyle(i).opacity,
  }));

  return {
    rows,
    imgs,
    revealCount: document.querySelectorAll('.reveal').length,
    visibleCount: document.querySelectorAll('.reveal.is-visible').length,
  };
});

console.log('reveal:', report.visibleCount, '/', report.revealCount, 'visibles');
console.log('\n--- elementos ---');
console.table(report.rows);
console.log('\n--- imágenes ---');
console.table(report.imgs);
console.log('\n--- consola / red ---');
if (errors.length === 0) console.log('  (sin errores)');
errors.slice(0, 20).forEach((e) => console.log('  ' + e));

await browser.close();
server.close();
