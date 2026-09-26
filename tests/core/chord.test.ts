import { describe, expect, it } from 'vitest';
import { arpSequence } from '../../src/core/arp';
import { buildChord, diffNotes, type ChordRequest } from '../../src/core/chord';
import { DIRECTIONS, JOYSTICK_MODES } from '../../src/core/modifiers';

const chord = (req: Partial<ChordRequest>) =>
  buildChord({ key: 0, degree: 0, octave: 0, mode: 'default', direction: null, inversion: 0, ...req });

describe('buildChord', () => {
  it('builds the 7 diatonic triads of C major', () => {
    const names = [0, 1, 2, 3, 4, 5, 6].map((degree) => chord({ degree }).name);
    expect(names).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
    expect(chord({}).notes).toEqual([48, 52, 55]);
    expect(chord({ degree: 6 }).notes).toEqual([59, 62, 65]);
  });

  it('applies default-mode modifiers by quality', () => {
    expect(chord({ direction: 'R' })).toMatchObject({ name: 'Cmaj7', notes: [48, 52, 55, 59] });
    expect(chord({ degree: 1, direction: 'R' }).name).toBe('Dm7');
    expect(chord({ degree: 5, direction: 'U' })).toMatchObject({ name: 'A', notes: [57, 61, 64] });
    expect(chord({ direction: 'U' }).name).toBe('Cm');
    expect(chord({ degree: 2, direction: 'UR' }).name).toBe('E7');
    expect(chord({ degree: 4, direction: 'D' }).name).toBe('Gsus4');
    expect(chord({ degree: 1, direction: 'L' }).name).toBe('Ddim');
    expect(chord({ direction: 'UL' }).name).toBe('Caug');
  });

  it('applies extended and chromatic modifiers', () => {
    expect(chord({ degree: 4, mode: 'extended', direction: 'D' }).name).toBe('G7#9');
    expect(chord({ degree: 5, mode: 'extended', direction: 'DL' }).name).toBe('Amadd9');
    expect(chord({ mode: 'chromatic', direction: 'D' }).notes).toEqual([48, 52, 55, 59, 62, 69]);
    expect(chord({ degree: 5, mode: 'chromatic', direction: 'U' }).name).toBe('Am(maj7)');
  });

  it('inverts chords and names them as slash chords', () => {
    expect(chord({ inversion: 1 })).toMatchObject({ name: 'C/E', notes: [52, 55, 60] });
    expect(chord({ inversion: 2 })).toMatchObject({ name: 'C/G', notes: [55, 60, 64] });
    expect(chord({ inversion: 3 }).name).toBe('C');
  });

  it('keeps every key centred around C3 and shifts octaves', () => {
    expect(chord({ key: 5 }).notes).toEqual([53, 57, 60]); // F3
    expect(chord({ key: 11 })).toMatchObject({ name: 'B', notes: [47, 51, 54] }); // B2
    expect(chord({ key: 7, degree: 1 }).name).toBe('Am');
    expect(chord({ octave: 1 }).notes).toEqual([60, 64, 67]);
  });

  it('produces valid ascending notes for every mode, direction and degree', () => {
    for (const mode of JOYSTICK_MODES)
      for (const direction of [null, ...DIRECTIONS])
        for (let degree = 0; degree < 7; degree++)
          for (let inversion = 0; inversion < 3; inversion++) {
            const { notes, name } = chord({ mode, direction, degree, inversion });
            expect(name.length).toBeGreaterThan(0);
            expect(new Set(notes).size).toBe(notes.length);
            expect([...notes].sort((a, b) => a - b)).toEqual(notes);
          }
  });
});

describe('diffNotes', () => {
  it('returns notes to stop and to start', () => {
    expect(diffNotes([48, 52, 55], [48, 52, 55, 59])).toEqual({ off: [], on: [59] });
    expect(diffNotes([48, 52, 55], [48, 51, 55])).toEqual({ off: [52], on: [51] });
  });
});

describe('arpSequence', () => {
  it('orders notes by pattern', () => {
    expect(arpSequence([55, 48, 52], 'up')).toEqual([48, 52, 55]);
    expect(arpSequence([48, 52, 55], 'down')).toEqual([55, 52, 48]);
    expect(arpSequence([48, 52, 55, 59], 'updown')).toEqual([48, 52, 55, 59, 55, 52]);
  });
});
