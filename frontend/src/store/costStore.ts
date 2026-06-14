import { create } from 'zustand';
import {
  estimateImageTokens,
  estimateTextTokens,
  estimateCostUSD,
  estimateContinuousMode,
} from '../lib/costEstimator';

interface CostState {
  turnCount: number;
  imagesSentCount: number;
  imagesSkippedCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUSD: number;
  sessionStartTime: number;
  lastImageDims: { width: number; height: number } | null;

  recordTurn: (params: {
    imageSent: boolean;
    imageDims?: { width: number; height: number };
    userText: string;
    assistantText: string;
    apiInputTokens?: number;
    apiOutputTokens?: number;
  }) => void;

  getComparison: () => {
    elapsedSeconds: number;
    planA: { totalImageTokens: number; estimatedCostUSD: number; frameCount: number };
    planB: { totalInputTokens: number; totalCostUSD: number; frameCount: number };
    savingPercent: number;
  };
}

export const useCostStore = create<CostState>((set, get) => ({
  turnCount: 0,
  imagesSentCount: 0,
  imagesSkippedCount: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCostUSD: 0,
  sessionStartTime: Date.now(),
  lastImageDims: null,

  recordTurn: ({ imageSent, imageDims, userText, assistantText, apiInputTokens, apiOutputTokens }) => {
    set((s) => {
      // Use real API token counts when available, fall back to estimates
      let inputTokens: number;
      if (apiInputTokens !== undefined && apiOutputTokens !== undefined) {
        inputTokens = apiInputTokens;
      } else {
        inputTokens = estimateTextTokens(userText);
        if (imageSent && imageDims) {
          inputTokens += estimateImageTokens(imageDims.width, imageDims.height);
        }
      }

      const outputTokens = apiOutputTokens ?? estimateTextTokens(assistantText);
      let imagesSentCount = s.imagesSentCount;
      let imagesSkippedCount = s.imagesSkippedCount;

      if (imageSent && imageDims) {
        imagesSentCount++;
      } else {
        imagesSkippedCount++;
      }

      const cost = estimateCostUSD(inputTokens, outputTokens);

      return {
        turnCount: s.turnCount + 1,
        imagesSentCount,
        imagesSkippedCount,
        totalInputTokens: s.totalInputTokens + inputTokens,
        totalOutputTokens: s.totalOutputTokens + outputTokens,
        totalCostUSD: s.totalCostUSD + cost,
        lastImageDims: imageDims ?? s.lastImageDims,
      };
    });
  },

  getComparison: () => {
    const s = get();
    const elapsedSeconds = (Date.now() - s.sessionStartTime) / 1000;
    const dims = s.lastImageDims ?? { width: 320, height: 240 };
    const planA = estimateContinuousMode(elapsedSeconds, dims.width, dims.height);
    const planAWithFrames = {
      ...planA,
      frameCount: Math.floor(elapsedSeconds),
    };
    const planB = {
      totalInputTokens: s.totalInputTokens,
      totalCostUSD: s.totalCostUSD,
      frameCount: s.imagesSentCount,
    };
    const savingPercent = planA.estimatedCostUSD > 0
      ? ((planA.estimatedCostUSD - s.totalCostUSD) / planA.estimatedCostUSD) * 100
      : 0;

    return { elapsedSeconds, planA: planAWithFrames, planB, savingPercent };
  },
}));
