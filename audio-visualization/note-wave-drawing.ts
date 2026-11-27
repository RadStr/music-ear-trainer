import { midiNoteName } from "../keyboard";

const WAVE_COLOR: string = "#2878d0";
const LABEL_WIDTH: number = 48;

export interface NoteWaveform {
  readonly midiNote: number;
  readonly audioWave: Float32Array;
}

/** Draws labeled, independent waveforms in separate horizontal rows. */
export function drawNoteWaveforms(
  canvas: HTMLCanvasElement,
  noteWaves: readonly NoteWaveform[],
): void {
  const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to get a 2D context for the note waveforms.");
  }

  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  if (noteWaves.length === 0) {
    context.beginPath();
    context.moveTo(LABEL_WIDTH, height / 2);
    context.lineTo(width, height / 2);
    context.strokeStyle = WAVE_COLOR;
    context.lineWidth = 2;
    context.stroke();
    return;
  }

  const rowHeight: number = height / noteWaves.length;
  const graphWidth: number = Math.max(0, width - LABEL_WIDTH);
  context.font = "12px sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.lineWidth = 1;

  for (const [rowIndex, noteWave] of noteWaves.entries()) {
    const rowTop: number = rowIndex * rowHeight;
    const centerY: number = rowTop + rowHeight / 2;
    const amplitude: number = rowHeight * 0.4;
    context.fillStyle = "#4a4b64";
    context.fillText(midiNoteName(noteWave.midiNote), 2, centerY);
    context.beginPath();
    context.moveTo(LABEL_WIDTH, centerY);
    context.lineTo(width, centerY);
    context.strokeStyle = "#d8d9e3";
    context.stroke();

    if (noteWave.audioWave.length === 0) {
      continue;
    }

    const lastSampleIndex: number = noteWave.audioWave.length - 1;
    context.beginPath();
    for (let index: number = 0; index <= lastSampleIndex; index += 1) {
      const sample: number | undefined = noteWave.audioWave[index];
      if (sample === undefined) {
        throw new RangeError(`Audio waveform sample ${index} is unavailable.`);
      }
      const x: number = LABEL_WIDTH + (index / Math.max(1, lastSampleIndex)) * graphWidth;
      const y: number = centerY - Math.max(-1, Math.min(1, sample)) * amplitude;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.strokeStyle = WAVE_COLOR;
    context.lineWidth = 2;
    context.stroke();
  }
}
