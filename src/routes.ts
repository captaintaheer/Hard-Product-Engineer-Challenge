import { Hono } from "hono";
import type { TelemetryFrame } from "./types.ts";
import { getStore, setStore } from "./store.ts";
import { getLapSummaries } from "./laps.ts";
import { getAnalysis } from "./analysis.ts";

/**
 * Create the Hono app with ingest, seed, laps, and analysis routes.
 */
export function createApp(sampleTelemetry: TelemetryFrame[]): Hono {
  const app = new Hono();

  app.post("/ingest", async (c) => {
    const body = (await c.req.json()) as TelemetryFrame[];
    setStore(Array.isArray(body) ? body : []);
    const store = getStore();
    return c.json({
      laps: new Set(store.map((f) => f.lap)).size,
      frames: store.length,
    });
  });

  app.get("/seed", (c) => {
    setStore([...sampleTelemetry]);
    const store = getStore();
    return c.json({
      laps: new Set(store.map((f) => f.lap)).size,
      frames: store.length,
    });
  });

  app.get("/laps", (c) => {
    const summaries = getLapSummaries(getStore());
    return c.json(summaries);
  });

  app.get("/analysis", (c) => {
    const analysis = getAnalysis(getStore());
    if (!analysis) return c.json({ error: "No completed laps" }, 400);
    return c.json(analysis);
  });

  return app;
}
