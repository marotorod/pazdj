#!/usr/bin/env node
/**
 * Auditoría automatizada de pazdj.com con navegador real.
 *
 * Extrae de la web renderizada (no del HTML inicial):
 *   - HTML final tras ejecutar JS
 *   - Textos, jerarquía de headings, enlaces, redes sociales
 *   - Imágenes (incluidas background-image en CSS), vídeos y embeds
 *   - Tipografías reales, tamaños, pesos, line-height, tracking
 *   - Paleta de colores por frecuencia de uso
 *   - Metadatos SEO, Open Graph, JSON-LD, analítica de terceros
 *   - Screenshots full-page en todos los breakpoints objetivo
 *   - Descarga de todos los assets a original/assets/
 *
 * Uso:  node tools/audit-original.mjs [url]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const TARGET = process.argv[2] ?? 'https://pazdj.com/';
const OUT = path.resolve('original');

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

/** Se ejecuta dentro de la página: vuelca todo lo que define la identidad visual. */
function extract() {
  const abs = (u) => { try { return new URL(u, location.href).href; } catch { return u; } };
  const all = [...document.querySelectorAll('*')];

  const colors = {};
  const fonts = {};
  const backgrounds = new Set();
  const typography = [];

  for (const el of all) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    for (const prop of ['color', 'background-color', 'border-top-color', 'fill']) {
      const v = cs.getPropertyValue(prop);
      if (v && v !== 'rgba(0, 0, 0, 0)' && v !== 'none') colors[v] = (colors[v] ?? 0) + 1;
    }

    const fam = cs.fontFamily;
    if (fam) fonts[fam] = (fonts[fam] ?? 0) + 1;

    for (const prop of ['background-image', 'mask-image', 'border-image-source']) {
      const v = cs.getPropertyValue(prop);
      if (v && v !== 'none') {
        for (const m of v.matchAll(/url\((['"]?)(.*?)\1\)/g)) backgrounds.add(abs(m[2]));
      }
    }

    // Muestra tipográfica solo de elementos con texto propio y visibles.
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    if (own && rect.width > 0 && rect.height > 0) {
      typography.push({
        tag: el.tagName.toLowerCase(),
        class: el.className && typeof el.className === 'string' ? el.className : '',
        text: own.slice(0, 120),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
        color: cs.color,
      });
    }
  }

  const meta = {};
  for (const m of document.querySelectorAll('meta')) {
    const key = m.getAttribute('name') ?? m.getAttribute('property') ?? m.getAttribute('http-equiv');
    if (key) meta[key] = m.getAttribute('content');
  }

  return {
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang,
    meta,
    canonical: document.querySelector('link[rel=canonical]')?.href ?? null,
    favicons: [...document.querySelectorAll('link[rel*=icon]')].map((l) => ({ rel: l.rel, href: l.href, sizes: l.sizes?.value })),
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),

    headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .map((h) => ({ level: h.tagName, text: h.innerText.trim() })),

    // Texto completo tal cual se ve, para no reescribir ni una coma.
    visibleText: document.body.innerText,

    links: [...document.querySelectorAll('a[href]')].map((a) => ({
      href: a.href,
      text: a.innerText.trim() || a.getAttribute('aria-label') || a.querySelector('img')?.alt || '',
      target: a.target || null,
      rel: a.rel || null,
      external: !a.href.startsWith(location.origin),
    })),

    images: [...document.querySelectorAll('img')].map((img) => ({
      src: img.src,
      currentSrc: img.currentSrc,
      srcset: img.getAttribute('srcset'),
      sizes: img.getAttribute('sizes'),
      alt: img.alt,
      loading: img.loading,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      renderedWidth: Math.round(img.getBoundingClientRect().width),
      renderedHeight: Math.round(img.getBoundingClientRect().height),
    })),

    backgroundImages: [...backgrounds],

    svgInline: [...document.querySelectorAll('svg')].map((s) => ({
      class: typeof s.className === 'object' ? s.className.baseVal : '',
      ariaLabel: s.getAttribute('aria-label'),
      markup: s.outerHTML.slice(0, 4000),
    })),

    videos: [...document.querySelectorAll('video')].map((v) => ({
      src: v.src || null,
      poster: v.poster || null,
      autoplay: v.autoplay, loop: v.loop, muted: v.muted,
      sources: [...v.querySelectorAll('source')].map((s) => ({ src: s.src, type: s.type })),
    })),

    iframes: [...document.querySelectorAll('iframe')].map((f) => ({
      src: f.src, title: f.title, loading: f.loading,
      width: Math.round(f.getBoundingClientRect().width),
      height: Math.round(f.getBoundingClientRect().height),
    })),

    stylesheets: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href),
    scripts: [...document.querySelectorAll('script[src]')].map((s) => s.src),

    fonts: Object.entries(fonts).sort((a, b) => b[1] - a[1]),
    loadedFonts: [...document.fonts].map((f) => ({ family: f.family, weight: f.weight, style: f.style, status: f.status })),
    colors: Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 60),
    typography,

    bodyStyles: (() => {
      const cs = getComputedStyle(document.body);
      return { background: cs.backgroundColor, color: cs.color, font: cs.fontFamily, fontSize: cs.fontSize };
    })(),

    // Candidatos a menú/hamburguesa para documentar su comportamiento.
    navCandidates: [...document.querySelectorAll('nav, header, [class*=menu i], [class*=nav i], [class*=burger i], [class*=hamburger i]')]
      .slice(0, 40)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        class: typeof el.className === 'string' ? el.className : '',
        id: el.id,
        role: el.getAttribute('role'),
        ariaExpanded: el.getAttribute('aria-expanded'),
        ariaLabel: el.getAttribute('aria-label'),
        text: el.innerText?.trim().slice(0, 200) ?? '',
      })),
  };
}

async function download(page, url, dir) {
  try {
    const res = await page.request.get(url, { timeout: 30000 });
    if (!res.ok()) return { url, ok: false, status: res.status() };
    const u = new URL(url);
    let name = path.basename(u.pathname) || 'index';
    if (!path.extname(name)) {
      const type = res.headers()['content-type']?.split(';')[0] ?? '';
      const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif', 'image/svg+xml': '.svg', 'image/gif': '.gif', 'video/mp4': '.mp4', 'font/woff2': '.woff2' }[type] ?? '';
      name += ext;
    }
    // Hash de la URL completa: evita que dos assets distintos con el mismo
    // nombre de archivo (o la misma extensión) se pisen entre sí.
    const prefix = createHash('sha1').update(url).digest('hex').slice(0, 8);
    const file = path.join(dir, `${prefix}-${name}`);
    const body = await res.body();
    await writeFile(file, body);
    return { url, ok: true, file: path.relative(OUT, file), bytes: body.length };
  } catch (e) {
    return { url, ok: false, error: e.message };
  }
}

// CHROMIUM_PATH permite reutilizar un Chromium ya instalado en el sistema.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
});
const page = await context.newPage();

// Registra toda petición de red: revela assets que no aparecen en el DOM.
const network = [];
page.on('response', (r) => network.push({ url: r.url(), status: r.status(), type: r.request().resourceType(), contentType: r.headers()['content-type'] ?? null }));

await mkdir(path.join(OUT, 'assets'), { recursive: true });
await mkdir(path.join(OUT, 'screenshots'), { recursive: true });

console.log(`→ Abriendo ${TARGET}`);
await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 60000 });
// Scroll completo para disparar lazy-load y animaciones de entrada.
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(2500);

const data = await page.evaluate(extract);
data.network = network;

await writeFile(path.join(OUT, 'audit.json'), JSON.stringify(data, null, 2));
await writeFile(path.join(OUT, 'rendered.html'), await page.content());
await writeFile(path.join(OUT, 'visible-text.txt'), data.visibleText);
console.log(`✓ audit.json, rendered.html, visible-text.txt`);

// Descarga de assets: imágenes del DOM, backgrounds CSS, vídeos, fuentes, CSS.
const assetUrls = new Set([
  ...data.images.flatMap((i) => [i.src, i.currentSrc, ...(i.srcset ?? '').split(',').map((s) => s.trim().split(/\s+/)[0])]),
  ...data.backgroundImages,
  ...data.videos.flatMap((v) => [v.src, v.poster, ...v.sources.map((s) => s.src)]),
  ...data.favicons.map((f) => f.href),
  ...data.stylesheets,
  ...network.filter((n) => /image|font|media/.test(n.type) || /image\/|font\/|video\//.test(n.contentType ?? '')).map((n) => n.url),
].filter((u) => u && /^https?:/.test(u)));

console.log(`→ Descargando ${assetUrls.size} assets…`);
const results = [];
for (const url of assetUrls) results.push(await download(page, url, path.join(OUT, 'assets')));
await writeFile(path.join(OUT, 'assets-manifest.json'), JSON.stringify(results, null, 2));
console.log(`✓ ${results.filter((r) => r.ok).length}/${results.length} assets descargados`);

// Screenshots en todos los breakpoints exigidos.
for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'screenshots', `${vp.name}-fullpage.png`), fullPage: true });
  await page.screenshot({ path: path.join(OUT, 'screenshots', `${vp.name}-viewport.png`) });
  console.log(`✓ screenshot ${vp.name}`);
}

// Estado del menú móvil abierto, si existe algún disparador reconocible.
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
const trigger = page.locator('button[aria-expanded], [class*=burger i], [class*=hamburger i], [class*="menu-toggle" i], header button').first();
if (await trigger.count()) {
  try {
    await trigger.click({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'screenshots', '390x844-menu-open.png') });
    console.log('✓ screenshot menú móvil abierto');
  } catch { console.log('· no se pudo abrir el menú automáticamente'); }
}

await browser.close();
console.log(`\n✅ Auditoría completa en ./original/`);
