import type { TelemetryFrame } from "./types.ts";

let store: TelemetryFrame[] = [];

export function getStore(): TelemetryFrame[] {
  return store;
}

export function setStore(frames: TelemetryFrame[]): void {
  store = frames;
}
