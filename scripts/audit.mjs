/**
 * Auditoría de la versión nueva sobre el build de producción:
 * accesibilidad (axe + comprobaciones propias), enlaces, foco de teclado,
 * tamaños táctiles, movimiento reducido y funcionamiento sin JavaScript.
 *
 *   npm run build && node scripts/audit.mjs
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4333;

// Se puede auditar una URL cualquiera:  node scripts/audit.mjs https://…
// Sin argumento, se audita el build local de dist/.
const TARGET = process.argv[2];
const REMOTE = Boolean(TARGET);
const BASE = TARGET || `http://localhost:${PORT}/`;
const OWN_HOST = REMOTE ? new URL(BASE).host : `localhost:${PORT}`;

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

const server = REMOTE
  ? null
  : await new Promise((resolve) => {
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
        res.writeHead(200, {
          'content-type': MIME[path.extname(file)] || 'application/octet-stream',
        });
        fs.createReadStream(file).pipe(res);
      });
      s.listen(PORT, () => resolve(s));
    });

console.log(`Auditando: ${BASE}
`);

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FALLA'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const axeSource = fs.readFileSync(path.join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');

async function newPage(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...opts,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    let y = 0;
    let guard = 0;
    while (y < document.documentElement.scrollHeight && guard++ < 60) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
      y += window.innerHeight * 0.8;
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  return { ctx, page };
}

/* ---------------------------------------------------------------- axe --- */
{
  const { ctx, page } = await newPage();
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () => {
    // @ts-expect-error axe se inyecta en tiempo de ejecución
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
  });
  const violations = res.violations.filter((v) => v.impact !== 'minor' || true);
  check(
    'axe-core: 0 violaciones WCAG 2.2 AA (escritorio)',
    violations.length === 0,
    violations.map((v) => `${v.id} x${v.nodes.length}`).join(', '),
  );
  if (violations.length) {
    for (const v of violations) {
      console.log(`      · ${v.id} [${v.impact}] ${v.help}`);
      v.nodes.slice(0, 3).forEach((n) => console.log(`          ${n.html.slice(0, 120)}`));
    }
  }
  await ctx.close();
}

/* ------------------------------------------------------- axe en móvil --- */
{
  const { ctx, page } = await newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () => {
    // @ts-expect-error axe se inyecta en tiempo de ejecución
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
  });
  check(
    'axe-core: 0 violaciones WCAG 2.2 AA (móvil 390)',
    res.violations.length === 0,
    res.violations.map((v) => `${v.id} x${v.nodes.length}`).join(', '),
  );
  await ctx.close();
}

/* ------------------------------------------- estructura y contenido --- */
{
  const { ctx, page } = await newPage();
  const info = await page.evaluate(() => {
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
      level: Number(h.tagName[1]),
      text: (h.textContent || '').trim().slice(0, 40),
    }));
    const links = [...document.querySelectorAll('a')].map((a) => {
      // El nombre accesible puede venir del aria-label, del texto o del alt
      // de una imagen contenida (caso del logotipo del estudio de diseño).
      const imgAlt = [...a.querySelectorAll('img')]
        .map((i) => i.getAttribute('alt') || '')
        .join(' ');
      const name = (a.getAttribute('aria-label') || a.textContent || '').trim() || imgAlt.trim();
      return {
        href: a.getAttribute('href') || '',
        name: name.replace(/\s+/g, ' '),
        target: a.target,
        rel: a.rel,
      };
    });
    const imgs = [...document.querySelectorAll('img')].map((i) => ({
      alt: i.getAttribute('alt'),
      hasAlt: i.hasAttribute('alt'),
      w: i.getAttribute('width'),
      h: i.getAttribute('height'),
      loading: i.getAttribute('loading'),
      fetchpriority: i.getAttribute('fetchpriority'),
      src: (i.currentSrc || '').split('/').pop(),
    }));
    const buttons = [...document.querySelectorAll('button')].map((b) => ({
      name: (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70),
    }));
    return {
      headings,
      links,
      imgs,
      buttons,
      lang: document.documentElement.lang,
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.getAttribute('content') || '',
      canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
      jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent || '',
      skip: document.querySelector('.skip-link')?.getAttribute('href') || '',
    };
  });

  const h1s = info.headings.filter((h) => h.level === 1);
  check('Un único H1', h1s.length === 1, `h1="${h1s[0]?.text}"`);

  let orderOk = true;
  for (let i = 1; i < info.headings.length; i++) {
    if (info.headings[i].level - info.headings[i - 1].level > 1) orderOk = false;
  }
  check(
    'Jerarquía de headings sin saltos',
    orderOk,
    info.headings.map((h) => `h${h.level}`).join(' '),
  );

  check('lang del documento', info.lang === 'es', info.lang);
  check(
    'title presente',
    info.title.length > 10 && info.title.length < 70,
    `${info.title.length} car.`,
  );
  check(
    'meta description',
    info.desc.length > 50 && info.desc.length < 175,
    `${info.desc.length} car.`,
  );
  check('canonical', info.canonical.startsWith('https://pazdj.com'), info.canonical);
  check('og:image', info.ogImage.endsWith('/og.jpg'), info.ogImage);
  check('skip link al contenido', info.skip === '#contenido', info.skip);

  const namedLinks = info.links.filter((l) => l.name.length > 0);
  check(
    'Todos los enlaces tienen nombre accesible',
    namedLinks.length === info.links.length,
    `${namedLinks.length}/${info.links.length}`,
  );

  const external = info.links.filter((l) => l.target === '_blank');
  const safe = external.filter((l) => l.rel.includes('noopener') && l.rel.includes('noreferrer'));
  check(
    'Enlaces externos con noopener+noreferrer',
    safe.length === external.length,
    `${safe.length}/${external.length}`,
  );

  check(
    'Todas las imágenes tienen alt',
    info.imgs.every((i) => i.hasAlt),
    `${info.imgs.length} imágenes`,
  );
  check(
    'Todas las imágenes reservan dimensiones',
    info.imgs.every((i) => i.w && i.h),
    '',
  );

  const lcp = info.imgs[0];
  check(
    'Imagen LCP sin lazy y con prioridad alta',
    lcp?.loading === 'eager' && lcp?.fetchpriority === 'high',
    `${lcp?.loading} / ${lcp?.fetchpriority}`,
  );
  const rest = info.imgs.slice(1);
  check(
    'Resto de imágenes con lazy loading',
    rest.every((i) => i.loading === 'lazy'),
    `${rest.filter((i) => i.loading === 'lazy').length}/${rest.length}`,
  );

  check(
    'Botones de embed con nombre accesible',
    info.buttons.every((b) => b.name.length > 10),
    info.buttons.map((b) => b.name.slice(0, 30)).join(' | '),
  );

  try {
    const ld = JSON.parse(info.jsonLd);
    check(
      'JSON-LD Person válido',
      ld['@type'] === 'Person' && Array.isArray(ld.sameAs) && ld.sameAs.length === 4,
      `sameAs: ${ld.sameAs?.length}`,
    );
  } catch {
    check('JSON-LD Person válido', false, 'JSON inválido');
  }

  console.log('\n  Enlaces encontrados:');
  info.links.forEach((l) => console.log(`      ${l.href}  ->  "${l.name.slice(0, 58)}"`));

  await ctx.close();
}

/* -------------------------------------------------- teclado y foco --- */
{
  const { ctx, page } = await newPage();
  const seq = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    const el = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const cs = getComputedStyle(a);
      return {
        tag: a.tagName.toLowerCase(),
        name: (a.getAttribute('aria-label') || a.textContent || '')
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 42),
        outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
      };
    });
    if (el) seq.push(el);
  }
  check('Todo lo interactivo es alcanzable con Tab', seq.length >= 9, `${seq.length} paradas`);
  check(
    'Todas las paradas muestran anillo de foco',
    seq.every((s) => s.outline),
    `${seq.filter((s) => s.outline).length}/${seq.length}`,
  );
  console.log('\n  Orden de tabulación:');
  seq.forEach((s, i) => console.log(`      ${i + 1}. <${s.tag}> ${s.name}`));
  await ctx.close();
}

/* ---------------------------------------- tamaños táctiles en móvil --- */
{
  const { ctx, page } = await newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const small = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('a, button').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (el.classList.contains('skip-link')) return;
      if (r.width < 44 || r.height < 44) {
        bad.push(
          `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)}`,
        );
      }
    });
    return bad;
  });
  check('Objetivos táctiles >= 44x44 en móvil', small.length === 0, small.join(', '));

  const tiny = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('p, li, a, span, figcaption').forEach((el) => {
      if (!el.textContent?.trim()) return;
      if (el.closest('.sr-only') || el.classList.contains('sr-only')) return;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (fs < 12)
        bad.push(
          `${el.tagName.toLowerCase()} ${fs.toFixed(1)}px "${el.textContent.trim().slice(0, 24)}"`,
        );
    });
    return bad;
  });
  check('Sin texto por debajo de 12px en móvil', tiny.length === 0, tiny.slice(0, 4).join(' | '));

  const bodyFs = await page.evaluate(() => {
    const p = document.querySelector('.bio__text p');
    return p ? parseFloat(getComputedStyle(p).fontSize) : 0;
  });
  check('Cuerpo de texto legible en móvil (>=16px)', bodyFs >= 16, `${bodyFs}px`);
  await ctx.close();
}

/* -------------------------------------------------- movimiento reducido --- */
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' });
  const hidden = await page.evaluate(
    () =>
      [...document.querySelectorAll('.reveal')].filter(
        (el) => parseFloat(getComputedStyle(el).opacity) < 1,
      ).length,
  );
  check(
    'Con prefers-reduced-motion todo el contenido es visible',
    hidden === 0,
    `${hidden} bloques ocultos`,
  );
  await ctx.close();
}

/* -------------------------------------------------------------- sin JS --- */
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const reveals = [...document.querySelectorAll('.reveal')];
    return {
      hidden: reveals.filter((el) => parseFloat(getComputedStyle(el).opacity) < 1).length,
      total: reveals.length,
      text: (document.body.innerText || '').length,
    };
  });
  check(
    'Sin JavaScript el contenido sigue visible',
    info.hidden === 0,
    `${info.hidden}/${info.total} ocultos, ${info.text} car. de texto`,
  );
  await ctx.close();
}

/* --------------------------------------- terceros en la carga inicial --- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const hosts = new Set();
  page.on('request', (r) => {
    const h = new URL(r.url()).host;
    if (h !== OWN_HOST) hosts.add(h);
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    let y = 0;
    while (y < document.documentElement.scrollHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
      y += window.innerHeight;
    }
  });
  await page.waitForTimeout(800);
  check('Cero peticiones a terceros antes de interactuar', hosts.size === 0, [...hosts].join(', '));

  const cookies = await ctx.cookies();
  check('Cero cookies', cookies.length === 0, `${cookies.length}`);
  await ctx.close();
}

/* ------------------------------------------------------------- pesos --- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  let bytes = 0;
  let jsBytes = 0;
  page.on('response', async (r) => {
    try {
      const buf = await r.body();
      bytes += buf.length;
      if ((r.headers()['content-type'] || '').includes('javascript')) jsBytes += buf.length;
    } catch {
      /* respuestas sin cuerpo */
    }
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  console.log(
    `\n  Peso del primer viewport: ${(bytes / 1024).toFixed(1)} KB (JS: ${(jsBytes / 1024).toFixed(1)} KB)`,
  );
  check(
    'JavaScript inicial por debajo de 15 KB',
    jsBytes < 15 * 1024,
    `${(jsBytes / 1024).toFixed(1)} KB`,
  );
  await ctx.close();
}

await browser.close();
server?.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${'='.repeat(60)}`);
console.log(`${results.length - failed.length}/${results.length} comprobaciones correctas`);
if (failed.length) {
  console.log('\nFallos:');
  failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
  process.exitCode = 1;
}
