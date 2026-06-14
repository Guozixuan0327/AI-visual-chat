import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useChat } from '../../hooks/useChat';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useTTS } from '../../hooks/useTTS';
import { ENABLE_FRAME_THROTTLE } from '../../constants/config';
import { decideSend } from '../../lib/frameThrottle';
import type { useFrameCapture as FrameCaptureHook } from '../../hooks/useFrameCapture';
import styles from './ChatInterface.module.css';

interface ChatInterfaceProps {
  frameCaptureRef: React.MutableRefObject<ReturnType<typeof FrameCaptureHook> | null>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ frameCaptureRef }) => {
  const [inputText, setInputText] = useState('');
  const { sendMessage, isLoading } = useChat();
  const {
    isListening,
    isSupported: speechSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();
  const { speak, isSpeaking: ttsSpeaking } = useTTS();

  const acceptTranscriptRef = useRef(true);
  const latestFrameRef = useRef<{ base64: string; width: number; height: number; grid: number[] } | null>(null);

  useEffect(() => {
    if (transcript && acceptTranscriptRef.current) setInputText(transcript);
  }, [transcript]);

  /* ---- PTT press: start sampling + listening ---- */
  const handlePressStart = useCallback(() => {
    if (ttsSpeaking) return;
    acceptTranscriptRef.current = true;
    frameCaptureRef.current?.startSampling();
    startListening();
  }, [frameCaptureRef, startListening, ttsSpeaking]);

  /* ---- Mic release: stop recording, keep frame for later send ---- */
  const handleMicRelease = useCallback(async () => {
    if (ttsSpeaking) return;
    const finalSpeechText = await stopListening();
    const best = frameCaptureRef.current?.stopSamplingAndPickBest() ?? null;

    // Save best frame for the next "send"
    if (best) latestFrameRef.current = best;

    // Put recognized speech into input box
    if (finalSpeechText.trim()) {
      setInputText(finalSpeechText.trim());
    }
    resetTranscript();
  }, [frameCaptureRef, stopListening, resetTranscript, ttsSpeaking]);

  /* ---- Send: text + latest frame ---- */
  const handleSendText = useCallback(async () => {
    if (ttsSpeaking || isLoading) return;
    const text = inputText.trim();
    if (!text) return;

    const frame = latestFrameRef.current;
    const state = {
      lastSentGrid: frameCaptureRef.current?.lastSentGridRef.current ?? null,
      lastSentTime: 0,
    };
    const decision = frame
      ? decideSend({ base64: frame.base64, width: frame.width, height: frame.height, grid: frame.grid }, state, ENABLE_FRAME_THROTTLE)
      : { shouldSend: false, reason: 'no_change_recent' as const };

    const imageToSend = decision.shouldSend ? frame?.base64 : undefined;
    const imageDims = decision.shouldSend && frame ? { width: frame.width, height: frame.height } : undefined;

    setInputText('');
    resetTranscript();
    const replyText = await sendMessage(text, imageDims, imageToSend);

    if (decision.shouldSend && frame) {
      frameCaptureRef.current!.lastSentGridRef.current = frame.grid;
      latestFrameRef.current = null;
    }

    if (replyText) {
      acceptTranscriptRef.current = false;
      await speak(replyText);
      await new Promise(r => setTimeout(r, 300));
      acceptTranscriptRef.current = true;
    }
  }, [inputText, isLoading, sendMessage, resetTranscript, speak, ttsSpeaking, frameCaptureRef]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>AI 视觉对话助手</h2>
      </div>

      <div className={styles.messagesContainer}>
        <MessageList />
        {isLoading && <TypingIndicator />}
      </div>

      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={inputText + interimTranscript}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
            placeholder={isListening ? '正在聆听...' : '输入消息，或按住麦克风说话...'}
            disabled={isLoading}
            className={styles.textInput}
          />

          <div className={styles.actionButtons}>
            {speechSupported && (
              <button
                onMouseDown={handlePressStart}
                onMouseUp={handleMicRelease}
                onTouchStart={handlePressStart}
                onTouchEnd={handleMicRelease}
                onMouseLeave={() => { if (isListening) stopListening(); }}
                className={`${styles.iconButton} ${isListening ? styles.listening : ''}`}
                title="按住说话"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            )}

            <button
              onClick={handleSendText}
              disabled={isLoading || (!inputText.trim())}
              className={styles.sendButton}
            >
              {isLoading ? '...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---- sub views ---- */

function MessageList() {
  const { messages } = useChatStore();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>💬</div>
        <p>开始对话吧！</p>
        <p className={styles.hint}>使用摄像头和麦克风与 AI 进行视觉对话</p>
      </div>
    );
  }

  return (
    <>
      {messages.map((m) => (
        <div key={m.id} className={`${styles.msg} ${styles[m.type]} ${m.status === 'sending' ? styles.temp : ''}`}>
          {m.content}
        </div>
      ))}
      <div ref={endRef} />
    </>
  );
}

function TypingIndicator() {
  return (
    <div className={styles.typingIndicator}>
      <span className={styles.dot}></span>
      <span className={styles.dot}></span>
      <span className={styles.dot}></span>
    </div>
  );
}
