// Wrapper around `remotion render` that names the output file
// based on the active token + a timestamp, so each render is unique.
//   out/TRILLION-20250609-181030.mp4
//
// Reads token symbol from src/pumpfun-screen/data/active.json.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const data = JSON.parse(
  fs.readFileSync(path.join(root, 'src/pumpfun-screen/data/active.json'), 'utf8'),
);

const symbol = (data.token?.symbol || 'TOKEN').replace(/[^A-Z0-9_-]/gi, '').toUpperCase();
// Read language from the patched engine.ts (tfLabel content). Best effort.
let lang = process.env.MAKE_LANG || '';
if (!lang) {
  try {
    const engineSrc = fs.readFileSync(path.join(root, 'src/pumpfun-screen/engine.ts'), 'utf8');
    const m = engineSrc.match(/tfLabel:\s*"([^"]+)"/);
    if (m && /[一-鿿]/.test(m[1])) lang = 'zh';
    else lang = 'en';
  } catch { /* ignore */ }
}
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const outDir = path.join(root, 'out');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${symbol}-${lang}-${stamp}.mp4`);

console.log(`🎬 Rendering ${symbol} → ${path.relative(root, outFile)}`);

const child = spawn(
  'npx',
  ['remotion', 'render', 'src/index.ts', 'PumpFunScreen', outFile],
  { cwd: root, stdio: 'inherit' },
);

child.on('exit', (code) => {
  if (code === 0) {
    console.log(`✅ Done → ${path.relative(root, outFile)}`);
  }
  process.exit(code ?? 0);
});
