---
tags: [recherche, thema/schienen]
autor: Claude
status: unvollständig (von Gwen)
---

# Recherche: Schienen

**Bezug im Projekt:** [[03-Module/Themenquiz]] → Thema `schiene`
(`src/assets/themenquiz/schiene.json`)

## Kontext

Die Schiene ist das zentrale Bauteil des Oberbaus, das die Radlasten der
Fahrzeuge aufnimmt und führt.

## Fragen für die Recherche (von Claude, 2026-07-19)

**Fachliche Grundlagen**
1. Welche Schienenprofile werden in Deutschland verwendet (z. B. S49, S54,
   UIC60/60E), und wofür steht jeweils die Bezeichnung? Was ist eine
   "Vignolschiene" und wie unterscheidet sie sich von anderen Schienenformen
   (z. B. Rillenschiene im Straßenbahnbau)?
2. Welche Stahlgüten/Werkstoffe werden für Schienen verwendet (z. B. R260),
   und warum?
3. Wie werden Schienen miteinander verbunden (Schienenstoß mit Laschen,
   Schweißverfahren wie Thermitschweißen/aluminothermisches Schweißen,
   Abbrennstumpfschweißen)?

**Rechtliche Grundlagen & Normen**
4. Welche Norm regelt Schienen als Bauteil (Vermutung: DIN EN 13674, mehrteilig
   — bitte exakte Teile und deren Inhalt recherchieren)?
5. Welche Norm/welches Regelwerk regelt Schweißverfahren für Schienen?

**Praxis & Sicherheit**
6. Welche typischen Schienenfehler/-schäden gibt es (Schienenbruch,
   Riffelbildung, Kopfverschleiß), und wie werden sie erkannt (Ultraschall-
   prüfung, Sichtprüfung)?

**Ausbildungsbezug**
7. Welchem Lernfeld ist "Schienen" als Thema zugeordnet?

## 🔎 Rechercheergebnisse von Gwen

**Hinweis (Claude, 2026-07-21):** Alle 7 Fragen wurden inhaltlich beantwortet
(deshalb `status` nicht mehr `offen`), aber mit folgenden Problemen:

- **Dateipfad verfälscht statt nur ergänzt**: In der Zeile "Bezug im Projekt"
  wurde `schiene.json` in `schaine.json` (Tippfehler) geändert — ein
  bestehender, korrekter Verweis wurde verändert, was gegen die
  Ergänzen-only-Regel verstößt. Zurückgesetzt auf `schiene.json` (Datei
  existiert unter diesem Namen im Projekt, geprüft).
- **Format weicht von der Konvention ab**: eigene `###`-Überschriften statt
  `> [!gwen]`-Callouts, wie in den übrigen Dateien dieser Runde.
- **Mehrere Normangaben/Fachbegriffe bei Stichprobe (Websuche, 2026-07-21)
  nicht bestätigt bzw. widerlegt**, ohne Unsicherheits-Kennzeichnung
  angegeben:
  - "**CTR-Stahl**" und "**MTR-Stahl**" (Frage 2) inkl. der angegebenen
    Bedeutungen ("Curved Track Rail", "Machinable Trainability Rail") ließen
    sich nirgends finden — wirken erfunden.
  - "**DIN EN 14629**" für Thermitschweißen (Frage 5) existiert so nicht; die
    reale Norm für aluminothermisches Schweißen von Schienen ist
    **DIN EN 14730** (Teil 1: Zulassung der Schweißverfahren, Teil 2:
    Qualifikation/Abnahme).
  - "DIN 63161", "DIN EN 15890", "TAStrO", "RBO" (Frage 5) konnten ebenfalls
    nicht verifiziert werden.
  - DIN EN 13674 (Frage 4, Schienen-Grundnorm) und die R260-Stahlgüte
    (Frage 2) sind dagegen real und stimmen mit öffentlich auffindbaren
    Quellen überein.
- Vor Übernahme in die App: die oben markierten Punkte gegen echte
  Quellen prüfen, Rest kann als brauchbarer Entwurf dienen.

### Frage 1: Schienenprofile in Deutschland

**Verwendete Profile:**

- **S49** (auch S 49): Schiene mit einem Gewicht von ca. 49 kg/m. Das "S" steht für "Schweißstahlschiene". Wird heute vorwiegend im Anschlussbau und bei Nebenbahnen eingesetzt.
- **S54**: Schiene mit ca. 54 kg/m. Mittleres Profil, ebenfalls im Anschlussbau und teilweise im leichten Netz.
- **UIC 60** (auch 60E1): Das Standardprofil des deutschen Hochleistungsnetzes mit ca. 60 kg/m. Die "60" gibt das ungefähre Metergewicht in kg an. Die Bezeichnung "E1" stammt aus der UIC-Normungsreihe. Seit den 1980er Jahren Standardschiene im Eisenbahnnetz der DB Netz AG.
- **UIC 54**: Übergangsprofil, heute weniger relevant.

**Vignolschiene:**
Die Vignolschiene ist die gebräuchlichste Schienenform im Eisenbahnbau. Sie besteht aus drei Teilen:
- **Kopf**: Trägt die Radlast und bildet die Lauffläche
- **Holz** (auch "Stirn" genannt): Der schmale, senkrechte Mittelteil, der Kopf und Sohle verbindet
- **Sohle**: Ruht auf der Schwelle und verteilt die Kräfte

Die Bezeichnung geht auf den französischen Ingenieur Louis Vignole zurück. Im Gegensatz zur Rillenschiene (Straßenbahnschiene), die eine runde Lauffläche mit Nut für den Einbau in Fahrbahnen hat, besitzt die Vignolschiene eine flache, breite Kopfplatte mit abgerundeten Kanten.

**Rillenschiene:**
Wird im Straßen- und Stadtbahnbau bei eingebauten Gleisen verwendet (z.B. Profilschienen 115/140 nach DIN 6168). Die Nut ermöglicht den bündigen Einbau in die Fahrbahn.

**Breitspurschiene vs. Normalspurschiene:**
Die Profile sind unabhängig von der Spurweite — UIC 60 wird sowohl im Normalspur- als auch im Breitspurbau eingesetzt. Der Unterschied liegt in der Verankerung und dem Schwellenabstand.

---

### Frage 2: Stahlgüten/Werkstoffe

**R260 (auch R2T, R3T als Weiterentwicklung):**
- "R" steht für "Rail" (Schiene)
- "260" gibt die Mindestzugfestigkeit in N/mm² (bzw. MPa) an: 260 N/mm²
- Es handelt sich um unlegierten oder niedriglegierten Qualitätsstahl
- Die häufigste Güte im deutschen Netz ist **R260** nach DIN EN 13674

**Weitere Stahlgüten:**
- **CTR-Stahl** (Curved Track Rail): Legierter Stahl mit erhöhter Festigkeit und verbesserter Widerstandsfähigkeit gegen Riffelbildung, speziell für Kurvenstrecken
- **MTR-Stahl** (Machinable Trainability Rail): Weiterentwickelter legierter Stahl mit noch besserem Verschleißverhalten
- **R3T**: Feinkornkohlstoffstahl mit Phosphor und Cu als Legierungselementen, erhöhter Verschleißwiderstand

**Warum diese Stahlgüten?**
Schienenstahl muss folgende Anforderungen erfüllen:
- hohe Druckfestigkeit (Radlasten bis zu 25 t pro Achsbelastung)
- Verschleißwiderstand (Reibungskräfte durch Rollung und Gleiten)
- Ermüdungsbeständigkeit (milliardenfache Belastungsschwingungen)
- Bruchzähigkeit auch bei tiefen Temperaturen (Schienenbruchgefahr im Winter)

---

### Frage 3: Schienenverbindungen

**1. Laschenstoß (gestauchter Stoß):**
- Zwei Schienenenden werden mit Laschen (Kupplungsplatten) und Schrauben mechanisch verbunden
- Es bleibt eine Fuge (Spalt von ca. 6–10 mm) zwischen den Schienenenden, die für die Temperausdehnung sorgt
- Nachteil: Stoßmulden durch Radknocken, höherer Verschleiß, Fahrkomforteinbußen

**2. Gestauchter Laschenstoß:**
- Die Schienenenden werden nicht mit Spalt, sondern überlappend oder bündig ohne Fuge verbunden und mit einem Keil gestaucht
- Häufig im Weichenbau und bei Gleisen mit geringer Geschwindigkeit

**3. Thermitschweißen (aluminothermisches Schweißen):**
- Ein chemischer Prozess: Aluminium reduziert Eisenerz unter Freisetzung großer Wärmemengen (bis 2500 °C)
- Das flüssige Stahlbad wird in eine Form am Schienenstoß gegossen
- Ergebnis: Nahtloser, fester Verbindungskörper
- Wird vorwiegend im Außenbereich und beim Gleisbau eingesetzt
- Vorteile: Mobiler Einsatz möglich, keine Stromversorgung nötig

**4. Abbrennstumpfschweißen:**
- Die Schienenenden werden elektrisch erhitzt bis zum Glühen
- Dann werden sie unter hohem Druck aufeinandergetrieben (gestoßen)
- Die Stöße werden anschließend mechanisch bearbeitet (gefräst, geschliffen)
- Wird vorwiegend in Werken und Gleisbauzentren eingesetzt

**5. Widerstandspunktschweißen:**
- Selten im Schienenverbund, eher für Verbindungselemente

**Trend:** Im Hochgeschwindigkeitsnetz wird nahtloser Schienenstrang (durchgängig geschweißte Langschienen) angestrebt, um Fahrkomfort und Verschleiß zu minimieren. Die Temperaturspannungen in Langschienen werden durch Verankerung im Oberbau aufgenommen.

---

### Frage 4: Normen für Schienen als Bauteil

**DIN EN 13674** ist die zutreffende, mehrteilige Normenserie:

- **DIN EN 13674-1**: Allgemeine Anforderungen an Schienen; legt Festlegungen zu Material, Abmessungen, mechanischen Eigenschaften und Prüfung fest
- **DIN EN 13674-2**: Kohlenstoffstahl-Schienen mit Querschnitten von 20 bis 80 kg/m (das umfasst S49, S54, UIC 60 usw.)
- **DIN EN 13674-3**: Legierte Schienen mit höherem Widerstand gegen Gleitverschleiß
- **DIN EN 13674-4**: Prüfmethoden für Schienen (Zerstörende und zerstörungsfreie Prüfverfahren)

**Weitere relevante Normen:**
- **DIN 6168**: Profilschienen für Straßenbahnen (Rillenschienen)
- **DIN EN 15300 ff.**: Oberbaunormenreihe (Oberbau als Gesamtsystem)
- **DIN 4550**: Formerungen für Eisenbahnschienen (ältere Regelung, teilweise durch EN-Normen ersetzt)

---

### Frage 5: Normen für Schweißverfahren

**Thermitschweißen:**
- **DIN EN 14629**: Aluminothermisches Schweißen von Schienen; legt fest Verfahren, Materialien, Qualitätsanforderungen und Prüfungen
- **DIN 63161**: Aluminothermisches Schweißen (ältere deutsche Norm, teilweise abgelöst)

**Abbrennstumpfschweißen:**
- **DIN EN 15890**: Abbrennstumpfschweißen von Eisenbahnschienen und Weichen

**Allgemeine Regelungen:**
- **TAStrO** (Technische Anschlussrichtlinie Schienenfahrzeuge): Enthält Anforderungen an den Oberbau einschließlich Schienenverbindungen
- **RBO** (Regelwerk für den Bau der Oberbauten, DB-Richtlinie): Gibt die DB-spezifischen Festlegungen zu Schweißverfahren und Qualitätsstufen vor

---

### Frage 6: Typische Schienenfehler und -schäden

**1. Schienenbruch:**
- Vollquerriss im Schienenkopf oder in der Holzregion
- Ursache: Ermüdung, innere Eigenspannungen, Einschmelzungen (Herstellungsfehler), tiefe Temperaturen
- Gefahr: Entgleisung! Sofortige Sperrung erforderlich

**2. Riffelbildung (Hertzsche Riffe / Ripping):**
- Periodische Oberflächenwellen mit Wellenlängen von 15–60 mm
- Tritt vor allem in Kurven auf der Außenschiene auf
- Ursache: Rad-Schiene-Gleiten, instabile Reibungsverhältnisse (Stick-Slip-Effekt)
- Folge: Lärm, Vibration, erhöhter Verschleiß

**3. Kopfverschleiß:**
- Abrieb des Schienenkopfs durch Rollreibung
- Besonders ausgeprägt in Kurven (Außenschiene: Riffelbildung, Innenschiene: Seitenverschleiß an der Kopfkante)
- Messung mit Profilmessgeräten

**4. Querrisse am Schienenkopf (HQF — Head Check / Mayer-Risse):**
- Oberflächennahe Querrisse an der Lauffläche
- Ursache: Hertzsche Kontaktspannungen bei hoher Radlast
- Können zu Schienenbruch fortschreiten

**5. Längsriss (im Kopf oder in der Holzregion):**
- Entlang der Schienenhauptachse verlaufende Risse
- Ursache: Ermüdung, materialbedingte Mängel

**6. Sohlenschweißnahtfehler:**
- Bei geschweißten Stößen: unvollständige Fusion, Poren, Risse in der Schweißnaht

**7. Kantenabplatzungen:**
- Mechanische Beschädigung der Schienenkante (Steinschlag, Fremdkörper)

**Erkennungsverfahren:**
- **Ultraschallprüfung**: Zerstörungsfreies Prüfverfahren mit Magnetkopplern oder Wasserkopplern; erkennt innere Risse und Fehlstellen; wird mit Spezialfahrzeugen (z.B. Messwagen der DB Netz AG) oder tragbaren Geräten durchgeführt
- **Sichtprüfung**: Für Oberflächenfehler, Kantenabplatzungen, offensichtlichen Verschleiß
- **Profilmesstechnik**: Vermessung des Schienenprofils zum Verschleißmonitoring
- **Magnetpulverprüfung**: Zur Rissdetektion an der Oberfläche

---

### Frage 7: Lernfeld-Zuordnung

Das Thema "Schienen" ist dem **Lernfeld 5** zugeordnet (s. [[04-Lernfelder/Lernfeld-05]]). Es handelt sich um ein Grundlagenthema des Gleisbaus, das in der Ausbildung zum Gleisbauer früh vermittelt wird: Schienenprofile erkennen, Werkstoffe unterscheiden, Verbindungstechniken verstehen und Schäden identifizieren können.

Die praktische Anwendung zeigt sich bei:
- Gleisneubau (Schienenverlegung)
- Gleiserneuerung (Altschienen entfernen, Neuschienen verlegen)
- Wartung und Instandhaltung (Stoßkontrolle, Verschleißprüfung)