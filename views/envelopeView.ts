import { DEFAULT_ENVELOPE, type Envelope } from "../audio/types";

interface EnvelopeControl {
  readonly numberInput: HTMLInputElement;
  readonly rangeInput: HTMLInputElement;
}

export interface EnvelopeView {
  readonly element: HTMLDivElement;
  setChangeHandler(handler: (envelope: Envelope | undefined) => void): void;
  setEnvelope(envelope: Envelope): void;
  readEnvelope(): Envelope | undefined;
}

const SVG_NAMESPACE: "http://www.w3.org/2000/svg" = "http://www.w3.org/2000/svg";
const PREVIEW_SUSTAIN_HOLD_SECONDS: number = 1;
const CHART_LEFT: number = 58;
const CHART_RIGHT: number = 682;
const CHART_TOP: number = 24;
const CHART_BOTTOM: number = 178;
const CHART_HEIGHT: number = CHART_BOTTOM - CHART_TOP;
const CHART_WIDTH: number = CHART_RIGHT - CHART_LEFT;

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes: Readonly<Record<string, string>> = {},
  textContent?: string,
): SVGElementTagNameMap[K] {
  const element: SVGElementTagNameMap[K] = document.createElementNS(SVG_NAMESPACE, tagName);
  for (const [attributeName, attributeValue] of Object.entries(attributes)) {
    element.setAttribute(attributeName, attributeValue);
  }
  if (textContent !== undefined) {
    element.textContent = textContent;
  }
  return element;
}

/**
 * Builds the envelope controls, chart, validation, and change callback API.
 * @returns The envelope view and its control handlers.
 */
export function createEnvelopeView(): EnvelopeView {
  const styles: HTMLStyleElement = document.createElement("style");
  styles.textContent = `
    .envelope-controls {
      background: #fafaff;
      border: 1px solid #e7e7f0;
      border-radius: 0.9rem;
      margin: 0.75rem 0 1rem;
      padding: 1rem;
    }
    .envelope-controls[hidden] {
      display: none;
    }
    .envelope-controls-grid {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    }
    .envelope-control {
      display: grid;
      gap: 0.25rem;
    }
    .envelope-control label {
      display: grid;
      gap: 0.25rem;
    }
    .envelope-control input[type="number"] {
      max-width: 8rem;
    }
    .envelope-control input[type="range"] {
      padding: 0;
      width: 100%;
    }
    .envelope-preview {
      grid-column: 1 / -1;
      margin: 0;
      max-width: 760px;
      width: 100%;
    }
    .envelope-preview svg {
      display: block;
      height: auto;
      width: 100%;
    }
    .envelope-preview figcaption {
      color: #5f6368;
      font-size: 0.9rem;
    }
    .envelope-chart-axis {
      stroke: #77788e;
      stroke-width: 1;
    }
    .envelope-chart-grid {
      stroke: #e2e3eb;
      stroke-dasharray: 3 3;
      stroke-width: 1;
    }
    .envelope-chart-curve {
      fill: none;
      stroke: #6558c8;
      stroke-linejoin: round;
      stroke-width: 3;
    }
    .envelope-chart-label {
      fill: #52536b;
      font: 12px system-ui, sans-serif;
    }
  `;
  document.head.append(styles);

  const element: HTMLDivElement = document.createElement("div");
  element.className = "envelope-editor";

  const toggleButton: HTMLButtonElement = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "btn btn-outline-secondary";
  toggleButton.textContent = "Edit envelope";
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.setAttribute("aria-controls", "envelope-controls");

  const controls: HTMLFieldSetElement = document.createElement("fieldset");
  controls.className = "envelope-controls";
  controls.id = "envelope-controls";
  controls.hidden = true;
  const legend: HTMLLegendElement = document.createElement("legend");
  legend.textContent = "ADSR envelope";
  const controlGrid: HTMLDivElement = document.createElement("div");
  controlGrid.className = "envelope-controls-grid";
  controls.append(legend, controlGrid);

  const figure: HTMLElement = document.createElement("figure");
  figure.className = "envelope-preview";
  const chart: SVGSVGElement = createSvgElement("svg", {
    viewBox: "0 0 720 250",
    role: "img",
    "aria-labelledby": "envelope-chart-title envelope-chart-description",
  });
  const chartTitle: SVGTitleElement = createSvgElement(
    "title",
    { id: "envelope-chart-title" },
    "ADSR envelope preview",
  );
  const chartDescription: SVGDescElement = createSvgElement(
    "desc",
    { id: "envelope-chart-description" },
    "A graph of the attack, decay, one-second sustain preview, and release stages.",
  );
  const chartGrid: SVGLineElement = createSvgElement("line", {
    x1: String(CHART_LEFT),
    y1: String(CHART_TOP),
    x2: String(CHART_RIGHT),
    y2: String(CHART_TOP),
    class: "envelope-chart-grid",
  });
  const xAxis: SVGLineElement = createSvgElement("line", {
    x1: String(CHART_LEFT),
    y1: String(CHART_BOTTOM),
    x2: String(CHART_RIGHT),
    y2: String(CHART_BOTTOM),
    class: "envelope-chart-axis",
  });
  const yAxis: SVGLineElement = createSvgElement("line", {
    x1: String(CHART_LEFT),
    y1: String(CHART_TOP),
    x2: String(CHART_LEFT),
    y2: String(CHART_BOTTOM),
    class: "envelope-chart-axis",
  });
  const curve: SVGPathElement = createSvgElement("path", {
    class: "envelope-chart-curve",
  });
  const maximumLevelLabel: SVGTextElement = createSvgElement(
    "text",
    {
      x: String(CHART_LEFT - 10),
      y: String(CHART_TOP + 4),
      "text-anchor": "end",
      class: "envelope-chart-label",
    },
    "1.0",
  );
  const minimumLevelLabel: SVGTextElement = createSvgElement(
    "text",
    {
      x: String(CHART_LEFT - 10),
      y: String(CHART_BOTTOM + 4),
      "text-anchor": "end",
      class: "envelope-chart-label",
    },
    "0",
  );
  const startTimeLabel: SVGTextElement = createSvgElement(
    "text",
    {
      x: String(CHART_LEFT),
      y: String(CHART_BOTTOM + 20),
      class: "envelope-chart-label",
    },
    "0 s",
  );
  const totalTimeLabel: SVGTextElement = createSvgElement("text", {
    x: String(CHART_RIGHT),
    y: String(CHART_BOTTOM + 20),
    "text-anchor": "end",
    class: "envelope-chart-label",
  });
  const xAxisLabel: SVGTextElement = createSvgElement(
    "text",
    {
      x: String((CHART_LEFT + CHART_RIGHT) / 2),
      y: "244",
      "text-anchor": "middle",
      class: "envelope-chart-label",
    },
    "Time (seconds)",
  );
  chart.append(
    chartTitle,
    chartDescription,
    chartGrid,
    xAxis,
    yAxis,
    curve,
    maximumLevelLabel,
    minimumLevelLabel,
    startTimeLabel,
    totalTimeLabel,
    xAxisLabel,
  );
  const caption: HTMLElement = document.createElement("figcaption");
  caption.textContent =
    "Preview includes a 1-second sustain hold; during playback, sustain lasts while the mouse is held.";
  figure.append(chart, caption);
  controls.append(figure);
  element.append(toggleButton, controls);

  let changeHandler: (envelope: Envelope | undefined) => void = (): void => {};

  function readValues(reportValidity: boolean): Envelope | undefined {
    const numberInputs: readonly HTMLInputElement[] = [
      attackControl.numberInput,
      decayControl.numberInput,
      sustainControl.numberInput,
      releaseControl.numberInput,
    ];
    for (const input of numberInputs) {
      if (!input.validity.valid) {
        if (reportValidity) {
          input.reportValidity();
        }
        return undefined;
      }
    }
    return {
      attack: attackControl.numberInput.valueAsNumber,
      decay: decayControl.numberInput.valueAsNumber,
      sustain: sustainControl.numberInput.valueAsNumber,
      release: releaseControl.numberInput.valueAsNumber,
    };
  }

  function updateChart(): void {
    const envelope: Envelope | undefined = readValues(false);
    if (!envelope) {
      return;
    }

    const totalTime: number =
      envelope.attack +
      envelope.decay +
      PREVIEW_SUSTAIN_HOLD_SECONDS +
      envelope.release;
    const xForTime: (time: number) => number = (time: number): number =>
      CHART_LEFT + (time / totalTime) * CHART_WIDTH;
    const yForLevel: (level: number) => number = (level: number): number =>
      CHART_BOTTOM - level * CHART_HEIGHT;
    const attackEndX: number = xForTime(envelope.attack);
    const decayEndX: number = xForTime(envelope.attack + envelope.decay);
    const releaseStartX: number = xForTime(
      envelope.attack + envelope.decay + PREVIEW_SUSTAIN_HOLD_SECONDS,
    );
    const sustainY: number = yForLevel(envelope.sustain);
    curve.setAttribute(
      "d",
      [
        `M ${CHART_LEFT} ${CHART_BOTTOM}`,
        `L ${attackEndX} ${CHART_TOP}`,
        `L ${decayEndX} ${sustainY}`,
        `L ${releaseStartX} ${sustainY}`,
        `L ${CHART_RIGHT} ${CHART_BOTTOM}`,
      ].join(" "),
    );
    totalTimeLabel.textContent = `Total: ${totalTime.toFixed(2)} s`;
  }

  /**
   * Builds a synchronized number and range control for one envelope stage.
   * @param id The DOM id for the control.
   * @param labelText The accessible label.
   * @param initialValue The starting control value.
   * @param max The maximum allowed value.
   * @returns The linked number and range inputs.
   */
  function addControl(
    id: string,
    labelText: string,
    initialValue: string,
    max: string,
  ): EnvelopeControl {
    const control: HTMLDivElement = document.createElement("div");
    control.className = "envelope-control";
    const label: HTMLLabelElement = document.createElement("label");
    label.htmlFor = id;
    label.textContent = labelText;

    const numberInput: HTMLInputElement = document.createElement("input");
    numberInput.id = id;
    numberInput.type = "number";
    numberInput.className = "form-control";
    numberInput.min = "0";
    numberInput.max = max;
    numberInput.step = "0.01";
    numberInput.value = initialValue;
    numberInput.required = true;
    label.append(numberInput);

    const rangeInput: HTMLInputElement = document.createElement("input");
    rangeInput.id = `${id}-slider`;
    rangeInput.type = "range";
    rangeInput.className = "form-range";
    rangeInput.min = "0";
    rangeInput.max = max;
    rangeInput.step = "0.01";
    rangeInput.value = initialValue;
    rangeInput.setAttribute("aria-label", `${labelText} slider`);

    numberInput.addEventListener("input", (_event: Event): void => {
      if (!numberInput.validity.valid) {
        changeHandler(undefined);
        return;
      }
      rangeInput.value = numberInput.value;
      updateChart();
      changeHandler(readValues(false));
    });
    rangeInput.addEventListener("input", (_event: Event): void => {
      numberInput.value = rangeInput.value;
      updateChart();
      changeHandler(readValues(false));
    });

    control.append(label, rangeInput);
    controlGrid.append(control);
    return { numberInput, rangeInput };
  }

  const attackControl: EnvelopeControl = addControl(
    "envelope-attack",
    "Attack (seconds)",
    String(DEFAULT_ENVELOPE.attack),
    "5",
  );
  const decayControl: EnvelopeControl = addControl(
    "envelope-decay",
    "Decay (seconds)",
    String(DEFAULT_ENVELOPE.decay),
    "5",
  );
  const sustainControl: EnvelopeControl = addControl(
    "envelope-sustain",
    "Sustain (0–1)",
    String(DEFAULT_ENVELOPE.sustain),
    "1",
  );
  const releaseControl: EnvelopeControl = addControl(
    "envelope-release",
    "Release (seconds)",
    String(DEFAULT_ENVELOPE.release),
    "5",
  );

  toggleButton.addEventListener("click", (_event: MouseEvent): void => {
    controls.hidden = !controls.hidden;
    toggleButton.setAttribute("aria-expanded", String(!controls.hidden));
  });

  updateChart();

  return {
    element,
    setChangeHandler: (handler: (envelope: Envelope | undefined) => void): void => {
      changeHandler = handler;
    },
    setEnvelope: (envelope: Envelope): void => {
      attackControl.numberInput.value = String(envelope.attack);
      attackControl.rangeInput.value = String(envelope.attack);
      decayControl.numberInput.value = String(envelope.decay);
      decayControl.rangeInput.value = String(envelope.decay);
      sustainControl.numberInput.value = String(envelope.sustain);
      sustainControl.rangeInput.value = String(envelope.sustain);
      releaseControl.numberInput.value = String(envelope.release);
      releaseControl.rangeInput.value = String(envelope.release);
      updateChart();
      changeHandler(envelope);
    },
    readEnvelope: (): Envelope | undefined => readValues(true),
  };
}
