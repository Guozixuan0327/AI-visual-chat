import { useState, useCallback, useRef, useEffect } from 'react';
import type { MicrophoneState } from '../types/media.types';

interface UseMicrophoneReturn extends MicrophoneState {
  startMicrophone: () => Promise<void>;
  stopMicrophone: () => void;
  toggleMute: () => void;
}

export function useMicrophone(): UseMicrophoneReturn {
  const [state, setState] = useState<MicrophoneState>({
    stream: null,
    error: null,
    isPermissionGranted: false,
    isMuted: false,
    volumeLevel: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const updateVolumeLevel = useCallback(() => {
    if (!analyserRef.current || state.isMuted) {
      setState((prev) => ({ ...prev, volumeLevel: 0 }));
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedVolume = average / 255;

    setState((prev) => ({ ...prev, volumeLevel: normalizedVolume }));

    animationFrameRef.current = requestAnimationFrame(updateVolumeLevel);
  }, [state.isMuted]);

  const startMicrophone = useCallback(async (): Promise<void> => {
    try {
      // Stop existing stream if any
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Set up audio analysis for volume detection
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setState({
        stream,
        error: null,
        isPermissionGranted: true,
        isMuted: false,
        volumeLevel: 0,
      });

      // Start volume monitoring
      updateVolumeLevel();
    } catch (error) {
      console.error('Failed to start microphone:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to access microphone',
        isPermissionGranted: false,
      }));
    }
  }, [state.stream, updateVolumeLevel]);

  const stopMicrophone = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setState((prev) => ({
      ...prev,
      stream: null,
      volumeLevel: 0,
    }));
  }, [state.stream]);

  const toggleMute = useCallback(() => {
    if (state.stream) {
      const audioTrack = state.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState((prev) => ({
          ...prev,
          isMuted: !prev.isMuted,
        }));
      }
    }
  }, [state.stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, [stopMicrophone]);

  return {
    ...state,
    startMicrophone,
    stopMicrophone,
    toggleMute,
  };
}
