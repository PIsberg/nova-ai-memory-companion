import { useState, useEffect, useRef, useCallback } from 'react';

export const useTTS = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synth.current = window.speechSynthesis;
      setIsSupported(true);

      // Chrome loads voices asynchronously, so we need to wait for them
      const loadVoices = () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.getVoices();
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    } else {
      console.warn("Text-to-Speech not supported in this environment");
      setIsSupported(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synth.current) return;

    // Cancel any current speaking
    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Voice Preference Logic
    const voices = synth.current.getVoices();

    // Priority list for "Natural" / "Female" voices
    // 1. Google US English (often high quality on Chrome)
    // 2. Microsoft Zira (Standard Windows Female)
    // 3. Samantha (macOS Female)
    // 4. Any "Female" voice
    // 5. Any English voice

    let selectedVoice = voices.find(v => v.name === "Google US English");

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.includes("Google") && v.lang.includes("en-US"));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.includes("Zira")); // Windows
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.includes("Samantha")); // macOS
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.toLowerCase().includes("female") && v.lang.includes("en"));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang === "en-US");
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      // Slightly lower pitch/rate can sometimes sound more natural for AI (subjective)
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

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
