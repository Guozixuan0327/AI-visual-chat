import { useState, useCallback, useRef } from 'react';
import type { CameraState } from '../types/media.types';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

interface UseCameraReturn extends CameraState {
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
  enumerateDevices: () => Promise<MediaDeviceInfo[]>;
  isLoading: boolean;
}

export function useCamera(): UseCameraReturn {
  const [state, setState] = useState<CameraState>({
    stream: null,
    error: null,
    isPermissionGranted: false,
    devices: [],
    selectedDeviceId: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const retryCountRef = useRef(0);

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
    setIsLoading(true);
    const attempt = async (retryCount: number): Promise<MediaStream> => {
      try {
        // Stop existing stream if any
        if (state.stream) {
          state.stream.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        };

        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        const isPermissionError = error instanceof DOMException &&
          (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError');
        // Don't retry on permission denial
        if (isPermissionError || retryCount >= MAX_RETRIES) {
          throw error;
        }
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
        console.warn(`Camera start failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise((r) => setTimeout(r, delay));
        return attempt(retryCount + 1);
      }
    };

    try {
      const stream = await attempt(0);
      retryCountRef.current = 0;

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
      const isDenied = error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError');
      setState((prev) => ({
        ...prev,
        error: isDenied
          ? '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问'
          : `无法访问摄像头: ${error instanceof Error ? error.message : '未知错误'}`,
        isPermissionGranted: false,
      }));
    } finally {
      setIsLoading(false);
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
    isLoading,
  };
}
