/**
 * Frame throttle — pure functions (v2 spec §3.1).
 *
 * Decides whether to actually SEND a captured frame to the AI API.
 * D1: throttle disabled (always sends). D2: throttle enabled.
 */

export interface FrameSample {
  base64: string;
  width: number;
  height: number;
  grid: number[];       // 8×8=64 grayscale samples
}

export interface ThrottleState {
  lastSentGrid: number[] | null;
  lastSentTime: number;
}

export interface ThrottleDecision {
  shouldSend: boolean;
  reason: 'first_frame' | 'interval_elapsed' | 'scene_changed' | 'no_change_recent' | 'throttle_disabled';
}

const MIN_INTERVAL_MS = 8000;
const CHANGE_THRESHOLD = 25;

export function gridDiff(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

export function decideSend(
  frame: FrameSample,
  state: ThrottleState,
  enableThrottle: boolean,
): ThrottleDecision {
  if (!enableThrottle) return { shouldSend: true, reason: 'throttle_disabled' };
  if (!state.lastSentGrid) return { shouldSend: true, reason: 'first_frame' };
  if (Date.now() - state.lastSentTime > MIN_INTERVAL_MS) {
    return { shouldSend: true, reason: 'interval_elapsed' };
  }
  const diff = gridDiff(state.lastSentGrid, frame.grid);
  if (diff > CHANGE_THRESHOLD) return { shouldSend: true, reason: 'scene_changed' };
  return { shouldSend: false, reason: 'no_change_recent' };
}
