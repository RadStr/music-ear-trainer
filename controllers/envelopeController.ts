import type { Envelope } from "../audio/types";
import type { EnvelopeView } from "../views/envelopeView";

export class EnvelopeController {
  private readonly view: EnvelopeView;
  private currentEnvelope: Envelope | undefined;

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
    });
    this.view.setEnvelope(initialEnvelope);
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
