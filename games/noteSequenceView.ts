import { ensureGuessFeedbackStyles } from "./guessFeedback";

export interface NoteSequenceView {
  readonly element: HTMLElement;
  readonly backButton: HTMLButtonElement;
  readonly settingsToggleButton: HTMLButtonElement;
  readonly form: HTMLFormElement;
  readonly noteCountInput: HTMLInputElement;
  readonly failureLimitInput: HTMLInputElement;
  readonly hintLimitInput: HTMLInputElement;
  readonly randomizeLengthsInput: HTMLInputElement;
  readonly startButton: HTMLButtonElement;
  readonly gamePanel: HTMLElement;
  readonly replayButton: HTMLButtonElement;
  readonly hintButton: HTMLButtonElement;
  readonly playMySequenceButton: HTMLButtonElement;
  readonly finishButton: HTMLButtonElement;
  readonly resetButton: HTMLButtonElement;
  readonly nextRoundButton: HTMLButtonElement;
  readonly keyboardContainer: HTMLDivElement;
  readonly guessList: HTMLOListElement;
  readonly attemptsOutput: HTMLOutputElement;
  readonly hintsOutput: HTMLOutputElement;
  readonly status: HTMLOutputElement;
  setSettingsExpanded(expanded: boolean): void;
}

const SVG_NAMESPACE: "http://www.w3.org/2000/svg" = "http://www.w3.org/2000/svg";

function createSettingsChevron(direction: "up" | "down"): SVGSVGElement {
  const icon: SVGSVGElement = document.createElementNS(SVG_NAMESPACE, "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "24");
  icon.setAttribute("height", "24");
  icon.setAttribute("aria-hidden", "true");
  const paths: readonly string[] =
    direction === "up"
      ? ["M 6 14 L 12 8 L 18 14", "M 6 20 L 12 14 L 18 20"]
      : ["M 6 10 L 12 16 L 18 10", "M 6 4 L 12 10 L 18 4"];
  for (const pathData of paths) {
    const path: SVGPathElement = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    icon.append(path);
  }
  return icon;
}

/**
 * Builds the note sequence game view and all of its lifecycle controls.
 * @returns The note sequence view elements and control bindings.
 */
export function createNoteSequenceView(): NoteSequenceView {
  ensureGuessFeedbackStyles();
  const styles: HTMLStyleElement = document.createElement("style");
  styles.textContent = `
    .note-sequence-settings {
      background: #fff;
      border: 1px solid #e7e8f0;
      border-radius: 1.25rem;
      box-shadow: 0 18px 48px #29316a0c;
      padding: clamp(1.25rem, 3vw, 2.25rem);
    }
    .note-sequence-settings h1 {
      margin-top: 0.75rem;
    }
    .note-sequence-controls {
      align-items: end;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin: 1.5rem 0 0.5rem;
    }
    .note-sequence-controls[hidden],
    .note-sequence-settings-toggle[hidden],
    .note-sequence-game-panel[hidden] {
      display: none;
    }
    .note-sequence-settings-toggle {
      cursor: pointer;
      padding: 0.35rem 0.75rem;
    }
    .note-sequence-settings-toggle svg {
      display: block;
    }
    .note-sequence-game-panel {
      margin-top: 1.5rem;
    }
    .note-sequence-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0;
    }
    .note-sequence-actions button,
    .note-sequence-controls button,
    .note-sequence-settings > button {
      cursor: pointer;
      padding: 0.35rem 0.75rem;
    }
    .note-sequence-actions button[hidden] {
      display: none;
    }
    .note-sequence-reset {
      background: #fce8e6;
      border: 1px solid #f1b8b3;
    }
    .note-sequence-reset:hover:not(:disabled) {
      background: #f4c7c3;
      border-color: #e6a09a;
    }
    .note-sequence-finish {
      background: #e6f4ea;
      border: 1px solid #a8dab5;
    }
    .note-sequence-actions button.note-sequence-finish {
      color: #2f6d43;
    }
    .note-sequence-finish:hover:not(:disabled) {
      background: #cde8d4;
      border-color: #81c995;
    }
    .note-sequence-randomize {
      align-items: center;
      align-self: center;
      display: flex;
      gap: 0.4rem;
    }
    .note-sequence-randomize input {
      margin: 0;
    }
    .note-sequence-guess {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      list-style: none;
      margin: 0.5rem 0;
      padding: 0;
    }
    .note-sequence-guess button {
      cursor: pointer;
      padding: 0.3rem 0.6rem;
    }
    .note-sequence-guess button:disabled {
      cursor: default;
    }
    .note-sequence-status {
      font-weight: 600;
      margin-top: 1rem;
    }
  `;
  document.head.append(styles);

  const element: HTMLElement = document.createElement("section");
  element.className = "note-sequence-view";
  element.hidden = true;

  const settingsPanel: HTMLElement = document.createElement("section");
  settingsPanel.className = "note-sequence-settings";

  const backButton: HTMLButtonElement = document.createElement("button");
  backButton.type = "button";
  backButton.className = "btn btn-outline-secondary";
  backButton.textContent = "Back to keyboard";

  const heading: HTMLHeadingElement = document.createElement("h1");
  heading.textContent = "Note sequence";
  const instructions: HTMLParagraphElement = document.createElement("p");
  instructions.textContent =
    "Listen to the sequence, then play the notes in order. Select a numbered note below the keyboard to remove it.";

  const settingsToggleButton: HTMLButtonElement = document.createElement("button");
  settingsToggleButton.type = "button";
  settingsToggleButton.className = "btn btn-outline-secondary note-sequence-settings-toggle";
  settingsToggleButton.setAttribute("aria-controls", "note-sequence-controls");
  settingsToggleButton.hidden = true;

  const form: HTMLFormElement = document.createElement("form");
  form.id = "note-sequence-controls";
  form.className = "note-sequence-controls";
  const countLabel: HTMLLabelElement = document.createElement("label");
  countLabel.htmlFor = "sequence-note-count";
  countLabel.textContent = "Number of notes (1–20)";
  const noteCountInput: HTMLInputElement = document.createElement("input");
  noteCountInput.id = "sequence-note-count";
  noteCountInput.type = "number";
  noteCountInput.className = "form-control";
  noteCountInput.min = "1";
  noteCountInput.max = "20";
  noteCountInput.step = "1";
  noteCountInput.value = "3";
  noteCountInput.required = true;
  countLabel.append(noteCountInput);

  const failureLimitLabel: HTMLLabelElement = document.createElement("label");
  failureLimitLabel.htmlFor = "sequence-failure-limit";
  failureLimitLabel.textContent = "Allowed failed guesses (1–10)";
  const failureLimitInput: HTMLInputElement = document.createElement("input");
  failureLimitInput.id = "sequence-failure-limit";
  failureLimitInput.type = "number";
  failureLimitInput.className = "form-control";
  failureLimitInput.min = "1";
  failureLimitInput.max = "10";
  failureLimitInput.step = "1";
  failureLimitInput.value = "3";
  failureLimitInput.required = true;
  failureLimitLabel.append(failureLimitInput);

  const hintLimitLabel: HTMLLabelElement = document.createElement("label");
  hintLimitLabel.htmlFor = "sequence-hint-limit";
  hintLimitLabel.textContent = "Allowed hints per round (0–10)";
  const hintLimitInput: HTMLInputElement = document.createElement("input");
  hintLimitInput.id = "sequence-hint-limit";
  hintLimitInput.type = "number";
  hintLimitInput.className = "form-control";
  hintLimitInput.min = "0";
  hintLimitInput.max = "10";
  hintLimitInput.step = "1";
  hintLimitInput.value = "3";
  hintLimitInput.required = true;
  hintLimitLabel.append(hintLimitInput);

  const randomizeLabel: HTMLLabelElement = document.createElement("label");
  randomizeLabel.className = "note-sequence-randomize";
  const randomizeLengthsInput: HTMLInputElement = document.createElement("input");
  randomizeLengthsInput.type = "checkbox";
  randomizeLengthsInput.className = "form-check-input";
  randomizeLabel.append(randomizeLengthsInput, document.createTextNode("Random note lengths"));

  const startButton: HTMLButtonElement = document.createElement("button");
  startButton.type = "submit";
  startButton.className = "btn btn-primary";
  startButton.textContent = "Start new game";
  form.append(countLabel, failureLimitLabel, hintLimitLabel, randomizeLabel, startButton);

  const replayButton: HTMLButtonElement = document.createElement("button");
  replayButton.type = "button";
  replayButton.className = "btn btn-outline-primary";
  replayButton.textContent = "Replay notes";
  replayButton.disabled = true;
  const hintButton: HTMLButtonElement = document.createElement("button");
  hintButton.type = "button";
  hintButton.className = "btn btn-outline-primary";
  hintButton.textContent = "Hint";
  hintButton.disabled = true;
  const playMySequenceButton: HTMLButtonElement = document.createElement("button");
  playMySequenceButton.type = "button";
  playMySequenceButton.className = "btn btn-outline-primary";
  playMySequenceButton.textContent = "Play my sequence";
  playMySequenceButton.disabled = true;
  const finishButton: HTMLButtonElement = document.createElement("button");
  finishButton.type = "button";
  finishButton.textContent = "Finish guess";
  finishButton.className = "btn btn-success note-sequence-finish";
  finishButton.disabled = true;
  const resetButton: HTMLButtonElement = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Reset keys";
  resetButton.className = "btn btn-outline-danger note-sequence-reset";
  resetButton.disabled = true;
  const nextRoundButton: HTMLButtonElement = document.createElement("button");
  nextRoundButton.type = "button";
  nextRoundButton.className = "btn btn-primary";
  nextRoundButton.textContent = "Next round";
  nextRoundButton.hidden = true;
  const actions: HTMLDivElement = document.createElement("div");
  actions.className = "note-sequence-actions";
  actions.append(
    replayButton,
    hintButton,
    playMySequenceButton,
    resetButton,
    finishButton,
    nextRoundButton,
  );

  const gamePanel: HTMLElement = document.createElement("section");
  gamePanel.className = "note-sequence-game-panel";
  gamePanel.hidden = true;
  const keyboardContainer: HTMLDivElement = document.createElement("div");
  const attemptsOutput: HTMLOutputElement = document.createElement("output");
  attemptsOutput.textContent = "Failed guesses: 0 / 3";
  attemptsOutput.setAttribute("aria-live", "polite");
  const hintsOutput: HTMLOutputElement = document.createElement("output");
  hintsOutput.textContent = "Hints used: 0 / 3";
  hintsOutput.setAttribute("aria-live", "polite");
  const guessHeading: HTMLHeadingElement = document.createElement("h2");
  guessHeading.textContent = "Your sequence";
  const guessList: HTMLOListElement = document.createElement("ol");
  guessList.className = "note-sequence-guess guess-feedback-list";
  const status: HTMLOutputElement = document.createElement("output");
  status.className = "note-sequence-status";
  status.setAttribute("aria-live", "polite");

  const setSettingsExpanded = (expanded: boolean): void => {
    form.hidden = !expanded;
    settingsToggleButton.setAttribute("aria-expanded", String(expanded));
    settingsToggleButton.setAttribute(
      "aria-label",
      expanded ? "Hide settings" : "Show settings",
    );
    settingsToggleButton.replaceChildren(
      createSettingsChevron(expanded ? "up" : "down"),
    );
  };
  setSettingsExpanded(true);

  settingsPanel.append(
    backButton,
    heading,
    instructions,
    settingsToggleButton,
    form,
  );
  gamePanel.append(
    actions,
    keyboardContainer,
    attemptsOutput,
    hintsOutput,
    guessHeading,
    guessList,
    status,
  );
  element.append(settingsPanel, gamePanel);

  return {
    element,
    backButton,
    settingsToggleButton,
    form,
    noteCountInput,
    failureLimitInput,
    hintLimitInput,
    randomizeLengthsInput,
    startButton,
    gamePanel,
    replayButton,
    hintButton,
    playMySequenceButton,
    finishButton,
    resetButton,
    nextRoundButton,
    keyboardContainer,
    guessList,
    attemptsOutput,
    hintsOutput,
    status,
    setSettingsExpanded,
  };
}
