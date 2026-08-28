/**
 * Detalle de las regresiones detectadas en una URL publicada.
 *   node scripts/compare-live.mjs https://pazdj.lovable.app/
 */
import { chromium } from 'playwright';

const BASE = process.argv[2];
if (!BASE) throw new Error('Falta la URL');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const responses = [];
page.on('response', async (r) => {
  try {
    const buf = await r.body();
    responses.push({
      url: r.url(),
      type: (r.headers()['content-type'] || '').split(';')[0],
      kb: buf.length / 1024,
    });
  } catch {
    /* sin cuerpo */
  }
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const head = await page.evaluate(() => ({
  canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'),
  ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
  ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
  jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent,
  skip: document.querySelector('a[href^="#"]')?.getAttribute('href'),
  imgsSinDim: [...document.querySelectorAll('img')]
    .filter((i) => !i.getAttribute('width') || !i.getAttribute('height'))
    .map((i) => (i.currentSrc || i.src).split('/').pop()?.slice(0, 44)),
  imgFormats: [...document.querySelectorAll('img')].map((i) => ({
    src: (i.currentSrc || i.src).split('/').pop()?.slice(0, 44),
    srcset: i.getAttribute('srcset') ? 'sí' : 'NO',
    nat: `${i.naturalWidth}x${i.naturalHeight}`,
    box: `${Math.round(i.getBoundingClientRect().width)}x${Math.round(i.getBoundingClientRect().height)}`,
  })),
}));

console.log('--- <head> ---');
console.log('canonical :', head.canonical);
console.log('og:url    :', head.ogUrl);
console.log('og:image  :', head.ogImage);
console.log('skip link :', head.skip);
console.log('\n--- JSON-LD ---');
try {
  const ld = JSON.parse(head.jsonLd);
  console.log('@type     :', JSON.stringify(ld['@type']));
  console.log('claves    :', Object.keys(ld).join(', '));
} catch {
  console.log('(ausente o inválido)', String(head.jsonLd).slice(0, 200));
}

console.log('\n--- imágenes sin width/height ---');
console.log(head.imgsSinDim.length ? head.imgsSinDim.join('\n') : '(ninguna)');

console.log('\n--- imágenes: formato y tamaño servido vs mostrado ---');
console.table(head.imgFormats);

const cookies = await ctx.cookies();
console.log('\n--- cookies ---');
cookies.forEach((c) => console.log(`  ${c.name}  (dominio ${c.domain})`));

console.log('\n--- 12 recursos más pesados ---');
responses
  .sort((a, b) => b.kb - a.kb)
  .slice(0, 12)
  .forEach((r) =>
    console.log(
      `  ${r.kb.toFixed(0).padStart(5)} KB  ${r.type.padEnd(24)} ${r.url.split('/').pop()?.slice(0, 50)}`,
    ),
  );

const total = responses.reduce((a, r) => a + r.kb, 0);
const js = responses.filter((r) => r.type.includes('javascript')).reduce((a, r) => a + r.kb, 0);
const img = responses.filter((r) => r.type.startsWith('image')).reduce((a, r) => a + r.kb, 0);
console.log(
  `\n  TOTAL ${total.toFixed(0)} KB   JS ${js.toFixed(0)} KB   imágenes ${img.toFixed(0)} KB`,
);

await browser.close();
