import * as Tone from 'tone';
import { FxChain } from './audio/fx';
import { SynthEngine, type NoteSink } from './audio/engine';
import { Performer, type PlaySettings } from './audio/playModes';
import { PRESETS } from './audio/presets';
import { FX_PARAMS, activeChord, initialState, reduce, type InputEvent, type State } from './core/state';
import { GamepadInput } from './input/gamepad';
import { attachKeyboard } from './input/keyboard';
import { XBOX_MAPPING, chordButtonLabels } from './input/mapping';
import { DEADZONE_RANGE, DEFAULT_DEADZONE } from './input/stick';
import { MidiOut } from './midi/midiOut';
import { createView, type StickSettings, type ViewInfo } from './ui/view';
import './ui/style.css';

// Small look-ahead: live notes use Tone.immediate(), only the arpeggiator is scheduled ahead.
Tone.setContext(new Tone.Context({ latencyHint: 'interactive', lookAhead: 0.03 }));

interface Audio {
  fx: FxChain;
  engine: SynthEngine;
  performer: Performer;
  midi: MidiOut | null;
}

let state = initialState(PRESETS.length);
let audio: Audio | null = null;
let dirty = true;

const playSettings = (s: State): PlaySettings => ({
  mode: s.playMode,
  strumSpeed: s.strumSpeed,
  arpPattern: s.arpPattern,
});

const STICK_SETTINGS_KEY = 'xchord.stick';

/** Controller settings survive reloads; storage may be unavailable, so fall back to defaults. */
function loadStickSettings(): StickSettings {
  const defaults: StickSettings = { deadzone: DEFAULT_DEADZONE, showPosition: true };
  try {
    const saved = JSON.parse(localStorage.getItem(STICK_SETTINGS_KEY) ?? '{}');
    const deadzone = typeof saved.deadzone === 'number' && Number.isFinite(saved.deadzone) ? saved.deadzone : defaults.deadzone;
    return {
      deadzone: Math.min(DEADZONE_RANGE.max, Math.max(DEADZONE_RANGE.min, deadzone)),
      showPosition: typeof saved.showPosition === 'boolean' ? saved.showPosition : defaults.showPosition,
    };
  } catch {
    return defaults;
  }
}

function saveStickSettings(settings: StickSettings): void {
  try {
    localStorage.setItem(STICK_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Not persisted; the setting still applies for this session.
  }
}

let stickSettings = loadStickSettings();

function setStickSettings(patch: Partial<StickSettings>): void {
  stickSettings = { ...stickSettings, ...patch };
  gamepad.deadzone = stickSettings.deadzone;
  saveStickSettings(stickSettings);
  dirty = true;
}

const chordNotes = (s: State): number[] => activeChord(s)?.notes ?? [];

const sameNotes = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((n, i) => n === b[i]);

function dispatch(event: InputEvent): void {
  const prev = state;
  state = reduce(state, event);
  if (state === prev) return;
  dirty = true;
  if (audio) applyToAudio(audio, prev, state);
}

/** Derives sound and MIDI side effects from a state transition. */
function applyToAudio({ fx, engine, performer, midi }: Audio, prev: State, next: State): void {
  if (next.bpm !== prev.bpm) {
    Tone.getTransport().bpm.value = next.bpm;
    fx.syncTempo();
  }
  for (const p of FX_PARAMS) {
    if (next.fx[p] !== prev.fx[p]) {
      fx.set(p, next.fx[p]);
      midi?.fx(p, next.fx[p]);
    }
  }
  if (next.playMode !== prev.playMode || next.strumSpeed !== prev.strumSpeed || next.arpPattern !== prev.arpPattern) {
    performer.setSettings(playSettings(next));
  }
  if (next.preset !== prev.preset) {
    engine.setPreset(next.preset);
    // Re-strike a held chord so it keeps sounding on the new preset.
    performer.update(chordNotes(next), next.trigger, true);
  }
  const notes = chordNotes(next);
  if (next.trigger !== prev.trigger || !sameNotes(notes, chordNotes(prev))) {
    performer.update(notes, next.trigger);
  }
}

async function startAudio(): Promise<void> {
  if (audio) return;
  await Tone.start();
  const fx = new FxChain();
  const engine = new SynthEngine(fx, state.preset);
  const midi = await MidiOut.create((time) => performance.now() + (time - Tone.immediate()) * 1000);
  const sinks: NoteSink[] = midi ? [engine, midi] : [engine];
  const performer = new Performer(sinks, playSettings(state));

  FX_PARAMS.forEach((p) => fx.set(p, state.fx[p]));
  Tone.getTransport().bpm.value = state.bpm;
  fx.syncTempo();
  Tone.getTransport().start();
  midi?.onPortsChange(() => (dirty = true));

  audio = { fx, engine, performer, midi };
  performer.update(chordNotes(state), state.trigger);
  dirty = true;
}

const view = createView(
  document.querySelector<HTMLElement>('#app')!,
  { presets: PRESETS.map((p) => p.name), padButtons: chordButtonLabels(XBOX_MAPPING) },
  {
    onStart: () => void startAudio(),
    onPad: (degree, down) => dispatch({ t: down ? 'chordDown' : 'chordUp', degree }),
    onFx: (param, value) => dispatch({ t: 'setFx', param, value }),
    onPreset: (index) => dispatch({ t: 'setPreset', index }),
    onMidiSelect: (id) => {
      audio?.midi?.select(id);
      if (audio?.midi) FX_PARAMS.forEach((p) => audio!.midi!.fx(p, state.fx[p]));
      dirty = true;
    },
    onDeadzone: (deadzone) => setStickSettings({ deadzone }),
    onShowStick: (showPosition) => setStickSettings({ showPosition }),
  },
);

const gamepad = new GamepadInput(XBOX_MAPPING, dispatch);
gamepad.deadzone = stickSettings.deadzone;
attachKeyboard(window, dispatch);
window.addEventListener('gamepadconnected', () => (dirty = true));
window.addEventListener('gamepaddisconnected', () => (dirty = true));

function viewInfo(): ViewInfo {
  const midi = audio?.midi;
  return {
    audioStarted: audio !== null,
    gamepad: gamepad.name,
    midi: audio ? { available: midi != null, ports: midi?.ports ?? [], selected: midi?.selected ?? null } : null,
    stick: stickSettings,
  };
}

let lastFrame = performance.now();
let lastGamepad: string | null = null;

function frame(now: number): void {
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  gamepad.poll(dt);
  if (gamepad.name !== lastGamepad) {
    lastGamepad = gamepad.name;
    dirty = true;
  }
  if (dirty) {
    dirty = false;
    view.render(state, viewInfo());
  }
  view.renderStick(stickSettings.showPosition ? gamepad.left : null);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
