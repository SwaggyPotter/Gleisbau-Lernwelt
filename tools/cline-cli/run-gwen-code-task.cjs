/**
 * Schickt einen KONKRETEN Code-Aenderungsauftrag headless an Cline/Gwen
 * (lokales Qwen-Modell ueber LM Studio), diesmal fuer echte Projektdateien
 * (nicht Vault-Recherche-Markdown wie run-gwen-task.cjs). cwd ist deshalb
 * das Projekt-Root, nicht "Ki Datenspeicher".
 *
 * Verifikation ist bewusst einfach gehalten (anders als beim Recherche-
 * Skript gibt es hier kein festes Frontmatter/Fragen-Format zu pruefen):
 *   1. Wurde ueberhaupt etwas an den genannten Dateien geaendert (git diff)?
 *   2. Baut das Projekt danach fehlerfrei (`ng build --configuration production`)?
 * Beides zusammen ist kein Beweis fuer inhaltliche Korrektheit — das
 * bleibt Aufgabe der manuellen Pruefung (Screenshot etc.) danach.
 *
 * Aufruf (immer vom Projekt-Root aus):
 *   node tools/cline-cli/run-gwen-code-task.cjs --files "src/app/.../x.ts,src/app/.../x.html" --prompt "..."
 *   node tools/cline-cli/run-gwen-code-task.cjs --files "..." --prompt-file scratch/auftrag.txt --timeout 600
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const LOG_DIR = path.join(__dirname, 'logs');
const PROVIDER = 'openai-compatible';
const PROCESS_NAMES = ['cline.exe', 'uvx.exe', 'duckduckgo-mcp-server.exe', 'python.exe'];

function parseArgs(argv) {
  const args = { retries: 0, timeoutSec: 600, files: [], prompt: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--retries') args.retries = Number(argv[++i]);
    else if (a === '--timeout') args.timeoutSec = Number(argv[++i]);
    else if (a === '--files') args.files = argv[++i].split(',').map((s) => s.trim());
    else if (a === '--prompt') args.prompt = argv[++i];
    else if (a === '--prompt-file') args.prompt = fs.readFileSync(argv[++i], 'utf8');
  }
  if (!args.files.length || !args.prompt) {
    console.error('Nutzung: node run-gwen-code-task.cjs --files "a.ts,a.html" --prompt "..." [--prompt-file f.txt] [--timeout Sek] [--retries N]');
    process.exit(2);
  }
  return args;
}

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* synchroner Busy-Wait — hier bewusst kein setTimeout, das Skript ist rein synchron */
  }
}

function cleanup() {
  for (const name of PROCESS_NAMES) {
    try {
      execSync(`taskkill /F /IM ${name}`, { stdio: 'ignore' });
    } catch (_) {}
  }
  try {
    execSync('cline hub stop', { stdio: 'ignore', cwd: ROOT });
  } catch (_) {}
  // Kurze Pause: nach taskkill haelt Windows die Datei-Handles auf cline.exe
  // manchmal noch kurz, ein sofortiger erneuter spawnSync schlaegt dann mit
  // EBUSY fehl (beobachtet am 2026-08-12).
  sleepMs(1500);
}

// Vergleicht gegen einen VORHER-Snapshot der Dateien (nicht `git diff` gegen
// HEAD) — die Zieldateien haben oft schon unkommittete Aenderungen aus
// frueheren Arbeitsschritten derselben Session, ein reiner HEAD-Vergleich
// wuerde also immer "veraendert" melden, egal ob Gwen etwas tat.
function snapshotFiles(files) {
  const snap = {};
  for (const f of files) {
    const p = path.join(ROOT, f);
    snap[f] = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  }
  return snap;
}

function diffAgainstSnapshot(files, before) {
  const changed = [];
  for (const f of files) {
    const p = path.join(ROOT, f);
    const after = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    if (after !== before[f]) changed.push(f);
  }
  return changed;
}

// Nur zur Anzeige im Log (gegen HEAD, kann also auch bereits vorher
// vorhandene, unkommittete Aenderungen aus frueheren Schritten enthalten).
function gitDiffStat(files) {
  try {
    return execSync(`git diff --stat -- ${files.map((f) => `"${f}"`).join(' ')}`, { cwd: ROOT, encoding: 'utf8' });
  } catch (_) {
    return '';
  }
}

function runBuild() {
  const result = spawnSync('npx', ['ng', 'build', '--configuration', 'production'], {
    cwd: ROOT,
    shell: true,
    timeout: 300000,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  return { ok: result.status === 0, output: (result.stdout || '') + '\n' + (result.stderr || '') };
}

// WICHTIG: cline ueber die cmd.exe/PowerShell-Shims (`cline -P ... "<prompt>"`
// mit shell:true) aufzurufen, scheiterte hier daran, dass ein mehrzeiliger
// Prompt (echte \n im Text) von cmd.exe beim Parsen der gequoteten
// Kommandozeile an der ersten Zeile abgeschnitten wurde — Gwen bekam nur
// "Ich bin bereit!" zu sehen, keine der eigentlichen Aufgaben (siehe Log
// vom 2026-08-12). Deshalb hier: node direkt mit dem echten cline-Bin-Skript
// aufrufen, Argumente als Array, OHNE shell — Node uebernimmt dann selbst
// die Windows-Escaping-Logik fuer CreateProcess, cmd.exe parst nichts mehr.
function resolveClineBin() {
  const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
  return path.join(npmRoot, 'cline', 'bin', 'cline');
}

function runAttempt(prompt, timeoutSec) {
  const clineBin = resolveClineBin();
  const result = spawnSync(process.execPath, [clineBin, '-P', PROVIDER, prompt], {
    cwd: ROOT,
    shell: false,
    timeout: timeoutSec * 1000,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  return {
    timedOut: result.signal !== null || result.error?.code === 'ETIMEDOUT',
    output: (result.stdout || '') + '\n' + (result.stderr || ''),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(LOG_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.join(LOG_DIR, `${timestamp}_code-task.log`);

  let finalStatus = 'TECHNICAL_FAILURE';
  let finalDetail = '';

  for (let attempt = 1; attempt <= args.retries + 1; attempt++) {
    console.log(`\n[Versuch ${attempt}/${args.retries + 1}] Code-Aufgabe: ${args.files.join(', ')}`);
    const before = snapshotFiles(args.files);
    cleanup();
    const t0 = Date.now();
    const { output, timedOut } = runAttempt(args.prompt, args.timeoutSec);
    const durationSec = Math.round((Date.now() - t0) / 1000);
    cleanup();

    fs.appendFileSync(logPath, `\n===== Versuch ${attempt} (${durationSec}s) =====\n--- CLI-Output ---\n${output}\n`);

    if (timedOut) {
      finalStatus = 'TECHNICAL_FAILURE';
      finalDetail = `Timeout nach ${args.timeoutSec}s.`;
      console.log(`  -> TIMEOUT (${durationSec}s)`);
      continue;
    }

    const changed = diffAgainstSnapshot(args.files, before);
    if (!changed.length) {
      finalStatus = 'NO_CHANGE';
      finalDetail = 'Keine der genannten Dateien wurde veraendert.';
      console.log(`  -> NO_CHANGE (${durationSec}s)`);
      continue;
    }
    const diff = gitDiffStat(args.files);
    console.log(`  Veraenderte Dateien: ${changed.join(', ')}\n  Diff:\n${diff}`);

    console.log('  Baue Projekt zur Verifikation...');
    const build = runBuild();
    if (!build.ok) {
      finalStatus = 'BUILD_FAILED';
      finalDetail = build.output.slice(-3000);
      fs.appendFileSync(logPath, `\n--- Build-Output (fehlgeschlagen) ---\n${build.output}\n`);
      console.log(`  -> BUILD_FAILED (${durationSec}s) — Details im Log.`);
      break; // kein automatischer Retry bei Build-Fehler, Datei ist bereits veraendert
    }

    finalStatus = 'SUCCESS_BUILD_OK';
    finalDetail = diff;
    console.log(`  -> SUCCESS_BUILD_OK (${durationSec}s)`);
    break;
  }

  console.log(`\n=== Ergebnis: ${finalStatus} ===`);
  console.log(finalDetail);
  console.log(`Log: ${logPath}`);
  process.exit(finalStatus === 'SUCCESS_BUILD_OK' ? 0 : 1);
}

main();
