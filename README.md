# Craps Strategy Analyzer

A fully in-browser craps betting strategy simulator. No server required — runs entirely in your browser and can be hosted on GitHub Pages.

## Features

- **7 built-in strategies** — Pass Line + Max Odds, Place 6 & 8, Three Point Molly, Inside, Across, Iron Cross, Press & Regress
- **Custom strategies** — write betting logic as JavaScript snippets with a full strategy API; fork any preset as a starting point
- **Live simulation charts** — bankroll curves update in real time via Web Worker
- **KPI analysis** — ROI, bust rate, double-up rate, average peak bankroll, and more per strategy
- **Game replay** — browse individual simulated games and replay them roll by roll
- **5 preset casino tables** — common Vegas and Downtown configurations; add your own to match your casino
- **Export / Import** — share strategies and table configs as JSON; copy a strategy as a share URL
- **In-app docs** — full strategy API reference and table settings guide built into the app
- **Persistent storage** — strategies and settings survive browser sessions via localStorage

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
    { "name": "Iron Cross", "code": "..." }
  ]
}
```

Types: `"bundle"` (table + strategies), `"table"` (single table), `"strategy"` (single strategy).

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
    replay.ts
    strategies/
      api-types.ts     # Strategy API type definitions
      base.ts          # Base strategy class
      code-strategy.ts # Executes user-written JS snippets
      preset-codes.ts  # Built-in strategy source code
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
      docs/            # In-app documentation modal
      simulation/
      strategies/
      analysis/
      tables/
    App.tsx
    main.tsx
    index.css
```

The `src/lib/` directory is intentionally framework-free so it can be reused in an interactive craps game in the future.
