import { DEFAULT_ENVELOPE, type Envelope } from "../audio/types";

export type EnvelopeSettings = Envelope;

export const DEFAULT_ENVELOPE_SETTINGS: EnvelopeSettings = DEFAULT_ENVELOPE;

/**
 * Checks whether a value contains an envelope within the supported ranges.
 * @param value The value to check.
 * @returns Whether the value is a valid envelope.
 */
export function isEnvelopeSettings(value: unknown): value is EnvelopeSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "attack" in value &&
    typeof value.attack === "number" &&
    Number.isFinite(value.attack) &&
    value.attack >= 0 &&
    value.attack <= 5 &&
    "decay" in value &&
    typeof value.decay === "number" &&
    Number.isFinite(value.decay) &&
    value.decay >= 0 &&
    value.decay <= 5 &&
    "sustain" in value &&
    typeof value.sustain === "number" &&
    Number.isFinite(value.sustain) &&
    value.sustain >= 0 &&
    value.sustain <= 1 &&
    "release" in value &&
    typeof value.release === "number" &&
    Number.isFinite(value.release) &&
    value.release >= 0 &&
    value.release <= 5
  );
}
