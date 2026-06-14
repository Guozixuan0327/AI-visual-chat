import { create } from 'zustand';
import type { CameraState, MicrophoneState, FrameCaptureOptions } from '../types/media.types';
import { DEFAULT_FRAME_CAPTURE_OPTIONS } from '../constants/config';

interface MediaStore {
  camera: CameraState;
  microphone: MicrophoneState;
  frameCaptureOptions: FrameCaptureOptions;
  setCameraState: (state: Partial<CameraState>) => void;
  setMicrophoneState: (state: Partial<MicrophoneState>) => void;
  setFrameCaptureOptions: (options: Partial<FrameCaptureOptions>) => void;
}

export const useMediaStore = create<MediaStore>((set) => ({
  camera: {
    stream: null,
    error: null,
    isPermissionGranted: false,
    devices: [],
    selectedDeviceId: null,
  },
  microphone: {
    stream: null,
    error: null,
    isPermissionGranted: false,
    isMuted: false,
    volumeLevel: 0,
  },
  frameCaptureOptions: DEFAULT_FRAME_CAPTURE_OPTIONS,

  setCameraState: (state) =>
    set((prev) => ({
      camera: { ...prev.camera, ...state },
    })),

  setMicrophoneState: (state) =>
    set((prev) => ({
      microphone: { ...prev.microphone, ...state },
    })),

  setFrameCaptureOptions: (options) =>
    set((prev) => ({
      frameCaptureOptions: { ...prev.frameCaptureOptions, ...options },
    })),
}));
