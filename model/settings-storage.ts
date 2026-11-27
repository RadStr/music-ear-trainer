import { DEFAULT_ENVELOPE, type Envelope } from "../audio/types";
import { CHORDS } from "../games/pitchGameData";

const SETTINGS_VERSION: 1 = 1;

export type KeyboardPlaybackSelection =
  | "single-note"
  | (typeof CHORDS)[number]["id"];

export type AudioSource =
  | "sine"
  | "square"
  | "sawtooth"
  | "meta-piano"
  | "meta-nylon-guitar"
  | "meta-steel-guitar"
  | "custom";

export interface VisualizationSettings {
  readonly audioWave: boolean;
  readonly playedKeys: boolean;
  readonly sineIntersection: boolean;
  readonly staticIntersection: boolean;
}

export interface KeyboardSettings {
  readonly keyCount: number;
  readonly playbackSelection: KeyboardPlaybackSelection;
  readonly audioSource: AudioSource;
  readonly customSampleDirectoryUrl: string;
}

export interface AppSettings {
  readonly version: typeof SETTINGS_VERSION;
  readonly visualizations: VisualizationSettings;
  readonly envelope: Envelope;
  readonly keyboard: KeyboardSettings;
  readonly volume: number;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  version: SETTINGS_VERSION,
  visualizations: {
    audioWave: true,
    playedKeys: true,
    sineIntersection: true,
    staticIntersection: true,
  },
  envelope: DEFAULT_ENVELOPE,
  keyboard: {
    keyCount: 88,
    playbackSelection: "single-note",
    audioSource: "sine",
    customSampleDirectoryUrl: "",
  },
  volume: 70,
};

const STORAGE_KEY: string = "radstr-learning-by-ear.settings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Checks whether a value names a supported audio source.
 * @param value The value to check.
 * @returns Whether the value is a supported audio source.
 */
export function isAudioSource(value: unknown): value is AudioSource {
  return (
    value === "sine" ||
    value === "square" ||
    value === "sawtooth" ||
    value === "meta-piano" ||
    value === "meta-nylon-guitar" ||
    value === "meta-steel-guitar" ||
    value === "custom"
  );
}

/**
 * Checks whether a value names a supported keyboard playback selection.
 * @param value The value to check.
 * @returns Whether the value is a supported keyboard playback selection.
 */
export function isKeyboardPlaybackSelection(
  value: unknown,
): value is KeyboardPlaybackSelection {
  return (
    value === "single-note" ||
    CHORDS.some((chord): boolean => chord.id === value)
  );
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    isRecord(value) &&
    typeof value.attack === "number" &&
    Number.isFinite(value.attack) &&
    value.attack >= 0 &&
    value.attack <= 5 &&
    typeof value.decay === "number" &&
    Number.isFinite(value.decay) &&
    value.decay >= 0 &&
    value.decay <= 5 &&
    typeof value.sustain === "number" &&
    Number.isFinite(value.sustain) &&
    value.sustain >= 0 &&
    value.sustain <= 1 &&
    typeof value.release === "number" &&
    Number.isFinite(value.release) &&
    value.release >= 0 &&
    value.release <= 5
  );
}

function isAppSettings(value: unknown): value is AppSettings {
  if (!isRecord(value) || value.version !== SETTINGS_VERSION) {
    return false;
  }
  const visualizations: unknown = value.visualizations;
  const keyboard: unknown = value.keyboard;
  return (
    isRecord(visualizations) &&
    typeof visualizations.audioWave === "boolean" &&
    typeof visualizations.playedKeys === "boolean" &&
    typeof visualizations.sineIntersection === "boolean" &&
    typeof visualizations.staticIntersection === "boolean" &&
    isEnvelope(value.envelope) &&
    isRecord(keyboard) &&
    Number.isInteger(keyboard.keyCount) &&
    typeof keyboard.keyCount === "number" &&
    keyboard.keyCount >= 1 &&
    keyboard.keyCount <= 88 &&
    isKeyboardPlaybackSelection(keyboard.playbackSelection) &&
    isAudioSource(keyboard.audioSource) &&
    typeof keyboard.customSampleDirectoryUrl === "string" &&
    typeof value.volume === "number" &&
    Number.isInteger(value.volume) &&
    value.volume >= 0 &&
    value.volume <= 100
  );
}

export interface SettingsStorage {
  loadSettings(): AppSettings | undefined;
  storeSettings(settings: AppSettings): void;
}

export class LocalStorageSettingsStorage implements SettingsStorage {
  /**
   * Loads validated settings from browser storage, or returns undefined when none are saved.
   * Invalid saved data is reported and ignored so the app can start with its defaults.
   * @returns The saved application settings, if a valid record exists.
   */
  loadSettings(): AppSettings | undefined {
    const serializedSettings: string | null =
      window.localStorage.getItem(STORAGE_KEY);
    if (serializedSettings === null) {
      return undefined;
    }

    let parsedSettings: unknown;
    try {
      parsedSettings = JSON.parse(serializedSettings);
    } catch (error: unknown) {
      console.error("Saved settings are not valid JSON; defaults will be used.", error);
      return undefined;
    }

    if (!isAppSettings(parsedSettings)) {
      console.error(
        "Saved settings have an unsupported or invalid format; defaults will be used.",
      );
      return undefined;
    }
    return parsedSettings;
  }

  /**
   * Serializes the grouped application settings to browser storage.
   * @param settings The complete settings record to save.
   */
  storeSettings(settings: AppSettings): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}
