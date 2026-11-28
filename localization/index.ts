import { czech } from "./cs/strings";
import { english } from "./en/strings";

export type Locale = "cs" | "en";

const LANGUAGE_STORAGE_KEY: string = "radstr-learning-by-ear.locale";
const czechTranslations: Readonly<Record<keyof typeof english, string>> = czech;
const translations: Readonly<Record<Locale, Readonly<Record<keyof typeof english, string>>>> = {
  cs: czechTranslations,
  en: english,
};
const templateTranslations: readonly (readonly [RegExp, string, readonly string[]])[] =
  Object.entries(czechTranslations)
    .filter(([source]) => source.includes("{"))
    .map(([source, translated]): readonly [RegExp, string, readonly string[]] => {
      const placeholders: string[] = Array.from(source.matchAll(/\{([^}]+)\}/g), (match) =>
        match[1] ?? "",
      );
      const expression: string = source
        .split(/\{[^}]+\}/g)
        .map((part: string): string => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("(.+?)");
      return [new RegExp(`^${expression}$`), translated, placeholders];
    });

let activeLocale: Locale = "en";

/** Returns the selected language. */
export function getLocale(): Locale {
  return activeLocale;
}

/** Translates a visible string or a supported interpolated message. */
export function localize(text: string): string {
  if (activeLocale === "en") {
    return text;
  }
  if (Object.prototype.hasOwnProperty.call(translations[activeLocale], text)) {
    return translations[activeLocale][text as keyof typeof english];
  }
  for (const [expression, translated, placeholders] of templateTranslations) {
    const match: RegExpMatchArray | null = text.match(expression);
    if (!match) {
      continue;
    }
    let index: number = 1;
    return translated.replace(/\{([^}]+)\}/g, (_placeholder: string, name: string): string => {
      const placeholderIndex: number = placeholders.indexOf(name);
      return localize(match[placeholderIndex + 1] ?? match[index++] ?? "");
    });
  }
  return text;
}

function localizeNode(node: Node): void {
  const treeWalker: TreeWalker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
  );
  const nodes: Node[] = [node];
  while (treeWalker.nextNode()) {
    nodes.push(treeWalker.currentNode);
  }
  for (const current of nodes) {
    if (current.nodeType === Node.TEXT_NODE) {
      const translated: string = localize(current.textContent ?? "");
      if (translated !== current.textContent) {
        current.textContent = translated;
      }
    } else if (current instanceof Element) {
      for (const attribute of ["aria-label", "placeholder", "title"]) {
        const value: string | null = current.getAttribute(attribute);
        if (value !== null) {
          const translated: string = localize(value);
          if (translated !== value) {
            current.setAttribute(attribute, translated);
          }
        }
      }
    }
  }
}

/** Initializes the saved locale, updates the document language, and localizes dynamic UI text. */
export function installLocalization(): void {
  const savedLocale: string | null = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  activeLocale = savedLocale === "cs" ? "cs" : "en";
  document.documentElement.lang = activeLocale;
  const observer: MutationObserver = new MutationObserver(
    (mutations: readonly MutationRecord[]): void => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" || mutation.type === "characterData") {
          localizeNode(mutation.target);
        } else {
          for (const addedNode of mutation.addedNodes) {
            localizeNode(addedNode);
          }
        }
      }
    },
  );
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["aria-label", "placeholder", "title"],
    characterData: true,
    childList: true,
    subtree: true,
  });
  localizeNode(document.documentElement);
}

/** Creates the language selector and reloads the app when the user changes languages. */
export function createLanguageControl(): HTMLLabelElement {
  const label: HTMLLabelElement = document.createElement("label");
  label.className = "app-language-control";
  label.textContent = localize("Language");
  const select: HTMLSelectElement = document.createElement("select");
  select.className = "form-select";
  select.setAttribute("aria-label", localize("Language"));
  for (const locale of ["en", "cs"] as const) {
    const option: HTMLOptionElement = document.createElement("option");
    option.value = locale;
    option.textContent = locale === "en" ? localize("English") : localize("Czech");
    option.selected = locale === activeLocale;
    select.append(option);
  }
  select.addEventListener("change", (): void => {
    const locale: Locale = select.value === "cs" ? "cs" : "en";
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
    window.location.reload();
  });
  label.append(select);
  return label;
}
