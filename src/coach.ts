import type { IssueType } from "./types.ts";

/**
 * PitGPT voice: direct, short sentences. Like a race engineer on the radio.
 */
export function pitgptMessage(sector: number, issue: IssueType, delta: number): string {
  const d = delta.toFixed(2);
  switch (issue) {
    case "heavy_braking":
      return `Sector ${sector} is killing your lap — ${d}s lost. You're braking too late and too hard. Get on the anchors earlier, carry more speed through the apex.`;
    case "low_throttle":
      return `Sector ${sector}, ${d}s off. You're not using the throttle — average is way down. Trust the car, get on the power earlier on exit.`;
    case "tyre_overheat":
      return `Sector ${sector} is where the lap falls apart — ${d}s lost. You're overheating the fronts and the throttle trace shows it. Smooth inputs on exit.`;
    case "inconsistency":
      return `${d}s gone in sector ${sector}. Speed variance is huge — you're not committing. Pick a line and stick to it.`;
  }
}
