import * as Tone from 'tone';

export type PolyVoice = Tone.PolySynth<Tone.Synth> | Tone.PolySynth<Tone.FMSynth>;

export interface Preset {
  name: string;
  create: () => PolyVoice;
}

export const PRESETS: readonly Preset[] = [
  {
    name: 'Saw Pad',
    create: () =>
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 24 },
        envelope: { attack: 0.04, decay: 0.3, sustain: 0.7, release: 1.2 },
        volume: -16,
      }),
  },
  {
    name: 'FM E.Piano',
    create: () =>
      new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 8,
        oscillator: { type: 'sine' },
        modulation: { type: 'sine' },
        envelope: { attack: 0.002, decay: 1.6, sustain: 0.15, release: 1.2 },
        modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.2 },
        volume: -12,
      }),
  },
  {
    name: 'Sine',
    create: () =>
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.8, release: 0.8 },
        volume: -10,
      }),
  },
  {
    name: 'Square Pluck',
    create: () =>
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.002, decay: 0.3, sustain: 0.05, release: 0.3 },
        volume: -18,
      }),
  },
  {
    name: 'FM Bell',
    create: () =>
      new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3.5,
        modulationIndex: 12,
        envelope: { attack: 0.001, decay: 2.5, sustain: 0, release: 2 },
        modulationEnvelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 1 },
        volume: -14,
      }),
  },
  {
    name: 'Triangle',
    create: () =>
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: 0.6 },
        volume: -10,
      }),
  },
];
