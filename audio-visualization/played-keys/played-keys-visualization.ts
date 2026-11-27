import { midiNoteName } from "../../keyboard";
import type { AudioVisualization } from "../visualization";

const WHITE_PITCH_CLASSES: ReadonlySet<number> = new Set<number>([0, 2, 4, 5, 7, 9, 11]);

export class PlayedKeysVisualization implements AudioVisualization {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  /**
   * Draws each active note as a labeled piano key.
   * @param playedNotes Active notes as MIDI note numbers.
   * @param audioWave Current audio samples, unused by this visualization.
   */
  draw(playedNotes: readonly number[], _audioWave: Float32Array): void {
    const context: CanvasRenderingContext2D | null = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to get a 2D context for the played keys.");
    }

    const { width, height } = this.canvas;
    context.clearRect(0, 0, width, height);
    if (playedNotes.length === 0) {
      return;
    }

    const keyWidth: number = width / playedNotes.length;
    const keyHeight: number = height * 0.9;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${Math.max(8, Math.min(14, keyWidth * 0.35))}px sans-serif`;

    playedNotes.forEach((midiNote: number, index: number): void => {
      const x: number = index * keyWidth;
      const isWhiteKey: boolean = WHITE_PITCH_CLASSES.has(midiNote % 12);
      context.fillStyle = isWhiteKey ? "#ffffff" : "#202124";
      context.strokeStyle = "#252525";
      context.fillRect(x, 0, keyWidth, keyHeight);
      context.strokeRect(x, 0, keyWidth, keyHeight);
      context.fillStyle = isWhiteKey ? "#202124" : "#ffffff";
      context.fillText(midiNoteName(midiNote), x + keyWidth / 2, keyHeight * 0.82);
    });
  }
}
