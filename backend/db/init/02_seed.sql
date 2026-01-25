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
    ('lf-07', 'Baugründe erkunden', 'Bodenarten, Tragfähigkeit, Baugrunduntersuchung', 2, 'Baugrund'),
    ('lf-08', 'Erdbauwerke errichten', 'Aushub, Verbau, Planum, Verdichtung', 2, 'Erdbau'),
    ('lf-09', 'Verkehrsflächen aus Pflaster- und Plattenbelägen herstellen', 'Wege, Flächen, Unterbau', 2, 'Pflaster'),
    ('lf-10', 'Gleisanlagen neu bauen', 'Gleisaufbau, Schotter, Schwellen, Schienen', 2, 'Neubau Gleis'),
    ('lf-11', 'Gleisbögen herstellen und einmessen', 'Vermessung, Gleislage, Radien', 3, 'Gleisbögen'),
    ('lf-12', 'Weichen montieren und einmessen', 'Weichenarten, Einbau, Kontrolle', 3, 'Weichen'),
    ('lf-13', 'Verkehrsflächen befestigen', 'Bahnübergänge, angrenzende Verkehrsflächen', 3, 'Verkehrsflächen'),
    ('lf-14', 'Gleisanlagen instand halten', 'Wartung, Reparatur, Qualitätssicherung', 3, 'Instandhaltung')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    year = EXCLUDED.year,
    tag = EXCLUDED.tag;
