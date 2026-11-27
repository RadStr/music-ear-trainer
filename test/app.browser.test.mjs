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
      const NativeAudioContext = window.AudioContext;
      window.AudioContext = class extends NativeAudioContext {
        createOscillator() {
          const oscillator = super.createOscillator();
          const setValueAtTime = oscillator.frequency.setValueAtTime.bind(
            oscillator.frequency,
          );
          oscillator.frequency.setValueAtTime = (value, time) => {
            window.__scheduledOscillators.push({
              type: oscillator.type,
              frequency: value,
            });
            return setValueAtTime(value, time);
          };
          return oscillator;
        }
      };
    });

    await page.goto(`http://127.0.0.1:${address.port}/`);
    await page.getByRole("heading", { name: "Musical keyboard" }).waitFor();
    const settingsButton = page.getByRole("button", { name: "Visualization settings" });
    const settingsDialog = page.getByRole("dialog", { name: "Visualization settings" });
    assert.equal(await page.locator("#audio-wave-panel").isVisible(), true);
    assert.equal(await page.locator("#played-keys-panel").isVisible(), true);
    assert.equal(await settingsDialog.isVisible(), false);
    await settingsButton.click();
    assert.equal(await settingsDialog.isVisible(), true);
    const audioWaveCheckbox = settingsDialog.getByRole("checkbox", { name: "Audio wave" });
    const playedKeysCheckbox = settingsDialog.getByRole("checkbox", { name: "Played keys" });
    assert.equal(await audioWaveCheckbox.isChecked(), true);
    assert.equal(await playedKeysCheckbox.isChecked(), true);
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

    // Playwright clicks invoke the app keyboard's mouse handlers and real playback path.
    for (const [note] of notes) {
      await keyboard.getByRole("button", { name: note, exact: true }).click();
    }

    const captured = await page.evaluate(() => window.__scheduledOscillators);
    // Confirm each UI-triggered voice was a sine at its expected equal-tempered frequency.
    assert.equal(captured.length, notes.length);
    for (const [index, [note, expectedFrequency]] of notes.entries()) {
      assert.equal(captured[index].type, "sine", `${note} oscillator type`);
      assert.ok(
        Math.abs(captured[index].frequency - expectedFrequency) < 1e-9,
        `${note}: expected ${expectedFrequency} Hz, got ${captured[index].frequency} Hz`,
      );
    }
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
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser?.close();
    server.close();
  }
}, { timeout: 60_000 });
