// Instrument state machine: abstract input events in, new state out.
// Side effects (sound, MIDI, UI) are derived from state changes in main.ts.
import { ARP_PATTERNS } from './arp';
import { INVERSION_COUNT, buildChord, type Chord } from './chord';
import { JOYSTICK_MODES, type Direction, type JoystickMode } from './modifiers';
import { DEGREE_COUNT, mod12 } from './theory';

export type PlayMode = 'play' | 'strum' | 'arp';
export const PLAY_MODES: readonly PlayMode[] = ['play', 'strum', 'arp'];

/** Delay between strummed notes: fast, medium, slow. */
export const STRUM_SPEEDS_MS = [40, 80, 120] as const;

export const OCTAVE_RANGE = { min: -1, max: 2 } as const;
export const BPM_RANGE = { min: 40, max: 300 } as const;
const BPM_STEP = 5;

export const FX_PARAMS = ['cutoff', 'resonance', 'delayMix', 'delayFeedback', 'reverbMix', 'chorusMix'] as const;
export type FxParam = (typeof FX_PARAMS)[number];

/** Right-stick pages: [X axis param, Y axis param]. */
export const FX_PAGES: readonly (readonly [FxParam, FxParam])[] = [
  ['cutoff', 'resonance'],
  ['delayMix', 'delayFeedback'],
  ['reverbMix', 'chorusMix'],
];

export const FX_DEFAULTS: Record<FxParam, number> = {
  cutoff: 0.85,
  resonance: 0.1,
  delayMix: 0,
  delayFeedback: 0.35,
  reverbMix: 0.25,
  chorusMix: 0,
};

/** Full-deflection speed of the right stick, in normalized units per second. */
export const FX_STICK_SPEED = 0.8;

export interface ChordLock {
  mode: JoystickMode;
  direction: Direction;
}

export interface SlotSettings {
  inversion: number;
  lock: ChordLock | null;
}

export interface State {
  key: number;
  octave: number;
  joystickMode: JoystickMode;
  playMode: PlayMode;
  strumSpeed: number;
  arpPattern: number;
  bpm: number;
  preset: number;
  presetCount: number;
  /** Held chord degrees, in press order; the last one sounds. */
  held: number[];
  direction: Direction | null;
  shift: boolean;
  slots: SlotSettings[];
  fxPage: number;
  fx: Record<FxParam, number>;
  /** Incremented on each fresh chord press so the player re-strikes it. */
  trigger: number;
}

export type DpadDirection = 'up' | 'down' | 'left' | 'right';

export type InputEvent =
  | { t: 'chordDown'; degree: number }
  | { t: 'chordUp'; degree: number }
  | { t: 'stick'; direction: Direction | null }
  | { t: 'shift'; down: boolean }
  | { t: 'lock' }
  | { t: 'dpad'; dir: DpadDirection }
  | { t: 'nextPlayMode' }
  | { t: 'nextJoystickMode' }
  | { t: 'nextFxPage' }
  /** Right stick deflection (-1..1, y up) held for `dt` seconds. */
  | { t: 'fxStick'; x: number; y: number; dt: number }
  | { t: 'setFx'; param: FxParam; value: number }
  | { t: 'setPreset'; index: number };

export function initialState(presetCount: number): State {
  return {
    key: 0,
    octave: 0,
    joystickMode: 'default',
    playMode: 'play',
    strumSpeed: 1,
    arpPattern: 0,
    bpm: 100,
    preset: 0,
    presetCount,
    held: [],
    direction: null,
    shift: false,
    slots: Array.from({ length: DEGREE_COUNT }, () => ({ inversion: 0, lock: null })),
    fxPage: 0,
    fx: { ...FX_DEFAULTS },
    trigger: 0,
  };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const cycle = (i: number, n: number) => (i + 1) % n;
const wrap = (i: number, n: number) => ((i % n) + n) % n;

export const activeDegree = (s: State): number | null => s.held.at(-1) ?? null;

function updateSlot(s: State, degree: number, patch: Partial<SlotSettings>): SlotSettings[] {
  return s.slots.map((slot, i) => (i === degree ? { ...slot, ...patch } : slot));
}

export function reduce(s: State, e: InputEvent): State {
  switch (e.t) {
    case 'chordDown':
      return { ...s, held: [...s.held.filter((d) => d !== e.degree), e.degree], trigger: s.trigger + 1 };

    case 'chordUp':
      return s.held.includes(e.degree) ? { ...s, held: s.held.filter((d) => d !== e.degree) } : s;

    case 'stick': {
      if (e.direction === s.direction) return s;
      const next = { ...s, direction: e.direction };
      // Chromatic mode: with no chord held, flicking ←/→ transposes the key.
      if (s.joystickMode === 'chromatic' && s.held.length === 0) {
        if (e.direction === 'L') next.key = mod12(s.key - 1);
        if (e.direction === 'R') next.key = mod12(s.key + 1);
      }
      return next;
    }

    case 'shift': {
      const next = { ...s, shift: e.down };
      // Holding a chord and pressing shift cycles its inversion.
      const degree = activeDegree(s);
      if (e.down && degree !== null) {
        next.slots = updateSlot(s, degree, { inversion: cycle(s.slots[degree].inversion, INVERSION_COUNT) });
      }
      return next;
    }

    case 'lock': {
      const degree = activeDegree(s);
      if (degree === null) return s;
      const lock = s.direction ? { mode: s.joystickMode, direction: s.direction } : null;
      return { ...s, slots: updateSlot(s, degree, { lock }) };
    }

    case 'dpad':
      if (s.shift) {
        switch (e.dir) {
          case 'up':
            return { ...s, preset: wrap(s.preset + 1, s.presetCount) };
          case 'down':
            return { ...s, preset: wrap(s.preset - 1, s.presetCount) };
          case 'left':
            return { ...s, bpm: clamp(s.bpm - BPM_STEP, BPM_RANGE.min, BPM_RANGE.max) };
          case 'right':
            return { ...s, bpm: clamp(s.bpm + BPM_STEP, BPM_RANGE.min, BPM_RANGE.max) };
        }
      }
      switch (e.dir) {
        case 'up':
          return { ...s, octave: clamp(s.octave + 1, OCTAVE_RANGE.min, OCTAVE_RANGE.max) };
        case 'down':
          return { ...s, octave: clamp(s.octave - 1, OCTAVE_RANGE.min, OCTAVE_RANGE.max) };
        case 'left':
          return { ...s, key: mod12(s.key - 1) };
        case 'right':
          return { ...s, key: mod12(s.key + 1) };
      }
      break;

    case 'nextPlayMode':
      // With shift: cycle the current mode's option instead.
      if (s.shift && s.playMode === 'strum') return { ...s, strumSpeed: cycle(s.strumSpeed, STRUM_SPEEDS_MS.length) };
      if (s.shift && s.playMode === 'arp') return { ...s, arpPattern: cycle(s.arpPattern, ARP_PATTERNS.length) };
      return { ...s, playMode: PLAY_MODES[cycle(PLAY_MODES.indexOf(s.playMode), PLAY_MODES.length)] };

    case 'nextJoystickMode':
      return {
        ...s,
        joystickMode: JOYSTICK_MODES[cycle(JOYSTICK_MODES.indexOf(s.joystickMode), JOYSTICK_MODES.length)],
      };

    case 'nextFxPage':
      return { ...s, fxPage: cycle(s.fxPage, FX_PAGES.length) };

    case 'fxStick': {
      // Rate control: the value moves while the stick is pushed and stays put
      // when released. Squared response gives finer control near the centre.
      const [px, py] = FX_PAGES[s.fxPage];
      const rate = (v: number) => Math.sign(v) * v * v * FX_STICK_SPEED * e.dt;
      return {
        ...s,
        fx: { ...s.fx, [px]: clamp(s.fx[px] + rate(e.x), 0, 1), [py]: clamp(s.fx[py] + rate(e.y), 0, 1) },
      };
    }

    case 'setFx':
      return { ...s, fx: { ...s.fx, [e.param]: clamp(e.value, 0, 1) } };

    case 'setPreset':
      return { ...s, preset: wrap(e.index, s.presetCount) };
  }
  return s;
}

/** The chord `degree` plays right now: live stick direction first, then its lock. */
export function chordFor(s: State, degree: number, useStick: boolean): Chord {
  const slot = s.slots[degree];
  const live = useStick && s.direction ? { mode: s.joystickMode, direction: s.direction } : null;
  const mod = live ?? slot.lock;
  return buildChord({
    key: s.key,
    degree,
    octave: s.octave,
    mode: mod?.mode ?? s.joystickMode,
    direction: mod?.direction ?? null,
    inversion: slot.inversion,
  });
}

export function activeChord(s: State): Chord | null {
  const degree = activeDegree(s);
  return degree === null ? null : chordFor(s, degree, true);
}
