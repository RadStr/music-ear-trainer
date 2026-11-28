export interface VisualizationSettings {
  readonly audioWave: boolean;
  readonly playedKeys: boolean;
  readonly sineIntersection: boolean;
  readonly staticIntersection: boolean;
}

export const DEFAULT_VISUALIZATION_SETTINGS: VisualizationSettings = {
  audioWave: true,
  playedKeys: true,
  sineIntersection: true,
  staticIntersection: true,
};

/**
 * Checks whether a value contains valid visualization settings.
 * @param value The value to check.
 * @returns Whether the value is a valid visualization settings record.
 */
export function isVisualizationSettings(
  value: unknown,
): value is VisualizationSettings {
  return (
    typeof value === "object" &&
    value !== null &&
    "audioWave" in value &&
    typeof value.audioWave === "boolean" &&
    "playedKeys" in value &&
    typeof value.playedKeys === "boolean" &&
    "sineIntersection" in value &&
    typeof value.sineIntersection === "boolean" &&
    "staticIntersection" in value &&
    typeof value.staticIntersection === "boolean"
  );
}
