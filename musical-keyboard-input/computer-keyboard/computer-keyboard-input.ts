import type { KeyboardInput, KeyboardInputTarget } from "../keyboard-input";
import {
  COMPUTER_KEYBOARD_BASE_MIDI_NOTE,
  COMPUTER_KEYBOARD_NOTE_OFFSETS,
} from "./key-mappings";

const OCTAVE_SEMITONES: number = 12;
const MIN_OCTAVE_SHIFT: number = -4;
const MAX_OCTAVE_SHIFT: number = 5;

export class ComputerKeyboardInput implements KeyboardInput {
  private octaveShift: number = 0;

  /**
   * Connects piano-shaped computer-keyboard keys and octave controls to the rendered keyboard.
   * @param target The keyboard element, callbacks, and listener lifetime.
   */
  connect(target: KeyboardInputTarget): void {
    const heldNotes: Map<string, number> = new Map<string, number>();
    const isInputActive = (event: KeyboardEvent): boolean => {
      if (
        target.keyboard.closest("[hidden]") ||
        document.querySelector("dialog[open]") ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return false;
      }
      const eventTarget: EventTarget | null = event.target;
      if (
        eventTarget instanceof HTMLElement &&
        (eventTarget.isContentEditable ||
          eventTarget.closest("input, textarea, select, [contenteditable='true']"))
      ) {
        return false;
      }
      return true;
    };
    const releaseHeldNotes = (): void => {
      for (const code of heldNotes.keys()) {
        target.callbacks.onRelease(`computer:${code}`);
      }
      heldNotes.clear();
    };

    window.addEventListener(
      "keydown",
      (event: KeyboardEvent): void => {
        if (heldNotes.has(event.code)) {
          event.preventDefault();
          return;
        }
        if (event.repeat || !isInputActive(event)) {
          return;
        }
        if (event.code === "KeyX" || event.code === "KeyC") {
          event.preventDefault();
          this.shiftOctave(event.code === "KeyX" ? -1 : 1);
          return;
        }

        const noteOffset: number | undefined = COMPUTER_KEYBOARD_NOTE_OFFSETS.get(
          event.code,
        );
        if (noteOffset === undefined) {
          return;
        }
        event.preventDefault();
        const midiNote: number =
          COMPUTER_KEYBOARD_BASE_MIDI_NOTE +
          noteOffset +
          this.octaveShift * OCTAVE_SEMITONES;
        heldNotes.set(event.code, midiNote);
        target.callbacks.onPress(midiNote, `computer:${event.code}`);
      },
      { signal: target.signal },
    );
    window.addEventListener(
      "keyup",
      (event: KeyboardEvent): void => {
        if (!heldNotes.has(event.code)) {
          return;
        }
        event.preventDefault();
        heldNotes.delete(event.code);
        target.callbacks.onRelease(`computer:${event.code}`);
      },
      { signal: target.signal },
    );
    window.addEventListener("blur", releaseHeldNotes, { signal: target.signal });
    target.signal.addEventListener("abort", releaseHeldNotes, { once: true });
  }

  private shiftOctave(direction: -1 | 1): void {
    this.octaveShift = Math.max(
      MIN_OCTAVE_SHIFT,
      Math.min(MAX_OCTAVE_SHIFT, this.octaveShift + direction),
    );
  }
}
