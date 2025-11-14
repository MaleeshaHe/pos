/**
 * Audio Feedback Utility for POS
 * Provides sound effects for better user experience
 */

class AudioFeedback {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize Web Audio API
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play a beep sound
   */
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Success sound - barcode scanned
   */
  public success() {
    this.playTone(800, 0.1);
  }

  /**
   * Error sound - out of stock, invalid action
   */
  public error() {
    this.playTone(200, 0.3, 'sawtooth');
  }

  /**
   * Warning sound - low stock
   */
  public warning() {
    this.playTone(600, 0.15);
    setTimeout(() => this.playTone(600, 0.15), 150);
  }

  /**
   * Checkout complete sound
   */
  public checkout() {
    this.playTone(523, 0.1); // C
    setTimeout(() => this.playTone(659, 0.1), 100); // E
    setTimeout(() => this.playTone(784, 0.2), 200); // G
  }

  /**
   * Item added to cart
   */
  public itemAdded() {
    this.playTone(1000, 0.05);
  }

  /**
   * Item removed from cart
   */
  public itemRemoved() {
    this.playTone(400, 0.1);
  }

  /**
   * Cash register ding
   */
  public ding() {
    this.playTone(1500, 0.1);
    setTimeout(() => this.playTone(2000, 0.15), 50);
  }

  /**
   * Enable/disable audio feedback
   */
  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Check if audio is enabled
   */
  public isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const audioFeedback = new AudioFeedback();
