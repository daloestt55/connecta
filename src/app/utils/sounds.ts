// Sound utility functions for notifications

class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Check if AudioContext is available
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
      
      // Load sound preference
      const saved = localStorage.getItem('connecta_sounds_enabled');
      this.enabled = saved !== 'false';
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('connecta_sounds_enabled', String(enabled));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Play a simple beep sound
  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  // Incoming call sound - ascending tones
  playIncomingCall() {
    if (!this.enabled) return;
    
    const tones = [523, 659, 784]; // C, E, G
    tones.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 0.2), i * 150);
    });
  }

  // Outgoing call sound - single long tone
  playOutgoingCall() {
    if (!this.enabled) return;
    this.playTone(440, 0.5, 0.15);
  }

  // Call connected sound
  playCallConnected() {
    if (!this.enabled) return;
    this.playTone(784, 0.15, 0.2);
    setTimeout(() => this.playTone(1047, 0.15, 0.2), 100);
  }

  // Call disconnected sound
  playCallDisconnected() {
    if (!this.enabled) return;
    this.playTone(392, 0.2, 0.2);
    setTimeout(() => this.playTone(330, 0.3, 0.15), 150);
  }

  // Message received sound
  playMessageReceived() {
    if (!this.enabled) return;
    this.playTone(800, 0.1, 0.15);
  }

  // Notification sound
  playNotification() {
    if (!this.enabled) return;
    this.playTone(600, 0.1, 0.2);
    setTimeout(() => this.playTone(900, 0.1, 0.15), 80);
  }

  // Error sound
  playError() {
    if (!this.enabled) return;
    this.playTone(200, 0.3, 0.25);
  }

  // Success sound
  playSuccess() {
    if (!this.enabled) return;
    this.playTone(523, 0.1, 0.15);
    setTimeout(() => this.playTone(659, 0.1, 0.15), 80);
    setTimeout(() => this.playTone(784, 0.15, 0.15), 160);
  }
}

export const soundManager = SoundManager.getInstance();

// Export individual functions for convenience
export const playIncomingCall = () => soundManager.playIncomingCall();
export const playOutgoingCall = () => soundManager.playOutgoingCall();
export const playCallConnected = () => soundManager.playCallConnected();
export const playCallDisconnected = () => soundManager.playCallDisconnected();
export const playMessageReceived = () => soundManager.playMessageReceived();
export const playNotification = () => soundManager.playNotification();
export const playError = () => soundManager.playError();
export const playSuccess = () => soundManager.playSuccess();
export const setSoundsEnabled = (enabled: boolean) => soundManager.setEnabled(enabled);
export const areSoundsEnabled = () => soundManager.isEnabled();
