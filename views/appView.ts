import type { EnvelopeView } from "./envelopeView";

export interface AppView {
  readonly element: HTMLElement;
  readonly keyboardScreen: HTMLElement;
  readonly gameButton: HTMLButtonElement;
  readonly chordGameButton: HTMLButtonElement;
  readonly scaleGameButton: HTMLButtonElement;
  readonly volumeInput: HTMLInputElement;
  readonly volumeOutput: HTMLOutputElement;
  readonly form: HTMLFormElement;
  readonly keyCountInput: HTMLInputElement;
  readonly sourceSelect: HTMLSelectElement;
  readonly metaAudioButtons: readonly HTMLButtonElement[];
  readonly customSourceButton: HTMLButtonElement;
  readonly customSamplePanel: HTMLDivElement;
  readonly customSampleUrlInput: HTMLInputElement;
  readonly loadCustomSamplesButton: HTMLButtonElement;
  readonly soundStatus: HTMLOutputElement;
  readonly frequencyOutput: HTMLOutputElement;
  readonly keyboardContainer: HTMLDivElement;
}

/**
 * Builds the main application view and its audio source controls.
 * @param envelopeView The envelope control view to include in the application.
 * @returns The application view elements and controls.
 */
export function createAppView(envelopeView: EnvelopeView): AppView {
  const styles: HTMLStyleElement = document.createElement("style");
  styles.textContent = `
    :root {
      --bs-primary: #6558c8;
      --bs-primary-rgb: 101, 88, 200;
    }
    body {
      background: #f5f6fb;
      color: #20233a;
      font: 16px/1.55 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 0;
    }
    .app-shell {
      max-width: 1280px;
      padding: 2rem 1.5rem 4rem;
    }
    .app-header {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .app-brand {
      display: grid;
      gap: 0.1rem;
    }
    .app-brand strong {
      color: #252642;
      font-size: 1.35rem;
      letter-spacing: -0.035em;
    }
    .app-brand span {
      color: #6558c8;
      font-size: 0.7rem;
      font-weight: 750;
      letter-spacing: 0.14em;
    }
    .app-volume-control {
      background: #fff;
      border: 1px solid #e5e7f0;
      border-radius: 999px;
      display: flex;
      padding: 0.5rem 1rem;
    }
    .app-volume-control label {
      align-items: center;
      color: #4a4b64;
      display: flex;
      font-size: 0.88rem;
      font-weight: 600;
      gap: 0.75rem;
    }
    .app-volume-control input {
      padding: 0;
      width: 8rem;
    }
    .app-volume-control output {
      color: #74758c;
      font-size: 0.8rem;
      min-width: 2.5rem;
    }
    .app-card {
      background: #fff;
      border: 1px solid #e7e8f0;
      border-radius: 1.25rem;
      box-shadow: 0 18px 48px #29316a0c;
      padding: clamp(1.25rem, 3vw, 2.25rem);
    }
    .game-navigation {
      border-bottom: 1px solid #ececf3;
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.25rem;
    }
    .game-navigation button {
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.55rem 1rem;
    }
    .app-card h1 {
      color: #252642;
      font-size: clamp(1.75rem, 3vw, 2.2rem);
      font-weight: 750;
      letter-spacing: -0.045em;
      margin: 0 0 1.5rem;
    }
    .app-controls {
      align-items: end;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin: 0 0 1rem;
      padding-top: 1.25rem;
    }
    .app-controls label {
      color: #4b4c64;
      display: grid;
      font-size: 0.85rem;
      font-weight: 650;
      gap: 0.4rem;
    }
    .app-controls .form-control,
    .app-controls .form-select {
      border-color: #dfe1ea;
      border-radius: 0.65rem;
      min-height: 2.75rem;
      min-width: 8rem;
    }
    .app-controls input[type="number"] {
      width: 7rem;
    }
    button:not(.piano-key) {
      border-radius: 0.65rem;
      font: inherit;
      font-weight: 600;
      transition: background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
    }
    button:not(.piano-key):not(.btn) {
      background: #fff;
      border: 1px solid #dfe1ea;
      color: #393a54;
      padding: 0.55rem 0.85rem;
    }
    button:not(.piano-key):not(:disabled):hover {
      border-color: #aaa4e3;
      box-shadow: 0 4px 12px #46408e1a;
      color: #5146aa;
      transform: translateY(-1px);
    }
    button:focus-visible,
    .audio-source-menu summary:focus-visible {
      outline: 3px solid #8176df;
      outline-offset: 2px;
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .btn-primary {
      --bs-btn-bg: #6558c8;
      --bs-btn-border-color: #6558c8;
      --bs-btn-hover-bg: #5246b2;
      --bs-btn-hover-border-color: #5246b2;
      --bs-btn-active-bg: #483da5;
      --bs-btn-active-border-color: #483da5;
      --bs-btn-color: #fff;
      --bs-btn-hover-color: #fff;
      box-shadow: 0 5px 14px #6558c833;
      padding: 0.6rem 1rem;
    }
    .btn-outline-primary {
      --bs-btn-color: #6558c8;
      --bs-btn-border-color: #d7d4f1;
      --bs-btn-hover-color: #fff;
      --bs-btn-hover-bg: #6558c8;
      --bs-btn-hover-border-color: #6558c8;
      --bs-btn-active-bg: #5246b2;
      --bs-btn-active-border-color: #5246b2;
    }
    .btn:not(:disabled):hover {
      box-shadow: 0 4px 12px #46408e1a;
      transform: translateY(-1px);
    }
    .audio-source-menu {
      position: relative;
    }
    .audio-source-menu summary {
      border: 1px solid #dfe1ea;
      border-radius: 0.65rem;
      cursor: pointer;
      list-style: none;
      padding: 0.65rem 0.9rem;
      white-space: nowrap;
    }
    .audio-source-menu summary::-webkit-details-marker {
      display: none;
    }
    .audio-source-submenu {
      background: #fff;
      border: 1px solid #e5e6ee;
      border-radius: 0.75rem;
      box-shadow: 0 12px 30px #22243d20;
      display: none;
      left: 0;
      min-width: 11rem;
      padding: 0.45rem;
      position: absolute;
      top: 100%;
      z-index: 5;
    }
    .audio-source-menu:hover .audio-source-submenu,
    .audio-source-menu:focus-within .audio-source-submenu,
    .audio-source-menu[open] .audio-source-submenu {
      display: grid;
    }
    .audio-source-submenu button {
      border: 0;
      border-radius: 0.45rem;
      text-align: left;
      width: 100%;
    }
    .audio-source-submenu button:hover,
    .audio-source-submenu button[aria-pressed="true"] {
      background: #f1f0fc;
    }
    .custom-source-button[aria-pressed="true"] {
      background: #f1f0fc;
      border-color: #aaa4e3;
    }
    .custom-sample-panel {
      align-items: end;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .custom-sample-panel[hidden] {
      display: none;
    }
    .custom-sample-panel input {
      border-radius: 0.65rem;
      min-width: 20rem;
      width: min(36rem, 70vw);
    }
    .app-sound-status {
      color: #6a6b80;
      font-size: 0.9rem;
      margin: 1.25rem 0 0.25rem;
    }
    output {
      display: block;
      font-variant-numeric: tabular-nums;
      min-height: 1.5em;
    }
    .app-card > p {
      color: #66677c;
    }
    label {
      color: #4b4c64;
      display: grid;
      font-size: 0.85rem;
      font-weight: 650;
      gap: 0.4rem;
    }
    .keyboard-viewport {
      background: #f8f8fc;
      border: 1px solid #e5e6ee;
      border-radius: 0.9rem;
      margin-top: 0.8rem;
      overflow-x: auto;
      padding: 0.8rem;
      width: 100%;
    }
    .piano-keyboard {
      border-radius: 0.4rem;
      overflow: hidden;
    }
    .piano-key--white:hover:not(:disabled) {
      background: #f0efff;
      box-shadow: inset 0 0 0 2px #b4adee;
    }
    .piano-key--black:hover:not(:disabled) {
      background: #4d437f;
    }
    .piano-key--pressed,
    .piano-key--pressed:hover:not(:disabled) {
      background: #6558c8;
      color: #fff;
    }
    @media (max-width: 575.98px) {
      .app-shell {
        padding: 1.25rem 0.75rem 2rem;
      }
      .app-header {
        align-items: flex-start;
      }
      .app-volume-control {
        padding: 0.4rem 0.75rem;
      }
      .app-volume-control input {
        width: 6rem;
      }
      .custom-sample-panel input {
        min-width: 0;
        width: 100%;
      }
    }
  `;
  document.head.append(styles);

  const app: HTMLElement = document.createElement("main");
  app.className = "container app-shell";
  const header: HTMLElement = document.createElement("header");
  header.className = "app-header";
  const brand: HTMLDivElement = document.createElement("div");
  brand.className = "app-brand";
  const brandLabel: HTMLSpanElement = document.createElement("span");
  brandLabel.textContent = "LISTEN · LEARN · PLAY";
  const brandName: HTMLElement = document.createElement("strong");
  brandName.textContent = "Learning by Ear";
  brand.append(brandLabel, brandName);
  const volumeControl: HTMLDivElement = document.createElement("div");
  volumeControl.className = "app-volume-control";
  const volumeLabel: HTMLLabelElement = document.createElement("label");
  volumeLabel.htmlFor = "app-volume";
  volumeLabel.textContent = "Volume";
  const volumeInput: HTMLInputElement = document.createElement("input");
  volumeInput.id = "app-volume";
  volumeInput.type = "range";
  volumeInput.min = "0";
  volumeInput.max = "100";
  volumeInput.step = "1";
  volumeInput.value = "70";
  volumeInput.className = "form-range";
  volumeInput.setAttribute("aria-label", "Volume");
  const volumeOutput: HTMLOutputElement = document.createElement("output");
  volumeOutput.textContent = `${volumeInput.value}%`;
  volumeLabel.append(volumeInput, volumeOutput);
  volumeControl.append(volumeLabel);

  const gameButton: HTMLButtonElement = document.createElement("button");
  gameButton.type = "button";
  gameButton.textContent = "Note sequence game";
  const chordGameButton: HTMLButtonElement = document.createElement("button");
  chordGameButton.type = "button";
  chordGameButton.textContent = "Chord and notes game";
  const scaleGameButton: HTMLButtonElement = document.createElement("button");
  scaleGameButton.type = "button";
  scaleGameButton.textContent = "Scale guessing game";
  const gameNavigation: HTMLElement = document.createElement("nav");
  gameNavigation.className = "game-navigation";
  gameNavigation.setAttribute("aria-label", "Learning games");
  for (const button of [gameButton, chordGameButton, scaleGameButton]) {
    button.className = "btn btn-outline-primary";
  }
  gameNavigation.append(gameButton, chordGameButton, scaleGameButton);

  const keyboardScreen: HTMLElement = document.createElement("section");
  keyboardScreen.className = "app-card";
  const heading: HTMLHeadingElement = document.createElement("h1");
  heading.textContent = "Musical keyboard";

  const form: HTMLFormElement = document.createElement("form");
  form.className = "app-controls";
  const sizeLabel: HTMLLabelElement = document.createElement("label");
  sizeLabel.htmlFor = "key-count";
  sizeLabel.textContent = "Number of keys (1–88)";

  const keyCountInput: HTMLInputElement = document.createElement("input");
  keyCountInput.id = "key-count";
  keyCountInput.type = "number";
  keyCountInput.className = "form-control";
  keyCountInput.min = "1";
  keyCountInput.max = "88";
  keyCountInput.step = "1";
  keyCountInput.value = "88";
  keyCountInput.required = true;
  sizeLabel.append(keyCountInput);

  const sourceLabel: HTMLLabelElement = document.createElement("label");
  sourceLabel.htmlFor = "sound-source";
  sourceLabel.textContent = "Waveform";
  const sourceSelect: HTMLSelectElement = document.createElement("select");
  sourceSelect.id = "sound-source";
  sourceSelect.className = "form-select";
  const waveformOptions: ReadonlyArray<readonly [string, string]> = [
    ["sine", "Sine"],
    ["square", "Square"],
    ["sawtooth", "Sawtooth"],
  ];
  for (const [value, labelText] of waveformOptions) {
    const option: HTMLOptionElement = document.createElement("option");
    option.value = value;
    option.textContent = labelText;
    sourceSelect.append(option);
  }
  const metaOptions: ReadonlyArray<readonly [string, string]> = [
    ["meta-piano", "Piano"],
    ["meta-nylon-guitar", "Nylon guitar"],
    ["meta-steel-guitar", "Steel guitar"],
  ];
  const metaAudioMenu: HTMLDetailsElement = document.createElement("details");
  metaAudioMenu.className = "audio-source-menu";
  const metaAudioSummary: HTMLElement = document.createElement("summary");
  metaAudioSummary.textContent = "Meta audio";
  const metaAudioSubmenu: HTMLDivElement = document.createElement("div");
  metaAudioSubmenu.className = "audio-source-submenu";
  const metaAudioButtons: HTMLButtonElement[] = [];
  for (const [value, labelText] of metaOptions) {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-secondary";
    button.value = value;
    button.textContent = labelText;
    button.setAttribute("aria-pressed", "false");
    metaAudioButtons.push(button);
    metaAudioSubmenu.append(button);
  }
  metaAudioMenu.append(metaAudioSummary, metaAudioSubmenu);
  metaAudioMenu.addEventListener("pointerenter", (): void => {
    metaAudioMenu.open = true;
  });
  metaAudioMenu.addEventListener("pointerleave", (): void => {
    if (!metaAudioMenu.contains(document.activeElement)) {
      metaAudioMenu.open = false;
    }
  });
  metaAudioMenu.addEventListener("focusin", (): void => {
    metaAudioMenu.open = true;
  });
  metaAudioMenu.addEventListener("focusout", (event: FocusEvent): void => {
    if (!(event.relatedTarget instanceof Node) || !metaAudioMenu.contains(event.relatedTarget)) {
      metaAudioMenu.open = false;
    }
  });
  sourceLabel.append(sourceSelect);
  const customSourceButton: HTMLButtonElement = document.createElement("button");
  customSourceButton.type = "button";
  customSourceButton.className = "btn btn-outline-secondary custom-source-button";
  customSourceButton.textContent = "Custom samples…";
  customSourceButton.setAttribute("aria-pressed", "false");

  const customSamplePanel: HTMLDivElement = document.createElement("div");
  customSamplePanel.className = "custom-sample-panel";
  customSamplePanel.hidden = true;
  const customSampleUrlLabel: HTMLLabelElement = document.createElement("label");
  customSampleUrlLabel.htmlFor = "custom-sample-url";
  customSampleUrlLabel.textContent = "Sample directory URL";
  const customSampleUrlInput: HTMLInputElement = document.createElement("input");
  customSampleUrlInput.id = "custom-sample-url";
  customSampleUrlInput.type = "url";
  customSampleUrlInput.className = "form-control";
  customSampleUrlInput.placeholder =
    "https://github.com/owner/repository/tree/main/path/to/samples";
  customSampleUrlLabel.append(customSampleUrlInput);
  const loadCustomSamplesButton: HTMLButtonElement = document.createElement("button");
  loadCustomSamplesButton.type = "button";
  loadCustomSamplesButton.className = "btn btn-outline-secondary";
  loadCustomSamplesButton.textContent = "Use sample directory";
  customSamplePanel.append(customSampleUrlLabel, loadCustomSamplesButton);

  const updateButton: HTMLButtonElement = document.createElement("button");
  updateButton.type = "submit";
  updateButton.className = "btn btn-primary";
  updateButton.textContent = "Update keyboard";
  form.append(
    sizeLabel,
    sourceLabel,
    metaAudioMenu,
    customSourceButton,
    customSamplePanel,
    updateButton,
  );

  const instructions: HTMLParagraphElement = document.createElement("p");
  instructions.textContent =
    "Hold a key with the mouse to play it. Notes stop on release unless the release envelope is increased.";
  const frequencyOutput: HTMLOutputElement = document.createElement("output");
  frequencyOutput.textContent = "Hover over a key to see its frequency.";
  frequencyOutput.setAttribute("aria-live", "polite");
  const soundStatus: HTMLOutputElement = document.createElement("output");
  soundStatus.className = "app-sound-status";
  soundStatus.setAttribute("aria-live", "polite");
  soundStatus.textContent = "Choose a waveform or sample source.";

  const keyboardContainer: HTMLDivElement = document.createElement("div");
  keyboardScreen.append(
    gameNavigation,
    heading,
    form,
    envelopeView.element,
    instructions,
    soundStatus,
    frequencyOutput,
    keyboardContainer,
  );
  header.append(brand, volumeControl);
  app.append(header, keyboardScreen);
  document.body.replaceChildren(app);

  return {
    element: app,
    keyboardScreen,
    gameButton,
    chordGameButton,
    scaleGameButton,
    volumeInput,
    volumeOutput,
    form,
    keyCountInput,
    sourceSelect,
    metaAudioButtons,
    customSourceButton,
    customSamplePanel,
    customSampleUrlInput,
    loadCustomSamplesButton,
    soundStatus,
    frequencyOutput,
    keyboardContainer,
  };
}
