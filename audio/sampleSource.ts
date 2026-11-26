import type { PlayMethod } from "./types";

export interface SampleDefinition {
  readonly url: string;
  readonly rootMidiNote: number;
  readonly audioData?: ArrayBuffer;
}

export type SampleResolver = (midiNote: number) => Promise<SampleDefinition>;

export class SampleSource {
  private readonly resolveSample: SampleResolver;
  private readonly buffers: Map<string, Promise<AudioBuffer>> = new Map<
    string,
    Promise<AudioBuffer>
  >();
  private readonly resolutions: Map<number, Promise<SampleDefinition>> = new Map<
    number,
    Promise<SampleDefinition>
  >();

  /**
   * Creates a sample source backed by a MIDI-aware resolver.
   * @param resolveSample Resolves the best sample definition for a MIDI note.
   */
  constructor(resolveSample: SampleResolver) {
    this.resolveSample = resolveSample;
  }

  /**
   * Resolves, decodes, and caches a playable method for a MIDI note.
   * @param midiNote The MIDI note that should be played.
   * @param context The audio context used to decode and create the sample buffer.
   * @returns A method that creates a buffer source configured for pitch and playback rate.
   */
  async getPlayMethod(midiNote: number, context: AudioContext): Promise<PlayMethod> {
    let samplePromise: Promise<SampleDefinition> | undefined =
      this.resolutions.get(midiNote);
    if (!samplePromise) {
      samplePromise = this.resolveSample(midiNote);
      this.resolutions.set(midiNote, samplePromise);
      void samplePromise.catch((): void => {
        this.resolutions.delete(midiNote);
      });
    }
    const sample: SampleDefinition = await samplePromise;
    let bufferPromise: Promise<AudioBuffer> | undefined = this.buffers.get(sample.url);
    if (!bufferPromise) {
      bufferPromise = this.loadBuffer(sample, context);
      this.buffers.set(sample.url, bufferPromise);
      void bufferPromise.catch((): void => {
        this.buffers.delete(sample.url);
      });
    }

    const buffer: AudioBuffer = await bufferPromise;
    const playbackRate: number = 2 ** ((midiNote - sample.rootMidiNote) / 12);
    return (audioContext: AudioContext): AudioBufferSourceNode => {
      const source: AudioBufferSourceNode = audioContext.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.setValueAtTime(playbackRate, audioContext.currentTime);
      return source;
    };
  }

  /**
   * Loads and decodes a sample definition.
   * @param sample The sample URL or embedded audio data to load.
   * @param context The audio context used for decoding.
   * @returns The decoded audio buffer.
   */
  private async loadBuffer(
    sample: SampleDefinition,
    context: AudioContext,
  ): Promise<AudioBuffer> {
    let audioData: ArrayBuffer;
    if (sample.audioData) {
      audioData = sample.audioData;
    } else {
      const response: Response = await fetch(sample.url);
      if (!response.ok) {
        throw new Error(`Unable to load audio sample (${response.status}): ${sample.url}`);
      }
      audioData = await response.arrayBuffer();
    }
    return context.decodeAudioData(audioData.slice(0));
  }
}

/**
 * Normalizes a user-provided sample directory URL and converts GitHub tree URLs.
 * @param input The directory URL entered by the user.
 * @returns A normalized HTTP or HTTPS URL ending in a slash.
 */
export function normalizeSampleDirectoryUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Enter a valid sample directory URL.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Sample URLs must use HTTP or HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("Sample directory URLs must not contain credentials.");
  }

  if (url.hostname === "github.com") {
    const match: RegExpMatchArray | null = url.pathname.match(
      /^\/([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.*))?\/?$/,
    );
    if (!match) {
      throw new Error("Use a GitHub directory URL in the form /owner/repository/tree/branch/path.");
    }
    const owner: string | undefined = match[1];
    const repository: string | undefined = match[2];
    const branch: string | undefined = match[3];
    const directory: string = match[4] ?? "";
    if (!owner || !repository || !branch) {
      throw new Error("The GitHub directory URL is incomplete.");
    }
    url = new URL(
      `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/${directory}`,
    );
  }

  url.search = "";
  url.hash = "";
  if (!url.pathname.endsWith("/")) {
    url.pathname += "/";
  }
  return url.href;
}

const CUSTOM_SAMPLE_EXTENSIONS: readonly string[] = [
  "wav",
  "ogg",
  "oga",
  "mp3",
  "m4a",
  "mp4",
  "aac",
  "opus",
  "webm",
  "flac",
  "aiff",
  "aif",
  "caf",
  "3gp",
];

/**
 * Creates a resolver for custom numbered audio files in a directory.
 * @param directoryUrl The normalized directory containing files 1 through 88.
 * @returns A sample source that searches supported extensions for each MIDI note.
 */
export function createCustomSampleSource(directoryUrl: string): SampleSource {
  return new SampleSource(async (midiNote: number): Promise<SampleDefinition> => {
    const sampleNumber: number = midiNote - 20;
    if (!Number.isInteger(sampleNumber) || sampleNumber < 1 || sampleNumber > 88) {
      throw new RangeError("Custom samples map files 1–88 to MIDI notes 21–108.");
    }

    for (const extension of CUSTOM_SAMPLE_EXTENSIONS) {
      const url: string = new URL(`${sampleNumber}.${extension}`, directoryUrl).href;
      const response: Response = await fetch(url);
      if (response.ok) {
        return {
          url,
          rootMidiNote: midiNote,
          audioData: await response.arrayBuffer(),
        };
      }
      if (response.status !== 404) {
        throw new Error(`Unable to check audio sample (${response.status}): ${url}`);
      }
    }

    throw new Error(
      `No supported audio file was found for keyboard note ${sampleNumber} (tried ${CUSTOM_SAMPLE_EXTENSIONS.map((extension: string): string => `.${extension}`).join(", ")}).`,
    );
  });
}
