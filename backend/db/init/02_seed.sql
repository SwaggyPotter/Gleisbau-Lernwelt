-- Seed admin user with fixed credentials
INSERT INTO users (full_name, email, password_hash, role, key_used)
VALUES
    ('Administrator', 'admin', '$2a$10$hICJtzt3vc97SdTzvcb1g.69PWkgaRguDtfOStxNiwHWPfsMoxmLa', 'admin', NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO learning_fields (id, title, description, year, tag)
VALUES
    ('lf-01', 'Baustellen einrichten', 'Sicherheit, Organisation, Baustelleneinrichtung', 1, 'Sicherheit & Organisation'),
    ('lf-02', 'Bauwerke erschließen und gründen', 'Grundlagen Erschließung, Fundamente, Baugrund', 1, 'Erschließung & Gründung'),
    ('lf-03', 'Einschalige Baukörper mauern', 'Mauerwerk, Steine, Verbände (Grundlagen Hoch-/Tiefbau)', 1, 'Mauerwerk'),
    ('lf-04', 'Stahlbetonbauteile herstellen', 'Schalung, Bewehrung, Beton', 1, 'Stahlbeton'),
    ('lf-05', 'Holzkonstruktionen herstellen', 'Holzbauteile, Verbindungen, Montage', 1, 'Holzbau'),
    ('lf-06', 'Bauteile beschichten und bekleiden', 'Schutz, Abdichtung, Oberflächen', 1, 'Oberflächen'),
    ('lf-07', 'Baugruben und Graeben herstellen und sichern', 'Boeschung, Verbau, Wasserhaltung, Arbeitssicherheit', 2, 'Tiefbau / Gleisbau'),
    ('lf-08', 'Verkehrsflaechen herstellen', 'Planum, Schichtenaufbau, Pflaster, Asphalt, Entwaesserung', 2, 'Tiefbau / Gleisbau'),
    ('lf-09', 'Entwaesserungssysteme herstellen', 'Leitungen, Gefaelle, Schaechte, Dichtheit und Verfuellung', 2, 'Tiefbau / Gleisbau'),
    ('lf-10', 'Bauwerke instand setzen und erneuern', 'Schadenserkennung, Sanierung, Rueckbau, Bestandssicherheit und Dokumentation', 2, 'Tiefbau / Gleisbau'),
    ('lf-11', 'Gleisanlage herstellen und sichern', 'Oberbau, Gleislage, Stopfen, Vermessung und Gleissicherheit', 3, 'Gleisbau'),
    ('lf-12', 'Gleisanlagen instand halten', 'Gleisfehler, Stopfen, Messung, Sicherung unter Betrieb und Dokumentation', 3, 'Gleisbau'),
    ('lf-13', 'Weichen bauen und instand halten', 'Weichenaufbau, Einbau, Instandhaltung und sichere Weichenarbeit', 3, 'Weichentechnik'),
    ('lf-14', 'Gleisanlagen instand halten', 'Wartung, Reparatur, Qualitätssicherung', 3, 'Instandhaltung')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    year = EXCLUDED.year,
    tag = EXCLUDED.tag;
