import type { PitchPattern } from "./pitchGameData";
import { ensureGuessFeedbackStyles } from "./guessFeedback";

export type PitchGameKind = "chords" | "scales";

export interface PitchIdentificationView {
  readonly element: HTMLElement;
  readonly backButton: HTMLButtonElement;
  readonly settingsToggleButton: HTMLButtonElement;
  readonly form: HTMLFormElement;
  readonly modeInputs: readonly HTMLInputElement[];
  readonly failureLimitInput: HTMLInputElement;
  readonly hintLimitInput: HTMLInputElement;
  readonly patternOptions: HTMLFieldSetElement;
  readonly settingsStatus: HTMLOutputElement;
  readonly startButton: HTMLButtonElement;
  readonly gamePanel: HTMLElement;
  readonly replayButton: HTMLButtonElement;
  readonly hintButton: HTMLButtonElement;
  readonly playGuessButton: HTMLButtonElement;
  readonly finishButton: HTMLButtonElement;
  readonly resetButton: HTMLButtonElement;
  readonly nextRoundButton: HTMLButtonElement;
  readonly keyboardContainer: HTMLDivElement;
  readonly guessList: HTMLOListElement;
  readonly answerOptions: HTMLFieldSetElement;
  readonly attemptsOutput: HTMLOutputElement;
  readonly hintsOutput: HTMLOutputElement;
  readonly status: HTMLOutputElement;
  readonly selectedPatternIds: () => string[];
  readonly renderAnswerOptions: (patterns: readonly PitchPattern[]) => void;
  readonly setSettingsExpanded: (expanded: boolean) => void;
  readonly setKeyboardAnswerMode: (enabled: boolean, headingText: string) => void;
}

/**
 * Builds a pitch identification game view for chords or scales.
 * @param kind Chooses chord or scale behavior and labels.
 * @param title The visible game title.
 * @param description Instructions shown in the settings panel.
 * @param patterns The available chord or scale patterns.
 * @returns The complete pitch identification view.
 */
export function createPitchIdentificationView(
  kind: PitchGameKind,
  title: string,
  instructions: string,
  patterns: readonly PitchPattern[],
): PitchIdentificationView {
  ensureGuessFeedbackStyles();
  const styles: HTMLStyleElement = document.createElement("style");
  styles.textContent = `
    .pitch-game-settings {
      background: #fff;
      border: 1px solid #e7e8f0;
      border-radius: 1.25rem;
      box-shadow: 0 18px 48px #29316a0c;
      padding: clamp(1.25rem, 3vw, 2.25rem);
    }
    .pitch-game-settings h1 {
      margin-top: 0.75rem;
    }
    .pitch-game-controls {
      align-items: end;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin: 1.5rem 0 0.5rem;
    }
    .pitch-game-controls[hidden],
    .pitch-game-settings-toggle[hidden],
    .pitch-game-panel[hidden],
    .pitch-game-answer-options[hidden],
    .pitch-game-keyboard[hidden] {
      display: none;
    }
    .pitch-game-settings-toggle {
      cursor: pointer;
      padding: 0.35rem 0.75rem;
    }
    .pitch-game-settings-toggle svg {
      display: block;
    }
    .pitch-game-settings fieldset,
    .pitch-game-answer-options {
      border: 1px solid #e5e6ee;
      border-radius: 0.75rem;
      margin: 0;
      min-width: 13rem;
      padding: 0.75rem 1rem;
    }
    .pitch-game-pattern-options,
    .pitch-game-answer-options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .pitch-game-mode label,
    .pitch-game-pattern-options label,
    .pitch-game-answer-options label {
      align-items: center;
      display: flex;
      gap: 0.35rem;
    }
    .pitch-game-mode input,
    .pitch-game-pattern-options input,
    .pitch-game-answer-options input {
      margin: 0;
    }
    .pitch-game-panel {
      margin-top: 1.5rem;
    }
    .pitch-game-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0;
    }
    .pitch-game-actions button,
    .pitch-game-controls button,
    .pitch-game-settings > button {
      cursor: pointer;
      padding: 0.35rem 0.75rem;
    }
    .pitch-game-actions button[hidden] {
      display: none;
    }
    .pitch-game-reset {
      background: #fce8e6;
      border: 1px solid #f1b8b3;
    }
    .pitch-game-finish {
      background: #e6f4ea;
      border: 1px solid #a8dab5;
    }
    .pitch-game-actions button.pitch-game-finish {
      color: #2f6d43;
    }
    .pitch-game-guess {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      list-style: none;
      margin: 0.5rem 0;
      padding: 0;
    }
    .pitch-game-guess button {
      cursor: pointer;
      padding: 0.3rem 0.6rem;
    }
    .pitch-game-status {
      font-weight: 600;
      margin-top: 1rem;
    }
    .pitch-game-details {
      margin-top: 0.75rem;
    }
  `;
  document.head.append(styles);

  const element: HTMLElement = document.createElement("section");
  element.className = `pitch-game-view pitch-game-view--${kind}`;
  element.hidden = true;

  const settingsPanel: HTMLElement = document.createElement("section");
  settingsPanel.className = "pitch-game-settings";
  const backButton: HTMLButtonElement = document.createElement("button");
  backButton.type = "button";
  backButton.className = "btn btn-outline-secondary";
  backButton.textContent = "Back to keyboard";

  const heading: HTMLHeadingElement = document.createElement("h1");
  heading.textContent = title;
  const instructionParagraph: HTMLParagraphElement = document.createElement("p");
  instructionParagraph.textContent = instructions;

  const settingsToggleButton: HTMLButtonElement = document.createElement("button");
  settingsToggleButton.type = "button";
  settingsToggleButton.className = "btn btn-outline-secondary pitch-game-settings-toggle";
  settingsToggleButton.setAttribute("aria-controls", `${kind}-game-controls`);
  settingsToggleButton.hidden = true;

  const form: HTMLFormElement = document.createElement("form");
  form.id = `${kind}-game-controls`;
  form.className = "pitch-game-controls";

  const modeInputs: HTMLInputElement[] = [];
  const modeFieldset: HTMLFieldSetElement = document.createElement("fieldset");
  modeFieldset.className = "pitch-game-mode";
  const modeLegend: HTMLLegendElement = document.createElement("legend");
  modeLegend.textContent = "Game mode";
  modeFieldset.append(modeLegend);
  const modeOptions: readonly (readonly [string, string])[] =
    kind === "chords"
      ? [
          ["random-notes", "Identify 3 random notes"],
          ["identify-pattern", "Identify a chord"],
          ["identify-notes", "Identify chord notes on the keyboard"],
        ]
      : [
          ["identify-pattern", "Identify a scale"],
          ["identify-notes", "Identify scale notes on the keyboard"],
        ];
  for (const [value, labelText] of modeOptions) {
    const label: HTMLLabelElement = document.createElement("label");
    const input: HTMLInputElement = document.createElement("input");
    input.type = "radio";
    input.className = "form-check-input";
    input.name = `${kind}-game-mode`;
    input.value = value;
    input.checked =
      value === (kind === "chords" ? "random-notes" : "identify-pattern");
    modeInputs.push(input);
    label.append(input, document.createTextNode(labelText));
    modeFieldset.append(label);
  }
  form.append(modeFieldset);

  const failureLimitLabel: HTMLLabelElement = document.createElement("label");
  failureLimitLabel.htmlFor = `${kind}-failure-limit`;
  failureLimitLabel.textContent = "Allowed failed guesses (1–10)";
  const failureLimitInput: HTMLInputElement = document.createElement("input");
  failureLimitInput.id = `${kind}-failure-limit`;
  failureLimitInput.type = "number";
  failureLimitInput.className = "form-control";
  failureLimitInput.min = "1";
  failureLimitInput.max = "10";
  failureLimitInput.step = "1";
  failureLimitInput.value = "3";
  failureLimitInput.required = true;
  failureLimitLabel.append(failureLimitInput);

  const hintLimitLabel: HTMLLabelElement = document.createElement("label");
  hintLimitLabel.htmlFor = `${kind}-hint-limit`;
  hintLimitLabel.textContent = "Allowed hints per round (0–10)";
  const hintLimitInput: HTMLInputElement = document.createElement("input");
  hintLimitInput.id = `${kind}-hint-limit`;
  hintLimitInput.type = "number";
  hintLimitInput.className = "form-control";
  hintLimitInput.min = "0";
  hintLimitInput.max = "10";
  hintLimitInput.step = "1";
  hintLimitInput.value = "3";
  hintLimitInput.required = true;
  hintLimitLabel.append(hintLimitInput);

  const patternOptions: HTMLFieldSetElement = document.createElement("fieldset");
  patternOptions.className = "pitch-game-pattern-options";
  const patternLegend: HTMLLegendElement = document.createElement("legend");
  patternLegend.textContent = `Include ${kind} in the game`;
  patternOptions.append(patternLegend);
  for (const pattern of patterns) {
    const label: HTMLLabelElement = document.createElement("label");
    const input: HTMLInputElement = document.createElement("input");
    input.type = "checkbox";
    input.className = "form-check-input";
    input.name = `${kind}-pattern`;
    input.value = pattern.id;
    input.checked = true;
    label.append(input, document.createTextNode(pattern.name));
    patternOptions.append(label);
  }

  const startButton: HTMLButtonElement = document.createElement("button");
  startButton.type = "submit";
  startButton.className = "btn btn-primary";
  startButton.textContent = "Start new game";
  const settingsStatus: HTMLOutputElement = document.createElement("output");
  settingsStatus.className = "pitch-game-status";
  settingsStatus.setAttribute("aria-live", "polite");
  form.append(failureLimitLabel, hintLimitLabel, patternOptions, startButton, settingsStatus);

  const replayButton: HTMLButtonElement = document.createElement("button");
  replayButton.type = "button";
  replayButton.className = "btn btn-outline-primary";
  replayButton.textContent = "Replay";
  replayButton.disabled = true;
  const hintButton: HTMLButtonElement = document.createElement("button");
  hintButton.type = "button";
  hintButton.className = "btn btn-outline-primary";
  hintButton.textContent = "Hint";
  hintButton.disabled = true;
  const playGuessButton: HTMLButtonElement = document.createElement("button");
  playGuessButton.type = "button";
  playGuessButton.className = "btn btn-outline-primary";
  playGuessButton.textContent = "Play chosen notes";
  playGuessButton.disabled = true;
  playGuessButton.hidden = true;
  const finishButton: HTMLButtonElement = document.createElement("button");
  finishButton.type = "button";
  finishButton.textContent = "Finish guess";
  finishButton.className = "btn btn-success pitch-game-finish";
  finishButton.disabled = true;
  const resetButton: HTMLButtonElement = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Reset notes";
  resetButton.className = "btn btn-outline-danger pitch-game-reset";
  resetButton.disabled = true;
  const nextRoundButton: HTMLButtonElement = document.createElement("button");
  nextRoundButton.type = "button";
  nextRoundButton.className = "btn btn-primary";
  nextRoundButton.textContent = "Next round";
  nextRoundButton.hidden = true;
  const actions: HTMLDivElement = document.createElement("div");
  actions.className = "pitch-game-actions";
  actions.append(replayButton, hintButton, playGuessButton, resetButton, finishButton, nextRoundButton);

  const gamePanel: HTMLElement = document.createElement("section");
  gamePanel.className = "pitch-game-panel";
  gamePanel.hidden = true;
  const keyboardContainer: HTMLDivElement = document.createElement("div");
  keyboardContainer.className = "pitch-game-keyboard";
  const answerOptions: HTMLFieldSetElement = document.createElement("fieldset");
  answerOptions.className = "pitch-game-answer-options";
  answerOptions.hidden = true;
  const attemptsOutput: HTMLOutputElement = document.createElement("output");
  attemptsOutput.textContent = "Failed guesses: 0 / 3";
  attemptsOutput.setAttribute("aria-live", "polite");
  const hintsOutput: HTMLOutputElement = document.createElement("output");
  hintsOutput.textContent = "Hints used: 0 / 3";
  hintsOutput.setAttribute("aria-live", "polite");
  const guessHeading: HTMLHeadingElement = document.createElement("h2");
  guessHeading.textContent = kind === "chords" ? "Your notes" : "Your answer";
  const guessList: HTMLOListElement = document.createElement("ol");
  guessList.className = "pitch-game-guess guess-feedback-list";
  const status: HTMLOutputElement = document.createElement("output");
  status.className = "pitch-game-status";
  status.setAttribute("aria-live", "polite");
  const details: HTMLDivElement = document.createElement("div");
  details.className = "pitch-game-details";
  details.setAttribute("aria-live", "polite");

  const setSettingsExpanded = (expanded: boolean): void => {
    form.hidden = !expanded;
    settingsToggleButton.setAttribute("aria-expanded", String(expanded));
    settingsToggleButton.setAttribute("aria-label", expanded ? "Hide settings" : "Show settings");
    const chevron: string = expanded ? "M 6 14 L 12 8 L 18 14" : "M 6 10 L 12 16 L 18 10";
    const icon: SVGSVGElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "24");
    icon.setAttribute("height", "24");
    icon.setAttribute("aria-hidden", "true");
    const path: SVGPathElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path.setAttribute("d", chevron);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    icon.append(path);
    settingsToggleButton.replaceChildren(icon);
  };
  const setKeyboardAnswerMode = (enabled: boolean, headingText: string): void => {
    keyboardContainer.hidden = !enabled;
    guessHeading.hidden = !enabled;
    guessList.hidden = !enabled;
    answerOptions.hidden = enabled;
    resetButton.hidden = !enabled;
    playGuessButton.hidden = !enabled || kind !== "chords";
    guessHeading.textContent = headingText;
  };
  const selectedPatternIds = (): string[] =>
    Array.from(
      patternOptions.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'),
      (input: HTMLInputElement): string => input.value,
    );
  const renderAnswerOptions = (availablePatterns: readonly PitchPattern[]): void => {
    const legend: HTMLLegendElement = document.createElement("legend");
    legend.textContent = `Choose a ${kind === "chords" ? "chord" : "scale"}`;
    const labels: HTMLLabelElement[] = availablePatterns.map(
      (pattern: PitchPattern): HTMLLabelElement => {
        const label: HTMLLabelElement = document.createElement("label");
        const input: HTMLInputElement = document.createElement("input");
        input.type = "radio";
        input.name = `${kind}-answer`;
        input.value = pattern.id;
        label.append(input, document.createTextNode(pattern.name));
        return label;
      },
    );
    answerOptions.replaceChildren(legend, ...labels);
  };

  setSettingsExpanded(true);
  setKeyboardAnswerMode(kind === "chords", "Your notes");
  settingsPanel.append(backButton, heading, instructionParagraph, settingsToggleButton, form);
  gamePanel.append(
    actions,
    keyboardContainer,
    answerOptions,
    attemptsOutput,
    hintsOutput,
    guessHeading,
    guessList,
    status,
    details,
  );
  element.append(settingsPanel, gamePanel);

  return {
    element,
    backButton,
    settingsToggleButton,
    form,
    modeInputs,
    failureLimitInput,
    hintLimitInput,
    patternOptions,
    settingsStatus,
    startButton,
    gamePanel,
    replayButton,
    hintButton,
    playGuessButton,
    finishButton,
    resetButton,
    nextRoundButton,
    keyboardContainer,
    guessList,
    answerOptions,
    attemptsOutput,
    hintsOutput,
    status,
    selectedPatternIds,
    renderAnswerOptions,
    setSettingsExpanded,
    setKeyboardAnswerMode,
  };
}
