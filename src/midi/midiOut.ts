import type { NoteSink } from '../audio/engine';
import type { FxParam } from '../core/state';

const CHANNEL = 0; // MIDI channel 1
const VELOCITY = 100;
const NOTE_ON = 0x90 | CHANNEL;
const NOTE_OFF = 0x80 | CHANNEL;
const CONTROL_CHANGE = 0xb0 | CHANNEL;
const ALL_NOTES_OFF = 123;

/** CC number sent for each effect parameter. */
export const FX_CC: Record<FxParam, number> = {
  cutoff: 74,
  resonance: 71,
  delayMix: 94,
  delayFeedback: 95,
  reverbMix: 91,
  chorusMix: 93,
};

export interface MidiPort {
  id: string;
  name: string;
}

/**
 * Web MIDI output. On Windows, loopMIDI provides a virtual port a DAW can listen to.
 * `toTimestamp` converts an AudioContext time to a performance.now() timestamp.
 */
export class MidiOut implements NoteSink {
  private output: MIDIOutput | null = null;
  private lastCc = new Map<number, number>();

  private constructor(
    private access: MIDIAccess,
    private toTimestamp: (audioTime: number) => number,
  ) {}

  static async create(toTimestamp: (audioTime: number) => number): Promise<MidiOut | null> {
    if (!('requestMIDIAccess' in navigator)) return null;
    try {
      return new MidiOut(await navigator.requestMIDIAccess(), toTimestamp);
    } catch {
      return null;
    }
  }

  get ports(): MidiPort[] {
    return [...this.access.outputs.values()].map((o) => ({ id: o.id, name: o.name ?? o.id }));
  }

  get selected(): string | null {
    return this.output?.id ?? null;
  }

  onPortsChange(callback: () => void): void {
    this.access.addEventListener('statechange', callback);
  }

  select(id: string | null): void {
    this.allOff();
    this.output = (id && this.access.outputs.get(id)) || null;
    this.lastCc.clear();
  }

  noteOn(note: number, time: number): void {
    this.output?.send([NOTE_ON, note, VELOCITY], this.toTimestamp(time));
  }

  noteOff(note: number, time: number): void {
    this.output?.send([NOTE_OFF, note, 0], this.toTimestamp(time));
  }

  allOff(): void {
    this.output?.send([CONTROL_CHANGE, ALL_NOTES_OFF, 0]);
  }

  /** Sends the CC only when its 7-bit value actually changes. */
  fx(param: FxParam, value: number): void {
    if (!this.output) return;
    const cc = FX_CC[param];
    const v = Math.round(value * 127);
    if (this.lastCc.get(cc) === v) return;
    this.lastCc.set(cc, v);
    this.output.send([CONTROL_CHANGE, cc, v]);
  }
}
