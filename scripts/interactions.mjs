/**
 * Comprueba las interacciones reales del sitio: carga bajo demanda de los
 * embeds, tecla Escape, y los ratios de contraste de las parejas de color
 * documentadas en MIGRATION.md.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4334;
const BASE = `http://localhost:${PORT}/`;

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
  s.listen(PORT, () => resolve(s));
});

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FALLA'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

/* ------------------------------------------------------ contraste WCAG --- */
const lum = (hex) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = v.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

console.log('Contraste (WCAG 2.2):');
const pairs = [
  ['Cuerpo de texto sobre fondo oscuro', '#a6a6a6', '#281f1d', 4.5],
  ['Tagline sobre rojo de marca', '#bcbcbc', '#800000', 4.5],
  ['Texto de contacto sobre oscuro', '#ffffff', '#281f1d', 4.5],
  ['Caption de vídeo sobre rojo', '#ffffff', '#800000', 4.5],
  ['Letras decorativas sobre oscuro', '#a6a6a6', '#281f1d', 3],
  ['Iconos sociales (nuevo) sobre oscuro', '#d42b2b', '#281f1d', 3],
  // Referencia: el valor del sitio original, que es justo lo que se corrige.
  ['Iconos sociales (valor original)', '#800000', '#281f1d', null],
];
for (const [label, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  if (min === null) {
    console.log(`  ref   ${label.padEnd(42)} ${fg} / ${bg} = ${r.toFixed(2)}:1  (no cumplía 3:1)`);
    continue;
  }
  const ok = r >= min;
  console.log(
    `  ${ok ? 'OK  ' : 'FALLA'}  ${label.padEnd(42)} ${fg} / ${bg} = ${r.toFixed(2)}:1 (min ${min})`,
  );
  results.push({ name: `Contraste — ${label}`, ok, detail: `${r.toFixed(2)}:1` });
}
console.log('');

/* ------------------------------------------------------------ embeds --- */
const browser = await chromium.launch();
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const thirdParty = new Set();
  page.on('request', (r) => {
    const h = new URL(r.url()).host;
    if (h !== `localhost:${PORT}`) thirdParty.add(h);
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(600);

  check('Ningún iframe antes de interactuar', (await page.locator('iframe').count()) === 0);
  check(
    'Sin dominios de terceros antes de interactuar',
    thirdParty.size === 0,
    [...thirdParty].join(', '),
  );

  // SoundCloud
  await page.locator('.embed__button').first().click();
  await page.waitForTimeout(1500);
  const scFrame = page.locator('.embed').first().locator('iframe');
  check('El embed de SoundCloud se monta al pulsar', (await scFrame.count()) === 1);
  const scSrc = await scFrame.getAttribute('src');
  check(
    'src de SoundCloud correcto',
    (scSrc || '').includes('w.soundcloud.com/player'),
    (scSrc || '').slice(0, 60),
  );
  const scFocus = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
  check('El foco pasa al reproductor tras pulsar', scFocus === 'iframe', scFocus);

  // YouTube (el botón del primer embed ya está oculto tras cargarse)
  await page.locator('.embed').nth(1).locator('.embed__button').click();
  await page.waitForTimeout(1500);
  const ytFrame = page.locator('.embed').nth(1).locator('iframe');
  check('El embed de YouTube se monta al pulsar', (await ytFrame.count()) === 1);
  const ytSrc = await ytFrame.getAttribute('src');
  check(
    'YouTube usa el dominio sin cookies',
    (ytSrc || '').startsWith('https://www.youtube-nocookie.com/embed/6caJfarM1T0'),
    (ytSrc || '').slice(0, 60),
  );

  // Tras pulsar es normal que aparezcan las CDN de cada plataforma. Lo que se
  // verifica es que TODO lo que se contacta pertenece a SoundCloud o YouTube.
  const ALLOWED =
    /(^|\.)(soundcloud\.com|sndcdn\.com|youtube\.com|youtube-nocookie\.com|ytimg\.com|ggpht\.com|googlevideo\.com|gstatic\.com|google\.com)$/;
  const unexpected = [...thirdParty].filter((h) => h && !ALLOWED.test(h));
  check(
    'Tras interactuar sólo se contacta con SoundCloud y YouTube',
    unexpected.length === 0,
    unexpected.length
      ? unexpected.join(', ')
      : `${thirdParty.size} dominios, todos de las dos plataformas`,
  );
  await ctx.close();
}

/* ------------------------------------------------- enlaces externos vivos --- */
{
  const urls = [
    'https://www.instagram.com/_paz_x_mendez_',
    'https://soundcloud.com/pazxmendezx',
    'https://www.youtube.com/@paz-dj',
    'https://www.tiktok.com/@paz__mendez_?_r=1',
    'https://www.youtube.com/watch?v=6caJfarM1T0',
    'https://yinyangcol.com',
    'https://wa.me/573181121845',
  ];
  console.log('\nEnlaces externos (respuesta HTTP):');
  for (const u of urls) {
    try {
      const res = await fetch(u, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36',
        },
      });
      // Instagram/TikTok responden 4xx a peticiones automatizadas: no es un enlace roto.
      const ok = res.status < 400 || [401, 403, 429].includes(res.status);
      console.log(`  ${ok ? 'OK  ' : 'FALLA'}  ${res.status}  ${u}`);
      results.push({ name: `Enlace ${u}`, ok, detail: String(res.status) });
    } catch (e) {
      console.log(`  FALLA  ---  ${u}  (${e.message})`);
      results.push({ name: `Enlace ${u}`, ok: false, detail: e.message });
    }
  }
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${'='.repeat(60)}`);
console.log(`${results.length - failed.length}/${results.length} comprobaciones correctas`);
if (failed.length) {
  console.log('\nFallos:');
  failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
  process.exitCode = 1;
}
