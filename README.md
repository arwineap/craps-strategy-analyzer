# Craps Strategy Analyzer

A fully in-browser craps betting strategy simulator. No server required — runs entirely in your browser and can be hosted on GitHub Pages.

## Features

- **16 built-in strategies** — conservative, high-reward, and casino-points-focused
- **Configurable parameters** — adjust bet sizes, odds multipliers, and more per strategy
- **Live simulation charts** — watch bankroll curves update in real time via Web Worker
- **KPI analysis** — ROI, Sharpe ratio, house edge, casino comp estimates, and more
- **Casino table management** — define tables with custom minimums, odds, and rules
- **Export / Import** — share strategy "recipes" and table configs as JSON (great for social media)
- **Persistent storage** — tables and strategy settings survive browser sessions via localStorage

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Chart.js (charts)
- Tailwind CSS (styling)
- Web Worker (off-thread simulation)

## Development

```bash
make install   # install dependencies
make dev       # start dev server at http://localhost:5173
make build     # production build → dist/
make preview   # serve the built app locally
make typecheck # run TypeScript type checks
```

## Deploying to GitHub Pages

1. Build: `make build`
2. Push the `dist/` folder to your `gh-pages` branch, or use the GitHub Actions workflow in `.github/workflows/deploy.yml` if present.

The `vite.config.ts` sets `base: '/craps-tool/'` — update this to match your repo name if different.

## Export / Import Format

All exports are versioned JSON envelopes:

```json
{
  "version": 1,
  "type": "bundle",
  "table": { "name": "...", "tableMin": 25, "odds": "3-4-5x", "vigPer": 20, "fieldTriple12": false },
  "strategies": [
    { "preset": "Iron Cross", "enabled": true, "bankroll": 1000, "params": { "fieldBet": 25 } }
  ]
}
```

Types: `"bundle"` (table + strategies), `"table"` (single table), `"strategy"` (single strategy config).

## Project Structure

```
src/
  lib/            # Pure TypeScript game engine (no UI deps)
    dice.ts
    bets.ts
    game.ts
    table-config.ts
    simulator.ts
    statistics.ts
    strategies/
      base.ts
      presets.ts
      config.ts
  worker/
    simulation.worker.ts
  app/
    storage.ts
    export.ts
    types.ts
    hooks/
      useSimulation.ts
    components/
      Layout.tsx
      simulation/
      strategies/
      analysis/
      tables/
    App.tsx
    main.tsx
    index.css
```

The `src/lib/` directory is intentionally framework-free so it can be reused in an interactive craps game in the future.
