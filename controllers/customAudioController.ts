import {
  createCustomSampleSource,
  normalizeSampleDirectoryUrl,
  SampleSource,
} from "../audio/sampleSource";
import type { PlayMethod } from "../audio/types";

export class CustomAudioController {
  private source: SampleSource | undefined;

  /**
   * Normalizes a directory URL and installs a custom sample source.
   * @param input The custom sample directory URL.
   * @returns The normalized directory URL.
   */
  setDirectoryUrl(input: string): string {
    const directoryUrl: string = normalizeSampleDirectoryUrl(input);
    this.source = createCustomSampleSource(directoryUrl);
    return directoryUrl;
  }

  /**
   * Resolves a custom sample play method for a MIDI note.
   * @param midiNote The MIDI note to play.
   * @param context The audio context used to decode the sample.
   * @returns A play method for the resolved sample.
   */
  async getPlayMethod(midiNote: number, context: AudioContext): Promise<PlayMethod> {
    if (!this.source) {
      throw new Error("Load a custom sample directory before playing custom audio.");
    }
    return this.source.getPlayMethod(midiNote, context);
  }
}
