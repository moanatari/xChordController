import * as Tone from 'tone';
import type { FxChain } from './fx';
import { PRESETS, type PolyVoice } from './presets';

/** Receives note events at AudioContext times. Implemented by the synth and MIDI out. */
export interface NoteSink {
  noteOn(note: number, time: number): void;
  noteOff(note: number, time: number): void;
  allOff(): void;
}

const VELOCITY = 0.8;
/** Old synth is disposed after its release tail has had time to ring out. */
const DISPOSE_DELAY_MS = 6000;

export class SynthEngine implements NoteSink {
  private synth: PolyVoice;

  constructor(
    private fx: FxChain,
    preset: number,
  ) {
    this.synth = this.load(preset);
  }

  setPreset(index: number): void {
    const old = this.synth;
    old.releaseAll();
    setTimeout(() => old.dispose(), DISPOSE_DELAY_MS);
    this.synth = this.load(index);
  }

  noteOn(note: number, time: number): void {
    this.synth.triggerAttack(Tone.Frequency(note, 'midi').toFrequency(), time, VELOCITY);
  }

  noteOff(note: number, time: number): void {
    this.synth.triggerRelease(Tone.Frequency(note, 'midi').toFrequency(), time);
  }

  allOff(): void {
    this.synth.releaseAll();
  }

  private load(index: number): PolyVoice {
    const synth = PRESETS[index].create();
    synth.maxPolyphony = 24;
    synth.connect(this.fx.input);
    return synth;
  }
}
