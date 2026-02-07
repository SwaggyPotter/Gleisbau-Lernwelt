import { createServer } from './server';
import { config } from './config';
import { logger } from './logger';
import { pool } from './db/pool';

const app = createServer();

const runStartupMigrations = async () => {
  try {
    // Ensure registration_keys has full_name column
    await pool.query('ALTER TABLE registration_keys ADD COLUMN IF NOT EXISTS full_name text');
    // Fill missing names with placeholder, then enforce NOT NULL
    await pool.query("UPDATE registration_keys SET full_name = COALESCE(full_name, 'Unbenannt')");
    await pool.query('ALTER TABLE registration_keys ALTER COLUMN full_name SET NOT NULL');

    // Allow users without password for key-based onboarding
    await pool.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');

    // Delete known demo keys and normalise any legacy multi-use keys
    await pool.query("DELETE FROM registration_keys WHERE key IN ('J1-DEMO-001', 'J2-DEMO-002', 'J3-DEMO-003')");
    await pool.query('UPDATE registration_keys SET max_uses = 1 WHERE max_uses > 1');

    // Quiz tables
    await pool.query(`CREATE TABLE IF NOT EXISTS quiz_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id),
      field_id text NOT NULL,
      current_index integer NOT NULL DEFAULT 0,
      is_complete boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS quiz_answers (
      session_id uuid REFERENCES quiz_sessions(id) ON DELETE CASCADE,
      question_id text NOT NULL,
      choice_index integer NOT NULL,
      is_correct boolean NOT NULL,
      answered_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (session_id, question_id)
    )`);

    // Sync learning fields with canonical list
    const fields = [
      { id: 'lf-01', title: 'Baustellen einrichten', description: 'Sicherheit, Organisation, Baustelleneinrichtung', year: 1, tag: 'Sicherheit & Organisation' },
      { id: 'lf-02', title: 'Bauwerke erschließen und gründen', description: 'Grundlagen Erschließung, Fundamente, Baugrund', year: 1, tag: 'Erschließung & Gründung' },
      { id: 'lf-03', title: 'Einschalige Baukörper mauern', description: 'Mauerwerk, Steine, Verbände (Grundlagen Hoch-/Tiefbau)', year: 1, tag: 'Mauerwerk' },
      { id: 'lf-04', title: 'Stahlbetonbauteile herstellen', description: 'Schalung, Bewehrung, Beton', year: 1, tag: 'Stahlbeton' },
      { id: 'lf-05', title: 'Holzkonstruktionen herstellen', description: 'Holzbauteile, Verbindungen, Montage', year: 1, tag: 'Holzbau' },
      { id: 'lf-06', title: 'Bauteile beschichten und bekleiden', description: 'Schutz, Abdichtung, Oberflächen', year: 1, tag: 'Oberflächen' },
      { id: 'lf-07', title: 'Baugründe erkunden', description: 'Bodenarten, Tragfähigkeit, Baugrunduntersuchung', year: 2, tag: 'Baugrund' },
      { id: 'lf-08', title: 'Erdbauwerke errichten', description: 'Aushub, Verbau, Planum, Verdichtung', year: 2, tag: 'Erdbau' },
      { id: 'lf-09', title: 'Verkehrsflächen aus Pflaster- und Plattenbelägen herstellen', description: 'Wege, Flächen, Unterbau', year: 2, tag: 'Pflaster' },
      { id: 'lf-10', title: 'Gleisanlagen neu bauen', description: 'Gleisaufbau, Schotter, Schwellen, Schienen', year: 2, tag: 'Neubau Gleis' },
      { id: 'lf-11', title: 'Gleisbögen herstellen und einmessen', description: 'Vermessung, Gleislage, Radien', year: 3, tag: 'Gleisbögen' },
      { id: 'lf-12', title: 'Weichen montieren und einmessen', description: 'Weichenarten, Einbau, Kontrolle', year: 3, tag: 'Weichen' },
      { id: 'lf-13', title: 'Weichen bauen und instand halten', description: 'Weichenaufbau, Einbau, Instandhaltung und sichere Weichenarbeit', year: 3, tag: 'Weichentechnik' },
      { id: 'lf-14', title: 'Sonderbauformen und besondere Gleisanlagen herstellen und instand halten', description: 'Sonderbauformen, Bahnuebergaenge, feste Fahrbahn und komplexe Gleisbereiche', year: 3, tag: 'Spezialthemen Gleisbau' },
    ];

    for (const f of fields) {
      await pool.query(
        `INSERT INTO learning_fields (id, title, description, year, tag)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, year = EXCLUDED.year, tag = EXCLUDED.tag`,
        [f.id, f.title, f.description, f.year, f.tag],
      );
    }

    const ids = fields.map(f => `'${f.id}'`).join(',');
    await pool.query(`DELETE FROM learning_fields WHERE id NOT IN (${ids})`);
  } catch (err) {
    logger.warn({ err }, 'Startup migrations/cleanup failed');
  }
};

runStartupMigrations().finally(() => {
  app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, 'API listening');
  });
});
