import React, { useRef, useEffect } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { useFrameCapture } from '../../hooks/useFrameCapture';
import styles from './CameraView.module.css';

/**
 * Camera preview component.
 * Owns the video element and exposes a FrameCaptureAPI ref
 * so ChatInterface can call startSampling / stopSamplingAndPickBest.
 * Auto-tries all available camera devices until one works.
 */
export const CameraView = React.forwardRef<
  ReturnType<typeof useFrameCapture> | null,
  { onStreamReady?: (stream: MediaStream) => void }
>(({ onStreamReady }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, error, isLoading, isPermissionGranted, devices, startCamera, stopCamera, enumerateDevices } = useCamera();
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

  // Auto-start: enumerate first, then try each device
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const devs = await enumerateDevices();
      if (cancelled) return;
      // Try each camera until one works
      for (const d of devs) {
        try {
          await startCamera(d.deviceId);
          return; // success
        } catch {
          // Device in use or broken, try next
          continue;
        }
      }
      // All devices failed, fall back to default
      try {
        await startCamera();
      } catch { /* shown via error state */ }
    };
    init();
    return () => { cancelled = true; stopCamera(); };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.permissionContainer}>
        <div className={styles.permissionIcon}>⏳</div>
        <h3>正在启动摄像头...</h3>
        <p>请稍候，正在获取摄像头画面</p>
      </div>
    );
  }

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
      {devices.length > 1 && (
        <select
          className={styles.deviceSelect}
          onChange={(e) => { startCamera(e.target.value).catch(console.error); }}
          value=""
          style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10, padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontSize: 12 }}
        >
          <option value="" disabled>切换摄像头</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `摄像头 ${d.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
      )}
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
