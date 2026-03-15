import type { TelemetryFrame, IssueType, AnalysisResult } from "./types.ts";
import { S1_END, S2_END } from "./constants.ts";
import { filterStationary } from "./filter.ts";
import { getLapSummaries } from "./laps.ts";
import { pitgptMessage } from "./coach.ts";

export function detectIssue(sectorFrames: TelemetryFrame[]): IssueType {
  if (sectorFrames.length === 0) return "inconsistency";

  const heavyBraking = sectorFrames.some((f) => f.brk > 0.8 && f.spd > 200);
  if (heavyBraking) return "heavy_braking";

  const avgThrottle = sectorFrames.reduce((s, f) => s + f.thr, 0) / sectorFrames.length;
  if (avgThrottle < 0.6) return "low_throttle";

  const anyOverheat = sectorFrames.some(
    (f) => f.tyres.fl > 110 || f.tyres.fr > 110 || f.tyres.rl > 110 || f.tyres.rr > 110
  );
  if (anyOverheat) return "tyre_overheat";

  const speeds = sectorFrames.map((f) => f.spd);
  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const variance = speeds.reduce((s, v) => s + (v - mean) ** 2, 0) / speeds.length;
  const stddev = Math.sqrt(variance);
  if (stddev > 40) return "inconsistency";

  return "low_throttle";
}

export function getAnalysis(frames: TelemetryFrame[]): AnalysisResult | null {
  const summaries = getLapSummaries(frames);
  if (summaries.length === 0) return null;

  const best = summaries.reduce((a, b) => (a.lapTime < b.lapTime ? a : b));
  const worst = summaries.reduce((a, b) => (a.lapTime > b.lapTime ? a : b));
  const delta = worst.lapTime - best.lapTime;

  const sectorDeltas = [1, 2, 3].map((s) => {
    const bestS = best.sectors.find((x) => x.sector === s)!.time;
    const worstS = worst.sectors.find((x) => x.sector === s)!.time;
    return { sector: s, delta: worstS - bestS };
  });
  const worstSectorByDelta = sectorDeltas.reduce((a, b) => (a.delta > b.delta ? a : b));

  const active = filterStationary(frames);
  const worstLapFrames = active.filter((f) => f.lap === worst.lapNumber).sort((a, b) => a.ts - b.ts);
  const s = worstSectorByDelta.sector;
  const posLo = s === 1 ? 0 : s === 2 ? S1_END : S2_END;
  const posHi = s === 1 ? S1_END : s === 2 ? S2_END : 1;
  const sectorFrames = worstLapFrames.filter((f) => f.pos >= posLo && f.pos < posHi);
  const issue = detectIssue(sectorFrames);

  return {
    bestLap: { lapNumber: best.lapNumber, lapTime: Math.round(best.lapTime * 1000) / 1000 },
    worstLap: {
      lapNumber: worst.lapNumber,
      lapTime: Math.round(worst.lapTime * 1000) / 1000,
      delta: Math.round(delta * 1000) / 1000,
    },
    problemSector: s,
    issue,
    coachingMessage: pitgptMessage(s, issue, worstSectorByDelta.delta),
  };
}
