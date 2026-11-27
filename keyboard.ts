const WHITE_PITCH_CLASSES: ReadonlySet<number> = new Set<number>([0, 2, 4, 5, 7, 9, 11]);
const NOTE_NAMES: readonly string[] = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const C3_MIDI_NOTE: number = 48;

export function midiNoteName(midiNote: number): string {
  if (!Number.isInteger(midiNote) || midiNote < 0) {
    throw new RangeError("The MIDI note must be a non-negative integer.");
  }
  const noteNameBase: string | undefined = NOTE_NAMES[midiNote % 12];
  if (noteNameBase === undefined) {
    throw new RangeError(`Unsupported pitch class: ${midiNote % 12}`);
  }
  return `${noteNameBase}${Math.floor(midiNote / 12) - 1}`;
}

export interface KeyboardCallbacks {
  readonly onPress: (midiNote: number) => void;
  readonly onRelease: (midiNote: number) => void;
  readonly onHover: (midiNote: number, noteName: string) => void;
  readonly onLeave: () => void;
}

const KEYBOARD_EVENT_CONTROLLERS: WeakMap<HTMLElement, AbortController> = new WeakMap<
  HTMLElement,
  AbortController
>();

export function renderKeyboard(
  container: HTMLElement,
  keyCount: number,
  callbacks: KeyboardCallbacks,
  firstMidiNote: number = 21,
): void {
  if (!Number.isInteger(keyCount) || keyCount < 1) {
    throw new RangeError("The keyboard must contain at least one key.");
  }
  if (!Number.isInteger(firstMidiNote) || firstMidiNote < 0) {
    throw new RangeError("The first MIDI note must be a non-negative integer.");
  }

  const midiNotes: number[] = Array.from(
    { length: keyCount },
    (_: undefined, index: number): number => firstMidiNote + index,
  );
  const whiteKeyCount: number = midiNotes.filter(
    (note: number): boolean => WHITE_PITCH_CLASSES.has(note % 12),
  ).length;
  const layoutWhiteKeyCount: number = Math.max(whiteKeyCount, 1);
  const whiteKeyWidth: number = 100 / layoutWhiteKeyCount;
  const blackKeyWidth: number = whiteKeyWidth * 0.62;

  const styleId: string = "piano-keyboard-styles";
  if (!document.getElementById(styleId)) {
    const styles: HTMLStyleElement = document.createElement("style");
    styles.id = styleId;
    styles.textContent = `
      .piano-keyboard {
        height: 190px;
        position: relative;
      }
      .piano-key {
        align-items: flex-end;
        border: 1px solid #252525;
        border-radius: 0 0 4px 4px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        overflow: hidden;
        padding: 0 1px 7px;
        position: absolute;
        top: 0;
        white-space: nowrap;
      }
      .piano-key:focus-visible {
        outline: 3px solid #2878d0;
        outline-offset: -3px;
        z-index: 3;
      }
      .piano-key--white {
        background: #fff;
        color: #202124;
        height: 100%;
        z-index: 1;
      }
      .piano-key--black {
        background: #202124;
        color: #fff;
        font-size: 0.75rem;
        height: 62%;
        z-index: 2;
      }
      .piano-key--black:focus-visible {
        z-index: 4;
      }
      .piano-key--pressed {
        background: #e53935;
        color: #fff;
      }
    `;
    document.head.append(styles);
  }

  const viewport: HTMLDivElement = document.createElement("div");
  KEYBOARD_EVENT_CONTROLLERS.get(container)?.abort();
  const eventController: AbortController = new AbortController();
  KEYBOARD_EVENT_CONTROLLERS.set(container, eventController);
  viewport.className = "keyboard-viewport";

  const keyboard: HTMLDivElement = document.createElement("div");
  keyboard.className = "piano-keyboard";
  keyboard.setAttribute("role", "group");
  keyboard.setAttribute("aria-label", "Musical keyboard");
  keyboard.style.width = `max(100%, ${layoutWhiteKeyCount * 42}px)`;

  const pressedKeys: Map<HTMLButtonElement, number> = new Map<HTMLButtonElement, number>();
  const releasePressedKeys = (): void => {
    for (const [pressedKey, midiNote] of pressedKeys) {
      pressedKey.classList.remove("piano-key--pressed");
      callbacks.onRelease(midiNote);
    }
    pressedKeys.clear();
  };
  document.addEventListener("mouseup", releasePressedKeys, {
    signal: eventController.signal,
  });
  window.addEventListener("blur", releasePressedKeys, {
    signal: eventController.signal,
  });

  let whiteKeyIndex: number = 0;
  for (const midiNote of midiNotes) {
    const pitchClass: number = midiNote % 12;
    const isWhiteKey: boolean = WHITE_PITCH_CLASSES.has(pitchClass);
    const noteName: string = midiNoteName(midiNote);
    const key: HTMLButtonElement = document.createElement("button");
    key.type = "button";
    key.className = `piano-key ${isWhiteKey ? "piano-key--white" : "piano-key--black"}`;
    key.textContent = noteName;
    key.setAttribute("aria-label", noteName);

    if (isWhiteKey) {
      key.style.left = `${whiteKeyIndex * whiteKeyWidth}%`;
      key.style.width = `${whiteKeyWidth}%`;
      whiteKeyIndex += 1;
    } else {
      key.style.left = `${Math.max(0, whiteKeyIndex * whiteKeyWidth - blackKeyWidth / 2)}%`;
      key.style.width = `${blackKeyWidth}%`;
    }

    key.addEventListener("mousedown", (event: MouseEvent): void => {
      if (event.button !== 0 || pressedKeys.has(key)) {
        return;
      }
      event.preventDefault();
      pressedKeys.set(key, midiNote);
      key.classList.add("piano-key--pressed");
      callbacks.onPress(midiNote);
    });
    key.addEventListener("mouseenter", (_event: MouseEvent): void => {
      if (_event.buttons === 1) {
        const pressedEntry: [HTMLButtonElement, number] | undefined =
          Array.from(pressedKeys.entries()).find(([_pressedKey]: [HTMLButtonElement, number]) =>
            _pressedKey !== key,
          );
        if (pressedEntry) {
          const [pressedKey, pressedMidiNote]: [HTMLButtonElement, number] = pressedEntry;
          pressedKeys.delete(pressedKey);
          pressedKey.classList.remove("piano-key--pressed");
          callbacks.onPress(midiNote);
          pressedKeys.set(key, midiNote);
          key.classList.add("piano-key--pressed");
          callbacks.onRelease(pressedMidiNote);
          callbacks.onHover(midiNote, noteName);
          return;
        }
      }
      callbacks.onHover(midiNote, noteName);
    });
    key.addEventListener("mouseleave", (_event: MouseEvent): void => {
      if (pressedKeys.size === 0) {
        callbacks.onLeave();
      }
    });

    keyboard.append(key);
  }

  viewport.append(keyboard);
  container.replaceChildren(viewport);
  const c3Key: HTMLButtonElement | null =
    keyboard.querySelector<HTMLButtonElement>(`[aria-label="${midiNoteName(C3_MIDI_NOTE)}"]`);
  if (c3Key) {
    viewport.scrollLeft = c3Key.offsetLeft;
  }
}
