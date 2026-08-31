/* ============================================================
   RILLE · assets/js/artwork.js
   Generative Bildwelt: Risographie-Zweifarbendruck, im Code gezeichnet.

   Vertrag: bauplan.md Abschnitt 4, Art-Direction Abschnitt 7.
   Klassisches Script (kein Modul), laeuft unter file://, kein Netzwerk,
   kein Math.random(), keine Farbliterale - alle Farben sind CSS-Tokens.

   Aufbau dieser Datei:
     1 Werkzeug (Rundung, SVG-Knoten, Hash, PRNG, Seed)
     2 Tabellen (Rubriken, Formate)
     3 Wurzel-SVG und Ersatzgrafik
     4 Kompositionen (Bandsatz, Ringsatz, Schichtsatz)
     5 Formenvokabular je Rubrik (AD 7.5)
     6 Ebenen: Auszuege, Halbton, Rille, Marken, Korn
     7 Blatt-Zusammenbau
     8 Oeffentliche Funktionen
     9 Installation im Namensraum
   ============================================================ */

(function () {
  'use strict';

  /* Zielobjekt: im Browser window. Der Rueckfall auf globalThis existiert nur,
     damit ein Node-Pruefharnisch die Datei laden kann - im Browser greift er nie. */
  var G = (typeof window !== 'undefined')
    ? window
    : (typeof globalThis !== 'undefined' ? globalThis : this);

  var NS = 'http://www.w3.org/2000/svg';

  /* Systemsicherer Monospace-Stack fuer die Initialen-Kennung im Kontrollstreifen.
     Kein Webfont, keine Netzwerkanfrage. (Keine Farbe - AD 7.7 bleibt gewahrt.) */
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

  /* Fortlaufender Zaehler ausschliesslich fuer eindeutige Element-IDs
     (pattern, clipPath, filter). Er beruehrt keine einzige Koordinate:
     die Geometrie haengt allein am Seed. Gleicher Seed = gleiches Bild. */
  var lauf = 0;

  /* ============================================================
     1 · WERKZEUG
     ============================================================ */

  /* Zwei Nachkommastellen genuegen und halten das DOM klein. */
  function n(x) {
    if (typeof x !== 'number' || !isFinite(x)) { return 0; }
    return Math.round(x * 100) / 100;
  }

  function el(name, attr) {
    var knoten = document.createElementNS(NS, name);
    if (attr) {
      for (var a in attr) {
        if (Object.prototype.hasOwnProperty.call(attr, a)) {
          var wert = attr[a];
          if (wert !== null && wert !== undefined) { knoten.setAttribute(a, String(wert)); }
        }
      }
    }
    return knoten;
  }

  /* FNV-1a, 32 Bit (AD 7.2). Multiplikation mit dem Primzahlfaktor als
     Schiebefolge, damit nichts ueber 2^53 laeuft. */
  function fnv1a(text) {
    var h = 0x811c9dc5;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  /* mulberry32: kleiner, schneller, deterministischer Generator. */
  function mulberry32(saat) {
    var a = saat >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Bequeme Huelle. Jede Ziehung verbraucht genau einen Schritt des Generators,
     deshalb ist die Reihenfolge der Aufrufe Teil der Bildbeschreibung. */
  function Zufall(text) {
    var quelle = mulberry32(fnv1a(String(text)));
    return {
      wert: quelle,
      spanne: function (a, b) { return a + (b - a) * quelle(); },
      ganz: function (a, b) { return Math.floor(a + (b - a + 1) * quelle()); },
      waehle: function (liste) {
        if (!liste || !liste.length) { return undefined; }
        return liste[Math.floor(quelle() * liste.length) % liste.length];
      },
      chance: function (p) { return quelle() < p; },
      richtung: function () { return quelle() < 0.5 ? -1 : 1; }
    };
  }

  /* Wirksamer Seed-String (bauplan 4.2). Die Streuung ist der Farbwert aus den
     Daten - er wird nie als Farbe gerendert, nur als zusaetzlicher Streuwert
     verrechnet (ENTSCHEIDUNG 0.11). */
  function seedText(seed, streuung) {
    var s;
    if (seed === null || seed === undefined) {
      s = '';
    } else if (typeof seed === 'number') {
      s = isFinite(seed) ? String(seed) : '';
    } else {
      s = String(seed);
    }
    if (s === '' || s === 'NaN' || s === 'undefined' || s === 'null') { s = 'rille'; }
    var t = (streuung === null || streuung === undefined) ? '' : String(streuung);
    return s + '|' + t;
  }

  function zahlOder(wert, ersatz) {
    var z = Number(wert);
    if (!isFinite(z) || z <= 0) { return ersatz; }
    return z;
  }

  /* ============================================================
     2 · TABELLEN
     ============================================================ */

  /* Fuehrende Druckfarbe je Rubrik (AD 7.5): Rezension, Live, Entdeckung
     fuehren mit Ink A (Zinnober), Interview, Portraet, Kolumne mit Ink B. */
  var RUBRIKEN = {
    rezension:  'a',
    interview:  'b',
    portraet:   'b',
    live:       'a',
    kolumne:    'b',
    entdeckung: 'a'
  };

  function rubrikOder(id) {
    if (typeof id === 'string' && Object.prototype.hasOwnProperty.call(RUBRIKEN, id)) { return id; }
    return 'rezension';
  }

  /* viewBox, Papierkorn, Marken und Halbtonraster je Format (bauplan 4.5). */
  var FORMATE = {
    'hero-hoch':     { b: 1200, h: 1500, korn: true,  marken: true,  weite: 14, radius: 4.2 },
    'hero-breit':    { b: 1200, h:  800, korn: true,  marken: true,  weite: 14, radius: 4.2 },
    'cover-gross':   { b: 1200, h:  800, korn: true,  marken: true,  weite: 14, radius: 4.2 },
    'cover-mittel':  { b:  800, h:  800, korn: false, marken: true,  weite: 11, radius: 3.2 },
    'cover-kompakt': { b:  400, h:  400, korn: false, marken: false, weite:  8, radius: 2.2 },
    'portraet':      { b:  800, h: 1000, korn: true,  marken: true,  weite: 11, radius: 3.2 }
  };

  var GROESSEN = { gross: 'cover-gross', mittel: 'cover-mittel', kompakt: 'cover-kompakt' };

  /* Die drei Kompositionen. Sie bestimmen, wie sich die groben Formen auf dem
     Blatt sammeln - das Formenvokabular der Rubrik bleibt davon unberuehrt. */
  var KOMPOSITIONEN = ['bandsatz', 'ringsatz', 'schichtsatz'];

  /* ============================================================
     3 · WURZEL-SVG UND ERSATZGRAFIK
     ============================================================ */

  function baueWurzel(art, breite, hoehe, seedStr, label, px) {
    var svg = el('svg', {
      viewBox: '0 0 ' + breite + ' ' + hoehe,
      preserveAspectRatio: 'xMidYMid slice',
      width: px ? px : '100%',
      height: px ? px : '100%',
      focusable: 'false',
      'class': 'artwork artwork--' + art,
      'data-seed': seedStr
    });
    /* AD 7.7 / bauplan 4.7: ohne Label ist das Artwork rein dekorativ. */
    if (typeof label === 'string' && label !== '') {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', label);
    } else {
      svg.setAttribute('aria-hidden', 'true');
    }
    return svg;
  }

  /* Neutrales Blatt: nur Papier. Rueckfall fuer jeden Fehlerfall - es kommt
     immer ein gueltiges SVG-Element zurueck, nie eine Ausnahme. */
  function ersatzBlatt(art, breite, hoehe, seedStr, px) {
    try {
      var svg = baueWurzel(art, breite, hoehe, seedStr || 'rille|', '', px);
      svg.appendChild(el('rect', {
        'class': 'artwork__papier',
        x: 0, y: 0, width: breite, height: hoehe,
        fill: 'var(--artwork-papier)'
      }));
      return svg;
    } catch (fehler) {
      /* Selbst das kann nur scheitern, wenn es gar kein Dokument gibt. */
      return null;
    }
  }

  function tinte(seite) { return 'var(--artwork-ink-' + seite + ')'; }

  /* ============================================================
     4 · KOMPOSITIONEN
     Jede liefert das Grundgeruest eines Farbauszugs als Liste von
     { knoten, fuellend }. "fuellend" heisst: die Form traegt eine Flaeche und
     taugt damit als Halbton-Beschnitt (Konturen taugen dafuer nicht).
     ============================================================ */

  /* Die Ruhezone (AD 7.6) belegt ein Viertel des Blattes; die groben Formen
     sammeln sich in der Gegenrichtung. So bleibt immer eine zusammenhaengende
     unbedruckte Flaeche fuer Titel oder Bildunterschrift. */
  function satzKasten(geo, ruhe) {
    return {
      x: ruhe.links ? geo.b * 0.30 : geo.b * -0.06,
      y: ruhe.oben ? geo.h * 0.34 : geo.h * -0.06,
      b: geo.b * 0.76,
      h: geo.h * 0.72
    };
  }

  /* Bandsatz: zwei bis drei breite Wellenbaender ziehen quer ueber das Blatt
     und laufen links wie rechts ueber die Kante hinaus. Ruhiger Grundton,
     die Rubrikform sitzt darauf. */
  function bandsatz(r, satz, gewicht) {
    var geo = satz.geo;
    var aus = [];
    var anzahl = gewicht < 1 ? r.ganz(1, 2) : r.ganz(2, 3);
    var start = satz.ruhe.oben ? geo.h * 0.40 : geo.h * 0.04;
    var raum = geo.h * 0.42;
    for (var i = 0; i < anzahl; i++) {
      var oben = start + raum * (i / anzahl) + r.spanne(-1, 1) * geo.h * 0.02;
      var dicke = (raum / anzahl) * r.spanne(0.34, 0.58) * gewicht + geo.h * 0.02;
      aus.push({ knoten: wellenBand(r, geo, oben, dicke), fuellend: true });
    }
    return aus;
  }

  function wellenBand(r, geo, oben, dicke) {
    var stufen = 4;
    var links = -40;
    var breite = geo.b + 80;
    var schritt = breite / stufen;
    var amp = dicke * r.spanne(0.16, 0.48);
    var ys = [oben];
    var i;
    for (i = 1; i <= stufen; i++) { ys.push(oben + r.spanne(-amp, amp)); }

    var d = ['M', n(links), n(ys[0])];
    for (i = 1; i <= stufen; i++) {
      var x0 = links + schritt * (i - 1);
      var x1 = links + schritt * i;
      d.push('C', n(x0 + schritt * 0.5), n(ys[i - 1]),
                  n(x1 - schritt * 0.5), n(ys[i]),
                  n(x1), n(ys[i]));
    }
    d.push('L', n(links + breite), n(ys[stufen] + dicke));
    for (i = stufen; i >= 1; i--) {
      var xa = links + schritt * i;
      var xb = links + schritt * (i - 1);
      d.push('C', n(xa - schritt * 0.5), n(ys[i] + dicke),
                  n(xb + schritt * 0.5), n(ys[i - 1] + dicke),
                  n(xb), n(ys[i - 1] + dicke));
    }
    d.push('Z');
    return el('path', { 'class': 'artwork__form artwork__form--band', d: d.join(' ') });
  }

  /* Ringsatz: eine Vollscheibe mit drei bis fuenf krachend breiten Ringen
     darum, aussermittig gesetzt - das Signaturmotiv der Rille als Hauptmotiv. */
  function ringsatz(r, satz, gewicht) {
    var geo = satz.geo;
    var aus = [];
    var mx = geo.b * (satz.ruhe.links ? r.spanne(0.58, 0.86) : r.spanne(0.14, 0.42));
    var my = geo.h * (satz.ruhe.oben ? r.spanne(0.56, 0.86) : r.spanne(0.14, 0.44));
    var kern = geo.k * r.spanne(0.06, 0.10) * gewicht;
    var schritt = geo.k * r.spanne(0.055, 0.085);
    var anzahl = gewicht < 1 ? r.ganz(2, 3) : r.ganz(2, 4);

    aus.push({
      knoten: el('circle', {
        'class': 'artwork__form artwork__form--ring',
        cx: n(mx), cy: n(my), r: n(kern)
      }),
      fuellend: true
    });
    for (var i = 1; i <= anzahl; i++) {
      aus.push({
        knoten: el('circle', {
          'class': 'artwork__form artwork__form--ring',
          cx: n(mx), cy: n(my), r: n(kern + schritt * i),
          fill: 'none',
          'stroke-width': n(geo.k * r.spanne(0.014, 0.034) * gewicht)
        }),
        fuellend: false
      });
    }
    return aus;
  }

  /* Schichtsatz: drei bis vier gezackte Schichten wachsen aus der Blattkante
     heraus - Berge, Pegel, gestapelte Balken, je nach Blickwinkel. Sie steigen
     aus der Kante gegenueber der Ruhezone auf. */
  function schichtsatz(r, satz, gewicht) {
    var geo = satz.geo;
    var aus = [];
    var vonUnten = satz.ruhe.oben;
    var anzahl = gewicht < 1 ? r.ganz(2, 3) : r.ganz(3, 4);
    for (var i = 0; i < anzahl; i++) {
      var basis = vonUnten
        ? geo.h * (1.04 - 0.06 * i)
        : geo.h * (-0.04 + 0.06 * i);
      var spitze = geo.h * (0.10 + 0.09 * i) * gewicht;
      aus.push({ knoten: schicht(r, geo, basis, spitze, vonUnten), fuellend: true });
    }
    return aus;
  }

  function schicht(r, geo, basis, spitze, vonUnten) {
    var ecken = r.ganz(3, 5);
    var links = -40;
    var breite = geo.b + 80;
    var punkte = [[links, basis]];
    for (var i = 0; i <= ecken; i++) {
      var x = links + breite * (i / ecken);
      var y = basis + (vonUnten ? -1 : 1) * spitze * r.spanne(0.30, 1);
      punkte.push([x, y]);
    }
    punkte.push([links + breite, basis]);
    punkte.push([links + breite, vonUnten ? geo.h + 60 : -60]);
    punkte.push([links, vonUnten ? geo.h + 60 : -60]);

    var text = [];
    for (var j = 0; j < punkte.length; j++) {
      text.push(n(punkte[j][0]) + ',' + n(punkte[j][1]));
    }
    return el('polygon', {
      'class': 'artwork__form artwork__form--schicht',
      points: text.join(' ')
    });
  }

  var GRUNDSATZ = { bandsatz: bandsatz, ringsatz: ringsatz, schichtsatz: schichtsatz };

  /* ============================================================
     5 · FORMENVOKABULAR JE RUBRIK (AD 7.5)
     "2 bis 4 grobe Formen" der AD wird als 2 bis 4 Formengruppen gelesen -
     Balkenreihe und Strahlenkranz sind je eine Geste, nicht je ein Element.
     ============================================================ */

  function mitte(kasten) {
    return { x: kasten.x + kasten.b / 2, y: kasten.y + kasten.h / 2 };
  }

  /* Rezension: Vollkreis (Platte) plus kleinerer Kreis (Label), dazu ein
     waagerechtes Band, das die Platte auf einem Drittel Hoehe schneidet. */
  function vokRezension(r, satz, gewicht) {
    var geo = satz.geo;
    var m = mitte(satz.kasten);
    var cx = m.x + r.spanne(-0.07, 0.07) * geo.b;
    var cy = m.y + r.spanne(-0.07, 0.07) * geo.h;
    var rad = geo.k * r.spanne(0.18, 0.26) * gewicht;
    var dicke = geo.k * r.spanne(0.05, 0.10) * gewicht;
    return [
      { knoten: el('circle', { 'class': 'artwork__form artwork__form--platte',
          cx: n(cx), cy: n(cy), r: n(rad) }), fuellend: true },
      { knoten: el('circle', { 'class': 'artwork__form artwork__form--label',
          cx: n(cx), cy: n(cy), r: n(rad * r.spanne(0.26, 0.38)) }), fuellend: true },
      { knoten: el('rect', { 'class': 'artwork__form artwork__form--schnitt',
          x: -40, y: n(cy + rad / 3 - dicke / 2),
          width: n(geo.b + 80), height: n(dicke) }), fuellend: true }
    ];
  }

  /* Interview: zwei Halbkreise mit geraden Kanten, einander zugewandt, mit
     Luecke dazwischen; in der Luecke ein schmales senkrechtes Band. */
  function vokInterview(r, satz, gewicht) {
    var geo = satz.geo;
    var m = mitte(satz.kasten);
    var rad = geo.k * r.spanne(0.15, 0.22) * gewicht;
    var luecke = geo.k * r.spanne(0.09, 0.18);
    var cy = m.y + r.spanne(-0.06, 0.06) * geo.h;
    var xl = m.x - luecke / 2;
    var xr = m.x + luecke / 2;
    var halbLinks = 'M ' + n(xl) + ' ' + n(cy - rad) +
      ' A ' + n(rad) + ' ' + n(rad) + ' 0 0 0 ' + n(xl) + ' ' + n(cy + rad) + ' Z';
    var halbRechts = 'M ' + n(xr) + ' ' + n(cy - rad) +
      ' A ' + n(rad) + ' ' + n(rad) + ' 0 0 1 ' + n(xr) + ' ' + n(cy + rad) + ' Z';
    return [
      { knoten: el('path', { 'class': 'artwork__form artwork__form--halbkreis', d: halbLinks }), fuellend: true },
      { knoten: el('path', { 'class': 'artwork__form artwork__form--halbkreis', d: halbRechts }), fuellend: true },
      { knoten: el('rect', { 'class': 'artwork__form artwork__form--steg',
          x: n(m.x - luecke * 0.22), y: -40,
          width: n(Math.max(4, luecke * 0.44)), height: n(geo.h + 80) }), fuellend: true }
    ];
  }

  /* Portraet: gestauchte Ellipse (Kopf) auf breitem Trapez (Schultern),
     radikal reduziert, plus eine waagerechte Linie auf Augenhoehe. */
  function vokPortraet(r, satz, gewicht) {
    var geo = satz.geo;
    var buehne = satz.kopf;
    var m = buehne || mitte(satz.kasten);
    var rx = geo.k * (buehne ? r.spanne(0.17, 0.27) : r.spanne(0.15, 0.21)) * gewicht;
    var ry = rx * r.spanne(0.74, 0.92);
    var cx = m.x + r.spanne(-0.05, 0.05) * geo.b;
    var cy = buehne ? m.y + r.spanne(-0.03, 0.03) * geo.h
                    : m.y - geo.h * r.spanne(0.06, 0.13);
    var schulterOben = cy + ry * r.spanne(1.25, 1.55);
    var unten = buehne ? geo.h * 1.08 : satz.kasten.y + satz.kasten.h + geo.h * 0.12;
    var halbOben = rx * r.spanne(1.05, 1.35);
    var halbUnten = rx * r.spanne(2.1, 2.8);
    var trapez = [
      [cx - halbOben, schulterOben],
      [cx + halbOben, schulterOben],
      [cx + halbUnten, unten],
      [cx - halbUnten, unten]
    ];
    var punkte = [];
    for (var i = 0; i < trapez.length; i++) {
      punkte.push(n(trapez[i][0]) + ',' + n(trapez[i][1]));
    }
    return [
      { knoten: el('ellipse', { 'class': 'artwork__form artwork__form--kopf',
          cx: n(cx), cy: n(cy), rx: n(rx), ry: n(ry) }), fuellend: true },
      { knoten: el('polygon', { 'class': 'artwork__form artwork__form--schulter',
          points: punkte.join(' ') }), fuellend: true },
      { knoten: el('rect', { 'class': 'artwork__form artwork__form--augenlinie',
          x: n(cx - rx * 1.25), y: n(cy - ry * r.spanne(0.05, 0.2)),
          width: n(rx * 2.5), height: n(Math.max(3, geo.k * 0.012)) }), fuellend: true }
    ];
  }

  /* Live: fuenf bis neun senkrechte Balken unterschiedlicher Hoehe, um wenige
     Grad geschert, oben angeschnitten - Scheinwerferkegel oder Pegelanzeige. */
  function vokLive(r, satz, gewicht) {
    var geo = satz.geo;
    var kasten = satz.kasten;
    var anzahl = gewicht < 1 ? r.ganz(4, 6) : r.ganz(5, 9);
    var scher = r.spanne(4, 9) * r.richtung();
    var fuss = kasten.y + kasten.h;
    var feld = kasten.b;
    var breite = (feld / anzahl) * r.spanne(0.40, 0.68);
    var aus = [];
    for (var i = 0; i < anzahl; i++) {
      var x = kasten.x + (feld / anzahl) * i + (feld / anzahl - breite) / 2;
      var hoehe = kasten.h * r.spanne(0.34, 0.96) * gewicht;
      aus.push({
        knoten: el('rect', {
          'class': 'artwork__form artwork__form--balken',
          x: n(x), y: n(fuss - hoehe), width: n(breite), height: n(hoehe),
          transform: 'translate(0 ' + n(fuss) + ') skewX(' + n(scher) +
                     ') translate(0 ' + n(-fuss) + ')'
        }),
        fuellend: true
      });
    }
    return aus;
  }

  /* Kolumne: ein einziges breites Diagonalband ueber die volle Flaeche und
     genau ein einzelner Punkt daneben. */
  function vokKolumne(r, satz, gewicht) {
    var geo = satz.geo;
    var m = mitte(satz.kasten);
    var winkel = r.spanne(18, 34) * r.richtung();
    var dicke = geo.k * r.spanne(0.10, 0.19) * gewicht;
    var punktRad = geo.k * r.spanne(0.035, 0.06) * gewicht;
    var px = m.x + r.spanne(-0.34, 0.34) * geo.b;
    var py = m.y + r.spanne(0.24, 0.42) * geo.h * r.richtung();
    return [
      { knoten: el('rect', { 'class': 'artwork__form artwork__form--diagonale',
          x: n(-geo.b), y: n(m.y - dicke / 2),
          width: n(geo.b * 3), height: n(dicke),
          transform: 'rotate(' + n(winkel) + ' ' + n(geo.cx) + ' ' + n(geo.cy) + ')' }), fuellend: true },
      { knoten: el('circle', { 'class': 'artwork__form artwork__form--punkt',
          cx: n(px), cy: n(py), r: n(punktRad) }), fuellend: true }
    ];
  }

  /* Entdeckung: ein unregelmaessiger Splitter aus fuenf bis sieben Ecken plus
     Strahlen, die vom Schwerpunkt ueber den Bildrand hinauslaufen. */
  function vokEntdeckung(r, satz, gewicht) {
    var geo = satz.geo;
    var m = mitte(satz.kasten);
    var cx = m.x + r.spanne(-0.06, 0.06) * geo.b;
    var cy = m.y + r.spanne(-0.06, 0.06) * geo.h;
    var ecken = r.ganz(5, 7);
    var rad = geo.k * r.spanne(0.16, 0.26) * gewicht;
    var punkte = [];
    var i;
    for (i = 0; i < ecken; i++) {
      var w = (i / ecken) * Math.PI * 2 + r.spanne(-0.22, 0.22);
      var rr = rad * r.spanne(0.58, 1.28);
      punkte.push(n(cx + Math.cos(w) * rr) + ',' + n(cy + Math.sin(w) * rr));
    }
    var aus = [{
      knoten: el('polygon', { 'class': 'artwork__form artwork__form--splitter',
        points: punkte.join(' ') }),
      fuellend: true
    }];
    var strahlen = gewicht < 1 ? r.ganz(5, 7) : r.ganz(6, 9);
    var weit = (geo.b + geo.h) * 0.9;
    for (i = 0; i < strahlen; i++) {
      var s = (i / strahlen) * Math.PI * 2 + r.spanne(-0.12, 0.12);
      aus.push({
        knoten: el('path', {
          'class': 'artwork__form artwork__form--strahl',
          d: 'M ' + n(cx) + ' ' + n(cy) + ' L ' +
             n(cx + Math.cos(s) * weit) + ' ' + n(cy + Math.sin(s) * weit),
          fill: 'none',
          'stroke-width': n(geo.k * r.spanne(0.005, 0.012) * gewicht)
        }),
        fuellend: false
      });
    }
    return aus;
  }

  var VOKABULAR = {
    rezension:  vokRezension,
    interview:  vokInterview,
    portraet:   vokPortraet,
    live:       vokLive,
    kolumne:    vokKolumne,
    entdeckung: vokEntdeckung
  };

  /* Eigene Buehne fuer das Kuenstlerportraet: die Figur steht gross und unten
     angeschnitten, dahinter eine Nische und genau ein Requisit. Das Requisit
     wird per Seed gezogen - sonst saehen acht Portraetkarten gleich aus. */
  var REQUISITEN = ['balken', 'saeule', 'bogen'];

  function portraetSatz(r, satz, gewicht) {
    var geo = satz.geo;
    var aus = [];
    if (r.chance(0.78)) {
      aus.push({
        knoten: el('circle', {
          'class': 'artwork__form artwork__form--nische',
          cx: n(satz.kopf.x + r.spanne(-0.16, 0.16) * geo.b),
          cy: n(satz.kopf.y + r.spanne(-0.10, 0.10) * geo.h),
          r: n(geo.b * r.spanne(0.24, 0.34) * gewicht)
        }),
        fuellend: true
      });
    }
    if (satz.requisit === 'balken') {
      aus.push({
        knoten: el('rect', {
          'class': 'artwork__form artwork__form--balken',
          x: -40, y: n(geo.h * r.spanne(0.50, 0.70)),
          width: n(geo.b + 80), height: n(geo.h * r.spanne(0.035, 0.075) * gewicht)
        }),
        fuellend: true
      });
    } else if (satz.requisit === 'saeule') {
      aus.push({
        knoten: el('rect', {
          'class': 'artwork__form artwork__form--saeule',
          x: n(geo.b * (r.chance(0.5) ? r.spanne(0.02, 0.14) : r.spanne(0.72, 0.90))),
          y: -40,
          width: n(geo.b * r.spanne(0.06, 0.13) * gewicht), height: n(geo.h + 80)
        }),
        fuellend: true
      });
    } else {
      aus.push({
        knoten: el('circle', {
          'class': 'artwork__form artwork__form--bogen',
          cx: n(satz.kopf.x + r.spanne(-0.08, 0.08) * geo.b),
          cy: n(satz.kopf.y + r.spanne(0.02, 0.16) * geo.h),
          r: n(geo.b * r.spanne(0.36, 0.48)),
          fill: 'none',
          'stroke-width': n(geo.b * r.spanne(0.02, 0.05) * gewicht)
        }),
        fuellend: false
      });
    }
    if (r.chance(0.72)) {
      aus.push({
        knoten: el('rect', {
          'class': 'artwork__form artwork__form--sockel',
          x: -40, y: n(geo.h * r.spanne(0.78, 0.94)),
          width: n(geo.b + 80), height: n(geo.h * 0.3)
        }),
        fuellend: true
      });
    }
    return aus;
  }

  /* ============================================================
     6 · EBENEN
     ============================================================ */

  /* Ebene 3/4: ein Farbauszug. Komposition und Rubrik sind fuer beide Auszuege
     dieselben, die Parameter werden neu gewuerfelt - genau daraus entsteht der
     Fehldruck-Eindruck (AD 7.4, Punkt 4). */
  function baueAuszug(satz, seite, r) {
    var fuehrend = (RUBRIKEN[satz.rubrik] === seite);
    var gewicht = fuehrend ? 1 : (satz.buehne === 'portraet' ? 0.80 : 0.62);
    var formen;
    if (satz.buehne === 'portraet') {
      formen = portraetSatz(r, satz, gewicht).concat(vokPortraet(r, satz, gewicht));
    } else {
      formen = GRUNDSATZ[satz.kompo](r, satz, gewicht)
        .concat(VOKABULAR[satz.rubrik](r, satz, gewicht));
    }

    /* Ein bis zwei fuellende Formen wandern aus dem Vollton in den Halbton -
       nur so stehen Raster und Vollton nebeneinander (AD 7.4, Punkt 5). */
    var voll = [];
    var gerastert = [];
    var fuellbar = [];
    var i;
    for (i = 0; i < formen.length; i++) {
      if (formen[i].fuellend) { fuellbar.push(i); }
    }
    var ziel = {};
    if (satz.raster && fuellbar.length > 1) {
      var wieviele = Math.min(fuellbar.length - 1, r.ganz(1, 2));
      for (i = 0; i < wieviele; i++) {
        var pos = fuellbar[r.ganz(0, fuellbar.length - 1)];
        ziel[pos] = true;
      }
    }
    for (i = 0; i < formen.length; i++) {
      if (ziel[i]) { gerastert.push(formen[i].knoten); }
      else { voll.push(formen[i].knoten); }
    }
    return { voll: voll, gerastert: gerastert };
  }

  function auszugGruppe(seite, transform) {
    return el('g', {
      'class': 'artwork__auszug artwork__auszug--' + seite,
      fill: tinte(seite),
      stroke: tinte(seite),
      'stroke-width': 0,
      opacity: seite === 'a' ? 0.92 : 0.86,
      transform: transform || null
    });
  }

  /* Ebene 5: Halbton. Ein pattern je Auszug, Winkel 15 Grad und 75 Grad -
     die Differenz von 60 Grad ist Pflicht, sonst entsteht Moire. */
  function halbtonTeil(uid, f, seite, formen, transform) {
    if (!formen.length) { return null; }
    var pid = uid + '-raster-' + seite;
    var cid = uid + '-schnitt-' + seite;

    var muster = el('pattern', {
      id: pid,
      patternUnits: 'userSpaceOnUse',
      width: f.weite, height: f.weite,
      patternTransform: 'rotate(' + (seite === 'a' ? 15 : 75) + ')'
    });
    muster.appendChild(el('circle', {
      cx: n(f.weite / 2), cy: n(f.weite / 2), r: f.radius, fill: tinte(seite)
    }));

    var schnitt = el('clipPath', { id: cid });
    for (var i = 0; i < formen.length; i++) { schnitt.appendChild(formen[i]); }

    var gruppe = el('g', {
      'class': 'artwork__auszug artwork__auszug--' + seite,
      opacity: seite === 'a' ? 0.92 : 0.86,
      transform: transform || null
    });
    gruppe.appendChild(el('rect', {
      x: n(-f.b), y: n(-f.h), width: n(f.b * 3), height: n(f.h * 3),
      fill: 'url(#' + pid + ')',
      'clip-path': 'url(#' + cid + ')'
    }));
    return { muster: muster, schnitt: schnitt, gruppe: gruppe };
  }

  function bogenPfad(cx, cy, rad, gradA, gradB) {
    var a = gradA * Math.PI / 180;
    var b = gradB * Math.PI / 180;
    var x1 = cx + rad * Math.cos(a), y1 = cy + rad * Math.sin(a);
    var x2 = cx + rad * Math.cos(b), y2 = cy + rad * Math.sin(b);
    var gross = Math.abs(gradB - gradA) > 180 ? 1 : 0;
    return 'M ' + n(x1) + ' ' + n(y1) + ' A ' + n(rad) + ' ' + n(rad) +
      ' 0 ' + gross + ' 1 ' + n(x2) + ' ' + n(y2);
  }

  /* Ebene 6: die Rille. Fuenf bis neun konzentrische Boegen um einen
     aussermittigen Punkt; jeder dritte springt per stroke-dasharray. Das Motiv
     laeuft immer ueber eine Bildkante hinaus - es ist nie vollstaendig zu sehen. */
  function baueRille(r, geo, ruhe, fuehrend) {
    var gruppe = el('g', { 'class': 'artwork__rille', fill: 'none',
      'stroke-linecap': 'butt' });
    var anzahl = r.ganz(5, 9);
    var mx = geo.b * (ruhe.links ? r.spanne(0.60, 0.94) : r.spanne(0.06, 0.40));
    var my = geo.h * (ruhe.oben ? r.spanne(0.58, 0.94) : r.spanne(0.06, 0.42));
    var innen = geo.k * r.spanne(0.06, 0.16);
    var abstand = r.spanne(6, 14) * (geo.k / 800);
    var aussen = innen + abstand * (anzahl - 1);

    /* Liegt der Mittelpunkt zu weit im Blatt, wandert er an die naechste
       Kante - der aeussere Bogen muss hinauslaufen. */
    var frei = Math.min(mx, my, geo.b - mx, geo.h - my);
    if (frei > aussen * 0.85) {
      mx = ruhe.links ? geo.b - aussen * 0.5 : aussen * 0.5;
    }

    var gegen = fuehrend === 'a' ? 'b' : 'a';
    var start = r.spanne(0, 360);
    for (var i = 0; i < anzahl; i++) {
      var rad = innen + abstand * i;
      var bogen = el('path', {
        d: bogenPfad(mx, my, rad, start + r.spanne(-14, 14), start + r.spanne(190, 340)),
        stroke: tinte(i % 4 === 3 ? gegen : fuehrend),
        'stroke-width': n(r.spanne(2, 6) * (geo.k / 800))
      });
      if (i % 3 === 2) {
        bogen.setAttribute('stroke-dasharray',
          n(r.spanne(8, 60)) + ' ' + n(r.spanne(8, 60)));
      }
      gruppe.appendChild(bogen);
    }
    return gruppe;
  }

  /* Ebene 7: Beschnitt- und Passermarken plus Kontrollstreifen. Beim Portraet
     steht rechts neben dem Streifen die Initialen-Kennung. */
  function baueMarken(geo, initialen) {
    var gruppe = el('g', { 'class': 'artwork__marken' });
    var winkel = el('g', {
      fill: 'none', stroke: 'var(--artwork-marken)', 'stroke-width': 1.5
    });
    var rand = 24, laenge = 40;
    var ecken = [
      [rand, rand, 1, 1],
      [geo.b - rand, rand, -1, 1],
      [rand, geo.h - rand, 1, -1],
      [geo.b - rand, geo.h - rand, -1, -1]
    ];
    for (var i = 0; i < ecken.length; i++) {
      var e = ecken[i];
      winkel.appendChild(el('path', {
        d: 'M ' + n(e[0]) + ' ' + n(e[1] + e[3] * laenge) +
           ' L ' + n(e[0]) + ' ' + n(e[1]) +
           ' L ' + n(e[0] + e[2] * laenge) + ' ' + n(e[1])
      }));
    }
    gruppe.appendChild(winkel);

    var kennungBreite = initialen ? 26 * initialen.length + 14 : 0;
    var kachel = 18, spalt = 6;
    var streifenBreite = kachel * 4 + spalt * 3;
    var sx = geo.b - rand - kennungBreite - streifenBreite;
    var sy = geo.h - rand - kachel;
    var farben = [
      'var(--artwork-ink-a)',
      'var(--artwork-ink-b)',
      'var(--artwork-ueberdruck)',
      'var(--artwork-marken)'
    ];
    var streifen = el('g', { 'class': 'artwork__kontrolle' });
    for (var j = 0; j < farben.length; j++) {
      streifen.appendChild(el('rect', {
        x: n(sx + j * (kachel + spalt)), y: n(sy),
        width: kachel, height: kachel, fill: farben[j]
      }));
    }
    gruppe.appendChild(streifen);

    if (initialen) {
      var kennung = el('text', {
        'class': 'artwork__kennung',
        x: n(geo.b - rand), y: n(geo.h - rand - 1),
        'text-anchor': 'end',
        'font-family': MONO,
        'font-size': 26,
        'letter-spacing': 2,
        fill: 'var(--artwork-marken)'
      });
      kennung.textContent = initialen;
      gruppe.appendChild(kennung);
    }
    return gruppe;
  }

  /* Ebene 2: Papierkorn. Nur in den grossen Formaten - in Dutzenden kleiner
     SVGs waere feTurbulence der einzige echte Leistungsfresser. */
  function baueKorn(uid, f, saat, defs) {
    var fid = uid + '-korn';
    var filter = el('filter', {
      id: fid, filterUnits: 'userSpaceOnUse',
      x: 0, y: 0, width: f.b, height: f.h,
      'color-interpolation-filters': 'sRGB'
    });
    filter.appendChild(el('feTurbulence', {
      type: 'fractalNoise', baseFrequency: '0.9', numOctaves: 3,
      seed: saat % 1000, stitchTiles: 'stitch'
    }));
    filter.appendChild(el('feColorMatrix', {
      type: 'matrix',
      values: '0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0.55 0.55 0.55 0 0'
    }));
    defs.appendChild(filter);
    /* Die Deckkraft setzt CSS (.09 dunkel / .13 hell). Der Praesentations-
       Attributwert ist nur der Rueckfall und wird von jeder CSS-Regel
       ueberschrieben. Die Blendmethode kommt ebenfalls aus CSS, nie aus JS. */
    var gruppe = el('g', { 'class': 'artwork__korn', opacity: 0.11 });
    gruppe.appendChild(el('rect', {
      x: 0, y: 0, width: f.b, height: f.h, filter: 'url(#' + fid + ')'
    }));
    return gruppe;
  }

  /* ============================================================
     7 · BLATT-ZUSAMMENBAU
     ============================================================ */

  function baueBlatt(art, formatSchluessel, seedStr, rubrikId, label, initialen, buehne) {
    var f = FORMATE[formatSchluessel];
    var hash = fnv1a(seedStr);
    var r = Zufall(seedStr);
    var svg = baueWurzel(art, f.b, f.h, seedStr, label, 0);
    var defs = el('defs');
    svg.appendChild(defs);

    var geo = {
      b: f.b, h: f.h,
      k: Math.min(f.b, f.h),
      m: (f.b + f.h) / 2,
      cx: f.b / 2, cy: f.h / 2
    };

    /* Ruhezone und Komposition werden genau einmal gezogen: Beide Auszuege
       zeigen dasselbe Motiv, nur anders gewuerfelt. */
    var ruhe = { oben: r.chance(0.5), links: r.chance(0.5) };
    var kompo = KOMPOSITIONEN[r.ganz(0, KOMPOSITIONEN.length - 1)];
    var satz = {
      geo: geo, ruhe: ruhe, rubrik: rubrikId, kompo: kompo,
      kasten: satzKasten(geo, ruhe), raster: !!f.weite, buehne: buehne || 'cover'
    };
    /* Das Kuenstlerportraet hat eine feste Buehne: Kopf im oberen Drittel,
       Schultern laufen unten aus dem Blatt. */
    if (satz.buehne === 'portraet') {
      satz.kopf = {
        x: geo.b * r.spanne(0.40, 0.60),
        y: geo.h * r.spanne(0.28, 0.38)
      };
      satz.requisit = REQUISITEN[r.ganz(0, REQUISITEN.length - 1)];
    }

    /* 1 Papier */
    svg.appendChild(el('rect', {
      'class': 'artwork__papier',
      x: 0, y: 0, width: f.b, height: f.h, fill: 'var(--artwork-papier)'
    }));

    var uid = 'rille-aw-' + (++lauf);

    /* 2 Korn */
    if (f.korn) { svg.appendChild(baueKorn(uid, f, hash, defs)); }

    var auszugA = baueAuszug(satz, 'a', Zufall(seedStr + '#a'));
    var auszugB = baueAuszug(satz, 'b', Zufall(seedStr + '#b'));

    /* Passerfehler: ganzzahliger Versatz, bezogen auf 1000 px Kantenlaenge,
       mindestens plus/minus 4, dazu eine winzige Drehung um die Blattmitte. */
    var grenze = Math.max(4, Math.round(16 * geo.k / 1000));
    var dx = Math.round(r.spanne(-grenze, grenze));
    var dy = Math.round(r.spanne(-grenze, grenze));
    var dreh = r.spanne(-1.2, 1.2);
    var versatz = 'translate(' + dx + ' ' + dy + ') rotate(' +
      n(dreh) + ' ' + n(geo.cx) + ' ' + n(geo.cy) + ')';

    /* 3 Auszug A */
    var gA = auszugGruppe('a', null);
    for (var i = 0; i < auszugA.voll.length; i++) { gA.appendChild(auszugA.voll[i]); }
    svg.appendChild(gA);

    /* 4 Auszug B, um den Passerfehler verschoben */
    var gB = auszugGruppe('b', versatz);
    for (var j = 0; j < auszugB.voll.length; j++) { gB.appendChild(auszugB.voll[j]); }
    svg.appendChild(gB);

    /* 5 Halbton */
    if (satz.raster) {
      var halbton = el('g', { 'class': 'artwork__halbton' });
      var teilA = halbtonTeil(uid, f, 'a', auszugA.gerastert, null);
      var teilB = halbtonTeil(uid, f, 'b', auszugB.gerastert, versatz);
      if (teilA) { defs.appendChild(teilA.muster); defs.appendChild(teilA.schnitt); halbton.appendChild(teilA.gruppe); }
      if (teilB) { defs.appendChild(teilB.muster); defs.appendChild(teilB.schnitt); halbton.appendChild(teilB.gruppe); }
      if (teilA || teilB) { svg.appendChild(halbton); }
    }

    /* 6 Rille */
    svg.appendChild(baueRille(r, geo, ruhe, RUBRIKEN[rubrikId]));

    /* 7 Marken und Kontrollstreifen */
    if (f.marken) { svg.appendChild(baueMarken(geo, initialen)); }

    return svg;
  }

  /* ============================================================
     8 · OEFFENTLICHE FUNKTIONEN
     Keine wirft je eine Ausnahme: jeder Fehler endet in einem neutralen
     Papierblatt (bauplan 4.1 und 4.4).
     ============================================================ */

  function optionenOder(wert) {
    return (wert && typeof wert === 'object') ? wert : {};
  }

  function hero(seed, rubrikId, optionen) {
    var o = optionenOder(optionen);
    var schluessel = (o.format === 'breit') ? 'hero-breit' : 'hero-hoch';
    var f = FORMATE[schluessel];
    var seedStr = seedText(seed, o.streuung);
    try {
      return baueBlatt('hero', schluessel, seedStr, rubrikOder(rubrikId), o.label, '', 'cover');
    } catch (fehler) {
      return ersatzBlatt('hero', f.b, f.h, seedStr, 0);
    }
  }

  function cover(seed, rubrikId, groesse, optionen) {
    /* Wer die Optionen an dritter Stelle uebergibt, bekommt trotzdem ein Bild. */
    if (groesse && typeof groesse === 'object') { optionen = groesse; groesse = null; }
    var o = optionenOder(optionen);
    var schluessel = (typeof groesse === 'string' && GROESSEN[groesse])
      ? GROESSEN[groesse] : GROESSEN.mittel;
    var f = FORMATE[schluessel];
    var seedStr = seedText(seed, o.streuung);
    try {
      return baueBlatt('cover', schluessel, seedStr, rubrikOder(rubrikId), o.label, '', 'cover');
    } catch (fehler) {
      return ersatzBlatt('cover', f.b, f.h, seedStr, 0);
    }
  }

  function portraet(seed, initialen, optionen) {
    if (initialen && typeof initialen === 'object') { optionen = initialen; initialen = ''; }
    var o = optionenOder(optionen);
    var kennung = '';
    if (typeof initialen === 'string' || typeof initialen === 'number') {
      kennung = String(initialen).slice(0, 2).toUpperCase();
    }
    var f = FORMATE.portraet;
    var seedStr = seedText(seed, o.streuung);
    try {
      /* Duoton aus den beiden Druckfarben; die Kuenstlerfarben gehen als
         Streuwert in den Seed ein, nie als CSS-Farbe (ENTSCHEIDUNG 0.11). */
      return baueBlatt('portraet', 'portraet', seedStr, 'portraet', o.label, kennung, 'portraet');
    } catch (fehler) {
      return ersatzBlatt('portraet', f.b, f.h, seedStr, 0);
    }
  }

  /* Miniatur-Rillenkreis fuer Playlist und Marken: kein Raster, kein Korn,
     keine Marken - hoechstens zehn Elemente. */
  function rillenmarke(seed, rubrikId, px) {
    var kante = zahlOder(px, 28);
    var seedStr = seedText(seed, rubrikId);
    try {
      var rid = rubrikOder(rubrikId);
      var fuehrend = RUBRIKEN[rid];
      var gegen = fuehrend === 'a' ? 'b' : 'a';
      var r = Zufall(seedStr);
      var svg = baueWurzel('rillenmarke', 100, 100, seedStr, '', kante);

      svg.appendChild(el('rect', {
        'class': 'artwork__papier', x: 0, y: 0, width: 100, height: 100,
        fill: 'var(--artwork-papier)'
      }));

      var mx = r.spanne(44, 58);
      var my = r.spanne(44, 58);
      var gGegen = auszugGruppe(gegen, null);
      gGegen.appendChild(el('circle', {
        cx: n(mx + r.spanne(-4, 4)), cy: n(my + r.spanne(-4, 4)),
        r: n(r.spanne(30, 40)), fill: 'none', 'stroke-width': n(r.spanne(5, 9))
      }));
      svg.appendChild(gGegen);

      var gHaupt = auszugGruppe(fuehrend, null);
      gHaupt.appendChild(el('circle', { cx: n(mx), cy: n(my), r: n(r.spanne(7, 11)) }));
      var ringe = r.ganz(2, 4);
      for (var i = 1; i <= ringe; i++) {
        gHaupt.appendChild(el('circle', {
          cx: n(mx), cy: n(my), r: n(12 + i * r.spanne(7, 10)),
          fill: 'none', 'stroke-width': n(r.spanne(3, 6))
        }));
      }
      svg.appendChild(gHaupt);
      return svg;
    } catch (fehler) {
      return ersatzBlatt('rillenmarke', 100, 100, seedStr, kante);
    }
  }

  /* Tarifmarken: drei feste, klar unterscheidbare Embleme. Deterministisch
     ueber die Tarif-ID, damit dieselbe Karte immer dieselbe Marke traegt. */
  var TARIFE = { digital: 1, print: 1, soli: 1 };

  function tarifmarke(tarifId, px) {
    var id = (typeof tarifId === 'string' && TARIFE[tarifId]) ? tarifId : 'digital';
    var kante = zahlOder(px, 96);
    var seedStr = seedText('tarif-' + id, '');
    try {
      var r = Zufall(seedStr);
      var svg = baueWurzel('tarifmarke', 100, 100, seedStr, '', kante);
      svg.appendChild(el('rect', {
        'class': 'artwork__papier', x: 0, y: 0, width: 100, height: 100,
        fill: 'var(--artwork-papier)'
      }));
      var gA = auszugGruppe('a', null);
      var gB = auszugGruppe('b', 'translate(3 -2)');

      if (id === 'digital') {
        /* Signalfeld: Rasterquadrat mit einer Vollscheibe darin. */
        for (var y = 0; y < 4; y++) {
          for (var x = 0; x < 4; x++) {
            gB.appendChild(el('circle', {
              cx: n(28 + x * 15), cy: n(28 + y * 15), r: n(r.spanne(3.6, 5.4))
            }));
          }
        }
        gA.appendChild(el('circle', { cx: 50, cy: 50, r: 17 }));
      } else if (id === 'print') {
        /* Bogen mit umgeknickter Ecke und zwei Satzzeilen. */
        gB.appendChild(el('polygon', { points: '24,18 66,18 78,32 78,82 24,82' }));
        gA.appendChild(el('polygon', { points: '66,18 78,32 66,32' }));
        gA.appendChild(el('rect', { x: 34, y: 44, width: 34, height: 6 }));
        gA.appendChild(el('rect', { x: 34, y: 58, width: 24, height: 6 }));
      } else {
        /* Zwei Ringe, die einander ueberdrucken - das Soli-Motiv. */
        gA.appendChild(el('circle', { cx: 40, cy: 50, r: 24, fill: 'none', 'stroke-width': 9 }));
        gB.appendChild(el('circle', { cx: 62, cy: 50, r: 24, fill: 'none', 'stroke-width': 9 }));
        gA.appendChild(el('rect', { x: 14, y: 84, width: 72, height: 6 }));
      }
      svg.appendChild(gA);
      svg.appendChild(gB);
      return svg;
    } catch (fehler) {
      return ersatzBlatt('tarifmarke', 100, 100, seedStr, kante);
    }
  }

  /* Oberflaechen-Icons. Ersetzen jede Icon-Font, jedes Emoji, jede Bilddatei.
     Farbe immer currentColor, nie ein Token und nie ein Literal. */
  var SYMBOLE = {
    thema: function (g) {
      /* Halb gefuellter Kreis (AD 5.1): der Umriss bleibt, die Fuellung
         wechselt beim Themenwechsel die Seite - ohne Drehung. */
      g.appendChild(el('circle', { cx: 12, cy: 12, r: 8 }));
      g.appendChild(el('path', {
        d: 'M 12 4 A 8 8 0 0 1 12 20 Z', fill: 'currentColor', stroke: 'none'
      }));
    },
    lupe: function (g) {
      g.appendChild(el('circle', { cx: 11, cy: 11, r: 6 }));
      g.appendChild(el('path', { d: 'M 15.5 15.5 L 20 20' }));
    },
    kreuz: function (g) {
      g.appendChild(el('path', { d: 'M 6 6 L 18 18 M 18 6 L 6 18' }));
    },
    haken: function (g) {
      g.appendChild(el('path', { d: 'M 5 12.5 L 10 17.5 L 19 6.5' }));
    },
    warnung: function (g) {
      g.appendChild(el('path', { d: 'M 12 4 L 21 19.5 L 3 19.5 Z' }));
      g.appendChild(el('path', { d: 'M 12 10 L 12 14' }));
      g.appendChild(el('circle', { cx: 12, cy: 16.8, r: 0.9, fill: 'currentColor', stroke: 'none' }));
    },
    'pfeil-links': function (g) {
      g.appendChild(el('path', { d: 'M 19 12 L 5 12 M 10.5 6.5 L 5 12 L 10.5 17.5' }));
    },
    'pfeil-rechts': function (g) {
      g.appendChild(el('path', { d: 'M 5 12 L 19 12 M 13.5 6.5 L 19 12 L 13.5 17.5' }));
    },
    chevron: function (g) {
      g.appendChild(el('path', { d: 'M 6 9.5 L 12 15.5 L 18 9.5' }));
    },
    punkt: function (g) {
      g.appendChild(el('circle', { cx: 12, cy: 12, r: 4.5, fill: 'currentColor', stroke: 'none' }));
    }
  };

  function symbol(name, px) {
    var kante = zahlOder(px, 20);
    var schluessel = (typeof name === 'string' && SYMBOLE[name]) ? name : '';
    try {
      var svg = el('svg', {
        viewBox: '0 0 24 24',
        preserveAspectRatio: 'xMidYMid slice',
        width: kante, height: kante,
        focusable: 'false',
        'aria-hidden': 'true',
        'class': 'artwork artwork--symbol',
        'data-seed': schluessel || 'leer'
      });
      if (!schluessel) { return svg; }
      var g = el('g', {
        fill: 'none', stroke: 'currentColor', 'stroke-width': 2,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      SYMBOLE[schluessel](g);
      svg.appendChild(g);
      return svg;
    } catch (fehler) {
      try {
        return el('svg', {
          viewBox: '0 0 24 24', width: kante, height: kante,
          focusable: 'false', 'aria-hidden': 'true',
          'class': 'artwork artwork--symbol', 'data-seed': 'leer'
        });
      } catch (weiter) { return null; }
    }
  }

  /* ============================================================
     9 · INSTALLATION
     ============================================================ */

  G.RILLE_ARTWORK = {
    hero: hero,
    cover: cover,
    portraet: portraet,
    rillenmarke: rillenmarke,
    tarifmarke: tarifmarke,
    symbol: symbol
  };
  G.RilleArtwork = G.RILLE_ARTWORK;                       /* Alias, ENTSCHEIDUNG 0.8 */
  G.rilleTarifGrafik = function (id, breite) {            /* Haken aus AF 1.5 */
    return G.RILLE_ARTWORK.tarifmarke(id, breite);
  };
}());
