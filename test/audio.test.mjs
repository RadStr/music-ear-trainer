import assert from "node:assert/strict";
import { build } from "esbuild";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

class FakeAudioParam {
  events = [];

  setValueAtTime(value, time) {
    this.events.push({ type: "set", value, time });
  }

  linearRampToValueAtTime(value, time) {
    this.events.push({ type: "linear-ramp", value, time });
  }

  exponentialRampToValueAtTime(value, time) {
    this.events.push({ type: "exponential-ramp", value, time });
  }

  cancelScheduledValues(time) {
    this.events.push({ type: "cancel", time });
  }

  setTargetAtTime(value, time, timeConstant) {
    this.events.push({ type: "target", value, time, timeConstant });
  }
}

class FakeAudioNode {
  connections = [];
  disconnected = false;

  connect(node) {
    this.connections.push(node);
    return node;
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeOscillator extends FakeAudioNode {
  frequency = new FakeAudioParam();
  type = "sine";
  startTime;
  stopTime;
  listeners = new Map();

  start(time) {
    this.startTime = time;
  }

  stop(time) {
    this.stopTime = time;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }
}

class FakeGain extends FakeAudioNode {
  gain = new FakeAudioParam();
}

class FakeBufferSource extends FakeAudioNode {
  buffer;
  playbackRate = new FakeAudioParam();
  startTime;
  stopTime;

  start(time) {
    this.startTime = time;
  }

  stop(time) {
    this.stopTime = time;
  }

  addEventListener() {}
}

class FakeAnalyser extends FakeAudioNode {
  fftSize = 2048;

  getFloatTimeDomainData(samples) {
    samples.fill(0.25);
  }
}

class FakeAudioContext {
  static instances = [];
  state = "running";
  currentTime = 10;
  destination = new FakeAudioNode();
  oscillators = [];
  gains = [];
  bufferSources = [];
  analyser;

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  createBufferSource() {
    const source = new FakeBufferSource();
    this.bufferSources.push(source);
    return source;
  }

  createAnalyser() {
    this.analyser = new FakeAnalyser();
    return this.analyser;
  }

  decodeAudioData(data) {
    return Promise.resolve({ byteLength: data.byteLength });
  }
}

globalThis.AudioContext = FakeAudioContext;

// Bundle the TypeScript modules so tests exercise the production implementations.
async function loadBundle(entryPoint) {
  const { outputFiles } = await build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
  });
  const source = outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { AppController } = await loadBundle(
  resolve(projectRoot, "controllers", "appController.ts"),
);
const { getCurrentAudioWave, playAudio, setMasterVolume } = await loadBundle(
  resolve(projectRoot, "audio", "play.ts"),
);
const { playSine } = await loadBundle(resolve(projectRoot, "audio", "playSine.ts"));
const { SampleSource, normalizeSampleDirectoryUrl } = await loadBundle(
  resolve(projectRoot, "audio", "sampleSource.ts"),
);
const { AudioWaveVisualization } = await loadBundle(
  resolve(projectRoot, "audio-visualization", "audio-wave", "audio-wave-visualization.ts"),
);
const { PlayedKeysVisualization } = await loadBundle(
  resolve(projectRoot, "audio-visualization", "played-keys", "played-keys-visualization.ts"),
);
const { SineIntersectionVisualization } = await loadBundle(
  resolve(projectRoot, "audio-visualization", "sine-intersection", "sine-intersection-visualization.ts"),
);
const { StaticIntersectionVisualization } = await loadBundle(
  resolve(projectRoot, "audio-visualization", "static-intersection", "static-intersection-visualization.ts"),
);

test("AppController plays every C4-C5 note as a sine at its equal-tempered frequency", () => {
  // Exercise MIDI-to-frequency conversion without constructing the full UI.
  const controller = Object.create(AppController.prototype);
  controller.selectedSource = "sine";
  controller.activeNoteCounts = new Map();
  const expectedFrequencies = [
    261.6255653005986,
    277.1826309768721,
    293.6647679174076,
    311.1269837220809,
    329.6275569128699,
    349.2282314330039,
    369.9944227116344,
    391.99543598174927,
    415.3046975799451,
    440,
    466.1637615180899,
    493.8833012561241,
    523.2511306011972,
  ];
  const envelope = { attack: 0.005, decay: 0, sustain: 1, release: 0.03 };
  const firstContext = FakeAudioContext.instances.length;

  expectedFrequencies.forEach((expectedFrequency, index) => {
    controller.playNote(60 + index, envelope);
  });

  const context = FakeAudioContext.instances[firstContext];
  assert.ok(context);
  assert.equal(context.oscillators.length, expectedFrequencies.length);
  context.oscillators.forEach((oscillator, index) => {
    assert.equal(oscillator.type, "sine", `MIDI note ${60 + index}`);
    const frequencyEvent = oscillator.frequency.events.find((event) => event.type === "set");
    assert.ok(frequencyEvent, `MIDI note ${60 + index} has a scheduled frequency`);
    assert.ok(
      Math.abs(frequencyEvent.value - expectedFrequencies[index]) < 1e-9,
      `MIDI note ${60 + index}: expected ${expectedFrequencies[index]} Hz, got ${frequencyEvent.value} Hz`,
    );
  });
});

test("audio engine schedules a sine voice through the gain chain and releases it", async () => {
  // Verify oscillator scheduling and envelope wiring against a deterministic Web Audio mock.
  const context = new FakeAudioContext();
  globalThis.AudioContext = class extends FakeAudioContext {
    constructor() {
      super();
      return context;
    }
  };
  const envelope = { attack: 0.01, decay: 0.02, sustain: 0.6, release: 0.03 };

  assert.throws(() => playAudio(playSine, 0, envelope), /positive finite/);
  assert.throws(
    () => playAudio(playSine, 440, { ...envelope, sustain: 2 }),
    /Envelope times/,
  );

  const voice = playAudio(playSine, 440, envelope);
  await voice.ready;

  const [oscillator] = context.oscillators;
  assert.ok(oscillator);
  assert.equal(oscillator.type, "sine");
  assert.deepEqual(oscillator.frequency.events[0], {
    type: "set",
    value: 440,
    time: context.currentTime,
  });
  assert.equal(oscillator.startTime, context.currentTime);
  assert.equal(oscillator.connections[0], context.gains[0]);
  assert.equal(context.gains[0].connections[0], context.gains[1]);
  assert.equal(context.gains[1].connections[0], context.analyser);
  assert.equal(context.analyser.connections[0], context.destination);
  const audioWave = getCurrentAudioWave();
  assert.equal(audioWave.length, context.analyser.fftSize);
  assert.equal(audioWave[0], 0.25);

  voice.release();
  assert.equal(oscillator.stopTime, context.currentTime + envelope.release);
  assert.ok(
    context.gains[0].gain.events.some((event) => event.type === "exponential-ramp"),
  );
  const repeatedReleaseStopTime = oscillator.stopTime;
  voice.release();
  assert.equal(oscillator.stopTime, repeatedReleaseStopTime);

  setMasterVolume(0.25);
  assert.deepEqual(
    context.gains[1].gain.events.at(-1),
    { type: "target", value: 0.25, time: context.currentTime, timeConstant: 0.02 },
  );
});

test("sample source caches resolution and decoding and applies semitone playback rates", async () => {
  let resolutionCount = 0;
  const source = new SampleSource(async () => {
    resolutionCount += 1;
    return {
      url: "test.wav",
      rootMidiNote: 60,
      audioData: new ArrayBuffer(8),
    };
  });
  const context = new FakeAudioContext();

  const first = await source.getPlayMethod(62, context);
  const second = await source.getPlayMethod(62, context);
  assert.equal(resolutionCount, 1);

  const firstBufferSource = first(context);
  const secondBufferSource = second(context);
  assert.equal(context.bufferSources.length, 2);
  assert.deepEqual(context.bufferSources[0].playbackRate.events[0], {
    type: "set",
    value: 2 ** (2 / 12),
    time: context.currentTime,
  });
  assert.equal(firstBufferSource.buffer.byteLength, 8);
  assert.equal(secondBufferSource.buffer.byteLength, 8);
});

test("sample directory URL normalization accepts HTTP(S) and rejects credentials", () => {
  assert.equal(
    normalizeSampleDirectoryUrl("https://example.com/samples"),
    "https://example.com/samples/",
  );
  assert.throws(
    () => normalizeSampleDirectoryUrl("https://user:secret@example.com/samples"),
    /credentials/,
  );
  assert.throws(
    () => normalizeSampleDirectoryUrl("ftp://example.com/samples"),
    /HTTP or HTTPS/,
  );
});

test("audio wave visualization draws waveform samples across the canvas", () => {
  const commands = [];
  const context = {
    clearRect: (...args) => commands.push(["clearRect", ...args]),
    beginPath: () => commands.push(["beginPath"]),
    moveTo: (...args) => commands.push(["moveTo", ...args]),
    lineTo: (...args) => commands.push(["lineTo", ...args]),
    stroke: () => commands.push(["stroke"]),
  };
  const canvas = {
    width: 100,
    height: 40,
    getContext: () => context,
  };
  const visualization = new AudioWaveVisualization(canvas);

  visualization.draw([60], Float32Array.of(0, 1, -1));

  assert.deepEqual(commands, [
    ["clearRect", 0, 0, 100, 40],
    ["beginPath"],
    ["moveTo", 0, 20],
    ["lineTo", 50, 0],
    ["lineTo", 100, 40],
    ["stroke"],
  ]);
});

test("audio wave visualization shows a center line before audio is available", () => {
  const commands = [];
  const context = {
    clearRect: (...args) => commands.push(["clearRect", ...args]),
    beginPath: () => commands.push(["beginPath"]),
    moveTo: (...args) => commands.push(["moveTo", ...args]),
    lineTo: (...args) => commands.push(["lineTo", ...args]),
    stroke: () => commands.push(["stroke"]),
  };
  const canvas = {
    width: 100,
    height: 40,
    getContext: () => context,
  };
  const visualization = new AudioWaveVisualization(canvas);

  visualization.draw([], new Float32Array());

  assert.deepEqual(commands, [
    ["clearRect", 0, 0, 100, 40],
    ["beginPath"],
    ["moveTo", 0, 20],
    ["lineTo", 100, 20],
    ["stroke"],
  ]);
});

test("played keys visualization shows active MIDI note names and clears when none remain", () => {
  const commands = [];
  const context = {
    clearRect: (...args) => commands.push(["clearRect", ...args]),
    fillRect: (...args) => commands.push(["fillRect", context.fillStyle, ...args]),
    strokeRect: (...args) => commands.push(["strokeRect", ...args]),
    fillText: (...args) => commands.push(["fillText", ...args]),
  };
  const canvas = {
    width: 200,
    height: 100,
    getContext: () => context,
  };
  const visualization = new PlayedKeysVisualization(canvas);

  visualization.draw([60, 61], Float32Array.of(0));
  assert.deepEqual(
    commands.filter(([command]) => command === "fillText").map(([, note]) => note),
    ["C4", "C♯4"],
  );
  assert.equal(context.font, "24px sans-serif");
  assert.equal(commands.filter(([command]) => command === "fillRect").length, 2);

  commands.length = 0;
  visualization.draw([], new Float32Array());
  assert.deepEqual(commands, [["clearRect", 0, 0, 200, 100]]);
});

test("sine intersection draws one generated sine for every active note", () => {
  const commands = [];
  const context = {
    clearRect: (...args) => commands.push(["clearRect", ...args]),
    beginPath: () => commands.push(["beginPath"]),
    moveTo: (...args) => commands.push(["moveTo", ...args]),
    lineTo: (...args) => commands.push(["lineTo", ...args]),
    stroke: () => commands.push(["stroke"]),
    fillText: (...args) => commands.push(["fillText", ...args]),
  };
  const canvas = {
    width: 200,
    height: 100,
    getContext: () => context,
  };
  const visualization = new SineIntersectionVisualization(canvas);

  visualization.draw([60, 67], new Float32Array());

  assert.deepEqual(
    commands.filter(([command]) => command === "fillText").map(([, note]) => note),
    ["C4", "G4"],
  );
  assert.equal(commands.filter(([command]) => command === "stroke").length, 4);
});

test("static intersection graphs every note and reports their cycle-count ratio", () => {
  const commands = [];
  const context = {
    clearRect: (...args) => commands.push(["clearRect", ...args]),
    beginPath: () => commands.push(["beginPath"]),
    moveTo: (...args) => commands.push(["moveTo", ...args]),
    lineTo: (...args) => commands.push(["lineTo", ...args]),
    stroke: () => commands.push(["stroke"]),
  };
  const canvas = {
    width: 200,
    height: 100,
    getContext: () => context,
  };
  const explanation = { textContent: "" };
  const visualization = new StaticIntersectionVisualization(canvas, explanation);

  visualization.draw([60, 67, 72], new Float32Array());

  assert.match(explanation.textContent, /2:3:4/);
  assert.match(explanation.textContent, /C4: 2 cycles, G4: 3 cycles, C5: 4 cycles/);
  assert.match(explanation.textContent, /closest simple match/);
  assert.equal(commands.filter(([command]) => command === "stroke").length, 3);
});