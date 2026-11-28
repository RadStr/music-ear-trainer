import type { AppSettings } from "../settings/app-settings";

export interface SettingsStorage {
  loadSettings(): AppSettings | undefined;
  storeSettings(settings: AppSettings): void;
}
