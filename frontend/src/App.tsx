import React, { useRef } from 'react';
import { AppLayout } from './components/Layout/AppLayout';
import { CameraView } from './components/CameraView/CameraView';
import { ChatInterface } from './components/ChatInterface/ChatInterface';
import { CostPanel } from './components/CostPanel/CostPanel';
import { ComparisonPanel } from './components/ComparisonPanel/ComparisonPanel';
import { ExportPanel } from './components/ExportPanel/ExportPanel';
import { MediaControls } from './components/Controls/MediaControls';
import { useChatStore } from './store/chatStore';
import type { useFrameCapture } from './hooks/useFrameCapture';
import styles from './App.module.css';

function App() {
  const { clearHistory } = useChatStore();
  const frameCaptureRef = useRef<ReturnType<typeof useFrameCapture> | null>(null);

  return (
    <AppLayout>
      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <div className={styles.cameraSection}>
            <CameraView ref={frameCaptureRef} />
          </div>
          <div className={styles.controlsSection}>
            <MediaControls onClearHistory={clearHistory} />
            <CostPanel />
            <ComparisonPanel />
            <ExportPanel />
          </div>
        </div>
        <div className={styles.rightPanel}>
          <ChatInterface frameCaptureRef={frameCaptureRef} />
        </div>
      </div>
    </AppLayout>
  );
}

export default App;
