// Sound effects using Web Audio API
export const playCorrectSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 523.25;
    gain.gain.value = 0.3;
    osc.start();
    osc.frequency.linearRampToValueAtTime(659.25, ctx.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(783.99, ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn('Sound playback failed:', e);
  }
};

export const playWrongSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.value = 250;
    gain.gain.value = 0.15;
    osc.start();
    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn('Sound playback failed:', e);
  }
};
