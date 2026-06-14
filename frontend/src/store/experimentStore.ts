import { create } from 'zustand';

/**
 * Experiment log entry — recorded each turn for later analysis.
 * v2 spec §4: lightweight local experiment log (no DB).
 */

export interface ExperimentEntry {
  timestamp: number;
  latencyMs: number;
  imageSent: boolean;
  imageTokens: number;
  textTokens: number;
  totalCostUSD: number;
}

interface ExperimentState {
  entries: ExperimentEntry[];
  recordEntry: (entry: ExperimentEntry) => void;
  exportJSON: () => string;
  exportCSV: () => string;
  clear: () => void;
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  entries: [],

  recordEntry: (entry) => {
    set((s) => ({ entries: [...s.entries, entry] }));
  },

  exportJSON: () => JSON.stringify(get().entries, null, 2),

  exportCSV: () => {
    const head = 'timestamp,latencyMs,imageSent,imageTokens,textTokens,totalCostUSD';
    const rows = get().entries.map(
      (e) => `${e.timestamp},${e.latencyMs},${e.imageSent},${e.imageTokens},${e.textTokens},${e.totalCostUSD}`,
    );
    return [head, ...rows].join('\n');
  },

  clear: () => set({ entries: [] }),
}));
