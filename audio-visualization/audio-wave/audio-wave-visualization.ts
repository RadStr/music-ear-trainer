import type { AudioVisualization } from "../visualization";

export class AudioWaveVisualization implements AudioVisualization {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  /**
   * Draws the current waveform, scaled to the canvas dimensions.
   * @param playedNotes Active MIDI notes, unused by this visualization.
   * @param audioWave Time-domain audio samples.
   */
  draw(_playedNotes: readonly number[], audioWave: Float32Array): void {
    const context: CanvasRenderingContext2D | null = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to get a 2D context for the audio waveform.");
    }

    const { width, height } = this.canvas;
    context.clearRect(0, 0, width, height);
    if (audioWave.length === 0) {
      context.beginPath();
      context.moveTo(0, height / 2);
      context.lineTo(width, height / 2);
      context.strokeStyle = "#2878d0";
      context.lineWidth = 2;
      context.stroke();
      return;
    }

    const centerY: number = height / 2;
    const amplitude: number = centerY;
    const lastSampleIndex: number = audioWave.length - 1;
    context.beginPath();
    for (let index: number = 0; index <= lastSampleIndex; index += 1) {
      const sample: number | undefined = audioWave[index];
      if (sample === undefined) {
        throw new RangeError(`Audio waveform sample ${index} is unavailable.`);
      }
      const x: number = lastSampleIndex === 0
        ? width / 2
        : (index / lastSampleIndex) * width;
      const y: number = centerY - Math.max(-1, Math.min(1, sample)) * amplitude;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.strokeStyle = "#2878d0";
    context.lineWidth = 2;
    context.stroke();
  }
}
