// =============================================
// VOICE ENGINE
// =============================================

window.VoiceEngine = {
  recognition: null,
  synthesis: window.speechSynthesis,
  isListening: false,
  isSpeaking: false,

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported');
      return false;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    return true;
  },

  getLangCode() {
    const map = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };
    return map[APP_STATE.language] || 'en-IN';
  },

  startListening(onResult, onEnd, onError) {
    if (!this.recognition) {
      if (!this.init()) {
        if (onError) onError('Voice not supported in this browser');
        return;
      }
    }

    this.recognition.lang = this.getLangCode();

    this.recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (event.results[event.results.length - 1].isFinal) {
        if (onResult) onResult(transcript.trim());
      } else {
        // Show interim result
        const previewEl = document.getElementById('voice-preview');
        if (previewEl) {
          previewEl.textContent = transcript;
          previewEl.style.display = 'block';
        }
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateUI(false);
      if (onEnd) onEnd();
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      this.updateUI(false);
      if (event.error !== 'no-speech' && onError) {
        onError(event.error);
      }
    };

    this.recognition.start();
    this.isListening = true;
    this.updateUI(true);
  },

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  },

  updateUI(listening) {
    const voiceBtn = document.getElementById('voice-btn');
    const voiceLabel = document.getElementById('voice-label');
    const voiceWaves = document.getElementById('voice-waves');

    if (voiceBtn) {
      voiceBtn.classList.toggle('recording', listening);
    }
    if (voiceLabel) {
      voiceLabel.textContent = listening ? t('listening') : '🎤 ' + (APP_STATE.language === 'hi' ? 'बोलें' : (APP_STATE.language === 'te' ? 'మాట్లాడండి' : 'Tap to speak'));
    }
    if (voiceWaves) {
      voiceWaves.classList.toggle('active', listening);
    }
  },

  speak(text, lang) {
    if (!this.synthesis) return Promise.resolve();

    return new Promise((resolve) => {
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || this.getLangCode();
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a suitable voice
      const voices = this.synthesis.getVoices();
      const langPrefix = utterance.lang.split('-')[0];
      const match = voices.find(v => v.lang.startsWith(langPrefix)) ||
                    voices.find(v => v.lang.startsWith('en'));
      if (match) utterance.voice = match;

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        resolve();
      };

      this.isSpeaking = true;
      this.synthesis.speak(utterance);
    });
  },

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  },

  isAvailable() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
};

// Load voices asynchronously
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
