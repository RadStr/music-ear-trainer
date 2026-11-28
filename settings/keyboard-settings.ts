import { CHORDS } from "../games/pitchGameData";

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

export interface KeyboardSettings {
  readonly keyCount: number;
  readonly playbackSelection: KeyboardPlaybackSelection;
  readonly audioSource: AudioSource;
  readonly customSampleDirectoryUrl: string;
}

export const DEFAULT_KEYBOARD_SETTINGS: KeyboardSettings = {
  keyCount: 88,
  playbackSelection: "single-note",
  audioSource: "sine",
  customSampleDirectoryUrl: "",
};

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

/**
 * Checks whether a value contains valid keyboard settings.
 * @param value The value to check.
 * @returns Whether the value is a valid keyboard settings record.
 */
export function isKeyboardSettings(value: unknown): value is KeyboardSettings {
  return (
    typeof value === "object" &&
    value !== null &&
    "keyCount" in value &&
    typeof value.keyCount === "number" &&
    Number.isInteger(value.keyCount) &&
    value.keyCount >= 1 &&
    value.keyCount <= 88 &&
    "playbackSelection" in value &&
    isKeyboardPlaybackSelection(value.playbackSelection) &&
    "audioSource" in value &&
    isAudioSource(value.audioSource) &&
    "customSampleDirectoryUrl" in value &&
    typeof value.customSampleDirectoryUrl === "string"
  );
}
