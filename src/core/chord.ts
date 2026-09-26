import { shapeFor, type Direction, type JoystickMode } from './modifiers';
import { MAJOR_SCALE, degreeQuality, degreeRoot, noteName } from './theory';

/** MIDI note of C3, the register every key's I chord is centred on. */
export const BASE_MIDI = 48;

/** Root position, 1st and 2nd inversion. */
export const INVERSION_COUNT = 3;

export interface ChordRequest {
  key: number;
  degree: number;
  octave: number;
  mode: JoystickMode;
  direction: Direction | null;
  inversion: number;
}

export interface Chord {
  /** Pitch class of the root. */
  root: number;
  symbol: string;
  /** e.g. "Am7", or "C/E" when inverted. */
  name: string;
  /** Ascending MIDI notes. */
  notes: number[];
}

/** MIDI note of the tonic: keys C..F start at C3..F3, keys F#..B at F#2..B2. */
export const keyRootMidi = (key: number, octave: number): number =>
  BASE_MIDI + (key >= 6 ? key - 12 : key) + 12 * octave;

export function buildChord(req: ChordRequest): Chord {
  const root = degreeRoot(req.key, req.degree);
  const shape = shapeFor(degreeQuality(req.degree), req.mode, req.direction);
  const rootMidi = keyRootMidi(req.key, req.octave) + MAJOR_SCALE[req.degree];

  const notes = shape.intervals.map((i) => rootMidi + i);
  const inversion = req.inversion % INVERSION_COUNT;
  for (let k = 0; k < inversion && k < notes.length - 1; k++) {
    notes.sort((a, b) => a - b);
    notes[0] += 12;
  }
  notes.sort((a, b) => a - b);

  const base = noteName(root) + shape.symbol;
  const name = inversion > 0 ? `${base}/${noteName(notes[0])}` : base;
  return { root, symbol: shape.symbol, name, notes };
}

/** Notes to stop and to start when moving from one note set to another. */
export function diffNotes(prev: readonly number[], next: readonly number[]): { off: number[]; on: number[] } {
  return {
    off: prev.filter((n) => !next.includes(n)),
    on: next.filter((n) => !prev.includes(n)),
  };
}
