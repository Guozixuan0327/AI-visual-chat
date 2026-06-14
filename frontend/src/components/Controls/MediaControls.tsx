import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import styles from './Controls.module.css';

interface MediaControlsProps {
  onClearHistory?: () => void;
}

export const MediaControls: React.FC<MediaControlsProps> = ({ onClearHistory }) => {
  const {
    frameCaptureInterval,
    imageQuality,
    enableMotionDetection,
    motionSensitivity,
    autoCaptureEnabled,
    updateSettings,
  } = useSettingsStore();

  return (
    <div className={styles.controlsContainer}>
      <div className={styles.sectionTitle}>画面设置</div>

      <div className={styles.controlGroup}>
        <label>画面捕捉间隔</label>
        <select
          value={frameCaptureInterval}
          onChange={(e) => updateSettings({ frameCaptureInterval: Number(e.target.value) })}
          className={styles.select}
        >
          <option value={0}>仅手动</option>
          <option value={1000}>1 秒</option>
          <option value={3000}>3 秒</option>
          <option value={5000}>5 秒</option>
          <option value={10000}>10 秒</option>
          <option value={30000}>30 秒</option>
        </select>
      </div>

      <div className={styles.controlGroup}>
        <label>图片质量</label>
        <select
          value={imageQuality}
          onChange={(e) => updateSettings({ imageQuality: e.target.value as any })}
          className={styles.select}
        >
          <option value="low">低（更快）</option>
          <option value="medium">中（均衡）</option>
          <option value="high">高（更清晰）</option>
        </select>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={enableMotionDetection}
            onChange={(e) => updateSettings({ enableMotionDetection: e.target.checked })}
          />
          <span>启用运动检测</span>
        </label>
        <p className={styles.hint}>仅在画面变化时捕捉</p>
      </div>

      {enableMotionDetection && (
        <div className={styles.controlGroup}>
          <label>运动灵敏度</label>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.05"
            value={motionSensitivity}
            onChange={(e) => updateSettings({ motionSensitivity: Number(e.target.value) })}
            className={styles.slider}
          />
          <div className={styles.sliderLabels}>
            <span>低</span>
            <span>高</span>
          </div>
        </div>
      )}

      <div className={styles.controlGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={autoCaptureEnabled}
            onChange={(e) => updateSettings({ autoCaptureEnabled: e.target.checked })}
          />
          <span>自动捕捉</span>
        </label>
      </div>

      {onClearHistory && (
        <button onClick={onClearHistory} className={styles.dangerButton}>
          清除对话历史
        </button>
      )}
    </div>
  );
};
