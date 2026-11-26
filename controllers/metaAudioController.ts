import { SampleSource, type SampleDefinition } from "../audio/sampleSource";
import type { PlayMethod } from "../audio/types";

export const META_INSTRUMENTS: readonly {
  readonly id: string;
  readonly label: string;
  readonly layerPattern: RegExp;
}[] = [
  { id: "meta-piano", label: "Piano", layerPattern: /_Vel03_/ },
  { id: "meta-nylon-guitar", label: "Nylon guitar", layerPattern: /_Vel02Pick_/ },
  { id: "meta-steel-guitar", label: "Steel guitar", layerPattern: /_Vel02_/ },
];

const META_OPEN_SOUND_REVISION: string = "514c926efecdb3c7812bf00eedf8e5c8d61dd681";
const META_RAW_BASE: string = `https://raw.githubusercontent.com/facebookincubator/Meta-open-sound/${META_OPEN_SOUND_REVISION}`;
const PITCH_CLASSES: Readonly<Record<string, number>> = {
  C: 0,
  Cs: 1,
  D: 2,
  Ds: 3,
  E: 4,
  F: 5,
  Fs: 6,
  G: 7,
  Gs: 8,
  A: 9,
  As: 10,
  B: 11,
};

interface MetaInstrument {
  readonly id: string;
  readonly layerPattern: RegExp;
}

interface MappedSample extends SampleDefinition {
  readonly midiNote: number;
}

export class MetaAudioController {
  private readonly sources: Map<string, Promise<SampleSource>> = new Map<
    string,
    Promise<SampleSource>
  >();

  /**
   * Resolves a playable instrument method for a MIDI note.
   * @param instrumentId The Meta Open Sound instrument identifier.
   * @param midiNote The MIDI note to play.
   * @param context The audio context used for decoding.
   * @returns A play method for the closest available sample.
   */
  async getPlayMethod(
    instrumentId: string,
    midiNote: number,
    context: AudioContext,
  ): Promise<PlayMethod> {
    const instrument: MetaInstrument | undefined = META_INSTRUMENTS.find(
      (candidate: (typeof META_INSTRUMENTS)[number]): boolean =>
        candidate.id === instrumentId,
    );
    if (!instrument) {
      throw new Error(`Unsupported Meta Open Sound instrument: ${instrumentId}`);
    }

    let sourcePromise: Promise<SampleSource> | undefined = this.sources.get(instrumentId);
    if (!sourcePromise) {
      sourcePromise = this.createSampleSource(instrument);
      this.sources.set(instrumentId, sourcePromise);
      void sourcePromise.catch((): void => {
        this.sources.delete(instrumentId);
      });
    }
    const source: SampleSource = await sourcePromise;
    return source.getPlayMethod(midiNote, context);
  }

  private async createSampleSource(instrument: MetaInstrument): Promise<SampleSource> {
    const manifestUrl: string = `${META_RAW_BASE}/systems/instruments/${instrument.id}/manifest.json`;
    const response: Response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error(`Unable to load the Meta instrument manifest (${response.status}).`);
    }
    const manifest: unknown = await response.json();
    const mappedSamples: MappedSample[] = this.readManifest(manifest, instrument);
    if (mappedSamples.length === 0) {
      throw new Error(`No playable samples were found for ${instrument.id}.`);
    }

    return new SampleSource(async (midiNote: number): Promise<SampleDefinition> => {
      let closest: MappedSample | undefined;
      for (const sample of mappedSamples) {
        if (
          !closest ||
          Math.abs(sample.midiNote - midiNote) < Math.abs(closest.midiNote - midiNote)
        ) {
          closest = sample;
        }
      }
      if (!closest) {
        throw new Error(`No sample is available for MIDI note ${midiNote}.`);
      }
      return closest;
    });
  }

  private readManifest(manifest: unknown, instrument: MetaInstrument): MappedSample[] {
    if (typeof manifest !== "object" || manifest === null || !("samples" in manifest)) {
      throw new Error(`The Meta instrument manifest for ${instrument.id} is invalid.`);
    }
    const samples: unknown = manifest.samples;
    if (!Array.isArray(samples)) {
      throw new Error(`The Meta instrument manifest for ${instrument.id} has no sample list.`);
    }

    const mappedSamples: MappedSample[] = [];
    for (const sample of samples) {
      if (
        typeof sample !== "object" ||
        sample === null ||
        !("file" in sample) ||
        typeof sample.file !== "string" ||
        !instrument.layerPattern.test(sample.file)
      ) {
        continue;
      }
      const noteMatch: RegExpMatchArray | null = sample.file.match(
        /_(A|As|B|C|Cs|D|Ds|E|F|Fs|G|Gs)([0-8])_01\.wav$/i,
      );
      const pitchClass: number | undefined = noteMatch?.[1]
        ? PITCH_CLASSES[noteMatch[1]]
        : undefined;
      const octave: number | undefined =
        noteMatch?.[2] === undefined ? undefined : Number(noteMatch[2]);
      if (pitchClass === undefined || octave === undefined) {
        continue;
      }
      const file: string = sample.file.replace(/\.wav$/i, ".ogg");
      mappedSamples.push({
        midiNote: 12 * (octave + 1) + pitchClass,
        rootMidiNote: 12 * (octave + 1) + pitchClass,
        url: `${META_RAW_BASE}/systems/instruments/${instrument.id}/ogg/${encodeURIComponent(file)}`,
      });
    }
    return mappedSamples;
  }
}
