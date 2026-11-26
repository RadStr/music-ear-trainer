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
    body {
      box-sizing: border-box;
      color: #202124;
      font: 16px/1.5 system-ui, sans-serif;
      margin: 0;
      padding: 2rem;
    }
    *, *::before, *::after {
      box-sizing: inherit;
    }
    main {
      margin: 0 auto;
      max-width: 1100px;
    }
    .app-volume-control {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 0.75rem;
    }
    .app-volume-control label {
      align-items: center;
      display: flex;
      gap: 0.5rem;
    }
    .app-volume-control input {
      padding: 0;
      width: 10rem;
    }
    form {
      align-items: end;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin: 1.5rem 0 0.5rem;
    }
    label {
      display: grid;
      gap: 0.25rem;
    }
    input, button, select {
      font: inherit;
    }
    input, select {
      padding: 0.35rem 0.5rem;
    }
    button:hover:not(:disabled) {
      box-shadow: 0 0 0 2px #dadce0;
      filter: brightness(0.97);
    }
    button:focus-visible {
      outline: 3px solid #1a73e8;
      outline-offset: 2px;
    }
    input[type="number"] {
      width: 7rem;
    }
    form button {
      cursor: pointer;
      padding: 0.35rem 0.75rem;
    }
    .audio-source-menu {
      position: relative;
    }
    .audio-source-menu summary {
      border: 1px solid #767676;
      border-radius: 2px;
      cursor: pointer;
      list-style: none;
      padding: 0.35rem 0.75rem;
      white-space: nowrap;
    }
    .audio-source-menu summary::-webkit-details-marker {
      display: none;
    }
    .audio-source-submenu {
      background: #fff;
      border: 1px solid #dadce0;
      border-radius: 4px;
      box-shadow: 0 2px 8px #0002;
      display: none;
      left: 0;
      min-width: 11rem;
      padding: 0.35rem;
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
      background: #fff;
      border: 0;
      text-align: left;
    }
    .audio-source-submenu button:hover,
    .audio-source-submenu button[aria-pressed="true"] {
      background: #e8f0fe;
    }
    .custom-source-button[aria-pressed="true"] {
      background: #e8f0fe;
    }
    .custom-sample-panel {
      align-items: end;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .custom-sample-panel[hidden] {
      display: none;
    }
    .custom-sample-panel input {
      min-width: 20rem;
      width: min(36rem, 70vw);
    }
    .app-sound-status {
      color: #5f6368;
      font-size: 0.9rem;
      margin: 0.25rem 0;
    }
    output {
      display: block;
      font-variant-numeric: tabular-nums;
      min-height: 1.5em;
    }
    .keyboard-viewport {
      margin-top: 1rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      width: 100%;
    }
    .game-navigation {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
  `;
  document.head.append(styles);

  const app: HTMLElement = document.createElement("main");
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
  gameNavigation.append(gameButton, chordGameButton, scaleGameButton);

  const keyboardScreen: HTMLElement = document.createElement("section");
  const heading: HTMLHeadingElement = document.createElement("h1");
  heading.textContent = "Musical keyboard";

  const form: HTMLFormElement = document.createElement("form");
  const sizeLabel: HTMLLabelElement = document.createElement("label");
  sizeLabel.htmlFor = "key-count";
  sizeLabel.textContent = "Number of keys (1–88)";

  const keyCountInput: HTMLInputElement = document.createElement("input");
  keyCountInput.id = "key-count";
  keyCountInput.type = "number";
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
  customSourceButton.className = "custom-source-button";
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
  customSampleUrlInput.placeholder =
    "https://github.com/owner/repository/tree/main/path/to/samples";
  customSampleUrlLabel.append(customSampleUrlInput);
  const loadCustomSamplesButton: HTMLButtonElement = document.createElement("button");
  loadCustomSamplesButton.type = "button";
  loadCustomSamplesButton.textContent = "Use sample directory";
  customSamplePanel.append(customSampleUrlLabel, loadCustomSamplesButton);

  const updateButton: HTMLButtonElement = document.createElement("button");
  updateButton.type = "submit";
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
  app.append(volumeControl, keyboardScreen);
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
