// Speech Synthesis announcement helper
class VoiceService {
  constructor() {
    this.enabled = localStorage.getItem('queueflow_voice_enabled') !== 'false';
  }

  setEnabled(value) {
    this.enabled = value;
    localStorage.setItem('queueflow_voice_enabled', String(value));
  }

  isEnabled() {
    return this.enabled;
  }

  announceToken(tokenCode, counterName = 'Counter 1') {
    if (!this.enabled || !window.speechSynthesis) return;

    try {
      // Cancel previous utterances to avoid queuing up stale calls
      window.speechSynthesis.cancel();

      // Play soft web audio beep chime
      this.playChime();

      setTimeout(() => {
        // Format token code for clear speech (e.g., 'S-U-P 0 0 1')
        const formattedCode = tokenCode.split('').join(' ');
        const text = `Attention please. Token ${formattedCode}, please proceed to ${counterName}.`;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1;

        // Try to select an English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
      }, 350);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  playChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.32);
    } catch (e) {
      // AudioContext might be blocked until user gesture, safe to ignore
    }
  }
}

export const voice = new VoiceService();
