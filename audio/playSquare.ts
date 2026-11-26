import type { PlayMethod } from "./types";

export const playSquare: PlayMethod = (
  context: AudioContext,
  frequency: number,
): OscillatorNode => {
  const oscillator: OscillatorNode = context.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  return oscillator;
};
