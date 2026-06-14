/**
 * Cost estimator — pure functions (v2 spec §3.3).
 *
 * Token formulas:
 *   - image tokens ≈ ceil(width × height / 750)
 *   - text tokens ≈ ceil(text.length / 1.5) (rough Chinese estimate)
 *
 * Pricing (USD / 1M tokens) — Qwen-VL official pricing:
 *   - qwen-vl-max: input=$0.41, output=$1.23
 */

export interface Pricing {
  input: number;   // USD per 1M input tokens
  output: number;  // USD per 1M output tokens
}

export const PRICING: Record<string, Pricing> = {
  'qwen-vl-max': { input: 0.41, output: 1.23 },
};

export function estimateImageTokens(width: number, height: number): number {
  return Math.ceil((width * height) / 750);
}

export function estimateTextTokens(text: string): number {
  return Math.ceil(text.length / 1.5);
}

export function estimateCostUSD(
  inputTokens: number,
  outputTokens: number,
  model = 'qwen-vl-max',
): number {
  const p = PRICING[model];
  return (inputTokens / 1e6) * p.input + (outputTokens / 1e6) * p.output;
}

/**
 * Plan A (continuous 1fps): estimate tokens/cost for sending every second.
 */
export function estimateContinuousMode(
  elapsedSeconds: number,
  width: number,
  height: number,
  model = 'qwen-vl-max',
) {
  const perFrame = estimateImageTokens(width, height);
  const totalImageTokens = perFrame * Math.floor(elapsedSeconds);
  return {
    totalImageTokens,
    estimatedCostUSD: estimateCostUSD(totalImageTokens, 0, model),
  };
}
