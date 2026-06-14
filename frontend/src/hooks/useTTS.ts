/**
 * Text-to-Speech hook (v2 spec §3.4 extension).
 *
 * Uses browser-native SpeechSynthesis API.
 * - lang: zh-CN
 * - rate: 1.05 (slightly fast, natural)
 * - cancels previous utterance before speaking new one
 * - speak() returns a Promise that resolves when speaking finishes
 */

import { useCallback, useRef, useState } from 'react';

interface UseTTSReturn {
  speak: (text: string) => Promise<void>;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  isSupported: boolean;
}

export function useTTS(): UseTTSReturn {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resolveRef = useRef<(() => void) | null>(null);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isSupported) { resolve(); return; }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      if (resolveRef.current) resolveRef.current();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setIsSpeaking(false);
        resolveRef.current = null;
        resolve();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        resolveRef.current = null;
        resolve();
      };

      resolveRef.current = resolve;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    });
  }, [isSupported]);

  const stopSpeaking = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, [isSupported]);

  return { speak, isSpeaking, stopSpeaking, isSupported };
}
