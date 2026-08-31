Zwei eigenständige HTML-Dateien, jede ohne Build und ohne Abhängigkeiten:

- [`index.html`](index.html) — **Double Pendulum**, eine chaotische Pendel-Animation
- [`jump-run.html`](jump-run.html) — **Würfelsprung**, ein klassisches Jump 'n' Run mit einem Würfel

---

# Double Pendulum

A self-contained HTML/CSS/JS animation of a **double pendulum** — two rods pinned
end-to-end, swinging under gravity. The system is genuinely chaotic: two runs from
almost-identical starting angles diverge quickly. The lower bob paints a fading
trail so you can watch the path it carves.

## Run it

Just open `index.html` in any modern browser. No build step, no dependencies.

## How it works

- **Equations of motion** — the analytic angular accelerations for a double
  pendulum, derived from the Lagrangian.
- **Integration** — fourth-order Runge–Kutta on a fixed `1/240 s` timestep with an
  accumulator, so the simulation stays stable and frame-rate independent (the chaos
  is real, not integrator drift).
- **Trail** — recent positions of the lower bob are kept in a ring buffer and drawn
  as connected segments whose opacity and width fall off with age, giving a
  smoothly fading ribbon plus a soft glow at the leading tip.

## Controls

| Action | Control |
| --- | --- |
| Pause / play | `Space` or the **Pause** button |
| Reset (new random start) | `R` or the **Reset** button |
| Toggle the trail | **Hide trail** button |
| Launch a new pendulum aimed at a point | click / tap anywhere |

---

# Würfelsprung — Jump 'n' Run

Ein klassisches Jump 'n' Run in einer einzigen HTML-Datei: Ein Würfel rollt und
hüpft durch drei Level, sammelt Münzen, springt Gegnern auf den Kopf und muss die
Fahne am Ende erreichen. Kein Build, keine Abhängigkeiten, keine Bilddateien —
alles wird auf ein Canvas gezeichnet.

## Spielen

`jump-run.html` in einem beliebigen modernen Browser öffnen. `Leertaste` startet.

## Steuerung

| Aktion | Taste |
| --- | --- |
| Laufen | `←` `→` oder `A` `D` |
| Springen (halten = höher) | `Leertaste`, `↑` oder `W` |
| Rennen | `Shift` |
| Pause | `P` oder `Esc` |
| Level neu starten | `R` |
| Ton an / aus | `M` |

Auf Touchgeräten erscheinen automatisch Bildschirmtasten.

## Spielelemente

| Element | Verhalten |
| --- | --- |
| Münze | +100 Punkte; alle 25 Münzen gibt es ein Extraleben |
| Gegner (Läufer / Flieger) | von oben draufhüpfen = platt (+200); Berührung von der Seite kostet ein Leben |
| Stacheln | kosten ein Leben |
| Kiste | von unten mit dem Kopf zerschlagen: +50 Punkte und eine Münze |
| Sprungfeder | schleudert den Würfel gut sechs Kacheln hoch |
| Fahrende Plattform | trägt den Würfel mit; legt an den Kanten bündig an |
| Fahne | Level geschafft: 1000 Punkte plus Zeitbonus |

Drei Leben, danach Game Over. Die Bestpunktzahl wird lokal im Browser gespeichert.

## Wie es funktioniert

- **Physik** — fester Zeitschritt von `1/120 s` mit Akkumulator, also unabhängig
  von der Bildrate. Sprünge sind variabel hoch: solange die Sprungtaste gehalten
  wird und der Würfel steigt, wirkt nur 55 % der Schwerkraft.
- **Spielgefühl** — *Coyote Time* (90 ms Gnadenfrist nach der Kante) und
  *Jump Buffering* (110 ms), damit sich Sprünge nicht verschluckt anfühlen.
- **Kollision** — kachelbasiert, eine Achse nach der anderen. Die Prüfkante zur
  Bewegungsrichtung hat keinen Pixel-Versatz, die Achse quer dazu schon; so steht
  der Würfel stabil auf Kanten, ohne an Wänden hängen zu bleiben.
- **Würfel** — rollt beim Laufen um seinen Mittelpunkt, die Augenzahl wechselt mit
  jeder Vierteldrehung (`1 → 2 → 6 → 5`). Beim Absprung und bei der Landung wird er
  kurz gestreckt bzw. gestaucht.
- **Kamera** — folgt weich und wird an den Levelgrenzen gestoppt; der Hintergrund
  läuft in zwei Parallax-Ebenen mit.

## Eigene Level bauen

Die Level stehen als ASCII-Karten oben in der Datei — 17 Zeilen hoch, in
Zehnerblöcken geschrieben, damit die Spalten zählbar bleiben:

| Zeichen | Bedeutung | Zeichen | Bedeutung |
| --- | --- | --- | --- |
| `.` | Luft | `#` | Block |
| `x` | Kiste | `o` | Münze |
| `^` | Stacheln | `S` | Sprungfeder |
| `e` | Läufer | `f` | Flieger |
| `P` | Startpunkt | `G` | Fahne |

Fahrende Plattformen stehen nicht in der Karte, sondern in `platforms` — in
Kacheln: `x`/`y` = Startkachel, `w` = Breite, `dx`/`dy` = Fahrweg, `speed` in
Pixeln pro Sekunde. Farben pro Level kommen aus `THEMES`, das Spielgefühl aus den
Konstanten am Dateianfang (`GRAVITY`, `JUMP_VEL`, `WALK_MAX`, …).
