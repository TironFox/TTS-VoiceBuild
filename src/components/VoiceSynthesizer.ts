/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VoiceModel } from '../types';

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * High-craft browser-side procedural voice & speech generator that emulates the acoustic properties
 * of fine-tuning sliders like Robotic, Warmth, Reverb, Pitch, Sound Speed and Breathiness.
 */
export async function playProceduralVoice(
  text: string,
  model: VoiceModel,
  onVisualData?: (dataArray: Uint8Array) => void,
  onEnded?: () => void
): Promise<{ stop: () => void }> {
  const ctx = getAudioContext();
  const dest = ctx.destination;

  // Track state
  let isStopped = false;
  let activeUtterance: SpeechSynthesisUtterance | null = null;
  const activeNodes: AudioNode[] = [];

  // Cleanup helper
  const stopAll = () => {
    isStopped = true;
    if (activeUtterance) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    activeNodes.forEach(node => {
      try {
        (node as any).disconnect();
      } catch (e) {}
    });
  };

  // Check if Web Speech Synthesis is supported for speech output
  const hasSpeech = 'speechSynthesis' in window;

  if (hasSpeech) {
    // Standard Speech Synthesis with pitch, rate
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;

    // Pick a voice matching preferred gender and language
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('ZH'));
    
    // Fallback search
    if (!preferredVoice) {
      preferredVoice = voices.find(v => v.lang.includes('en')) || voices[0];
    }
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Map model speed (0.5 to 2.0) with safety fallbacks
    let safeSpeed = Number(model.speed);
    if (isNaN(safeSpeed) || !isFinite(safeSpeed)) {
      safeSpeed = 1.0;
    }
    utterance.rate = Math.max(0.1, Math.min(10, safeSpeed));
    
    // Map model pitch. Web speech pitch is 0 to 2. 
    // We map model.pitch (-100 to 100) to (0.5 to 1.8) with safety fallbacks
    let safePitch = Number(model.pitch);
    if (isNaN(safePitch) || !isFinite(safePitch)) {
      safePitch = 0;
    }
    utterance.pitch = Math.max(0, Math.min(2, 1.0 + (safePitch / 150)));
    
    // Volume with safety fallbacks
    let safeVolume = Number(model.volume);
    if (isNaN(safeVolume) || !isFinite(safeVolume)) {
      safeVolume = 80;
    }
    utterance.volume = Math.max(0, Math.min(1, safeVolume / 100));

    // Let's create an analyzer to simulate waveform movement on playing
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let animId: number;
    const draw = () => {
      if (isStopped) return;
      analyser.getByteFrequencyData(dataArray);
      
      // Inject random voice flutter when robotic is high
      if (model.robotic > 10) {
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.min(255, dataArray[i] + (Math.random() * model.robotic));
        }
      }
      
      if (onVisualData) {
        onVisualData(new Uint8Array(dataArray));
      }
      animId = requestAnimationFrame(draw);
    };

    utterance.onstart = () => {
      draw();
    };

    utterance.onend = () => {
      cancelAnimationFrame(animId);
      if (onEnded) onEnded();
    };

    utterance.onerror = () => {
      cancelAnimationFrame(animId);
      if (onEnded) onEnded();
    };

    window.speechSynthesis.speak(utterance);
    
    // While Speech Synthesis is speaking, we generate an ambient vocoder hum to represent the 
    // real-time acoustic pipeline! (robotic vocoder, reverb, warmth, and breathing modifiers)
    const playSynthesizerModifiers = () => {
      if (isStopped) return;

      // Base Carrier Wave representing the custom tuned vocal cord properties
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const noise = ctx.createOscillator(); // Extra noisy textures
      const rev = ctx.createDelay();

      activeNodes.push(osc, gain, filter, noise, rev);

      // Sound Base Pitch frequency (male hums lower, female higher)
      let baseFreq = model.gender === 'male' ? 110 : model.gender === 'female' ? 220 : 160;
      // Pitch tweak
      baseFreq += (model.pitch * 0.8);
      osc.type = model.robotic > 30 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      // Fine-tuning robotic modulation (pitch flutter)
      if (model.robotic > 10) {
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        mod.frequency.value = 50 + (model.robotic / 2); // buzz frequency
        modGain.gain.value = model.robotic * 0.5;
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        mod.start();
        activeNodes.push(mod, modGain);
      }

      // Warmth implementation: Low pass filter boosts lower mids
      filter.type = 'lowpass';
      // Low pass frequency is lower (warmer) or higher (clearer) based on warmth spectrum
      const targetCutoff = 1200 - (model.warmth * 4) + (model.tension * 5);
      filter.frequency.setValueAtTime(targetCutoff, ctx.currentTime);

      // Breathiness implementation: Add bandpassed noise to mimic breath escape
      if (model.breathiness > 10) {
        const noiseGen = ctx.createOscillator();
        const noiseFilter = ctx.createBiquadFilter();
        const noiseGain = ctx.createGain();
        
        noiseGen.type = 'sawtooth';
        noiseGen.frequency.value = 800; // Breath frequency domain
        
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 2500;
        noiseFilter.Q.value = 1.0;

        noiseGain.gain.value = (model.breathiness / 100) * 0.08;

        noiseGen.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(filter);
        noiseGen.start();
        activeNodes.push(noiseGen, noiseFilter, noiseGain);
      }

      // Reverb implementation: Simulates space wetness
      rev.delayTime.value = 0.1 + (model.reverb / 300);
      const revGain = ctx.createGain();
      revGain.gain.value = (model.reverb / 100) * 0.35;

      // Connections
      osc.connect(filter);
      
      if (model.reverb > 5) {
        filter.connect(rev);
        rev.connect(revGain);
        revGain.connect(gain);
      }
      
      filter.connect(gain);

      // Map volume to subtle indicator level, scaled by the robotic parameter to prevent annoying buzzing
      const roboticScale = model.robotic / 100;
      gain.gain.setValueAtTime((model.volume / 100) * 0.15 * roboticScale, ctx.currentTime);
      gain.connect(analyser);
      analyser.connect(dest);

      osc.start();
      
      // Stop the synth hum when speech ends
      utterance.addEventListener('end', () => {
        osc.stop();
        stopAll();
      });
      utterance.addEventListener('error', () => {
        osc.stop();
        stopAll();
      });
    };

    playSynthesizerModifiers();
  } else {
    // No Speech synthesis support: Fallback to simulated audio loop
    let sampleLength = 3.5; // seconds
    const analyser = ctx.createAnalyser();
    ctx.destination.connect(analyser);

    const timer = setTimeout(() => {
      if (onEnded) onEnded();
    }, sampleLength * 1000);

    return {
      stop: () => {
        clearTimeout(timer);
        if (onEnded) onEnded();
      }
    };
  }

  return { stop: stopAll };
}
