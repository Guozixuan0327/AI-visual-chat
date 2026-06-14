import React, { useRef, useEffect } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { useFrameCapture } from '../../hooks/useFrameCapture';
import styles from './CameraView.module.css';

/**
 * Camera preview component.
 * Owns the video element and exposes a FrameCaptureAPI ref
 * so ChatInterface can call startSampling / stopSamplingAndPickBest.
 */
export const CameraView = React.forwardRef<
  ReturnType<typeof useFrameCapture> | null,
  { onStreamReady?: (stream: MediaStream) => void }
>(({ onStreamReady }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, error, isPermissionGranted, startCamera, stopCamera } = useCamera();
  const frameCapture = useFrameCapture(videoRef);

  // Forward the frameCapture API to parent
  useEffect(() => {
    if (ref && typeof ref === 'object') {
      ref.current = frameCapture;
    }
  }, [ref, frameCapture]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      onStreamReady?.(stream);
    }
  }, [stream, onStreamReady]);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera().catch(console.error);
    return () => { stopCamera(); };
  }, []);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>📷</div>
        <h3>摄像头访问错误</h3>
        <p>{error}</p>
        <button onClick={() => startCamera()} className={styles.retryButton}>重试</button>
      </div>
    );
  }

  if (!isPermissionGranted) {
    return (
      <div className={styles.permissionContainer}>
        <div className={styles.permissionIcon}>📹</div>
        <h3>需要摄像头权限</h3>
        <p>请允许摄像头访问以启用视觉对话</p>
        <button onClick={() => startCamera()} className={styles.requestButton}>开启摄像头</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
      <div className={styles.overlay}>
        <div className={styles.statusIndicator}>
          <span className={styles.statusDot}></span>
          <span>实时画面</span>
        </div>
      </div>
    </div>
  );
});

CameraView.displayName = 'CameraView';
