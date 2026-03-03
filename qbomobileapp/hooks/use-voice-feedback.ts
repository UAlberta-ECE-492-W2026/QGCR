import { useState, useCallback } from 'react';
import * as Speech from 'expo-speech';

export function useVoiceFeedback() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string, options?: { rate?: number; pitch?: number }) => {
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: 'en',
        rate: options?.rate || 0.9,
        pitch: options?.pitch || 1.0,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(async () => {
    await Speech.stop();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
  };
}
