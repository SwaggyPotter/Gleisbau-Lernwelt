#!/usr/bin/env node
/**
 * Formel-Prüfbot starten: bündelt pruefbot.ts mit esbuild und führt es aus.
 *   node tools/formelsammlung-tests/pruefbot.cjs [bericht.md]
 *   npm run pruefbot:formeln
 */
const { buildSync } = require('esbuild');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ziel = fs.mkdtempSync(path.join(os.tmpdir(), 'formel-pruefbot-'));
const out = path.join(ziel, 'pruefbot.cjs');
buildSync({ entryPoints: [path.join(__dirname, 'pruefbot.ts')], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out, logLevel: 'error' });
const r = spawnSync(process.execPath, [out, ...process.argv.slice(2)], { stdio: 'inherit' });
fs.rmSync(ziel, { recursive: true, force: true });
process.exit(r.status ?? 1);
