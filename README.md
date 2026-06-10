# Spin Coating Thin-Film Uniformity Simulator

An interactive web simulator that reconstructs the **Emslie–Bonner–Peck (EBP)** lubrication
theory of spin coating and couples it with the **Meyerhofer** solvent-evaporation model, solving
the resulting non-linear thickness/viscosity ODEs in real time with a 4th-order Runge–Kutta
integrator.

Built for the Fluid Mechanics term project, School of Chemical Engineering, Sungkyunkwan University.

**Live demo:** https://spin-coating-simulator-osh-skku.vercel.app/

---

## Overview

Spin coating deposits a sub-micron photoresist film by spreading a fluid puddle radially under
rotation. The classical EBP theory predicts indefinite thinning ($h \propto t^{-1/2}$), but real
photoresists are multi-component solutions whose viscosity rises non-linearly as solvent
evaporates, eventually freezing the film into a gel. This simulator captures that competition
between **centrifugal drainage** and **evaporative drying**, and lets the user explore the
operating window required to meet a $\pm2\%$ thickness-uniformity specification across a 300 mm wafer.

## Governing model

The lumped global thinning equation (centrifugal outflow + evaporation):

$$\frac{dh}{dt} = -\frac{2\rho\omega^2 h^3}{3\,\eta(t)} - E$$

Viscosity evolves with polymer concentration as solvent depletes:

$$\eta(t) = \eta_0\left(\frac{C(t)}{C_0}\right)^{\alpha}$$

The system is integrated by RK4 with a fixed step $\Delta t \le 0.001\,\mathrm{s}$, and
solidification is declared when the viscosity reaches the gelation threshold
$\eta_{\mathrm{gel}} = 10\ \mathrm{Pa\cdot s}$.

## Features

- **Core interactive solver** — sliders for rotation speed $\omega$ (rpm), initial viscosity
  $\eta_0$, initial thickness $h_0$, evaporation rate $E$, and wafer radius $R$; the film
  thickness $h(t)$ and viscosity $\eta(t)$ update in real time.
- **Validation view** — overlays the RK4 numerical solution onto two analytical limits:
  - **Re → 0 (EBP limit):** with $E=0$, recovers the exact $h(t)=h_0\,(1+\tfrac{4\rho\omega^2 h_0^2}{3\eta_0}t)^{-1/2}$ curve.
  - **η → ∞ limit:** the convective term vanishes and $h(t)\to h_0 - E t$ (pure evaporative thinning).
- **Design-exploration mode** — editable wafer radius (150 / 200 / 300 mm) and a 1D radial domain
  ($0 \le r \le R$) to visualize the edge evaporation gradient and the $\pm2\%$ uniformity window.
- **Raoult's-law module (toggle)** — reformulates the evaporation rate so the driving force decays
  as solvent depletes, preventing non-physical penetration of the polymer volume limit.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [Recharts](https://recharts.org/) for the interactive plots
- Deployed on [Vercel](https://vercel.com/)

## Running locally

```bash
git clone https://github.com/ohsanghun123/spin-coating-simulator-osh.skku-.git
cd spin-coating-simulator-osh.skku-
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build
npm run preview  # preview the production build
```

Requires Node.js 18+.

## Project structure

```
src/        React components and the RK4 solver logic
public/     static assets
index.html  app entry point
```

## References

1. Emslie, A. G., Bonner, F. T., & Peck, L. G. (1958). Flow of a viscous liquid on a rotating disk. *J. Appl. Phys.*, 29(5), 858–862.
2. Meyerhofer, D. (1978). Characteristics of resist films produced by spinning. *J. Appl. Phys.*, 49(7), 3993–3997.
3. Jiang, Y., et al. (2022). New insights into spin coating of polymer thin films in both wetting and nonwetting regimes. *Langmuir*, 38(41), 12702–12710.
4. Chapra, S. C., & Canale, R. P. (2010). *Numerical Methods for Engineers* (6th ed.). McGraw-Hill.

## Author

Oh Sang Hun (2022314537) — School of Chemical Engineering, Sungkyunkwan University.
