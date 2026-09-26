// Music theory primitives. Pure: no browser or audio dependencies, so this
// module (and the rest of src/core) can be ported as-is to a native version.

/** Pitch-class names, C = 0. */
export const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/** Semitone offsets of the 7 degrees of the major scale. */
export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11] as const;

export type Quality = 'maj' | 'min' | 'dim';

/** Triad quality of each diatonic degree: I ii iii IV V vi vii°. */
export const DIATONIC_QUALITIES: readonly Quality[] = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];

export const ROMAN_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const;

export const DEGREE_COUNT = 7;

export const mod12 = (n: number): number => ((n % 12) + 12) % 12;

export const noteName = (pitch: number): string => NOTE_NAMES[mod12(pitch)];

/** Pitch class of the root of `degree` (0-based) in the major key `key`. */
export const degreeRoot = (key: number, degree: number): number => mod12(key + MAJOR_SCALE[degree]);

export const degreeQuality = (degree: number): Quality => DIATONIC_QUALITIES[degree];
