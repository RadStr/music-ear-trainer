export type EffectData = string | Readonly<Record<string, unknown>>;

export interface Effect<TData = EffectData> {
  /** Triggers the effect with optional effect-specific data. */
  trigger(data?: TData): void;
}
