import type { TelemetryFrame, LapSummary } from "./types.ts";
import { S1_END, S2_END } from "./constants.ts";
import { filterStationary } from "./filter.ts";

/**
 * Lap is complete if it crosses start/finish: has pos < 0.05 and pos > 0.95.
 * Exclude lap 0 (out-lap).
 */
export function getCompletedLapNumbers(frames: TelemetryFrame[]): number[] {
  const byLap = new Map<number, { minPos: number; maxPos: number }>();
  for (const f of frames) {
    if (!byLap.has(f.lap)) byLap.set(f.lap, { minPos: f.pos, maxPos: f.pos });
    const r = byLap.get(f.lap)!;
    r.minPos = Math.min(r.minPos, f.pos);
    r.maxPos = Math.max(r.maxPos, f.pos);
  }
  const completed: number[] = [];
  const laps = [...byLap.keys()].filter((l) => l > 0).sort((a, b) => a - b);
  for (const lap of laps) {
    const r = byLap.get(lap)!;
    if (r.minPos < 0.05 && r.maxPos > 0.95) completed.push(lap);
  }
  return completed;
}

export function getLapSummaries(frames: TelemetryFrame[]): LapSummary[] {
  const active = filterStationary(frames);
  const completed = getCompletedLapNumbers(active);
  const result: LapSummary[] = [];

  for (const lapNum of completed) {
    const lapFrames = active.filter((f) => f.lap === lapNum).sort((a, b) => a.ts - b.ts);
    if (lapFrames.length < 2) continue;

    const lapStartTs = lapFrames[0].ts;
    const lapEndTs = lapFrames[lapFrames.length - 1].ts;
    const lapTime = lapEndTs - lapStartTs;

    const tsAt = (posThreshold: number) => {
      const f = lapFrames.find((x) => x.pos >= posThreshold);
      return f ? f.ts : lapEndTs;
    };
    const t1 = tsAt(S1_END) - lapStartTs;
    const t2 = tsAt(S2_END) - tsAt(S1_END);
    const t3 = lapEndTs - tsAt(S2_END);

    const speeds = lapFrames.map((f) => f.spd);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds);

    result.push({
      lapNumber: lapNum,
      lapTime: Math.round(lapTime * 1000) / 1000,
      sectors: [
        { sector: 1, time: Math.round(t1 * 1000) / 1000 },
        { sector: 2, time: Math.round(t2 * 1000) / 1000 },
        { sector: 3, time: Math.round(t3 * 1000) / 1000 },
      ],
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      maxSpeed: Math.round(maxSpeed * 10) / 10,
    });
  }
  return result;
}
