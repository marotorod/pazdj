/** Recorta regiones de una captura para poder inspeccionarlas a escala útil. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'screenshots');

// argv: file top height [scale]
const [file, topArg, heightArg, scaleArg] = process.argv.slice(2);
const top = Number(topArg);
const height = Number(heightArg);
const scale = Number(scaleArg ?? 2);

const src = path.join(SHOTS, file);
const meta = await sharp(src).metadata();
const h = Math.min(height, meta.height - top);
const out = path.join(SHOTS, `crop_${file.replace('.png', '')}_${top}.png`);

await sharp(src)
  .extract({ left: 0, top, width: meta.width, height: h })
  .resize(Math.round(meta.width * scale), null, { kernel: 'lanczos3' })
  .png()
  .toFile(out);

console.log(out, `${meta.width}x${h} -> x${scale}`);
