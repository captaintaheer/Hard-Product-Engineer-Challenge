# PitGPT Challenge — Codebase structure

## Layout

```
Challenge.ts          # Entry point + challenge spec (run this)
src/
  types.ts            # TelemetryFrame, LapSummary, AnalysisResult, IssueType
  constants.ts        # Sector boundaries (S1_END, S2_END)
  filter.ts           # filterStationary() — skip pit/stationary frames
  laps.ts             # getCompletedLapNumbers(), getLapSummaries()
  coach.ts            # pitgptMessage() — coaching copy
  analysis.ts         # detectIssue(), getAnalysis()
  store.ts            # In-memory store (getStore, setStore)
  routes.ts           # createApp() — Hono routes (ingest, seed, laps, analysis)
  data/
    telemetry.ts      # Sample telemetry (Spa, Porsche 963 LMdh)
```

## Run

```bash
# Server (Bun or Node)
bun run Challenge.ts
# or
node --experimental-strip-types Challenge.ts

# Print API JSON to stdout (no server)
node --experimental-strip-types Challenge.ts --print-output
```

## API

- **POST /ingest** — Store telemetry array, returns `{ laps, frames }`
- **GET /seed** — Load built-in sample data
- **GET /laps** — Lap summaries (completed laps only)
- **GET /analysis** — Best/worst lap, problem sector, issue, coaching message
