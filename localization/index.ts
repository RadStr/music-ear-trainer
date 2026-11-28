import { czech } from "./cs/strings";
import { english } from "./en/strings";
import type { Locale } from "../settings/language-settings";

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

/**
 * Sets the document language and localizes dynamic UI text for the selected locale.
 * @param locale The language loaded from application settings.
 */
export function installLocalization(locale: Locale): void {
  activeLocale = locale;
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
