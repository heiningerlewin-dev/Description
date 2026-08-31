/*!
 * RILLE – Magazin für unabhängige Musik
 * assets/js/data.js · Datenschicht (Bauplan Abschnitt 3)
 *
 * Klassisches Script, kein Modul, keine Abhängigkeiten, keine Netzwerkanfragen.
 * Legt genau eine globale Konstante an: window.RILLE_DATA. Der Datensatz ist tief
 * eingefroren, enthält keine Funktionen, keine Klassen, keine Nebenwirkungen und
 * greift nirgends auf das DOM zu. data.js wird als erstes der drei Skripte geladen
 * und läuft, bevor artwork.js und app.js existieren.
 *
 * Ableitungen (formatiertes Datum, Suchindex, Trefferzahlen, Gesamtspieldauer)
 * gehören nach Bauplan 3.3 ausdrücklich in app.js, nicht hierher.
 *
 * Quellen: artikel.json (13 Beiträge, wörtlich übernommen), kuenstler.json
 * (8 Porträts, nach Bauplan 3.6 von Hand in korrekte deutsche Schreibung
 * übertragen), abo-formular.md Abschnitt 1 (Tarife, Intervalle, Länder),
 * bauplan.md 3.5 (Playlist) und 3.8 (Sortierungen).
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Stammdaten des Magazins (Bauplan 3.1)
  // =========================================================================

  const VERSION = 1;
  const STAND = '2026-08-31';               // Redaktionsschluss, ISO-Datum
  const AUFMACHER_ID = 'kanal-nord-schleusenzeit';

  const magazin = {
    name: 'RILLE',
    claim: 'Magazin für unabhängige Musik',
    jahr: 2026
  };

  // =========================================================================
  // 2. Rubriken (Bauplan 3.2)
  //    id  = ASCII, klein, einzige Größe, mit der Code arbeitet
  //    label = sichtbarer Text in korrektem Deutsch
  //    ink = führende Druckfarbe des Artworks, kurz = Kürzel für enge Spalten
  // =========================================================================

  const rubriken = [
    { id: 'rezension',  label: 'Rezension',  ink: 'a', kurz: 'Rez' },
    { id: 'interview',  label: 'Interview',  ink: 'b', kurz: 'Int' },
    { id: 'portraet',   label: 'Porträt',    ink: 'b', kurz: 'Por' },
    { id: 'live',       label: 'Live',       ink: 'a', kurz: 'Liv' },
    { id: 'kolumne',    label: 'Kolumne',    ink: 'b', kurz: 'Kol' },
    { id: 'entdeckung', label: 'Entdeckung', ink: 'a', kurz: 'Ent' }
  ];

  // =========================================================================
  // 3. Beiträge (Bauplan 3.3)
  //    13 Stück, absteigend nach Datum. Wörtlich aus artikel.json; geändert
  //    wurden nur die Schlüssel: rubrik -> rubrikId + rubrikLabel,
  //    kicker_zitat -> kickerZitat. farbe bleibt erhalten und dient allein als
  //    Streuwert für den Artwork-Seed (ENTSCHEIDUNG 0.11).
  // =========================================================================

  const artikel = [
    {
      id: 'kanal-nord-schleusenzeit',
      rubrikId: 'portraet',
      rubrikLabel: 'Porträt',
      titel: 'Kanal Nord und die Geduld der Maschinen',
      dachzeile: 'Krautrock am Hafen',
      teaser:
        'Seit sieben Jahren proben Kanal Nord in einer Werkhalle am Duisburger Hafen. Ihr drittes Album »Schleusenzeit« entstand in einer einzigen Nacht, mit zwei Mikrofonen und einem Bandecho von 1974. Ein Besuch bei einer Band, die das Warten zum Prinzip erklärt hat.',
      fliesstext: [
        'Die Halle in Duisburg-Ruhrort hat kein Schild, nur eine Nummer: 14. Dahinter stehen ein Orgelklon aus DDR-Produktion, zwei Bassverstärker, die nach Staub riechen, und ein Schlagzeug, dessen Standtom mit Paketband geflickt ist. Renke Bohl schiebt das Tor zu, und der Hafenlärm draußen wird zu einem Brummen, das man eher im Brustkorb spürt als hört. „Das ist auf der Platte drauf“, sagt er und zeigt mit dem Daumen nach hinten. „Bei Minute sieben schiebt sich ein Schubverband vorbei. Wir haben ihn drin gelassen.“',
        'Kanal Nord, das sind Bohl an Orgel und Bandmaschine, Ida Sperling am Bass, Mehmet Cengiz an der Gitarre und seit 2023 Wibke Ohlert am Schlagzeug. Gegründet wurde die Band 2019 als Duo, aus Frust über eine Vorgängerband, die zu viele Songs hatte und zu wenig Ausdauer. Der erste Auftritt dauerte 22 Minuten und bestand aus zwei Stücken. Sperling erinnert sich präzise ans Publikum: „Vier Leute, drei davon aus dem Haus. Der vierte hat nach zehn Minuten gefragt, wann das Lied endlich anfängt. Wir haben das als Kompliment verbucht.“',
        '»Schleusenzeit« ist an einem Donnerstag im November entstanden, zwischen 21 und 4 Uhr. Ohlert hatte am Morgen darauf Frühschicht im Logistikzentrum, deshalb der Zeitdruck – das einzige Tempo, das diese Band je akzeptiert hat. Zwei Großmembranmikrofone hingen an einem Wäscheständer in der Hallenmitte, alles andere kam über die Raumluft. Wer genau hinhört, erkennt in »Ruhrort Nachtfahrt« das Klacken der Heizungsrohre, das sich nach zwei Dritteln in den Takt einfädelt, als hätte es dazugehört.',
        'Musikalisch ist das kein Museumsbesuch. Der Motorik-Puls sitzt, klar, aber Cengiz spielt seine Gitarre wie ein Werkzeug, das man kurz ansetzt und dann wieder weglegt: drei Töne, Pause, drei Töne. Sperlings Bass verweigert jede Auflösung. Und Bohls Orgel liegt darüber wie Nebel über einem Parkplatz, mal freundlich, mal drohend. Nach elf Minuten kippt »Kaltwasser« in eine Passage, in der niemand mehr die Eins spielt und alle trotzdem zusammenbleiben. Das ist keine Nostalgie, das ist Handwerk.',
        'Veröffentlicht wird die Platte beim Bochumer Kassettenamt, einem Label, das aus einer Kellerwohnung heraus 300er-Auflagen presst und die Bandbetreuung per Telefon erledigt. Labelchefin Doro Winkelmann sagt, sie habe bei Kanal Nord nie über Singles diskutieren müssen: „Bei denen ist die kürzeste Nummer sechs Minuten lang. Da hört das Gespräch von selbst auf.“ Verkauft wird vor allem am Merch-Tisch, in Duisburg, Dortmund, Gelsenkirchen, und über einen Plattenladen in Utrecht, von dem niemand weiß, wie er von der Band erfahren hat.',
        'Im Oktober spielen Kanal Nord zwölf Konzerte, dann ist erst mal Ruhe. Sperling arbeitet halbtags in der Stadtbücherei, Cengiz hat ein Kind bekommen. Auf die Frage, ob sie Angst vor dem Stillstand haben, lacht Bohl kurz und schüttelt den Kopf. Draußen zieht wieder ein Frachter durch, die Halle vibriert leise mit, und er wartet, bis das Geräusch vorbei ist, bevor er antwortet. „Wir spielen nicht schneller. Wir hören nur später auf.“ Dann macht er die Anlage an, und die Orgel braucht ihre üblichen vierzig Sekunden, bis sie warm ist.'
      ],
      autor: { name: 'Jule Kastner', kuerzel: 'JK', rolle: 'Redakteurin' },
      datum: '2026-08-27',
      lesezeit: 11,
      tags: ['krautrock', 'duisburg', 'proberaum', 'motorik', 'kassettenamt'],
      kickerZitat: 'Wir spielen nicht schneller. Wir hören nur später auf.',
      farbe: '#ff6a3d',
      artworkSeed: 1187
    },

    {
      id: 'halbschatten-ostwerk',
      rubrikId: 'rezension',
      rubrikLabel: 'Rezension',
      titel: 'Ostwerk: Beton, der atmet',
      dachzeile: 'Post-Punk aus Leipzig',
      teaser:
        'Fünf Jahre nach dem letzten Lebenszeichen legen Halbschatten aus dem Leipziger Osten mit »Ostwerk« ein Album vor, das den Post-Punk-Baukasten genau kennt und ihn trotzdem nicht bedient. Acht Stücke, kaum Refrains, dafür ein Bass, der klingt wie eine schlecht geschlossene Tür.',
      fliesstext: [
        'Der Einstieg ist eine Zumutung, und zwar eine gut geplante. »Torhaus« beginnt mit 48 Sekunden Bass, allein, ohne Hall, dazu ein Hi-Hat-Zischen, das immer eine Winzigkeit zu früh kommt. Wer in dieser knappen Minute nicht aussteigt, bekommt danach eine Band, die das Prinzip Anspannung besser verstanden hat als die meisten ihrer Altersgenossen. Halbschatten interessieren sich nicht für den Ausbruch. Sie interessieren sich für die Sekunde davor, und die dehnen sie, bis es unangenehm wird.',
        'Judith Rehm singt tief und gerade, fast ohne Vibrato, und sie singt in kurzen Sätzen. „Ich habe den Schlüssel dabei / ich gehe trotzdem außen herum“ heißt es in »Postfach«, und das ist ungefähr der emotionale Radius der Platte: Leute, die vor ihren eigenen Wohnungen stehen und überlegen. Die Texte kommen ohne Metaphernballast aus, sie zählen Dinge auf – Treppenhäuser, Pfandflaschen, ein defektes Klingelschild. Genau das macht sie unheimlich, weil man alles mitgeht, ohne zu merken, wohin.',
        'Aufgenommen wurde »Ostwerk« im Silberdistel-Studio in Halle, in vierzehn Tagen, mit einem Mischpult, das laut Produzent Arne Küssner „mehr Fehler kann als ein Mensch“. Die Gitarren von Toni Bahnert liegen deshalb nicht sauber im Bild, sondern hängen leicht schief drin, als wäre das Stereofeld verzogen. Das nervt beim ersten Hören und trägt beim vierten. Die Bassdrum klingt wie ein Karton, in den jemand kurz hineintritt: kein Fundament, sondern eine Verabredung.',
        'Nicht alles gelingt. In der Mitte der Platte, zwischen »Fensterlos« und »Sechs Uhr Ost«, verliert die Band für rund neun Minuten den Gegner. Zwei Stücke, die dieselbe Idee mit demselben Tempo verhandeln, dazu ein Synthesizer-Motiv, das offenbar niemand mehr streichen wollte. Man merkt, wie viel Halbschatten von Reibung leben: Sobald sich alle einig sind, wird die Musik höflich. Höflichkeit ist die einzige Sünde, die sich diese vier Leute nicht leisten dürfen.',
        'Trotzdem: »Ostwerk« ist das erste Album seit Langem aus dieser Stadt, das nicht klingt, als sei es für ein Festivalprogramm entworfen worden. Es endet mit »Nachtschicht Halle 3«, sieben Minuten, in denen Rehm irgendwann aufhört zu singen und die Band einfach weiterläuft, langsamer werdend, bis der Verstärker das letzte Wort hat. Kein großer Schluss. Nur jemand, der das Licht ausmacht und geht. Genau so muss diese Platte enden.'
      ],
      autor: { name: 'Tobias Merz', kuerzel: 'TM', rolle: 'Redakteur' },
      datum: '2026-08-24',
      lesezeit: 6,
      tags: ['post-punk', 'leipzig', 'album', 'gitarre'],
      kickerZitat: 'Halbschatten interessieren sich nicht für den Ausbruch, sondern für die Sekunde davor.',
      farbe: '#7ce0c4',
      artworkSeed: 4412
    },

    {
      id: 'marla-fenn-interview',
      rubrikId: 'interview',
      rubrikLabel: 'Interview',
      titel: 'Marla Fenn über das Aufhören',
      dachzeile: 'Gespräch am Küchentisch',
      teaser:
        'Marla Fenn hat im Frühjahr eine ausverkaufte Tour abgesagt, ihren Vertrag aufgelöst und danach in vier Wochen »Zwölf Zimmer« aufgenommen. Ein Gespräch über Physiotherapie, Fördergelder und die Frage, warum sie ihre besten Songs zuerst der Nachbarin vorspielt.',
      fliesstext: [
        'Marla Fenn wohnt im dritten Stock eines Neuköllner Hinterhauses, die Küche ist gleichzeitig Studio. Auf dem Tisch: ein Kassettenrekorder, ein Aschenbecher voller Gitarrenplektren, ein Ordner mit Abrechnungen. Sie hat Kaffee gemacht, in einer Kanne mit abgeplatztem Ausguss, und stellt sofort klar, dass sie über die abgesagte Tour reden will, aber nicht über die Krankschreibung. Das sei die Grenze. Sie sagt das freundlich, aber so, wie man eine Tür zuzieht, die zugezogen bleiben soll.',
        'RILLE: Sie hatten 23 ausverkaufte Termine. Was war der Moment, in dem Sie wussten, dass Sie absagen? – Fenn: Es war kein Moment, das ist ja der Mist. Es war ein Formular. Ich saß in Kassel im Backstage und habe eine Abrechnung ausgefüllt, und ich merkte, dass ich nicht mehr wusste, welche Stadt draußen ist. Nicht metaphorisch. Ich wusste es wirklich nicht. Und dann habe ich ausgerechnet, dass ich bei zwölf weiteren Konzerten ungefähr 400 Euro Plus machen würde. Das war der Moment, ja.',
        'RILLE: Auf »Zwölf Zimmer« klingen Sie näher als je zuvor, teilweise hört man den Stuhl knarzen. Absicht? – Fenn: Notwendigkeit, und dann Absicht. Ich hatte kein Studiobudget mehr. Also habe ich in der Küche aufgenommen, mit einem Mikrofon, das ein Freund im Umzugskarton hatte. Und irgendwann habe ich gemerkt: Wenn man das Zimmer mitaufnimmt, muss man weniger erklären. Der Raum macht die Hälfte der Arbeit. Man singt anders, wenn man weiß, dass die Nachbarn mithören.',
        'RILLE: Sie arbeiten weiterhin drei Tage die Woche als Physiotherapeutin. Viele würden das als Scheitern lesen. – Fenn: Viele lesen falsch. Ich habe zehn Jahre lang geglaubt, dass Musik erst zählt, wenn sie die Miete bezahlt. Das war ein Denkfehler, der mich fast die Musik gekostet hat. In der Praxis rede ich den ganzen Tag mit Leuten über ihre Schultern, und die Hälfte der Sätze auf dem Album stammt von dort. Ich schreibe besser, seit ich nicht mehr schreiben muss.',
        'RILLE: Sie spielen neue Stücke zuerst Ihrer Nachbarin vor. Warum ihr? – Fenn: Weil Frau Öztürk 71 ist und keine Ahnung von Indie hat. Sie sagt Sachen wie: Das dauert zu lang, bis du anfängst. Oder: Warum bist du bei dem Wort so leise. Das ist das beste Lektorat, das ich je hatte. Ein Kollege würde mir erzählen, welche Referenz er hört. Sie erzählt mir, was ankommt. Ich brauche keine Einordnung, ich brauche jemanden, der ehrlich gelangweilt ist, wenn es langweilig ist.',
        'RILLE: Was passiert im Herbst? – Fenn: Sechs Konzerte, alles in Reichweite eines Regionalzugs. Keine Vorgruppe, kein Techniker, ein Koffer. Wenn es sich gut anfühlt, mache ich mehr. Wenn nicht, höre ich wieder auf, und diesmal ohne Drama. Das ist der eigentliche Luxus, den ich mir erkämpft habe: Ich darf jederzeit gehen. Sie schiebt die Kanne beiseite und greift zur Gitarre, ohne sie zu stimmen. Der Ton ist ein bisschen daneben, und sie lässt ihn stehen.'
      ],
      autor: { name: 'Nasrin Vogt', kuerzel: 'NV', rolle: 'freie Autorin' },
      datum: '2026-08-20',
      lesezeit: 9,
      tags: ['diy-pop', 'songwriting', 'neukoelln', 'interview', 'selbstverlag'],
      kickerZitat: 'Ich schreibe besser, seit ich nicht mehr schreiben muss.',
      farbe: '#f2c14e',
      artworkSeed: 733
    },

    {
      id: 'schleifbock-autoklav',
      rubrikId: 'live',
      rubrikLabel: 'Live',
      titel: 'Schleifbock, vierzig Minuten ohne Luft',
      dachzeile: 'Noise in Wuppertal',
      teaser:
        'Im Wuppertaler Autoklav spielte das Noise-Duo Schleifbock ein Set ohne Pause, ohne Ansage und ohne erkennbare Songgrenzen. 90 Leute waren da, 14 gingen früher. Über einen Abend, an dem der Hallenboden mehr Bass abbekam als die Anlage vertrug.',
      fliesstext: [
        'Das Autoklav ist eine ehemalige Färberei an der Schwebebahnstrecke, und alle zwei Minuten fährt oben eine vorbei. Wer hier Noise spielt, hat einen Mitspieler, den er nicht einladen musste. Um kurz nach zehn stehen Kim Sabrowski und Vitali Gebhardt ohne Ankündigung auf der Bühne, Rücken zum Publikum, und drehen die Verstärker auf. Kein Licht außer zwei Baustrahlern, die den Raum in ein Krankenhausweiß tauchen, in dem man jedes Gesicht sieht. Das ist unangenehm, und das ist der Plan.',
        'Die erste Viertelstunde besteht aus einem einzigen Akkord, der langsam kaputtgeht. Sabrowski spielt eine Halbresonanzgitarre mit einem Bogen, Gebhardt bearbeitet ein Effektgerät, das aussieht wie ein Sicherungskasten. Es passiert kaum etwas, und trotzdem wird der Raum von Minute zu Minute enger. Neben mir hält jemand seinem Freund die Ohren zu, wie bei einem Feuerwerk. Ein anderer filmt zwanzig Sekunden lang und steckt das Handy dann weg, weil es offensichtlich sinnlos ist.',
        'Der Bruch kommt bei etwa Minute achtzehn, ohne Vorwarnung. Gebhardt tritt auf drei Pedale gleichzeitig, und der Ton fällt eine Oktave tiefer, so tief, dass der Betonboden ihn übernimmt. Man spürt ihn in den Fußsohlen, bevor man ihn hört. Zwei Gläser fallen von der Fensterbank, niemand hebt sie auf. Was danach kommt, hat keine Struktur, die sich beschreiben ließe, aber eine Richtung: immer weiter nach unten, mit gelegentlichen Ausbrüchen nach oben, die klingen wie Metall auf Metall.',
        'Vierzehn Leute gehen im Lauf des Sets. Das ist keine schlechte Quote für Schleifbock, in Bremen waren es im Mai über dreißig. Wer bleibt, gerät in einen seltsamen Zustand zwischen Erschöpfung und Konzentration – irgendwann hört man in dem Krach Melodien, die vermutlich nicht da sind. Genau darum geht es dieser Band, sagt Sabrowski später an der Bar, in normaler Lautstärke, mit einem Apfelschorle in der Hand: „Wir liefern das Material. Zusammensetzen musst du selber.“',
        'Nach vierzig Minuten hört es einfach auf. Kein Feedback-Ausklang, kein Verbeugen: Gebhardt zieht den Stecker, das Brummen bricht ab, und die Stille danach ist der lauteste Moment des Abends. Neunzig Leute stehen da und wissen nicht, ob sie klatschen sollen. Dann fährt oben die Schwebebahn durch, jemand lacht, und der Rest löst sich auf. Draußen an der Wupper riecht es nach Regen, und man merkt erst auf dem Weg zur Haltestelle, dass die Ohren pfeifen.'
      ],
      autor: { name: 'Ole Wiechmann', kuerzel: 'OW', rolle: 'Volontär' },
      datum: '2026-08-17',
      lesezeit: 5,
      tags: ['noise', 'wuppertal', 'konzertbericht', 'duo'],
      kickerZitat: 'Wir liefern das Material. Zusammensetzen musst du selber.',
      farbe: '#9b8cff',
      artworkSeed: 2901
    },

    {
      id: 'nebelkammer-wartezeit',
      rubrikId: 'entdeckung',
      rubrikLabel: 'Entdeckung',
      titel: 'Nebelkammer macht Musik aus Wartezeit',
      dachzeile: 'Ambient aus Halle',
      teaser:
        'Eine Kassette, 46 Minuten, aufgenommen in einem Bahnhofswartesaal nach Betriebsschluss: Nebelkammer aus Halle veröffentlicht Ambient, der nicht beruhigt, sondern zuhört. Auflage 120, davon 80 verkauft. Warum das die interessanteste Neuentdeckung dieses Sommers ist.',
      fliesstext: [
        'Hinter Nebelkammer steckt Frauke Sindermann, 34, Bibliothekarin, die seit zwei Jahren Aufnahmen in leeren öffentlichen Räumen macht. Ihr Debüt »Nach Betriebsschluss« entstand im alten Wartesaal des Hallenser Ostbahnhofs, zu dem ein Bekannter aus der Verwaltung ihr für drei Nächte den Schlüssel überließ. Sie stellte ein Harmonium auf, dazu zwei Kontaktmikrofone an der Fensterbank, und ließ die Bandmaschine laufen, während draußen die Rangierarbeiten weitergingen.',
        'Was dabei herauskam, ist kein Wellness-Ambient. Die Flächen sind warm, aber sie stehen nie still, weil ständig etwas dazwischenkommt: ein Durchsagefragment, das Zischen einer Druckluftbremse, einmal ein Hund. Sindermann hat nichts davon herausgeschnitten. „Die Störung ist der Grund, warum man zuhört“, sagt sie am Telefon, ein bisschen widerwillig, weil sie Interviews unangenehm findet. „Wenn nichts passiert, schläft man ein. Ich will, dass man wach bleibt und trotzdem nichts tun muss.“',
        'Das Stück »Gleis 4, 1:50 Uhr« läuft elfeinhalb Minuten und besteht im Kern aus zwei Harmoniumakkorden, die sich abwechseln wie ein sehr langsames Atmen. Irgendwann, bei Minute sieben, kommt eine dritte Stimme dazu, die man erst für einen Fehler hält – es ist Sindermanns eigene Stimme, gesummt, eine Sekunde zu spät auf dem Band. Sie hat den Versatz gelassen. Genau diese Ungenauigkeit unterscheidet die Kassette von hundert anderen, die dieses Jahr in dieser Nische erschienen sind.',
        'Erschienen ist »Nach Betriebsschluss« beim Hallenser Kleinstlabel Bodenprobe, in einer Auflage von 120 Stück, handnummeriert, mit einem Beiblatt, auf dem die Aufnahmezeiten stehen. 80 sind weg, ohne jede Werbung, allein über zwei Plattenläden und Mundpropaganda. Wer die Kassette nicht bekommt, muss warten – ein Download ist nicht geplant, und das ist keine Pose, sondern Trotz. Nebelkammer spielt im November zum ersten Mal live, in einer Kirche in Merseburg, um 22 Uhr, Einlass ohne Ticket.'
      ],
      autor: { name: 'Britta Lanz', kuerzel: 'BL', rolle: 'freie Autorin' },
      datum: '2026-08-12',
      lesezeit: 4,
      tags: ['ambient', 'halle', 'kassette', 'harmonium'],
      kickerZitat: 'Die Störung ist der Grund, warum man zuhört.',
      farbe: '#ff5c8a',
      artworkSeed: 5560
    },

    {
      id: 'kolumne-presswerk-schuld',
      rubrikId: 'kolumne',
      rubrikLabel: 'Kolumne',
      titel: 'Warum immer das Presswerk schuld ist',
      dachzeile: 'Kolumne: Rillenschleifer',
      teaser:
        'Sechs Monate Wartezeit, dann kommt die Platte mit Schlieren im Auslauf und einem Etikett, das auf dem Kopf steht. Über die stille Vereinbarung zwischen kleinen Labels und dem Vinylwerk – und über die Frage, wem wir das eigentlich zumuten.',
      fliesstext: [
        'Es gibt in dieser Szene einen Satz, der so oft fällt, dass er inzwischen als Naturgesetz durchgeht: Das Presswerk hat sich verschoben. Er wird ausgesprochen wie eine Wetterlage, mit einem Achselzucken, gegen das man schlecht argumentieren kann. Sechs Monate werden zu neun, neun zu elf, und irgendwann steht die Band in einem Club mit einem Merch-Tisch, auf dem T-Shirts liegen und Zettel mit einem Bestellcode. Alle nicken. Alle finden das normal. Ich finde es seit ungefähr zwei Jahren nicht mehr normal.',
        'Das liegt nicht daran, dass mir die Presswerke leidtun oder nicht leidtun. Es liegt daran, dass wir uns kollektiv angewöhnt haben, ein Produktionsproblem als Charaktereigenschaft zu verkaufen. Die Wartezeit ist zum Beweis der Echtheit geworden. Wer schnell liefert, ist verdächtig; wer elf Monate braucht, ist offenbar handgemacht. Das ist ein Kurzschluss. Eine Platte wird nicht besser, weil sie später kommt. Sie kommt nur später, und die Band hat in der Zwischenzeit die Songs satt.',
        'Was dabei untergeht, ist die Rechnung dahinter. Ein Label wie das Bochumer Kassettenamt legt bei einer 300er-Auflage rund 2.400 Euro aus, bevor eine einzige Platte verkauft ist. Verschiebt sich der Termin um ein halbes Jahr, verschiebt sich auch die Tour, die den Kredit refinanzieren sollte. Es sind nicht die großen Häuser, die das trifft – die haben Kontingente. Es trifft die Leute, die abends nach der Schicht Sendungen packen und dabei ausrechnen, ob der Dezember noch geht.',
        'Man könnte daraus eine Anklage machen, aber die wäre billig. Die Werke arbeiten am Anschlag, mit Maschinen aus den Siebzigern, die von drei Menschen europaweit gewartet werden. Interessanter ist die Frage, was wir uns eigentlich wünschen. Vielleicht ist die ehrlichste Antwort: weniger Platten, dafür welche, die jemand wirklich wollte. Es gibt zu viele Veröffentlichungen, deren einziger Zweck es ist, ein Format zu bedienen, das man dann auf Instagram fotografieren kann.',
        'Also, ein Vorschlag zur Güte, ganz ohne erhobenen Zeigefinger: Kauft die Kassette. Nicht aus Nostalgie, sondern weil sie in vier Wochen fertig ist, 40 Cent im Einkauf kostet und der Band das Geld bringt, solange sie die Stücke noch mag. Und wenn die Platte dann im Februar doch noch kommt, mit Schlieren im Auslauf und einem Etikett, das auf dem Kopf klebt: umso besser. Dann ist sie ein Andenken und nicht die Bedingung dafür, dass diese Musik überhaupt stattfinden durfte.'
      ],
      autor: { name: 'Simon Ehlert', kuerzel: 'SE', rolle: 'Herausgeber' },
      datum: '2026-08-06',
      lesezeit: 5,
      tags: ['vinyl', 'labelarbeit', 'kolumne', 'oekonomie'],
      kickerZitat: 'Eine Platte wird nicht besser, weil sie später kommt.',
      farbe: '#5ec4ff',
      artworkSeed: 8123
    },

    {
      id: 'haks-randlage',
      rubrikId: 'rezension',
      rubrikLabel: 'Rezension',
      titel: 'HAKS zählt die Haltestellen',
      dachzeile: 'Rap aus Offenbach',
      teaser:
        '»Randlage« ist das zweite Album von HAKS, aufgenommen in einer Küche in Offenbach-Bieber, ohne Feature, ohne Hook-Sängerin, ohne Autotune. 41 Minuten über Buslinien, Ämter und einen Vater, der nichts erzählt. Deutschrap, der sich um Reichweite nicht kümmert.',
      fliesstext: [
        'Halim Aksoy, 29, nennt sich HAKS und rappt so, wie andere Leute Protokoll führen: leise, genau, ohne Ausrufezeichen. »Randlage« beginnt mit einer Busdurchsage, echt aufgenommen, Linie 103, und dann kommt eine der besten ersten Zeilen des Jahres: „Ich kenne die Stadt an den Stellen, wo sie aufhört.“ Der Beat darunter ist kaum vorhanden – ein Rhodes-Sample, das nach vier Takten wieder verschwindet, dazu ein Fingerschnippen, das offensichtlich in derselben Küche entstanden ist wie der Rest.',
        'Es gibt in diesem Album keinen einzigen Moment, in dem sich HAKS größer macht, als er ist. Das klingt banal, ist es aber nicht, in einem Genre, dessen Grundgrammatik die Behauptung ist. Er erzählt stattdessen von Wartenummern, von einem Chef, der ihn duzt und dabei nie den Namen richtig sagt, von einem Kumpel, der nach Frankfurt gezogen ist und jetzt nicht mehr zurückruft. Diese Beobachtungen kommen ohne Pointe, und die fehlende Pointe ist die Pointe.',
        'Musikalisch ist das riskant dünn. Produzent Ferhat Ölmez, im Umfeld als Lupenbau bekannt, arbeitet fast ausschließlich mit Samples aus türkischen Filmmusiken der Siebziger, aber er lässt sie so lange leer laufen, dass man den Raum dahinter hört. In »Bieber, sechs Uhr« läuft dreißig Sekunden nur ein Basslauf und ein Blinker. Das ist mutig und geht nicht immer auf: Zwei, drei Stücke im letzten Drittel wirken eher wie Skizzen, die man aus Loyalität dringelassen hat.',
        'Der Kern der Platte ist »Was er nicht sagt«, viereinhalb Minuten über den Vater, der 1991 nach Offenbach kam und über die Jahre davor kein Wort verliert. HAKS erzählt nicht dessen Geschichte, das wäre der einfache Weg. Er beschreibt stattdessen, wie sie zusammen im Auto sitzen und das Radio anlassen, damit niemand reden muss. Am Ende zitiert er einen einzigen Satz seines Vaters, auf Türkisch, unübersetzt. Wer kein Türkisch kann, versteht trotzdem alles, und das ist eine Regiearbeit.',
        '»Randlage« wird kein großes Publikum finden, und das weiß HAKS. Er hat die Platte selbst veröffentlicht, 500 CDs, verkauft nach Konzerten in Jugendzentren und Kulturvereinen zwischen Hanau und Rüsselsheim. Was bleibt, ist eine seltene Sache: ein Rap-Album, das seine Herkunft nicht als Marke verwendet, sondern als Adresse. Am Ende, im letzten Stück, steigt jemand aus dem Bus, die Tür zischt, und die Musik hört auf, bevor der Bus wieder anfährt. Das ist alles.'
      ],
      autor: { name: 'Nasrin Vogt', kuerzel: 'NV', rolle: 'freie Autorin' },
      datum: '2026-08-01',
      lesezeit: 7,
      tags: ['rap', 'offenbach', 'album', 'sampling', 'selbstverlag'],
      kickerZitat: 'Ich kenne die Stadt an den Stellen, wo sie aufhört.',
      farbe: '#b8e34f',
      artworkSeed: 316
    },

    {
      id: 'ferner-grauwert-portraet',
      rubrikId: 'portraet',
      rubrikLabel: 'Porträt',
      titel: 'Ferner baut Tracks aus Zimmerlautstärke',
      dachzeile: 'Club, aber leiser',
      teaser:
        'Ilka Fernau, als Ferner seit sechs Jahren im Umlauf, produziert Clubmusik auf Kopfhörern, weil ihre Wohnung hellhörig ist. Ihr Label Grauwert veröffentlicht vier Platten im Jahr, mehr nicht. Ein Nachmittag in Leipzig-Lindenau zwischen Aktenordnern und einem Drumcomputer.',
      fliesstext: [
        'Der Raum, in dem Ferner ihre Tracks baut, ist drei mal vier Meter groß und hat kein Fenster zur Straße. Auf dem Tisch: ein Drumcomputer aus zweiter Hand, ein Mischpult mit vier Kanälen, zwei Kopfhörer, davon einer ohne Bügelpolster. Monitorboxen gibt es nicht. „Die Wohnung ist hellhörig, unter mir wohnt eine Frau, die um halb sechs raus muss“, sagt Ilka Fernau, 37. „Am Anfang war das ein Problem. Jetzt ist es der Grund, warum meine Sachen so klingen, wie sie klingen.“',
        'Wie sie klingen: nach Club, aber aus zwei Zimmern Entfernung. Die Kicks sind da, aber sie stehen nicht vorne. Stattdessen passiert das Wesentliche im Mittelfeld – schmutzige Hi-Hats, Flächen, die eher Schimmel als Nebel sind, und immer wieder Sprachfetzen, die klingen, als liefe im Nachbarraum ein Fernseher. Auf der EP »Trockenraum« gibt es ein Stück, in dem der Bass erst nach viereinhalb Minuten einsetzt, und dann so leise, dass man ihn im Club eher spürt als hört.',
        'Fernau hat lange in der Verwaltung eines Krankenhauses gearbeitet, halbtags, bis 2023. Diese Jahre hört man ihrem Label an: Grauwert veröffentlicht vier Platten im Jahr, jede mit Vertrag, Abrechnung und einem Datum, das gehalten wird. „Ich habe genug Labels gesehen, die aus lauter Enthusiasmus Leute nicht bezahlen“, sagt sie. „Enthusiasmus ist keine Zahlungsart.“ Die Künstlerinnen und Künstler bekommen 60 Prozent, ausgezahlt zweimal jährlich, und einen Vertrag, der auf drei Seiten passt.',
        'Auflegen tut sie selten und ungern, ungefähr zehnmal im Jahr, nie länger als zwei Stunden. Wer sie im Leipziger Wasserwerk 3 gesehen hat, weiß, dass sie dabei kaum aufblickt und nichts ansagt. Ein Freitagabend im Juni: Sie beginnt um halb drei mit einem Stück, das fast ausschließlich aus Raumhall besteht, und braucht zwanzig Minuten, bis die erste Bassdrum kommt. Ein Drittel des Raums geht raus. Der Rest bleibt bis um sechs, und um kurz vor Schluss klatscht jemand allein und viel zu laut.',
        'Auf die Frage, ob sie irgendwann in ein richtiges Studio ziehen will, mit Boxen und Regie und allem, verzieht sie das Gesicht. Sie habe es zweimal probiert, in gemieteten Räumen, und beide Male sei nichts Brauchbares entstanden. „Auf Boxen mache ich Musik, die gut klingt. Auf Kopfhörern mache ich Musik, die stimmt.“ Dann setzt sie sich wieder hin, dreht das Filter am Drumcomputer eine Winzigkeit nach oben und hört auf einem Kopfhörer, dessen linke Muschel mit Tape am Bügel hängt.'
      ],
      autor: { name: 'Jule Kastner', kuerzel: 'JK', rolle: 'Redakteurin' },
      datum: '2026-07-28',
      lesezeit: 8,
      tags: ['club', 'leipzig', 'label', 'produktion', 'techno'],
      kickerZitat: 'Auf Boxen mache ich Musik, die gut klingt. Auf Kopfhörern mache ich Musik, die stimmt.',
      farbe: '#ffa1d2',
      artworkSeed: 6274
    },

    {
      id: 'tape-delay-trio-kesselhalle',
      rubrikId: 'live',
      rubrikLabel: 'Live',
      titel: 'Tape Delay Trio spielt gegen die Heizung',
      dachzeile: 'Jazz zwischen Werkbänken',
      teaser:
        'In der Bochumer Kesselhalle spielte das Tape Delay Trio zwei Sets, dazwischen fiel die Lüftung aus. Was folgte, war das beste Konzert, das diese Band bisher gegeben hat – und der Beweis, dass Proberaum-Jazz keinen guten Saal braucht, sondern einen ehrlichen.',
      fliesstext: [
        'Die Kesselhalle ist eine ehemalige Schlosserei mit vierzig Klappstühlen, einer Kaffeemaschine und einer Heizung, die im Juli unerklärlicherweise läuft. 62 Leute sind gekommen, überwiegend über vierzig, ein paar Studierende aus dem Jazzstudiengang, dazu der Mann vom Getränkeverkauf, der leise mitzählt. Das Tape Delay Trio – Orgel, Schlagzeug, Tenorsaxofon – baut selbst auf, ohne Techniker, und die Bandleaderin Ruth Kalkbrenner klopft zweimal auf ein Mikrofon, das nicht angeschlossen ist.',
        'Das erste Set ist gut und ein bisschen brav. Man hört, wie diese Musik entstanden ist: in einem Proberaum in Wattenscheid, dienstags, seit 2018, mit einer Bandmaschine, deren Echo dem Trio den Namen gab. Kalkbrenner an der Orgel spielt lange Linien ohne Eile, Jonas Wehrmann treibt am Schlagzeug mit Besen, und Tarek Lindmann setzt sein Saxofon so sparsam ein, dass jeder Ton eine kleine Entscheidung ist. Sauber, souverän, ein wenig zu höflich für einen Raum, in dem der Boden Öl gesehen hat.',
        'In der Pause fällt die Lüftung aus. Innerhalb von zwanzig Minuten steigt die Temperatur so weit, dass zwei Leute nach draußen gehen und die Hälfte des Publikums die Jacken auszieht. Kalkbrenner steht in der Tür, wischt sich die Stirn und sagt zu niemandem im Besonderen: „Dann spielen wir das zweite Set halt anders.“ Was das heißt, versteht man nach vier Minuten, als sie die Orgel eine Terz zu hoch stehen lässt und Wehrmann statt der Besen die Stöcke nimmt, verkehrt herum.',
        'Was dann passiert, ist das, weswegen man in solche Hallen fährt. Aus einer Nummer, die auf der Platte sieben Minuten dauert, wird ein Vierzehnminüter, in dem Lindmann irgendwann aufhört, Melodien zu spielen, und nur noch Luft durch das Instrument schiebt, rhythmisch, wie eine Pumpe. Die Heizung bollert weiter, ein Tiefton in ungefähr F, und das Trio nimmt ihn an, spielt darauf, macht ihn zum vierten Mitglied. Es gibt Konzerte, in denen ein Missgeschick zur Idee wird. Das hier war so eines.',
        'Am Ende, nach eineinhalb Stunden, gibt es keine Zugabe, weil die Band offensichtlich fertig ist. Wehrmann sitzt am Schlagzeug und starrt auf seine Hände, Kalkbrenner packt schon die Kabel ein, während noch geklatscht wird. Draußen auf dem Hof stehen dreißig Leute in der Abendluft und reden lauter als nötig. Jemand fragt, ob es davon eine Aufnahme gibt. Es gibt keine. Man hat es sich anders vorgestellt, mit einem Mitschnitt, aber ehrlich gesagt ist es so besser.'
      ],
      autor: { name: 'Tobias Merz', kuerzel: 'TM', rolle: 'Redakteur' },
      datum: '2026-07-22',
      lesezeit: 6,
      tags: ['jazz', 'bochum', 'konzertbericht', 'improvisation'],
      kickerZitat: 'Es gibt Konzerte, in denen ein Missgeschick zur Idee wird.',
      farbe: '#6ee7a8',
      artworkSeed: 1502
    },

    {
      id: 'ute-marwedel-interview',
      rubrikId: 'interview',
      rubrikLabel: 'Interview',
      titel: 'Ute Marwedel hört dem Loch zu',
      dachzeile: 'Feldaufnahmen im Tagebau',
      teaser:
        'Seit elf Jahren nimmt Ute Marwedel Geräusche in stillgelegten Tagebauen auf. Ihr neues Werk »Sohle Minus Vier« besteht aus Grundwasser, Wind in Rohren und dem Klicken von Messgeräten. Ein Gespräch über Geduld, Genehmigungen und die Frage, ob das noch Musik ist.',
      fliesstext: [
        'Wir treffen uns an einem Aussichtspunkt östlich von Zeitz, wo ein ehemaliger Braunkohletagebau langsam zu einem See wird. Ute Marwedel, 58, hat einen Rucksack mit Rekorder, vier Mikrofonen und einem Thermoskannenkaffee dabei, den sie sofort anbietet. Sie spricht leise, was Berufskrankheit sein könnte, und unterbricht sich mehrfach selbst, um auf ein Geräusch zu zeigen: ein Rohr, in dem Wind steht, das Zirpen einer Pumpenanlage. „Hören Sie? Der ist immer da. Der wechselt nur die Tonhöhe.“',
        'RILLE: Elf Jahre dieselbe Landschaft. Wird das nicht irgendwann langweilig? – Marwedel: Es wird erst nach ungefähr drei Jahren interessant. Am Anfang nimmt man das Spektakuläre auf, den Bagger, die Sprengung. Das kann jeder. Danach kommt eine lange Phase, in der man nichts findet, und die muss man aushalten. Irgendwann hört man dann, dass sich der Boden setzt. Das ist ein Geräusch alle paar Wochen, ein Knacken. Dafür stehe ich nachts um zwei am Rand von einem Loch.',
        'RILLE: Für »Sohle Minus Vier« haben Sie zwei Jahre auf Genehmigungen gewartet. – Marwedel: Zwei Jahre und vier Monate, ja. Bergrecht ist eine eigene Welt. Ich musste einen Nachweis erbringen, dass ich schwindelfrei bin, und eine Haftungserklärung unterschreiben, in der steht, dass ich im Falle einer Rutschung selbst schuld bin. Das klingt absurd, aber ich verstehe es. Die Leute in der Bergaufsicht waren am Ende die besten Gesprächspartner, die ich hatte. Einer hat mir erklärt, wo das Wasser am lautesten ist.',
        'RILLE: Viele würden sagen: Das ist Dokumentation, keine Musik. – Marwedel: Da wehre ich mich nicht mal groß. Nennen Sie es, wie Sie wollen. Ich schneide, ich schichte, ich entscheide, was wegkommt – das sind Kompositionsentscheidungen, ob das Ergebnis nun einen Takt hat oder nicht. Was mich stört, ist etwas anderes: dass Feldaufnahmen fast immer als Naturidyll verkauft werden. Ein Tagebau ist keine Natur. Er ist eine Rechnung, die noch offen ist, und so klingt er auch.',
        'RILLE: Gibt es ein Geräusch, auf das Sie noch warten? – Marwedel: Zwei. Erstens den Moment, in dem der See den letzten Sohlbereich erreicht. Das wird 2031 sein, sagt die Prognose, und dann sitze ich da mit meinen Mikrofonen, wenn ich noch kann. Zweitens: eine Stelle, an der man gar nichts hört. Die habe ich in elf Jahren nicht gefunden. Es gibt hier immer eine Pumpe. Wenn die eines Tages ausgeht, ist das der lauteste Moment in der Geschichte dieser Grube.',
        'Auf dem Rückweg zum Auto bleibt sie noch einmal stehen und stellt den Rekorder auf einen Betonpfeiler. Vier Minuten passiert nichts, jedenfalls nichts, was ich hören kann. Sie packt zusammen, zufrieden. Später schickt sie mir die Datei: Ganz am Ende, bei 3:41, ist ein kurzes, trockenes Knacken zu hören, das man für einen Fehler halten könnte. Es ist der Boden. Er setzt sich, um wenige Millimeter, und Ute Marwedel war zufällig da, wie schon tausendmal vorher.'
      ],
      autor: { name: 'Hedda Prill', kuerzel: 'HP', rolle: 'freie Autorin' },
      datum: '2026-07-15',
      lesezeit: 10,
      tags: ['field recordings', 'tagebau', 'interview', 'komposition', 'sachsen-anhalt'],
      kickerZitat: 'Ein Tagebau ist keine Natur. Er ist eine Rechnung, die noch offen ist.',
      farbe: '#ff8a5c',
      artworkSeed: 9310
    },

    {
      id: 'anke-vollmar-bruderholz',
      rubrikId: 'rezension',
      rubrikLabel: 'Rezension',
      titel: 'Anke Vollmar räumt den Dachboden',
      dachzeile: 'Folk ohne Fluchtweg',
      teaser:
        'Auf »Bruderholz« singt Anke Vollmar von einem Erbstreit im Odenwald: elf Lieder, eine Gitarre, ein Harmonium und eine Stimme, die sich weigert, das Ganze schön zu machen. Deutschsprachiger Folk, der die Familienidylle nicht rettet, sondern inventarisiert.',
      fliesstext: [
        'Das Album beginnt mit einem Geräusch, das man erst beim zweiten Hören zuordnet: Papier, das durch die Hand gezogen wird. Dann setzt eine Gitarre ein, offene Stimmung, sehr trocken aufgenommen, und Anke Vollmar singt den ersten Satz, als läse sie ihn vor: „Im Ordner mit dem grünen Rücken / liegt, wem der Wald gehört.“ Damit ist der Ton gesetzt. »Bruderholz« erzählt einen Erbstreit um dreieinhalb Hektar Mischwald zwischen Erbach und Michelstadt, und es erzählt ihn ohne einen einzigen Versöhnungsakkord.',
        'Vollmar, 44, war zehn Jahre lang Sängerin einer Folkband, die vor allem auf Mittelaltermärkten spielte, und man merkt der Platte an, wovon sie weg will. Kein Bordunbrummen, keine Kunstarchaik, keine Fiedel. Stattdessen: ein Harmonium, das ihr Bruder in Wirklichkeit besitzt, ein gestrichener Kontrabass in drei Stücken und Stille an den Stellen, an denen andere ein Arrangement hinbauen würden. In »Grenzstein 41« singt sie zweieinhalb Minuten lang ohne jede Begleitung, und es ist kein Kunstgriff, es ist eine Weigerung.',
        'Die Texte sind das eigentliche Ereignis. Vollmar hat die Sprache von Grundbuchauszügen und Familienessen ineinandergeschoben, und das ergibt Zeilen, die auf dem Papier trocken wirken und gesungen wehtun. „Wir haben uns gut vertragen / bis wir es aufgeschrieben haben“ ist so eine. In »Onkel Reinhard, sitzend« beschreibt sie fünf Strophen lang nur, wie ein Mann am Tisch sitzt und nicht redet – und man weiß danach mehr über diese Familie als aus jeder Erklärung.',
        'Nicht jedes Stück trägt. »Waldweg im Regen« schrammt an der Postkarte vorbei, und der Refrain von »Zwei Schlüssel« wiederholt sich einmal zu oft, als hätte jemand im Studio noch dreißig Sekunden gebraucht. Auch die Reihenfolge ist diskutabel: Drei der stärksten Nummern liegen hintereinander im ersten Drittel, danach wird es für ein Weilchen flach. Das ist verzeihlich, weil die Platte in ihrem Kern etwas hat, das man selten hört: einen Konflikt, der bis zum Ende ungelöst bleiben darf.',
        'Am Schluss steht »Bruderholz, verkauft«, drei Minuten, Harmonium und Stimme, und eine letzte Zeile, die als Fußnote daherkommt und die ganze Platte kippt. Vollmar hat sie im Booklet nicht abgedruckt, was man als Koketterie lesen kann oder als Anstand. Aufgenommen wurde das Album in einer Scheune bei Beerfelden, im Winter, mit dicken Jacken; man hört gelegentlich, wie jemand die Position wechselt. Es ist die beste deutschsprachige Folkplatte dieses Jahres, und sie ist nicht angenehm.'
      ],
      autor: { name: 'Britta Lanz', kuerzel: 'BL', rolle: 'freie Autorin' },
      datum: '2026-07-08',
      lesezeit: 6,
      tags: ['folk', 'odenwald', 'album', 'texte'],
      kickerZitat: 'Wir haben uns gut vertragen, bis wir es aufgeschrieben haben.',
      farbe: '#8fb8ff',
      artworkSeed: 4088
    },

    {
      id: 'pastellprogramm-unschaerfe',
      rubrikId: 'entdeckung',
      rubrikLabel: 'Entdeckung',
      titel: 'Pastellprogramm und der Mut zur Unschärfe',
      dachzeile: 'Kassette aus Bremen',
      teaser:
        'Zwei Geschwister, ein Vierspurgerät, elf Lieder unter drei Minuten: Pastellprogramm aus Bremen-Findorff machen DIY-Pop, der bewusst schlecht aufgenommen ist und trotzdem im Kopf bleibt. Die erste Auflage war nach elf Tagen weg, ohne dass jemand etwas dafür getan hätte.',
      fliesstext: [
        'Es gibt Bands, deren Reiz sich nach zwei Minuten erschöpft, und es gibt Pastellprogramm. Mieke und Julius Sandvoss, 24 und 27, Geschwister, nehmen seit drei Jahren in einem Zimmer in Bremen-Findorff auf, auf einem Vierspurgerät, das der Vater in den Neunzigern für eine Band gekauft hat, die nie zustande kam. Ihre Kassette »Sommerhalbjahr« enthält elf Stücke, keines länger als 2:48, und klingt, als hätte jemand ein Radio in ein Nachbarzimmer gestellt und die Tür halb zugelassen.',
        'Das ist Absicht, wenn auch eine, die aus Not entstand. „Wir haben am Anfang versucht, dass es sauber wird“, sagt Mieke Sandvoss am Telefon. „Dann klang es einfach nach schlecht gemachtem Pop. Sobald wir aufgehört haben, es zu retten, wurde es unseres.“ Die Stimmen liegen tief im Mix, das Schlagzeug ist ein Programm aus einem Kinderkeyboard, und über allem hängt ein Rauschen, das man nach drei Stücken nicht mehr wahrnimmt und nach der letzten Nummer vermisst.',
        'Melodisch ist das erstaunlich stabil. »Fahrradkeller« hat einen Refrain, der aus vier Tönen besteht und trotzdem den ganzen Tag hängen bleibt. »Wir gehen an den Kanal« besteht im Wesentlichen aus einer Aufzählung von Dingen, die zwei Leute nicht tun, und einer Orgel, die ständig ein bisschen daneben liegt. Und in »Findorff, Juli« singen die Geschwister zweistimmig, ohne sich um Sauberkeit zu kümmern, mit dem Ergebnis, dass die zweite Stimme klingt wie ein Echo aus einem anderen Sommer.',
        'Die erste Auflage – 90 Kassetten, bemalte Hüllen, jede anders – war nach elf Tagen weg, verkauft über einen Plattenladen in der Neustadt und einen Tisch beim Hoffest. Eine Nachpressung ist angeblich in Arbeit, aber die beiden nehmen es nicht besonders ernst; Julius studiert Bauingenieurwesen und findet die ganze Sache eher komisch. Live gab es Pastellprogramm bisher zweimal, jeweils in Wohnungen. Wer die Musik hört, will genau das nicht ändern, und das ist vermutlich der ehrlichste Applaus, den es gibt.'
      ],
      autor: { name: 'Ole Wiechmann', kuerzel: 'OW', rolle: 'Volontär' },
      datum: '2026-06-29',
      lesezeit: 4,
      tags: ['diy-pop', 'bremen', 'kassette', 'lo-fi'],
      kickerZitat: 'Sobald wir aufgehört haben, es zu retten, wurde es unseres.',
      farbe: '#e6d27a',
      artworkSeed: 2237
    },

    {
      id: 'kolumne-soli-ticket',
      rubrikId: 'kolumne',
      rubrikLabel: 'Kolumne',
      titel: 'Das Soli-Ticket und sein schlechtes Gewissen',
      dachzeile: 'Kolumne: Abendkasse',
      teaser:
        'Zwölf Euro regulär, acht ermäßigt, achtzehn solidarisch: An immer mehr Abendkassen darf man wählen, wie viel man zahlt. Eine gute Idee, die einen Nebeneffekt hat, über den niemand gern spricht – und ein Vorschlag, wie man ihn loswird.',
      fliesstext: [
        'Der Zettel klebt inzwischen an fast jeder Kasse, von Kiel bis Konstanz: zwölf Euro regulär, acht ermäßigt, achtzehn solidarisch. Manchmal steht darunter noch ein Satz wie „Niemand wird abgewiesen“. Das ist eine der besseren Erfindungen der letzten Jahre, und ich verteidige sie gegen jeden, der sie für Sozialromantik hält. Sie sorgt dafür, dass Leute im Raum stehen, die sonst nicht drin wären. Trotzdem beobachte ich seit einer Weile etwas, das mich stört, und es liegt nicht am Konzept.',
        'Es liegt an der Choreografie. Ich habe im Mai in einem Leipziger Laden fünfzehn Minuten neben der Kasse gestanden und mitgezählt. Von 41 Leuten nahmen 26 den regulären Preis, 11 den solidarischen und 4 den ermäßigten. Vier. In einem Publikum, in dem mindestens ein Drittel studiert oder Bürgergeld bezieht. Was da passiert, ist keine Zahlungsfrage, sondern eine Bühnensituation: Man sagt vor drei Wartenden laut, in welcher finanziellen Lage man ist, und dann kommt die Bestätigung per Stempel.',
        'Man kann das für ein Luxusproblem halten. Ist es nicht. Die Kasse ist der Moment, in dem ein Abend entscheidet, ob er einladend ist oder nur gut gemeint. Ein Freund, alleinerziehend, hat mir erzählt, dass er lieber die vollen zwölf Euro zahlt und dafür auf das Getränk verzichtet, weil ihm der Satz „einmal ermäßigt“ unangenehmer ist als der Verzicht. Das ist absurd, und trotzdem verstehe ich ihn sofort. Solidarität, die eine Ansage verlangt, ist eine Solidarität mit Eintrittsgeld.',
        'Es gibt Läden, die das gelöst haben, und die Lösung ist unspektakulär. In einem Kollektivbetrieb in Kassel liegt an der Kasse eine Holzkiste mit drei Schlitzen, ohne Beschriftung nach außen. Man wirft ein, was man einwirft, und bekommt den Stempel unabhängig davon. Der Betreiber sagt, die Einnahmen seien seit der Umstellung um knapp neun Prozent gestiegen. Ich weiß nicht, ob diese Zahl standhält. Aber ich weiß, dass an dieser Kasse niemand seine Kontolage laut vorträgt, und das ist der Punkt.',
        'Also, liebe Veranstalterinnen und Veranstalter, ein einziger Wunsch für diesen Herbst: Lasst die Preisstufen stehen, sie sind richtig. Nehmt nur die Nachfrage raus. Kein „Regulär oder ermäßigt?“, kein Blick, kein Nachweis, keine kurze Sekunde, in der geprüft wird, ob das Gesicht zum Preis passt. Es kostet euch nichts und bringt euch Leute, die sonst am Eingang kehrtmachen. Der Rest – die Musik, der klebrige Boden, die zu warme Luft – funktioniert danach ganz von allein.'
      ],
      autor: { name: 'Simon Ehlert', kuerzel: 'SE', rolle: 'Herausgeber' },
      datum: '2026-06-18',
      lesezeit: 5,
      tags: ['clubkultur', 'eintritt', 'kolumne', 'zugang'],
      kickerZitat: 'Solidarität, die eine Ansage verlangt, ist eine Solidarität mit Eintrittsgeld.',
      farbe: '#c07bff',
      artworkSeed: 7451
    }
  ];

  // =========================================================================
  // 4. Künstlerporträts (Bauplan 3.4)
  //    8 Stück, Reihenfolge wie kuenstler.json. Die Texte stehen hier in
  //    korrekter deutscher Schreibung (Bauplan 3.6, ENTSCHEIDUNG 0.10) – ein
  //    Laufzeit-Ersetzer ist verboten, weil er echte Buchstabenfolgen wie
  //    „dauern“, „zuerst“, „genauer“ oder „Neue“ zerstören würde.
  //    farben dient wie artikel.farbe nur als Seed-Streuwert.
  //    beitraege verweist auf Artikel-IDs nach Bauplan 3.4.1.
  // =========================================================================

  const kuenstler = [
    {
      id: 'hallenbad-orchester',
      name: 'Hallenbad Orchester',
      ort: 'Bochum',
      genre: 'Gitarren-Ambient mit Chor',
      gegruendet: 2016,
      besetzung: 'Quartett, live mit zwölfköpfigem Laienchor',
      portraet: [
        'Angefangen hat alles tatsächlich in einem Hallenbad – genauer: im leergepumpten Becken des stillgelegten Sportbads an der Castroper Straße, wo Nadine Kolb und Tarek Amberg 2016 ein Kabel durch ein gekipptes Fenster zogen, um zwei Verstärker zu betreiben. Der Nachhall der Kacheln wurde zum vierten Bandmitglied, bevor es überhaupt vier Mitglieder gab. Bis heute klingt jede Aufnahme, als hätte jemand vergessen, den Raum abzuschalten.',
        'Gearbeitet wird langsam und mit erstaunlich wenig Technik. Amberg spielt eine einzige Halbresonanzgitarre durch ein Bandecho, das regelmäßig den Dienst quittiert; Kolb schichtet darüber Harmonium und Feldaufnahmen aus Schwimmbädern, Parkhäusern und einem Treppenhaus in Wattenscheid. Der Chor wird nicht eingeprobt, sondern eingeladen: Wer kommt, singt mit, meistens Nachbarinnen und ein pensionierter Bademeister. Proben dauern vier Stunden, davon wird eine aufgenommen.',
        'Was das Hallenbad Orchester von der großen ambienten Weichspülerei trennt, ist die Weigerung, schön zu enden. Stücke brechen mitten im Aufbau ab, ein Chorakkord kippt in ein Rauschen, das man erst nach zwei Minuten als Duschanlage erkennt. Die Band nennt das „Ruhrgebiets-Romantik ohne Sonnenuntergang“. Wer sie live sieht, steht meistens in einem Gebäude, das eigentlich für etwas anderes gebaut wurde, und geht anders wieder raus.'
      ],
      zitat: {
        text:
          'Wir schreiben keine Stücke. Wir suchen Räume, die schon fast fertig klingen, und legen zwölf Menschen hinein.',
        quelle: 'Nadine Kolb, Harmonium und Feldaufnahmen'
      },
      releases: [
        { titel: 'Beckenrand', jahr: 2018, format: 'Kassette', label: 'Ruhrfeld Tapes' },
        { titel: 'Zwölf Stimmen, ein Fenster', jahr: 2020, format: 'LP', label: 'Grubenlicht' },
        { titel: 'Umkleide', jahr: 2022, format: 'EP', label: 'Grubenlicht' },
        { titel: 'Der Bademeister träumt vom Meer', jahr: 2024, format: 'LP', label: 'Nordstern Editionen' }
      ],
      trackDesMonats: {
        titel: 'Sprungturm, abgebaut',
        laenge: '8:12',
        beschreibung:
          'Weil hier acht Minuten lang nichts passiert und man trotzdem keine Sekunde weghören kann.'
      },
      hoerempfehlung: 'Für alle, die Ambient mit menschlichen Stimmen und rostigen Kanten mögen.',
      farben: { primaer: '#0F3B5C', sekundaer: '#F2B705' },
      initialen: 'HO',
      artworkSeed: 1427,
      tags: ['Ambient', 'Chor', 'Fieldrecording', 'Ruhrgebiet'],
      beitraege: ['kanal-nord-schleusenzeit', 'tape-delay-trio-kesselhalle']
    },

    {
      id: 'marlen-sturz',
      name: 'Marlen Sturz',
      ort: 'Leipzig',
      genre: 'Kammerpop mit Drumcomputer',
      gegruendet: 2019,
      besetzung: 'Solo, live zu viert',
      portraet: [
        'Marlen Sturz hat sieben Jahre lang Bratsche in Orchestergräben gespielt und irgendwann gemerkt, dass sie die Pausen interessanter fand als die Einsätze. 2019 zog sie nach Leipzig-Lindenau, kaufte für sechzig Euro einen Drumcomputer mit klemmender Snare-Taste und nahm im Winter darauf ihr erstes Album in einer ungeheizten Ladenwohnung auf. Man hört die Heizungsrohre. Sie hat sie drin gelassen, weil sie im Takt knackten.',
        'Ihre Stücke entstehen rückwärts: zuerst der Text, dann eine einzelne Bratschenlinie, dann erst die Frage, ob es überhaupt Schlagzeug braucht. Meistens braucht es welches, aber eines, das klingt, als säße es im Nebenzimmer. Sturz schreibt in einem karierten Heft, streicht viel, und singt bewusst dicht am Mikrofon – nicht flüsternd, eher so, als erzähle sie jemandem etwas, das sie sich selbst noch nicht ganz glaubt.',
        'Das Besondere ist die Präzision ihrer Beobachtungen. Bei Sturz gibt es keine großen Gefühle, sondern einen Pfandbon in der Manteltasche, eine falsch verstandene Ansage am Bahnsteig, den Moment, in dem jemand aus Höflichkeit lacht. Daraus baut sie Lieder, die drei Minuten dauern und tagelang nachhallen. Live sitzt sie mit drei Mitspielerinnen im Halbkreis, ohne Bühnenlicht-Dramaturgie, und redet zwischen den Stücken so trocken, dass das Publikum regelmäßig zu spät merkt, dass schon wieder Musik läuft.'
      ],
      zitat: {
        text:
          'Ich misstraue jedem Refrain, der beim ersten Mal schon recht hat. Meine dürfen ruhig ein bisschen unsicher sein.',
        quelle: 'Marlen Sturz, Gesang, Bratsche, Drumcomputer'
      },
      releases: [
        { titel: 'Ungeheizt', jahr: 2020, format: 'LP', label: 'Ladenwohnung Records' },
        { titel: 'Pfandbon', jahr: 2021, format: '7-Inch', label: 'Ladenwohnung Records' },
        { titel: 'Höflich lachen', jahr: 2023, format: 'LP', label: 'Neue Kleine Form' }
      ],
      trackDesMonats: {
        titel: 'Zweiter Stock, kein Licht',
        laenge: '3:47',
        beschreibung: 'Weil die Bratsche zwei Takte zu früh einsetzt und genau dadurch alles kippt.'
      },
      hoerempfehlung:
        'Für alle, die Songtexte mögen, in denen niemand etwas Großes sagt und trotzdem alles gesagt ist.',
      farben: { primaer: '#7A1F3D', sekundaer: '#E8DCC0' },
      initialen: 'MS',
      artworkSeed: 2038,
      tags: ['Kammerpop', 'Songwriting', 'Bratsche', 'Lo-Fi'],
      beitraege: ['marla-fenn-interview', 'anke-vollmar-bruderholz']
    },

    {
      id: 'kuppel-vier',
      name: 'Kuppel Vier',
      ort: 'Wien',
      genre: 'Dub-Techno mit Blasinstrumenten',
      gegruendet: 2011,
      besetzung: 'Duo, live mit Posaune und Tuba',
      portraet: [
        'Kuppel Vier sind Ilja Brandeis und Sanela Hodzic, die sich 2011 in einem Wiener Gasometer-Keller kennenlernten, wo beide unabhängig voneinander versuchten, aus einem defekten Federhall etwas Brauchbares zu holen. Brandeis kam vom Techno und war ihn leid, Hodzic kam von der Blasmusik und war sie noch nicht leid. Was dabei entstand, hat mit beidem zu tun und klingt trotzdem nach keinem von beidem.',
        'Die Arbeitsweise ist fast handwerklich: Ein Grundmuster läuft stundenlang, während Hodzic Posaunenphrasen hineinspielt, die dann durch eine Kette aus Bandmaschine, Hall und einem selbstgebauten Filter wandern, bis das Blech nur noch als Atem übrig bleibt. Nichts wird quantisiert. Brandeis besteht darauf, dass jedes Stück mindestens einmal live durchgespielt werden muss, bevor es aufgenommen wird – „sonst merkt man nicht, wo es nervt“.',
        'Nach dreizehn Jahren sind Kuppel Vier eine der wenigen Bands, die auf Technofloors und in Kulturhäusern gleichermaßen funktionieren, ohne sich für eines von beidem zu verbiegen. Ihre Konzerte beginnen leise und dauern lang; es gibt keine Drops, sondern Verschiebungen, die man erst zwanzig Minuten später bemerkt. Wer ungeduldig ist, geht nach dem dritten Stück. Alle anderen bleiben bis zum Schluss und reden danach nicht viel.'
      ],
      zitat: {
        text:
          'Eine Tuba im Dub ist kein Gag. Sie ist einfach das älteste Subbass-Instrument, das wir haben.',
        quelle: 'Sanela Hodzic, Posaune und Tuba'
      },
      releases: [
        { titel: 'Gasometer Sessions', jahr: 2013, format: 'EP', label: 'Donaukanal Dubs' },
        { titel: 'Blech im Nebel', jahr: 2016, format: 'LP', label: 'Donaukanal Dubs' },
        { titel: 'Vier Kammern', jahr: 2019, format: 'LP', label: 'Sperrgut' },
        { titel: 'Atemweg', jahr: 2023, format: 'Digital', label: 'Sperrgut' }
      ],
      trackDesMonats: {
        titel: 'Kammer II (Nachtschicht)',
        laenge: '11:04',
        beschreibung:
          'Weil die Posaune erst nach sieben Minuten kommt und man bis dahin schon aufgegeben hatte, auf sie zu warten.'
      },
      hoerempfehlung: 'Für alle, die Techno lieber im Sitzen hören und Blasmusik ernst nehmen.',
      farben: { primaer: '#123B2E', sekundaer: '#FF6B35' },
      initialen: 'K4',
      artworkSeed: 3611,
      tags: ['Dub-Techno', 'Blechbläser', 'Bandmaschine', 'Wien'],
      beitraege: ['ferner-grauwert-portraet', 'schleifbock-autoklav']
    },

    {
      id: 'die-nachbarin',
      name: 'Die Nachbarin',
      ort: 'Hamburg-Wilhelmsburg',
      genre: 'Krautiger Post-Punk',
      gegruendet: 2021,
      besetzung: 'Trio',
      portraet: [
        'Die Nachbarin gibt es, weil sich drei Leute in einem Wilhelmsburger Hinterhof über den Lärm einer vierten beschwerten und dann feststellten, dass sie selbst lauter waren. Bo Reindl, Yannick Osei und Petra Lambrecht spielen seit 2021 zusammen, alle drei jenseits der vierzig, alle drei vorher in Bands, die auseinandergingen, bevor irgendwas passierte. Diesmal, sagen sie, gehe es ihnen ausdrücklich nicht mehr darum, entdeckt zu werden.',
        'Das Prinzip ist simpel und wird streng eingehalten: ein Groove, zwei Akkorde, keine Brücke. Reindl spielt Bass, als hätte sie es eilig, Osei traktiert ein winziges Schlagzeug ohne Becken, und Lambrecht spricht mehr, als sie singt – Texte über Mietverträge, Elternabende, Baustellenlärm und die Frage, wann genau das eigene Leben eine feste Form angenommen hat. Aufgenommen wird an einem Wochenende, live, mit vier Mikrofonen. Overdubs gelten als Betrug.',
        'Der Reiz liegt in dieser Sturheit. Während andere Post-Punk-Bands ihre Wut ausstellen, klingt Die Nachbarin eher wie jemand, der sehr ruhig sehr genau erklärt, was schiefgelaufen ist – und dann noch acht Minuten weiterspielt. Auf der Bühne stehen sie in Arbeitskleidung, das Licht bleibt an, und wenn eine Saite reißt, wird sie vor Publikum gewechselt. Das ist keine Pose. Sie haben schlicht keine Zeit für eine.'
      ],
      zitat: {
        text:
          'Mit vierzig eine Band anzufangen ist die ehrlichste Variante: Es kann nichts mehr daraus werden, also kann man endlich spielen.',
        quelle: 'Petra Lambrecht, Gitarre und Sprechgesang'
      },
      releases: [
        { titel: 'Hinterhof, halb sechs', jahr: 2022, format: 'EP', label: 'Elbinsel Kassetten' },
        { titel: 'Ordnungsamt', jahr: 2023, format: 'LP', label: 'Elbinsel Kassetten' },
        { titel: 'Zweite Mahnung', jahr: 2024, format: '7-Inch', label: 'Rabatz Schallplatten' }
      ],
      trackDesMonats: {
        titel: 'Elternabend',
        laenge: '6:31',
        beschreibung:
          'Weil ein einziger Basslauf sechs Minuten trägt und der Text erst in der letzten Minute zuschlägt.'
      },
      hoerempfehlung: 'Für alle, die Post-Punk mit Alltagsprotokollen statt Weltschmerz wollen.',
      farben: { primaer: '#1B1B1F', sekundaer: '#D64545' },
      initialen: 'DN',
      artworkSeed: 4855,
      tags: ['Post-Punk', 'Krautrock', 'Sprechgesang', 'Livemitschnitt'],
      beitraege: ['halbschatten-ostwerk', 'kolumne-soli-ticket']
    },

    {
      id: 'obstgarten-signal',
      name: 'Obstgarten Signal',
      ort: 'Zürich',
      genre: 'Modularsynthese und Zither',
      gegruendet: 2014,
      besetzung: 'Solo',
      portraet: [
        'Hinter Obstgarten Signal steckt Ruth Villiger, gelernte Feinmechanikerin, die zwanzig Jahre lang Uhrwerke reparierte, bevor sie 2014 anfing, dieselbe Geduld auf Modularsynthesizer anzuwenden. Ihr Studio ist eine ehemalige Werkstatt in Zürich-Altstetten, in der Lötkolben und Patchkabel dieselbe Schublade teilen. Die Zither ihrer Großmutter hängt seit dem ersten Tag an der Wand und hat es irgendwann auf jede Aufnahme geschafft.',
        'Villiger baut ihre Klangquellen weitgehend selbst und arbeitet mit Systemen, die sich langsam selbst verändern: Ein Patch läuft über Tage, sie schaut alle paar Stunden vorbei, notiert, korrigiert eine Spannung. Aufgenommen wird erst, wenn das System etwas tut, das sie nicht vorhergesehen hat. Dann setzt sie sich mit der Zither davor und spielt dagegen an – nicht virtuos, sondern tastend, mit vielen kleinen Fehlern, die sie ausdrücklich behält.',
        'Diese Mischung aus Ingenieurskunst und Alpenmelancholie hat sie zu einer der eigenartigsten Stimmen der Schweizer Elektronikszene gemacht. Ihre Stücke tragen Titel wie „Quittenjahr“ oder „Der Apfelbaum meiner Tante rechnet nicht mehr“, und sie klingen genau so: präzise gebaut und vollkommen unsentimental sentimental. Live spielt Villiger im Sitzen, mit Blick auf ihre Geräte statt aufs Publikum, und beendet Konzerte, indem sie einfach die Stromzufuhr trennt.'
      ],
      zitat: {
        text:
          'Ich baue Maschinen, die etwas tun, das ich nicht wollte. Meine Aufgabe ist danach nur noch, gut zuzuhören.',
        quelle: 'Ruth Villiger, Elektronik und Zither'
      },
      releases: [
        { titel: 'Quittenjahr', jahr: 2015, format: 'Kassette', label: 'Werkstatt Sieben' },
        { titel: 'Spannungsabfall', jahr: 2018, format: 'LP', label: 'Werkstatt Sieben' },
        { titel: 'Die Zither meiner Großmutter', jahr: 2021, format: 'LP', label: 'Limmat Editionen' },
        { titel: 'Stromzufuhr getrennt', jahr: 2024, format: 'Digital', label: 'Limmat Editionen' }
      ],
      trackDesMonats: {
        titel: 'Der Apfelbaum meiner Tante rechnet nicht mehr',
        laenge: '9:26',
        beschreibung: 'Weil die Zither hier zum ersten Mal nicht mitspielt, sondern widerspricht.'
      },
      hoerempfehlung: 'Für alle, die Modularmusik mögen, aber Volksmusik nicht verachten.',
      farben: { primaer: '#2D2A6E', sekundaer: '#EFE24A' },
      initialen: 'OS',
      artworkSeed: 5290,
      tags: ['Modular', 'Zither', 'Generativ', 'Schweiz'],
      beitraege: ['nebelkammer-wartezeit', 'ute-marwedel-interview']
    },

    {
      id: 'tanja-und-die-ausfahrt',
      name: 'Tanja und die Ausfahrt',
      ort: 'Münster',
      genre: 'Countrynaher Indie-Folk',
      gegruendet: 2007,
      besetzung: 'Quintett, wechselnde Besetzung',
      portraet: [
        'Tanja Oberdiek hat 2007 in einer Münsteraner WG-Küche angefangen, Lieder über Autobahnen zu schreiben, ohne selbst einen Führerschein zu besitzen. Die Ausfahrt ist seither eher ein Verzeichnis als eine Band: siebzehn Leute haben über die Jahre mitgespielt, meistens vier bis fünf gleichzeitig, und wer gerade Zeit hat, kommt mit auf Tour. Oberdiek führt darüber eine Tabelle, die sie halb im Scherz „Fuhrpark“ nennt.',
        'Musikalisch bewegt sich das zwischen Pedal Steel, Wanderklampfe und einem Klavier, das in fast jedem Stück einen Ton zu spät kommt. Geschrieben wird auf Zugfahrten, arrangiert wird erst im Raum: Oberdiek bringt eine Gesangsmelodie mit und verbietet allen, sie vorher zu hören. Was in der ersten Probe passiert, wird meistens behalten, inklusive der Stellen, an denen jemand offensichtlich rät.',
        'Nach siebzehn Jahren ist daraus eine Musik geworden, die nach deutschen Randlagen klingt, ohne je den Country zu imitieren: Gewerbegebiete statt Prairie, Raststätten statt Highways, und Texte, in denen Leute weggehen und nach zwei Strophen wieder da sind. Live sind die Konzerte laut, ausufernd und erstaunlich lustig – Oberdiek erzählt zwischen den Stücken kleine Reiseberichte, die häufig länger dauern als die Lieder selbst und immer mit einer Ausfahrt enden.'
      ],
      zitat: {
        text:
          'Ich habe nie einen Führerschein gemacht. Vielleicht schreibe ich deshalb so gern über das Fahren – es bleibt eine Behauptung.',
        quelle: 'Tanja Oberdiek, Gesang und Gitarre'
      },
      releases: [
        { titel: 'Fuhrpark', jahr: 2009, format: 'LP', label: 'Ackerfurche' },
        { titel: 'Raststätte Nord', jahr: 2013, format: 'EP', label: 'Ackerfurche' },
        { titel: 'Siebzehn Leute', jahr: 2018, format: 'LP', label: 'Münsterland Musik' },
        { titel: 'Wieder da', jahr: 2022, format: 'LP', label: 'Münsterland Musik' }
      ],
      trackDesMonats: {
        titel: 'Ausfahrt 41, kein Grund',
        laenge: '4:58',
        beschreibung:
          'Weil die Pedal Steel im letzten Drittel etwas macht, das im Arrangement gar nicht vorgesehen war.'
      },
      hoerempfehlung: 'Für alle, die Americana mögen, aber lieber über Gewerbegebiete singen hören.',
      farben: { primaer: '#8A3B12', sekundaer: '#7EC4A7' },
      initialen: 'TA',
      artworkSeed: 6174,
      tags: ['Indie-Folk', 'Country', 'Pedal Steel', 'Kollektiv'],
      beitraege: ['anke-vollmar-bruderholz', 'pastellprogramm-unschaerfe']
    },

    {
      id: 'flur-neun',
      name: 'Flur Neun',
      ort: 'Halle',
      genre: 'Sample-basierter Rap',
      gegruendet: 2020,
      besetzung: 'Duo, live mit DJ',
      portraet: [
        'Flur Neun sind Jonas Wehmeyer und Adriana Pfeil, beide Anfang zwanzig, beide aufgewachsen in Halle-Neustadt, beide mit einer Plattensammlung, die sie zur Hälfte von Eltern und zur Hälfte vom Flohmarkt am Riebeckplatz haben. Der Name kommt vom neunten Stock eines Wohnblocks, in dem Wehmeyers Großvater wohnte und in dessen Kellerraum die ersten Beats entstanden – auf einem Laptop mit kaputtem Lüfter, der bei jedem Export durchdrehte.',
        'Gesampelt wird ausschließlich aus DDR-Schallplatten, Hörspielen und Lehrmaterial: Chorstücke, Verkehrserziehungsplatten, ein Sprachkurs Russisch für Anfänger. Pfeil schneidet, Wehmeyer schreibt, und beide rappen abwechselnd, mit einer Ruhe, die man in dem Alter selten hört. Kein Autotune, keine Adlibs, kaum Hi-Hats. Was übrig bleibt, ist Stimme und Staub – und ein Bass, der so tief liegt, dass Handylautsprecher ihn schlicht verschweigen.',
        'Inhaltlich geht es fast nie um Rap selbst, sondern um Plattenbau, Großeltern, Ausbildungsverträge und die Frage, warum alle wegziehen. Flur Neun sind dabei weder nostalgisch noch anklagend, sondern genau: Sie beschreiben, was da ist, und lassen die Bewertung weg. Live steht ein DJ an zwei Plattenspielern und spielt die Originalquellen an, bevor der Beat einsetzt – eine kleine Geste, die dem Publikum jedes Mal zeigt, woraus die Musik gemacht ist.'
      ],
      zitat: {
        text:
          'Unsere Samples kommen aus Platten, die niemand mehr hört. Wir geben denen keine zweite Chance, wir geben ihnen die erste.',
        quelle: 'Adriana Pfeil, Produktion und Rap'
      },
      releases: [
        { titel: 'Neunter Stock', jahr: 2021, format: 'Digital', label: 'Saalekante' },
        { titel: 'Verkehrserziehung', jahr: 2022, format: 'EP', label: 'Saalekante' },
        { titel: 'Alle ziehen weg', jahr: 2024, format: 'LP', label: 'Kellerraum Tonträger' }
      ],
      trackDesMonats: {
        titel: 'Sprachkurs für Anfänger',
        laenge: '3:12',
        beschreibung:
          'Weil eine Russischlehrerin von 1979 hier den besten Refrain des Jahres singt, ohne es zu wissen.'
      },
      hoerempfehlung: 'Für alle, die Rap mögen, der von Orten erzählt statt von sich selbst.',
      farben: { primaer: '#3E2A1F', sekundaer: '#FFB3C1' },
      initialen: 'F9',
      artworkSeed: 7302,
      tags: ['Rap', 'Sampling', 'Plattenbau', 'Halle-Neustadt'],
      beitraege: ['haks-randlage', 'kolumne-presswerk-schuld']
    },

    {
      id: 'susanne-koroth',
      name: 'Susanne Koroth',
      ort: 'Berlin-Wedding',
      genre: 'Freie Improvisation, präparierte Harfe',
      gegruendet: 1998,
      besetzung: 'Solo, gelegentlich im Trio',
      portraet: [
        'Susanne Koroth spielt seit 1998 unter eigenem Namen und gehört zu den Musikerinnen, die in keiner Szene ganz zu Hause sind und deshalb in vielen auftauchen. Ausgebildet als klassische Harfenistin, warf sie mit Ende zwanzig die Orchesterlaufbahn hin, nachdem ein Dirigent sie gebeten hatte, weniger zu atmen. Seither arbeitet sie mit einer Konzertharfe, die sie mit Wäscheklammern, Radiergummis und Alufolie präpariert – und die sie, wie sie sagt, dadurch endlich verstehe.',
        'Ihre Konzerte sind nie gleich, aber immer nach demselben Prinzip gebaut: Sie beginnt mit einem einzigen Ton und lässt zu, was der Raum damit macht. Manche Abende bleiben fast still, andere kippen nach zwanzig Minuten in ein Geräusch, das eher an eine Baustelle erinnert als an ein Saiteninstrument. Aufnahmen macht sie selten und ungern; von den vier veröffentlichten Titeln entstanden drei, weil andere Leute das Mikrofon mitbrachten.',
        'Nach über fünfundzwanzig Jahren ist Koroth eine Figur, an der man sich in der Berliner Improvisationsszene abarbeitet: Jüngere Musikerinnen suchen ihre Nähe, sie gibt seit Jahren Workshops im Wedding, in denen es weniger um Technik geht als um Zuhören und um Mut zur Pause. Wer sie erlebt, merkt schnell, dass hier jemand spielt, der nichts mehr beweisen muss und genau deshalb jedes Mal etwas riskiert.'
      ],
      zitat: {
        text:
          'Ein Dirigent bat mich einmal, leiser zu atmen. Seitdem ist mein Atem Teil des Instruments, und zwar der lauteste.',
        quelle: 'Susanne Koroth, präparierte Harfe'
      },
      releases: [
        { titel: 'Wäscheklammern', jahr: 2003, format: 'LP', label: 'Panke Improvisationen' },
        { titel: 'Ein Ton, später', jahr: 2011, format: 'LP', label: 'Panke Improvisationen' },
        { titel: 'Mit fremdem Mikrofon', jahr: 2017, format: 'Kassette', label: 'Uferhalle Tapes' },
        { titel: 'Mut zur Pause', jahr: 2023, format: 'LP', label: 'Uferhalle Tapes' }
      ],
      trackDesMonats: {
        titel: 'Zweiter Abend, Uferhalle',
        laenge: '14:08',
        beschreibung:
          'Weil man vier Minuten lang glaubt, die Aufnahme sei kaputt, und dann versteht, dass sie es nie war.'
      },
      hoerempfehlung: 'Für alle, die aushalten können, dass Musik auch mal nicht weitergeht.',
      farben: { primaer: '#4A1D52', sekundaer: '#9FD356' },
      initialen: 'SK',
      artworkSeed: 8447,
      tags: ['Improvisation', 'Harfe', 'Präpariert', 'Wedding'],
      beitraege: ['ute-marwedel-interview', 'schleifbock-autoklav']
    }
  ];

  // =========================================================================
  // 5. Playlist der Redaktion (Bauplan 3.5)
  //    Zehn Einträge, Reihenfolge verbindlich. `sekunden` ist dieselbe Länge
  //    wie `laenge`, nur maschinenlesbar – die Summe ergibt 4377 Sekunden und
  //    damit die Kopfzeile „10 Stücke · 1 Std. 13 Min. · Stand 28. August 2026“.
  //    Die Guillemets um die Titel setzt app.js, nicht die Daten.
  // =========================================================================

  const playlist = {
    titel: 'Playlist der Redaktion',
    stand: '2026-08-28',
    eintraege: [
      {
        id: 't01',
        interpret: 'Kanal Nord',
        titel: 'Ruhrort Nachtfahrt',
        label: 'Kassettenamt',
        laenge: '9:41',
        sekunden: 581,
        rubrikId: 'portraet',
        kommentar:
          'Bei Minute sieben schiebt sich ein Frachter durch das Stück, und niemand hat ihn weggeschnitten.',
        artworkSeed: 1187
      },

      {
        id: 't02',
        interpret: 'Halbschatten',
        titel: 'Nachtschicht Halle 3',
        label: 'Silberdistel Tonträger',
        laenge: '7:08',
        sekunden: 428,
        rubrikId: 'rezension',
        kommentar:
          'Sieben Minuten, in denen die Sängerin aufhört und die Band es erst zwei Takte später merkt.',
        artworkSeed: 4412
      },

      {
        id: 't03',
        interpret: 'Nebelkammer',
        titel: 'Gleis 4, 1:50 Uhr',
        label: 'Bodenprobe',
        laenge: '11:26',
        sekunden: 686,
        rubrikId: 'entdeckung',
        kommentar:
          'Zwei Harmoniumakkorde, eine Druckluftbremse und die schönste Verspätung des Jahres.',
        artworkSeed: 5560
      },

      {
        id: 't04',
        interpret: 'Marla Fenn',
        titel: 'Küchentisch, halb drei',
        label: 'Eigenverlag',
        laenge: '4:02',
        sekunden: 242,
        rubrikId: 'interview',
        kommentar:
          'Man hört den Stuhl knarzen, und danach will man keine Studioplatte mehr hören.',
        artworkSeed: 733
      },

      {
        id: 't05',
        interpret: 'Tape Delay Trio',
        titel: 'Kesselhalle, zweites Set',
        label: 'Wattenscheid Editionen',
        laenge: '14:19',
        sekunden: 859,
        rubrikId: 'live',
        kommentar:
          'Vom Abend gibt es keinen Mitschnitt – das hier ist die freundliche Notlüge dazu.',
        artworkSeed: 1502
      },

      {
        id: 't06',
        interpret: 'HAKS',
        titel: 'Bieber, sechs Uhr',
        label: 'Eigenverlag',
        laenge: '3:35',
        sekunden: 215,
        rubrikId: 'kolumne',
        kommentar:
          'Dreißig Sekunden Basslauf und ein Blinker: mehr Stadt passt nicht in einen Takt.',
        artworkSeed: 316
      },

      {
        id: 't07',
        interpret: 'Anke Vollmar',
        titel: 'Grenzstein 41',
        label: 'Odenwälder Hausmusik',
        laenge: '2:34',
        sekunden: 154,
        rubrikId: 'rezension',
        kommentar:
          'Zweieinhalb Minuten ohne jede Begleitung, weil hier niemand getröstet werden soll.',
        artworkSeed: 4088
      },

      {
        id: 't08',
        interpret: 'Pastellprogramm',
        titel: 'Fahrradkeller',
        label: 'Findorff Tapes',
        laenge: '2:11',
        sekunden: 131,
        rubrikId: 'entdeckung',
        kommentar:
          'Vier Töne Refrain, ein Kinderkeyboard – und der Ohrwurm hält bis Donnerstag.',
        artworkSeed: 2237
      },

      {
        id: 't09',
        interpret: 'Ferner',
        titel: 'Trockenraum B',
        label: 'Grauwert',
        laenge: '6:57',
        sekunden: 417,
        rubrikId: 'live',
        kommentar:
          'Der Bass kommt nach viereinhalb Minuten und bleibt trotzdem im Nebenzimmer.',
        artworkSeed: 6274
      },

      {
        id: 't10',
        interpret: 'Kuppel Vier',
        titel: 'Kammer II (Nachtschicht)',
        label: 'Sperrgut',
        laenge: '11:04',
        sekunden: 664,
        rubrikId: 'portraet',
        kommentar:
          'Die Posaune kommt erst, wenn man aufgehört hat, auf sie zu warten.',
        artworkSeed: 3611
      }
    ]
  };

  // =========================================================================
  // 6. Abo (Bauplan 3.7, Wortlaut aus abo-formular.md Abschnitt 1)
  //    Preise sind ganzzahlig; app.js formatiert sie über Intl.NumberFormat.
  //    Jahrespreis = 10 × Monatspreis („zwei Monate geschenkt“).
  //    print: true steuert die Sichtbarkeit der Lieferadresse.
  //    Die Prüfmuster stehen bewusst als String da – app.js baut daraus
  //    new RegExp(muster, 'u'), damit data.js reine Datenhaltung bleibt.
  // =========================================================================

  const abo = {
    tarife: [
      {
        id: 'digital',
        name: 'Rille Digital',
        preisMonat: 5,
        preisJahr: 50,
        positionierung: 'Für alle, die einfach lesen wollen, ohne dass jemand mitzählt.',
        leistungen: [
          'Alle Artikel vollständig, ohne Zählwerk und ohne Werbebanner',
          'Newsletter der Redaktion – wöchentlich oder monatlich, du entscheidest',
          'Zugriff auf das komplette Archiv seit 2019, inklusive aller Rezensionen',
          'Kommentare unter den Artikeln, moderiert von Menschen aus der Redaktion'
        ],
        empfehlung: false,
        badge: null,
        badgeGrund: null,
        print: false
      },

      {
        id: 'print',
        name: 'Rille Print',
        preisMonat: 9,
        preisJahr: 90,
        positionierung:
          'Sechs gedruckte Hefte im Jahr, plus alles aus Digital – für alle, die ein Magazin lieber in der Hand halten als im Tab.',
        leistungen: [
          'Alles aus Rille Digital',
          'Sechs Ausgaben im Jahr, gedruckt in Leipzig, portofrei in ganz Europa',
          'Zweimal im Jahr eine Flexi-Disc mit Stücken, die es sonst nirgends gibt',
          'Vorabversand: Das Heft ist bei dir, bevor es im Laden liegt',
          'Monatlich zwei Gästelistenplätze, verlost unter allen Print-Abos'
        ],
        empfehlung: true,
        badge: 'Empfehlung der Redaktion',
        badgeGrund: 'Weil die Flexi-Discs sonst niemand presst.',
        print: true
      },

      {
        id: 'soli',
        name: 'Rille Soli',
        preisMonat: 18,
        preisJahr: 180,
        positionierung:
          'Du zahlst mehr, damit andere weniger zahlen – und damit freie Autor:innen ein Honorar bekommen, das den Namen verdient.',
        leistungen: [
          'Alles aus Rille Print',
          'Finanziert ein ermäßigtes Abo für jemanden, für den 5 € gerade zu viel sind',
          'Namensnennung im Impressum jeder Ausgabe – freiwillig, du kannst auch anonym bleiben',
          'Einmal im Jahr offene Redaktionssitzung: Du hörst zu, du redest mit',
          'Jahresbericht mit offener Rechnung: Wer wurde wofür bezahlt'
        ],
        empfehlung: false,
        badge: null,
        badgeGrund: null,
        print: true
      }
    ],

    // Versandintervall des Newsletters. Vorauswahl ist die zurückhaltendere
    // Variante: wer mehr Post will, wählt aktiv.
    intervalle: [
      {
        id: 'woechentlich',
        label: 'Wöchentlich',
        hilfe: 'Freitagmorgens, sechs bis acht Stücke.',
        standard: false
      },
      {
        id: 'monatlich',
        label: 'Monatlich',
        hilfe: 'Am Monatsende, dafür ausführlich.',
        standard: true
      }
    ],

    // Lieferländer für die Postleitzahlprüfung. Reihenfolge = Reihenfolge der
    // Optionen im Auswahlfeld; Deutschland ist vorausgewählt.
    laender: [
      {
        code: 'DE',
        label: 'Deutschland',
        muster: '^\\d{5}$',
        maxlength: 5,
        inputmode: 'numeric',
        platzhalter: '44137',
        hilfe: 'Fünf Ziffern.'
      },
      {
        code: 'AT',
        label: 'Österreich',
        muster: '^\\d{4}$',
        maxlength: 4,
        inputmode: 'numeric',
        platzhalter: '1050',
        hilfe: 'Vier Ziffern.'
      },
      {
        code: 'CH',
        label: 'Schweiz',
        muster: '^[1-9]\\d{3}$',
        maxlength: 4,
        inputmode: 'numeric',
        platzhalter: '8005',
        hilfe: 'Vier Ziffern, die erste ist keine Null.'
      },
      {
        code: 'EU',
        label: 'Übriges Europa',
        muster: '^[\\p{L}\\p{N}][\\p{L}\\p{N} -]{1,9}$',
        maxlength: 10,
        inputmode: null,
        platzhalter: '1016 AB',
        hilfe: '2 bis 10 Zeichen, so wie sie auf deiner Post steht.'
      }
    ],

    hinweisUnterKarten:
      'Geld ist ein schlechter Grund, nicht mitzulesen. Wer gerade knapp ist, schreibt uns eine Zeile – aus dem Soli-Topf gibt es Freiabos, ohne Nachweis und ohne Nachfragen.',

    // Notnagel für die Interessen-Checkboxen: app.js liest normalerweise
    // RILLE_DATA.rubriken; diese Kopie greift nur, falls die Liste einmal fehlt.
    rubrikenFallback: [
      { id: 'rezension',  label: 'Rezension'  },
      { id: 'interview',  label: 'Interview'  },
      { id: 'portraet',   label: 'Porträt'    },
      { id: 'live',       label: 'Live'       },
      { id: 'kolumne',    label: 'Kolumne'    },
      { id: 'entdeckung', label: 'Entdeckung' }
    ]
  };

  // =========================================================================
  // 7. Sortierungen (Bauplan 3.8)
  //    Sekundärkriterium bei Gleichstand ist immer datum absteigend, danach id
  //    aufsteigend; titel-az vergleicht mit localeCompare(b, 'de'). Beides
  //    setzt app.js um.
  // =========================================================================

  const sortierungen = [
    { id: 'datum-neu',     label: 'Neueste zuerst',           standard: true  },
    { id: 'datum-alt',     label: 'Älteste zuerst',           standard: false },
    { id: 'lesezeit-kurz', label: 'Kürzeste Lesezeit zuerst', standard: false },
    { id: 'titel-az',      label: 'Titel A–Z',                standard: false }
  ];

  // =========================================================================
  // 8. Ausgabe
  //    Tief einfrieren, damit versehentliches Sortieren oder Schreiben im
  //    strikten Modus sofort auffällt (Bauplan 7.3: vor jedem sort() slice()).
  // =========================================================================

  function tiefFrieren(wert) {
    if (wert === null || typeof wert !== 'object' || Object.isFrozen(wert)) {
      return wert;
    }
    Object.keys(wert).forEach(function (schluessel) {
      tiefFrieren(wert[schluessel]);
    });
    return Object.freeze(wert);
  }

  window.RILLE_DATA = tiefFrieren({
    version: VERSION,
    stand: STAND,
    magazin: magazin,
    rubriken: rubriken,
    aufmacherId: AUFMACHER_ID,
    artikel: artikel,
    kuenstler: kuenstler,
    playlist: playlist,
    abo: abo,
    sortierungen: sortierungen
  });
}());
