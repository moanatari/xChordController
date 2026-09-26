// Joystick chord modifiers: 3 modes × 8 directions.
// Pure data so it can be ported or tweaked without touching any logic.
import type { Quality } from './theory';

export type Direction = 'U' | 'UR' | 'R' | 'DR' | 'D' | 'DL' | 'L' | 'UL';

/** Counter-clockwise from Right, matching increasing angles (0°, 45°, …). */
export const DIRECTIONS: readonly Direction[] = ['R', 'UR', 'U', 'UL', 'L', 'DL', 'D', 'DR'];

export type JoystickMode = 'default' | 'extended' | 'chromatic';

export const JOYSTICK_MODES: readonly JoystickMode[] = ['default', 'extended', 'chromatic'];

export interface ChordShape {
  /** Semitones above the root, ascending, starting with 0. */
  readonly intervals: readonly number[];
  /** Suffix appended to the root name, e.g. "m7". */
  readonly symbol: string;
}

const shape = (symbol: string, intervals: number[]): ChordShape => ({ symbol, intervals });

export const SHAPES = {
  maj: shape('', [0, 4, 7]),
  min: shape('m', [0, 3, 7]),
  dim: shape('dim', [0, 3, 6]),
  aug: shape('aug', [0, 4, 8]),
  sus2: shape('sus2', [0, 2, 7]),
  sus4: shape('sus4', [0, 5, 7]),
  six: shape('6', [0, 4, 7, 9]),
  dom7: shape('7', [0, 4, 7, 10]),
  maj7: shape('maj7', [0, 4, 7, 11]),
  min7: shape('m7', [0, 3, 7, 10]),
  minMaj7: shape('m(maj7)', [0, 3, 7, 11]),
  halfDim7: shape('m7b5', [0, 3, 6, 10]),
  dim7: shape('dim7', [0, 3, 6, 9]),
  sevenSus4: shape('7sus4', [0, 5, 7, 10]),
  add9: shape('add9', [0, 4, 7, 14]),
  minAdd9: shape('madd9', [0, 3, 7, 14]),
  dimAdd9: shape('dim(add9)', [0, 3, 6, 14]),
  add11: shape('add11', [0, 4, 7, 17]),
  minAdd11: shape('madd11', [0, 3, 7, 17]),
  dimAdd11: shape('dim(add11)', [0, 3, 6, 17]),
  sixNine: shape('6/9', [0, 4, 7, 9, 14]),
  dom9: shape('9', [0, 4, 7, 10, 14]),
  maj9: shape('maj9', [0, 4, 7, 11, 14]),
  min9: shape('m9', [0, 3, 7, 10, 14]),
  halfDim9: shape('m9b5', [0, 3, 6, 10, 14]),
  dom7b9: shape('7b9', [0, 4, 7, 10, 13]),
  dom7s9: shape('7#9', [0, 4, 7, 10, 15]),
  dom7alt: shape('7alt', [0, 4, 10, 13, 15, 20]),
  maj7s11: shape('maj7#11', [0, 4, 7, 11, 18]),
  min11: shape('m11', [0, 3, 7, 10, 14, 17]),
  dom13: shape('13', [0, 4, 7, 10, 14, 21]),
  maj13: shape('maj13', [0, 4, 7, 11, 14, 21]),
} as const satisfies Record<string, ChordShape>;

/** Resulting shape for each base triad quality, plus a short label for the UI. */
export interface Modifier {
  readonly label: string;
  readonly maj: ChordShape;
  readonly min: ChordShape;
  readonly dim: ChordShape;
}

const all = (label: string, s: ChordShape): Modifier => ({ label, maj: s, min: s, dim: s });

const S = SHAPES;

const flipThird: Modifier = { label: 'maj↔min', maj: S.min, min: S.maj, dim: S.maj };

export const MODIFIERS: Record<JoystickMode, Record<Direction, Modifier>> = {
  // Pop / rock / soul. Major and minor chords react differently.
  default: {
    U: flipThird,
    UR: all('7', S.dom7),
    R: { label: 'maj7 / m7', maj: S.maj7, min: S.min7, dim: S.halfDim7 },
    DR: { label: '9', maj: S.maj9, min: S.min9, dim: S.halfDim9 },
    D: all('sus4', S.sus4),
    DL: { label: '6 / sus2', maj: S.six, min: S.sus2, dim: S.sus2 },
    L: { label: 'min / dim', maj: S.min, min: S.dim, dim: S.dim7 },
    UL: all('aug', S.aug),
  },
  // Jazz / R&B.
  extended: {
    U: flipThird,
    UR: all('9', S.dom9),
    R: { label: 'add11', maj: S.add11, min: S.minAdd11, dim: S.dimAdd11 },
    DR: all('m11', S.min11),
    D: all('7#9', S.dom7s9),
    DL: { label: 'add9', maj: S.add9, min: S.minAdd9, dim: S.dimAdd9 },
    L: all('7sus4', S.sevenSus4),
    UL: all('m7b5', S.halfDim7),
  },
  // Advanced jazz. With no chord held, ←/→ transposes the key (see state.ts).
  chromatic: {
    U: all('m(maj7)', S.minMaj7),
    UR: all('13', S.dom13),
    R: all('6/9', S.sixNine),
    DR: all('7alt', S.dom7alt),
    D: all('maj13', S.maj13),
    DL: all('7b9', S.dom7b9),
    L: all('m7b5', S.halfDim7),
    UL: all('maj7#11', S.maj7s11),
  },
};

const BASE_SHAPES: Record<Quality, ChordShape> = { maj: S.maj, min: S.min, dim: S.dim };

export function shapeFor(quality: Quality, mode: JoystickMode, direction: Direction | null): ChordShape {
  return direction ? MODIFIERS[mode][direction][quality] : BASE_SHAPES[quality];
}
