/**
 * Compact clinical-style tooth silhouettes for odontogram (viewBox 0 0 100 120).
 * Four morphologies from FDI second digit; crown + root paths for independent fills.
 */

export type ToothMorphology = 'incisor' | 'canine' | 'premolar' | 'molar';

export const SILHOUETTE_VB = {w: 100, h: 120};

export function fdiToMorphology(fdi: number): ToothMorphology {
  const d = fdi % 10;
  if (d === 1 || d === 2) {
    return 'incisor';
  }
  if (d === 3) {
    return 'canine';
  }
  if (d === 4 || d === 5) {
    return 'premolar';
  }
  return 'molar';
}

type Pair = {crown: string; root: string};

/** y≈50–58: CEJ / crown–root boundary for fills. */
const INCISOR: Pair = {
  crown:
    'M 50 7 C 61 7 69 18 69 31 C 69 42 62 49 50 49 C 38 49 31 42 31 31 C 31 18 39 7 50 7 Z',
  root: 'M 50 49 L 56 56 L 53 114 L 47 114 L 44 56 Z',
};

const CANINE: Pair = {
  crown: 'M 50 5 L 71 38 L 64 50 L 36 50 L 29 38 Z',
  root: 'M 50 50 L 58 60 L 55 116 L 45 116 L 42 60 Z',
};

const PREMOLAR: Pair = {
  crown:
    'M 50 9 C 73 11 80 26 80 40 C 80 50 70 55 50 55 C 30 55 20 50 20 40 C 20 26 27 11 50 9 Z',
  root:
    'M 40 55 L 44 68 L 42 116 L 34 116 L 32 68 Z M 60 55 L 68 68 L 66 116 L 58 116 L 56 68 Z',
};

const MOLAR: Pair = {
  crown:
    'M 50 11 C 78 13 86 30 86 48 C 86 60 74 66 50 66 C 26 66 14 60 14 48 C 14 30 22 13 50 11 Z',
  root:
    'M 32 66 L 36 80 L 32 118 L 22 118 L 20 80 Z M 68 66 L 80 80 L 78 118 L 68 118 L 64 80 Z',
};

const BY: Record<ToothMorphology, Pair> = {
  incisor: INCISOR,
  canine: CANINE,
  premolar: PREMOLAR,
  molar: MOLAR,
};

export function getSilhouettePaths(morph: ToothMorphology): Pair {
  return BY[morph];
}

/** Implant body replacing root (same VB). */
export function implantBodyPath(morph: ToothMorphology): string {
  const y0 = morph === 'molar' ? 66 : morph === 'premolar' ? 55 : 50;
  return [
    `M 43 ${y0}`,
    `L 57 ${y0}`,
    `L 59 ${y0 + 8}`,
    `L 57 ${y0 + 16}`,
    `L 59 ${y0 + 24}`,
    `L 57 ${y0 + 32}`,
    `L 59 ${y0 + 40}`,
    `L 57 ${y0 + 48}`,
    `L 52 116`,
    `L 48 116`,
    `L 43 ${y0 + 48}`,
    `L 45 ${y0 + 40}`,
    `L 43 ${y0 + 32}`,
    `L 45 ${y0 + 24}`,
    `L 43 ${y0 + 16}`,
    `L 45 ${y0 + 8}`,
    'Z',
  ].join(' ');
}

export function implantThreadYs(morph: ToothMorphology): number[] {
  const y0 = morph === 'molar' ? 66 : morph === 'premolar' ? 55 : 50;
  return [y0 + 10, y0 + 20, y0 + 30, y0 + 40, y0 + 50];
}

/** Bridge: short horizontal segments at occlusal (crown mid). */
export function bridgeConnectorYs(morph: ToothMorphology): number {
  return morph === 'molar' ? 28 : morph === 'premolar' ? 26 : morph === 'canine' ? 22 : 24;
}
