import { drawNoteWaveforms } from "../note-wave-drawing";
import type { NoteWaveform } from "../note-wave-drawing";
import type { AudioVisualization } from "../visualization";

const SAMPLE_COUNT: number = 1024;
const TIME_WINDOW_SECONDS: number = 0.04;

export class SineIntersectionVisualization implements AudioVisualization {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  /**
   * Draws a sine wave for every active note, regardless of its playback source.
   * @param playedNotes Active notes as MIDI note numbers.
   * @param audioWave Mixed audio samples, unused by this visualization.
   */
  draw(playedNotes: readonly number[], _audioWave: Float32Array): void {
    const noteWaves: NoteWaveform[] = playedNotes.map(
      (midiNote: number): NoteWaveform => {
        const frequency: number = 440 * 2 ** ((midiNote - 69) / 12);
        const audioWave: Float32Array = new Float32Array(SAMPLE_COUNT);
        for (let index: number = 0; index < SAMPLE_COUNT; index += 1) {
          const time: number = (index / (SAMPLE_COUNT - 1)) * TIME_WINDOW_SECONDS;
          audioWave[index] = Math.sin(2 * Math.PI * frequency * time);
        }
        return { midiNote, audioWave };
      },
    );
    drawNoteWaveforms(this.canvas, noteWaves);
  }
}
