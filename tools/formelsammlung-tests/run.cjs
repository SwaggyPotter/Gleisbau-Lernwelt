#!/usr/bin/env node
/**
 * Node-Tests für die Formelsammlung (src/app/modules/berufsschule/formelsammlung).
 * Bündelt jede *.test.ts mit esbuild (kommt mit Angular mit) und führt sie mit `node --test` aus.
 *
 *   node tools/formelsammlung-tests/run.cjs
 *   npm run test:formeln
 */
const { buildSync } = require('esbuild');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const hier = __dirname;
const ziel = fs.mkdtempSync(path.join(os.tmpdir(), 'formelsammlung-tests-'));
const tests = fs.readdirSync(hier).filter(f => f.endsWith('.test.ts'));

const ausgaben = tests.map(t => {
  const out = path.join(ziel, t.replace(/\.ts$/, '.cjs'));
  buildSync({
    entryPoints: [path.join(hier, t)],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: out,
    logLevel: 'error',
  });
  return out;
});

const r = spawnSync(process.execPath, ['--test', ...ausgaben], { stdio: 'inherit' });
fs.rmSync(ziel, { recursive: true, force: true });
process.exit(r.status ?? 1);
