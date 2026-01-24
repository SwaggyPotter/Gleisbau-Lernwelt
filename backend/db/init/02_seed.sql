-- Basic seeds for development and first run
INSERT INTO registration_keys (key, year, max_uses, issued_by)
VALUES
    ('J1-DEMO-001', 1, 100, 'Admin'),
    ('J2-DEMO-002', 2, 100, 'Admin'),
    ('J3-DEMO-003', 3, 100, 'Admin')
ON CONFLICT (key) DO NOTHING;

INSERT INTO learning_fields (id, title, description, year, tag)
VALUES
    ('gb-01', 'Einrichten einer Baustelle', 'Baustellenvorbereitung, Absicherung und Vermessung vor Beginn der Bauarbeiten.', 1, 'Baustelle'),
    ('gb-02', 'Erschliessen und Gruenden eines Bauwerks', 'Aushub von Baugruben, Herstellen von Fundamenten und Grundlagen der Erdarbeiten.', 1, 'Erdarbeiten'),
    ('gb-03', 'Mauern eines einschaligen Baukoerpers', 'Errichten einfacher Mauerwerke, z. B. eine gerade Wand aus Steinen.', 1, 'Mauerwerk'),
    ('gb-04', 'Herstellen einer Holzkonstruktion', 'Grundlegende Zimmerer- und Schalungsarbeiten in Holz.', 1, 'Holzbau'),
    ('gb-05', 'Herstellen eines Stahlbetonbauteiles', 'Bewehrungsstahl verarbeiten, Schalung bauen und Beton giessen fuer einfache Bauteile.', 1, 'Stahlbeton'),
    ('gb-06', 'Beschichten und Bekleiden eines Bauteiles', 'Oberflaechenbehandlung, Daemmung oder Verkleidung als Schutz und Finish.', 1, 'Ausbau'),
    ('vert-01', 'Herstellen eines Erdkorpers', 'Aufschuetten und Verdichten eines Gleisdamms oder Ausheben eines Einschnitts als Unterbau fuer das Gleisbett.', 2, 'Erdarbeiten'),
    ('vert-02', 'Entwaessern von Verkehrsflaechen', 'Drainagen entlang des Gleiskoerpers anlegen und Oberflaechenwasser ableiten.', 2, 'Entwaesserung'),
    ('vert-03', 'Herstellen einer Gleisanlage', 'Schwellen und Schienen verlegen, Gleis ausrichten, einschottern und Grundjustierung der Gleislage.', 2, 'Gleisbau'),
    ('vert-04', 'Pflastern von Verkehrsflaechen', 'Pflaster- und Wegebauarbeiten wie Bahnsteigbelaege, Randwege oder Strassenanteile an Gleisanlagen.', 2, 'Pflaster'),
    ('pro-01', 'Herstellen eines Gleisbogens', 'Gleisanlagen in Kurvenlage bauen und vermessen: Radius und Ueberhoehung festlegen, Schienen biegen und verlegen.', 3, 'Gleisbau'),
    ('pro-02', 'Montieren einer Weiche', 'Weichenkomponenten montieren, Zungen und Herzstuecke justieren und in bestehende Gleise einpassen.', 3, 'Weichen'),
    ('pro-03', 'Herstellen einer Festen Fahrbahn', 'Schotterlosen Oberbau erstellen, Gleise auf Betonplatten oder -troegen verlegen, z. B. in Tunneln oder Hochgeschwindigkeitsstrecken.', 3, 'Feste Fahrbahn'),
    ('pro-04', 'Instandhalten von Gleisanlagen', 'Inspektion und Wartung von Gleisen und Weichen: Gleislage pruefen, nachstopfen, Verschleissteile tauschen, Sicherungen setzen.', 3, 'Instandhaltung'),
    ('pro-05', 'Beheben eines Schienenbruchs', 'Defekte Schienenstuecke ausbauen und instandsetzen, z. B. per Thermitschweissen oder Schraubverbindung; Notfallbereitschaft sicherstellen.', 3, 'Notfall'),
    ('pro-06', 'Herstellen eines Bahnuebergangs', 'Hoehengleichen Bahnuebergang bauen: Gleise im Strassenbereich einbauen, Gummimatten/Asphalt verlegen, Sicherungseinrichtungen anbringen.', 3, 'Bahnuebergang')
ON CONFLICT (id) DO NOTHING;
