# RILLE — Magazin für unabhängige Musik

Ein Indie-Musikmagazin als einzelne, vollständig statische Seite: Artikelvorschauen,
Künstlerporträts und ein Anmeldeformular für Abonnements. Kein Build, keine Abhängigkeiten,
keine Netzwerkzugriffe — `index.html` im Browser öffnen genügt.

Alle Inhalte sind erfunden: Bands, Labels, Alben, Clubs und Autor:innen existieren nicht.

## Öffnen

```
index.html
```

Direkt per Doppelklick oder `file://`. Wer einen Server bevorzugt:
`python3 -m http.server` im Projektverzeichnis.

## Was drin ist

**Aufmacher** — die Geschichte des Hauses, groß gesetzt, mit generiertem Cover.

**Aktuelle Beiträge** — 13 Artikel aus sechs Rubriken (Rezension, Interview, Porträt, Live,
Kolumne, Entdeckung) als Raster in drei Kartengrößen. Filter nach Rubrik, Live-Suche über
Titel, Dachzeile, Teaser, Tags und Autor:in, Sortierung nach Datum oder Titel, Trefferzähler
mit `aria-live`, gestalteter Leerzustand mit Rücksetzer, „Mehr laden".

**Lesemodus** — jeder Beitrag öffnet sich als Overlay mit dem vollständigen Text,
Fortschrittsbalken, drei Schriftgrößen und Fokusfalle; `Esc` schließt, der Fokus kehrt zur
auslösenden Karte zurück.

**Künstlerporträts** — acht Acts mit Duoton-Porträt, Herkunft, Genre, Besetzung. Das
Künstlerblatt zeigt das ausführliche Porträt, ein Zitat, die Diskografie und den Track des
Monats und verlinkt in die passenden Beiträge.

**Playlist der Redaktion** — zehn Titel mit Kommentar und einer Abspiel-Simulation ohne Audio.

**Abo** — drei Tarife (Digital, Print, Soli) als Karten, darunter das vollständige
Anmeldeformular: Name, E-Mail, Tarifwahl, Versandintervall, Interessen, Adresse (nur bei
Print und Soli), Kommentar mit Zeichenzähler, Einwilligung und ein Honeypot gegen Bots.
Die Validierung läuft beim Verlassen eines Feldes und beim Absenden, danach live; die
Fehlerzusammenfassung springt zum ersten fehlerhaften Feld. Nach dem simulierten Absenden
erscheint eine Quittung mit der getroffenen Auswahl. Eine bereits angemeldete Adresse wird
erkannt und lässt sich aktualisieren oder löschen. Nichts davon verlässt das Gerät.

## Technik

- **Aufbau** — `index.html` (Markup), `assets/css/style.css` (Design-System),
  `assets/js/data.js` (Redaktionsinhalte), `assets/js/artwork.js` (Grafik),
  `assets/js/app.js` (Verhalten). Klassische Scripts mit `defer`, keine Module.
- **Grafik** — sämtliche Cover und Porträts entstehen zur Laufzeit als Inline-SVG:
  Risographie-Duoton mit versetzten Farbflächen, Halbtonraster und Korn. Ein Seed pro Motiv
  über einen eigenen Zufallsgenerator, also bei jedem Laden dasselbe Bild. Keine Bilddateien.
- **Themes** — dunkel ist der Standard, hell folgt einer ausdrücklichen Systemvorgabe oder
  der gespeicherten Wahl; der Umschalter sitzt in der Kopfzeile.
- **Barrierefreiheit** — semantische Landmarken, Sprungmarke, sichtbarer Fokus, vollständige
  Tastaturbedienung, `aria-live` für Trefferzahl, Fehler und Erfolg, WCAG-AA-Kontraste in
  beiden Themes, `prefers-reduced-motion` schaltet Bewegung ab.
- **Speicher** — `localStorage` unter `rille.thema`, `rille.lesemodus.groesse`,
  `rille.abo.v1` und `rille.abo.entwurf.v1`, jeder Zugriff abgesichert: ist der Speicher
  blockiert, läuft die Seite unverändert weiter.
- **Responsiv** — 360 px bis 1600 px ohne horizontales Scrollen, eigenes Druck-Stylesheet.
