---
tags: [fragen-generierung, gwen]
autor: Claude
status: eingearbeitet
topic: schiene
ziel: 15-25 neue Fragen
---

# Fragen-Auftrag: Schienen

**Thema:** Schiene Aufbau, Profil, Waermeausdehnung, verschweisstes Gleis

**Kurzanweisung fuer Gwen** (Details: [[00-Anweisung-für-Gwen]]):
Recherchiere per Websuche zu diesem Thema und erstelle **15 bis 25 neue
Quizfragen** im Format unten. Jede Frage muss sich auf eine Quelle stuetzen,
die du in DIESER Session per Websuche gefunden hast. Trage neue Fragen
AUSSCHLIESSLICH unter "Neue Fragen von Gwen" am Dateiende ein — veraendere
nichts anderes in dieser Datei. Wenn du fertig bist, aendere oben im
Frontmatter `status: offen` zu `status: fertig (von Gwen)`.

## Bereits vorhandene Fragen (NICHT duplizieren)

1. Aus welchen drei Teilen besteht ein Schienenquerschnitt? *(Richtig: Schienenkopf, Schienensteg, Schienenfuß)*
2. Welche Aufgabe hat der Schienenkopf? *(Richtig: Er trägt die Radlast und bildet die Fahrkante)*
3. Warum dehnen sich Schienen bei Wärme aus? *(Richtig: Stahl hat einen positiven thermischen Ausdehnungskoeffizienten)*
4. Was ist ein lückenlos verschweißtes Gleis? *(Richtig: Ein Gleis, bei dem die Schienenabschnitte zu langen Strecken verschweißt sind)*
5. Was bedeutet »Schienenverschleiß an der Fahrkante«? *(Richtig: Die Fahrkante wird durch Radkontakt abgenutzt)*

## Format fuer neue Fragen (genau so, ein Block pro Frage)

```
### Neue Frage 1
- Frage: <Fragetext>
- A: <Antwortoption>
- B: <Antwortoption>
- C: <Antwortoption>
- D: <Antwortoption>
- Richtig: <A, B, C oder D>
- Erklaerung: <1-2 Saetze, warum die richtige Antwort stimmt>
- Quelle: <URL oder exakte Norm-/Regelwerksbezeichnung>
```

## Neue Fragen von Gwen

### Neue Frage 1
- Frage: Wie groß ist das Querschnittsgewicht der breiten Schiene nach DIN EN 13674-1 (UIC 60)?
- A: 52,0 kg/m
- B: 60,21 kg/m
- C: 68,5 kg/m
- D: 75,0 kg/m
- Richtig: B
- Erklärung: Die UIC 60 Breitschiene (auch 60E1 genannt) hat ein Querschnittsgewicht von 60,21 kg pro Meter Länge.
- Quelle: https://www.valente1919.com/de/schiene-60-e1-uic-60/

### Neue Frage 2
- Frage: Welcher Schienenbereich bildet die Fahrkante und trägt direkt die Radlast?
- A: Der Schienensteg (Web)
- B: Der Schienenfuß (Foot)
- C: Der Schienenkopf (Head/Tread)
- D: Die Fahrnase
- Richtig: C
- Erklärung: Der Schienenkopf ist der obere Teil, der die Radlast trägt und die geometrische Fahrkante für den Zug bildet.
- Quelle: https://bharatforge.eu/artikel/eisenbahnschienen-profile-wegweiser-fuer-sicherheit-und-stabilitaet-im-gleisbau/

### Neue Frage 3
- Frage: Welcher thermische Längenausdehnungskoeffizient gilt für Schienenstahl im Bereich von 20°C bis 100°C?
- A: 8 µm/(m·K)
- B: 10,5 µm/(m·K)
- C: 11 µm/(m·K)
- D: 14 µm/(m·K)
- Richtig: C
- Erklärung: Stahl hat einen thermischen Längenausdehnungskoeffizienten von etwa 11 Mikrometer pro Meter und Kelvin im Temperaturbereich von 20°C bis 100°C.
- Quelle: https://www.schweizer-fn.de/stoff/waermedehnung/waermedehnung.php

### Neue Frage 4
- Frage: Wie berechnet sich die Längenausdehnung einer Schiene mit der Formel für lineare thermische Ausdehnung?
- A: ΔL = α · A · ΔT (Flächenausdehnung)
- B: ΔL = α · l₀ · ΔT (Längenausdehnung)
- C: ΔL = β · V · ΔT (Volumenausdehnung)
- D: ΔL = ρ · m · ΔT (Dichtebestimmung)
- Richtig: B
- Erklärung: Die Längenausdehnung berechnet sich aus dem Ausdehnungskoeffizienten α, der Ausgangslänge l₀ und der Temperaturänderung ΔT.
- Quelle: https://www.schweizer-fn.de/stoff/waermedehnung/waermedehnung.php

### Neue Frage 5
- Frage: Welche Norm legt den Querschnitt sowie die technischen Anforderungen an Vignole-Eisenbahnschienen fest?
- A: DIN EN 13674-2
- B: DIN EN 13674-1
- C: DIN EN 14798
- D: DIN 55603
- Richtig: B
- Erklärung: Die Norm EN 13674-1 regelt die technischen Anforderungen an Breitschienen einschließlich des Profilquerschnitts.
- Quelle: https://www.railwayrail.com/de/products/60e1-steel-rail/

### Neue Frage 6
- Frage: Welche Aufgabe hat der Schienensteg im Schienenprofil?
- A: Sie geben dem Schienenkopf die gewünschte Krümmung (Railhead profile)
- B: Sie leiten Biegespannungen von Kopf nach Fuß weiter
- C: Sie bilden den Auflagebereich für das Schienenschweißgerät
- D: Sie bestimmen die Neutralachse des Querschnitts
- Richtig: B
- Erklärung: Der schmale Steg verbindet Kopffläche und Fußfläche und leitet Biegemomente zwischen Kopf (Druckzone) und Fuß (Zugzone) weiter.
- Quelle: https://bharatforge.eu/artikel/eisenbahnschienen-profile-wegweiser-fuer-sicherheit-und-stabilitaet-im-gleisbau/

### Neue Frage 7
- Frage: Welcher Querschnittsmodul bezieht sich auf die Schienenkopffläche X-X und dient der Bemessung gegen Biegen?
- A: Wx-Kopf = 333,6 cm³ bei UIC 60
- B: Wy-Seite = 68,3 cm³ für UIC 60
- C: Iz-Trägheit = 512,3 cm⁴ (X-X)
- D: Wx-Basis = 375,5 cm³ für den Schienenfuß
- Richtig: A
- Erklärung: Der Querschnittsmodul X-X für den Kopf der UIC 60 Schiene beträgt 333,6 cm³ und ist entscheidend für die Biegebeanspruchung.
- Quelle: https://www.valente1919.com/de/schiene-60-e1-uic-60/

### Neue Frage 10
- Frage: Wie stark dehnt sich ein 25 Meter langer Schienenabschnitt aus, wenn sich die Schiene um 5 °C erwärmt (α = 11 µm/(m·K))?
- A: Ausdehnung = 13,75 mm
- B: Ausdehnung = 1,375 mm
- C: Ausdehnung = 0,1375 mm
- D: Ausdehnung = 137,5 mm
- Richtig: B
- Erklärung: ΔL = α · l₀ · ΔT = 11·10⁻⁶/m·K × 25 m × 5 K = 1,375 mm. Dieser Wert zeigt die thermische Ausdehnung an.
- Quelle: https://www.schweizer-fn.de/stoff/waermedehnung/waermedehnung.php

### Neue Frage 11
- Frage: Was ist ein Vorteil von lückenlos verschweißten Gleisen (CWR) gegenüber gelenkigen Schienenabschnitten?
- A: Geringerer Instandhaltungsaufwand durch Wegfall der Schienenstöße (Laschen) und ruhigerer, verschleißärmerer Lauf
- B: Höhere Flexibilität bei Erdbeben
- C: Einfachere Lagerung im Depot
- D: Geringeres Gewicht der Gesamtschiene
- Richtig: A
- Erklärung: Ohne Schienenstöße entfallen Stoßlücken und Laschenverbindungen — das bedeutet weniger Verschleiß an Rad und Schiene, ruhigeren Lauf und geringeren Instandhaltungsaufwand.
- Quelle: https://www.pandrol.com/de/einblick/verhinderung-von-gleisknicken-und-schienenbruchen-mit-dem-verse-system-von-pandrol/

### Neue Frage 12
- Frage: Welche Größe ist für die Stabilität des Schienenprofils unter seitlicher Last entscheidend?
- A: Querschnittsfläche (76,7 cm²)
- B: Trägheitsmoment X-X (3038,3 cm⁴)
- C: Trägheitsmoment Y-Y (512,3 cm⁴) – für seitliche Steifigkeit wichtig
- D: Querschnittsmodul Z (68,3 cm³) für Biegung senkrecht zur Fahrbahn
- Richtig: C
- Erklärung: Das Trägheitsmoment Y-Y ist mit 512,3 cm⁴ entscheidend für die seitliche Stabilität und Verformung der Schiene unter Querlast.
- Quelle: https://www.valente1919.com/de/schiene-60-e1-uic-60/

### Neue Frage 13
- Frage: Welche Bedeutung hat die Neutraltemperatur (NRT) bei CWR-Gleisen?
- A: Sie gibt die Temperatur an, bei der das Gleis knickt
- B: Sie ist die Temperatur, bei der keine axiale thermische Spannung im Schienenprofil vorhanden ist
- C: Sie markiert den Übergang von Stahl zu Eisen
- D: Sie ist die höchste Temperatur, die eine Schiene ohne Knicken aushält
- Richtig: B
- Erklärung: Die Neutraltemperatur ist die spannungsfreie Temperatur. Liegt die Schienentemperatur darüber, entsteht Druckspannung; liegt sie darunter, entsteht Zugspannung.
- Quelle: https://railwaynews.net/uic-leaflet-no-720-chapter-7-way-and-works-laying-and-maintenance-of-cwr-track.html

### Neue Frage 14
- Frage: Wie wirkt sich das Trägheitsmoment X-X des Schienenprofils auf das Gleisverhalten aus?
- A: Es bestimmt, wie stark das Profil unter Biegebelastung senkrecht zur Fahrbahn widersteht
- B: Es beeinflusst den Seitenschub bei der Durchfahrt durch Kurven
- C: Es hat keinen Einfluss auf die Dynamik des Schienensystems
- D: Es dient als Maß für die thermische Ausdehnungsrate
- Richtig: A
- Erklärung: Das große Trägheitsmoment X-X (3038,3 cm⁴) sorgt dafür, dass das Profil unter der Vertikallast stabil bleibt und Biegeverformungen klein bleiben.
- Quelle: https://www.valente1919.com/de/schiene-60-e1-uic-60/

### Neue Frage 15
- Frage: Warum wird beim CWR-Gleis oft von einem »Neutraltemperaturbereich« gesprochen, statt von einer festen NRT-Wert?
- A: Weil die Temperaturmessung nur auf Millisekunden genau sein muss
- B: Weil sich die tatsächliche Neutraltemperatur im Betrieb verschiebt (z. B. durch Schweißungen, Gleisarbeiten und Setzungen)
- C: Weil es mehrere Normen gibt, die unterschiedliche NRT definieren
- D: Weil die Neutraltemperatur nicht messbar ist
- Richtig: B
- Erklärung: Durch Schweißstellen, Gleisarbeiten und Temperaturbeanspruchung im Betrieb verschiebt sich die tatsächliche Neutraltemperatur, daher wird ein Bereich betrachtet.
- Quelle: https://www.pandrol.com/de/einblick/verhinderung-von-gleisknicken-und-schienenbruchen-mit-dem-verse-system-von-pandrol/

### Neue Frage 18
- Frage: Was ist eine Konsequenz von zu niedriger Neutraltemperatur bei einem CWR-Gleis im Sommer?
- A: Das Gleis neigt zum Knicken (Buckling) aufgrund thermischer Druckspannung
- B: Die Schiene zieht sich stark zusammen und knarzt
- C: Der Schienenkopf wird an der Fahrkante abgenutzt
- D: Die Trägheitsmoment X-X erhöht sich
- Richtig: A
- Erklärung: Liegt die Betriebstemperatur deutlich über der NRT, entstehen thermische Druckspannungen, die zum Gleisknicken (Buckling) führen können.
- Quelle: https://railwaynews.net/uic-leaflet-no-720-chapter-7-way-and-works-laying-and-maintenance-of-cwr-track.html

