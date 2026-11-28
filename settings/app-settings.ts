import {
  DEFAULT_ENVELOPE_SETTINGS,
  isEnvelopeSettings,
  type EnvelopeSettings,
} from "./envelope-settings";
import {
  DEFAULT_KEYBOARD_SETTINGS,
  isKeyboardSettings,
  type KeyboardSettings,
} from "./keyboard-settings";
import {
  DEFAULT_VISUALIZATION_SETTINGS,
  isVisualizationSettings,
  type VisualizationSettings,
} from "./visualization-settings";

const SETTINGS_VERSION: 1 = 1;

export interface AppSettings {
  readonly version: typeof SETTINGS_VERSION;
  readonly visualizations: VisualizationSettings;
  readonly envelope: EnvelopeSettings;
  readonly keyboard: KeyboardSettings;
  readonly volume: number;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  version: SETTINGS_VERSION,
  visualizations: DEFAULT_VISUALIZATION_SETTINGS,
  envelope: DEFAULT_ENVELOPE_SETTINGS,
  keyboard: DEFAULT_KEYBOARD_SETTINGS,
  volume: 70,
};

/**
 * Checks whether a value contains all supported application settings.
 * @param value The value to check.
 * @returns Whether the value is a valid application settings record.
 */
export function isAppSettings(value: unknown): value is AppSettings {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    !("visualizations" in value) ||
    !("envelope" in value) ||
    !("keyboard" in value) ||
    !("volume" in value) ||
    value.version !== SETTINGS_VERSION
  ) {
    return false;
  }
  return (
    isVisualizationSettings(value.visualizations) &&
    isEnvelopeSettings(value.envelope) &&
    isKeyboardSettings(value.keyboard) &&
    typeof value.volume === "number" &&
    Number.isInteger(value.volume) &&
    value.volume >= 0 &&
    value.volume <= 100
  );
}
