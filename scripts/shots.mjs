/**
 * Capturas comparativas: sitio original vs. versión nueva.
 *
 *   node scripts/shots.mjs           -> ambos
 *   node scripts/shots.mjs new       -> sólo la versión nueva (localhost)
 *   node scripts/shots.mjs old       -> sólo pazdj.com
 *
 * Requiere `npm run build` previo. Las imágenes van a screenshots/.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

/* Anchos extra sólo para comprobar que nada desborda. */
const OVERFLOW_WIDTHS = [320, 375, 430, 1024, 1280];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function serve(dir, port) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(dir, url);
    if (url.endsWith('/')) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(dir, url + '.html');
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  // Recorre la página entera reevaluando el alto en cada paso: al cargarse las
  // imágenes diferidas el documento crece, y un alto medido una sola vez al
  // principio deja secciones sin visitar (y sin disparar el IntersectionObserver).
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    let y = 0;
    let guard = 0;
    while (y < document.documentElement.scrollHeight && guard++ < 80) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
      y += step;
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 300));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
    await (document.fonts ? document.fonts.ready : Promise.resolve());
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(900);
}

/**
 * pazdj.com es un canvas de Canva: html/body quedan a la altura del viewport y
 * `fullPage` sólo captura la primera pantalla. Para el original usamos un
 * viewport tan alto como el documento real (≈2,29 veces el ancho).
 */
async function shootOriginal(browser, url, prefix) {
  for (const vp of VIEWPORTS) {
    const tall = Math.round(vp.width * 2.45);
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: tall },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await settle(page);
    await page.screenshot({ path: path.join(OUT, `${prefix}_${vp.name}.png`), fullPage: true });
    console.log(`ORIG   ${vp.name.padEnd(10)} capturado a ${vp.width}x${tall}`);
    await ctx.close();
  }
}

async function shoot(browser, url, label, prefix) {
  const results = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference',
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await settle(page);
    const file = path.join(OUT, `${prefix}_${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    results.push({ vp: vp.name, overflow, height });
    console.log(
      `${label} ${vp.name.padEnd(10)} h=${String(height).padStart(5)}px  overflow=${overflow}`,
    );
    await ctx.close();
  }
  return results;
}

async function overflowSweep(browser, url, label) {
  console.log(`\n-- barrido de desbordamiento (${label}) --`);
  for (const width of OVERFLOW_WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await settle(page);
    const info = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const offenders = [];
      if (docW > window.innerWidth + 1) {
        document.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 1 || r.left < -1) {
            offenders.push(
              `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} [${Math.round(r.left)}..${Math.round(r.right)}]`,
            );
          }
        });
      }
      return { docW, vw: window.innerWidth, offenders: offenders.slice(0, 8) };
    });
    const bad = info.docW > info.vw + 1;
    console.log(`  ${String(width).padStart(4)}px  doc=${info.docW}  ${bad ? 'OVERFLOW' : 'ok'}`);
    if (bad) info.offenders.forEach((o) => console.log(`         ${o}`));
    await ctx.close();
  }
}

const mode = process.argv[2] || 'both';
const browser = await chromium.launch();
let server;

try {
  if (mode !== 'old') {
    server = await serve(DIST, 4331);
    await shoot(browser, 'http://localhost:4331/', 'NUEVA ', 'new');
    await overflowSweep(browser, 'http://localhost:4331/', 'nueva');
  }
  if (mode !== 'new') {
    await shootOriginal(browser, 'https://pazdj.com/', 'old');
  }
} finally {
  await browser.close();
  server?.close();
}
console.log('\nCapturas en screenshots/');
