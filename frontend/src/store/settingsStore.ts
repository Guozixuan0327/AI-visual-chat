import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FrameCaptureOptions } from '../types/media.types';
import { DEFAULT_FRAME_CAPTURE_OPTIONS } from '../constants/config';

interface SettingsState {
  frameCaptureInterval: number; // in milliseconds
  imageQuality: 'low' | 'medium' | 'high';
  enableMotionDetection: boolean;
  motionSensitivity: number; // 0-1, higher = more sensitive
  autoCaptureEnabled: boolean;
  conversationContextLength: number;
}

interface SettingsStore extends SettingsState {
  updateSettings: (settings: Partial<SettingsState>) => void;
  resetSettings: () => void;
  getFrameCaptureOptions: () => FrameCaptureOptions;
}

const DEFAULT_SETTINGS: SettingsState = {
  frameCaptureInterval: 5000, // 5 seconds
  imageQuality: 'medium',
  enableMotionDetection: true,
  motionSensitivity: 0.15,
  autoCaptureEnabled: true,
  conversationContextLength: 10,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (newSettings) => {
        set((prev) => ({
          ...prev,
          ...newSettings,
        }));
      },

      resetSettings: () => {
        set(DEFAULT_SETTINGS);
      },

      getFrameCaptureOptions: () => {
        const { imageQuality, motionSensitivity } = get();

        const qualityMap = {
          low: 0.6,
          medium: 0.75,
          high: 0.85,
        };

        return {
          sampleInterval: get().frameCaptureInterval,
          maxWidth: 1280,
          maxHeight: 720,
          jpegQuality: qualityMap[imageQuality],
          enableMotionDetection: get().enableMotionDetection,
          motionThreshold: 1 - motionSensitivity, // Invert sensitivity for threshold
        };
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
