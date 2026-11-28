import type { Envelope } from "./audio/types";
import { DEFAULT_ENVELOPE } from "./audio/types";
import { AppController } from "./controllers/appController";
import { CustomAudioController } from "./controllers/customAudioController";
import { EnvelopeController } from "./controllers/envelopeController";
import { MetaAudioController } from "./controllers/metaAudioController";
import { PitchIdentificationController } from "./games/pitchIdentificationController";
import { CHORDS, SCALES } from "./games/pitchGameData";
import { createPitchIdentificationView } from "./games/pitchIdentificationView";
import { NoteSequenceController } from "./games/noteSequenceController";
import { createNoteSequenceView } from "./games/noteSequenceView";
import type { SettingsStorage } from "./model/settings-storage";
import { LocalStorageSettingsStorage } from "./model/local-storage-settings-storage";
import type { AppView } from "./views/appView";
import { createAppView } from "./views/appView";
import { createEnvelopeView, type EnvelopeView } from "./views/envelopeView";
import { installLocalization } from "./localization";
import { DEFAULT_LOCALE, isLocale } from "./settings/language-settings";

const settingsStorage: SettingsStorage = new LocalStorageSettingsStorage();
const settings = settingsStorage.loadSettings();
const locale = settings?.locale ?? DEFAULT_LOCALE;
installLocalization(locale);
const envelopeView: EnvelopeView = createEnvelopeView();
const envelopeController: EnvelopeController = new EnvelopeController(
  envelopeView,
  settings?.envelope ?? DEFAULT_ENVELOPE,
);
const appView: AppView = createAppView(envelopeView, locale);
const noteSequenceView = createNoteSequenceView();
const chordGameView = createPitchIdentificationView(
  "chords",
  "Chord and notes guessing",
  "Choose a mode: identify a chord name, click the chord notes in any order, or identify three random notes.",
  CHORDS,
);
const scaleGameView = createPitchIdentificationView(
  "scales",
  "Scale guessing",
  "Choose a mode: identify the scale name or click each scale note on the keyboard in order.",
  SCALES,
);
appView.element.append(noteSequenceView.element);
appView.element.append(chordGameView.element, scaleGameView.element);

const appController = new AppController(
  appView,
  envelopeController,
  new MetaAudioController(),
  new CustomAudioController(),
  settingsStorage,
  settings,
);
appView.languageSelect.addEventListener("change", (): void => {
  const locale: string = appView.languageSelect.value;
  if (!isLocale(locale)) {
    throw new Error(`Unsupported language selection: ${locale}`);
  }
  appController.setLocale(locale);
  window.location.reload();
});
const noteSequenceController = new NoteSequenceController(
  noteSequenceView,
  (midiNote: number, envelope: Envelope) => appController.playNote(midiNote, envelope),
);
const chordGameController = new PitchIdentificationController(
  chordGameView,
  "chords",
  CHORDS,
  (midiNote: number, envelope: Envelope) => appController.playNote(midiNote, envelope),
);
const scaleGameController = new PitchIdentificationController(
  scaleGameView,
  "scales",
  SCALES,
  (midiNote: number, envelope: Envelope) => appController.playNote(midiNote, envelope),
);

/** Ends any active game and shows only the selected game screen. */
const showGame = (gameView: HTMLElement): void => {
  noteSequenceController.resetGame();
  chordGameController.resetGame();
  scaleGameController.resetGame();
  appView.keyboardScreen.hidden = true;
  noteSequenceView.element.hidden = true;
  chordGameView.element.hidden = true;
  scaleGameView.element.hidden = true;
  gameView.hidden = false;
};

appView.gameButton.addEventListener("click", (): void => showGame(noteSequenceView.element));
appView.chordGameButton.addEventListener("click", (): void => showGame(chordGameView.element));
appView.scaleGameButton.addEventListener("click", (): void => showGame(scaleGameView.element));

/** Resets active games and returns the application to the keyboard screen. */
const returnToKeyboard = (): void => {
  noteSequenceController.resetGame();
  chordGameController.resetGame();
  scaleGameController.resetGame();
  noteSequenceView.element.hidden = true;
  chordGameView.element.hidden = true;
  scaleGameView.element.hidden = true;
  appView.keyboardScreen.hidden = false;
};

noteSequenceView.backButton.addEventListener("click", returnToKeyboard);
chordGameView.backButton.addEventListener("click", returnToKeyboard);
scaleGameView.backButton.addEventListener("click", returnToKeyboard);
