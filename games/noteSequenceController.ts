import type { Envelope, PlayingAudio } from "../audio/types";
import { ConfettiEffect } from "../effects/ConfettiEffect";
import type { Effect } from "../effects/Effect";
import { midiNoteName, renderKeyboard } from "../keyboard";
import { evaluateGuess, setGuessFeedback } from "./guessFeedback";
import type { NoteSequenceView } from "./noteSequenceView";

const FIRST_GAME_NOTE: number = 60;
const GAME_KEY_COUNT: number = 25;
const NOTE_DURATION_SECONDS: number = 0.5;
const MIN_RANDOM_DURATION_SECONDS: number = 0.3;
const RANDOM_DURATION_RANGE_SECONDS: number = 0.5;
const NOTE_GAP_MILLISECONDS: number = 180;
const GAME_ENVELOPE: Envelope = {
  attack: 0.005,
  decay: 0,
  sustain: 1,
  release: 0.01,
};

export class NoteSequenceController {
  private readonly view: NoteSequenceView;
  private readonly playNote: (midiNote: number, envelope: Envelope) => PlayingAudio;
  private readonly correctAnswerEffect: Effect<void> = new ConfettiEffect();
  private readonly keyboardVoices: Map<number, PlayingAudio> = new Map<number, PlayingAudio>();
  private sequence: number[] = [];
  private durations: number[] = [];
  private guess: number[] = [];
  private submitted: boolean = false;
  private gameActive: boolean = false;
  private failedGuesses: number = 0;
  private failureLimit: number = 3;
  private hintsAllowed: number = 3;
  private hintsUsed: number = 0;
  private playbackToken: number = 0;
  private playbackTimeout: number | undefined;
  private playbackVoice: PlayingAudio | undefined;
  private gestureGuessIndex: number | undefined;

  /**
   * Creates the note sequence game controller and wires its game controls.
   * @param view The note sequence view that owns settings and game controls.
   * @param playNote Starts an audio voice for a MIDI note and envelope.
   */
  constructor(
    view: NoteSequenceView,
    playNote: (midiNote: number, envelope: Envelope) => PlayingAudio,
  ) {
    this.view = view;
    this.playNote = playNote;

    this.view.form.addEventListener("submit", (event: SubmitEvent): void => {
      event.preventDefault();
      this.startGame();
    });
    this.view.settingsToggleButton.addEventListener("click", (_event: MouseEvent): void => {
      this.view.setSettingsExpanded(this.view.form.hidden);
    });
    this.view.replayButton.addEventListener("click", (_event: MouseEvent): void => {
      this.playSequence();
    });
    this.view.hintButton.addEventListener("click", (): void => {
      this.useHint();
    });
    this.view.playMySequenceButton.addEventListener("click", (_event: MouseEvent): void => {
      this.playMySequence();
    });
    this.view.finishButton.addEventListener("click", (_event: MouseEvent): void => {
      this.finishGuess();
    });
    this.view.resetButton.addEventListener("click", (_event: MouseEvent): void => {
      this.resetGuess();
    });
    this.view.nextRoundButton.addEventListener("click", (_event: MouseEvent): void => {
      this.startGame();
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
    this.view.keyboardContainer
      .querySelectorAll<HTMLButtonElement>(".piano-key")
      .forEach((key: HTMLButtonElement): void => {
        key.disabled = true;
      });

    this.view.backButton.addEventListener("click", (_event: MouseEvent): void => {
      this.resetGame();
    });
  }

  /**
   * Clears every sequence-game state and restores the selection-ready view.
   */
  resetGame(): void {
    this.gameActive = false;
    this.stopPlayback();
    this.releaseKeyboardVoices();
    this.sequence = [];
    this.durations = [];
    this.guess = [];
    this.submitted = false;
    this.failedGuesses = 0;
    this.hintsUsed = 0;
    this.failureLimit = this.view.failureLimitInput.valueAsNumber || 3;
    this.hintsAllowed = this.view.hintLimitInput.valueAsNumber || 0;
    this.view.gamePanel.hidden = true;
    this.view.settingsToggleButton.hidden = true;
    this.view.setSettingsExpanded(true);
    this.view.status.textContent = "";
    this.view.replayButton.hidden = false;
    this.view.replayButton.disabled = true;
    this.view.hintButton.disabled = true;
    this.view.playMySequenceButton.hidden = false;
    this.view.playMySequenceButton.disabled = true;
    this.view.finishButton.hidden = false;
    this.view.finishButton.disabled = true;
    this.view.resetButton.hidden = false;
    this.view.resetButton.disabled = true;
    this.view.nextRoundButton.hidden = true;
    this.setKeyboardDisabled(true);
    this.updateAttemptsOutput();
    this.updateHintsOutput();
    this.renderGuess();
  }

  /**
   * Validates settings, starts a clean round, and plays the generated sequence.
   */
  private startGame(): void {
    const noteCount: number = this.view.noteCountInput.valueAsNumber;
    if (!Number.isInteger(noteCount) || noteCount < 1 || noteCount > 20) {
      this.showSettingsForValidation();
      this.view.noteCountInput.setCustomValidity("Enter a whole number from 1 to 20.");
      this.view.noteCountInput.reportValidity();
      return;
    }
    this.view.noteCountInput.setCustomValidity("");

    const failureLimit: number = this.view.failureLimitInput.valueAsNumber;
    if (!Number.isInteger(failureLimit) || failureLimit < 1 || failureLimit > 10) {
      this.showSettingsForValidation();
      this.view.failureLimitInput.setCustomValidity("Enter a whole number from 1 to 10.");
      this.view.failureLimitInput.reportValidity();
      return;
    }
    this.view.failureLimitInput.setCustomValidity("");

    const hintsAllowed: number = this.view.hintLimitInput.valueAsNumber;
    if (!Number.isInteger(hintsAllowed) || hintsAllowed < 0 || hintsAllowed > 10) {
      this.showSettingsForValidation();
      this.view.hintLimitInput.setCustomValidity("Enter a whole number from 0 to 10.");
      this.view.hintLimitInput.reportValidity();
      return;
    }
    this.view.hintLimitInput.setCustomValidity("");

    this.stopPlayback();
    this.releaseKeyboardVoices();
    this.sequence = Array.from({ length: noteCount }, (): number =>
      FIRST_GAME_NOTE + Math.floor(Math.random() * GAME_KEY_COUNT),
    );
    this.durations = this.sequence.map((): number =>
      this.view.randomizeLengthsInput.checked
        ? MIN_RANDOM_DURATION_SECONDS + Math.random() * RANDOM_DURATION_RANGE_SECONDS
        : NOTE_DURATION_SECONDS,
    );
    this.failureLimit = failureLimit;
    this.hintsAllowed = hintsAllowed;
    this.hintsUsed = 0;
    this.failedGuesses = 0;
    this.gameActive = true;
    this.guess = [];
    this.submitted = false;
    this.view.settingsToggleButton.hidden = false;
    this.view.setSettingsExpanded(false);
    this.view.gamePanel.hidden = false;
    this.view.replayButton.disabled = false;
    this.view.replayButton.hidden = false;
    this.view.playMySequenceButton.hidden = false;
    this.view.finishButton.disabled = false;
    this.view.finishButton.hidden = false;
    this.view.resetButton.disabled = false;
    this.view.resetButton.hidden = false;
    this.view.nextRoundButton.hidden = true;
    this.setKeyboardDisabled(false);
    this.updateAttemptsOutput();
    this.updateHintsOutput();
    this.renderGuess();
    this.playSequence();
  }

  private playSequence(): void {
    this.playNotes(
      this.sequence,
      this.durations,
      "Listen to the sequence…",
      "Your turn. Play the notes in order.",
    );
  }

  private playMySequence(): void {
    const notes: number[] = [...this.guess];
    const durations: number[] = notes.map(
      (_midiNote: number, index: number): number =>
        this.durations[index] ?? NOTE_DURATION_SECONDS,
    );
    this.playNotes(
      notes,
      durations,
      "Playing your sequence…",
      "Your sequence finished.",
    );
  }

  private playNotes(
    notes: readonly number[],
    durations: readonly number[],
    startMessage: string,
    endMessage: string,
  ): void {
    if (notes.length === 0) {
      return;
    }
    this.stopPlayback();
    this.view.status.textContent = startMessage;
    this.playNoteAt(0, this.playbackToken, notes, durations, endMessage);
  }

  /**
   * Plays a note list recursively, stopping old playback and scheduling gaps between notes.
   * @param index The index of the note that should start next.
   * @param token The lifecycle token that prevents stale playback callbacks.
   * @param notes The MIDI notes to play.
   * @param durations The duration of each note.
   * @param endMessage The status text to show after the sequence.
   */
  private playNoteAt(
    index: number,
    token: number,
    notes: readonly number[],
    durations: readonly number[],
    endMessage: string,
  ): void {
    if (token !== this.playbackToken) {
      return;
    }
    if (index >= notes.length) {
      this.view.status.textContent = endMessage;
      return;
    }

    const midiNote: number | undefined = notes[index];
    const duration: number | undefined = durations[index];
    if (midiNote === undefined || duration === undefined) {
      return;
    }

    const voice: PlayingAudio = this.playNote(midiNote, GAME_ENVELOPE);
    this.playbackVoice = voice;
    void voice.ready
      .then((): void => {
        if (token !== this.playbackToken || this.playbackVoice !== voice) {
          return;
        }
        this.playbackTimeout = window.setTimeout((): void => {
          if (token !== this.playbackToken) {
            return;
          }
          voice.release();
          this.playbackVoice = undefined;
          this.playbackTimeout = window.setTimeout((): void => {
            this.playNoteAt(index + 1, token, notes, durations, endMessage);
          }, NOTE_GAP_MILLISECONDS);
        }, duration * 1000);
      })
      .catch((error: unknown): void => {
        if (token === this.playbackToken) {
          const message: string = error instanceof Error ? error.message : String(error);
          this.view.status.textContent = `Unable to play note: ${message}`;
        }
      });
  }

  private pressGuessKey(midiNote: number): void {
    const voice: PlayingAudio = this.playNote(midiNote, GAME_ENVELOPE);
    this.keyboardVoices.set(midiNote, voice);
    void voice.ready.catch((error: unknown): void => {
      const message: string = error instanceof Error ? error.message : String(error);
      this.view.status.textContent = `Unable to play note: ${message}`;
    });
    if (this.gameActive && !this.submitted) {
      if (this.gestureGuessIndex === undefined) {
        this.gestureGuessIndex = this.guess.length;
        this.guess.push(midiNote);
      } else {
        this.guess[this.gestureGuessIndex] = midiNote;
      }
      this.renderGuess();
    }
  }

  /**
   * Stops playback, evaluates the submitted sequence guess, and updates round state.
   */
  private finishGuess(): void {
    if (!this.gameActive || this.submitted) {
      return;
    }
    this.stopPlayback();
    this.submitted = true;
    const isCorrect: boolean = evaluateGuess(
      this.guess,
      this.sequence,
      "ordered",
    ).isCorrect;
    if (!isCorrect) {
      this.failedGuesses += 1;
    }

    const gameFinished: boolean = isCorrect || this.failedGuesses >= this.failureLimit;
    if (gameFinished) {
      this.gameActive = false;
      this.view.replayButton.hidden = true;
      this.view.playMySequenceButton.hidden = true;
      this.view.resetButton.hidden = true;
      this.view.finishButton.hidden = true;
      this.view.nextRoundButton.hidden = false;
    }

    this.setKeyboardDisabled(true);
    this.view.finishButton.disabled = true;
    this.view.resetButton.disabled = gameFinished;
    this.updateAttemptsOutput();
    this.renderGuess();
    if (isCorrect) {
      this.correctAnswerEffect.trigger();
      this.view.status.textContent = "Correct! You got the whole sequence.";
    } else if (gameFinished) {
      this.view.status.textContent = "No guesses left. Start a new game when ready.";
    } else {
      this.view.status.textContent =
        "Not quite. Reset keys to enter another guess.";
    }
    this.updateHintsOutput();
  }

  private useHint(): void {
    if (!this.gameActive || this.hintsUsed >= this.hintsAllowed) {
      return;
    }
    this.hintsUsed += 1;
    this.updateHintsOutput();
    window.alert("Note sequence");
  }

  private resetGuess(): void {
    if (!this.gameActive) {
      return;
    }
    this.stopPlayback();
    this.gestureGuessIndex = undefined;
    this.submitted = false;
    this.guess = [];
    this.view.finishButton.disabled = false;
    this.view.resetButton.disabled = false;
    this.setKeyboardDisabled(false);
    this.renderGuess();
    const remainingFailures: number = this.failureLimit - this.failedGuesses;
    const guessLabel: string = remainingFailures === 1 ? "guess" : "guesses";
    this.view.status.textContent = `Guess cleared. ${remainingFailures} failed ${guessLabel} remaining.`;
  }

  private renderGuess(): void {
    this.view.playMySequenceButton.disabled = this.guess.length === 0;
    const feedback = this.submitted
      ? evaluateGuess(this.guess, this.sequence, "ordered")
      : undefined;
    const items: HTMLLIElement[] = this.guess.map(
      (midiNote: number, index: number): HTMLLIElement => {
        const item: HTMLLIElement = document.createElement("li");
        const removeButton: HTMLButtonElement = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn btn-outline-secondary";
        removeButton.textContent = `${index + 1}. ${midiNoteName(midiNote)}`;
        removeButton.setAttribute("aria-label", `Remove note ${index + 1}, ${midiNoteName(midiNote)}`);
        removeButton.disabled = this.submitted;
        if (feedback) {
          setGuessFeedback(removeButton, feedback.noteIsCorrect[index] === true);
        }
        removeButton.addEventListener("click", (_event: MouseEvent): void => {
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

  private stopPlayback(): void {
    this.playbackToken += 1;
    if (this.playbackTimeout !== undefined) {
      window.clearTimeout(this.playbackTimeout);
      this.playbackTimeout = undefined;
    }
    this.playbackVoice?.release();
    this.playbackVoice = undefined;
  }

  private releaseKeyboardVoice(midiNote: number): void {
    this.keyboardVoices.get(midiNote)?.release();
    this.keyboardVoices.delete(midiNote);
    if (this.keyboardVoices.size === 0) {
      this.gestureGuessIndex = undefined;
    }
  }

  private releaseKeyboardVoices(): void {
    for (const voice of this.keyboardVoices.values()) {
      voice.release();
    }
    this.keyboardVoices.clear();
    this.gestureGuessIndex = undefined;
  }

}
