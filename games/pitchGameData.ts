export interface PitchPattern {
  readonly id: string;
  readonly name: string;
  readonly notes: readonly string[];
  readonly description: string;
  readonly examples: string;
}

export const CHORDS: readonly PitchPattern[] = [
  {
    id: "c-major",
    name: "C major triad",
    notes: ["C", "E", "G"],
    description: "A major triad built from the root, major third, and perfect fifth.",
    examples: "C major appears in countless pop songs and is often used as a home chord.",
  },
];

export const SCALES: readonly PitchPattern[] = [
  {
    id: "c-major",
    name: "C major scale",
    notes: ["C", "D", "E", "F", "G", "A", "B"],
    description: "A seven-note scale with the interval pattern whole, whole, half, whole, whole, whole, half.",
    examples: "The white keys from C to the next C form the C major scale.",
  },
];
