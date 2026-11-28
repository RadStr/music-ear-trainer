import {
  getCurrentAudioWave,
  playAudio,
  prepareAudioContext,
  setMasterVolume,
} from "../audio/play";
import { playSawtooth } from "../audio/playSawtooth";
import { playSine } from "../audio/playSine";
import { playSquare } from "../audio/playSquare";
import type { Envelope, PlayMethod, PlayingAudio } from "../audio/types";
import { AudioWaveVisualization } from "../audio-visualization/audio-wave/audio-wave-visualization";
import { SineIntersectionVisualization } from "../audio-visualization/sine-intersection/sine-intersection-visualization";
import { StaticIntersectionVisualization } from "../audio-visualization/static-intersection/static-intersection-visualization";
import { PlayedKeysVisualization } from "../audio-visualization/played-keys/played-keys-visualization";
import { CHORDS, NOTE_PITCH_CLASSES } from "../games/pitchGameData";
import {
  DEFAULT_APP_SETTINGS,
  isAudioSource,
  isKeyboardPlaybackSelection,
  type AppSettings,
  type KeyboardPlaybackSelection,
  type SettingsStorage,
} from "../settings/settings-storage";
import { ComputerKeyboardInput } from "../musical-keyboard-input/computer-keyboard/computer-keyboard-input";
import { MouseKeyboardInput } from "../musical-keyboard-input/mouse/mouse-keyboard-input";
import type { KeyboardInput } from "../musical-keyboard-input/keyboard-input";
import type { AppView } from "../views/appView";
import { renderKeyboard } from "../keyboard";
import { CustomAudioController } from "./customAudioController";
import { EnvelopeController } from "./envelopeController";
import { META_INSTRUMENTS, MetaAudioController } from "./metaAudioController";

type ChordSelection = KeyboardPlaybackSelection;

interface VisualizationControl {
  readonly checkbox: HTMLInputElement;
  readonly panel: HTMLElement;
  readonly draw: (playedNotes: readonly number[], audioWave: Float32Array) => void;
}

export class AppController {
  private readonly view: AppView;
  private readonly envelopeController: EnvelopeController;
  private readonly settingsStorage: SettingsStorage;
  private settings: AppSettings;
  private readonly metaAudioController: MetaAudioController;
  private readonly customAudioController: CustomAudioController;
  private readonly activeVoices: Map<string, PlayingAudio> = new Map<string, PlayingAudio>();
  private readonly activeNoteCounts: Map<number, number> = new Map<number, number>();
  private readonly keyboardInputs: readonly KeyboardInput[] = [
    new MouseKeyboardInput(),
    new ComputerKeyboardInput(),
  ];
  private readonly audioWaveVisualization: AudioWaveVisualization;
  private readonly playedKeysVisualization: PlayedKeysVisualization;
  private readonly sineIntersectionVisualization: SineIntersectionVisualization;
  private readonly staticIntersectionVisualization: StaticIntersectionVisualization;
  private readonly visualizations: readonly VisualizationControl[];
  private visualizationFrame: number | undefined;
  private selectedSource: AppSettings["keyboard"]["audioSource"] = "sine";
  private selectedChordId: ChordSelection = "single-note";

  /**
   * Creates the app controller and wires keyboard, source, volume, and lifecycle controls.
   * @param view The application view receiving user interaction.
   * @param envelopeController Provides the active synthesis envelope.
   * @param metaAudioController Resolves bundled Meta instrument samples.
   * @param customAudioController Resolves user-provided custom samples.
   * @param settingsStorage Loads and stores the application's persisted settings.
   * @param initialSettings Previously saved application settings, when available.
   */
  constructor(
    view: AppView,
    envelopeController: EnvelopeController,
    metaAudioController: MetaAudioController,
    customAudioController: CustomAudioController,
    settingsStorage: SettingsStorage,
    initialSettings: AppSettings | undefined = undefined,
  ) {
    this.view = view;
    this.envelopeController = envelopeController;
    this.metaAudioController = metaAudioController;
    this.customAudioController = customAudioController;
    this.settingsStorage = settingsStorage;
    this.settings = initialSettings ?? DEFAULT_APP_SETTINGS;
    this.applySettings();
    this.envelopeController.setChangeHandler((envelope: Envelope | undefined): void => {
      if (envelope) {
        this.settings = { ...this.settings, envelope };
        this.settingsStorage.storeSettings(this.settings);
      }
    });
    this.audioWaveVisualization = new AudioWaveVisualization(this.view.audioWaveCanvas);
    this.playedKeysVisualization = new PlayedKeysVisualization(this.view.playedKeysCanvas);
    this.sineIntersectionVisualization = new SineIntersectionVisualization(
      this.view.sineIntersectionCanvas,
    );
    this.staticIntersectionVisualization = new StaticIntersectionVisualization(
      this.view.staticIntersectionCanvas,
      this.view.staticIntersectionExplanation,
    );
    this.visualizations = [
      {
        checkbox: this.view.audioWaveCheckbox,
        panel: this.view.audioWavePanel,
        draw: (playedNotes: readonly number[], audioWave: Float32Array): void => {
          this.audioWaveVisualization.draw(playedNotes, audioWave);
        },
      },
      {
        checkbox: this.view.playedKeysCheckbox,
        panel: this.view.playedKeysPanel,
        draw: (playedNotes: readonly number[], audioWave: Float32Array): void => {
          this.playedKeysVisualization.draw(playedNotes, audioWave);
        },
      },
      {
        checkbox: this.view.sineIntersectionCheckbox,
        panel: this.view.sineIntersectionPanel,
        draw: (playedNotes: readonly number[], audioWave: Float32Array): void => {
          this.sineIntersectionVisualization.draw(playedNotes, audioWave);
        },
      },
      {
        checkbox: this.view.staticIntersectionCheckbox,
        panel: this.view.staticIntersectionPanel,
        draw: (playedNotes: readonly number[], audioWave: Float32Array): void => {
          this.staticIntersectionVisualization.draw(playedNotes, audioWave);
        },
      },
    ];

    this.view.volumeInput.addEventListener("input", (_event: Event): void => {
      this.view.volumeOutput.textContent = `${this.view.volumeInput.value}%`;
      setMasterVolume(this.view.volumeInput.valueAsNumber / 100);
      this.persistSettings();
    });
    setMasterVolume(this.view.volumeInput.valueAsNumber / 100);
    this.view.sourceSelect.addEventListener("change", (_event: Event): void => {
      const source: string = this.view.sourceSelect.value;
      if (!isAudioSource(source)) {
        throw new Error(`Unsupported sound source: ${source}`);
      }
      this.selectedSource = source;
      this.updateSoundSourceUI();
      this.persistSettings();
    });
    for (const button of this.view.metaAudioButtons) {
      button.addEventListener("click", (_event: MouseEvent): void => {
        if (!isAudioSource(button.value)) {
          throw new Error(`Unsupported sound source: ${button.value}`);
        }
        this.selectedSource = button.value;
        this.updateSoundSourceUI();
        this.persistSettings();
      });
    }
    this.view.customSourceButton.addEventListener("click", (_event: MouseEvent): void => {
      this.selectedSource = "custom";
      this.updateSoundSourceUI();
      this.persistSettings();
    });
    this.view.loadCustomSamplesButton.addEventListener("click", (_event: MouseEvent): void => {
      this.loadCustomSamples();
    });
    for (const visualization of this.visualizations) {
      visualization.checkbox.addEventListener("change", (): void => {
        this.updateVisualizations();
        this.persistSettings();
      });
    }

    this.view.form.addEventListener("submit", (event: SubmitEvent): void => {
      event.preventDefault();
      if (this.renderSelectedKeyboard()) {
        this.persistSettings();
        this.view.keyboardSettingsDialog.close();
      }
    });
    this.view.chordDialog.addEventListener("close", (): void => {
      if (this.view.chordDialog.returnValue !== "apply") {
        this.view.chordSelect.value = this.selectedChordId;
        return;
      }
      const selectedChordId: string = this.view.chordSelect.value;
      if (!isKeyboardPlaybackSelection(selectedChordId)) {
        throw new Error(`Unsupported keyboard playback selection: ${selectedChordId}`);
      }
      const selectedOption: HTMLOptionElement | null =
        this.view.chordSelect.selectedOptions.item(0);
      if (!selectedOption) {
        throw new Error("The selected keyboard playback option is missing.");
      }
      this.selectedChordId = selectedChordId;
      this.view.chordModeOutput.textContent = selectedOption.textContent;
      this.persistSettings();
    });
    window.addEventListener("blur", (): void => this.releaseAllVoices());

    this.renderSelectedKeyboard();
    this.updateSoundSourceUI();
    this.updateVisualizations();
  }

  private applySettings(): void {
    this.view.audioWaveCheckbox.checked = this.settings.visualizations.audioWave;
    this.view.playedKeysCheckbox.checked = this.settings.visualizations.playedKeys;
    this.view.sineIntersectionCheckbox.checked =
      this.settings.visualizations.sineIntersection;
    this.view.staticIntersectionCheckbox.checked =
      this.settings.visualizations.staticIntersection;
    this.view.keyCountInput.value = String(this.settings.keyboard.keyCount);
    this.view.chordSelect.value = this.settings.keyboard.playbackSelection;
    this.selectedChordId = this.settings.keyboard.playbackSelection;
    const selectedOption: HTMLOptionElement | null =
      this.view.chordSelect.selectedOptions.item(0);
    if (!selectedOption) {
      throw new Error("The saved keyboard playback option is missing.");
    }
    this.view.chordModeOutput.textContent = selectedOption.textContent;
    this.view.volumeInput.value = String(this.settings.volume);
    this.view.volumeOutput.textContent = `${this.settings.volume}%`;
    this.view.customSampleUrlInput.value =
      this.settings.keyboard.customSampleDirectoryUrl;
    const savedSource: AppSettings["keyboard"]["audioSource"] =
      this.settings.keyboard.audioSource;
    this.selectedSource =
      savedSource === "custom" &&
      this.settings.keyboard.customSampleDirectoryUrl.length === 0
        ? "sine"
        : savedSource;
    this.view.sourceSelect.value =
      this.selectedSource === "sine" ||
      this.selectedSource === "square" ||
      this.selectedSource === "sawtooth"
        ? this.selectedSource
        : "sine";
    if (this.selectedSource === "custom") {
      try {
        this.customAudioController.setDirectoryUrl(
          this.settings.keyboard.customSampleDirectoryUrl,
        );
      } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : String(error);
        console.error("Unable to restore the saved custom sample directory.", error);
        this.view.soundStatus.textContent =
          `Unable to restore sample directory: ${message}`;
        this.selectedSource = "sine";
      }
    }
  }

  private persistSettings(): void {
    const keyCount: number = this.view.keyCountInput.valueAsNumber;
    const keyboardSettings =
      Number.isInteger(keyCount) && keyCount >= 1 && keyCount <= 88
        ? { ...this.settings.keyboard, keyCount }
        : this.settings.keyboard;
    this.settings = {
      ...this.settings,
      visualizations: {
        audioWave: this.view.audioWaveCheckbox.checked,
        playedKeys: this.view.playedKeysCheckbox.checked,
        sineIntersection: this.view.sineIntersectionCheckbox.checked,
        staticIntersection: this.view.staticIntersectionCheckbox.checked,
      },
      keyboard: {
        ...keyboardSettings,
        playbackSelection: this.selectedChordId,
        audioSource: this.selectedSource,
      },
      volume: this.view.volumeInput.valueAsNumber,
    };
    this.settingsStorage.storeSettings(this.settings);
  }

  /**
   * Starts a waveform or sample voice for a MIDI note.
   * @param midiNote The MIDI note to play.
   * @param envelope The envelope applied to the voice.
   * @returns A playing voice that can be released or observed for readiness.
   */
  playNote(midiNote: number, envelope: Envelope): PlayingAudio {
    const source: string = this.selectedSource;
    let playingAudio: PlayingAudio;
    if (source === "sine" || source === "square" || source === "sawtooth") {
      playingAudio = playAudio(
        this.getWaveformPlayMethod(source),
        this.midiToFrequency(midiNote),
        envelope,
      );
    } else {
      const context: AudioContext = prepareAudioContext();
      let released: boolean = false;
      let voice: PlayingAudio | undefined;
      const ready: Promise<void> = this.getSamplePlayMethod(source, midiNote, context).then(
        (playMethod: PlayMethod): void => {
          if (released) {
            return;
          }
          voice = playAudio(playMethod, this.midiToFrequency(midiNote), envelope);
        },
      );
      void ready.catch((error: unknown): void => {
        const message: string = error instanceof Error ? error.message : String(error);
        this.view.soundStatus.textContent = `Audio sample error: ${message}`;
        console.error("Unable to play the selected sample.", error);
      });

      playingAudio = {
        ready,
        release: (): void => {
          released = true;
          voice?.release();
        },
      };
    }

    return this.trackActiveNote(midiNote, playingAudio);
  }

  private trackActiveNote(midiNote: number, voice: PlayingAudio): PlayingAudio {
    const activeCount: number = this.activeNoteCounts.get(midiNote) ?? 0;
    this.activeNoteCounts.set(midiNote, activeCount + 1);
    let released: boolean = false;
    return {
      ready: voice.ready,
      release: (): void => {
        if (released) {
          return;
        }
        released = true;
        try {
          voice.release();
        } finally {
          const currentCount: number = this.activeNoteCounts.get(midiNote) ?? 0;
          if (currentCount <= 1) {
            this.activeNoteCounts.delete(midiNote);
          } else {
            this.activeNoteCounts.set(midiNote, currentCount - 1);
          }
        }
      },
    };
  }

  private updateVisualizations(): void {
    let hasEnabledVisualization: boolean = false;
    for (const visualization of this.visualizations) {
      const isEnabled: boolean = visualization.checkbox.checked;
      visualization.panel.hidden = !isEnabled;
      hasEnabledVisualization = hasEnabledVisualization || isEnabled;
    }
    if (!hasEnabledVisualization) {
      if (this.visualizationFrame !== undefined) {
        window.cancelAnimationFrame(this.visualizationFrame);
        this.visualizationFrame = undefined;
      }
      return;
    }
    if (this.visualizationFrame === undefined) {
      this.drawVisualizations();
    }
  }

  private drawVisualizations(): void {
    this.visualizationFrame = undefined;
    const playedNotes: readonly number[] = Array.from(this.activeNoteCounts.keys());
    const audioWave: Float32Array = getCurrentAudioWave();
    let hasEnabledVisualization: boolean = false;
    for (const visualization of this.visualizations) {
      if (!visualization.checkbox.checked) {
        continue;
      }
      visualization.draw(playedNotes, audioWave);
      hasEnabledVisualization = true;
    }

    if (!hasEnabledVisualization) {
      return;
    }
    this.visualizationFrame = window.requestAnimationFrame((): void => {
      this.drawVisualizations();
    });
  }

  /**
   * Validates the selected key count and connects keyboard input to playback.
   * The keyboard's callbacks play and release the selected single note or chord.
   * @returns Whether the keyboard was successfully rendered.
   */
  private renderSelectedKeyboard(): boolean {
    const keyCount: number = this.view.keyCountInput.valueAsNumber;
    if (!Number.isInteger(keyCount) || keyCount < 1 || keyCount > 88) {
      this.view.keyCountInput.setCustomValidity("Enter a whole number from 1 to 88.");
      this.view.keyCountInput.reportValidity();
      return false;
    }

    this.view.keyCountInput.setCustomValidity("");
    renderKeyboard(this.view.keyboardContainer, keyCount, {
      onPress: (midiNote: number, inputId: string): void => {
        const envelope: Envelope | undefined = this.envelopeController.getEnvelope();
        if (!envelope) {
          return;
        }
        this.activeVoices.get(inputId)?.release();
        const voice: PlayingAudio = this.playNotes(
          this.getSelectedChordNotes(midiNote),
          envelope,
        );
        this.activeVoices.set(inputId, voice);
      },
      onRelease: (_midiNote: number, inputId: string): void =>
        this.releaseVoice(inputId),
      getPlayedNotes: (midiNote: number): readonly number[] =>
        this.getSelectedChordNotes(midiNote),
      onHover: (midiNote: number, noteName: string): void => {
        const frequency: number = this.midiToFrequency(midiNote);
        this.view.frequencyOutput.textContent = `${noteName} — ${frequency.toFixed(2)} Hz`;
      },
      onLeave: (): void => {
        this.view.frequencyOutput.textContent = "Hover over a key to see its frequency.";
      },
    }, 21, this.keyboardInputs);
    return true;
  }

  private getSelectedChordIntervals(): readonly number[] {
    if (this.selectedChordId === "single-note") {
      return [0];
    }
    const chord = CHORDS.find(
      (candidate): boolean => candidate.id === this.selectedChordId,
    );
    if (!chord) {
      throw new Error(`Unsupported keyboard chord: ${this.selectedChordId}`);
    }
    const rootName: string | undefined = chord.notes[0];
    const rootPitchClass: number | undefined =
      rootName === undefined ? undefined : NOTE_PITCH_CLASSES[rootName];
    if (rootPitchClass === undefined) {
      throw new Error(`Unsupported root note in ${chord.name}.`);
    }
    return chord.notes.map((note: string): number => {
      const pitchClass: number | undefined = NOTE_PITCH_CLASSES[note];
      if (pitchClass === undefined) {
        throw new Error(`Unsupported note in ${chord.name}: ${note}`);
      }
      return (pitchClass - rootPitchClass + 12) % 12;
    });
  }

  private getSelectedChordNotes(rootMidiNote: number): readonly number[] {
    return this.getSelectedChordIntervals().map(
      (interval: number): number => rootMidiNote + interval,
    );
  }

  private playNotes(midiNotes: readonly number[], envelope: Envelope): PlayingAudio {
    const voices: PlayingAudio[] = midiNotes.map(
      (midiNote: number): PlayingAudio => this.playNote(midiNote, envelope),
    );
    return {
      ready: Promise.allSettled(
        voices.map((voice: PlayingAudio): Promise<void> => voice.ready),
      ).then((): void => undefined),
      release: (): void => {
        for (const voice of voices) {
          voice.release();
        }
      },
    };
  }

  private midiToFrequency(midiNote: number): number {
    return 440 * 2 ** ((midiNote - 69) / 12);
  }

  private getWaveformPlayMethod(source: string): PlayMethod {
    switch (source) {
      case "sine":
        return playSine;
      case "square":
        return playSquare;
      case "sawtooth":
        return playSawtooth;
      default:
        throw new Error(`Unsupported waveform: ${source}`);
    }
  }

  private getSamplePlayMethod(
    source: string,
    midiNote: number,
    context: AudioContext,
  ): Promise<PlayMethod> {
    if (source.startsWith("meta-")) {
      return this.metaAudioController.getPlayMethod(source, midiNote, context);
    }
    if (source === "custom") {
      return this.customAudioController.getPlayMethod(midiNote, context);
    }
    return Promise.reject(new Error(`Unsupported sound source: ${source}`));
  }

  private updateSoundSourceUI(): void {
    const source: string = this.selectedSource;
    this.view.customSamplePanel.hidden = source !== "custom";
    for (const button of this.view.metaAudioButtons) {
      button.setAttribute("aria-pressed", String(button.value === source));
    }
    this.view.customSourceButton.setAttribute(
      "aria-pressed",
      String(source === "custom"),
    );
    if (source === "custom") {
      this.view.soundStatus.textContent =
        "Use a directory containing files named 1.wav through 88.wav (OGG, MP3, and other common formats are also checked).";
    } else if (source.startsWith("meta-")) {
      const instrument = META_INSTRUMENTS.find(
        (candidate): boolean => candidate.id === source,
      );
      this.view.soundStatus.textContent =
        `Meta audio — ${instrument?.label ?? "instrument"}: samples load on demand from the CC0 library.`;
    } else {
      this.view.soundStatus.textContent = `Using the ${source} waveform.`;
    }
  }

  private loadCustomSamples(): void {
    try {
      const directoryUrl: string = this.customAudioController.setDirectoryUrl(
        this.view.customSampleUrlInput.value,
      );
      this.view.customSampleUrlInput.setCustomValidity("");
      this.settings = {
        ...this.settings,
        keyboard: {
          ...this.settings.keyboard,
          customSampleDirectoryUrl: directoryUrl,
        },
      };
      this.view.soundStatus.textContent =
        `Custom sample directory ready: ${directoryUrl} Samples load when played.`;
      this.persistSettings();
    } catch (error: unknown) {
      const message: string = error instanceof Error ? error.message : String(error);
      this.view.customSampleUrlInput.setCustomValidity(message);
      this.view.customSampleUrlInput.reportValidity();
      this.view.soundStatus.textContent = `Unable to use sample directory: ${message}`;
    }
  }

  private releaseVoice(inputId: string): void {
    this.activeVoices.get(inputId)?.release();
    this.activeVoices.delete(inputId);
  }

  private releaseAllVoices(): void {
    for (const voice of this.activeVoices.values()) {
      voice.release();
    }
    this.activeVoices.clear();
  }
}
