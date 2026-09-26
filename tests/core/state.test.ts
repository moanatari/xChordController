import { describe, expect, it } from 'vitest';
import { activeChord, initialState, reduce, type InputEvent, type State } from '../../src/core/state';

const run = (events: InputEvent[], from: State = initialState(4)) => events.reduce(reduce, from);

describe('reduce', () => {
  it('plays the last pressed chord and falls back to the one still held', () => {
    let s = run([{ t: 'chordDown', degree: 0 }, { t: 'chordDown', degree: 4 }]);
    expect(activeChord(s)?.name).toBe('G');
    s = reduce(s, { t: 'chordUp', degree: 4 });
    expect(activeChord(s)?.name).toBe('C');
    s = reduce(s, { t: 'chordUp', degree: 0 });
    expect(activeChord(s)).toBeNull();
  });

  it('bumps the trigger on every fresh press only', () => {
    const s = run([{ t: 'chordDown', degree: 0 }, { t: 'stick', direction: 'R' }]);
    expect(s.trigger).toBe(1);
    expect(activeChord(s)?.name).toBe('Cmaj7');
  });

  it('cycles the held chord inversion with shift', () => {
    const s = run([{ t: 'chordDown', degree: 0 }, { t: 'shift', down: true }]);
    expect(activeChord(s)?.name).toBe('C/E');
    expect(run([{ t: 'shift', down: true }]).slots.every((slot) => slot.inversion === 0)).toBe(true);
  });

  it('locks and unlocks a modifier on a chord', () => {
    let s = run([
      { t: 'chordDown', degree: 5 },
      { t: 'stick', direction: 'R' },
      { t: 'lock' },
      { t: 'stick', direction: null },
      { t: 'chordUp', degree: 5 },
      { t: 'chordDown', degree: 5 },
    ]);
    expect(activeChord(s)?.name).toBe('Am7');
    s = reduce(s, { t: 'stick', direction: 'D' });
    expect(activeChord(s)?.name).toBe('Asus4'); // live stick overrides the lock
    s = run([{ t: 'stick', direction: null }, { t: 'lock' }], s);
    expect(activeChord(s)?.name).toBe('Am');
  });

  it('changes key, octave, preset and bpm with the d-pad', () => {
    let s = run([{ t: 'dpad', dir: 'left' }, { t: 'dpad', dir: 'up' }, { t: 'dpad', dir: 'up' }, { t: 'dpad', dir: 'up' }]);
    expect(s.key).toBe(11);
    expect(s.octave).toBe(2); // clamped
    s = run([{ t: 'shift', down: true }, { t: 'dpad', dir: 'down' }, { t: 'dpad', dir: 'right' }], s);
    expect(s.preset).toBe(3); // wraps
    expect(s.bpm).toBe(105);
  });

  it('transposes with the stick in chromatic mode when no chord is held', () => {
    const s = run([
      { t: 'nextJoystickMode' },
      { t: 'nextJoystickMode' },
      { t: 'stick', direction: 'R' },
      { t: 'stick', direction: null },
      { t: 'stick', direction: 'R' },
    ]);
    expect(s.joystickMode).toBe('chromatic');
    expect(s.key).toBe(2);
  });

  it('cycles play mode, and its option with shift', () => {
    let s = run([{ t: 'nextPlayMode' }]);
    expect(s.playMode).toBe('strum');
    s = run([{ t: 'shift', down: true }, { t: 'nextPlayMode' }], s);
    expect(s).toMatchObject({ playMode: 'strum', strumSpeed: 2 });
  });

  it('moves effects at a rate and clamps them', () => {
    let s = run([{ t: 'fxStick', x: 1, y: -0.5, dt: 0.1 }]);
    expect(s.fx.cutoff).toBeCloseTo(0.93);
    expect(s.fx.resonance).toBeCloseTo(0.08);
    s = run([{ t: 'fxStick', x: 1, y: 0, dt: 5 }], s);
    expect(s.fx.cutoff).toBe(1);
    s = run([{ t: 'nextFxPage' }, { t: 'fxStick', x: 1, y: 0, dt: 0.5 }], s);
    expect(s.fx.delayMix).toBeCloseTo(0.4);
  });
});
