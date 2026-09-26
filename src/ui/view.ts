import { ARP_PATTERNS } from '../core/arp';
import { MODIFIERS, type Direction } from '../core/modifiers';
import {
  FX_PAGES,
  STRUM_SPEEDS_MS,
  activeChord,
  activeDegree,
  chordFor,
  type FxParam,
  type State,
} from '../core/state';
import { DEGREE_COUNT, ROMAN_NUMERALS, noteName } from '../core/theory';

export interface ViewInfo {
  audioStarted: boolean;
  gamepad: string | null;
  /** null until audio is started (MIDI access is requested then). */
  midi: { available: boolean; ports: { id: string; name: string }[]; selected: string | null } | null;
}

export interface ViewCallbacks {
  onStart(): void;
  onPad(degree: number, down: boolean): void;
  onFx(param: FxParam, value: number): void;
  onPreset(index: number): void;
  onMidiSelect(id: string | null): void;
}

export interface ViewOptions {
  presets: readonly string[];
  /** Controller button playing each degree. */
  padButtons: readonly string[];
}

// 3×3 compass layout; null is the centre.
const COMPASS: (Direction | null)[] = ['UL', 'U', 'UR', 'L', null, 'R', 'DL', 'D', 'DR'];
const ARROWS: Record<Direction, string> = { U: '↑', UR: '↗', R: '→', DR: '↘', D: '↓', DL: '↙', L: '←', UL: '↖' };

const FX_PAGE_TITLES = ['Filtre', 'Delay', 'Reverb · Chorus'];
const FX_LABELS: Record<FxParam, string> = {
  cutoff: 'Cutoff',
  resonance: 'Résonance',
  delayMix: 'Mix',
  delayFeedback: 'Feedback',
  reverbMix: 'Reverb',
  chorusMix: 'Chorus',
};
const STRUM_NAMES = ['rapide', 'moyen', 'lent'];
const MODE_NAMES = { default: 'Default', extended: 'Extended', chromatic: 'Chromatic' };

const HELP = `
  <div>
    <h3>Manette</h3>
    <ul>
      <li><kbd>A</kbd><kbd>RB</kbd><kbd>RT</kbd><kbd>X</kbd><kbd>B</kbd><kbd>Y</kbd><kbd>LB</kbd> accords I → vii°</li>
      <li><kbd>Stick G</kbd> modifie l'accord tenu</li>
      <li><kbd>L3</kbd> verrouille la modif sur l'accord (stick au centre : déverrouille)</li>
      <li>Accord tenu + <kbd>LT</kbd> inversion suivante</li>
      <li><kbd>←</kbd><kbd>→</kbd> tonalité · <kbd>↑</kbd><kbd>↓</kbd> octave</li>
      <li><kbd>LT</kbd> + <kbd>↑</kbd><kbd>↓</kbd> son · <kbd>LT</kbd> + <kbd>←</kbd><kbd>→</kbd> BPM</li>
      <li><kbd>View</kbd> mode de jeu · <kbd>LT</kbd> + <kbd>View</kbd> vitesse strum / motif arp</li>
      <li><kbd>Menu</kbd> mode du joystick</li>
      <li><kbd>Stick D</kbd> effets (la valeur reste en place) · <kbd>R3</kbd> page suivante</li>
    </ul>
  </div>
  <div>
    <h3>Clavier</h3>
    <ul>
      <li><kbd>1</kbd>…<kbd>7</kbd> accords</li>
      <li><kbd>Flèches</kbd> stick gauche (2 flèches = diagonale)</li>
      <li><kbd>Espace</kbd> = LT · <kbd>E</kbd> = L3</li>
      <li><kbd>A</kbd><kbd>D</kbd> tonalité · <kbd>W</kbd><kbd>S</kbd> octave</li>
      <li><kbd>P</kbd> mode de jeu · <kbd>M</kbd> joystick · <kbd>F</kbd> page d'effets</li>
      <li>Souris : pads et curseurs cliquables</li>
    </ul>
  </div>`;

export function createView(root: HTMLElement, options: ViewOptions, callbacks: ViewCallbacks) {
  root.innerHTML = `
    <header class="top">
      <h1>xChord <span>controller</span></h1>
      <div class="status">
        <span class="pill" data-gamepad></span>
        <label class="midi">MIDI <select data-midi></select></label>
      </div>
    </header>
    <section class="stage">
      <div class="compass" data-compass>
        ${COMPASS.map((d) => `<div class="cell${d ? '' : ' centre'}" data-dir="${d ?? ''}"><b>${d ? ARROWS[d] : ''}</b><span></span></div>`).join('')}
      </div>
      <div class="screen">
        <div class="roman" data-roman></div>
        <div class="chord" data-chord></div>
        <div class="notes" data-notes></div>
        <dl class="readout">
          <div><dt>Tonalité</dt><dd data-key></dd></div>
          <div><dt>Octave</dt><dd data-octave></dd></div>
          <div><dt>BPM</dt><dd data-bpm></dd></div>
          <div><dt>Jeu</dt><dd data-play></dd></div>
          <div><dt>Joystick</dt><dd data-joy></dd></div>
          <div><dt>Son</dt><dd><select data-preset>${options.presets.map((p, i) => `<option value="${i}">${p}</option>`).join('')}</select></dd></div>
        </dl>
      </div>
    </section>
    <section class="pads" data-pads>
      ${Array.from({ length: DEGREE_COUNT }, (_, i) => `
        <button class="pad" data-degree="${i}">
          <span class="btn btn-${options.padButtons[i]}">${options.padButtons[i]}</span>
          <span class="pad-roman">${ROMAN_NUMERALS[i]}</span>
          <span class="pad-name"></span>
          <span class="pad-badges"></span>
        </button>`).join('')}
    </section>
    <section class="fx" data-fx>
      ${FX_PAGES.map((params, page) => `
        <div class="fx-page" data-page="${page}">
          <h3><small>${page + 1}</small> ${FX_PAGE_TITLES[page]}</h3>
          ${params.map((p, axis) => `
            <label><span>${FX_LABELS[p]} <i>${axis === 0 ? 'X' : 'Y'}</i></span>
              <input type="range" min="0" max="1" step="0.001" data-param="${p}">
            </label>`).join('')}
        </div>`).join('')}
    </section>
    <section class="help">${HELP}</section>
    <div class="overlay" data-overlay>
      <button data-start>Démarrer</button>
      <p>Le navigateur exige un clic avant de jouer du son.<br>Branchez la manette et appuyez sur un bouton pour qu'elle soit détectée.</p>
    </div>`;

  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const $$ = <T extends Element = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];

  const cells = $$('[data-compass] .cell');
  const pads = $$<HTMLButtonElement>('.pad');
  const sliders = $$<HTMLInputElement>('input[data-param]');
  const fxPages = $$('.fx-page');
  const midiSelect = $<HTMLSelectElement>('[data-midi]');
  const presetSelect = $<HTMLSelectElement>('[data-preset]');

  $('[data-start]').addEventListener('click', () => callbacks.onStart());

  pads.forEach((pad, degree) => {
    let down = false;
    pad.addEventListener('pointerdown', (e) => {
      pad.setPointerCapture(e.pointerId);
      down = true;
      callbacks.onPad(degree, true);
    });
    const up = () => {
      if (!down) return;
      down = false;
      callbacks.onPad(degree, false);
    };
    pad.addEventListener('pointerup', up);
    pad.addEventListener('pointercancel', up);
  });

  sliders.forEach((s) =>
    s.addEventListener('input', () => callbacks.onFx(s.dataset.param as FxParam, s.valueAsNumber)),
  );
  presetSelect.addEventListener('change', () => callbacks.onPreset(Number(presetSelect.value)));
  midiSelect.addEventListener('change', () => callbacks.onMidiSelect(midiSelect.value || null));

  let midiPortsKey = '';

  function render(s: State, info: ViewInfo): void {
    $('[data-overlay]').hidden = info.audioStarted;

    const pill = $('[data-gamepad]');
    pill.textContent = info.gamepad ? `🎮 ${info.gamepad.replace(/\s*\(.*$/, '')}` : '🎮 Manette non détectée';
    pill.classList.toggle('ok', info.gamepad !== null);

    const ports = info.midi?.ports ?? [];
    const portsKey = JSON.stringify([info.midi?.available, ports]);
    if (portsKey !== midiPortsKey) {
      midiPortsKey = portsKey;
      const none = !info.midi ? 'démarrer d\'abord' : info.midi.available ? 'aucune sortie' : 'non supporté';
      midiSelect.innerHTML =
        `<option value="">— ${ports.length ? 'aucune' : none} —</option>` +
        ports.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');
    }
    midiSelect.value = info.midi?.selected ?? '';
    midiSelect.disabled = ports.length === 0;

    // Compass: labels depend on the joystick mode, highlight follows the stick.
    const degree = activeDegree(s);
    const lock = degree !== null ? s.slots[degree].lock : null;
    cells.forEach((cell) => {
      const dir = (cell.dataset.dir || null) as Direction | null;
      if (dir) {
        cell.querySelector('span')!.textContent = MODIFIERS[s.joystickMode][dir].label;
        cell.classList.toggle('active', s.direction === dir);
        cell.classList.toggle('locked', !s.direction && lock?.direction === dir && lock.mode === s.joystickMode);
      } else {
        cell.querySelector('span')!.textContent = MODE_NAMES[s.joystickMode];
      }
    });

    const chord = activeChord(s);
    $('[data-roman]').textContent = degree !== null ? ROMAN_NUMERALS[degree] : '';
    $('[data-chord]').textContent = chord?.name ?? '—';
    $('[data-notes]').textContent = chord ? chord.notes.map((n) => noteName(n) + (Math.floor(n / 12) - 1)).join(' · ') : '';

    $('[data-key]').textContent = `${noteName(s.key)} majeur`;
    $('[data-octave]').textContent = s.octave > 0 ? `+${s.octave}` : String(s.octave);
    $('[data-bpm]').textContent = String(s.bpm);
    $('[data-play]').textContent =
      s.playMode === 'play'
        ? 'Play'
        : s.playMode === 'strum'
          ? `Strum · ${STRUM_NAMES[s.strumSpeed]} (${STRUM_SPEEDS_MS[s.strumSpeed]} ms)`
          : `Arp · ${ARP_PATTERNS[s.arpPattern]}`;
    $('[data-joy]').textContent = MODE_NAMES[s.joystickMode];
    presetSelect.value = String(s.preset);

    pads.forEach((pad, i) => {
      const slot = s.slots[i];
      pad.querySelector('.pad-name')!.textContent = chordFor(s, i, false).name;
      const badges = [slot.lock ? `🔒 ${slot.lock.direction}` : '', slot.inversion ? `inv ${slot.inversion}` : ''];
      pad.querySelector('.pad-badges')!.textContent = badges.filter(Boolean).join(' · ');
      pad.classList.toggle('held', s.held.includes(i));
      pad.classList.toggle('active', degree === i);
    });

    fxPages.forEach((el, i) => el.classList.toggle('active', i === s.fxPage));
    sliders.forEach((el) => {
      if (!el.matches(':active')) el.valueAsNumber = s.fx[el.dataset.param as FxParam];
    });
  }

  return { render };
}
