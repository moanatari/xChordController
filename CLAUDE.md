# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**xChord controller**: a browser app that turns an Xbox One controller into a chord instrument. 7 buttons play the diatonic chords of the key, the left stick alters the held chord (8 directions × 3 modes), and the right stick drives effects. Sound comes from a built-in Tone.js synth and is mirrored to Web MIDI.

- The product name is "xChord controller". Do not mention or link the hardware product that inspired it anywhere: code, UI, docs or comments.
- UI text and the docs (`README.md`, `PLAN.md`) are in French. Code and comments are in English.
- `PLAN.md` holds the plan, the step checklist and the V2/V3 ideas. Update it when a step is done or the scope changes.
- A native port (Rust or JUCE) is planned later. That is why `src/core/` must stay portable (see Architecture).

## Commands

```bash
npm run dev                                  # Vite dev server on http://localhost:5173 (Chrome/Edge only)
npm test                                     # all Vitest tests, run once
npx vitest run tests/core/state.test.ts      # a single file
npx vitest run -t "locks and unlocks"        # a single test, by name
npx tsc -p .                                 # typecheck only (TypeScript 7, no emit)
npm run build                                # tsc + vite build into dist/
```

- There is no linter or formatter configured.
- Tests live in `tests/` and mirror `src/`. They only cover the pure modules: `core/*` and `input/stick.ts`. The audio, MIDI and UI layers need a real browser and are tested by hand. In the browser, audio starts only after the "Démarrer" click, and the controller is detected only after a button press.

## Architecture

### Data flow

Data moves in one direction, and every side effect is derived from a state diff:

1. The input sources produce abstract `InputEvent`s (defined in `src/core/state.ts`):
   - `input/gamepad.ts`, polled once per frame from the rAF loop in `main.ts`
   - `input/keyboard.ts`
   - the UI's pads and sliders
2. `main.ts`'s `dispatch()` runs the pure `reduce(state, event)`.
3. `applyToAudio(prev, next)` compares the old and new `State` and derives the side effects:
   - BPM
   - effect params, sent both to `FxChain` and to MIDI CCs
   - play mode
   - preset
   - chord notes
4. The UI is re-rendered from the whole state on the next frame when `dirty` is set.

To add a behavior, you usually:

1. add an event variant to `InputEvent`,
2. handle it in `reduce`,
3. derive its effect in `applyToAudio`,
4. bind it in `input/mapping.ts` (gamepad) and/or `KEYBOARD_MAPPING` in `input/keyboard.ts`.

### `src/core/` is pure

It must not import Tone.js or touch any DOM or browser API. It is the portable spec for the native port.

- `modifiers.ts` is data:
  - `SHAPES` lists the chord shapes as intervals + symbol.
  - `MODIFIERS[mode][direction]` gives the shape per base quality (maj/min/dim).
  - Change the harmony here, not in the logic.
- `chord.ts` `buildChord()` turns (key, degree, octave, mode, direction, inversion) into ascending MIDI notes plus a name.
  - Register: the tonic sits at C3–F3 for keys C–F and at F#2–B2 for keys F#–B, and the degrees ascend from the tonic.
  - Inverted chords are named as slash chords.
- `state.ts`:
  - `held` is a stack of pressed degrees. The last one sounds, and releasing it falls back to the one still held.
  - The chord that sounds is resolved by `chordFor()`: the live stick direction wins, then the slot's `lock`, then the plain triad.
  - `trigger` increments on every fresh chord press. It is the only signal telling the player to re-strike, even when the notes are identical. Stick moves, inversions and key changes do not bump it, so the notes change by diff instead.
  - The right stick is **rate-controlled**: the `fxStick` event integrates `x·|x|·speed·dt`, so values stay put when the stick is released.

### Audio and MIDI

- The `NoteSink` interface (`audio/engine.ts`) is implemented by both `SynthEngine` and `MidiOut`. `Performer` (`audio/playModes.ts`) sends identical note events to every sink.
- Times are AudioContext seconds.
  - Live notes use `Tone.immediate()`. Only the arpeggiator (`Tone.Loop` on the Transport) is scheduled ahead.
  - `MidiOut` converts audio times into `performance.now()` timestamps through the `toTimestamp` function injected in `main.ts`.
- `Performer`:
  - Keeps the set of sounding notes and applies diffs. With a new `trigger`, it releases every note and strikes them again.
  - In strum mode, the note-ons are staggered.
  - A note's release is clamped to after its scheduled attack. Without that, a quick release during a strum would leave a stuck note on the PolySynth.
- Switching preset replaces the PolySynth and disposes the old one after its release tail. `main.ts` then force-re-strikes the held chord so it keeps sounding.

### Input

- `input/mapping.ts` holds the Xbox button layout, using the W3C "standard" gamepad indices. `chordButtonLabels()` feeds the UI pad labels from it.
- The analog triggers (LT/RT) use press/release thresholds with hysteresis.
- `StickQuantizer` (`input/stick.ts`) applies hysteresis twice:
  - on magnitude: enter the direction at 0.5, leave it below 0.35;
  - on angle: ±10° past a sector edge before switching direction.
- The y axis is flipped to up-positive before it reaches the quantizer.
