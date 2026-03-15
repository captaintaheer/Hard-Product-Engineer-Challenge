import type { TelemetryFrame } from "./types.ts";

/**
 * Skip pit/stationary frames: speed < 5 and position unchanged from previous frame (same lap).
 */
export function filterStationary(frames: TelemetryFrame[]): TelemetryFrame[] {
  const out: TelemetryFrame[] = [];
  const prevPosByLap: Record<number, number> = {};
  for (const f of frames) {
    const prev = prevPosByLap[f.lap];
    if (f.spd < 5 && prev !== undefined && Math.abs(f.pos - prev) < 1e-6) continue;
    prevPosByLap[f.lap] = f.pos;
    out.push(f);
  }
  return out;
}
