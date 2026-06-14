import { useState, useCallback, useRef, useEffect } from 'react';

/* ---------- types ---------- */

export interface QueuedFrame {
  base64: string;
  width: number;
  height: number;
  grid: number[];    // 8×8 = 64 grayscale samples
  timestamp: number;
}

export interface FrameCaptureAPI {
  /** Start queued sampling (PTT press). Samples every 2s, max 3 frames. */
  startSampling: () => void;
  /** Stop sampling, pick the "best" frame vs last-sent grid, return it. */
  stopSamplingAndPickBest: () => QueuedFrame | null;
  /** Raw single-frame capture (fallback / manual snapshot). */
  captureNow: () => QueuedFrame | null;
  lastSentGridRef: React.MutableRefObject<number[] | null>;
}

/* ---------- constants ---------- */

const SAMPLE_INTERVAL_MS = 2000;
const MAX_QUEUE_SIZE = 3;
const CAPTURE_WIDTH = 320;
const GRID_SIZE = 8;          // 8×8 = 64 sample points
const JPEG_QUALITY = 0.5;

/* ---------- helpers ---------- */

function sampleGrid(ctx: CanvasRenderingContext2D, w: number, h: number): number[] {
  const data = ctx.getImageData(0, 0, w, h).data;
  const samples: number[] = [];
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const x = Math.floor((gx + 0.5) * w / GRID_SIZE);
      const y = Math.floor((gy + 0.5) * h / GRID_SIZE);
      const i = (y * w + x) * 4;
      samples.push((data[i] + data[i + 1] + data[i + 2]) / 3);
    }
  }
  return samples;
}

function gridDiff(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

/* ---------- hook ---------- */

export function useFrameCapture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
): FrameCaptureAPI {
  const queueRef = useRef<QueuedFrame[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentGridRef = useRef<number[] | null>(null);

  /* ---- raw single capture ---- */
  const captureNow = useCallback((): QueuedFrame | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement('canvas');
    const h = Math.round(CAPTURE_WIDTH * video.videoHeight / video.videoWidth);
    canvas.width = CAPTURE_WIDTH;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
    const grid = sampleGrid(ctx, canvas.width, canvas.height);

    return { base64, width: canvas.width, height: canvas.height, grid, timestamp: Date.now() };
  }, [videoRef]);

  /* ---- sampling lifecycle ---- */
  const startSampling = useCallback(() => {
    queueRef.current = [];
    // grab immediate frame
    const first = captureNow();
    if (first) queueRef.current.push(first);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const frame = captureNow();
      if (!frame) return;
      if (queueRef.current.length >= MAX_QUEUE_SIZE) {
        queueRef.current.shift();
      }
      queueRef.current.push(frame);
    }, SAMPLE_INTERVAL_MS);
  }, [captureNow]);

  const stopSamplingAndPickBest = useCallback((): QueuedFrame | null => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const queue = queueRef.current;
    if (queue.length === 0) return null;
    if (queue.length === 1) return queue[0];

    // pick the frame most DIFFERENT from last sent (max info gain)
    if (!lastSentGridRef.current) return queue[queue.length - 1]; // no history → latest

    let best = queue[0];
    let bestDiff = -1;
    for (const f of queue) {
      const d = gridDiff(lastSentGridRef.current, f.grid);
      if (d > bestDiff) { bestDiff = d; best = f; }
    }
    return best;
  }, []);

  /* ---- cleanup ---- */
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { startSampling, stopSamplingAndPickBest, captureNow, lastSentGridRef };
}
