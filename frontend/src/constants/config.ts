export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const DEFAULT_FRAME_CAPTURE_OPTIONS = {
  sampleInterval: 5000, // 5 seconds
  maxWidth: 1280,
  maxHeight: 720,
  jpegQuality: 0.75,
  enableMotionDetection: true,
  motionThreshold: 0.15, // 15% pixel change threshold
};

export const MAX_CONVERSATION_TURNS = 6; // D2: 6 turns (12 messages) sliding window

export const ENABLE_FRAME_THROTTLE = true; // D1: false, D2: true

export const SPEECH_RECOGNITION_LANG = 'zh-CN'; // Chinese language for speech recognition
