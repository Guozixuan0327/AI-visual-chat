import { useState, useCallback, useRef, useEffect } from 'react';
import { SPEECH_RECOGNITION_LANG } from '../constants/config';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = SPEECH_RECOGNITION_LANG;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => {
          const next = prev + finalTranscript;
          transcriptRef.current = next;
          return next;
        });
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setError(event.message || 'Speech recognition failed');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, [isSupported]);

  const startListening = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initializeRecognition();
      }

      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition');
    }
  }, [isSupported, initializeRecognition]);

  const stopListening = useCallback(async (): Promise<string> => {
    const wasListening = recognitionRef.current !== null;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    // Only wait for final result if we were actually listening
    if (wasListening) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    return transcriptRef.current;
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
