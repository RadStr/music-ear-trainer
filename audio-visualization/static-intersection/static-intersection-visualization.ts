import { midiNoteName } from "../../keyboard";
import type { AudioVisualization } from "../visualization";
import { localize } from "../../localization";

const MAX_BASE_NOTE_CYCLES: number = 32;
const WAVE_COLORS: readonly string[] = [
  "#2878d0",
  "#e47736",
  "#8b5cc7",
  "#31966b",
  "#d34f70",
  "#85722c",
];

interface CycleAlignment {
  readonly cycleCounts: readonly number[];
  readonly baseNoteCycles: number;
  readonly largestMismatch: number;
}

export class StaticIntersectionVisualization implements AudioVisualization {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly explanation: HTMLOutputElement,
  ) {}

  /**
   * Draws every active note and reports their closest simple cycle-count ratio.
   * @param playedNotes Active notes as MIDI note numbers.
   * @param audioWave Mixed audio samples, unused by this visualization.
   */
  draw(playedNotes: readonly number[], _audioWave: Float32Array): void {
    const notes: number[] = Array.from(new Set<number>(playedNotes)).sort(
      (first: number, second: number): number => first - second,
    );
    const context: CanvasRenderingContext2D | null = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to get a 2D context for the static intersection.");
    }

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (notes.length === 0) {
      this.explanation.textContent = "Play one or more notes to compare their cycle counts.";
      return;
    }

    const frequencies: number[] = notes.map(
      (midiNote: number): number => this.midiToFrequency(midiNote),
    );
    const alignment: CycleAlignment = this.findCycleAlignment(frequencies);
    const baseFrequency: number = frequencies[0] ?? 1;
    this.drawWaves(context, frequencies, alignment.baseNoteCycles, baseFrequency);

    const noteCounts: string = notes
      .map((midiNote: number, index: number): string => {
        const cycleCount: number = alignment.cycleCounts[index] ?? 1;
        const cycleLabel: string = localize(cycleCount === 1 ? "cycle" : "cycles");
        return `${midiNoteName(midiNote)}: ${cycleCount} ${cycleLabel}`;
      })
      .join(", ");
    const exactness: string = alignment.largestMismatch < 0.000001
      ? "These cycle counts align exactly."
      : localize(
          `This is the closest simple match within ${MAX_BASE_NOTE_CYCLES} cycles of the lowest note; equal-tempered notes may not align exactly.`,
        );
    this.explanation.textContent =
      localize(
        `Cycle ratio ${alignment.cycleCounts.join(":")} (${noteCounts}). ${exactness}`,
      );
  }

  private midiToFrequency(midiNote: number): number {
    return 440 * 2 ** ((midiNote - 69) / 12);
  }

  private findCycleAlignment(frequencies: readonly number[]): CycleAlignment {
    const baseFrequency: number = frequencies[0] ?? 1;
    let bestAlignment: CycleAlignment = {
      cycleCounts: frequencies.map((): number => 1),
      baseNoteCycles: 1,
      largestMismatch: Number.POSITIVE_INFINITY,
    };

    for (
      let baseNoteCycles: number = 1;
      baseNoteCycles <= MAX_BASE_NOTE_CYCLES;
      baseNoteCycles += 1
    ) {
      const cycleCounts: number[] = frequencies.map(
        (frequency: number): number =>
          Math.round((frequency / baseFrequency) * baseNoteCycles),
      );
      let largestMismatch: number = 0;
      for (let index: number = 0; index < frequencies.length; index += 1) {
        const frequency: number | undefined = frequencies[index];
        const cycleCount: number | undefined = cycleCounts[index];
        if (frequency === undefined || cycleCount === undefined) {
          throw new RangeError(`Frequency ${index} is unavailable.`);
        }
        const expectedCycles: number = (frequency / baseFrequency) * baseNoteCycles;
        largestMismatch = Math.max(largestMismatch, Math.abs(expectedCycles - cycleCount));
      }

      if (largestMismatch < bestAlignment.largestMismatch) {
        bestAlignment = { cycleCounts, baseNoteCycles, largestMismatch };
      }
    }
    return bestAlignment;
  }

  private drawWaves(
    context: CanvasRenderingContext2D,
    frequencies: readonly number[],
    baseNoteCycles: number,
    baseFrequency: number,
  ): void {
    const { width, height } = this.canvas;
    const centerY: number = height / 2;
    const amplitude: number = height * 0.38;
    const sampleCount: number = 1024;
    const displayDuration: number = baseNoteCycles / baseFrequency;

    frequencies.forEach((frequency: number, waveIndex: number): void => {
      context.beginPath();
      for (let index: number = 0; index < sampleCount; index += 1) {
        const progress: number = index / (sampleCount - 1);
        const time: number = progress * displayDuration;
        const x: number = progress * width;
        const y: number = centerY - Math.sin(2 * Math.PI * frequency * time) * amplitude;
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.strokeStyle = WAVE_COLORS[waveIndex % WAVE_COLORS.length] ?? WAVE_COLORS[0] ?? "#2878d0";
      context.lineWidth = 2;
      context.stroke();
    });
  }
}
