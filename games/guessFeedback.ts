export type GuessMatchingMode = "ordered" | "unordered";

export interface GuessEvaluation {
  readonly noteIsCorrect: readonly boolean[];
  readonly isCorrect: boolean;
}

/**
 * Evaluates each submitted note and whether the complete guess matches the answer.
 * @param guess The notes submitted by the player.
 * @param answer The expected notes.
 * @param mode Whether note positions matter when matching.
 * @returns Per-note correctness and whether the full guess is correct.
 */
export function evaluateGuess(
  guess: readonly number[],
  answer: readonly number[],
  mode: GuessMatchingMode,
): GuessEvaluation {
  const noteIsCorrect: boolean[] = guess.map(
    (note: number, index: number): boolean =>
      mode === "ordered" ? note === answer[index] : answer.includes(note),
  );
  return {
    noteIsCorrect,
    isCorrect:
      guess.length === answer.length &&
      noteIsCorrect.every((isCorrect: boolean): boolean => isCorrect),
  };
}

/**
 * Applies the shared correctness class to a submitted guess button.
 * @param button The guess button to mark.
 * @param isCorrect Whether the represented note is correct.
 */
export function setGuessFeedback(
  button: HTMLButtonElement,
  isCorrect: boolean,
): void {
  button.classList.remove("guess-feedback--correct", "guess-feedback--incorrect");
  button.classList.add(
    isCorrect ? "guess-feedback--correct" : "guess-feedback--incorrect",
  );
}

/**
 * Adds the shared guess feedback styles once for all game views.
 */
export function ensureGuessFeedbackStyles(): void {
  if (document.getElementById("guess-feedback-styles")) {
    return;
  }
  const styles: HTMLStyleElement = document.createElement("style");
  styles.id = "guess-feedback-styles";
  styles.textContent = `
    .guess-feedback-list button.guess-feedback--correct {
      background: #e6f4ea;
      border-color: #188038;
      color: #137333;
    }
    .guess-feedback-list button.guess-feedback--incorrect {
      background: #fce8e6;
      border-color: #d93025;
      color: #a50e0e;
    }
  `;
  document.head.append(styles);
}
