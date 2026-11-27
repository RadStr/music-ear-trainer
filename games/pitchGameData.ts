export interface PitchPattern {
  readonly id: string;
  readonly name: string;
  readonly notes: readonly string[];
  readonly description: string;
  readonly examples: string;
}

export const NOTE_PITCH_CLASSES: Readonly<Record<string, number>> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export const CHORDS = [
  {
    id: "c-major",
    name: "C major triad",
    notes: ["C", "E", "G"],
    description: "A major triad built from the root, major third, and perfect fifth.",
    examples: "C major appears in countless pop songs and is often used as a home chord.",
  },
] as const satisfies readonly PitchPattern[];

export const SCALES: readonly PitchPattern[] = [
  {
    id: "c-major",
    name: "C major scale",
    notes: ["C", "D", "E", "F", "G", "A", "B"],
    description: "A seven-note scale with the interval pattern whole, whole, half, whole, whole, whole, half.",
    examples: "The white keys from C to the next C form the C major scale.",
  },
];
