import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Bildnachweis {
  key: string;
  file: string;
  credit: string;
  license: string;
  sourceUrl: string;
}

type Pruefstatus = 'bestaetigt' | 'korrigiert';

interface Bildpruefung {
  status: Pruefstatus;
  notiz?: string;
}

interface Domainkategorie {
  name: string;
  domains: number;
  verwendungen: number;
  beispiele: string;
  einordnung: string;
}

interface TopDomain {
  domain: string;
  verwendungen: number;
  einordnung: string;
}

@Component({
  selector: 'app-rechte',
  templateUrl: './rechte.page.html',
  styleUrls: ['./rechte.page.scss'],
  standalone: false,
})
export class RechtePage implements OnInit {
  gesamtQuellen = 645;
  gesamtDomains = 258;
  umgeschriebeneQuellen = 35;

  kategorien: Domainkategorie[] = [
    {
      name: 'Wikipedia',
      domains: 1,
      verwendungen: 117,
      beispiele: 'de.wikipedia.org',
      einordnung:
        'Wikipedia-Texte stehen unter CC BY-SA 4.0. Da wir nie Wikipedia-Sätze wörtlich übernehmen, sondern nur verlinken und die referenzierte Tatsache in eigenen Worten zusammenfassen, greift die Lizenzpflicht (Namensnennung, Weitergabe unter gleicher Lizenz) für unsere Kurzformulierungen gar nicht erst – reine Fakten sind ohnehin nicht schutzfähig, nur der konkrete Wikipedia-Wortlaut wäre es.',
    },
    {
      name: 'Amtliche Gesetzestexte & Rechtsdatenbanken',
      domains: 10,
      verwendungen: 29,
      beispiele: 'gesetze-im-internet.de, gesetze-bayern.de, buzer.de, dejure.org, jusline.at, bussgeldkatalog.org',
      einordnung:
        'Gesetze, Verordnungen und amtliche Erlasse (z. B. die EBO) sind nach § 5 Abs. 1 UrhG als amtliche Werke gemeinfrei – das gilt unabhängig davon, ob der Text auf einem offiziellen Portal (gesetze-im-internet.de) oder einer privaten Gesetzesdatenbank (buzer.de, dejure.org) steht, da sich die Gemeinfreiheit auf den Normtext selbst bezieht. Die privaten Datenbanken und Bußgeldkataloge dürfen als solche zusätzlich eigene, geschützte Aufbereitung enthalten, die wir aber nicht übernehmen, sondern nur verlinken.',
    },
    {
      name: 'Öffentliche Stellen, Berufsgenossenschaften & Hochschulen',
      domains: 36,
      verwendungen: 104,
      beispiele: 'dguv.de, bgbau.de, uv-bund-bahn.de, baua.de, eba.bund.de, bast.de, Hochschulen/Länderbehörden',
      einordnung:
        'Berufsgenossenschaften und Bundesbehörden sind Körperschaften des öffentlichen Rechts mit gesetzlichem Aufklärungsauftrag; ihre Nutzungsbedingungen verlangen zwar meist eine Genehmigung für "Veröffentlichungen" ihrer Inhalte, das betrifft aber die Übernahme von Texten/Bildern – nicht das bloße Verlinken samt eigener Kurzformulierung, die wir durchgängig verwenden. Rechtlich unproblematisch.',
    },
    {
      name: 'Bahnnahe Unternehmen (DB-Konzern)',
      domains: 3,
      verwendungen: 7,
      beispiele: 'deutschebahn.com, dbinfrago.com',
      einordnung:
        'DB InfraGO und die Deutsche Bahn AG sind privatrechtliche, aber bundeseigene Unternehmen – keine amtlichen Werke, aber mit klarem öffentlichem Informationsauftrag zu Regelwerken und Richtlinien. Gleiche Einordnung wie kommerzielle Fachseiten (siehe unten): Verlinken plus eigene Zusammenfassung ist unproblematisch.',
    },
    {
      name: 'Kommerzielle Fachlexika & Wissensportale',
      domains: 14,
      verwendungen: 99,
      beispiele: 'trackopedia.com, baunetzwissen.de, baunormenlexikon.de, dinmedia.de, duden.de, link.springer.com',
      einordnung:
        'Fachenzyklopädien, Lexika und Verlagsseiten stellen Fachwissen frei zugänglich bereit und verbieten in ihren Nutzungsbedingungen meist nur die unautorisierte Vervielfältigung/kommerzielle Weiterverwertung ihrer Texte – nicht das Verlinken. Nach der EuGH-Rechtsprechung zu Hyperlinks (siehe Einordnung oben) ist ein Link auf einen dort frei zugänglichen Artikel plus eigene Kurzformulierung keine eigene "öffentliche Wiedergabe" und damit rechtlich unbedenklich.',
    },
    {
      name: 'Herstellerseiten (Bahntechnik & Bauwirtschaft)',
      domains: 58,
      verwendungen: 124,
      beispiele: 'voestalpine.com, plassertheurer.com, pandrol.com, vossloh.com, wackerneuson.de, geismar.com',
      einordnung:
        'Produktseiten von Herstellern enthalten meist Standard-Urheberrechtshinweise ("kein Download/keine Vervielfältigung ohne Genehmigung ausser für privaten Gebrauch") sowie Markenhinweise – beides betrifft die Übernahme von Bildern/Volltexten, nicht das Verlinken auf die Produktseite. Die Nennung des Herstellernamens als Quelle ("voestalpine Railway Systems, Produktseite …") ist eine zulässige, rein sachliche Bezugnahme.',
    },
    {
      name: 'Kleine Fachseiten, Foren, Ratgeber & Einzelbetriebe',
      domains: 136,
      verwendungen: 165,
      beispiele: 'Handwerksbetriebe, Heimwerker-/Bau-Ratgeberportale, Fachforen, vereinzelt Dokumenten-Plattformen',
      einordnung:
        'Der lange Rest der Domainliste (über 150 Domains mit meist nur 1–3 Verwendungen) besteht aus Handwerksbetrieben, Ratgeberblogs, Fachforen und ähnlich kleinteiligen Seiten – keine davon zeigte bei Stichproben ein explizites Zitier-/Linkverbot. Eine kleine Untergruppe (readkong.com, silo.tips, wikiteka.com – 3 Domains) sind Dokumenten-Upload-Plattformen mit unklarer Herkunft der dort gehosteten PDFs; das rechtliche Risiko für uns als reinen, nicht-kommerziellen Verlinker ist auch hier sehr gering (siehe EuGH GS Media – Kenntnis der Rechtswidrigkeit wäre nötig), aber diese drei Links sind die einzigen mit einer gewissen Restunschärfe.',
    },
  ];

  topDomains: TopDomain[] = [
    {
      domain: 'de.wikipedia.org',
      verwendungen: 117,
      einordnung:
        'Freie Enzyklopädie, Texte unter CC BY-SA 4.0. Da nur verlinkt und in eigenen Worten zusammengefasst wird (kein Wikipedia-Satz wörtlich übernommen), entsteht keine Lizenzpflicht für unsere Kurzformulierungen.',
    },
    {
      domain: 'trackopedia.com',
      verwendungen: 53,
      einordnung:
        'Private Fachenzyklopädie für Bahninfrastruktur (Global Rail Group), seit über 15 Jahren als freies Nachschlagewerk für die Branche betrieben. Rechtliche Hinweise untersagen unautorisiertes Kopieren, äußern sich aber nicht zum Verlinken – nach EuGH-Rechtsprechung unproblematisch, solange (wie seit dieser Runde durchgängig der Fall) nur verlinkt und eigenständig zusammengefasst wird.',
    },
    {
      domain: 'baunetzwissen.de',
      verwendungen: 24,
      einordnung:
        'Fachportal des Bauverlags (BauNetz). Nutzungsbedingungen untersagen vor allem die kommerzielle Nutzung veröffentlichter Adressen, enthalten aber keine expliziten Zitier- oder Linkregeln. Für unsere fünf betroffenen Fragen (LF03) wurden die zuvor wörtlich übernommenen Definitionssätze in dieser Runde durch eigene Kurzformulierungen ersetzt.',
    },
    {
      domain: 'dguv.de',
      verwendungen: 22,
      einordnung:
        'Deutsche Gesetzliche Unfallversicherung – Spitzenverband der gewerblichen und öffentlichen Unfallversicherungsträger, eine Körperschaft des öffentlichen Rechts mit gesetzlichem Präventionsauftrag. Kein amtliches Werk im Sinne von § 5 UrhG, aber Verlinken plus eigene Kurzbeschreibung ist bei einer öffentlich-rechtlichen Präventionsstelle unproblematisch.',
    },
    {
      domain: 'gesetze-im-internet.de',
      verwendungen: 10,
      einordnung:
        'Offizielles Gesetzesportal der Bundesrepublik Deutschland (Bundesministerium der Justiz / Bundesamt für Justiz, technisch von juris betrieben). Die dort veröffentlichten Gesetzestexte (u. a. die EBO) sind amtliche Werke und nach § 5 Abs. 1 UrhG gemeinfrei – vollständig unbedenklich, auch ein Wortlautzitat der Norm wäre zulässig gewesen.',
    },
    {
      domain: 'darda.de',
      verwendungen: 10,
      einordnung:
        'Darda GmbH, deutscher Hersteller von Beton-Spalt- und Abbruchgeräten. Nutzungsbedingungen erlauben Downloads nur für den privaten Gebrauch, äußern sich aber nicht zum Verlinken – für unsere Zwecke unproblematisch.',
    },
    {
      domain: 'bgbau.de',
      verwendungen: 9,
      einordnung:
        'BG BAU – Berufsgenossenschaft der Bauwirtschaft, eine bundesunmittelbare Körperschaft des öffentlichen Rechts. Das Impressum verlangt für "Veröffentlichungen in jeder Form" eine schriftliche Genehmigung – das betrifft die Übernahme ihrer Inhalte, nicht das reine Verlinken mit eigenem Begleittext, das keine Vervielfältigung der BG-BAU-Inhalte darstellt.',
    },
    {
      domain: 'uv-bund-bahn.de',
      verwendungen: 8,
      einordnung:
        'Unfallversicherung Bund und Bahn (UVB), bundesunmittelbare Körperschaft des öffentlichen Rechts, zuständig u. a. für Beschäftigte der Eisenbahnen. Copyright-Hinweis auf Texte/Bilder vorhanden, gleiche Einordnung wie bei BG BAU: reines Verlinken ist keine Vervielfältigung ihrer Inhalte.',
    },
    {
      domain: 'publikationen.dguv.de',
      verwendungen: 8,
      einordnung:
        'Publikationsportal der DGUV (siehe dguv.de oben) – dort werden DGUV-Regeln und -Informationen als PDF bereitgestellt. Gleiche Einordnung: öffentlich-rechtliche Präventionsstelle, Verlinken plus eigene Kurzbeschreibung unproblematisch.',
    },
    {
      domain: 'technology.plassertheurer.com',
      verwendungen: 7,
      einordnung:
        'Plasser & Theurer, österreichischer Hersteller von Bahnbaumaschinen (Stopfmaschinen u. Ä.). Das Impressum weist auf Markenschutz hin, enthält aber keine spezifischen Verlinkungsregeln – unproblematisch.',
    },
  ];

  bilder: Bildnachweis[] = [];
  ladeFehler = false;

  pruefungen: Record<string, Bildpruefung> = {
    handwerkzeuge: {
      status: 'korrigiert',
      notiz:
        'Bisheriger Credit-Text nannte pauschal "US-Bundesbehörde (NARA)" als Urheber. Laut Commons-Metadaten ist NARA (National Archives) nur die Archiv-Institution, die das Bild verwahrt – tatsächlicher Fotograf ist Jim Pickerell, aufgenommen im Auftrag der US-Umweltbehörde EPA. Der gemeinfreie Status (US-Bundesbehördenwerk) ist davon unberührt und bestätigt; nur die Namensnennung wurde präzisiert.',
    },
  };

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Bildnachweis[]>('assets/bilder/bildnachweise.json').subscribe({
      next: (data) => (this.bilder = data),
      error: () => (this.ladeFehler = true),
    });
  }

  pruefstatus(key: string): Bildpruefung {
    return this.pruefungen[key] ?? { status: 'bestaetigt' };
  }

  trackByKey(_: number, b: Bildnachweis): string {
    return b.key;
  }
}
