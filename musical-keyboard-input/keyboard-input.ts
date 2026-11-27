export interface KeyboardInputCallbacks {
  readonly onPress: (midiNote: number, inputId: string) => void;
  readonly onRelease: (inputId: string) => void;
  readonly onHover: (midiNote: number) => void;
  readonly onLeave: () => void;
}

export interface KeyboardInputTarget {
  readonly keyboard: HTMLElement;
  readonly keysByMidiNote: ReadonlyMap<number, HTMLButtonElement>;
  readonly callbacks: KeyboardInputCallbacks;
  readonly signal: AbortSignal;
}

export interface KeyboardInput {
  connect(target: KeyboardInputTarget): void;
}
