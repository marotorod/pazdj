import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4401/';
const axeSource = fs.readFileSync(
  'C:/Users/R Maroto/Downloads/pazdj/pazdj-web/pazdj/node_modules/axe-core/axe.min.js',
  'utf8',
);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.addScriptTag({ content: axeSource });

const res = await page.evaluate(async () => {
  const r = await window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  });
  return r.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => ({
      html: n.html.slice(0, 200),
      target: n.target.join(' '),
      msg: n.any.map((a) => a.message).join(' | '),
      data: a_data(a_first(n)),
    })),
  }));

  function a_first(n) {
    return n.any?.[0];
  }
  function a_data(a) {
    return a?.data ? JSON.stringify(a.data) : '';
  }
});

for (const v of res) {
  console.log(`\n### ${v.id} [${v.impact}] — ${v.help}`);
  v.nodes.forEach((n) => {
    console.log(`  target : ${n.target}`);
    console.log(`  html   : ${n.html}`);
    console.log(`  motivo : ${n.msg}`);
    console.log(`  datos  : ${n.data}`);
  });
}
if (!res.length) console.log('sin violaciones');

await browser.close();
