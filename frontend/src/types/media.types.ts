export interface CameraState {
  stream: MediaStream | null;
  error: string | null;
  isPermissionGranted: boolean;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
}

export interface MicrophoneState {
  stream: MediaStream | null;
  error: string | null;
  isPermissionGranted: boolean;
  isMuted: boolean;
  volumeLevel: number;
}

export interface FrameCaptureOptions {
  sampleInterval: number; // milliseconds between captures
  maxWidth: number; // maximum width for resizing
  maxHeight: number; // maximum height for resizing
  jpegQuality: number; // 0.0 to 1.0
  enableMotionDetection: boolean; // detect scene changes
  motionThreshold: number; // pixel difference threshold (0-1)
}

export interface CapturedFrame {
  imageData: string; // base64 encoded
  timestamp: number;
  width: number;
  height: number;
}
