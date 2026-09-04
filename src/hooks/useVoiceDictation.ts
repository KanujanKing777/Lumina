import { useState, useEffect, useRef, useCallback } from 'react';

// Declare SpeechRecognition types for browsers supporting the Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export type VoiceDictationStatus = 'idle' | 'listening' | 'error' | 'unsupported';

export interface UseVoiceDictationOptions {
  onFinalTranscript?: (text: string) => void;
  lang?: string;
}

export interface UseVoiceDictationReturn {
  isSupported: boolean;
  status: VoiceDictationStatus;
  isListening: boolean;
  errorMessage: string | null;
  interimTranscript: string;
  startDictation: () => void;
  stopDictation: () => void;
  toggleDictation: () => void;
  clearError: () => void;
}

export const useVoiceDictation = ({
  onFinalTranscript,
  lang = 'en-US',
}: UseVoiceDictationOptions = {}): UseVoiceDictationReturn => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [status, setStatus] = useState<VoiceDictationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  onFinalTranscriptRef.current = onFinalTranscript;

  // Feature detection
  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (SpeechRecognitionAPI) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      setStatus('unsupported');
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  const stopDictation = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignore if already stopped
      }
    }
    setStatus('idle');
    setInterimTranscript('');
  }, []);

  const startDictation = useCallback(() => {
    clearError();

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      setStatus('unsupported');
      setErrorMessage('Voice dictation is not supported in this browser. You can continue typing normally.');
      return;
    }

    try {
      // Abort any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      isManuallyStoppedRef.current = false;

      recognition.onstart = () => {
        setStatus('listening');
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalChunk += transcriptPiece;
          } else {
            interim += transcriptPiece;
          }
        }

        if (finalChunk && onFinalTranscriptRef.current) {
          onFinalTranscriptRef.current(finalChunk);
        }

        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        const errorType = event.error;

        // If user stopped manually, ignore aborted errors
        if (isManuallyStoppedRef.current && errorType === 'aborted') {
          return;
        }

        setStatus('error');

        switch (errorType) {
          case 'not-allowed':
          case 'service-not-allowed':
            setErrorMessage(
              'Microphone permission was denied. You can enable microphone permissions in your browser or continue typing your reflection.'
            );
            break;
          case 'no-speech':
            setErrorMessage('No speech was detected. Click the microphone to try again.');
            break;
          case 'audio-capture':
            setErrorMessage('No microphone was detected on your device. Please ensure your microphone is connected.');
            break;
          case 'network':
            setErrorMessage('Network connection error during speech recognition. Please check your internet connection.');
            break;
          case 'aborted':
            // Don't show error banner for intentional aborts
            setStatus('idle');
            break;
          default:
            setErrorMessage(`Speech recognition error (${errorType || 'unknown'}). You can continue typing manually.`);
        }
      };

      recognition.onend = () => {
        setInterimTranscript('');
        // If not manually stopped and no error occurred, keep status in sync
        if (!isManuallyStoppedRef.current && status === 'listening') {
          setStatus('idle');
        } else if (status !== 'error') {
          setStatus('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(
        err?.message || 'Failed to initialize microphone dictation. You can continue typing manually.'
      );
    }
  }, [clearError, lang, status]);

  const toggleDictation = useCallback(() => {
    if (status === 'listening') {
      stopDictation();
    } else {
      startDictation();
    }
  }, [status, startDictation, stopDictation]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    status,
    isListening: status === 'listening',
    errorMessage,
    interimTranscript,
    startDictation,
    stopDictation,
    toggleDictation,
    clearError,
  };
};
