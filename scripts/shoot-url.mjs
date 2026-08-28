/**
 * Captura una URL a los cuatro anchos de referencia.
 *   node scripts/shoot-url.mjs http://localhost:4401/ lovable
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const url = process.argv[2];
const prefix = process.argv[3] || 'url';
if (!url) throw new Error('Falta la URL');

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(async () => {
    let y = 0;
    let guard = 0;
    while (y < document.documentElement.scrollHeight && guard++ < 80) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 110));
      y += window.innerHeight * 0.8;
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `${prefix}_${vp.name}.png`), fullPage: true });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`${prefix} ${vp.name.padEnd(10)} h=${String(h).padStart(5)}px  overflow=${overflow}`);
  await ctx.close();
}
await browser.close();
