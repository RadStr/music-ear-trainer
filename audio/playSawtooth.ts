import type { PlayMethod } from "./types";

export const playSawtooth: PlayMethod = (
  context: AudioContext,
  frequency: number,
): OscillatorNode => {
  const oscillator: OscillatorNode = context.createOscillator();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  return oscillator;
};
