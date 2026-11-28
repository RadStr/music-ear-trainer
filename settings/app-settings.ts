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
import {
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
} from "./language-settings";

const SETTINGS_VERSION: 1 = 1;

export interface AppSettings {
  readonly version: typeof SETTINGS_VERSION;
  readonly locale: Locale;
  readonly visualizations: VisualizationSettings;
  readonly envelope: EnvelopeSettings;
  readonly keyboard: KeyboardSettings;
  readonly volume: number;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  version: SETTINGS_VERSION,
  locale: DEFAULT_LOCALE,
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
    !("locale" in value) ||
    !("visualizations" in value) ||
    !("envelope" in value) ||
    !("keyboard" in value) ||
    !("volume" in value) ||
    value.version !== SETTINGS_VERSION ||
    !isLocale(value.locale)
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
