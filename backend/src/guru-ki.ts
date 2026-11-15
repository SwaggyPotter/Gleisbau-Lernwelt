import { logger } from './logger';

/**
 * Anbindung des Gleisbau-Guru an ein lokales Sprachmodell (Ollama im Container „ki“, docker-compose.yml).
 * Seit 2026-11-13: qwen3.5:4b auf der CPU des michiserver (~6 Token/s). Ist das Modell nicht erreichbar,
 * arbeitet der Guru einfach regelbasiert weiter – die KI ist eine Zugabe, keine Voraussetzung.
 */
const URL_KI = process.env.GURU_LLM_URL || 'http://ki:11434';
export const KI_MODELL = process.env.GURU_LLM_MODELL || 'qwen3.5:4b';

export interface KiNachricht { role: 'system' | 'user' | 'assistant'; content: string }

/**
 * Nur eine Anfrage gleichzeitig (CPU-Server). Chat-Fragen (vorrang) kommen vor Auftraegen und Nachtarbeit dran;
 * eine bereits laufende Rechnung wird aber nicht abgebrochen.
 */
interface Job { nachrichten: KiNachricht[]; opt: KiOpt; fertig: (t: string | null) => void }
interface KiOpt { maxToken?: number; timeoutMs?: number; vorrang?: boolean }
const schlange: Job[] = [];
let rechnet = false;
/** Was die KI gerade rechnet (fuer die Live-Anzeige). */
export const kiLage = { rechnet: false, vorrang: false, wartend: 0 };

export function kiFrage(nachrichten: KiNachricht[], opt: KiOpt = {}): Promise<string | null> {
  return new Promise((fertig) => {
    const job = { nachrichten, opt, fertig };
    if (opt.vorrang) { const i = schlange.findIndex((j) => !j.opt.vorrang); schlange.splice(i < 0 ? schlange.length : i, 0, job); } else schlange.push(job);
    kiLage.wartend = schlange.length;
    void naechster();
  });
}

async function naechster(): Promise<void> {
  if (rechnet) return;
  const job = schlange.shift();
  kiLage.wartend = schlange.length;
  if (!job) return;
  rechnet = true; kiLage.rechnet = true; kiLage.vorrang = !!job.opt.vorrang;
  try { job.fertig(await kiDirekt(job.nachrichten, job.opt)); } catch { job.fertig(null); }
  rechnet = false; kiLage.rechnet = false; kiLage.vorrang = false;
  void naechster();
}

async function kiDirekt(nachrichten: KiNachricht[], opt: KiOpt): Promise<string | null> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), opt.timeoutMs ?? 120000);
  try {
    const r = await fetch(URL_KI + '/api/chat', {
      method: 'POST',
      signal: ac.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: KI_MODELL, stream: false, think: false, messages: nachrichten,
        options: { num_ctx: 6144, num_thread: 4, temperature: 0.3, num_predict: opt.maxToken ?? 350 },
      }),
    });
    if (!r.ok) { logger.warn({ status: r.status }, 'Guru-KI: Fehlerantwort'); return null; }
    const j: any = await r.json();
    const text = String(j?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    return text || null;
  } catch (err) {
    logger.warn({ err: String(err) }, 'Guru-KI nicht erreichbar');
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Ist die KI da (Modell geladen oder ladbar)? Schnelle Prüfung für die Statusanzeige. */
export async function kiStatus(): Promise<{ da: boolean; modell: string }> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 3000);
  try {
    const r = await fetch(URL_KI + '/api/tags', { signal: ac.signal });
    const j: any = await r.json();
    return { da: (j?.models || []).some((m: any) => m?.name === KI_MODELL || m?.model === KI_MODELL), modell: KI_MODELL };
  } catch {
    return { da: false, modell: KI_MODELL };
  } finally {
    clearTimeout(t);
  }
}
