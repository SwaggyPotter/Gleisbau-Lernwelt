/**
 * Schickt einen Rechercheauftrag headless an Cline/Gwen (lokales Qwen-Modell
 * über LM Studio) und prüft danach automatisch, ob der Lauf tatsächlich
 * etwas Sinnvolles geliefert hat, statt das Ergebnis blind zu übernehmen.
 *
 * Hintergrund: Beim CLI-Probelauf vom 2026-08-11 (siehe
 * "Ki Datenspeicher/13-CLI-Testbereich/_Testergebnisse.md") zeigte sich,
 * dass ein Lauf jederzeit *still* scheitern kann (Absturz mitten im
 * Tool-Aufruf, Timeout, verklemmter Hub-Daemon nach einem Kill) — die Datei
 * bleibt dann unverändert, ohne dass irgendeine Fehlermeldung an den Nutzer
 * geht. Dieses Skript macht drei Dinge, die man sonst von Hand prüfen müsste:
 *
 *   1. Räumt vor UND nach jedem Versuch auf (verwaiste uvx/duckduckgo-mcp-
 *      Prozesse killen, `cline hub stop`) — sonst verklemmt ein einzelner
 *      Absturz alle folgenden Läufe.
 *   2. Prüft nach dem Lauf strukturell, ob die Regeln eingehalten wurden:
 *      - Wurde überhaupt etwas geändert?
 *      - Ist der ursprüngliche "Fragen für die Recherche"-Abschnitt noch
 *        wortwörtlich vorhanden (nicht gelöscht/ersetzt)?
 *      - Ist das Frontmatter bis auf das Feld `status` unverändert?
 *      - Keine bekannten Absturz-Marker im Log (Jinja-Template-Fehler,
 *        Timeout)?
 *   3. Unterscheidet zwei Fehlerarten: technische Fehlschläge (Timeout,
 *      Absturz, keine Änderung) werden automatisch bis zu --retries Mal neu
 *      versucht; Regelverstöße (etwas wurde geschrieben, aber z. B. der
 *      Fragen-Abschnitt fehlt) werden NICHT automatisch wiederholt, sondern
 *      klar als PRÜFEN markiert, weil erneutes Probieren ein systematisches
 *      Modellverhalten vermutlich nicht behebt.
 *
 * Aufruf (immer vom Projekt-Root aus):
 *   node tools/cline-cli/run-gwen-task.cjs "13-CLI-Testbereich/Test-01.md"
 *   node tools/cline-cli/run-gwen-task.cjs "08-Recherche-Gwen/03-Gleisbau-Allgemein.md" --retries 2 --timeout 300
 *   node tools/cline-cli/run-gwen-task.cjs "<Datei>" --extra "Bearbeite nur Frage 4 und 5."
 *
 * Voraussetzung: LM Studio läuft mit dem Modell, das der Cline-Provider
 * "openai-compatible" erwartet (siehe tools/gwen-modell-laden.cmd — Fehler
 * "n_ctx: 4096" heißt, dass das Modell falsch/mit Default-Kontext geladen
 * wurde, danach jenes Skript erneut ausführen).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const VAULT = path.join(ROOT, 'Ki Datenspeicher');
const LOG_DIR = path.join(__dirname, 'logs');
const PROVIDER = 'openai-compatible';
const PROCESS_NAMES = ['cline.exe', 'uvx.exe', 'duckduckgo-mcp-server.exe', 'python.exe'];

const RULES =
  "Du bist Gwen. Bearbeite NUR die genannte Datei. Regeln: nur im Abschnitt " +
  "'Rechercheergebnisse von Gwen' ergänzen (Überschrift und Platzhaltertext dort " +
  "NICHT entfernen, deinen Text darunter einfügen), nie bestehenden Text/Fragen/" +
  "Frontmatter (außer status) ändern oder löschen; keine Normen/Zahlen erfinden, " +
  "bei Unsicherheit 'nicht sicher ermittelt' schreiben; Websuche für Fakten nutzen; " +
  "jede Frage einzeln beantworten, Quelle+Datum angeben; am Ende status auf " +
  "'von Gwen recherchiert' setzen, falls fertig.";

const CRASH_MARKERS = [
  'Error rendering prompt with jinja template',
  'Cannot apply filter',
  'The operation timed out',
  'ENOSPC',
];

function parseArgs(argv) {
  const args = { retries: 2, timeoutSec: 280, extra: '' };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--retries') args.retries = Number(argv[++i]);
    else if (a === '--timeout') args.timeoutSec = Number(argv[++i]);
    else if (a === '--extra') args.extra = argv[++i];
    else rest.push(a);
  }
  if (!rest[0]) {
    console.error('Nutzung: node run-gwen-task.cjs "<Datei relativ zu Ki Datenspeicher>" [--retries N] [--timeout Sek] [--extra "..."]');
    process.exit(2);
  }
  args.relFile = rest[0];
  return args;
}

function extractFrontmatterExceptStatus(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  return m[1]
    .split('\n')
    .filter((line) => !/^status:/.test(line))
    .join('\n')
    .trim();
}

function extractQuestionsBlock(content) {
  const m = content.match(/## Fragen für die Recherche\n([\s\S]*?)(?=\n## |\n$)/);
  return m ? m[1].trim() : null;
}

function cleanup() {
  for (const name of PROCESS_NAMES) {
    try {
      execSync(`taskkill /F /IM ${name}`, { stdio: 'ignore' });
    } catch (_) {
      /* Prozess lief nicht — ignorieren */
    }
  }
  try {
    execSync('cline hub stop', { stdio: 'ignore', cwd: VAULT });
  } catch (_) {
    /* Hub lief nicht — ignorieren */
  }
}

function runAttempt(relFile, extra, timeoutSec) {
  const prompt = `${RULES}${extra ? ' ' + extra : ''} Datei: ${relFile}`;
  // Node quotet Array-Argumente unter Windows NICHT automatisch, wenn
  // shell:true gesetzt ist (bekannter Stolperstein) — deshalb hier den
  // kompletten Befehl selbst als ein String zusammenbauen und quoten,
  // statt ein args-Array zu übergeben.
  const quotedPrompt = '"' + prompt.replace(/"/g, '""') + '"';
  const cmd = `cline -P ${PROVIDER} ${quotedPrompt}`;
  const result = spawnSync(cmd, {
    cwd: VAULT,
    shell: true,
    timeout: timeoutSec * 1000,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  return {
    timedOut: result.signal !== null || result.error?.code === 'ETIMEDOUT',
    code: result.status,
    output: (result.stdout || '') + '\n' + (result.stderr || ''),
  };
}

/**
 * Grobe Heuristik gegen den historisch häufigsten Gwen-Fehler: Antworten
 * brechen ohne Warnung mitten im Wort/Satz ab (siehe gwen_recherche_workflow-
 * Erinnerung). Kein zuverlässiger Test, nur ein zusätzliches Warnsignal.
 */
function looksTruncated(addedText) {
  // Über den GESAMTEN neuen Text prüfen, nicht nur die letzte Zeile — ein
  // abgebrochenes Zitat/Fettdruck kann mitten im Block stehen, gefolgt von
  // einer unauffällig endenden Quelle-Zeile (genau dieser Fall trat in
  // Test 03 auf: offenes „ nie geschlossen, aber die letzte Zeile der
  // Datei sah für sich genommen vollständig aus).
  const opens = (addedText.match(/„/g) || []).length;
  const closes = (addedText.match(/"/g) || []).length;
  if (opens > closes) return true; // offenes deutsches Anführungszeichen nie geschlossen
  const boldMarkers = (addedText.match(/\*\*/g) || []).length;
  if (boldMarkers % 2 !== 0) return true; // unvollständige Fett-Markierung

  const lastLine = (addedText.trim().split('\n').filter(Boolean).pop() || '').trim();
  if (!lastLine) return false;
  const endsProperly = /[.!?…"'”)\]]$/.test(lastLine) || /^>+\s*$/.test(lastLine);
  return !endsProperly;
}

function verify(preContent, postContent, preFrontmatter, preQuestions, output) {
  const reasons = [];

  if (postContent === preContent) {
    return { status: 'NO_CHANGE', reasons: ['Datei wurde nicht verändert.'] };
  }

  for (const marker of CRASH_MARKERS) {
    if (output.includes(marker)) reasons.push(`Absturz-Marker im Log gefunden: "${marker}"`);
  }
  if (reasons.length) return { status: 'TECHNICAL_FAILURE', reasons };

  const postFrontmatter = extractFrontmatterExceptStatus(postContent);
  if (preFrontmatter !== null && postFrontmatter !== preFrontmatter) {
    reasons.push('Frontmatter (außer status) wurde verändert.');
  }

  const postQuestions = extractQuestionsBlock(postContent);
  if (preQuestions !== null && (postQuestions === null || !postContent.includes(preQuestions))) {
    reasons.push('Ursprünglicher Fragen-Abschnitt fehlt oder wurde verändert.');
  }

  if (preContent.includes('🔎 Rechercheergebnisse von Gwen') && !postContent.includes('🔎 Rechercheergebnisse von Gwen')) {
    reasons.push('Überschrift "🔎 Rechercheergebnisse von Gwen" wurde entfernt.');
  }

  if (reasons.length) return { status: 'RULE_VIOLATION', reasons };

  let i = 0;
  while (i < preContent.length && i < postContent.length && preContent[i] === postContent[i]) i++;
  const addedText = postContent.slice(i);
  if (looksTruncated(addedText)) {
    return {
      status: 'NEEDS_REVIEW',
      reasons: ['Verdacht auf Satzabbruch mitten im Wort/Satz (Heuristik, bitte manuell prüfen) — bekanntester historischer Gwen-Fehler.'],
    };
  }

  return { status: 'SUCCESS', reasons: [] };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.join(VAULT, args.relFile);
  if (!fs.existsSync(filePath)) {
    console.error(`Datei nicht gefunden: ${filePath}`);
    process.exit(2);
  }
  fs.mkdirSync(LOG_DIR, { recursive: true });

  const preContent = fs.readFileSync(filePath, 'utf8');
  const preFrontmatter = extractFrontmatterExceptStatus(preContent);
  const preQuestions = extractQuestionsBlock(preContent);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.join(LOG_DIR, `${timestamp}_${path.basename(args.relFile)}.log`);
  const attempts = [];

  let finalStatus = 'TECHNICAL_FAILURE';
  let finalReasons = ['Kein Versuch ausgeführt.'];

  for (let attempt = 1; attempt <= args.retries + 1; attempt++) {
    console.log(`\n[Versuch ${attempt}/${args.retries + 1}] ${args.relFile}`);
    cleanup();
    const t0 = Date.now();
    const { output, timedOut } = runAttempt(args.relFile, args.extra, args.timeoutSec);
    const durationSec = Math.round((Date.now() - t0) / 1000);
    cleanup();

    const postContent = fs.readFileSync(filePath, 'utf8');
    const outcome = timedOut
      ? { status: 'TECHNICAL_FAILURE', reasons: [`Timeout nach ${args.timeoutSec}s.`] }
      : verify(preContent, postContent, preFrontmatter, preQuestions, output);

    attempts.push({ attempt, durationSec, status: outcome.status, reasons: outcome.reasons });
    fs.appendFileSync(
      logPath,
      `\n===== Versuch ${attempt} (${durationSec}s, Status: ${outcome.status}) =====\n${outcome.reasons.join('\n')}\n\n--- CLI-Output ---\n${output}\n`
    );

    console.log(`  -> ${outcome.status} (${durationSec}s)${outcome.reasons.length ? ': ' + outcome.reasons.join('; ') : ''}`);

    finalStatus = outcome.status;
    finalReasons = outcome.reasons;

    if (['SUCCESS', 'RULE_VIOLATION', 'NEEDS_REVIEW'].includes(outcome.status)) break;
    // TECHNICAL_FAILURE oder NO_CHANGE: erneut versuchen, falls noch Retries übrig
  }

  console.log(`\n=== Ergebnis: ${finalStatus} — ${args.relFile} ===`);
  if (finalReasons.length) console.log(finalReasons.map((r) => '- ' + r).join('\n'));
  console.log(`Log: ${logPath}`);

  const summary = { relFile: args.relFile, status: finalStatus, reasons: finalReasons, attempts, logPath };
  fs.writeFileSync(path.join(LOG_DIR, `${timestamp}_${path.basename(args.relFile)}.summary.json`), JSON.stringify(summary, null, 2));

  process.exit(finalStatus === 'SUCCESS' ? 0 : 1);
}

main();
