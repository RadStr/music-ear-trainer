export type Locale = "cs" | "en";

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_CHOICES: readonly Readonly<{ locale: Locale; label: string }>[] = [
  { locale: "en", label: "English" },
  { locale: "cs", label: "CZ (AI)" },
];

/** Checks whether a value is a supported locale. */
export function isLocale(value: unknown): value is Locale {
  return value === "cs" || value === "en";
}
