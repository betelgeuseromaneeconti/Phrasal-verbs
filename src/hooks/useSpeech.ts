import { useCallback, useEffect, useState } from 'react';

export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const [accent, setAccent] = useState<'en-US' | 'en-GB'>('en-US');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (text: string, id: string, customRate?: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      if (speakingId === id) {
        stop();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = accent;
      utterance.rate = customRate ?? rate;

      const preferredVoice =
        voices.find((v) => v.lang.replace('_', '-') === accent && v.localService) ||
        voices.find((v) => v.lang.replace('_', '-').startsWith(accent)) ||
        voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setSpeakingId(id);
      utterance.onend = () => setSpeakingId((prev) => (prev === id ? null : prev));
      utterance.onerror = () => setSpeakingId((prev) => (prev === id ? null : prev));

      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    },
    [accent, rate, speakingId, stop, voices]
  );

  return {
    speak,
    stop,
    speakingId,
    rate,
    setRate,
    accent,
    setAccent,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}
