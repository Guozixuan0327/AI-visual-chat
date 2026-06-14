import { useState, useCallback, useRef } from 'react';
import type { CameraState } from '../types/media.types';

interface UseCameraReturn extends CameraState {
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
  enumerateDevices: () => Promise<MediaDeviceInfo[]>;
}

export function useCamera(): UseCameraReturn {
  const [state, setState] = useState<CameraState>({
    stream: null,
    error: null,
    isPermissionGranted: false,
    devices: [],
    selectedDeviceId: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const enumerateDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      setState((prev) => ({ ...prev, devices: videoDevices }));
      return videoDevices;
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      setState((prev) => ({ ...prev, error: 'Failed to list camera devices' }));
      return [];
    }
  }, []);

  const startCamera = useCallback(async (deviceId?: string): Promise<void> => {
    try {
      // Stop existing stream if any
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setState({
        stream,
        error: null,
        isPermissionGranted: true,
        devices: state.devices,
        selectedDeviceId: deviceId || null,
      });

      // Enumerate devices after successful permission
      await enumerateDevices();
    } catch (error) {
      console.error('Failed to start camera:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to access camera',
        isPermissionGranted: false,
      }));
    }
  }, [state.stream, state.devices, enumerateDevices]);

  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      setState((prev) => ({
        ...prev,
        stream: null,
      }));
    }
  }, [state.stream]);

  const switchCamera = useCallback(async (deviceId: string): Promise<void> => {
    await stopCamera();
    await startCamera(deviceId);
  }, [stopCamera, startCamera]);

  return {
    ...state,
    startCamera,
    stopCamera,
    switchCamera,
    enumerateDevices,
  };
}
