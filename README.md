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

## Weitere Inhalte

- [Gentoo-Installations-Tutorial](gentoo-install-tutorial.md): KDE Plasma, NVIDIA, Steam, Heroic, MangoHud, GOverlay, Firefox und Audio auf einem Ryzen 5 7500F mit RTX 4070 SUPER, mit Zeitplan für 5 Stunden interaktiv plus Nacht-Build.
