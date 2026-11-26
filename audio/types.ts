export interface Envelope {
  readonly attack: number;
  readonly decay: number;
  readonly sustain: number;
  readonly release: number;
}

export const DEFAULT_ENVELOPE: Envelope = {
  attack: 0.05,
  decay: 0.1,
  sustain: 0.7,
  release: 0,
};

export type PlayMethod = (
  context: AudioContext,
  frequency: number,
) => AudioScheduledSourceNode;

export interface PlayingAudio {
  readonly ready: Promise<void>;
  readonly release: () => void;
}
