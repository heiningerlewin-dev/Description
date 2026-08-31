/* ============================================================
   RILLE · assets/js/app.js
   Gesamtes Verhalten der Seite. Vertrag: bauplan.md Abschnitt 5,
   abo-formular.md vollstaendig.

   Klassisches Script, kein Modul, keine Abhaengigkeit, kein Netzwerk.
   Laeuft unter file://. Legt keine einzige neue globale Variable an.

   Gliederung:
      1 Konstanten und Zustand
      2 Werkzeug (DOM, Speicher, Format, Live-Regionen)
      3 Thema
      4 Ableitungen aus den Daten
      5 Aufmacher
      6 Filter, Suche, Sortierung, Artikelraster
      7 Kuenstlerraster
      8 Playlist
      9 Overlays: Lesemodus und Kuenstlerblatt
     10 Kopfzeile und Fusszeile
     11 Abo-Formular
     12 Ereignisse und Start
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1 · KONSTANTEN UND ZUSTAND
     ============================================================ */

  const START_SICHTBAR = 9;      // Karten beim ersten Rendern (Bauplan 5)
  const NACHLADE_SCHRITT = 6;    // Karten je Klick auf „Mehr laden“
  const SUCH_VERZOEGERUNG = 200; // ms Entprellung der Live-Suche
  const TEMPO_FAKTOR = 20;       // Playlist: 1 s Anzeige = 20 s Stueck
  const SENDE_DAUER = 900;       // ms, simuliertes Absenden (AF 4.4)
  const ENTWURF_VERZOEGERUNG = 400;                  // ms (AF 6.2)
  const ENTWURF_HALTBARKEIT = 7 * 24 * 60 * 60 * 1000; // 7 Tage
  const BOT_MINDESTZEIT = 2500;  // ms Zeitfalle (AF 2.7)
  const KOMMENTAR_MAX = 300;

  const SCHLUESSEL = {
    thema: 'rille.thema',
    lesegroesse: 'rille.lesemodus.groesse',
    abo: 'rille.abo.v1',
    entwurf: 'rille.abo.entwurf.v1'
  };

  const zustand = {
    rubrik: 'alle',
    suche: '',
    sortierung: 'datum-neu',
    sichtbar: START_SICHTBAR,
    offenerDialog: null,
    letzterFokus: null,
    laufenderTrack: null,
    thema: 'dark'
  };

  const zeitgeber = {
    suche: 0,
    entwurf: 0,
    senden: 0,
    playlist: 0,
    fortschritt: 0
  };

  let daten = null;          // window.RILLE_DATA
  let rubrikNachId = null;   // Map rubrikId -> Rubrik
  let artikelNachId = null;  // Map artikel.id -> Artikel
  let suchindex = null;      // Map artikel.id -> Suchtext
  let scrollGemerkt = 0;     // Scrollposition waehrend eines offenen Overlays

  const grafik = (window.RILLE_ARTWORK && typeof window.RILLE_ARTWORK === 'object')
    ? window.RILLE_ARTWORK
    : null;

  const mqBreit = fensterFrage('(min-width: 900px)');
  const mqRuhe = fensterFrage('(prefers-reduced-motion: reduce)');
  const mqHell = fensterFrage('(prefers-color-scheme: light)');

  /* ============================================================
     2 · WERKZEUG
     ============================================================ */

  function id(name) {
    return document.getElementById(name);
  }

  function neu(tag, klasse, text) {
    const knoten = document.createElement(tag);
    if (klasse) { knoten.className = klasse; }
    if (text !== undefined && text !== null) { knoten.textContent = String(text); }
    return knoten;
  }

  function leere(knoten) {
    if (!knoten) { return; }
    while (knoten.firstChild) { knoten.removeChild(knoten.firstChild); }
  }

  function fensterFrage(abfrage) {
    try {
      return (typeof window.matchMedia === 'function') ? window.matchMedia(abfrage) : null;
    } catch (fehler) {
      return null;
    }
  }

  function reduziert() {
    return !!(mqRuhe && mqRuhe.matches);
  }

  function scrollArt() {
    return reduziert() ? 'auto' : 'smooth';
  }

  function naechsterRahmen(arbeit) {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(arbeit);
    } else {
      window.setTimeout(arbeit, 16);
    }
  }

  /* Solange ein Zeiger gedrueckt ist, darf keine Pruefung Text einfuegen.
     Der focusout eines Feldes faellt mit dem mousedown/pointerdown des naechsten
     Klicks zusammen: Die eingefuegte Fehlerzeile schiebt alles darunter nach
     unten, mouseup landet auf einem anderen Element als mousedown - und der
     Klick geht verloren (auf Schmalgeraeten trifft es ganze Tarifkarten).
     Deshalb wird solche Arbeit bis nach dem Loslassen aufgeschoben; AF 3.0
     bleibt gewahrt, geprueft wird weiterhin beim Verlassen des Feldes. */
  let zeigerUnten = false;
  const zeigerWarteschlange = [];
  let zeigerNotbremse = 0;

  function zeigerFreigeben() {
    zeigerUnten = false;
    if (zeigerNotbremse) { window.clearTimeout(zeigerNotbremse); zeigerNotbremse = 0; }
    if (!zeigerWarteschlange.length) { return; }
    // Erst nach mouseup/click ausfuehren, sonst verschiebt sich das Klickziel doch noch.
    window.setTimeout(function () {
      while (zeigerWarteschlange.length) {
        const arbeit = zeigerWarteschlange.shift();
        try { arbeit(); } catch (fehler) { /* eine Pruefung darf die naechste nicht reissen */ }
      }
    }, 0);
  }

  document.addEventListener('pointerdown', function () {
    zeigerUnten = true;
    if (zeigerNotbremse) { window.clearTimeout(zeigerNotbremse); }
    // Falls das Loslassen ausserhalb des Fensters passiert und nie ankommt.
    zeigerNotbremse = window.setTimeout(zeigerFreigeben, 1200);
  }, true);
  document.addEventListener('pointerup', zeigerFreigeben, true);
  document.addEventListener('pointercancel', zeigerFreigeben, true);

  function sobaldZeigerFrei(arbeit) {
    if (!zeigerUnten) { arbeit(); return; }
    zeigerWarteschlange.push(arbeit);
  }

  /* Live-Region: erst leeren, im naechsten Frame setzen. Sonst verschlucken
     manche Screenreader zwei gleichlautende Meldungen hintereinander. */
  function melde(bereich, text) {
    if (!bereich) { return; }
    bereich.textContent = '';
    if (!text) { return; }
    naechsterRahmen(function () { bereich.textContent = text; });
  }

  function seitenStatus(text) {
    melde(id('seiten-status'), text);
  }

  function aboStatus(text) {
    melde(id('abo-status'), text);
  }

  /* --- Speicher: jeder Zugriff gekapselt, wirft nie (Bauplan 5.10) --- */

  function lies(schluessel) {
    try {
      const roh = window.localStorage.getItem(schluessel);
      if (!roh) { return null; }
      const wert = JSON.parse(roh);
      if (wert && typeof wert === 'object' && wert.version !== undefined && wert.version !== 1) {
        window.localStorage.removeItem(schluessel);
        return null;
      }
      return wert;
    } catch (fehler) {
      return null;
    }
  }

  function liesText(schluessel) {
    try {
      return window.localStorage.getItem(schluessel);
    } catch (fehler) {
      return null;
    }
  }

  function schreib(schluessel, wert) {
    try {
      window.localStorage.setItem(
        schluessel,
        typeof wert === 'string' ? wert : JSON.stringify(wert)
      );
      return true;
    } catch (fehler) {
      return false;
    }
  }

  function entferneSchluessel(schluessel) {
    try {
      window.localStorage.removeItem(schluessel);
      return true;
    } catch (fehler) {
      return false;
    }
  }

  /* Reine Lese-Probe: legt bewusst keinen fuenften Schluessel an (Bauplan 5.10).
     Ob ein Schreibversuch geglueckt ist, meldet zusaetzlich der Rueckgabewert
     von schreib(). */
  function speicherGeht() {
    try {
      window.localStorage.getItem(SCHLUESSEL.abo);
      return true;
    } catch (fehler) {
      return false;
    }
  }

  /* --- Format: Intl mit Handformat als Rueckfall (Bauplan 7.3) --- */

  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  function datumTeile(wert) {
    if (wert instanceof Date) { return wert; }
    const text = String(wert || '');
    const treffer = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (treffer) {
      return new Date(Number(treffer[1]), Number(treffer[2]) - 1, Number(treffer[3]));
    }
    const versuch = new Date(text);
    return isNaN(versuch.getTime()) ? null : versuch;
  }

  function formatiereDatum(wert) {
    const tag = datumTeile(wert);
    if (!tag) { return ''; }
    try {
      return new Intl.DateTimeFormat('de-DE', {
        day: 'numeric', month: 'long', year: 'numeric'
      }).format(tag);
    } catch (fehler) {
      return tag.getDate() + '. ' + MONATE[tag.getMonth()] + ' ' + tag.getFullYear();
    }
  }

  function formatierePreis(zahl) {
    const wert = Number(zahl);
    if (!isFinite(wert)) { return ''; }
    try {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0
      }).format(wert);
    } catch (fehler) {
      return wert + ' €';
    }
  }

  function zeitAusSekunden(sekunden) {
    const ganz = Math.max(0, Math.round(Number(sekunden) || 0));
    const min = Math.floor(ganz / 60);
    const sek = ganz % 60;
    return min + ':' + (sek < 10 ? '0' : '') + sek;
  }

  const ZAHLWORT = ['null', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs',
    'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];

  function zahlwort(n, gross) {
    const wort = (n >= 0 && n < ZAHLWORT.length) ? ZAHLWORT[n] : String(n);
    if (!gross || n >= ZAHLWORT.length) { return wort; }
    return wort.charAt(0).toUpperCase() + wort.slice(1);
  }

  function guillemets(text) {
    return '»' + String(text || '') + '«';
  }

  /* --- Artwork defensiv einsetzen (Bauplan 7.3: Idempotenz) --- */

  function setzeArtwork(behaelter, macher) {
    if (!behaelter || behaelter.getAttribute('data-artwork') === 'gesetzt') { return; }
    if (!grafik) { return; }
    let svg = null;
    try {
      svg = macher();
    } catch (fehler) {
      svg = null;
    }
    if (svg) {
      behaelter.appendChild(svg);
      behaelter.setAttribute('data-artwork', 'gesetzt');
    }
  }

  function symbolIn(behaelter, name, px) {
    if (!behaelter || !grafik || typeof grafik.symbol !== 'function') { return null; }
    let svg = null;
    try {
      svg = grafik.symbol(name, px);
    } catch (fehler) {
      svg = null;
    }
    if (svg) { behaelter.appendChild(svg); }
    return svg;
  }

  /* ============================================================
     3 · THEMA (Bauplan V2, V31–V33)
     ============================================================ */

  function themaAnwenden(wert) {
    zustand.thema = (wert === 'light') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', zustand.thema);
    const schalter = id('themenschalter');
    if (schalter) {
      schalter.setAttribute(
        'aria-label',
        zustand.thema === 'dark' ? 'Zu hellem Design wechseln' : 'Zu dunklem Design wechseln'
      );
      leere(schalter);
      symbolIn(schalter, 'thema', 20);
    }
  }

  function themaStarten() {
    const gespeichert = liesText(SCHLUESSEL.thema);
    if (gespeichert === 'dark' || gespeichert === 'light') {
      themaAnwenden(gespeichert);
    } else if (mqHell && mqHell.matches) {
      themaAnwenden('light');
    } else {
      themaAnwenden('dark');
    }

    if (mqHell && typeof mqHell.addEventListener === 'function') {
      mqHell.addEventListener('change', function (ereignis) {
        const merker = liesText(SCHLUESSEL.thema);
        if (merker === 'dark' || merker === 'light') { return; }
        themaAnwenden(ereignis.matches ? 'light' : 'dark');
      });
    }
  }

  function themaUmschalten() {
    themaAnwenden(zustand.thema === 'dark' ? 'light' : 'dark');
    schreib(SCHLUESSEL.thema, zustand.thema);
    seitenStatus(zustand.thema === 'light' ? 'Helles Design aktiv.' : 'Dunkles Design aktiv.');
  }

  /* ============================================================
     4 · ABLEITUNGEN AUS DEN DATEN
     ============================================================ */

  function bereiteDatenAuf() {
    rubrikNachId = Object.create(null);
    daten.rubriken.forEach(function (rubrik) { rubrikNachId[rubrik.id] = rubrik; });

    artikelNachId = Object.create(null);
    suchindex = Object.create(null);
    daten.artikel.forEach(function (artikel) {
      artikelNachId[artikel.id] = artikel;
      suchindex[artikel.id] = [
        artikel.titel,
        artikel.dachzeile,
        artikel.teaser,
        (artikel.tags || []).join(' '),
        artikel.autor ? artikel.autor.name : ''
      ].join(' ').toLowerCase();
    });
  }

  function rubrikLabel(rubrikId) {
    const rubrik = rubrikNachId[rubrikId];
    return rubrik ? rubrik.label : String(rubrikId || '');
  }

  function suchbegriffe() {
    if (!zustand.suche) { return []; }
    return zustand.suche.split(/\s+/).filter(function (teil) { return teil.length > 0; });
  }

  /* Treffer im Text als <mark class="treffer"> auszeichnen – rein per DOM,
     nie per innerHTML (Bauplan V13). */
  function textMitTreffern(text, begriffe) {
    const bruch = document.createDocumentFragment();
    const quelle = String(text || '');
    if (!begriffe.length) {
      bruch.appendChild(document.createTextNode(quelle));
      return bruch;
    }
    const klein = quelle.toLowerCase();
    const marken = [];
    begriffe.forEach(function (begriff) {
      let stelle = klein.indexOf(begriff);
      while (stelle !== -1) {
        marken.push({ von: stelle, bis: stelle + begriff.length });
        stelle = klein.indexOf(begriff, stelle + begriff.length);
      }
    });
    if (!marken.length) {
      bruch.appendChild(document.createTextNode(quelle));
      return bruch;
    }
    marken.sort(function (a, b) { return a.von - b.von || a.bis - b.bis; });

    const vereint = [];
    marken.forEach(function (stelle) {
      const letzter = vereint[vereint.length - 1];
      if (letzter && stelle.von <= letzter.bis) {
        letzter.bis = Math.max(letzter.bis, stelle.bis);
      } else {
        vereint.push({ von: stelle.von, bis: stelle.bis });
      }
    });

    let zeiger = 0;
    vereint.forEach(function (stelle) {
      if (stelle.von > zeiger) {
        bruch.appendChild(document.createTextNode(quelle.slice(zeiger, stelle.von)));
      }
      const marke = neu('mark', 'treffer', quelle.slice(stelle.von, stelle.bis));
      bruch.appendChild(marke);
      zeiger = stelle.bis;
    });
    if (zeiger < quelle.length) {
      bruch.appendChild(document.createTextNode(quelle.slice(zeiger)));
    }
    return bruch;
  }

  /* ============================================================
     5 · AUFMACHER (Bauplan 2.2, V3)
     ============================================================ */

  function heroFormat() {
    return (mqBreit && mqBreit.matches) ? 'hoch' : 'breit';
  }

  function rendereAufmacher() {
    const bereich = id('aufmacher');
    if (!bereich) { return; }
    const artikel = artikelNachId[daten.aufmacherId] || daten.artikel[0];
    if (!artikel) { return; }

    leere(bereich);

    const text = neu('div', 'aufmacher__text');

    const marke = neu('p', 'rubrikmarke rubrikmarke--kasten', artikel.rubrikLabel);
    marke.setAttribute('data-rubrik', artikel.rubrikId);
    text.appendChild(marke);

    const titel = neu('h2', 'aufmacher__titel', artikel.titel);
    titel.id = 'aufmacher-titel';
    text.appendChild(titel);

    text.appendChild(neu('p', 'aufmacher__dachzeile', artikel.dachzeile));
    text.appendChild(neu('p', 'aufmacher__lead', artikel.teaser));
    text.appendChild(neu('p', 'aufmacher__meta mono',
      artikel.autor.name + ' · ' + formatiereDatum(artikel.datum) +
      ' · ' + artikel.lesezeit + ' Min. Lesezeit'));

    const knopf = neu('button', 'knopf knopf--primaer', 'Beitrag lesen');
    knopf.type = 'button';
    knopf.setAttribute('data-aktion', 'lesemodus-oeffnen');
    knopf.setAttribute('data-artikel-id', artikel.id);
    text.appendChild(knopf);

    bereich.appendChild(text);

    const bild = neu('div', 'aufmacher__artwork');
    setzeArtwork(bild, function () {
      return grafik.hero(artikel.artworkSeed, artikel.rubrikId, {
        format: heroFormat(), streuung: artikel.farbe
      });
    });
    bereich.appendChild(bild);

    const marken = neu('p', 'aufmacher__marken');
    marken.setAttribute('aria-hidden', 'true');
    marken.appendChild(neu('span'));
    marken.appendChild(neu('span'));
    marken.appendChild(neu('span'));
    bereich.appendChild(marken);
  }

  /* Der Formatwechsel betrifft nur die Grafik, nicht den Text (Bauplan 4.5). */
  function beobachteAufmacherFormat() {
    if (!mqBreit || typeof mqBreit.addEventListener !== 'function') { return; }
    mqBreit.addEventListener('change', function () {
      const bereich = id('aufmacher');
      if (!bereich) { return; }
      const behaelter = bereich.querySelector('[data-artwork]');
      const artikel = artikelNachId[daten.aufmacherId] || daten.artikel[0];
      if (!behaelter || !artikel) { return; }
      leere(behaelter);
      behaelter.removeAttribute('data-artwork');
      setzeArtwork(behaelter, function () {
        return grafik.hero(artikel.artworkSeed, artikel.rubrikId, {
          format: heroFormat(), streuung: artikel.farbe
        });
      });
    });
  }

  /* ============================================================
     6 · FILTER, SUCHE, SORTIERUNG, ARTIKELRASTER
     ============================================================ */

  function rendereChips() {
    const liste = id('filterliste');
    if (!liste) { return; }
    leere(liste);

    const eintraege = [{ id: 'alle', label: 'Alle', anzahl: daten.artikel.length }];
    daten.rubriken.forEach(function (rubrik) {
      const anzahl = daten.artikel.filter(function (artikel) {
        return artikel.rubrikId === rubrik.id;
      }).length;
      eintraege.push({ id: rubrik.id, label: rubrik.label, anzahl: anzahl });
    });

    eintraege.forEach(function (eintrag) {
      const punkt = neu('li', 'filterleiste__eintrag');
      const knopf = neu('button', 'filter-chip');
      knopf.type = 'button';
      knopf.setAttribute('data-aktion', 'filtern');
      knopf.setAttribute('data-rubrik', eintrag.id);
      knopf.setAttribute('aria-pressed', 'false');
      knopf.appendChild(document.createTextNode(eintrag.label + ' '));
      knopf.appendChild(neu('span', 'filter-chip__zahl mono', eintrag.anzahl));
      punkt.appendChild(knopf);
      liste.appendChild(punkt);
    });
  }

  function aktualisiereChips() {
    const liste = id('filterliste');
    if (liste) {
      const chips = liste.querySelectorAll('[data-aktion="filtern"]');
      Array.prototype.forEach.call(chips, function (chip) {
        const aktiv = chip.getAttribute('data-rubrik') === zustand.rubrik;
        chip.setAttribute('aria-pressed', aktiv ? 'true' : 'false');
        chip.classList.toggle('filter-chip--aktiv', aktiv);
      });
    }

    const kopf = id('hauptnav');
    if (kopf) {
      const links = kopf.querySelectorAll('a[data-rubrik]');
      Array.prototype.forEach.call(links, function (link) {
        const aktiv = link.getAttribute('data-rubrik') === zustand.rubrik;
        link.classList.toggle('hauptnav__link--aktiv', aktiv);
        if (aktiv) { link.setAttribute('aria-current', 'true'); }
        else { link.removeAttribute('aria-current'); }
      });
    }

    const fuss = id('fuss');
    if (fuss) {
      const fusslinks = fuss.querySelectorAll('a[data-rubrik]');
      Array.prototype.forEach.call(fusslinks, function (link) {
        if (link.getAttribute('data-rubrik') === zustand.rubrik) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }
  }

  function ermittleTreffer() {
    const begriffe = suchbegriffe();
    return daten.artikel.filter(function (artikel) {
      if (zustand.rubrik !== 'alle' && artikel.rubrikId !== zustand.rubrik) { return false; }
      if (!begriffe.length) { return true; }
      const heuhaufen = suchindex[artikel.id] || '';
      return begriffe.every(function (begriff) { return heuhaufen.indexOf(begriff) !== -1; });
    });
  }

  function sortiere(liste) {
    const art = zustand.sortierung;
    return liste.slice().sort(function (a, b) {
      let unterschied = 0;
      if (art === 'datum-alt') {
        unterschied = a.datum < b.datum ? -1 : (a.datum > b.datum ? 1 : 0);
      } else if (art === 'lesezeit-kurz') {
        unterschied = a.lesezeit - b.lesezeit;
      } else if (art === 'titel-az') {
        try {
          unterschied = a.titel.localeCompare(b.titel, 'de');
        } catch (fehler) {
          unterschied = a.titel < b.titel ? -1 : (a.titel > b.titel ? 1 : 0);
        }
      } else {
        unterschied = a.datum < b.datum ? 1 : (a.datum > b.datum ? -1 : 0);
      }
      if (unterschied !== 0) { return unterschied; }
      // Sekundaerkriterium: Datum absteigend, dann id aufsteigend (Bauplan 3.8)
      if (a.datum !== b.datum) { return a.datum < b.datum ? 1 : -1; }
      return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
    });
  }

  function kartengroesse(position) {
    if (position === 0) { return 'gross'; }
    if (position < 5) { return 'mittel'; }
    return 'kompakt';
  }

  function baueArtikelkarte(artikel, groesse, begriffe) {
    const karte = neu('article', 'artikelkarte artikelkarte--' + groesse);
    karte.setAttribute('data-artikel-id', artikel.id);
    karte.setAttribute('data-rubrik', artikel.rubrikId);

    if (groesse === 'kompakt') {
      const marke = neu('div', 'artikelkarte__marke');
      marke.setAttribute('aria-hidden', 'true');
      setzeArtwork(marke, function () {
        return grafik.cover(artikel.artworkSeed, artikel.rubrikId, 'kompakt',
          { streuung: artikel.farbe });
      });
      karte.appendChild(marke);

      karte.appendChild(neu('p', 'artikelkarte__meta mono',
        artikel.rubrikLabel + ' · ' + formatiereDatum(artikel.datum)));

      const titel = neu('h3', 'artikelkarte__titel');
      titel.appendChild(baueKartenlink(artikel, begriffe));
      karte.appendChild(titel);
      return karte;
    }

    const regel = neu('div', 'artikelkarte__regel');
    regel.setAttribute('aria-hidden', 'true');
    karte.appendChild(regel);

    const bild = neu('div', 'artikelkarte__artwork');
    setzeArtwork(bild, function () {
      return grafik.cover(artikel.artworkSeed, artikel.rubrikId, groesse,
        { streuung: artikel.farbe });
    });
    karte.appendChild(bild);

    const marke = neu('p',
      groesse === 'gross' ? 'rubrikmarke rubrikmarke--kasten' : 'rubrikmarke',
      artikel.rubrikLabel);
    marke.setAttribute('data-rubrik', artikel.rubrikId);
    karte.appendChild(marke);

    const titel = neu('h3', 'artikelkarte__titel');
    titel.appendChild(baueKartenlink(artikel, begriffe));
    karte.appendChild(titel);

    const anriss = neu('p', 'artikelkarte__anriss');
    anriss.appendChild(textMitTreffern(artikel.teaser, begriffe));
    karte.appendChild(anriss);

    karte.appendChild(neu('p', 'artikelkarte__meta mono',
      artikel.autor.name + ' · ' + formatiereDatum(artikel.datum) +
      ' · ' + artikel.lesezeit + ' Min.'));

    return karte;
  }

  function baueKartenlink(artikel, begriffe) {
    const link = neu('a', 'artikelkarte__link');
    link.href = '#lesemodus';
    link.setAttribute('data-aktion', 'lesemodus-oeffnen');
    link.setAttribute('data-artikel-id', artikel.id);
    link.appendChild(textMitTreffern(artikel.titel, begriffe));
    return link;
  }

  function rendereBeitraege() {
    const raster = id('artikelraster');
    if (!raster) { return; }

    const treffer = sortiere(ermittleTreffer());
    const begriffe = suchbegriffe();
    const gesamt = treffer.length;
    if (zustand.sichtbar < START_SICHTBAR) { zustand.sichtbar = START_SICHTBAR; }
    const anzahl = Math.min(zustand.sichtbar, gesamt);

    leere(raster);
    for (let i = 0; i < anzahl; i++) {
      raster.appendChild(baueArtikelkarte(treffer[i], kartengroesse(i), begriffe));
    }

    aktualisiereChips();
    aktualisiereZaehler(gesamt);
    aktualisiereSuchstatus(gesamt);
    aktualisiereLeerzustand(gesamt);
    aktualisiereNachladen(gesamt, anzahl);
  }

  function aktualisiereZaehler(gesamt) {
    const zaehler = id('ergebniszaehler');
    if (!zaehler) { return; }
    if (gesamt === 0) { zaehler.textContent = 'Keine Beiträge'; }
    else if (gesamt === 1) { zaehler.textContent = '1 Beitrag'; }
    else { zaehler.textContent = gesamt + ' Beiträge'; }
  }

  function aktualisiereSuchstatus(gesamt) {
    const status = id('suchstatus');
    if (!status) { return; }
    const hatSuche = zustand.suche.length > 0;
    const hatFilter = zustand.rubrik !== 'alle';
    let text = '';

    if (hatSuche && hatFilter) {
      text = gesamt + ' Treffer für „' + zustand.suche + '“ in der Rubrik ' +
        rubrikLabel(zustand.rubrik) + '.';
      if (gesamt === 1) {
        text = '1 Treffer für „' + zustand.suche + '“ in der Rubrik ' +
          rubrikLabel(zustand.rubrik) + '.';
      }
    } else if (hatSuche) {
      text = gesamt + ' Treffer für „' + zustand.suche + '“.';
      if (gesamt === 1) { text = '1 Treffer für „' + zustand.suche + '“.'; }
    } else if (hatFilter) {
      text = 'Gefiltert nach Rubrik ' + rubrikLabel(zustand.rubrik) + '.';
    }

    if (status.textContent !== text) { status.textContent = text; }
  }

  function aktualisiereLeerzustand(gesamt) {
    const leerzustand = id('leerzustand');
    const leertext = id('leerzustand-text');
    if (!leerzustand) { return; }
    if (gesamt > 0) {
      leerzustand.hidden = true;
      return;
    }
    if (leertext) {
      let text;
      if (zustand.suche && zustand.rubrik !== 'alle') {
        text = 'Für „' + zustand.suche + '“ in der Rubrik ' +
          rubrikLabel(zustand.rubrik) + ' haben wir nichts gefunden.';
      } else if (zustand.suche) {
        text = 'Für „' + zustand.suche + '“ haben wir nichts gefunden.';
      } else if (zustand.rubrik !== 'alle') {
        text = 'In der Rubrik ' + rubrikLabel(zustand.rubrik) +
          ' steht gerade nichts bereit.';
      } else {
        text = 'Hier steht gerade nichts bereit.';
      }
      leertext.textContent = text;
    }
    leerzustand.hidden = false;
  }

  function aktualisiereNachladen(gesamt, angezeigt) {
    const knopf = id('nachladen');
    if (!knopf) { return; }
    const rest = gesamt - angezeigt;
    if (rest <= 0) {
      knopf.hidden = true;
      return;
    }
    knopf.hidden = false;
    knopf.textContent = 'Mehr laden (' + rest + (rest === 1 ? ' weiterer)' : ' weitere)');
  }

  function setzeRubrik(rubrikId) {
    zustand.rubrik = rubrikId || 'alle';
    zustand.sichtbar = START_SICHTBAR;
    rendereBeitraege();
  }

  function setzeSuche(text) {
    zustand.suche = String(text || '').trim().toLowerCase();
    zustand.sichtbar = START_SICHTBAR;
    const loeschen = id('suche-loeschen');
    const feld = id('suchfeld');
    if (loeschen) { loeschen.hidden = !(feld && feld.value.length > 0); }
    rendereBeitraege();
  }

  function setzeAllesZurueck() {
    zustand.rubrik = 'alle';
    zustand.suche = '';
    zustand.sortierung = 'datum-neu';
    zustand.sichtbar = START_SICHTBAR;
    const feld = id('suchfeld');
    if (feld) { feld.value = ''; }
    const loeschen = id('suche-loeschen');
    if (loeschen) { loeschen.hidden = true; }
    const sortierung = id('sortierung');
    if (sortierung) { sortierung.value = 'datum-neu'; }
    rendereBeitraege();
  }

  function mehrLaden() {
    const raster = id('artikelraster');
    if (!raster) { return; }
    const vorher = Math.min(zustand.sichtbar, ermittleTreffer().length);
    zustand.sichtbar += NACHLADE_SCHRITT;
    rendereBeitraege();

    const karten = raster.children;
    const jetzt = karten.length;
    const dazu = jetzt - vorher;
    if (dazu > 0) {
      const neueKarte = karten[vorher];
      if (neueKarte) {
        const ziel = neueKarte.querySelector('[data-aktion="lesemodus-oeffnen"]');
        if (ziel) { ziel.focus(); }
      }
      const gesamt = ermittleTreffer().length;
      seitenStatus(dazu + (dazu === 1 ? ' weiterer Beitrag geladen. ' : ' weitere Beiträge geladen. ') +
        jetzt + ' von ' + gesamt + ' werden angezeigt.');
    }
  }

  /* ============================================================
     7 · KUENSTLERRASTER (Bauplan 2.5)
     ============================================================ */

  function bezuegeNachRubrik(kuenstlerEintrag) {
    const zaehlung = [];
    (kuenstlerEintrag.beitraege || []).forEach(function (artikelId) {
      const artikel = artikelNachId[artikelId];
      if (!artikel) { return; }
      const vorhanden = zaehlung.filter(function (posten) {
        return posten.rubrikId === artikel.rubrikId;
      })[0];
      if (vorhanden) { vorhanden.anzahl += 1; }
      else { zaehlung.push({ rubrikId: artikel.rubrikId, anzahl: 1 }); }
    });
    return zaehlung;
  }

  function rendereKuenstler() {
    const raster = id('kuenstlerraster');
    if (!raster) { return; }
    leere(raster);

    daten.kuenstler.forEach(function (person) {
      const karte = neu('article', 'kuenstlerkarte');
      karte.setAttribute('data-kuenstler-id', person.id);

      const bild = neu('div', 'kuenstlerkarte__artwork');
      setzeArtwork(bild, function () {
        return grafik.portraet(person.artworkSeed, person.initialen, {
          streuung: person.farben ? person.farben.primaer : ''
        });
      });
      karte.appendChild(bild);

      const name = neu('h3', 'kuenstlerkarte__name');
      const knopf = neu('button', 'kuenstlerkarte__knopf', person.name);
      knopf.type = 'button';
      knopf.setAttribute('data-aktion', 'kuenstler-oeffnen');
      knopf.setAttribute('data-kuenstler-id', person.id);
      name.appendChild(knopf);
      karte.appendChild(name);

      karte.appendChild(neu('p', 'kuenstlerkarte__ort mono',
        person.ort + ' · seit ' + person.gegruendet));
      karte.appendChild(neu('p', 'kuenstlerkarte__genre', person.genre));

      const bezuege = bezuegeNachRubrik(person);
      if (bezuege.length) {
        const liste = neu('ul', 'kuenstlerkarte__bezuege');
        liste.setAttribute('aria-label', 'Beiträge zu dieser Band');
        bezuege.forEach(function (posten) {
          const punkt = neu('li', 'kuenstlerkarte__bezug');
          punkt.setAttribute('data-rubrik', posten.rubrikId);
          const feld = neu('span', 'kuenstlerkarte__feld');
          feld.setAttribute('aria-hidden', 'true');
          punkt.appendChild(feld);
          punkt.appendChild(neu('span', 'mono', posten.anzahl));
          punkt.appendChild(neu('span', 'sr-only', rubrikLabel(posten.rubrikId)));
          liste.appendChild(punkt);
        });
        karte.appendChild(liste);
      }

      raster.appendChild(karte);
    });
  }

  /* ============================================================
     8 · PLAYLIST (Bauplan 2.6, V34–V38)
     ============================================================ */

  const playlistZeilen = Object.create(null);

  function renderePlaylist() {
    const liste = id('playlistliste');
    if (!liste || !daten.playlist) { return; }
    leere(liste);

    const eintraege = daten.playlist.eintraege || [];
    eintraege.forEach(function (eintrag, stelle) {
      const zeile = neu('li', 'playlistzeile');
      zeile.setAttribute('data-track-id', eintrag.id);
      zeile.setAttribute('data-rubrik', eintrag.rubrikId);

      const marke = neu('span', 'playlistzeile__marke');
      marke.setAttribute('aria-hidden', 'true');
      setzeArtwork(marke, function () {
        return grafik.rillenmarke(eintrag.artworkSeed, eintrag.rubrikId, 28);
      });
      zeile.appendChild(marke);

      const nummer = stelle + 1;
      zeile.appendChild(neu('span', 'playlistzeile__nummer mono',
        (nummer < 10 ? '0' : '') + nummer));

      const werk = neu('span', 'playlistzeile__werk');
      werk.appendChild(neu('span', 'playlistzeile__titel', eintrag.titel));
      werk.appendChild(neu('span', 'playlistzeile__interpret', eintrag.interpret));
      zeile.appendChild(werk);

      zeile.appendChild(neu('span', 'playlistzeile__label mono', eintrag.label));

      const rubrik = neu('span', 'playlistzeile__rubrik mono', rubrikLabel(eintrag.rubrikId));
      rubrik.setAttribute('data-rubrik', eintrag.rubrikId);
      zeile.appendChild(rubrik);

      zeile.appendChild(neu('span', 'playlistzeile__laenge mono', eintrag.laenge));

      const kommentarId = 'track-' + eintrag.id + '-kommentar';
      const knopf = neu('button', 'playlistzeile__knopf');
      knopf.type = 'button';
      knopf.setAttribute('data-aktion', 'track-abspielen');
      knopf.setAttribute('data-track-id', eintrag.id);
      knopf.setAttribute('aria-pressed', 'false');
      knopf.setAttribute('aria-describedby', kommentarId);
      knopf.appendChild(neu('span', 'sr-only',
        guillemets(eintrag.titel) + ' von ' + eintrag.interpret + ' mitlaufen lassen'));
      zeile.appendChild(knopf);

      const laufzeit = neu('span', 'playlistzeile__laufzeit mono');
      laufzeit.setAttribute('aria-hidden', 'true');
      zeile.appendChild(laufzeit);

      const fortschritt = neu('span', 'playlistzeile__fortschritt');
      fortschritt.setAttribute('aria-hidden', 'true');
      const balken = neu('span');
      balken.style.transform = 'scaleX(0)';
      fortschritt.appendChild(balken);
      zeile.appendChild(fortschritt);

      const kommentar = neu('p', 'playlistzeile__kommentar', eintrag.kommentar);
      kommentar.id = kommentarId;
      zeile.appendChild(kommentar);

      liste.appendChild(zeile);

      playlistZeilen[eintrag.id] = {
        eintrag: eintrag,
        zeile: zeile,
        knopf: knopf,
        laufzeit: laufzeit,
        balken: balken,
        marke: marke
      };
    });

    renderePlaylistStand(eintraege);
  }

  function renderePlaylistStand(eintraege) {
    const stand = id('playlist-stand');
    if (!stand) { return; }
    const sekunden = eintraege.reduce(function (summe, eintrag) {
      return summe + (Number(eintrag.sekunden) || 0);
    }, 0);
    const minutenGesamt = Math.round(sekunden / 60);
    const stunden = Math.floor(minutenGesamt / 60);
    const minuten = minutenGesamt % 60;
    const dauer = stunden > 0
      ? stunden + ' Std. ' + minuten + ' Min.'
      : minuten + ' Min.';
    const stueck = eintraege.length === 1 ? ' Stück' : ' Stücke';
    stand.textContent = eintraege.length + stueck + ' · ' + dauer +
      ' · Stand ' + formatiereDatum(daten.playlist.stand);
  }

  function stoppeTrack(ansagen) {
    const laufend = zustand.laufenderTrack;
    if (zeitgeber.playlist) {
      window.clearInterval(zeitgeber.playlist);
      zeitgeber.playlist = 0;
    }
    zustand.laufenderTrack = null;
    if (!laufend) { return; }
    const posten = playlistZeilen[laufend];
    if (posten) {
      posten.zeile.classList.remove('playlistzeile--laeuft');
      posten.knopf.setAttribute('aria-pressed', 'false');
      posten.laufzeit.textContent = '';
      posten.balken.style.transform = 'scaleX(0)';
      const svg = posten.marke.firstElementChild;
      if (svg) { svg.style.transform = ''; }
    }
    if (ansagen) { seitenStatus('Anzeige gestoppt.'); }
  }

  function starteTrack(trackId) {
    const posten = playlistZeilen[trackId];
    if (!posten) { return; }
    if (zustand.laufenderTrack === trackId) {
      stoppeTrack(true);
      return;
    }
    stoppeTrack(false);

    zustand.laufenderTrack = trackId;
    posten.zeile.classList.add('playlistzeile--laeuft');
    posten.knopf.setAttribute('aria-pressed', 'true');
    posten.laufzeit.textContent = zeitAusSekunden(0);
    posten.balken.style.transform = 'scaleX(0)';
    seitenStatus(guillemets(posten.eintrag.titel) + ' von ' + posten.eintrag.interpret +
      ' läuft mit – ohne Ton, nur als Anzeige.');

    let vergangen = 0;
    const gesamt = Number(posten.eintrag.sekunden) || 1;

    zeitgeber.playlist = window.setInterval(function () {
      vergangen += TEMPO_FAKTOR;
      const fertig = vergangen >= gesamt;
      if (fertig) { vergangen = gesamt; }

      const anteil = Math.min(1, vergangen / gesamt);
      posten.laufzeit.textContent = zeitAusSekunden(vergangen);

      if (reduziert()) {
        posten.balken.style.transform = 'scaleX(' + (Math.floor(anteil * 10) / 10) + ')';
      } else {
        posten.balken.style.transform = 'scaleX(' + anteil + ')';
        const svg = posten.marke.firstElementChild;
        if (svg) {
          svg.style.transform = 'rotate(' + (Math.floor(anteil * 12) * 30) + 'deg)';
        }
      }

      if (fertig) { stoppeTrack(true); }
    }, 1000);
  }

  /* ============================================================
     9 · OVERLAYS (Bauplan 2.9, V20–V30, 7.2)
     ============================================================ */

  const FOKUSSIERBAR = 'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function panelVon(dialogName) {
    const inhalt = id(dialogName === 'lesemodus' ? 'lesemodus-inhalt' : 'kuenstlerblatt-inhalt');
    return inhalt ? inhalt.parentElement : null;
  }

  function fokusliste(panel) {
    if (!panel) { return []; }
    return Array.prototype.filter.call(panel.querySelectorAll(FOKUSSIERBAR), function (knoten) {
      if (knoten.hidden || knoten.getAttribute('aria-hidden') === 'true') { return false; }
      return !!(knoten.offsetWidth || knoten.offsetHeight || knoten.getClientRects().length);
    });
  }

  function stillegen(knoten, ja) {
    if (!knoten) { return; }
    if (ja) {
      knoten.setAttribute('inert', '');
      knoten.setAttribute('aria-hidden', 'true');
      if ('inert' in knoten) { knoten.inert = true; }
    } else {
      if ('inert' in knoten) { knoten.inert = false; }
      knoten.removeAttribute('inert');
      knoten.removeAttribute('aria-hidden');
    }
  }

  function hintergrundStillegen(ja) {
    ['kopf', 'inhalt', 'fuss'].forEach(function (name) { stillegen(id(name), ja); });
    if (ja) {
      scrollGemerkt = window.pageYOffset || document.documentElement.scrollTop || 0;
      document.body.classList.add('body--fixiert');
    } else {
      document.body.classList.remove('body--fixiert');
      window.scrollTo(0, scrollGemerkt);
    }
  }

  function oeffneOverlay(dialogName, ausloeser) {
    const overlay = id(dialogName);
    if (!overlay) { return; }

    const vorher = zustand.offenerDialog;
    const alterFokus = zustand.letzterFokus;
    if (vorher) { schliesseOverlay(false); }

    overlay.hidden = false;
    overlay.classList.add('overlay--offen');
    if (!vorher) { hintergrundStillegen(true); }

    zustand.offenerDialog = dialogName;
    // V30: Beim Sprung von einem Dialog in den anderen bleibt der urspruengliche
    // Ausloeser das Ziel der Fokusrueckgabe.
    zustand.letzterFokus = vorher ? alterFokus : (ausloeser || document.activeElement);

    const inhalt = id(dialogName === 'lesemodus' ? 'lesemodus-inhalt' : 'kuenstlerblatt-inhalt');
    if (inhalt) {
      /* Ohne preventScroll rollt der Browser den Inhalt buendig an den oberen
         Rand des Panels - die klebende Leiste deckt dann die ersten Zeilen der
         Ueberschrift zu (bei 360 px rund 68 px). Erst ohne Scrollen
         fokussieren, dann das Panel selbst an den Anfang setzen. */
      try { inhalt.focus({ preventScroll: true }); }
      catch (fehler) { inhalt.focus(); }
      const panel = inhalt.closest('.overlay__panel');
      if (panel) { panel.scrollTop = 0; }
    }
  }

  function schliesseOverlay(fokusZurueck) {
    const dialogName = zustand.offenerDialog;
    if (!dialogName) { return; }
    const overlay = id(dialogName);
    if (overlay) {
      overlay.classList.remove('overlay--offen');
      overlay.hidden = true;
    }
    zustand.offenerDialog = null;

    if (fokusZurueck === false) { return; }

    hintergrundStillegen(false);
    const ziel = zustand.letzterFokus;
    zustand.letzterFokus = null;
    if (ziel && document.contains(ziel) && typeof ziel.focus === 'function') {
      ziel.focus();
    }
  }

  function fangeFokus(ereignis) {
    if (!zustand.offenerDialog) { return; }
    const panel = panelVon(zustand.offenerDialog);
    const liste = fokusliste(panel);
    if (!liste.length) {
      ereignis.preventDefault();
      return;
    }
    const aktiv = document.activeElement;
    const stelle = liste.indexOf(aktiv);
    if (stelle === -1) {
      ereignis.preventDefault();
      liste[ereignis.shiftKey ? liste.length - 1 : 0].focus();
      return;
    }
    if (ereignis.shiftKey && stelle === 0) {
      ereignis.preventDefault();
      liste[liste.length - 1].focus();
    } else if (!ereignis.shiftKey && stelle === liste.length - 1) {
      ereignis.preventDefault();
      liste[0].focus();
    }
  }

  /* --- Lesemodus --- */

  function leseGroesse() {
    const gespeichert = liesText(SCHLUESSEL.lesegroesse);
    return (gespeichert === 's' || gespeichert === 'm' || gespeichert === 'l') ? gespeichert : 'm';
  }

  function setzeLeseGroesse(groesse, speichern) {
    const wert = (groesse === 's' || groesse === 'l') ? groesse : 'm';
    const panel = panelVon('lesemodus');
    if (panel) { panel.setAttribute('data-schriftgroesse', wert); }
    const overlay = id('lesemodus');
    if (overlay) {
      const knoepfe = overlay.querySelectorAll('[data-aktion="schriftgroesse"]');
      Array.prototype.forEach.call(knoepfe, function (knopf) {
        knopf.setAttribute('aria-pressed',
          knopf.getAttribute('data-groesse') === wert ? 'true' : 'false');
      });
    }
    if (speichern) { schreib(SCHLUESSEL.lesegroesse, wert); }
  }

  /* V27: „RILLE:“ am Absatzanfang und ein Sprecherkuerzel im Muster
     „ – Nachname:“ werden fett gesetzt, sonst nichts. */
  function absatzInhalt(text) {
    const bruch = document.createDocumentFragment();
    let rest = String(text || '');

    if (rest.indexOf('RILLE:') === 0) {
      bruch.appendChild(neu('b', null, 'RILLE:'));
      rest = rest.slice('RILLE:'.length);
    }

    const muster = /–\s([\p{Lu}][\p{L}]{0,30}):/u;
    let treffer = muster.exec(rest);
    let schutz = 0;
    while (treffer && schutz < 12) {
      const vorne = rest.slice(0, treffer.index + 2);
      bruch.appendChild(document.createTextNode(vorne));
      bruch.appendChild(neu('b', null, treffer[1] + ':'));
      rest = rest.slice(treffer.index + treffer[0].length);
      treffer = muster.exec(rest);
      schutz += 1;
    }

    bruch.appendChild(document.createTextNode(rest));
    return bruch;
  }

  function rendereLesemodus(artikel) {
    const inhalt = id('lesemodus-inhalt');
    if (!inhalt) { return; }
    leere(inhalt);

    const rubrik = id('lesemodus-rubrik');
    if (rubrik) {
      rubrik.textContent = artikel.rubrikLabel;
      rubrik.setAttribute('data-rubrik', artikel.rubrikId);
    }
    const balken = id('lesemodus-balken');
    if (balken) { balken.style.transform = 'scaleX(0)'; }

    inhalt.appendChild(neu('p', 'lesemodus__dachzeile', artikel.dachzeile));

    const titel = neu('h2', 'lesemodus__titel', artikel.titel);
    titel.id = 'lesemodus-titel';
    inhalt.appendChild(titel);

    const rolle = artikel.autor.rolle ? ', ' + artikel.autor.rolle : '';
    inhalt.appendChild(neu('p', 'lesemodus__meta mono',
      artikel.autor.name + rolle + ' · ' + formatiereDatum(artikel.datum) +
      ' · ' + artikel.lesezeit + ' Min. Lesezeit'));

    const text = neu('div', 'lesemodus__text');
    (artikel.fliesstext || []).forEach(function (absatz, stelle) {
      const p = neu('p', stelle === 0
        ? 'lesemodus__absatz lesemodus__absatz--erster'
        : 'lesemodus__absatz');
      p.appendChild(absatzInhalt(absatz));
      text.appendChild(p);

      if (stelle === 1 && artikel.kickerZitat) {
        const zitat = neu('blockquote', 'pullquote');
        zitat.appendChild(neu('p', null, '»' + artikel.kickerZitat + '«'));
        text.appendChild(zitat);
      }
    });
    inhalt.appendChild(text);

    if (artikel.tags && artikel.tags.length) {
      const tags = neu('ul', 'taglist');
      tags.setAttribute('aria-label', 'Schlagwörter');
      artikel.tags.forEach(function (tag) {
        tags.appendChild(neu('li', 'taglist__tag mono', tag));
      });
      inhalt.appendChild(tags);
    }
  }

  function oeffneLesemodus(artikelId, ausloeser) {
    const artikel = artikelNachId[artikelId];
    if (!artikel) { return; }
    rendereLesemodus(artikel);
    setzeLeseGroesse(leseGroesse(), false);
    oeffneOverlay('lesemodus', ausloeser);
    aktualisiereLesefortschritt();
  }

  function aktualisiereLesefortschritt() {
    const balken = id('lesemodus-balken');
    if (!balken || zustand.offenerDialog !== 'lesemodus') { return; }
    const panel = panelVon('lesemodus');
    const inhalt = id('lesemodus-inhalt');
    let quelle = null;
    if (panel && panel.scrollHeight - panel.clientHeight > 2) { quelle = panel; }
    else if (inhalt && inhalt.scrollHeight - inhalt.clientHeight > 2) { quelle = inhalt; }

    let anteil = 1;
    if (quelle) {
      const spanne = quelle.scrollHeight - quelle.clientHeight;
      anteil = spanne > 0 ? Math.min(1, Math.max(0, quelle.scrollTop / spanne)) : 1;
    }
    balken.style.transform = 'scaleX(' + anteil + ')';
  }

  function planeLesefortschritt() {
    if (zeitgeber.fortschritt) { return; }
    zeitgeber.fortschritt = 1;
    naechsterRahmen(function () {
      zeitgeber.fortschritt = 0;
      aktualisiereLesefortschritt();
    });
  }

  /* --- Kuenstlerblatt --- */

  function rendereKuenstlerblatt(person) {
    const inhalt = id('kuenstlerblatt-inhalt');
    if (!inhalt) { return; }
    leere(inhalt);

    const kopf = neu('div', 'kuenstlerblatt__kopf');
    const bild = neu('div', 'kuenstlerblatt__artwork');
    setzeArtwork(bild, function () {
      return grafik.portraet(person.artworkSeed, person.initialen, {
        label: 'Generiertes Zweifarben-Porträt von ' + person.name,
        streuung: person.farben ? person.farben.primaer : ''
      });
    });
    kopf.appendChild(bild);

    const titelblock = neu('div', 'kuenstlerblatt__titelblock');
    const name = neu('h2', 'kuenstlerblatt__name', person.name);
    name.id = 'kuenstlerblatt-titel';
    titelblock.appendChild(name);

    const steckbrief = neu('dl', 'steckbrief mono');
    [
      ['Ort', person.ort],
      ['Genre', person.genre],
      ['Besetzung', person.besetzung],
      ['Gegründet', person.gegruendet]
    ].forEach(function (paar) {
      if (paar[1] === undefined || paar[1] === null || paar[1] === '') { return; }
      const zeile = neu('div', 'steckbrief__paar');
      zeile.appendChild(neu('dt', null, paar[0]));
      zeile.appendChild(neu('dd', null, paar[1]));
      steckbrief.appendChild(zeile);
    });
    titelblock.appendChild(steckbrief);
    kopf.appendChild(titelblock);
    inhalt.appendChild(kopf);

    const satz = neu('div', 'kuenstlerblatt__satz');
    const flies = neu('div', 'kuenstlerblatt__text');
    (person.portraet || []).forEach(function (absatz) {
      flies.appendChild(neu('p', null, absatz));
    });
    satz.appendChild(flies);

    const rand = neu('aside', 'marginalie');

    if (person.zitat && person.zitat.text) {
      const zitat = neu('blockquote', 'marginalie__zitat');
      zitat.appendChild(neu('p', null, '»' + person.zitat.text + '«'));
      if (person.zitat.quelle) {
        zitat.appendChild(neu('footer', null, person.zitat.quelle));
      }
      rand.appendChild(zitat);
    }

    if (person.releases && person.releases.length) {
      const block = neu('div', 'marginalie__block');
      block.appendChild(neu('h3', 'marginalie__kopf', 'Diskografie'));
      const liste = neu('ul', 'diskografie mono');
      person.releases.forEach(function (release) {
        const punkt = neu('li');
        punkt.appendChild(neu('span', 'diskografie__jahr', release.jahr));
        punkt.appendChild(document.createTextNode(' '));
        punkt.appendChild(neu('span', 'diskografie__titel', release.titel));
        punkt.appendChild(document.createTextNode(' '));
        punkt.appendChild(neu('span', 'diskografie__format',
          release.format + ', ' + release.label));
        liste.appendChild(punkt);
      });
      block.appendChild(liste);
      rand.appendChild(block);
    }

    if (person.trackDesMonats && person.trackDesMonats.titel) {
      const block = neu('div', 'marginalie__block');
      block.appendChild(neu('h3', 'marginalie__kopf', 'Track des Monats'));
      block.appendChild(neu('p', 'marginalie__text',
        guillemets(person.trackDesMonats.titel) + ' · ' + person.trackDesMonats.laenge +
        ' – ' + person.trackDesMonats.beschreibung));
      rand.appendChild(block);
    }

    if (person.hoerempfehlung) {
      const block = neu('div', 'marginalie__block');
      block.appendChild(neu('h3', 'marginalie__kopf', 'Hörempfehlung'));
      block.appendChild(neu('p', 'marginalie__text', person.hoerempfehlung));
      rand.appendChild(block);
    }

    satz.appendChild(rand);
    inhalt.appendChild(satz);

    const verknuepft = (person.beitraege || []).map(function (artikelId) {
      return artikelNachId[artikelId];
    }).filter(Boolean);

    if (verknuepft.length) {
      const bezuege = neu('div', 'kuenstlerblatt__bezuege');
      bezuege.appendChild(neu('h3', null, 'Dazu im Magazin'));
      const raster = neu('div', 'artikelraster');
      verknuepft.forEach(function (artikel) {
        raster.appendChild(baueArtikelkarte(artikel, 'kompakt', []));
      });
      bezuege.appendChild(raster);
      inhalt.appendChild(bezuege);
    }

    const zurueck = neu('button', 'knopf knopf--geist kuenstlerblatt__zurueck',
      '← Zurück zum Magazin');
    zurueck.type = 'button';
    zurueck.setAttribute('data-aktion', 'overlay-schliessen');
    inhalt.appendChild(zurueck);
  }

  function oeffneKuenstlerblatt(kuenstlerId, ausloeser) {
    const person = daten.kuenstler.filter(function (eintrag) {
      return eintrag.id === kuenstlerId;
    })[0];
    if (!person) { return; }
    rendereKuenstlerblatt(person);
    oeffneOverlay('kuenstlerblatt', ausloeser);
  }

  /* ============================================================
     10 · KOPFZEILE UND FUSSZEILE
     ============================================================ */

  function menuUmschalten(erzwungen) {
    const knopf = id('menuknopf');
    if (!knopf) { return; }
    const offen = knopf.getAttribute('aria-expanded') === 'true';
    const ziel = (erzwungen === undefined) ? !offen : !!erzwungen;
    knopf.setAttribute('aria-expanded', ziel ? 'true' : 'false');
  }

  function beobachteKopfzeile() {
    const kopf = id('kopf');
    if (!kopf) { return; }
    let geplant = false;
    function pruefe() {
      geplant = false;
      const oben = window.pageYOffset || document.documentElement.scrollTop || 0;
      kopf.classList.toggle('kopfzeile--kompakt', oben >= 120);
    }
    window.addEventListener('scroll', function () {
      if (geplant) { return; }
      geplant = true;
      naechsterRahmen(pruefe);
    }, { passive: true });
    pruefe();
  }

  function setzeFusszeilenjahr() {
    const jahr = id('fuss-jahr');
    if (jahr && daten.magazin && daten.magazin.jahr) {
      jahr.textContent = String(daten.magazin.jahr);
    }
  }

  function springeZuBeitraegen() {
    const bereich = id('beitraege');
    const titel = id('beitraege-titel');
    if (bereich) {
      try {
        bereich.scrollIntoView({ block: 'start', behavior: scrollArt() });
      } catch (fehler) {
        bereich.scrollIntoView();
      }
    }
    if (titel) {
      titel.setAttribute('tabindex', '-1');
      titel.focus();
    }
  }

  /* ============================================================
     11 · ABO-FORMULAR (abo-formular.md vollstaendig)
     ============================================================ */

  const RE_NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.\-]{0,59}$/u;
  const RE_EMAIL = /^[^\s@<>,;]{1,64}@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+\p{L}{2,24}$/u;

  const EMAIL_TIPPFEHLER = {
    'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.con': 'gmail.com',
    'gmail.de': 'gmail.com', 'gmx.d': 'gmx.de', 'gmx.ne': 'gmx.de', 'web.d': 'web.de',
    'hotmai.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'posteo.d': 'posteo.de'
  };

  const ABO = {
    zustand: 'ruhe',       // 'ruhe' | 'sendet' | 'erfolg' | 'bekannt'
    absendeVersuch: false,
    sendetGerade: false,
    gerendert: Date.now(),
    felder: new Map(),
    emailVorschlag: null,
    letzteEingabe: null,
    bekannterEintrag: null,
    zaehlerSchwelle: null,
    adresseOffen: false,
    letzteFehlerzahl: 0,
    speicherOk: null
  };

  const ABO_BESCHREIBUNG = [
    { name: 'vorname', label: 'Vorname', gruppe: false },
    { name: 'nachname', label: 'Nachname', gruppe: false },
    { name: 'email', label: 'E-Mail-Adresse', gruppe: false },
    { name: 'tarif', label: 'Tarif', gruppe: true },
    { name: 'intervall', label: 'Versandintervall', gruppe: true },
    { name: 'interessen', label: 'Interessen', gruppe: true },
    { name: 'strasse', label: 'Straße und Hausnummer', gruppe: false, adresse: true },
    { name: 'plz', label: 'Postleitzahl', gruppe: false, adresse: true },
    { name: 'ort', label: 'Ort', gruppe: false, adresse: true },
    { name: 'einwilligung', label: 'Einwilligung', gruppe: false, kontrolle: true }
  ];

  function aboFormular() {
    return id('abo-formular');
  }

  function landDaten(code) {
    const liste = (daten.abo && daten.abo.laender) ? daten.abo.laender : [];
    return liste.filter(function (land) { return land.code === code; })[0] || liste[0] || null;
  }

  function aktuellesLand() {
    const feld = id('abo-land');
    return landDaten(feld ? feld.value : 'DE');
  }

  /* --- Rendern der datengetriebenen Formularteile (V39) --- */

  function rendereTarifkarten() {
    const ziel = id('abo-tarife');
    if (!ziel || !daten.abo) { return; }
    leere(ziel);

    daten.abo.tarife.forEach(function (tarif) {
      const karte = neu('article', 'tarif-karte' +
        (tarif.empfehlung ? ' tarif-karte--empfehlung' : ''));
      karte.setAttribute('data-tarif', tarif.id);

      if (tarif.badge) {
        karte.appendChild(neu('p', 'tarif-karte__badge', tarif.badge));
      }

      if (grafik && typeof grafik.tarifmarke === 'function') {
        const marke = neu('div', 'tarif-karte__marke');
        marke.setAttribute('aria-hidden', 'true');
        setzeArtwork(marke, function () { return grafik.tarifmarke(tarif.id, 96); });
        karte.appendChild(marke);
      }

      karte.appendChild(neu('h3', 'tarif-karte__name', tarif.name));
      karte.appendChild(neu('p', 'tarif-karte__preis mono',
        formatierePreis(tarif.preisMonat) + ' im Monat · ' +
        formatierePreis(tarif.preisJahr) + ' im Jahr'));
      karte.appendChild(neu('p', 'tarif-karte__satz', tarif.positionierung));

      const liste = neu('ul', 'tarif-karte__leistungen');
      (tarif.leistungen || []).forEach(function (leistung) {
        liste.appendChild(neu('li', null, leistung));
      });
      karte.appendChild(liste);

      if (tarif.badgeGrund) {
        karte.appendChild(neu('p', 'tarif-karte__grund', tarif.badgeGrund));
      }

      ziel.appendChild(karte);
    });
  }

  function rendereTarifWahl() {
    const ziel = id('abo-tarif-liste');
    if (!ziel || !daten.abo) { return; }
    leere(ziel);

    daten.abo.tarife.forEach(function (tarif) {
      const karte = neu('div', 'tarif-karte' +
        (tarif.empfehlung ? ' tarif-karte--empfehlung' : ''));
      karte.setAttribute('data-tarif', tarif.id);

      const leistungenId = 'abo-tarif-' + tarif.id + '-leistungen';
      const feld = document.createElement('input');
      feld.type = 'radio';
      feld.id = 'abo-tarif-' + tarif.id;
      feld.name = 'tarif';
      feld.value = tarif.id;
      feld.required = true;
      feld.className = 'sr-only';
      feld.setAttribute('aria-describedby', leistungenId + ' abo-tarif-hilfe');
      karte.appendChild(feld);

      const beschriftung = document.createElement('label');
      beschriftung.setAttribute('for', feld.id);
      beschriftung.appendChild(neu('span', 'tarif-karte__name', tarif.name));
      beschriftung.appendChild(neu('span', 'tarif-karte__preis mono',
        formatierePreis(tarif.preisMonat) + ' im Monat · ' +
        formatierePreis(tarif.preisJahr) + ' im Jahr'));
      if (tarif.badge) {
        beschriftung.appendChild(neu('span', 'tarif-karte__badge', tarif.badge));
      }
      karte.appendChild(beschriftung);

      karte.appendChild(neu('p', 'tarif-karte__satz', tarif.positionierung));

      const liste = neu('ul', 'tarif-karte__leistungen');
      liste.id = leistungenId;
      (tarif.leistungen || []).forEach(function (leistung) {
        liste.appendChild(neu('li', null, leistung));
      });
      karte.appendChild(liste);

      ziel.appendChild(karte);
    });
  }

  function rendereIntervalle() {
    const ziel = id('abo-intervall-liste');
    if (!ziel || !daten.abo) { return; }
    leere(ziel);

    daten.abo.intervalle.forEach(function (intervall) {
      const zeile = neu('div', 'wahlliste__eintrag');
      const hilfeId = 'abo-intervall-' + intervall.id + '-hilfe';

      const feld = document.createElement('input');
      feld.type = 'radio';
      feld.id = 'abo-intervall-' + intervall.id;
      feld.name = 'intervall';
      feld.value = intervall.id;
      feld.required = true;
      // Als Attribut, damit form.reset() die Vorauswahl wiederherstellt.
      if (intervall.standard) { feld.setAttribute('checked', ''); }
      feld.setAttribute('aria-describedby', hilfeId);

      const beschriftung = document.createElement('label');
      beschriftung.className = 'wahlliste__label';
      beschriftung.setAttribute('for', feld.id);
      beschriftung.textContent = intervall.label;

      const hilfe = neu('p', 'feld-hilfe', intervall.hilfe);
      hilfe.id = hilfeId;

      zeile.appendChild(feld);
      zeile.appendChild(beschriftung);
      zeile.appendChild(hilfe);
      ziel.appendChild(zeile);
    });
  }

  function rendereInteressen() {
    const ziel = id('abo-interessen-liste');
    if (!ziel) { return; }
    leere(ziel);

    const rubriken = (daten.rubriken && daten.rubriken.length)
      ? daten.rubriken
      : ((daten.abo && daten.abo.rubrikenFallback) || []);

    rubriken.forEach(function (rubrik) {
      const zeile = neu('div', 'wahlliste__eintrag');

      const feld = document.createElement('input');
      feld.type = 'checkbox';
      feld.id = 'abo-interesse-' + rubrik.id;
      feld.name = 'interessen';
      feld.value = rubrik.id;
      feld.setAttribute('aria-describedby', 'abo-interessen-hilfe');

      const beschriftung = document.createElement('label');
      beschriftung.className = 'wahlliste__label';
      beschriftung.setAttribute('for', feld.id);
      beschriftung.textContent = rubrik.label;

      zeile.appendChild(feld);
      zeile.appendChild(beschriftung);
      ziel.appendChild(zeile);
    });
  }

  /* --- Feldregister --- */

  function registriereFelder() {
    const form = aboFormular();
    if (!form) { return; }
    ABO.felder.clear();

    ABO_BESCHREIBUNG.forEach(function (beschreibung) {
      const knoten = Array.prototype.slice.call(
        form.querySelectorAll('[name="' + beschreibung.name + '"]'));
      if (!knoten.length) { return; }
      const wrapper = form.querySelector('[data-feld="' + beschreibung.name + '"]');
      const fehlerEl = id('abo-' + beschreibung.name + '-fehler');
      const basis = knoten.map(function (element) {
        return element.getAttribute('aria-describedby') || '';
      });
      ABO.felder.set(beschreibung.name, {
        name: beschreibung.name,
        label: beschreibung.label,
        gruppe: !!beschreibung.gruppe,
        adresse: !!beschreibung.adresse,
        kontrolle: !!beschreibung.kontrolle,
        els: knoten,
        basis: basis,
        wrapper: wrapper,
        fehlerEl: fehlerEl,
        beruehrt: false,
        fehler: null
      });
    });
  }

  function feld(name) {
    return ABO.felder.get(name) || null;
  }

  function feldWert(name) {
    const eintrag = feld(name);
    if (!eintrag) { return ''; }
    if (name === 'interessen') {
      return eintrag.els.filter(function (el) { return el.checked; })
        .map(function (el) { return el.value; });
    }
    if (eintrag.gruppe) {
      const gewaehlt = eintrag.els.filter(function (el) { return el.checked; })[0];
      return gewaehlt ? gewaehlt.value : '';
    }
    if (eintrag.kontrolle) { return eintrag.els[0].checked; }
    return eintrag.els[0].value;
  }

  function adressblockAktiv() {
    const block = id('abo-adresse');
    return !!(block && !block.hidden);
  }

  /* --- Beschreibungsketten (AF 5.2: Fehler-ID steht vorn) --- */

  function aktualisiereBeschreibung(eintrag) {
    if (!eintrag) { return; }
    const teile = [];
    if (eintrag.fehler) { teile.push('abo-' + eintrag.name + '-fehler'); }
    if (eintrag.name === 'email') {
      const notiz = id('abo-email-notiz');
      if (notiz && !notiz.hidden) { teile.push('abo-email-notiz'); }
    }
    eintrag.els.forEach(function (element, stelle) {
      const kette = teile.concat((eintrag.basis[stelle] || '').split(/\s+/))
        .filter(function (wert) { return wert.length > 0; });
      const einmalig = [];
      kette.forEach(function (wert) {
        if (einmalig.indexOf(wert) === -1) { einmalig.push(wert); }
      });
      if (einmalig.length) { element.setAttribute('aria-describedby', einmalig.join(' ')); }
      else { element.removeAttribute('aria-describedby'); }
    });
  }

  function zeigeFehler(name, text) {
    const eintrag = feld(name);
    if (!eintrag) { return; }
    eintrag.fehler = text;

    if (eintrag.fehlerEl) {
      leere(eintrag.fehlerEl);
      const zeichen = symbolIn(eintrag.fehlerEl, 'warnung', 16);
      if (zeichen) {
        const vorhanden = zeichen.getAttribute('class') || '';
        zeichen.setAttribute('class', (vorhanden + ' feld-fehler__zeichen').trim());
      }
      eintrag.fehlerEl.appendChild(document.createTextNode(text));
      eintrag.fehlerEl.hidden = false;
    }
    if (eintrag.wrapper) { eintrag.wrapper.classList.add('feld--fehler'); }
    eintrag.els.forEach(function (element) { element.setAttribute('aria-invalid', 'true'); });
    aktualisiereBeschreibung(eintrag);
  }

  function loescheFehler(name) {
    const eintrag = feld(name);
    if (!eintrag) { return; }
    eintrag.fehler = null;
    if (eintrag.fehlerEl) {
      leere(eintrag.fehlerEl);
      eintrag.fehlerEl.hidden = true;
    }
    if (eintrag.wrapper) { eintrag.wrapper.classList.remove('feld--fehler'); }
    eintrag.els.forEach(function (element) { element.removeAttribute('aria-invalid'); });
    aktualisiereBeschreibung(eintrag);
  }

  /* --- Regeln (AF 3.1–3.9) --- */

  function pruefeName(wert, istVorname) {
    const rein = String(wert || '').trim();
    if (!rein) {
      return istVorname
        ? 'Wie sollen wir dich anreden? Bitte trag deinen Vornamen ein.'
        : 'Bitte trag noch deinen Nachnamen ein.';
    }
    if (rein.length > 60) {
      return 'Das sind mehr als 60 Zeichen. Kürz bitte auf den Namen, der auf dem Briefkasten steht.';
    }
    if (rein.length < 2) {
      return 'Ein Buchstabe ist uns zu wenig – bitte schreib den Namen aus.';
    }
    if (!RE_NAME.test(rein)) {
      return 'In einem Namen erwarten wir Buchstaben, Bindestriche und Apostrophe – ' +
        'Ziffern und Sonderzeichen bitte weglassen.';
    }
    return null;
  }

  function emailBereinigt(wert) {
    return String(wert || '').trim().replace(/^</, '').replace(/>$/, '');
  }

  function pruefeEmail(wert) {
    const rein = emailBereinigt(wert);
    if (!rein) { return 'Ohne E-Mail-Adresse kommt kein Newsletter an. Bitte trag sie ein.'; }
    if (rein.length > 254) { return 'Das ist länger als jede echte E-Mail-Adresse. Bitte prüf die Eingabe.'; }
    if (/\s/.test(rein)) {
      return 'In einer E-Mail-Adresse steht kein Leerzeichen. Bitte prüf die Eingabe noch einmal.';
    }
    if (rein.indexOf('@') === -1) {
      return 'Da fehlt das @ – eine Adresse sieht aus wie du@beispiel.de.';
    }
    const domain = rein.slice(rein.lastIndexOf('@') + 1);
    if (domain.indexOf('.') === -1) {
      return 'Nach dem @ fehlt noch der Punkt mit der Endung, zum Beispiel beispiel.de.';
    }
    if (!RE_EMAIL.test(rein)) {
      return 'Diese Adresse können wir nicht lesen. Ein Beispiel, das passt: du@beispiel.de.';
    }
    return null;
  }

  /* Länderkürzel schon beim Tippen entfernen: das Feld trägt die knappe
     maxlength aus den Daten (5 bzw. 4), „D-44137“ passt sonst nie hinein. */
  function plzVorspannWeg() {
    const element = id('abo-plz');
    const land = aktuellesLand();
    if (!element || !land || land.code === 'EU') { return; }
    const gekuerzt = element.value.replace(/^(D|A|CH)[- ]?(?=\d)/i, '');
    if (gekuerzt !== element.value) { element.value = gekuerzt; }
  }

  function plzBereinigen() {
    const element = id('abo-plz');
    if (!element) { return ''; }
    const land = aktuellesLand();
    let wert = String(element.value || '').trim().replace(/\s{2,}/g, ' ');
    if (land && land.code !== 'EU') {
      wert = wert.replace(/^(D|A|CH)[- ]?(?=\d)/i, '');
    }
    if (element.value !== wert) { element.value = wert; }
    return wert;
  }

  function pruefePlz(wert) {
    if (!wert) {
      return 'Ohne Postleitzahl bleibt das Heft in der Sortieranlage liegen. Bitte eintragen.';
    }
    const land = aktuellesLand();
    if (!land) { return null; }
    let regel = null;
    try {
      regel = new RegExp(land.muster, 'u');
    } catch (fehler) {
      regel = null;
    }
    if (regel && regel.test(wert)) { return null; }
    if (land.code === 'DE') {
      return 'Eine deutsche Postleitzahl hat fünf Ziffern, zum Beispiel 44137.';
    }
    if (land.code === 'AT') {
      return 'Eine österreichische Postleitzahl hat vier Ziffern, zum Beispiel 1050.';
    }
    if (land.code === 'CH') {
      return 'Eine Schweizer Postleitzahl hat vier Ziffern und beginnt nicht mit 0, zum Beispiel 8005.';
    }
    return 'Bitte trag die Postleitzahl so ein, wie sie auf deiner Post steht – 2 bis 10 Zeichen.';
  }

  function regelFuer(name, live) {
    if (name === 'vorname') { return pruefeName(feldWert('vorname'), true); }
    if (name === 'nachname') { return pruefeName(feldWert('nachname'), false); }
    if (name === 'email') { return pruefeEmail(feldWert('email')); }
    if (name === 'tarif') {
      return feldWert('tarif')
        ? null
        : 'Bitte wähl einen Tarif – drei Möglichkeiten, keine falsche darunter.';
    }
    if (name === 'intervall') {
      return feldWert('intervall') ? null : 'Wöchentlich oder monatlich? Bitte such dir eins aus.';
    }
    if (name === 'interessen') {
      return feldWert('interessen').length
        ? null
        : 'Kreuz bitte mindestens eine Rubrik an – sonst bliebe der Newsletter leer.';
    }
    if (name === 'strasse') {
      const rein = String(feldWert('strasse') || '').trim();
      if (!rein) {
        return 'Ohne Straße und Hausnummer findet das Heft dich nicht. Bitte beides eintragen.';
      }
      if (!/\p{L}/u.test(rein)) {
        return 'In der Zeile fehlt der Straßenname – bitte Straße und Hausnummer eintragen.';
      }
      if (rein.length < 3 || rein.length > 80) {
        return 'In der Zeile fehlt der Straßenname – bitte Straße und Hausnummer eintragen.';
      }
      return null;
    }
    if (name === 'plz') {
      // Beim Tippen wird der Wert nicht zurueckgeschrieben, sonst springt der Cursor.
      return pruefePlz(live ? String(feldWert('plz') || '').trim() : plzBereinigen());
    }
    if (name === 'ort') {
      const rein = String(feldWert('ort') || '').trim();
      if (!rein) { return 'Bitte trag noch den Ort ein.'; }
      if (rein.length < 2 || rein.length > 60 || !RE_NAME.test(rein)) {
        return 'Im Ortsnamen erwarten wir Buchstaben, Bindestriche und Leerzeichen.';
      }
      return null;
    }
    if (name === 'einwilligung') {
      return feldWert('einwilligung')
        ? null
        : 'Ohne dieses Häkchen dürfen wir dir nichts schicken. Setz es bitte, wenn du einverstanden bist.';
    }
    return null;
  }

  function feldAktiv(eintrag) {
    if (!eintrag) { return false; }
    if (eintrag.adresse && !adressblockAktiv()) { return false; }
    return true;
  }

  function pruefeFeld(name, optionen) {
    const eintrag = feld(name);
    if (!eintrag || !feldAktiv(eintrag)) { return null; }
    const live = !!(optionen && optionen.live);

    const ergebnis = regelFuer(name, live);

    if (!ergebnis) {
      if (eintrag.fehler) { loescheFehler(name); }
      return null;
    }
    // Live entsteht nie ein neuer Fehler – nur ein bestehender bleibt aktuell (AF 3.0).
    if (live && !eintrag.fehler) { return null; }
    zeigeFehler(name, ergebnis);
    return ergebnis;
  }

  function pruefeAlles() {
    const fehler = [];
    ABO_BESCHREIBUNG.forEach(function (beschreibung) {
      const eintrag = feld(beschreibung.name);
      if (!eintrag || !feldAktiv(eintrag)) { return; }
      const ergebnis = regelFuer(beschreibung.name, false);
      if (ergebnis) {
        zeigeFehler(beschreibung.name, ergebnis);
        fehler.push({ name: beschreibung.name, label: eintrag.label, text: ergebnis });
      } else if (eintrag.fehler) {
        loescheFehler(beschreibung.name);
      }
    });
    return fehler;
  }

  function offeneFehler() {
    const liste = [];
    ABO_BESCHREIBUNG.forEach(function (beschreibung) {
      const eintrag = feld(beschreibung.name);
      if (eintrag && feldAktiv(eintrag) && eintrag.fehler) {
        liste.push({ name: eintrag.name, label: eintrag.label, text: eintrag.fehler });
      }
    });
    return liste;
  }

  function rendereFehlerliste(fehler, fokussieren) {
    const kasten = id('abo-fehlerliste');
    if (!kasten) { return; }

    if (!fehler.length) {
      leere(kasten);
      kasten.hidden = true;
      ABO.letzteFehlerzahl = 0;
      return;
    }

    leere(kasten);
    kasten.appendChild(neu('h3', null, 'Da fehlt noch etwas'));

    const anzahl = fehler.length;
    const wort = zahlwort(anzahl, true);
    kasten.appendChild(neu('p', null, anzahl === 1
      ? 'Eine Angabe braucht noch deine Aufmerksamkeit, dann geht es weiter.'
      : wort + ' Angaben brauchen noch deine Aufmerksamkeit, dann geht es weiter.'));

    const liste = neu('ol');
    fehler.forEach(function (posten) {
      const punkt = neu('li');
      const link = neu('a', null, posten.label + ': ' + posten.text);
      const eintrag = feld(posten.name);
      const zielId = (eintrag && eintrag.els.length && eintrag.els[0].id)
        ? eintrag.els[0].id
        : 'abo-' + posten.name;
      link.setAttribute('href', '#' + zielId);
      link.setAttribute('data-aktion', 'abo-fehler-springen');
      link.setAttribute('data-feld', posten.name);
      punkt.appendChild(link);
      liste.appendChild(punkt);
    });
    kasten.appendChild(liste);

    kasten.hidden = false;
    ABO.letzteFehlerzahl = fehler.length;
    if (fokussieren) { kasten.focus(); }
  }

  /* Die sichtbare Zusammenfassung wird nachgefuehrt, ohne den Fokus zu bewegen;
     angesagt wird nur, wenn sich die Anzahl wirklich geaendert hat (AF 5.5). */
  function aktualisiereFehlerliste() {
    const kasten = id('abo-fehlerliste');
    if (!kasten || kasten.hidden) { return; }
    const vorher = ABO.letzteFehlerzahl;
    const fehler = offeneFehler();
    rendereFehlerliste(fehler, false);
    if (fehler.length === vorher) { return; }
    if (!fehler.length) {
      aboStatus('Alle Angaben sind jetzt vollständig.');
    } else {
      aboStatus('Noch ' + zahlwort(fehler.length, false) +
        (fehler.length === 1 ? ' Angabe fehlt.' : ' Angaben fehlen.'));
    }
  }

  function springeZuFeld(name) {
    const eintrag = feld(name);
    if (!eintrag || !eintrag.els.length) { return; }
    const ziel = eintrag.els[0];
    try {
      ziel.scrollIntoView({ block: 'center', behavior: scrollArt() });
    } catch (fehler) {
      ziel.scrollIntoView();
    }
    ziel.focus();
  }

  /* --- Adressblock (AF 4.7) --- */

  function aktualisiereAdressblock(tarifId, still) {
    const block = id('abo-adresse');
    if (!block) { return; }
    const tarif = (daten.abo.tarife || []).filter(function (eintrag) {
      return eintrag.id === tarifId;
    })[0];
    const braucht = !!(tarif && tarif.print);
    if (braucht === ABO.adresseOffen) { return; }
    ABO.adresseOffen = braucht;

    ['strasse', 'plz', 'ort'].forEach(function (name) {
      const eintrag = feld(name);
      if (!eintrag) { return; }
      eintrag.els.forEach(function (element) {
        if (braucht) { element.setAttribute('required', ''); }
        else { element.removeAttribute('required'); }
      });
      if (!braucht) {
        eintrag.beruehrt = false;
        loescheFehler(name);
      }
    });

    block.hidden = !braucht;
    block.disabled = !braucht;

    aktualisiereFehlerliste();
    if (!still) {
      aboStatus(braucht
        ? 'Der Print-Tarif braucht eine Lieferadresse – vier Felder sind dazugekommen.'
        : 'Für Rille Digital brauchen wir keine Adresse – die vier Felder sind wieder ausgeblendet.');
    }
  }

  /* --- PLZ folgt dem Land (V42) --- */

  function aktualisierePlzRegel() {
    const land = aktuellesLand();
    const element = id('abo-plz');
    const hilfe = id('abo-plz-hilfe');
    if (!land || !element) { return; }

    element.setAttribute('maxlength', String(land.maxlength));
    element.setAttribute('placeholder', land.platzhalter);
    if (land.inputmode) { element.setAttribute('inputmode', land.inputmode); }
    else { element.removeAttribute('inputmode'); }
    if (hilfe) { hilfe.textContent = land.hilfe; }

    const eintrag = feld('plz');
    if (eintrag && (eintrag.beruehrt || ABO.absendeVersuch) && feldAktiv(eintrag)) {
      pruefeFeld('plz');
      aktualisiereFehlerliste();
    }
  }

  /* --- Zeichenzaehler (AF 3.9) --- */

  function aktualisiereZeichenzaehler(mitAnsage, eingabeArt) {
    const element = id('abo-kommentar');
    const zaehler = id('abo-kommentar-zaehler');
    if (!element || !zaehler) { return; }

    const laenge = element.value.length;
    const rest = Math.max(0, KOMMENTAR_MAX - laenge);

    if (rest === 0) { zaehler.textContent = '0 Zeichen frei – mehr nimmt das Feld nicht.'; }
    else if (rest === 1) { zaehler.textContent = 'Noch 1 Zeichen'; }
    else { zaehler.textContent = 'Noch ' + rest + ' Zeichen'; }

    zaehler.classList.toggle('feld-zaehler--knapp', rest <= 30 && rest > 0);
    zaehler.classList.toggle('feld-zaehler--voll', rest === 0);

    let schwelle = null;
    if (rest <= 0) { schwelle = 0; }
    else if (rest <= 10) { schwelle = 10; }
    else if (rest <= 30) { schwelle = 30; }

    if (schwelle !== ABO.zaehlerSchwelle) {
      ABO.zaehlerSchwelle = schwelle;
      if (mitAnsage) {
        if (schwelle === null) { aboStatus(''); }
        else if (schwelle === 0) { aboStatus('Keine Zeichen mehr frei.'); }
        else { aboStatus('Noch ' + schwelle + ' Zeichen.'); }
      }
    }

    if (mitAnsage && eingabeArt === 'insertFromPaste' && laenge === KOMMENTAR_MAX) {
      aboStatus('Der eingefügte Text wurde auf 300 Zeichen gekürzt.');
    }
  }

  /* --- E-Mail-Notiz: Tippfehler-Vorschlag und Wiedererkennung (AF 3.2, 4.6) --- */

  function verbergeEmailNotiz() {
    const notiz = id('abo-email-notiz');
    if (!notiz || notiz.hidden) { return; }
    leere(notiz);
    notiz.hidden = true;
    ABO.emailVorschlag = null;
    aktualisiereBeschreibung(feld('email'));
  }

  function pruefeEmailNotiz() {
    const notiz = id('abo-email-notiz');
    const element = id('abo-email');
    if (!notiz || !element) { return; }

    const rein = emailBereinigt(element.value);
    if (!rein || rein.indexOf('@') === -1) { verbergeEmailNotiz(); return; }

    const domain = rein.slice(rein.lastIndexOf('@') + 1).toLowerCase();
    const vorschlagDomain = EMAIL_TIPPFEHLER[domain];

    leere(notiz);
    if (vorschlagDomain) {
      const vorschlag = rein.slice(0, rein.lastIndexOf('@') + 1) + vorschlagDomain;
      ABO.emailVorschlag = vorschlag;
      notiz.appendChild(document.createTextNode('Meintest du '));
      notiz.appendChild(neu('b', null, vorschlag));
      notiz.appendChild(document.createTextNode('? '));
      const knopf = neu('button', 'knopf knopf--geist', 'Ja, so ist es richtig');
      knopf.type = 'button';
      knopf.setAttribute('data-aktion', 'email-vorschlag-uebernehmen');
      notiz.appendChild(knopf);
      notiz.hidden = false;
      aktualisiereBeschreibung(feld('email'));
      return;
    }

    ABO.emailVorschlag = null;
    const bekannt = findeAbo(rein.toLowerCase());
    if (bekannt) {
      notiz.textContent = 'Diese Adresse ist auf diesem Gerät schon angemeldet. ' +
        'Wenn du absendest, aktualisierst du die gespeicherten Angaben.';
      notiz.hidden = false;
      aktualisiereBeschreibung(feld('email'));
      return;
    }

    verbergeEmailNotiz();
  }

  /* --- Speicherung (AF 6.2) --- */

  function aboAkte() {
    const akte = lies(SCHLUESSEL.abo);
    if (!akte || !Array.isArray(akte.eintraege)) { return { version: 1, eintraege: [] }; }
    return akte;
  }

  function findeAbo(emailSchluessel) {
    if (!emailSchluessel) { return null; }
    const akte = aboAkte();
    return akte.eintraege.filter(function (eintrag) {
      return eintrag && eintrag.emailSchluessel === emailSchluessel;
    })[0] || null;
  }

  function speichereAbo(satz) {
    const akte = aboAkte();
    const stelle = akte.eintraege.map(function (eintrag) {
      return eintrag ? eintrag.emailSchluessel : '';
    }).indexOf(satz.emailSchluessel);
    if (stelle === -1) { akte.eintraege.push(satz); }
    else { akte.eintraege[stelle] = satz; }
    const erfolg = schreib(SCHLUESSEL.abo, akte);
    aktualisiereLoeschknopf();
    return erfolg;
  }

  function entferneAbo(satzId) {
    const akte = aboAkte();
    akte.eintraege = akte.eintraege.filter(function (eintrag) {
      return !eintrag || eintrag.id !== satzId;
    });
    if (akte.eintraege.length) { schreib(SCHLUESSEL.abo, akte); }
    else { entferneSchluessel(SCHLUESSEL.abo); }
    aktualisiereLoeschknopf();
  }

  function aktualisiereLoeschknopf() {
    const knopf = id('abo-alles-loeschen');
    if (!knopf) { return; }
    const hatAbo = !!liesText(SCHLUESSEL.abo);
    const hatEntwurf = !!liesText(SCHLUESSEL.entwurf);
    knopf.hidden = !(hatAbo || hatEntwurf);
  }

  function sammleDaten() {
    const email = emailBereinigt(feldWert('email'));
    const tarifId = feldWert('tarif');
    const tarif = (daten.abo.tarife || []).filter(function (eintrag) {
      return eintrag.id === tarifId;
    })[0] || null;

    return {
      id: 'abo-' + Math.random().toString(36).slice(2, 8),
      emailSchluessel: email.toLowerCase(),
      email: email,
      vorname: String(feldWert('vorname') || '').trim(),
      nachname: String(feldWert('nachname') || '').trim(),
      tarif: tarifId,
      intervall: feldWert('intervall'),
      interessen: feldWert('interessen'),
      adresse: (tarif && tarif.print) ? {
        strasse: String(feldWert('strasse') || '').trim(),
        plz: String(feldWert('plz') || '').trim(),
        ort: String(feldWert('ort') || '').trim(),
        land: id('abo-land') ? id('abo-land').value : 'DE'
      } : null,
      kommentar: id('abo-kommentar') ? String(id('abo-kommentar').value || '').trim() : '',
      angelegt: new Date().toISOString(),
      geaendert: null
    };
  }

  function istBot() {
    const falle = id('abo-webseite');
    const gefuellt = !!(falle && falle.value.trim().length);
    const zuSchnell = (Date.now() - ABO.gerendert) < BOT_MINDESTZEIT;
    return gefuellt || zuSchnell;
  }

  /* --- Entwurf (V46) --- */

  function schreibeEntwurf() {
    const form = aboFormular();
    if (!form || ABO.zustand === 'erfolg' || ABO.zustand === 'bekannt') { return; }
    const werte = {};
    ABO_BESCHREIBUNG.forEach(function (beschreibung) {
      const eintrag = feld(beschreibung.name);
      if (!eintrag) { return; }
      werte[beschreibung.name] = feldWert(beschreibung.name);
    });
    const kommentar = id('abo-kommentar');
    const land = id('abo-land');
    if (kommentar) { werte.kommentar = kommentar.value; }
    if (land) { werte.land = land.value; }
    schreib(SCHLUESSEL.entwurf, { version: 1, stand: new Date().toISOString(), werte: werte });
    aktualisiereLoeschknopf();
  }

  function planeEntwurf() {
    if (zeitgeber.entwurf) { window.clearTimeout(zeitgeber.entwurf); }
    zeitgeber.entwurf = window.setTimeout(schreibeEntwurf, ENTWURF_VERZOEGERUNG);
  }

  function setzeWerte(werte) {
    if (!werte) { return; }
    ABO.felder.forEach(function (eintrag, name) {
      const wert = werte[name];
      if (wert === undefined) { return; }
      if (name === 'interessen') {
        const gewaehlt = Array.isArray(wert) ? wert : [];
        eintrag.els.forEach(function (element) {
          element.checked = gewaehlt.indexOf(element.value) !== -1;
        });
      } else if (eintrag.gruppe) {
        eintrag.els.forEach(function (element) { element.checked = element.value === wert; });
      } else if (eintrag.kontrolle) {
        eintrag.els[0].checked = !!wert;
      } else {
        eintrag.els[0].value = wert === null || wert === undefined ? '' : String(wert);
      }
    });
    const kommentar = id('abo-kommentar');
    if (kommentar && werte.kommentar !== undefined) { kommentar.value = String(werte.kommentar); }
    const land = id('abo-land');
    if (land && werte.land) { land.value = werte.land; }
  }

  function ladeEntwurf() {
    const entwurf = lies(SCHLUESSEL.entwurf);
    if (!entwurf || !entwurf.werte) { return; }
    const stand = datumTeile(entwurf.stand);
    const alter = stand ? (Date.now() - stand.getTime()) : Number.MAX_VALUE;
    if (!stand || alter > ENTWURF_HALTBARKEIT) {
      entferneSchluessel(SCHLUESSEL.entwurf);
      return;
    }

    setzeWerte(entwurf.werte);
    aktualisierePlzRegel();
    aktualisiereAdressblock(feldWert('tarif'), true);
    aktualisiereZeichenzaehler(false);

    const hinweis = id('abo-entwurf');
    if (hinweis) {
      leere(hinweis);
      hinweis.appendChild(document.createTextNode(
        'Wir haben deine letzte, unfertige Eingabe wiederhergestellt. '));
      const knopf = neu('button', 'knopf knopf--geist', 'Entwurf verwerfen');
      knopf.type = 'button';
      knopf.setAttribute('data-aktion', 'abo-entwurf-verwerfen');
      hinweis.appendChild(knopf);
      hinweis.hidden = false;
    }
  }

  function verwerfeEntwurf() {
    entferneSchluessel(SCHLUESSEL.entwurf);
    const hinweis = id('abo-entwurf');
    if (hinweis) {
      leere(hinweis);
      hinweis.hidden = true;
    }
    setzeFormularZurueck();
    aktualisiereLoeschknopf();
    aboStatus('Der Entwurf wurde verworfen.');
  }

  function setzeFormularZurueck() {
    const form = aboFormular();
    if (!form) { return; }
    form.reset();
    ABO.felder.forEach(function (eintrag, name) {
      eintrag.beruehrt = false;
      loescheFehler(name);
    });
    ABO.absendeVersuch = false;
    verbergeEmailNotiz();
    rendereFehlerliste([], false);
    ABO.adresseOffen = true;                 // erzwingt das Schliessen im naechsten Schritt
    aktualisiereAdressblock('', true);
    aktualisierePlzRegel();
    ABO.zaehlerSchwelle = null;
    aktualisiereZeichenzaehler(false);
  }

  /* --- Quittung (AF 4.5, 4.6) --- */

  function tarifName(tarifId) {
    const tarif = (daten.abo.tarife || []).filter(function (eintrag) {
      return eintrag.id === tarifId;
    })[0];
    return tarif ? tarif.name : String(tarifId || '');
  }

  function tarifPreis(tarifId) {
    const tarif = (daten.abo.tarife || []).filter(function (eintrag) {
      return eintrag.id === tarifId;
    })[0];
    return tarif ? formatierePreis(tarif.preisMonat) : '';
  }

  function intervallLabel(intervallId) {
    const eintrag = (daten.abo.intervalle || []).filter(function (posten) {
      return posten.id === intervallId;
    })[0];
    return eintrag ? eintrag.label : String(intervallId || '');
  }

  function landLabel(code) {
    const land = landDaten(code);
    return land ? land.label : String(code || '');
  }

  function rubrikenSatz(idliste) {
    const labels = (idliste || []).map(function (rubrikId) { return rubrikLabel(rubrikId); });
    if (!labels.length) { return ''; }
    if (labels.length === 1) { return labels[0]; }
    return labels.slice(0, -1).join(', ') + ' und ' + labels[labels.length - 1];
  }

  function baueQuittungsliste(satz) {
    const liste = neu('dl', 'abo-quittung');
    function paar(begriff, wert) {
      if (!wert) { return; }
      const gruppe = neu('div', 'abo-quittung__paar');
      gruppe.appendChild(neu('dt', null, begriff));
      gruppe.appendChild(neu('dd', null, wert));
      liste.appendChild(gruppe);
    }

    paar('Name', (satz.vorname + ' ' + satz.nachname).trim());
    paar('E-Mail', satz.email);
    paar('Tarif', tarifName(satz.tarif) + ' – ' + tarifPreis(satz.tarif) + ' im Monat');
    paar('Newsletter', intervallLabel(satz.intervall));
    paar('Rubriken', rubrikenSatz(satz.interessen));
    if (satz.adresse) {
      paar('Lieferadresse', satz.adresse.strasse + ', ' + satz.adresse.plz + ' ' +
        satz.adresse.ort + ', ' + landLabel(satz.adresse.land));
    }
    if (satz.kommentar) { paar('Dein Kommentar', '„' + satz.kommentar + '“'); }

    const datumsWert = (satz.geaendert ? 'Aktualisiert. ' : '') +
      formatiereDatum(satz.geaendert || satz.angelegt);
    paar('Angelegt am', datumsWert);

    return liste;
  }

  function rendereQuittung(satz, variante) {
    const ziel = id('abo-quittung-ziel');
    const form = aboFormular();
    if (!ziel) { return; }
    leere(ziel);

    const bekannt = variante === 'bekannt';
    const karte = neu('div', 'abo-karte' + (bekannt ? ' abo-karte--bekannt' : ' abo-karte--erfolg'));

    const titel = neu('h3', 'abo-karte__titel',
      bekannt ? 'Die kennen wir schon.' : 'Angemeldet – zumindest hier auf deinem Gerät.');
    titel.setAttribute('tabindex', '-1');
    karte.appendChild(titel);

    if (bekannt) {
      karte.appendChild(neu('p', 'abo-karte__text',
        satz.email + ' ist auf diesem Gerät seit dem ' +
        formatiereDatum(satz.angelegt) + ' angemeldet – mit diesen Angaben:'));
    } else {
      karte.appendChild(neu('p', 'abo-karte__text', 'Das haben wir uns gemerkt:'));
    }

    karte.appendChild(baueQuittungsliste(satz));

    const knoepfe = neu('div', 'abo-karte__knoepfe');
    function knopf(text, klasse, aktion) {
      const element = neu('button', 'knopf ' + klasse, text);
      element.type = 'button';
      element.setAttribute('data-aktion', aktion);
      knoepfe.appendChild(element);
    }

    if (bekannt) {
      knopf('Angaben aktualisieren', 'knopf--primaer', 'abo-aktualisieren');
      knopf('Abo entfernen', 'knopf--geist', 'abo-loeschen');
      knopf('Andere Adresse verwenden', 'knopf--geist', 'abo-andere-adresse');
    } else {
      knopf('Angaben ändern', 'knopf--sekundaer', 'abo-aendern');
      knopf('Eintrag löschen', 'knopf--geist', 'abo-loeschen');
    }
    karte.appendChild(knoepfe);

    const ersterSatz = (speicherGeht() && ABO.speicherOk !== false)
      ? 'Es ist nichts verschickt worden.'
      : 'Dein Browser lässt kein lokales Speichern zu – deine Auswahl steht deshalb nur hier auf dem Bildschirm und ist nach dem Neuladen weg.';
    const hinweis = neu('p', 'abo-karte__hinweis');
    hinweis.appendChild(neu('b', null, ersterSatz));
    hinweis.appendChild(document.createTextNode(
      ' RILLE ist hier eine rein statische Seite: kein Server, keine Anfrage, kein Tracker. ' +
      'Deine Angaben liegen ausschließlich im lokalen Speicher deines Browsers, unter dem Schlüssel '));
    hinweis.appendChild(neu('code', 'mono', 'rille.abo.v1'));
    hinweis.appendChild(document.createTextNode(
      '. Sie verlassen dieses Gerät nicht – und sie sind weg, sobald du oben auf ' +
      '„Eintrag löschen“ tippst oder deine Browserdaten leerst.'));
    karte.appendChild(hinweis);

    ziel.appendChild(karte);

    if (form) { form.hidden = true; }
    ABO.zustand = bekannt ? 'bekannt' : 'erfolg';

    titel.focus();
    try {
      karte.scrollIntoView({ block: 'start', behavior: scrollArt() });
    } catch (fehler) {
      karte.scrollIntoView();
    }
  }

  function zurueckZumFormular(status, fokusFeld, markieren) {
    const ziel = id('abo-quittung-ziel');
    const form = aboFormular();
    leere(ziel);
    if (form) { form.hidden = false; }
    ABO.zustand = 'ruhe';
    if (status) { aboStatus(status); }
    const element = fokusFeld ? id(fokusFeld) : null;
    if (element) {
      element.focus();
      if (markieren && typeof element.select === 'function') { element.select(); }
    }
  }

  /* --- Absenden (AF 4.4) --- */

  function absenden(ereignis) {
    ereignis.preventDefault();
    if (ABO.sendetGerade) { return; }

    ABO.absendeVersuch = true;
    ABO.speicherOk = null;
    const fehler = pruefeAlles();
    if (fehler.length) {
      rendereFehlerliste(fehler, true);
      return;
    }
    rendereFehlerliste([], false);

    const form = aboFormular();
    const knopf = id('abo-absenden');
    ABO.sendetGerade = true;
    ABO.zustand = 'sendet';
    if (form) { form.setAttribute('aria-busy', 'true'); }
    if (knopf) {
      knopf.setAttribute('aria-disabled', 'true');
      knopf.textContent = 'Wird geprüft …';
    }
    aboStatus('Deine Angaben werden geprüft.');

    const satz = sammleDaten();
    ABO.letzteEingabe = satz;
    const verdaechtig = istBot();

    if (zeitgeber.senden) { window.clearTimeout(zeitgeber.senden); }
    zeitgeber.senden = window.setTimeout(function () {
      zeitgeber.senden = 0;
      ABO.sendetGerade = false;
      if (form) { form.removeAttribute('aria-busy'); }
      if (knopf) {
        knopf.removeAttribute('aria-disabled');
        knopf.textContent = 'Abo anlegen';
      }

      if (verdaechtig) {
        // Oberflaeche verhaelt sich wie im Erfolgsfall, gespeichert wird nichts (AF 2.7).
        console.debug('[rille] Abo verworfen: Botverdacht');
        rendereQuittung(satz, 'erfolg');
        aboStatus('Angemeldet. Die Zusammenfassung steht jetzt oben.');
        return;
      }

      const bekannt = findeAbo(satz.emailSchluessel);
      if (bekannt) {
        ABO.bekannterEintrag = bekannt;
        rendereQuittung(bekannt, 'bekannt');
        aboStatus('Diese E-Mail-Adresse ist auf diesem Gerät schon angemeldet.');
        return;
      }

      ABO.speicherOk = speichereAbo(satz);
      entferneSchluessel(SCHLUESSEL.entwurf);
      const hinweis = id('abo-entwurf');
      if (hinweis) { leere(hinweis); hinweis.hidden = true; }
      aktualisiereLoeschknopf();
      rendereQuittung(satz, 'erfolg');
      aboStatus('Angemeldet. Die Zusammenfassung steht jetzt oben.');
    }, SENDE_DAUER);
  }

  /* --- Ereignisse des Formulars --- */

  function aboEreignisse() {
    const form = aboFormular();
    if (!form) { return; }

    form.addEventListener('submit', absenden);

    form.addEventListener('focusout', function (ereignis) {
      const name = ereignis.target && ereignis.target.name;
      if (!name || !ABO.felder.has(name)) { return; }
      const eintrag = feld(name);

      if (eintrag.gruppe) {
        const rahmen = ereignis.target.closest('fieldset');
        if (rahmen && ereignis.relatedTarget && rahmen.contains(ereignis.relatedTarget)) {
          return;
        }
      }
      if (eintrag.kontrolle) { return; }  // Checkbox-Blur ist kein Fehlerauslöser (AF 3.8)

      eintrag.beruehrt = true;
      sobaldZeigerFrei(function () {
        if (name === 'plz') { plzBereinigen(); }
        pruefeFeld(name);
        if (name === 'email') { pruefeEmailNotiz(); }
        aktualisiereFehlerliste();
      });
    });

    form.addEventListener('input', function (ereignis) {
      const ziel = ereignis.target;
      const name = ziel && ziel.name;
      if (name === 'webseite') { return; }
      if (name === 'kommentar') {
        aktualisiereZeichenzaehler(true, ereignis.inputType);
      }
      if (name === 'plz') { plzVorspannWeg(); }
      if (name && ABO.felder.has(name)) {
        pruefeFeld(name, { live: true });
        aktualisiereFehlerliste();
      }
      if (name === 'email') { verbergeEmailNotiz(); }
      planeEntwurf();
    });

    /* Einfuegen in die PLZ: das Feld traegt die knappe maxlength aus den Daten
       (5 bzw. 4). Ein eingefuegtes „D-44137“ kuerzt der Browser auf „D-441“,
       bevor plzVorspannWeg() das Laenderkuerzel entfernen kann - uebrig bliebe
       „441“. Darum wird der eingefuegte Text vorher gesaeubert (AF 3.7). */
    form.addEventListener('paste', function (ereignis) {
      const ziel = ereignis.target;
      if (!ziel || ziel.id !== 'abo-plz' || !ereignis.clipboardData) { return; }

      const land = aktuellesLand();
      let eingefuegt = String(ereignis.clipboardData.getData('text') || '')
        .replace(/\s{2,}/g, ' ').trim();
      if (land && land.code !== 'EU') {
        eingefuegt = eingefuegt.replace(/^(D|A|CH)[- ]?(?=\d)/i, '');
      }
      ereignis.preventDefault();

      const anfang = (ziel.selectionStart === null) ? ziel.value.length : ziel.selectionStart;
      const ende = (ziel.selectionEnd === null) ? ziel.value.length : ziel.selectionEnd;
      const grenze = Number(ziel.getAttribute('maxlength')) || 0;
      let wert = ziel.value.slice(0, anfang) + eingefuegt + ziel.value.slice(ende);
      if (grenze > 0) { wert = wert.slice(0, grenze); }
      ziel.value = wert;

      const marke = Math.min(anfang + eingefuegt.length, wert.length);
      try { ziel.setSelectionRange(marke, marke); } catch (fehler) { /* egal */ }
      ziel.dispatchEvent(new Event('input', { bubbles: true }));
    });

    form.addEventListener('change', function (ereignis) {
      const ziel = ereignis.target;
      const name = ziel && ziel.name;
      if (name === 'tarif') {
        aktualisiereAdressblock(feldWert('tarif'), false);
      }
      if (name === 'land') {
        aktualisierePlzRegel();
      }
      if (name && ABO.felder.has(name)) {
        const eintrag = feld(name);
        if (eintrag.gruppe || eintrag.kontrolle) {
          if (ABO.absendeVersuch || eintrag.beruehrt || eintrag.fehler) {
            pruefeFeld(name);
            aktualisiereFehlerliste();
          }
        }
      }
      planeEntwurf();
    });
  }

  function initAbo() {
    if (!daten.abo) { return; }
    rendereTarifkarten();
    rendereTarifWahl();
    rendereIntervalle();
    rendereInteressen();
    registriereFelder();
    ABO.gerendert = Date.now();
    ABO.adresseOffen = false;
    aktualisierePlzRegel();
    aktualisiereZeichenzaehler(false);
    aktualisiereLoeschknopf();
    ladeEntwurf();
    aboEreignisse();
  }

  /* ============================================================
     12 · EREIGNISSE UND START
     ============================================================ */

  function behandleAktion(aktion, ausloeser, ereignis) {
    switch (aktion) {

      case 'menu-umschalten':
        menuUmschalten();
        break;

      case 'thema-umschalten':
        themaUmschalten();
        break;

      case 'suche-loeschen': {
        const feldSuche = id('suchfeld');
        if (feldSuche) { feldSuche.value = ''; feldSuche.focus(); }
        setzeSuche('');
        break;
      }

      case 'filtern':
        setzeRubrik(ausloeser.getAttribute('data-rubrik'));
        break;

      case 'mehr-laden':
        mehrLaden();
        break;

      case 'filter-zuruecksetzen':
        setzeAllesZurueck();
        break;

      case 'lesemodus-oeffnen':
        ereignis.preventDefault();
        oeffneLesemodus(ausloeser.getAttribute('data-artikel-id'), ausloeser);
        break;

      case 'kuenstler-oeffnen':
        oeffneKuenstlerblatt(ausloeser.getAttribute('data-kuenstler-id'), ausloeser);
        break;

      case 'overlay-schliessen':
        schliesseOverlay(true);
        break;

      case 'schriftgroesse':
        setzeLeseGroesse(ausloeser.getAttribute('data-groesse'), true);
        break;

      case 'track-abspielen':
        starteTrack(ausloeser.getAttribute('data-track-id'));
        break;

      case 'abo-alles-loeschen':
        entferneSchluessel(SCHLUESSEL.abo);
        entferneSchluessel(SCHLUESSEL.entwurf);
        aktualisiereLoeschknopf();
        aboStatus('Alle Abo-Daten wurden von diesem Gerät gelöscht.');
        break;

      case 'abo-aendern':
        zurueckZumFormular('Du kannst deine Angaben jetzt wieder bearbeiten.',
          'abo-vorname', false);
        break;

      case 'abo-loeschen': {
        const satz = (ABO.zustand === 'bekannt' && ABO.bekannterEintrag)
          ? ABO.bekannterEintrag
          : ABO.letzteEingabe;
        if (satz) { entferneAbo(satz.id); }
        ABO.bekannterEintrag = null;
        ABO.letzteEingabe = null;
        setzeFormularZurueck();
        zurueckZumFormular('Der Eintrag wurde von diesem Gerät gelöscht.', 'abo-vorname', false);
        break;
      }

      case 'abo-aktualisieren': {
        const neuerSatz = ABO.letzteEingabe;
        const alt = ABO.bekannterEintrag;
        if (neuerSatz) {
          if (alt && alt.id) { neuerSatz.id = alt.id; }
          if (alt && alt.angelegt) { neuerSatz.angelegt = alt.angelegt; }
          neuerSatz.geaendert = new Date().toISOString();
          ABO.speicherOk = speichereAbo(neuerSatz);
          entferneSchluessel(SCHLUESSEL.entwurf);
          rendereQuittung(neuerSatz, 'erfolg');
          aboStatus('Deine Angaben wurden aktualisiert.');
        }
        break;
      }

      case 'abo-andere-adresse':
        zurueckZumFormular('Trag eine andere E-Mail-Adresse ein.', 'abo-email', true);
        break;

      case 'abo-entwurf-verwerfen':
        verwerfeEntwurf();
        break;

      case 'abo-fehler-springen':
        ereignis.preventDefault();
        springeZuFeld(ausloeser.getAttribute('data-feld'));
        break;

      case 'email-vorschlag-uebernehmen': {
        const feldEmail = id('abo-email');
        if (feldEmail && ABO.emailVorschlag) {
          feldEmail.value = ABO.emailVorschlag;
          verbergeEmailNotiz();
          pruefeFeld('email');
          aktualisiereFehlerliste();
          feldEmail.focus();
        }
        break;
      }

      default:
        break;
    }
  }

  let druckZiel = null;   // Ziel des letzten pointerdown/mousedown, nur fuer V22

  function setzeEreignisse() {
    document.addEventListener('click', function (ereignis) {
      const ausloeser = ereignis.target.closest ? ereignis.target.closest('[data-aktion]') : null;

      if (ausloeser) {
        const aktion = ausloeser.getAttribute('data-aktion');
        const eltern = ausloeser.parentElement;
        const istVerdunkler = aktion === 'overlay-schliessen' && eltern &&
          eltern.getAttribute('role') === 'dialog';
        // Der Verdunkler schliesst nur, wenn Druck und Klick beide auf ihm lagen (V22).
        if (istVerdunkler) {
          if (ereignis.target !== ausloeser) { return; }
          if (druckZiel !== null && druckZiel !== ausloeser) { return; }
        }
        behandleAktion(aktion, ausloeser, ereignis);
        return;
      }

      const rubriklink = ereignis.target.closest ? ereignis.target.closest('a[data-rubrik]') : null;
      if (rubriklink) {
        ereignis.preventDefault();
        setzeRubrik(rubriklink.getAttribute('data-rubrik'));
        menuUmschalten(false);
        springeZuBeitraegen();
      }
    });

    // Wo der Druck begann, entscheidet mit darüber, ob der Verdunkler schliesst.
    document.addEventListener('pointerdown', function (ereignis) { druckZiel = ereignis.target; });
    document.addEventListener('mousedown', function (ereignis) { druckZiel = ereignis.target; });

    document.addEventListener('keydown', function (ereignis) {
      if (ereignis.key === 'Escape') {
        if (zustand.offenerDialog) {
          ereignis.preventDefault();
          schliesseOverlay(true);
          return;
        }
        const feldSuche = id('suchfeld');
        if (document.activeElement === feldSuche && feldSuche && feldSuche.value) {
          feldSuche.value = '';
          setzeSuche('');
          feldSuche.focus();
          return;
        }
        const menuknopf = id('menuknopf');
        if (menuknopf && menuknopf.getAttribute('aria-expanded') === 'true') {
          menuUmschalten(false);
          menuknopf.focus();
        }
        return;
      }
      if (ereignis.key === 'Tab' && zustand.offenerDialog) {
        fangeFokus(ereignis);
      }
    });

    const suchformular = id('suche');
    if (suchformular) {
      suchformular.addEventListener('submit', function (ereignis) { ereignis.preventDefault(); });
    }

    const suchfeld = id('suchfeld');
    if (suchfeld) {
      suchfeld.addEventListener('input', function () {
        const loeschen = id('suche-loeschen');
        if (loeschen) { loeschen.hidden = suchfeld.value.length === 0; }
        if (zeitgeber.suche) { window.clearTimeout(zeitgeber.suche); }
        zeitgeber.suche = window.setTimeout(function () {
          zeitgeber.suche = 0;
          setzeSuche(suchfeld.value);
        }, SUCH_VERZOEGERUNG);
      });
    }

    const sortierung = id('sortierung');
    if (sortierung) {
      sortierung.addEventListener('change', function () {
        zustand.sortierung = sortierung.value;
        zustand.sichtbar = START_SICHTBAR;
        rendereBeitraege();
      });
    }

    const lesepanel = panelVon('lesemodus');
    const leseinhalt = id('lesemodus-inhalt');
    if (lesepanel) { lesepanel.addEventListener('scroll', planeLesefortschritt, { passive: true }); }
    if (leseinhalt) { leseinhalt.addEventListener('scroll', planeLesefortschritt, { passive: true }); }

    if (mqRuhe && typeof mqRuhe.addEventListener === 'function') {
      mqRuhe.addEventListener('change', function () { /* nur gelesen, kein Neuaufbau noetig */ });
    }
  }

  /* --- Notfall: keine Daten (V1) --- */

  function zeigeDatenfehler() {
    const leerzustand = id('leerzustand');
    const leertext = id('leerzustand-text');
    if (leertext) {
      leertext.textContent = 'Die Beiträge konnten nicht geladen werden.';
    }
    if (leerzustand) { leerzustand.hidden = false; }
    ['filter', 'artikelraster', 'nachladen'].forEach(function (name) {
      const knoten = id(name);
      if (knoten) { knoten.hidden = true; }
    });
    ['kuenstler', 'playlist'].forEach(function (name) {
      const knoten = id(name);
      if (knoten) { knoten.hidden = true; }
    });
  }

  function starte() {
    daten = window.RILLE_DATA;
    if (!daten || !Array.isArray(daten.artikel) || !daten.artikel.length) {
      zeigeDatenfehler();
      themaStarten();
      return;
    }

    bereiteDatenAuf();
    themaStarten();
    rendereAufmacher();
    beobachteAufmacherFormat();
    rendereChips();
    rendereBeitraege();
    rendereKuenstler();
    renderePlaylist();
    initAbo();
    setzeFusszeilenjahr();
    beobachteKopfzeile();
    setzeEreignisse();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', starte);
  } else {
    starte();
  }
}());
