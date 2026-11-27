import { CHORDS } from "../games/pitchGameData";
import type { EnvelopeView } from "./envelopeView";

export interface AppView {
  readonly element: HTMLElement;
  readonly keyboardScreen: HTMLElement;
  readonly gameButton: HTMLButtonElement;
  readonly chordGameButton: HTMLButtonElement;
  readonly scaleGameButton: HTMLButtonElement;
  readonly volumeInput: HTMLInputElement;
  readonly volumeOutput: HTMLOutputElement;
  readonly visualizationSettingsButton: HTMLButtonElement;
  readonly visualizationDialog: HTMLDialogElement;
  readonly audioWaveCheckbox: HTMLInputElement;
  readonly playedKeysCheckbox: HTMLInputElement;
  readonly audioWavePanel: HTMLElement;
  readonly playedKeysPanel: HTMLElement;
  readonly audioWaveCanvas: HTMLCanvasElement;
  readonly playedKeysCanvas: HTMLCanvasElement;
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
  readonly chordDialog: HTMLDialogElement;
  readonly chordSelect: HTMLSelectElement;
  readonly chordModeOutput: HTMLOutputElement;
}

interface VisualizationPanelView {
  readonly panel: HTMLElement;
  readonly canvas: HTMLCanvasElement;
}

interface VolumeControlView {
  readonly element: HTMLDivElement;
  readonly input: HTMLInputElement;
  readonly output: HTMLOutputElement;
}

interface VisualizationSettingsView {
  readonly button: HTMLButtonElement;
  readonly dialog: HTMLDialogElement;
  readonly audioWaveCheckbox: HTMLInputElement;
  readonly playedKeysCheckbox: HTMLInputElement;
}

interface AppHeaderView extends VisualizationSettingsView {
  readonly element: HTMLElement;
  readonly volumeInput: HTMLInputElement;
  readonly volumeOutput: HTMLOutputElement;
}

interface GameNavigationView {
  readonly element: HTMLElement;
  readonly gameButton: HTMLButtonElement;
  readonly chordGameButton: HTMLButtonElement;
  readonly scaleGameButton: HTMLButtonElement;
}

interface KeyboardSizeControlView {
  readonly element: HTMLLabelElement;
  readonly input: HTMLInputElement;
}

interface MetaAudioMenuView {
  readonly element: HTMLDetailsElement;
  readonly buttons: readonly HTMLButtonElement[];
}

interface CustomSamplePanelView {
  readonly element: HTMLDivElement;
  readonly urlInput: HTMLInputElement;
  readonly loadButton: HTMLButtonElement;
}

interface AudioSourceControlsView {
  readonly sourceLabel: HTMLLabelElement;
  readonly sourceSelect: HTMLSelectElement;
  readonly metaAudioMenu: MetaAudioMenuView;
  readonly customSourceButton: HTMLButtonElement;
  readonly customSamplePanel: CustomSamplePanelView;
}

interface KeyboardControlsView {
  readonly form: HTMLFormElement;
  readonly keyCountInput: HTMLInputElement;
  readonly sourceSelect: HTMLSelectElement;
  readonly metaAudioButtons: readonly HTMLButtonElement[];
  readonly customSourceButton: HTMLButtonElement;
  readonly customSamplePanel: HTMLDivElement;
  readonly customSampleUrlInput: HTMLInputElement;
  readonly loadCustomSamplesButton: HTMLButtonElement;
  readonly chordDialog: HTMLDialogElement;
  readonly chordSelect: HTMLSelectElement;
  readonly chordModeOutput: HTMLOutputElement;
}

interface KeyboardStatusView {
  readonly instructions: HTMLParagraphElement;
  readonly frequencyOutput: HTMLOutputElement;
  readonly soundStatus: HTMLOutputElement;
}

interface KeyboardScreenView extends KeyboardControlsView, KeyboardStatusView {
  readonly element: HTMLElement;
  readonly keyboardContainer: HTMLDivElement;
}

interface ChordSettingsView {
  readonly button: HTMLButtonElement;
  readonly dialog: HTMLDialogElement;
  readonly select: HTMLSelectElement;
  readonly modeOutput: HTMLOutputElement;
}

interface AppVisualizationsView {
  readonly element: HTMLElement;
  readonly audioWave: VisualizationPanelView;
  readonly playedKeys: VisualizationPanelView;
}

function createStyleElement(): HTMLStyleElement {
  return document.createElement("style");
}

function createAppRoot(): HTMLElement {
  const app: HTMLElement = document.createElement("main");
  app.className = "container app-shell";
  return app;
}

function createBrand(): HTMLDivElement {
  const brand: HTMLDivElement = document.createElement("div");
  brand.className = "app-brand";
  const brandLabel: HTMLSpanElement = document.createElement("span");
  brandLabel.textContent = "LISTEN · LEARN · PLAY";
  const brandName: HTMLElement = document.createElement("strong");
  brandName.textContent = "Learning by Ear";
  brand.append(brandLabel, brandName);
  return brand;
}

function createVolumeControl(): VolumeControlView {
  const element: HTMLDivElement = document.createElement("div");
  element.className = "app-volume-control";
  const label: HTMLLabelElement = document.createElement("label");
  label.htmlFor = "app-volume";
  label.textContent = "Volume";
  const input: HTMLInputElement = document.createElement("input");
  input.id = "app-volume";
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.step = "1";
  input.value = "70";
  input.className = "form-range";
  input.setAttribute("aria-label", "Volume");
  const output: HTMLOutputElement = document.createElement("output");
  output.textContent = `${input.value}%`;
  label.append(input, output);
  element.append(label);
  return { element, input, output };
}

function createVisualizationSettings(): VisualizationSettingsView {
  const button: HTMLButtonElement = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-outline-secondary";
  button.textContent = "Visualization settings";

  const dialog: HTMLDialogElement = document.createElement("dialog");
  dialog.className = "visualization-settings-dialog";
  dialog.setAttribute("aria-labelledby", "visualization-settings-title");
  const title: HTMLHeadingElement = document.createElement("h2");
  title.id = "visualization-settings-title";
  title.textContent = "Visualization settings";
  const form: HTMLFormElement = document.createElement("form");
  form.method = "dialog";

  const audioWaveOption: HTMLLabelElement = document.createElement("label");
  audioWaveOption.className = "visualization-option";
  const audioWaveCheckbox: HTMLInputElement = document.createElement("input");
  audioWaveCheckbox.type = "checkbox";
  audioWaveCheckbox.checked = true;
  audioWaveCheckbox.className = "form-check-input";
  audioWaveCheckbox.setAttribute("aria-label", "Audio wave");
  audioWaveOption.append(audioWaveCheckbox, document.createTextNode("Audio wave"));

  const playedKeysOption: HTMLLabelElement = document.createElement("label");
  playedKeysOption.className = "visualization-option";
  const playedKeysCheckbox: HTMLInputElement = document.createElement("input");
  playedKeysCheckbox.type = "checkbox";
  playedKeysCheckbox.checked = true;
  playedKeysCheckbox.className = "form-check-input";
  playedKeysCheckbox.setAttribute("aria-label", "Played keys");
  playedKeysOption.append(playedKeysCheckbox, document.createTextNode("Played keys"));

  const actions: HTMLDivElement = document.createElement("div");
  actions.className = "visualization-settings-actions";
  const closeButton: HTMLButtonElement = document.createElement("button");
  closeButton.type = "submit";
  closeButton.className = "btn btn-primary";
  closeButton.textContent = "Done";
  actions.append(closeButton);

  form.append(audioWaveOption, playedKeysOption, actions);
  dialog.append(title, form);
  button.addEventListener("click", (): void => dialog.showModal());
  return { button, dialog, audioWaveCheckbox, playedKeysCheckbox };
}

function createChordSettings(): ChordSettingsView {
  const button: HTMLButtonElement = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-outline-secondary";
  button.textContent = "Play chords";
  button.setAttribute("aria-haspopup", "dialog");

  const modeOutput: HTMLOutputElement = document.createElement("output");
  modeOutput.setAttribute("aria-live", "polite");
  modeOutput.textContent = "Single note";

  const dialog: HTMLDialogElement = document.createElement("dialog");
  dialog.id = "chord-settings-dialog";
  dialog.className = "chord-settings-dialog";
  dialog.setAttribute("aria-labelledby", "chord-settings-title");
  button.setAttribute("aria-controls", dialog.id);

  const title: HTMLHeadingElement = document.createElement("h2");
  title.id = "chord-settings-title";
  title.textContent = "Keyboard playback";

  const form: HTMLFormElement = document.createElement("form");
  form.method = "dialog";
  const label: HTMLLabelElement = document.createElement("label");
  label.htmlFor = "keyboard-chord-select";
  label.textContent = "Play";
  const select: HTMLSelectElement = document.createElement("select");
  select.id = "keyboard-chord-select";
  select.className = "form-select";
  const singleNoteOption: HTMLOptionElement = document.createElement("option");
  singleNoteOption.value = "single-note";
  singleNoteOption.textContent = "Single note";
  select.append(singleNoteOption);
  for (const chord of CHORDS) {
    const option: HTMLOptionElement = document.createElement("option");
    option.value = chord.id;
    option.textContent = chord.name;
    select.append(option);
  }
  label.append(select);

  const actions: HTMLDivElement = document.createElement("div");
  actions.className = "visualization-settings-actions";
  const doneButton: HTMLButtonElement = document.createElement("button");
  doneButton.type = "submit";
  doneButton.value = "apply";
  doneButton.className = "btn btn-primary";
  doneButton.textContent = "Done";
  actions.append(doneButton);

  form.append(label, actions);
  dialog.append(title, form);
  button.addEventListener("click", (): void => {
    dialog.returnValue = "";
    dialog.showModal();
  });
  return { button, dialog, select, modeOutput };
}

/**
 * Creates the application header and its volume and visualization settings controls.
 * @returns Header elements and controls used by the app view and controller.
 */
function createAppHeader(): AppHeaderView {
  const element: HTMLElement = document.createElement("header");
  element.className = "app-header";
  const brand: HTMLDivElement = createBrand();
  const volumeControl: VolumeControlView = createVolumeControl();
  const visualizationSettings: VisualizationSettingsView = createVisualizationSettings();
  element.append(brand, volumeControl.element, visualizationSettings.button);
  return {
    element,
    volumeInput: volumeControl.input,
    volumeOutput: volumeControl.output,
    ...visualizationSettings,
  };
}

function createGameNavigation(): GameNavigationView {
  const gameButton: HTMLButtonElement = document.createElement("button");
  gameButton.type = "button";
  gameButton.textContent = "Note sequence game";
  const chordGameButton: HTMLButtonElement = document.createElement("button");
  chordGameButton.type = "button";
  chordGameButton.textContent = "Chord and notes game";
  const scaleGameButton: HTMLButtonElement = document.createElement("button");
  scaleGameButton.type = "button";
  scaleGameButton.textContent = "Scale guessing game";
  const element: HTMLElement = document.createElement("nav");
  element.className = "game-navigation";
  element.setAttribute("aria-label", "Learning games");
  for (const button of [gameButton, chordGameButton, scaleGameButton]) {
    button.className = "btn btn-outline-primary";
  }
  element.append(gameButton, chordGameButton, scaleGameButton);
  return { element, gameButton, chordGameButton, scaleGameButton };
}

function createKeyboardSizeControl(): KeyboardSizeControlView {
  const element: HTMLLabelElement = document.createElement("label");
  element.htmlFor = "key-count";
  element.textContent = "Number of keys (1–88)";
  const input: HTMLInputElement = document.createElement("input");
  input.id = "key-count";
  input.type = "number";
  input.className = "form-control";
  input.min = "1";
  input.max = "88";
  input.step = "1";
  input.value = "88";
  input.required = true;
  element.append(input);
  return { element, input };
}

function createWaveformSelect(): HTMLSelectElement {
  const select: HTMLSelectElement = document.createElement("select");
  select.id = "sound-source";
  select.className = "form-select";
  const waveformOptions: ReadonlyArray<readonly [string, string]> = [
    ["sine", "Sine"],
    ["square", "Square"],
    ["sawtooth", "Sawtooth"],
  ];
  for (const [value, labelText] of waveformOptions) {
    const option: HTMLOptionElement = document.createElement("option");
    option.value = value;
    option.textContent = labelText;
    select.append(option);
  }
  return select;
}

function createMetaAudioMenu(): MetaAudioMenuView {
  const metaOptions: ReadonlyArray<readonly [string, string]> = [
    ["meta-piano", "Piano"],
    ["meta-nylon-guitar", "Nylon guitar"],
    ["meta-steel-guitar", "Steel guitar"],
  ];
  const element: HTMLDetailsElement = document.createElement("details");
  element.className = "audio-source-menu";
  const summary: HTMLElement = document.createElement("summary");
  summary.textContent = "Meta audio";
  const submenu: HTMLDivElement = document.createElement("div");
  submenu.className = "audio-source-submenu";
  const buttons: HTMLButtonElement[] = [];
  for (const [value, labelText] of metaOptions) {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-secondary";
    button.value = value;
    button.textContent = labelText;
    button.setAttribute("aria-pressed", "false");
    buttons.push(button);
    submenu.append(button);
  }
  element.append(summary, submenu);
  element.addEventListener("pointerenter", (): void => {
    element.open = true;
  });
  element.addEventListener("pointerleave", (): void => {
    if (!element.contains(document.activeElement)) {
      element.open = false;
    }
  });
  element.addEventListener("focusin", (): void => {
    element.open = true;
  });
  element.addEventListener("focusout", (event: FocusEvent): void => {
    if (!(event.relatedTarget instanceof Node) || !element.contains(event.relatedTarget)) {
      element.open = false;
    }
  });
  return { element, buttons };
}

function createCustomSamplePanel(): CustomSamplePanelView {
  const element: HTMLDivElement = document.createElement("div");
  element.className = "custom-sample-panel";
  element.hidden = true;
  const urlLabel: HTMLLabelElement = document.createElement("label");
  urlLabel.htmlFor = "custom-sample-url";
  urlLabel.textContent = "Sample directory URL";
  const urlInput: HTMLInputElement = document.createElement("input");
  urlInput.id = "custom-sample-url";
  urlInput.type = "url";
  urlInput.className = "form-control";
  urlInput.placeholder =
    "https://github.com/owner/repository/tree/main/path/to/samples";
  urlLabel.append(urlInput);
  const loadButton: HTMLButtonElement = document.createElement("button");
  loadButton.type = "button";
  loadButton.className = "btn btn-outline-secondary";
  loadButton.textContent = "Use sample directory";
  element.append(urlLabel, loadButton);
  return { element, urlInput, loadButton };
}

/**
 * Creates the sound source selector and the associated sample controls.
 * @returns The source selector, instrument menu, and custom sample panel.
 */
function createAudioSourceControls(): AudioSourceControlsView {
  const sourceLabel: HTMLLabelElement = document.createElement("label");
  sourceLabel.htmlFor = "sound-source";
  sourceLabel.textContent = "Waveform";
  const sourceSelect: HTMLSelectElement = createWaveformSelect();
  sourceLabel.append(sourceSelect);
  const metaAudioMenu: MetaAudioMenuView = createMetaAudioMenu();
  const customSourceButton: HTMLButtonElement = document.createElement("button");
  customSourceButton.type = "button";
  customSourceButton.className = "btn btn-outline-secondary custom-source-button";
  customSourceButton.textContent = "Custom samples…";
  customSourceButton.setAttribute("aria-pressed", "false");
  const customSamplePanel: CustomSamplePanelView = createCustomSamplePanel();
  return {
    sourceLabel,
    sourceSelect,
    metaAudioMenu,
    customSourceButton,
    customSamplePanel,
  };
}

/**
 * Creates the keyboard settings form and exposes its interactive controls.
 * @returns The form and controls used by the application controller.
 */
function createKeyboardControls(): KeyboardControlsView {
  const form: HTMLFormElement = document.createElement("form");
  form.className = "app-controls";
  const keyCountControl: KeyboardSizeControlView = createKeyboardSizeControl();
  const audioSourceControls: AudioSourceControlsView = createAudioSourceControls();
  const chordSettings: ChordSettingsView = createChordSettings();
  const updateButton: HTMLButtonElement = document.createElement("button");
  updateButton.type = "submit";
  updateButton.className = "btn btn-primary";
  updateButton.textContent = "Update keyboard";
  form.append(
    keyCountControl.element,
    audioSourceControls.sourceLabel,
    audioSourceControls.metaAudioMenu.element,
    audioSourceControls.customSourceButton,
    audioSourceControls.customSamplePanel.element,
    chordSettings.button,
    chordSettings.modeOutput,
    updateButton,
  );
  return {
    form,
    keyCountInput: keyCountControl.input,
    sourceSelect: audioSourceControls.sourceSelect,
    metaAudioButtons: audioSourceControls.metaAudioMenu.buttons,
    customSourceButton: audioSourceControls.customSourceButton,
    customSamplePanel: audioSourceControls.customSamplePanel.element,
    customSampleUrlInput: audioSourceControls.customSamplePanel.urlInput,
    loadCustomSamplesButton: audioSourceControls.customSamplePanel.loadButton,
    chordDialog: chordSettings.dialog,
    chordSelect: chordSettings.select,
    chordModeOutput: chordSettings.modeOutput,
  };
}

function createKeyboardStatus(): KeyboardStatusView {
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
  return { instructions, frequencyOutput, soundStatus };
}

/**
 * Creates the keyboard screen and combines its controls, status, and game navigation.
 * @param envelopeView The envelope control view to include.
 * @param gameNavigation The navigation for the available learning games.
 * @returns The keyboard screen and its controller-facing elements.
 */
function createKeyboardScreen(
  envelopeView: EnvelopeView,
  gameNavigation: GameNavigationView,
): KeyboardScreenView {
  const element: HTMLElement = document.createElement("section");
  element.className = "app-card";
  const heading: HTMLHeadingElement = document.createElement("h1");
  heading.textContent = "Musical keyboard";
  const controls: KeyboardControlsView = createKeyboardControls();
  const status: KeyboardStatusView = createKeyboardStatus();
  const keyboardContainer: HTMLDivElement = document.createElement("div");
  element.append(
    gameNavigation.element,
    heading,
    controls.form,
    envelopeView.element,
    status.instructions,
    status.soundStatus,
    status.frequencyOutput,
    keyboardContainer,
    controls.chordDialog,
  );
  return {
    element,
    ...controls,
    ...status,
    keyboardContainer,
  };
}

function createVisualizations(): AppVisualizationsView {
  const element: HTMLElement = document.createElement("aside");
  element.className = "app-visualizations";
  element.setAttribute("aria-label", "Audio visualizations");
  const audioWave: VisualizationPanelView = createAudioWavePanel();
  const playedKeys: VisualizationPanelView = createPlayedKeysPanel();
  element.append(audioWave.panel, playedKeys.panel);
  return { element, audioWave, playedKeys };
}

function createAudioWavePanel(): VisualizationPanelView {
  const panel: HTMLElement = document.createElement("section");
  panel.id = "audio-wave-panel";
  panel.className = "visualization-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Audio wave");
  const heading: HTMLHeadingElement = document.createElement("h2");
  heading.textContent = "Audio wave";
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "audio-wave-canvas";
  canvas.width = 640;
  canvas.height = 200;
  canvas.setAttribute("aria-label", "Currently played audio waveform");
  panel.append(heading, canvas);
  return { panel, canvas };
}

function createPlayedKeysPanel(): VisualizationPanelView {
  const panel: HTMLElement = document.createElement("section");
  panel.id = "played-keys-panel";
  panel.className = "visualization-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Played keys");
  const heading: HTMLHeadingElement = document.createElement("h2");
  heading.textContent = "Played keys";
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "played-keys-canvas";
  canvas.width = 320;
  canvas.height = 140;
  canvas.setAttribute("aria-label", "Currently played piano keys");
  panel.append(heading, canvas);
  return { panel, canvas };
}

/**
 * Builds the main application view and its audio source controls.
 * @param envelopeView The envelope control view to include in the application.
 * @returns The application view elements and controls.
 */
export function createAppView(envelopeView: EnvelopeView): AppView {
  const styles: HTMLStyleElement = createStyleElement();
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
    .visualization-settings-dialog,
    .chord-settings-dialog {
      border: 0;
      border-radius: 1rem;
      box-shadow: 0 18px 48px #29316a33;
      color: #20233a;
      max-width: calc(100vw - 2rem);
      padding: 1.5rem;
      width: 26rem;
    }
    .visualization-settings-dialog::backdrop,
    .chord-settings-dialog::backdrop {
      background: #20233a66;
    }
    .visualization-settings-dialog h2,
    .chord-settings-dialog h2 {
      font-size: 1.25rem;
      margin: 0 0 1.25rem;
    }
    .visualization-option {
      align-items: center;
      display: flex;
      font-weight: 500;
      gap: 0.65rem;
      margin-bottom: 0.8rem;
    }
    .visualization-option input {
      margin: 0;
    }
    .visualization-settings-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1.25rem;
    }
    .chord-settings-dialog {
      width: 24rem;
    }
    .app-visualizations {
      display: grid;
      gap: 0.75rem;
      pointer-events: none;
      position: fixed;
      right: 1rem;
      top: 6rem;
      width: min(22rem, calc(100vw - 2rem));
      z-index: 10;
    }
    .visualization-panel {
      background: #fff;
      border: 1px solid #e7e8f0;
      border-radius: 0.85rem;
      box-shadow: 0 10px 28px #29316a18;
      overflow: hidden;
      padding: 0.75rem;
      pointer-events: auto;
    }
    .visualization-panel h2 {
      color: #4a4b64;
      font-size: 0.85rem;
      font-weight: 650;
      margin: 0 0 0.5rem;
    }
    .visualization-panel canvas {
      display: block;
      height: auto;
      width: 100%;
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
      .app-visualizations {
        right: 0.5rem;
        top: 8.5rem;
        width: min(18rem, calc(100vw - 1rem));
      }
      .custom-sample-panel input {
        min-width: 0;
        width: 100%;
      }
    }
  `;
  document.head.append(styles);

  const app: HTMLElement = createAppRoot();
  const header: AppHeaderView = createAppHeader();

  const gameNavigation: GameNavigationView = createGameNavigation();
  const keyboardScreen: KeyboardScreenView = createKeyboardScreen(envelopeView, gameNavigation);
  const visualizations: AppVisualizationsView = createVisualizations();
  app.append(header.element, keyboardScreen.element, visualizations.element, header.dialog);
  document.body.replaceChildren(app);

  return {
    element: app,
    keyboardScreen: keyboardScreen.element,
    gameButton: gameNavigation.gameButton,
    chordGameButton: gameNavigation.chordGameButton,
    scaleGameButton: gameNavigation.scaleGameButton,
    volumeInput: header.volumeInput,
    volumeOutput: header.volumeOutput,
    visualizationSettingsButton: header.button,
    visualizationDialog: header.dialog,
    audioWaveCheckbox: header.audioWaveCheckbox,
    playedKeysCheckbox: header.playedKeysCheckbox,
    audioWavePanel: visualizations.audioWave.panel,
    playedKeysPanel: visualizations.playedKeys.panel,
    audioWaveCanvas: visualizations.audioWave.canvas,
    playedKeysCanvas: visualizations.playedKeys.canvas,
    form: keyboardScreen.form,
    keyCountInput: keyboardScreen.keyCountInput,
    sourceSelect: keyboardScreen.sourceSelect,
    metaAudioButtons: keyboardScreen.metaAudioButtons,
    customSourceButton: keyboardScreen.customSourceButton,
    customSamplePanel: keyboardScreen.customSamplePanel,
    customSampleUrlInput: keyboardScreen.customSampleUrlInput,
    loadCustomSamplesButton: keyboardScreen.loadCustomSamplesButton,
    soundStatus: keyboardScreen.soundStatus,
    frequencyOutput: keyboardScreen.frequencyOutput,
    keyboardContainer: keyboardScreen.keyboardContainer,
    chordDialog: keyboardScreen.chordDialog,
    chordSelect: keyboardScreen.chordSelect,
    chordModeOutput: keyboardScreen.chordModeOutput,
  };
}
