import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { once } from "node:events";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("the built app plays C4 through C5 at the correct sine frequencies", async () => {
  // Build and serve the same bundled HTML that the browser app uses.
  execFileSync(process.execPath, ["build.mjs"], {
    cwd: projectRoot,
    stdio: "inherit",
  });
  const html = await readFile(resolve(projectRoot, "dist", "index.html"));
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--mute-audio"],
    });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.addInitScript(() => {
      // Observe frequencies sent to real oscillators without needing a microphone.
      window.__scheduledOscillators = [];
      window.__stoppedOscillators = [];
      const NativeAudioContext = window.AudioContext;
      window.AudioContext = class extends NativeAudioContext {
        createOscillator() {
          const oscillator = super.createOscillator();
          let scheduledFrequency;
          const setValueAtTime = oscillator.frequency.setValueAtTime.bind(
            oscillator.frequency,
          );
          oscillator.frequency.setValueAtTime = (value, time) => {
            scheduledFrequency = value;
            window.__scheduledOscillators.push({
              type: oscillator.type,
              frequency: value,
            });
            return setValueAtTime(value, time);
          };
          const stop = oscillator.stop.bind(oscillator);
          oscillator.stop = (...args) => {
            window.__stoppedOscillators.push(scheduledFrequency);
            return stop(...args);
          };
          return oscillator;
        }
      };
    });

    await page.goto(`http://127.0.0.1:${address.port}/`);
    await page.getByRole("heading", { name: "Musical keyboard" }).waitFor();
    assert.equal(await page.locator("#guess-feedback-styles").count(), 1);
    const headerActions = page.locator(".app-header-actions");
    assert.equal(await headerActions.evaluate((element) => getComputedStyle(element).display), "flex");
    assert.equal(
      await headerActions.getByRole("button").count(),
      4,
      "game buttons should sit beside visualization settings in the header",
    );
    const settingsButton = page.getByRole("button", { name: "Visualization settings" });
    const settingsDialog = page.getByRole("dialog", { name: "Visualization settings" });
    assert.equal(await page.locator("#audio-wave-panel").isVisible(), true);
    assert.equal(await page.locator("#played-keys-panel").isVisible(), true);
    assert.equal(await page.locator("#sine-intersection-panel").isVisible(), true);
    assert.equal(await page.locator("#static-intersection-panel").isVisible(), true);
    assert.equal(await page.locator("#intersection-panel").count(), 0);
    const keyboardToolbar = page.locator(".keyboard-toolbar");
    const keyboardSettingsButton = page.getByRole("button", { name: "Keyboard settings" });
    assert.equal(
      await keyboardToolbar.evaluate((element) => getComputedStyle(element).display),
      "flex",
    );
    assert.equal(
      await keyboardSettingsButton.evaluate(
        (button) => button.getBoundingClientRect().top ===
          button.parentElement.querySelector(".envelope-editor").getBoundingClientRect().top,
      ),
      true,
    );
    assert.equal(await keyboardSettingsButton.locator("svg").count(), 1);
    assert.match(
      await page.locator("#static-intersection-explanation").textContent(),
      /Play one or more notes/,
    );
    assert.equal(await settingsDialog.isVisible(), false);
    const keyboardSettingsDialog = page.getByRole("dialog", { name: "Keyboard settings" });
    assert.equal(await keyboardSettingsDialog.isVisible(), false);
    assert.equal(await page.locator("#key-count").isVisible(), false);
    await keyboardSettingsButton.click();
    assert.equal(await keyboardSettingsDialog.isVisible(), true);
    assert.equal(await keyboardSettingsDialog.locator("#key-count").isVisible(), true);
    assert.equal(
      await keyboardSettingsDialog.getByRole("button", { name: "Play chords" }).isVisible(),
      true,
    );
    await keyboardSettingsDialog.getByRole("heading", { name: "Keyboard settings" }).click();
    assert.equal(await keyboardSettingsDialog.isVisible(), true);
    await page.mouse.click(0, 0);
    assert.equal(await keyboardSettingsDialog.isVisible(), false);

    const envelopeDialog = page.getByRole("dialog", { name: "ADSR envelope" });
    assert.equal(await envelopeDialog.isVisible(), false);
    await page.getByRole("button", { name: "Edit envelope" }).click();
    assert.equal(await envelopeDialog.isVisible(), true);
    assert.equal(await envelopeDialog.locator("#envelope-controls").isVisible(), true);
    await envelopeDialog.getByRole("heading", { name: "ADSR envelope" }).click();
    assert.equal(await envelopeDialog.isVisible(), true);
    await page.mouse.click(0, 0);
    assert.equal(await envelopeDialog.isVisible(), false);

    await settingsButton.click();
    assert.equal(await settingsDialog.isVisible(), true);
    await settingsDialog.getByRole("heading", { name: "Visualization settings" }).click();
    assert.equal(await settingsDialog.isVisible(), true);
    await page.mouse.click(0, 0);
    assert.equal(await settingsDialog.isVisible(), false);
    await settingsButton.click();
    assert.equal(await settingsDialog.isVisible(), true);
    const audioWaveCheckbox = settingsDialog.getByRole("checkbox", { name: "Audio wave" });
    const playedKeysCheckbox = settingsDialog.getByRole("checkbox", { name: "Played keys" });
    const sineIntersectionCheckbox = settingsDialog.getByRole("checkbox", {
      name: "Sine intersection",
    });
    const staticIntersectionCheckbox = settingsDialog.getByRole("checkbox", {
      name: "Static intersection",
    });
    assert.equal(await audioWaveCheckbox.isChecked(), true);
    assert.equal(await playedKeysCheckbox.isChecked(), true);
    assert.equal(await sineIntersectionCheckbox.isChecked(), true);
    assert.equal(await staticIntersectionCheckbox.isChecked(), true);
    await audioWaveCheckbox.uncheck();
    assert.equal(await page.locator("#audio-wave-panel").isVisible(), false);
    await audioWaveCheckbox.check();
    assert.equal(await page.locator("#audio-wave-panel").isVisible(), true);
    assert.equal(await page.locator("#played-keys-panel").isVisible(), true);
    const waveformPixel = await page.locator("#audio-wave-canvas").evaluate((canvas) => {
      const context = canvas.getContext("2d");
      return Array.from(context.getImageData(320, 100, 1, 1).data);
    });
    assert.deepEqual(waveformPixel, [40, 120, 208, 255]);
    const visualizationBounds = await page.locator("#audio-wave-panel").evaluate((panel) => {
      const bounds = panel.getBoundingClientRect();
      return { right: bounds.right, top: bounds.top };
    });
    assert.ok(visualizationBounds.right <= await page.evaluate(() => window.innerWidth));
    assert.ok(visualizationBounds.top < 200, "visualization appears at the top of the window");
    await settingsDialog.getByRole("button", { name: "Done" }).click();
    assert.equal(await settingsDialog.isVisible(), false);

    const keyboard = page.locator("main > section").first();
    assert.equal(await keyboard.locator(".piano-key").count(), 88);
    const c3Key = keyboard.getByRole("button", { name: "C3", exact: true });
    const c3Left = await c3Key.evaluate((key) => key.getBoundingClientRect().left);
    const viewportLeft = await keyboard.locator(".keyboard-viewport").evaluate((viewport) => {
      const style = getComputedStyle(viewport);
      return (
        viewport.getBoundingClientRect().left +
        viewport.clientLeft +
        Number.parseFloat(style.paddingLeft)
      );
    });
    assert.ok(Math.abs(c3Left - viewportLeft) < 1, "C3 should start at the viewport's left edge");

    const oscillatorCountBeforeComputerInput = await page.evaluate(
      () => window.__scheduledOscillators.length,
    );
    await page.keyboard.down("a");
    assert.equal(
      await c3Key.evaluate((key) => key.classList.contains("piano-key--pressed")),
      true,
      "A should press and highlight C3",
    );
    const c3Frequency = await page.evaluate(
      () => window.__scheduledOscillators.at(-1)?.frequency,
    );
    assert.ok(
      Math.abs(c3Frequency - 130.8127826502993) < 1e-9,
      `A should play C3 at 130.81 Hz, got ${c3Frequency} Hz`,
    );
    await page.keyboard.up("a");
    assert.equal(
      await c3Key.evaluate((key) => key.classList.contains("piano-key--pressed")),
      false,
      "C3 highlight should clear when A is released",
    );

    await page.keyboard.press("w");
    const cSharpFrequency = await page.evaluate(
      () => window.__scheduledOscillators.at(-1)?.frequency,
    );
    assert.ok(
      Math.abs(cSharpFrequency - 138.59131548843604) < 1e-9,
      `W should play C♯3 at 138.59 Hz, got ${cSharpFrequency} Hz`,
    );

    await page.keyboard.down("x");
    await page.keyboard.press("a");
    await page.keyboard.up("x");
    const lowerOctaveFrequency = await page.evaluate(
      () => window.__scheduledOscillators.at(-1)?.frequency,
    );
    assert.ok(
      Math.abs(lowerOctaveFrequency - 65.40639132514966) < 1e-9,
      `X should shift A down to C2, got ${lowerOctaveFrequency} Hz`,
    );
    await page.keyboard.down("c");
    await page.keyboard.press("a");
    await page.keyboard.up("c");
    const restoredOctaveFrequency = await page.evaluate(
      () => window.__scheduledOscillators.at(-1)?.frequency,
    );
    assert.ok(
      Math.abs(restoredOctaveFrequency - 130.8127826502993) < 1e-9,
      `C should shift A back up to C3, got ${restoredOctaveFrequency} Hz`,
    );
    await page.keyboard.down("c");
    await page.keyboard.press("a");
    await page.keyboard.up("c");
    const upperOctaveFrequency = await page.evaluate(
      () => window.__scheduledOscillators.at(-1)?.frequency,
    );
    assert.ok(
      Math.abs(upperOctaveFrequency - 261.6255653005986) < 1e-9,
      `C should shift A up to C4, got ${upperOctaveFrequency} Hz`,
    );
    await page.keyboard.down("x");
    await page.keyboard.press("a");
    await page.keyboard.up("x");

    const scheduledBeforeFocusedField = await page.evaluate(
      () => window.__scheduledOscillators.length,
    );
    await keyboardSettingsButton.click();
    await page.locator("#key-count").focus();
    await page.keyboard.press("a");
    assert.equal(
      await page.evaluate(() => window.__scheduledOscillators.length),
      scheduledBeforeFocusedField,
      "computer-keyboard notes should not intercept typing in form fields",
    );

    await page.locator("#key-count").blur();
    await keyboardSettingsDialog.getByRole("button", { name: "Update keyboard" }).click();
    assert.equal(await keyboardSettingsDialog.isVisible(), false);
    await page.keyboard.down("a");
    await c3Key.hover();
    await page.mouse.down();
    await page.mouse.up();
    assert.equal(
      await c3Key.evaluate((key) => key.classList.contains("piano-key--pressed")),
      true,
      "releasing the mouse should not release a note still held on the computer keyboard",
    );
    await page.keyboard.up("a");
    assert.equal(
      await c3Key.evaluate((key) => key.classList.contains("piano-key--pressed")),
      false,
      "C3 highlight should clear after the computer key is released",
    );
    assert.ok(
      (await page.evaluate(() => window.__scheduledOscillators.length)) >
        oscillatorCountBeforeComputerInput,
      "computer-keyboard input should reach the audio playback path",
    );

    const notes = [
      ["C4", 261.6255653005986],
      ["C♯4", 277.1826309768721],
      ["D4", 293.6647679174076],
      ["D♯4", 311.1269837220809],
      ["E4", 329.6275569128699],
      ["F4", 349.2282314330039],
      ["F♯4", 369.9944227116344],
      ["G4", 391.99543598174927],
      ["G♯4", 415.3046975799451],
      ["A4", 440],
      ["A♯4", 466.1637615180899],
      ["B4", 493.8833012561241],
      ["C5", 523.2511306011972],
    ];

    const oscillatorCountBeforeMouseInput = await page.evaluate(
      () => window.__scheduledOscillators.length,
    );
    // Playwright clicks invoke the app keyboard's mouse handlers and real playback path.
    for (const [note] of notes) {
      await keyboard.getByRole("button", { name: note, exact: true }).click();
    }

    const captured = await page.evaluate(() => window.__scheduledOscillators);
    const mouseInputOscillators = captured.slice(oscillatorCountBeforeMouseInput);
    // Confirm each UI-triggered voice was a sine at its expected equal-tempered frequency.
    assert.equal(mouseInputOscillators.length, notes.length);
    for (const [index, [note, expectedFrequency]] of notes.entries()) {
      assert.equal(mouseInputOscillators[index].type, "sine", `${note} oscillator type`);
      assert.ok(
        Math.abs(mouseInputOscillators[index].frequency - expectedFrequency) < 1e-9,
        `${note}: expected ${expectedFrequency} Hz, got ${mouseInputOscillators[index].frequency} Hz`,
      );
    }

    const chordButton = page.getByRole("button", { name: "Play chords" });
    const chordDialog = page.getByRole("dialog", { name: "Keyboard playback" });
    await keyboardSettingsButton.click();
    await chordButton.click();
    assert.equal(await chordDialog.isVisible(), true);
    await chordDialog.getByRole("heading", { name: "Keyboard playback" }).click();
    assert.equal(await chordDialog.isVisible(), true);
    await page.mouse.click(0, 0);
    assert.equal(await chordDialog.isVisible(), false);
    await chordButton.click();
    assert.equal(await chordDialog.isVisible(), true);
    const chordSelect = chordDialog.getByRole("combobox", { name: "Play" });
    await chordSelect.selectOption("c-major");
    await chordDialog.getByRole("button", { name: "Done" }).click();
    assert.equal(await chordDialog.isVisible(), false);
    await keyboardSettingsDialog.getByRole("button", { name: "Done" }).click();
    const stoppedBeforeChord = await page.evaluate(
      () => window.__stoppedOscillators.length,
    );
    const chordRootKey = keyboard.getByRole("button", { name: "D4", exact: true });
    await chordRootKey.hover();
    await page.mouse.down();
    for (const note of ["D4", "F♯4", "A4"]) {
      assert.equal(
        await keyboard
          .getByRole("button", { name: note, exact: true })
          .evaluate((key) => key.classList.contains("piano-key--pressed")),
        true,
        `${note} should be highlighted while the chord is held`,
      );
    }
    const chordFrequencies = await page.evaluate(() =>
      window.__scheduledOscillators.slice(-3).map((oscillator) => oscillator.frequency),
    );
    assert.equal(chordFrequencies.length, 3);
    assert.deepEqual(
      chordFrequencies.map((frequency) => Math.round(frequency * 100) / 100),
      [293.66, 369.99, 440],
    );
    await page.waitForFunction(() => {
      const explanation = document.querySelector("#static-intersection-explanation");
      return explanation?.textContent?.includes("D4:") === true &&
        explanation.textContent.includes("F♯4:") &&
        explanation.textContent.includes("A4:");
    });
    const cycleExplanation = await page
      .locator("#static-intersection-explanation")
      .textContent();
    assert.match(cycleExplanation, /Cycle ratio/);
    assert.doesNotMatch(cycleExplanation, /seconds/);
    await page.mouse.up();
    for (const note of ["D4", "F♯4", "A4"]) {
      assert.equal(
        await keyboard
          .getByRole("button", { name: note, exact: true })
          .evaluate((key) => key.classList.contains("piano-key--pressed")),
        false,
        `${note} highlight should clear when the chord is released`,
      );
    }
    const releasedChordVoices = await page.evaluate(() =>
      window.__stoppedOscillators.slice(-3),
    );
    const stoppedAfterChord = await page.evaluate(
      () => window.__stoppedOscillators.length,
    );
    assert.equal(stoppedAfterChord, stoppedBeforeChord + 3);
    assert.deepEqual(
      releasedChordVoices.map((frequency) => Math.round(frequency * 100) / 100),
      [293.66, 369.99, 440],
    );
    assert.equal(await page.locator(".app-controls output").textContent(), "C major triad");

    await keyboardSettingsButton.click();
    await chordButton.click();
    await chordSelect.selectOption("single-note");
    await chordDialog.getByRole("button", { name: "Done" }).click();
    await keyboardSettingsDialog.getByRole("button", { name: "Done" }).click();
    const scheduledBeforeSingleNote = await page.evaluate(
      () => window.__scheduledOscillators.length,
    );
    const stoppedBeforeSingleNote = await page.evaluate(
      () => window.__stoppedOscillators.length,
    );
    await keyboard.getByRole("button", { name: "D4", exact: true }).click();
    const singleNotePlayback = await page.evaluate(() => ({
      frequencies: window.__scheduledOscillators.map((oscillator) => oscillator.frequency),
      stoppedCount: window.__stoppedOscillators.length,
    }));
    assert.equal(singleNotePlayback.frequencies.length, scheduledBeforeSingleNote + 1);
    assert.equal(singleNotePlayback.stoppedCount, stoppedBeforeSingleNote + 1);
    const singleNoteFrequency =
      singleNotePlayback.frequencies[singleNotePlayback.frequencies.length - 1];
    assert.ok(
      Math.abs(singleNoteFrequency - 293.6647679174076) < 1e-9,
      "single-note mode should play only the pressed key",
    );
    assert.equal(await page.locator(".app-controls output").textContent(), "Single note");

    await page.getByRole("button", { name: "Note sequence game" }).click();
    await page.locator("#sequence-note-count").fill("1");
    assert.equal(
      await page.locator(".note-sequence-randomize").evaluate(
        (label) => getComputedStyle(label).alignSelf,
      ),
      "center",
    );
    await page.evaluate(() => {
      Math.random = () => 0;
    });
    await page.getByRole("button", { name: "Start new game" }).click();
    const sequenceFinishButton = page.getByRole("button", { name: "Finish guess" });
    assert.equal(
      await sequenceFinishButton.evaluate((button) => getComputedStyle(button).color),
      "rgb(47, 109, 67)",
    );
    const sequenceGame = page.locator(".note-sequence-view");
    await sequenceGame.getByRole("button", { name: "D4", exact: true }).click();
    await sequenceFinishButton.click();
    const incorrectSequenceGuess = page.locator(
      ".note-sequence-guess .guess-feedback--incorrect",
    );
    assert.equal(await incorrectSequenceGuess.textContent(), "1. D4");
    assert.equal(
      await incorrectSequenceGuess.evaluate((button) => getComputedStyle(button).backgroundColor),
      "rgb(252, 232, 230)",
    );
    await page.getByRole("button", { name: "Reset keys" }).click();
    await sequenceGame.getByRole("button", { name: "C4", exact: true }).click();
    await sequenceFinishButton.click();
    const correctSequenceGuess = page.locator(
      ".note-sequence-guess .guess-feedback--correct",
    );
    assert.equal(await correctSequenceGuess.textContent(), "1. C4");
    assert.equal(
      await correctSequenceGuess.evaluate((button) => getComputedStyle(button).backgroundColor),
      "rgb(230, 244, 234)",
    );
    const confettiEffect = page.locator(".confetti-effect");
    assert.equal(await confettiEffect.count(), 1);
    const firstConfettiPiece = confettiEffect.locator("span").first();
    assert.equal(
      await firstConfettiPiece.evaluate((piece) => getComputedStyle(piece).bottom),
      "0px",
    );
    assert.match(
      await firstConfettiPiece.evaluate(
        (piece) => piece.getAnimations()[0].effect.getKeyframes().at(-1).transform,
      ),
      /translate\([^,]+px, -/,
    );
    assert.equal(await page.locator(".exploding-text-effect").textContent(), "Correct!");

    await page.getByRole("button", { name: "Back to keyboard" }).click();
    await page.getByRole("button", { name: "Chord and notes game" }).click();
    await page.evaluate(() => {
      Math.random = () => 0.999999;
    });
    await page.getByRole("button", { name: "Start new game" }).click();
    const pitchFinishButton = page.getByRole("button", { name: "Finish guess" });
    assert.equal(
      await pitchFinishButton.evaluate((button) => getComputedStyle(button).color),
      "rgb(47, 109, 67)",
    );
    const pitchGame = page.locator(".pitch-game-view--chords");
    for (const note of ["C4", "D4", "E4"]) {
      await pitchGame.getByRole("button", { name: note, exact: true }).click();
    }
    await pitchFinishButton.click();
    const pitchGuesses = page.locator(".pitch-game-guess button");
    assert.deepEqual(
      await pitchGuesses.evaluateAll((buttons) =>
        buttons.map((button) => ({
          text: button.textContent,
          correct: button.classList.contains("guess-feedback--correct"),
          incorrect: button.classList.contains("guess-feedback--incorrect"),
          background: getComputedStyle(button).backgroundColor,
        })),
      ),
      [
        {
          text: "C4",
          correct: true,
          incorrect: false,
          background: "rgb(230, 244, 234)",
        },
        {
          text: "D4",
          correct: true,
          incorrect: false,
          background: "rgb(230, 244, 234)",
        },
        {
          text: "E4",
          correct: false,
          incorrect: true,
          background: "rgb(252, 232, 230)",
        },
      ],
    );
    await page.getByRole("button", { name: "Back to keyboard" }).click();

    const c4Key = keyboard.getByRole("button", { name: "C4", exact: true });
    await c4Key.hover();
    await page.mouse.down();
    await page.waitForTimeout(150);
    const playedKeyPixel = await page.locator("#played-keys-canvas").evaluate((canvas) => {
      const context = canvas.getContext("2d");
      return Array.from(context.getImageData(160, 10, 1, 1).data);
    });
    assert.ok(playedKeyPixel[3] > 0, "currently played keys should be drawn");
    const hasOscillatingWave = await page.locator("#audio-wave-canvas").evaluate((canvas) => {
      const context = canvas.getContext("2d");
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let y = 0; y < canvas.height; y += 1) {
        if (Math.abs(y - canvas.height / 2) <= 3) {
          continue;
        }
        for (let x = 0; x < canvas.width; x += 4) {
          const offset = (y * canvas.width + x) * 4;
          if (pixels[offset] === 40 && pixels[offset + 1] === 120 && pixels[offset + 2] === 208) {
            return true;
          }
        }
      }
      return false;
    });
    assert.equal(hasOscillatingWave, true, "audio wave should update while a note is held");
    await page.mouse.up();

    await settingsButton.click();
    await settingsDialog.getByRole("checkbox", { name: "Audio wave" }).uncheck();
    await settingsDialog.getByRole("button", { name: "Done" }).click();
    await page.getByRole("button", { name: "Edit envelope" }).click();
    await page.locator("#envelope-attack").fill("0.42");
    await page.getByRole("dialog", { name: "ADSR envelope" })
      .getByRole("button", { name: "Done" })
      .click();
    await page.getByRole("button", { name: "Keyboard settings" }).click();
    await page.locator("#sound-source").selectOption("square");
    await page.getByRole("button", { name: "Play chords" }).click();
    const savedChordDialog = page.getByRole("dialog", { name: "Keyboard playback" });
    await savedChordDialog.getByRole("combobox", { name: "Play" }).selectOption("c-major");
    await savedChordDialog.getByRole("button", { name: "Done" }).click();
    await page.locator("#key-count").fill("36");
    await page.locator("#app-volume").fill("55");
    await page.getByRole("button", { name: "Update keyboard" }).click();

    await page.reload();
    assert.equal(await page.locator("#audio-wave-panel").isVisible(), false);
    assert.equal(
      await page.evaluate(
        () => localStorage.getItem("radstr-learning-by-ear.settings") !== null,
      ),
      true,
    );
    assert.equal(await page.locator("#sound-source").inputValue(), "square");
    assert.equal(await page.locator(".app-controls output").textContent(), "C major triad");
    await page.getByRole("button", { name: "Keyboard settings" }).click();
    assert.equal(await page.locator("#key-count").inputValue(), "36");
    assert.equal(await page.locator("#app-volume").inputValue(), "55");
    await page.getByRole("dialog", { name: "Keyboard settings" })
      .getByRole("button", { name: "Done" })
      .click();
    await page.getByRole("button", { name: "Edit envelope" }).click();
    assert.equal(await page.locator("#envelope-attack").inputValue(), "0.42");
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser?.close();
    server.close();
  }
}, { timeout: 60_000 });
