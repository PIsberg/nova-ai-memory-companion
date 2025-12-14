import { useState, useCallback } from 'react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Check support (mostly for web fallback, but we focus on mobile)
  const isSupported = true; // Plugin handles checking

  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      await TextToSpeech.speak({
        text,
        lang: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });
      setIsSpeaking(false);
    } catch (e) {
      console.error('TTS Error:', e);
      setIsSpeaking(false);
    }
  }, []);

  const cancel = useCallback(async () => {
    try {
      await TextToSpeech.stop();
      setIsSpeaking(false);
    } catch (e) {
      console.error('TTS Stop Error:', e);
    }
  }, []);

  return {
    isSupported,
    isSpeaking,
    speak,
    cancel
  };
};
