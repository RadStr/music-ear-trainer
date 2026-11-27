import type { Envelope } from "../audio/types";
import type { EnvelopeView } from "../views/envelopeView";

export class EnvelopeController {
  private readonly view: EnvelopeView;
  private currentEnvelope: Envelope | undefined;
  private changeHandler: (envelope: Envelope | undefined) => void = (): void => {};

  /**
   * Initializes the envelope view and listens for envelope changes.
   * @param view The view that owns envelope controls.
   * @param initialEnvelope The default envelope settings.
   */
  constructor(view: EnvelopeView, initialEnvelope: Envelope) {
    this.view = view;
    this.currentEnvelope = initialEnvelope;
    this.view.setChangeHandler((envelope: Envelope | undefined): void => {
      this.currentEnvelope = envelope;
      this.changeHandler(envelope);
    });
    this.view.setEnvelope(initialEnvelope);
  }

  /**
   * Registers a callback for valid and invalid envelope edits.
   * @param handler Receives the current envelope, or undefined when it is invalid.
   */
  setChangeHandler(handler: (envelope: Envelope | undefined) => void): void {
    this.changeHandler = handler;
  }

  /**
   * Reads the current controls and exposes the valid envelope.
   * @returns The current envelope, or undefined when controls are invalid.
   */
  getEnvelope(): Envelope | undefined {
    this.currentEnvelope = this.view.readEnvelope();
    return this.currentEnvelope;
  }
}
