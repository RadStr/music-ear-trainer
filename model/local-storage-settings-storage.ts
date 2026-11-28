import {
  DEFAULT_APP_SETTINGS,
  isAppSettings,
  migrateLegacyAppSettings,
  type AppSettings,
} from "../settings/app-settings";
import { isLocale } from "../settings/language-settings";
import type { SettingsStorage } from "./settings-storage";

const STORAGE_KEY: string = "radstr-learning-by-ear.settings";
const LEGACY_LOCALE_STORAGE_KEY: string = "radstr-learning-by-ear.locale";

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
      const previousLocale: string | null =
        window.localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);
      if (isLocale(previousLocale)) {
        const migratedSettings: AppSettings = {
          ...DEFAULT_APP_SETTINGS,
          locale: previousLocale,
        };
        this.storeSettings(migratedSettings);
        window.localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
        return migratedSettings;
      }
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
      const migratedSettings: AppSettings | undefined = migrateLegacyAppSettings(
        parsedSettings,
        window.localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY),
      );
      if (migratedSettings) {
        this.storeSettings(migratedSettings);
        window.localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
        return migratedSettings;
      }
      console.error(
        "Saved settings have an unsupported or invalid format; defaults will be used.",
      );
      return undefined;
    }
    window.localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
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
