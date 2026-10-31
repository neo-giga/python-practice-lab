// Copy the exact pinned Pyodide core runtime from node_modules into public/pyodide/
// so the app serves one reproducible asset set from its own origin (no CDN at runtime).
// The copied files are build output and are git-ignored.
import { copyFileSync, mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve('pyodide/package.json'));
const { version } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const out = join(root, 'public', 'pyodide');
mkdirSync(out, { recursive: true });
const files = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
for (const f of files) {
  const src = join(pkgDir, f);
  if (!existsSync(src)) throw new Error(`pyodide ${version}: missing ${f}`);
  const dst = join(out, f);
  if (!existsSync(dst) || statSync(dst).size !== statSync(src).size) copyFileSync(src, dst);
}
console.log(`pyodide ${version} runtime copied to public/pyodide/ (${files.length} files)`);
