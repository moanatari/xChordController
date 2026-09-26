import * as Tone from 'tone';
import { ARP_PATTERNS, arpSequence } from '../core/arp';
import { STRUM_SPEEDS_MS, type PlayMode } from '../core/state';
import type { NoteSink } from './engine';

export interface PlaySettings {
  mode: PlayMode;
  strumSpeed: number;
  arpPattern: number;
}

const ARP_RATE = '16n';
const ARP_GATE = 0.9;
/** Minimum gap between a note's attack and its release so a release never precedes a scheduled attack. */
const MIN_NOTE = 0.005;

/**
 * Turns "these notes should sound now" into timed note events for every sink,
 * according to the play mode (held chord, strum or arpeggio).
 */
export class Performer {
  private notes: number[] = [];
  /** Note → scheduled attack time, for play and strum modes. */
  private sounding = new Map<number, number>();
  private trigger = -1;
  private step = 0;

  constructor(
    private sinks: NoteSink[],
    private settings: PlaySettings,
  ) {
    new Tone.Loop((time) => this.arpTick(time), ARP_RATE).start(0);
  }

  setSettings(settings: PlaySettings): void {
    const modeChanged = settings.mode !== this.settings.mode;
    this.settings = settings;
    if (!modeChanged) return;
    this.stopAll();
    this.update(this.notes, this.trigger, true);
  }

  /** `trigger` changes on every fresh chord press, meaning "strike again" even if notes are equal. */
  update(notes: readonly number[], trigger: number, force = false): void {
    const retrigger = force || trigger !== this.trigger;
    this.trigger = trigger;
    this.notes = [...notes];
    if (this.settings.mode === 'arp') {
      if (retrigger) this.step = 0;
      return;
    }

    const now = Tone.immediate();
    let start = now;
    for (const note of [...this.sounding.keys()]) {
      if (retrigger || !notes.includes(note)) start = Math.max(start, this.release(note, now));
    }

    const spacing = this.settings.mode === 'strum' ? STRUM_SPEEDS_MS[this.settings.strumSpeed] / 1000 : 0;
    const toStart = notes.filter((n) => !this.sounding.has(n)).sort((a, b) => a - b);
    toStart.forEach((note, i) => {
      const time = start + i * spacing;
      this.sinks.forEach((s) => s.noteOn(note, time));
      this.sounding.set(note, time);
    });
  }

  stopAll(): void {
    this.sounding.clear();
    this.sinks.forEach((s) => s.allOff());
  }

  private release(note: number, now: number): number {
    const time = Math.max(now, (this.sounding.get(note) ?? now) + MIN_NOTE);
    this.sinks.forEach((s) => s.noteOff(note, time));
    this.sounding.delete(note);
    return time;
  }

  private arpTick(time: number): void {
    if (this.settings.mode !== 'arp' || this.notes.length === 0) return;
    const pattern = ARP_PATTERNS[this.settings.arpPattern];
    const sequence = arpSequence(this.notes, pattern);
    const index = pattern === 'random' ? Math.floor(Math.random() * sequence.length) : this.step % sequence.length;
    this.step++;
    const note = sequence[index];
    const length = Tone.Time(ARP_RATE).toSeconds() * ARP_GATE;
    this.sinks.forEach((s) => {
      s.noteOn(note, time);
      s.noteOff(note, time + length);
    });
  }
}
