import * as Tone from 'tone';
import type { FxParam } from '../core/state';

const RAMP = 0.03;
const CUTOFF_MIN = 80;
const CUTOFF_MAX = 18000;

/** Filter LP → Chorus → Delay (tempo-synced) → Reverb → Limiter → speakers. */
export class FxChain {
  readonly input: Tone.Filter;
  private chorus: Tone.Chorus;
  private delay: Tone.FeedbackDelay;
  private reverb: Tone.Reverb;

  constructor() {
    this.input = new Tone.Filter({ type: 'lowpass', rolloff: -24 });
    this.chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0 }).start();
    this.delay = new Tone.FeedbackDelay({ delayTime: '8n', wet: 0 });
    this.reverb = new Tone.Reverb({ decay: 4, preDelay: 0.02, wet: 0 });
    const limiter = new Tone.Limiter(-1).toDestination();
    this.input.chain(this.chorus, this.delay, this.reverb, limiter);
  }

  /** `value` is normalized 0..1. */
  set(param: FxParam, value: number): void {
    switch (param) {
      case 'cutoff':
        this.input.frequency.rampTo(CUTOFF_MIN * (CUTOFF_MAX / CUTOFF_MIN) ** value, RAMP);
        break;
      case 'resonance':
        this.input.Q.rampTo(0.5 + value * 14.5, RAMP);
        break;
      case 'delayMix':
        this.delay.wet.rampTo(value * 0.7, RAMP);
        break;
      case 'delayFeedback':
        this.delay.feedback.rampTo(value * 0.85, RAMP);
        break;
      case 'reverbMix':
        this.reverb.wet.rampTo(value * 0.8, RAMP);
        break;
      case 'chorusMix':
        this.chorus.wet.rampTo(value, RAMP);
        break;
    }
  }

  /** Call after the transport BPM changed to keep the delay on the beat. */
  syncTempo(): void {
    this.delay.delayTime.rampTo(Tone.Time('8n').toSeconds(), RAMP);
  }
}
