export type Intensity = 1 | 2 | 3 | 4 | 5;

export const INTENSITY_LEVELS: readonly Intensity[] = [1, 2, 3, 4, 5];

const LABELS: Record<Intensity, string> = {
  1: 'Leve',
  2: 'Incômoda',
  3: 'Moderada',
  4: 'Forte',
  5: 'Muito forte',
};

export function intensityLabel(value: Intensity): string {
  return LABELS[value];
}

export function isIntensity(value: unknown): value is Intensity {
  return typeof value === 'number' && INTENSITY_LEVELS.includes(value as Intensity);
}
