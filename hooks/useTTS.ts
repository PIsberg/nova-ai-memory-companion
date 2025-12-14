import { useState, useEffect, useRef, useCallback } from 'react';

export const useTTS = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synth.current = window.speechSynthesis;
      setIsSupported(true);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synth.current) return;

    // Cancel any current speaking
    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Optional: Select a specific voice if desired, or let browser default
    // const voices = synth.current.getVoices();
    // utterance.voice = voices.find(v => v.lang.includes('en')) || null;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.current.speak(utterance);
  }, []);

  const cancel = useCallback(() => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSupported,
    isSpeaking,
    speak,
    cancel
  };
};
