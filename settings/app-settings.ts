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

const SETTINGS_VERSION: 2 = 2;

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
    value.version !== SETTINGS_VERSION ||
    !isLocale(value.locale)
  ) {
    return false;
  }
  return isAppSettingsData(value);
}

/**
 * Upgrades version-one settings while retaining their existing user preferences.
 * @param value The saved settings object to migrate.
 * @param previousLocale The locale saved by the earlier standalone language selector.
 * @returns The upgraded settings, or undefined when the value is not a valid legacy record.
 */
export function migrateLegacyAppSettings(
  value: unknown,
  previousLocale: unknown,
): AppSettings | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !isAppSettingsData(value)
  ) {
    return undefined;
  }
  return {
    version: SETTINGS_VERSION,
    locale: isLocale(previousLocale) ? previousLocale : DEFAULT_LOCALE,
    visualizations: value.visualizations,
    envelope: value.envelope,
    keyboard: value.keyboard,
    volume: value.volume,
  };
}

type AppSettingsData = Omit<AppSettings, "version" | "locale">;

function isAppSettingsData(value: unknown): value is AppSettingsData {
  if (
    typeof value !== "object" ||
    value === null ||
    !("visualizations" in value) ||
    !("envelope" in value) ||
    !("keyboard" in value) ||
    !("volume" in value)
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
