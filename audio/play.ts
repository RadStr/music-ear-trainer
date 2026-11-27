import type { Envelope, PlayMethod, PlayingAudio } from "./types";

let audioContext: AudioContext | undefined;
let audioAnalyser: AnalyserNode | undefined;
let masterVolume: number = 0.7;
const activeVolumeGains: Set<GainNode> = new Set<GainNode>();
const EMPTY_AUDIO_WAVE: Float32Array = new Float32Array(0);

/**
 * Creates or reuses the shared Web Audio context and resumes suspended playback.
 * @returns The shared audio context for scheduled voices.
 */
export function prepareAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 2048;
    audioAnalyser.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume().catch((error: unknown) => {
      console.error("Unable to resume audio playback.", error);
    });
  }
  return audioContext;
}

/**
 * Reads the current mixed audio signal for the waveform visualization.
 * @returns A snapshot of the analyser's time-domain samples, or an empty array before playback starts.
 */
export function getCurrentAudioWave(): Float32Array {
  if (!audioAnalyser || !audioContext || audioContext.state === "closed") {
    return EMPTY_AUDIO_WAVE;
  }

  const samples: Float32Array<ArrayBuffer> = new Float32Array(audioAnalyser.fftSize);
  audioAnalyser.getFloatTimeDomainData(samples);
  return samples;
}

/**
 * Updates the master volume and smoothly applies it to currently active voices.
 * @param volume The normalized volume from zero through one.
 */
export function setMasterVolume(volume: number): void {
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
    throw new RangeError("Volume must be between 0 and 1.");
  }
  masterVolume = volume;
  if (!audioContext || audioContext.state === "closed") {
    return;
  }

  const now: number = audioContext.currentTime;
  for (const volumeGain of activeVolumeGains) {
    volumeGain.gain.cancelScheduledValues(now);
    volumeGain.gain.setTargetAtTime(volume, now, 0.02);
  }
}

function envelopeLevelAtTime(
  envelope: Envelope,
  elapsedSeconds: number,
  sustainLevel: number,
): number {
  const initialLevel: number = 0.0001;
  if (envelope.attack > 0 && elapsedSeconds < envelope.attack) {
    const attackProgress: number = elapsedSeconds / envelope.attack;
    return initialLevel + (1 - initialLevel) * attackProgress;
  }

  const decayElapsed: number = elapsedSeconds - envelope.attack;
  if (envelope.decay > 0 && decayElapsed < envelope.decay) {
    const decayProgress: number = decayElapsed / envelope.decay;
    return 1 + (sustainLevel - 1) * decayProgress;
  }

  return sustainLevel;
}

/**
 * Plays a frequency through the selected synthesis method with an ADSR envelope.
 * @param playMethod Builds the oscillator or buffer source for the voice.
 * @param frequency The positive frequency of the voice in hertz.
 * @param envelope The attack, decay, sustain, and release settings.
 * @returns A controllable voice whose readiness and release behavior can be observed.
 */
export function playAudio(
  playMethod: PlayMethod,
  frequency: number,
  envelope: Envelope,
): PlayingAudio {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    throw new RangeError("Frequency must be a positive finite number.");
  }
  if (
    !Number.isFinite(envelope.attack) ||
    envelope.attack < 0 ||
    !Number.isFinite(envelope.decay) ||
    envelope.decay < 0 ||
    !Number.isFinite(envelope.sustain) ||
    envelope.sustain < 0 ||
    envelope.sustain > 1 ||
    !Number.isFinite(envelope.release) ||
    envelope.release < 0
  ) {
    throw new RangeError("Envelope times must be non-negative and sustain must be between 0 and 1.");
  }

  const context: AudioContext = prepareAudioContext();
  if (!audioAnalyser) {
    throw new Error("The audio analyser is unavailable.");
  }

  const now: number = context.currentTime;
  const source: AudioScheduledSourceNode = playMethod(context, frequency);
  const gain: GainNode = context.createGain();
  const volumeGain: GainNode = context.createGain();
  const gainParameter: AudioParam = gain.gain;
  const sustainLevel: number = Math.max(envelope.sustain, 0.0001);

  source.connect(gain);
  gain.connect(volumeGain);
  volumeGain.connect(audioAnalyser);
  volumeGain.gain.setValueAtTime(masterVolume, now);
  activeVolumeGains.add(volumeGain);
  gainParameter.setValueAtTime(0.0001, now);
  if (envelope.attack === 0) {
    gainParameter.setValueAtTime(1, now);
  } else {
    gainParameter.linearRampToValueAtTime(1, now + envelope.attack);
  }

  const decayEnd: number = now + envelope.attack + envelope.decay;
  if (envelope.decay === 0) {
    gainParameter.setValueAtTime(sustainLevel, decayEnd);
  } else {
    gainParameter.linearRampToValueAtTime(sustainLevel, decayEnd);
  }

  source.addEventListener(
    "ended",
    () => {
      source.disconnect();
      gain.disconnect();
      volumeGain.disconnect();
      activeVolumeGains.delete(volumeGain);
    },
    { once: true },
  );
  source.start(now);

  let released: boolean = false;
  return {
    ready: Promise.resolve(),
    release: (): void => {
      if (released) {
        return;
      }
      released = true;

      const releaseStart: number = context.currentTime;
      if (envelope.release === 0) {
        gain.disconnect();
        source.stop();
      } else {
        const releaseEnd: number = releaseStart + envelope.release;
        const elapsedSeconds: number = Math.max(0, releaseStart - now);
        const currentLevel: number = envelopeLevelAtTime(
          envelope,
          elapsedSeconds,
          sustainLevel,
        );
        gainParameter.cancelScheduledValues(releaseStart);
        gainParameter.setValueAtTime(currentLevel, releaseStart);
        gainParameter.exponentialRampToValueAtTime(0.0001, releaseEnd);
        gainParameter.setValueAtTime(0, releaseEnd);
        source.stop(releaseEnd);
      }
    },
  };
}
