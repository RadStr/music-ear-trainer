import type { KeyboardInput, KeyboardInputTarget } from "../keyboard-input";

const MOUSE_INPUT_ID: string = "mouse";

export class MouseKeyboardInput implements KeyboardInput {
  /**
   * Connects mouse press, drag, release, and hover events to the rendered keys.
   * @param target The keyboard element, key buttons, callbacks, and listener lifetime.
   */
  connect(target: KeyboardInputTarget): void {
    let activeMidiNote: number | undefined;

    const pressNote = (midiNote: number): void => {
      if (activeMidiNote === midiNote) {
        return;
      }
      if (activeMidiNote !== undefined) {
        target.callbacks.onRelease(MOUSE_INPUT_ID);
      }
      activeMidiNote = midiNote;
      target.callbacks.onPress(midiNote, MOUSE_INPUT_ID);
    };
    const releaseNote = (): void => {
      if (activeMidiNote === undefined) {
        return;
      }
      activeMidiNote = undefined;
      target.callbacks.onRelease(MOUSE_INPUT_ID);
    };

    for (const [midiNote, key] of target.keysByMidiNote) {
      key.addEventListener(
        "mousedown",
        (event: MouseEvent): void => {
          if (event.button !== 0 || activeMidiNote !== undefined) {
            return;
          }
          event.preventDefault();
          pressNote(midiNote);
        },
        { signal: target.signal },
      );
      key.addEventListener(
        "mouseenter",
        (event: MouseEvent): void => {
          if (event.buttons === 1) {
            pressNote(midiNote);
          }
          target.callbacks.onHover(midiNote);
        },
        { signal: target.signal },
      );
      key.addEventListener(
        "mouseleave",
        (): void => {
          if (activeMidiNote === undefined) {
            target.callbacks.onLeave();
          }
        },
        { signal: target.signal },
      );
    }

    window.addEventListener("mouseup", releaseNote, { signal: target.signal });
    window.addEventListener("blur", releaseNote, { signal: target.signal });
    target.signal.addEventListener("abort", releaseNote, { once: true });
  }
}
