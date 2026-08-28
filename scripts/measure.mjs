/**
 * Mide rasgos equivalentes en la captura original y en la nueva, para poder
 * comparar proporciones con números en vez de a ojo.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'screenshots');

const near = (a, b, tol) => Math.abs(a - b) <= tol;

/** El wordmark es tinta #281f1d sobre el campo rojo, en la mitad derecha. */
const isInk = (r, g, b) => near(r, 40, 22) && near(g, 31, 22) && near(b, 29, 22);
/** Rojo de marca #800000. */
const isRed = (r, g, b) => near(r, 128, 26) && g < 40 && b < 40;

async function heroReport(file, label) {
  const img = sharp(path.join(SHOTS, file));
  const { width, height } = await img.metadata();

  // Altura del hero: última fila que sigue siendo mayoritariamente roja.
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let heroBottom = 0;
  for (let y = 0; y < Math.min(height, Math.round(width * 1.2)); y++) {
    let red = 0;
    for (let x = 0; x < width; x += 8) {
      const i = (y * width + x) * ch;
      if (isRed(data[i], data[i + 1], data[i + 2])) red++;
    }
    if (red / (width / 8) > 0.5) heroBottom = y;
  }

  // El wordmark: tinta dentro del hero y en la mitad derecha del ancho.
  let x1 = Infinity,
    y1 = Infinity,
    x2 = -1,
    y2 = -1;
  for (let y = 0; y < heroBottom; y++) {
    for (let x = Math.round(width * 0.63); x < width; x++) {
      const i = (y * width + x) * ch;
      if (!isInk(data[i], data[i + 1], data[i + 2])) continue;
      if (x < x1) x1 = x;
      if (x > x2) x2 = x;
      if (y < y1) y1 = y;
      if (y > y2) y2 = y;
    }
  }

  if (x2 < 0) {
    console.log(`
${label}  (${width}x${height})`);
    console.log(`  alto del hero        : ${heroBottom}px`);
    console.log('  wordmark             : (no medible en esta banda; layout apilado)');
    return null;
  }

  const wmW = x2 - x1 + 1;
  const wmH = y2 - y1 + 1;
  console.log(`\n${label}  (${width}x${height})`);
  console.log(
    `  alto del hero        : ${heroBottom}px  = ${((heroBottom / width) * 100).toFixed(1)}% del ancho`,
  );
  console.log(`  wordmark             : ${wmW}x${wmH}px  en x=${x1} y=${y1}`);
  console.log(`  wordmark ancho       : ${((wmW / width) * 100).toFixed(2)}% del ancho`);
  console.log(`  wordmark alto        : ${((wmH / width) * 100).toFixed(2)}% del ancho`);
  console.log(`  wordmark centro x    : ${(((x1 + x2) / 2 / width) * 100).toFixed(2)}%`);
  console.log(
    `  wordmark top y       : ${((y1 / heroBottom) * 100).toFixed(1)}% del alto del hero`,
  );
  return { width, heroBottom, wmW, wmH, x1, y1 };
}

const pairs = [
  ['old_1440x900.png', 'new_1440x900.png', '1440'],
  ['old_390x844.png', 'new_390x844.png', '390'],
];

for (const [oldF, newF, label] of pairs) {
  console.log(`\n================= ${label}px =================`);
  await heroReport(oldF, 'ORIGINAL');
  await heroReport(newF, 'NUEVA   ');
}
