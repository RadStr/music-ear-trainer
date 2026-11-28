import type { Envelope, PlayingAudio } from "../audio/types";
import { ConfettiEffect } from "../effects/ConfettiEffect";
import { ExplodingTextEffect } from "../effects/ExplodingTextEffect";
import type { Effect } from "../effects/Effect";
import { midiNoteName, renderKeyboard } from "../keyboard";
import { evaluateGuess, setGuessFeedback } from "./guessFeedback";
import { NOTE_PITCH_CLASSES, type PitchPattern } from "./pitchGameData";
import type { PitchGameKind, PitchIdentificationView } from "./pitchIdentificationView";
import { localize } from "../localization";

const FIRST_GAME_NOTE: number = 60;
const GAME_KEY_COUNT: number = 25;
const RANDOM_NOTE_COUNT: number = 3;
const NOTE_DURATION_SECONDS: number = 0.45;
const CHORD_DURATION_MILLISECONDS: number = 1400;
const NOTE_GAP_MILLISECONDS: number = 140;
const GAME_ENVELOPE: Envelope = {
  attack: 0.005,
  decay: 0,
  sustain: 1,
  release: 0.03,
};
type GameMode = "random-notes" | "identify-pattern" | "identify-notes";

export class PitchIdentificationController {
  private readonly view: PitchIdentificationView;
  private readonly kind: PitchGameKind;
  private readonly patterns: readonly PitchPattern[];
  private readonly playNote: (midiNote: number, envelope: Envelope) => PlayingAudio;
  private readonly winEffects: readonly Effect[] = [
    new ConfettiEffect(),
    new ExplodingTextEffect(),
  ];
  private readonly keyboardVoices: Map<number, PlayingAudio> = new Map<number, PlayingAudio>();
  private targetNotes: number[] = [];
  private targetPattern: PitchPattern | undefined;
  private guess: number[] = [];
  private submitted: boolean = false;
  private gameActive: boolean = false;
  private failedGuesses: number = 0;
  private failureLimit: number = 3;
  private hintsAllowed: number = 3;
  private hintsUsed: number = 0;
  private gameMode: GameMode = "identify-pattern";
  private playbackToken: number = 0;
  private playbackTimeout: number | undefined;
  private playbackVoices: PlayingAudio[] = [];

  /**
   * Creates the pitch identification controller and wires its game controls.
   * @param view The pitch game view receiving settings and guesses.
   * @param kind The chord or scale game type.
   * @param patterns The available patterns for pattern-identification mode.
   * @param playNote Starts an audio voice for a MIDI note and envelope.
   */
  constructor(
    view: PitchIdentificationView,
    kind: PitchGameKind,
    patterns: readonly PitchPattern[],
    playNote: (midiNote: number, envelope: Envelope) => PlayingAudio,
  ) {
    this.view = view;
    this.kind = kind;
    this.patterns = patterns;
    this.playNote = playNote;

    this.view.form.addEventListener("submit", (event: SubmitEvent): void => {
      event.preventDefault();
      this.startGame();
    });
    this.view.settingsToggleButton.addEventListener("click", (): void => {
      this.view.setSettingsExpanded(this.view.form.hidden);
    });
    for (const modeInput of this.view.modeInputs) {
      modeInput.addEventListener("change", (): void => {
        if (this.gameActive) {
          return;
        }
        const selected: boolean = modeInput.checked;
        const isKeyboardMode: boolean =
          selected && modeInput.value !== "identify-pattern";
        const headingText: string =
          modeInput.value === "random-notes"
            ? "Your notes"
            : this.kind === "scales"
              ? "Your scale (in order)"
              : "Your chord (any order)";
        this.view.setKeyboardAnswerMode(
          isKeyboardMode,
          headingText,
        );
      });
    }
    this.view.replayButton.addEventListener("click", (): void => this.playTarget());
    this.view.hintButton.addEventListener("click", (): void => this.useHint());
    this.view.playGuessButton.addEventListener("click", (): void => this.playGuessNotes());
    this.view.finishButton.addEventListener("click", (): void => this.finishGuess());
    this.view.resetButton.addEventListener("click", (): void => this.resetGuess());
    this.view.nextRoundButton.addEventListener("click", (): void => this.startGame());
    this.view.backButton.addEventListener("click", (): void => {
      this.resetGame();
    });

    renderKeyboard(
      this.view.keyboardContainer,
      GAME_KEY_COUNT,
      {
        onPress: (midiNote: number): void => this.pressGuessKey(midiNote),
        onRelease: (midiNote: number): void => this.releaseKeyboardVoice(midiNote),
        onHover: (): void => {},
        onLeave: (): void => {},
      },
      FIRST_GAME_NOTE,
    );
    this.setKeyboardDisabled(true);
  }

  /**
   * Clears every pitch-game state and restores the initial settings view.
   */
  resetGame(): void {
    this.gameActive = false;
    this.stopPlayback();
    this.releaseKeyboardVoices();
    this.targetNotes = [];
    this.targetPattern = undefined;
    this.guess = [];
    this.submitted = false;
    this.failedGuesses = 0;
    this.hintsUsed = 0;
    this.gameMode =
      this.kind === "chords" ? "random-notes" : "identify-pattern";
    this.failureLimit = this.view.failureLimitInput.valueAsNumber || 3;
    this.hintsAllowed = this.view.hintLimitInput.valueAsNumber || 0;
    this.view.gamePanel.hidden = true;
    this.view.settingsToggleButton.hidden = true;
    this.view.setSettingsExpanded(true);
    this.view.status.textContent = "";
    this.view.settingsStatus.textContent = "";
    this.view.replayButton.hidden = false;
    this.view.replayButton.disabled = true;
    this.view.hintButton.disabled = true;
    this.view.playGuessButton.hidden = false;
    this.view.playGuessButton.disabled = true;
    this.view.finishButton.hidden = false;
    this.view.finishButton.disabled = true;
    this.view.resetButton.hidden = false;
    this.view.resetButton.disabled = true;
    this.view.nextRoundButton.hidden = true;
    this.view.answerOptions
      .querySelectorAll<HTMLInputElement>('input[type="radio"]')
      .forEach((input: HTMLInputElement): void => {
        input.checked = false;
        input.disabled = true;
      });
    for (const modeInput of this.view.modeInputs) {
      modeInput.checked =
        modeInput.value ===
        (this.kind === "chords" ? "random-notes" : "identify-pattern");
    }
    this.view.setKeyboardAnswerMode(
      this.kind === "chords",
      this.kind === "scales" ? "Your scale (in order)" : "Your notes",
    );
    this.view.element
      .querySelector(".pitch-game-details")
      ?.replaceChildren();
    this.setKeyboardDisabled(true);
    this.updateAttemptsOutput();
    this.updateHintsOutput();
    this.renderGuess();
  }

  /**
   * Validates settings and starts a clean pitch-identification round.
   */
  private startGame(): void {
    this.targetNotes = [];
    this.targetPattern = undefined;
    this.guess = [];
    this.submitted = false;
    this.view.element
      .querySelector(".pitch-game-details")
      ?.replaceChildren();
    this.view.status.textContent = "";
    this.view.renderAnswerOptions([]);
    const selectedIds: Set<string> = new Set<string>(this.view.selectedPatternIds());
    const availablePatterns: PitchPattern[] = this.patterns.filter(
      (pattern: PitchPattern): boolean => selectedIds.has(pattern.id),
    );
    if (availablePatterns.length === 0) {
      this.showSettingsForValidation();
      this.view.settingsStatus.textContent = localize(
        `Select at least one ${this.kind === "chords" ? "chord" : "scale"}.`,
      );
      return;
    }
    this.view.settingsStatus.textContent = "";

    const failureLimit: number = this.view.failureLimitInput.valueAsNumber;
    if (!Number.isInteger(failureLimit) || failureLimit < 1 || failureLimit > 10) {
      this.showSettingsForValidation();
      this.view.failureLimitInput.setCustomValidity(
        localize("Enter a whole number from 1 to 10."),
      );
      this.view.failureLimitInput.reportValidity();
      return;
    }
    this.view.failureLimitInput.setCustomValidity("");

    const hintsAllowed: number = this.view.hintLimitInput.valueAsNumber;
    if (!Number.isInteger(hintsAllowed) || hintsAllowed < 0 || hintsAllowed > 10) {
      this.showSettingsForValidation();
      this.view.hintLimitInput.setCustomValidity(
        localize("Enter a whole number from 0 to 10."),
      );
      this.view.hintLimitInput.reportValidity();
      return;
    }
    this.view.hintLimitInput.setCustomValidity("");

    const selectedMode: string | undefined = this.view.modeInputs.find(
      (input: HTMLInputElement): boolean => input.checked,
    )?.value;
    this.gameMode =
      selectedMode === "random-notes"
        ? "random-notes"
        : selectedMode === "identify-notes"
          ? "identify-notes"
          : "identify-pattern";

    this.stopPlayback();
    this.releaseKeyboardVoices();
    this.targetPattern = this.randomItem(availablePatterns);
    this.targetNotes =
      this.gameMode === "random-notes"
        ? this.randomNotes(RANDOM_NOTE_COUNT)
        : this.patternToMidiNotes(this.targetPattern);
    this.failedGuesses = 0;
    this.failureLimit = failureLimit;
    this.hintsAllowed = hintsAllowed;
    this.hintsUsed = 0;
    this.gameActive = true;
    this.guess = [];
    this.submitted = false;
    this.view.settingsToggleButton.hidden = false;
    this.view.setSettingsExpanded(false);
    this.view.gamePanel.hidden = false;
    this.view.renderAnswerOptions(availablePatterns);
    const keyboardAnswerMode: boolean = this.gameMode !== "identify-pattern";
    const headingText: string =
      this.gameMode === "random-notes"
        ? "Your notes"
        : this.kind === "scales"
          ? "Your scale (in order)"
          : "Your chord (any order)";
    this.view.setKeyboardAnswerMode(
      keyboardAnswerMode,
      headingText,
    );
    this.view.replayButton.disabled = false;
    this.view.replayButton.hidden = false;
    this.view.playGuessButton.disabled = true;
    this.view.finishButton.disabled = false;
    this.view.finishButton.hidden = false;
    this.view.resetButton.disabled = false;
    this.view.nextRoundButton.hidden = true;
    this.view.status.textContent = "";
    this.view.attemptsOutput.textContent = "";
    this.view.answerOptions
      .querySelectorAll<HTMLInputElement>('input[type="radio"]')
      .forEach((input: HTMLInputElement): void => {
        input.checked = false;
        input.disabled = false;
      });
    this.setKeyboardDisabled(!keyboardAnswerMode);
    this.updateAttemptsOutput();
    this.updateHintsOutput();
    this.renderGuess();
    this.playTarget();
  }

  private playTarget(): void {
    if (this.targetNotes.length === 0) {
      return;
    }
    if (this.kind === "chords") {
      this.playSimultaneousNotes(this.targetNotes);
      return;
    }
    this.playNotesInSequence(this.targetNotes);
  }

  private playSimultaneousNotes(
    notes: readonly number[],
    startMessage: string = "Listen to the notes…",
    endMessage: string = "Your turn.",
  ): void {
    this.stopPlayback();
    const token: number = this.playbackToken;
    this.view.status.textContent = startMessage;
    try {
      const voices: PlayingAudio[] = [];
      this.playbackVoices = voices;
      for (const midiNote of notes) {
        voices.push(this.playNote(midiNote, GAME_ENVELOPE));
      }
    } catch (error: unknown) {
      this.releasePlaybackVoices();
      this.showPlaybackError(error);
      return;
    }
    void Promise.all(this.playbackVoices.map((voice: PlayingAudio): Promise<void> => voice.ready))
      .then((): void => {
        if (token !== this.playbackToken) {
          return;
        }
        this.playbackTimeout = window.setTimeout((): void => {
          if (token !== this.playbackToken) {
            return;
          }
          this.releasePlaybackVoices();
          this.view.status.textContent = endMessage;
        }, CHORD_DURATION_MILLISECONDS);
      })
      .catch((error: unknown): void => {
        if (token === this.playbackToken) {
          this.stopPlayback();
          this.showPlaybackError(error);
        }
      });
  }

  private playGuessNotes(): void {
    if (!this.gameActive || this.submitted || this.kind !== "chords" || this.guess.length === 0) {
      return;
    }
    this.playSimultaneousNotes(
      this.guess,
      "Playing your chosen notes…",
      "Your notes finished.",
    );
  }

  private playNotesInSequence(notes: readonly number[]): void {
    this.stopPlayback();
    this.view.status.textContent = "Listen to the scale…";
    this.playNoteAt(0, this.playbackToken, notes);
  }

  /**
   * Plays one note in a sequence and schedules the following note after a gap.
   * @param index The note index to play.
   * @param token The lifecycle token for the current playback.
   * @param notes The MIDI notes in playback order.
   */
  private playNoteAt(index: number, token: number, notes: readonly number[]): void {
    if (token !== this.playbackToken) {
      return;
    }
    if (index >= notes.length) {
      this.view.status.textContent = "Your turn.";
      return;
    }
    const midiNote: number | undefined = notes[index];
    if (midiNote === undefined) {
      return;
    }
    let voice: PlayingAudio;
    try {
      voice = this.playNote(midiNote, GAME_ENVELOPE);
    } catch (error: unknown) {
      this.showPlaybackError(error);
      return;
    }
    this.playbackVoices = [voice];
    void voice.ready
      .then((): void => {
        if (token !== this.playbackToken || this.playbackVoices[0] !== voice) {
          return;
        }
        this.playbackTimeout = window.setTimeout((): void => {
          if (token !== this.playbackToken) {
            return;
          }
          this.releasePlaybackVoices();
          this.playbackTimeout = window.setTimeout((): void => {
            this.playNoteAt(index + 1, token, notes);
          }, NOTE_GAP_MILLISECONDS);
        }, NOTE_DURATION_SECONDS * 1000);
      })
      .catch((error: unknown): void => {
        if (token === this.playbackToken) {
          this.stopPlayback();
          this.showPlaybackError(error);
        }
      });
  }

  /**
   * Stops playback, evaluates the guess or selected answer, and updates round state.
   */
  private finishGuess(): void {
    if (!this.gameActive || this.submitted) {
      return;
    }
    let isCorrect: boolean;
    if (this.gameMode !== "identify-pattern") {
      isCorrect = evaluateGuess(
        this.guess,
        this.targetNotes,
        this.kind === "scales" ? "ordered" : "unordered",
      ).isCorrect;
    } else {
      const selectedAnswer: HTMLInputElement | null =
        this.view.answerOptions.querySelector<HTMLInputElement>('input[type="radio"]:checked');
      if (!selectedAnswer) {
        this.view.status.textContent = `Choose a ${this.kind === "chords" ? "chord" : "scale"} first.`;
        return;
      }
      isCorrect = selectedAnswer.value === this.targetPattern?.id;
    }

    this.stopPlayback();
    this.submitted = true;
    if (!isCorrect) {
      this.failedGuesses += 1;
    }
    const gameFinished: boolean = isCorrect || this.failedGuesses >= this.failureLimit;
    this.setKeyboardDisabled(true);
    this.view.finishButton.disabled = true;
    this.view.resetButton.disabled = gameFinished;
    this.view.answerOptions
      .querySelectorAll<HTMLInputElement>('input[type="radio"]')
      .forEach((input: HTMLInputElement): void => {
        input.disabled = true;
      });
    this.updateAttemptsOutput();
    this.renderGuess();
    if (isCorrect) {
      for (const effect of this.winEffects) {
        effect.trigger(localize("Correct!"));
      }
    }

    if (gameFinished) {
      this.gameActive = false;
      this.view.replayButton.hidden = true;
      this.view.playGuessButton.hidden = true;
      this.view.resetButton.hidden = true;
      this.view.finishButton.hidden = true;
      this.view.nextRoundButton.hidden = false;
      this.renderAnswerDetails();
      this.view.status.textContent = isCorrect
        ? "Correct! Well done."
        : "No guesses left. Review the answer, then start a new round.";
    } else {
      if (this.gameMode === "identify-pattern") {
        this.submitted = false;
        this.view.finishButton.disabled = false;
        this.view.answerOptions
          .querySelectorAll<HTMLInputElement>('input[type="radio"]')
          .forEach((input: HTMLInputElement): void => {
            input.checked = false;
            input.disabled = false;
          });
        this.view.status.textContent = "Not quite. Choose another answer.";
      } else {
        this.view.status.textContent = "Not quite. Reset your notes to try again.";
      }
    }
    this.updateHintsOutput();
  }

  private useHint(): void {
    if (!this.gameActive || this.hintsUsed >= this.hintsAllowed) {
      return;
    }
    this.hintsUsed += 1;
    this.updateHintsOutput();
    window.alert(
      localize(this.kind === "chords" ? "Chord and notes guessing" : "Scale guessing"),
    );
  }

  private resetGuess(): void {
    if (!this.gameActive) {
      return;
    }
    this.stopPlayback();
    this.submitted = false;
    this.guess = [];
    this.view.answerOptions
      .querySelectorAll<HTMLInputElement>('input[type="radio"]')
      .forEach((input: HTMLInputElement): void => {
        input.checked = false;
        input.disabled = false;
      });
    this.view.finishButton.disabled = false;
    this.view.resetButton.disabled = false;
    this.setKeyboardDisabled(this.gameMode === "identify-pattern");
    this.renderGuess();
    const remainingFailures: number = this.failureLimit - this.failedGuesses;
    this.view.status.textContent =
      `Answer cleared. ${remainingFailures} failed ${remainingFailures === 1 ? "guess" : "guesses"} remaining.`;
  }

  private pressGuessKey(midiNote: number): void {
    try {
      const voice: PlayingAudio = this.playNote(midiNote, GAME_ENVELOPE);
      this.keyboardVoices.set(midiNote, voice);
      void voice.ready.catch((error: unknown): void => this.showPlaybackError(error));
    } catch (error: unknown) {
      this.showPlaybackError(error);
    }
    if (
      this.gameActive &&
      !this.submitted &&
      (this.kind === "scales" || !this.guess.includes(midiNote))
    ) {
      this.guess.push(midiNote);
      if (this.kind === "chords") {
        this.guess.sort((left: number, right: number): number => left - right);
      }
      this.renderGuess();
    }
  }

  private renderGuess(): void {
    this.view.playGuessButton.disabled =
      this.guess.length === 0 || this.submitted || !this.gameActive;
    const feedback =
      this.submitted && this.gameMode !== "identify-pattern"
        ? evaluateGuess(
            this.guess,
            this.targetNotes,
            this.kind === "scales" ? "ordered" : "unordered",
          )
        : undefined;
    const items: HTMLLIElement[] = this.guess.map(
      (midiNote: number, index: number): HTMLLIElement => {
        const item: HTMLLIElement = document.createElement("li");
        const removeButton: HTMLButtonElement = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn btn-outline-secondary";
        removeButton.textContent = midiNoteName(midiNote);
        removeButton.setAttribute("aria-label", `Remove note ${index + 1}, ${midiNoteName(midiNote)}`);
        removeButton.disabled = this.submitted;
        if (feedback) {
          setGuessFeedback(removeButton, feedback.noteIsCorrect[index] === true);
        }
        removeButton.addEventListener("click", (): void => {
          if (this.submitted) {
            return;
          }
          this.guess.splice(index, 1);
          this.renderGuess();
        });
        item.append(removeButton);
        return item;
      },
    );
    this.view.guessList.replaceChildren(...items);
  }

  private renderAnswerDetails(): void {
    const details: HTMLDivElement = document.createElement("div");
    if (this.gameMode === "random-notes") {
      const notes: HTMLParagraphElement = document.createElement("p");
      notes.textContent = `The notes were: ${this.targetNotes.map(midiNoteName).join(", ")}.`;
      details.append(notes);
    } else if (this.targetPattern) {
      const name: HTMLHeadingElement = document.createElement("h2");
      name.textContent = this.targetPattern.name;
      const notes: HTMLParagraphElement = document.createElement("p");
      notes.textContent = `Notes: ${this.targetPattern.notes.join(", ")}.`;
      const description: HTMLParagraphElement = document.createElement("p");
      description.textContent = this.targetPattern.description;
      const examples: HTMLParagraphElement = document.createElement("p");
      examples.textContent = `Examples: ${this.targetPattern.examples}`;
      details.append(name, notes, description, examples);
    }
    this.view.element
      .querySelector(".pitch-game-details")
      ?.replaceChildren(details);
  }

  private randomNotes(count: number): number[] {
    const available: number[] = Array.from(
      { length: GAME_KEY_COUNT },
      (_: undefined, index: number): number => FIRST_GAME_NOTE + index,
    );
    for (let index: number = available.length - 1; index > 0; index -= 1) {
      const swapIndex: number = Math.floor(Math.random() * (index + 1));
      const current: number | undefined = available[index];
      const swap: number | undefined = available[swapIndex];
      if (current !== undefined && swap !== undefined) {
        available[index] = swap;
        available[swapIndex] = current;
      }
    }
    return available.slice(0, count).sort((left: number, right: number): number => left - right);
  }

  private patternToMidiNotes(pattern: PitchPattern): number[] {
    let previousMidiNote: number = -1;
    const notes: number[] = pattern.notes.map((note: string): number => {
      const pitchClass: number | undefined = NOTE_PITCH_CLASSES[note];
      if (pitchClass === undefined) {
        throw new Error(`Unsupported note in ${pattern.name}: ${note}`);
      }
      let midiNote: number = FIRST_GAME_NOTE + pitchClass;
      while (midiNote <= previousMidiNote) {
        midiNote += 12;
      }
      previousMidiNote = midiNote;
      return midiNote;
    });
    if (this.kind === "scales") {
      const rootNote: number | undefined = notes[0];
      if (rootNote !== undefined) {
        notes.push(rootNote + 12);
      }
    }
    return notes;
  }

  private randomItem<T>(items: readonly T[]): T {
    const item: T | undefined = items[Math.floor(Math.random() * items.length)];
    if (item === undefined) {
      throw new Error("Cannot choose from an empty collection.");
    }
    return item;
  }

  private showSettingsForValidation(): void {
    if (this.view.form.hidden) {
      this.view.settingsToggleButton.hidden = false;
      this.view.setSettingsExpanded(true);
    }
  }

  private setKeyboardDisabled(disabled: boolean): void {
    this.view.keyboardContainer
      .querySelectorAll<HTMLButtonElement>(".piano-key")
      .forEach((key: HTMLButtonElement): void => {
        key.disabled = disabled;
      });
  }

  private updateAttemptsOutput(): void {
    this.view.attemptsOutput.textContent =
      `Failed guesses: ${this.failedGuesses} / ${this.failureLimit}`;
  }

  private updateHintsOutput(): void {
    this.view.hintsOutput.textContent =
      `Hints used: ${this.hintsUsed} / ${this.hintsAllowed}`;
    this.view.hintButton.disabled =
      !this.gameActive || this.hintsUsed >= this.hintsAllowed;
  }

  private showPlaybackError(error: unknown): void {
    const message: string = error instanceof Error ? error.message : String(error);
    this.view.status.textContent = `Unable to play notes: ${message}`;
  }

  private stopPlayback(): void {
    this.playbackToken += 1;
    if (this.playbackTimeout !== undefined) {
      window.clearTimeout(this.playbackTimeout);
      this.playbackTimeout = undefined;
    }
    this.releasePlaybackVoices();
  }

  private releasePlaybackVoices(): void {
    for (const voice of this.playbackVoices) {
      voice.release();
    }
    this.playbackVoices = [];
  }

  private releaseKeyboardVoice(midiNote: number): void {
    this.keyboardVoices.get(midiNote)?.release();
    this.keyboardVoices.delete(midiNote);
  }

  private releaseKeyboardVoices(): void {
    for (const voice of this.keyboardVoices.values()) {
      voice.release();
    }
    this.keyboardVoices.clear();
  }
}
