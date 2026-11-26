import type { PlayMethod } from "./types";

export const playSine: PlayMethod = (
  context: AudioContext,
  frequency: number,
): OscillatorNode => {
  const oscillator: OscillatorNode = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  return oscillator;
};
