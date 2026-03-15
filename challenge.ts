/**
 * 🏁 RACEMAKE PRODUCT ENGINEER CHALLENGE — HARD 🏁
 * ==================================================
 *
 * CONTEXT
 * -------
 * PitGPT is an AI race engineer. Our data recorder captures telemetry
 * from racing simulators at 10 Hz and sends it to our provider API.
 * The API processes raw frames into lap analysis and coaching insights.
 *
 * Below is a raw telemetry dump from a short stint at Spa-Francorchamps
 * in Le Mans Ultimate (Porsche 963 LMdh, dry, 24°C track).
 *
 * The data is what our Rust/Tauri recorder actually sends — timestamped
 * frames with speed, throttle, brake, steering, gear, RPM, tyre temps,
 * lap number, and normalized track position (0.0 = start/finish, 1.0 = full lap).
 *
 *
 * YOUR TASK
 * ---------
 * Build a Bun/Hono API that ingests this data and returns analysis.
 *
 * 1. POST /ingest
 *    Accepts the raw telemetry array. Stores it in memory.
 *    Returns: { laps: number, frames: number }
 *
 * 2. GET /laps
 *    Returns a summary of each completed lap:
 *    { lapNumber, lapTime, sectors: [{ sector, time }], avgSpeed, maxSpeed }
 *
 *    Sector boundaries at Spa are:
 *      S1 → S2 at trackPosition ≈ 0.333
 *      S2 → S3 at trackPosition ≈ 0.667
 *
 * 3. GET /analysis
 *    Compare each lap to the best lap in the stint. For the worst sector
 *    of the worst lap, identify the primary issue from telemetry clues:
 *
 *    - "heavy_braking"  — brake > 0.8 while speed is still high (> 200)
 *    - "low_throttle"   — avg throttle in sector < 0.6
 *    - "tyre_overheat"  — any tyre temp > 110
 *    - "inconsistency"  — large speed variance (stddev > 40)
 *
 *    Return:
 *    {
 *      bestLap: { lapNumber, lapTime },
 *      worstLap: { lapNumber, lapTime, delta },
 *      problemSector: number,
 *      issue: string,
 *      coachingMessage: string   // use pitgpt voice (see below)
 *    }
 *
 * 4. Edge cases your API must handle:
 *    - The first lap is an out-lap (starts mid-track, not from 0.0) — exclude it
 *    - The last lap may be incomplete (no return to ~0.0) — exclude it
 *    - Frames where speed < 5 and trackPosition doesn't change = pit stop / stationary — skip them
 *
 *
 * COACHING VOICE
 * --------------
 * When generating coachingMessage, use the PitGPT voice:
 * Direct, short sentences. Like a race engineer on the radio.
 * "Sector 2 is killing your lap — you're overheating the fronts
 * and the throttle trace shows it. Smooth inputs on exit."
 *
 *
 * HOW TO RUN
 * ----------
 *   bun install hono
 *   bun run Challenge.ts
 *
 *   Or: node --experimental-strip-types Challenge.ts
 *   Or: node --experimental-strip-types Challenge.ts --print-output  (prints API JSON to stdout)
 *
 * Test with:
 *   curl -X POST http://localhost:3000/ingest -H "Content-Type: application/json" -d @telemetry.json
 *   curl http://localhost:3000/seed   # or use built-in sample
 *   curl http://localhost:3000/laps
 *   curl http://localhost:3000/analysis
 *
 *
 * WHAT WE'RE LOOKING FOR
 * ----------------------
 * - Can you build a working API from raw data with no scaffolding?
 * - Do you handle the messy parts (out-lap, incomplete lap, stationary frames)?
 * - Is your code structured like it belongs in a real codebase?
 * - Does the analysis actually make sense for the data?
 *
 * Use whatever tools you want — AI, docs, whatever. We expect it.
 * We care whether you understand what you shipped.
 *
 *
 * SUBMIT
 * ------
 * Send your code + example curl output to weare@racemake.com
 * Subject: RACEMAKE – Engineer – [Your Name]
 *
 * If we see the signal, we'll be in touch within 48 hours.
 */

import { createApp } from "./src/routes.ts";
import { setStore, getStore } from "./src/store.ts";
import { getLapSummaries } from "./src/laps.ts";
import { getAnalysis } from "./src/analysis.ts";
import { telemetry } from "./src/data/telemetry.ts";

const port = 3000;
const app = createApp(telemetry);

if (process.argv.includes("--print-output")) {
  setStore([...telemetry]);
  const ingestOut = {
    laps: new Set(getStore().map((f) => f.lap)).size,
    frames: getStore().length,
  };
  const lapsOut = getLapSummaries(getStore());
  const analysisOut = getAnalysis(getStore());
  const lines = [
    "=== POST /ingest (or GET /seed) ===",
    JSON.stringify(ingestOut, null, 2),
    "",
    "=== GET /laps ===",
    JSON.stringify(lapsOut, null, 2),
    "",
    "=== GET /analysis ===",
    JSON.stringify(analysisOut, null, 2),
  ];
  console.log(lines.join("\n"));
  process.exit(0);
}

console.log(`PitGPT API http://localhost:${port}`);
console.log("  POST /ingest   GET /seed   GET /laps   GET /analysis");

const isBun = typeof Bun !== "undefined";
if (!isBun) {
  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port });
}

export default {
  port,
  fetch: app.fetch,
};
