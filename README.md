# Moon Vampires Division – Website

Die Clubseite läuft kostenlos über **GitHub Pages**. GitHub baut die Seite mit Jekyll selbst.
Jede Änderung, die du hier speicherst, ist nach etwa einer Minute online.

## Was finde ich wo?

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite |
| `ueber-uns.html` | Leitungsteam |
| `uniform.html` | Clubpferd, Übergangs- und Hauptuniform |
| `clubtreffen.html` | Stammplatz, Roadmap |
| `rangsystem.html` | Einleitung zum Rangsystem |
| `bewirb-dich.html` | Voraussetzungen und Ablauf der Bewerbung |
| `bewerbung.html` | Eigenes Bewerbungsformular (sendet an das Google-Formular) |
| `_data/bewerbungsformular.yml` | **Fragen** des Bewerbungsformulars |
| `_discord/` | Anleitung und Skript, mit denen Bewerbungen automatisch in Discord landen (wird nicht veröffentlicht) |
| `_data/wochenplan.yml` | **Wochenplan** (Termine auf „Clubtreffen“) |
| `_data/raenge.yml` | **Ränge** (Liste auf „Rangsystem“) |
| `_data/navigation.yml` | Menüpunkte |
| `_config.yml` | Seitentitel, Instagram-Link, Link zum Bewerbungsformular |
| `assets/img/` | Bilder |
| `assets/css/style.css` | Design (Farben stehen ganz oben) |

## Häufige Änderungen direkt auf github.com

1. Datei anklicken und dann auf das **Stift-Symbol** („Edit this file“) klicken.
2. Text ändern. Die Zeilen zwischen `---` oben in den Seiten bitte nicht löschen.
3. Unten auf **Commit changes** klicken. Fertig.

**Einen Termin hinzufügen:** In `_data/wochenplan.yml` einen Block kopieren und anpassen.
Die Einrückung (Leerzeichen am Zeilenanfang) muss gleich bleiben.

**Ein Bild tauschen:** In `assets/img/` eine neue Datei mit **genau demselben Namen** hochladen
(„Add file“ → „Upload files“).

**Bewerbungsformular testen, ohne etwas zu senden:** `/bewerbung.html?test` aufrufen.
Dann zeigt das Formular nur an, was es senden würde.

**Neues Teammitglied:** In `ueber-uns.html` einen `<article class="card member reveal">…</article>`-Block kopieren.
