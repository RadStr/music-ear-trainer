export interface AudioVisualization {
  /**
   * Draws the current notes and audio waveform into this visualization.
   * @param playedNotes Active notes as MIDI note numbers.
   * @param audioWave Time-domain audio samples.
   */
  draw(playedNotes: readonly number[], audioWave: Float32Array): void;
}
