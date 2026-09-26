// Keyboard fallback to play without a controller.
import type { Direction } from '../core/modifiers';
import type { InputEvent } from '../core/state';
import { actionEvent, type ButtonAction } from './mapping';
import { angleOf, directionFromAngle } from './stick';

export const KEYBOARD_MAPPING: Record<string, { label: string; action: ButtonAction }> = {
  Digit1: { label: '1', action: { t: 'chord', degree: 0 } },
  Digit2: { label: '2', action: { t: 'chord', degree: 1 } },
  Digit3: { label: '3', action: { t: 'chord', degree: 2 } },
  Digit4: { label: '4', action: { t: 'chord', degree: 3 } },
  Digit5: { label: '5', action: { t: 'chord', degree: 4 } },
  Digit6: { label: '6', action: { t: 'chord', degree: 5 } },
  Digit7: { label: '7', action: { t: 'chord', degree: 6 } },
  Space: { label: 'Espace', action: { t: 'shift' } },
  KeyE: { label: 'E', action: { t: 'lock' } },
  KeyP: { label: 'P', action: { t: 'nextPlayMode' } },
  KeyM: { label: 'M', action: { t: 'nextJoystickMode' } },
  KeyF: { label: 'F', action: { t: 'nextFxPage' } },
  KeyW: { label: 'W', action: { t: 'dpad', dir: 'up' } },
  KeyS: { label: 'S', action: { t: 'dpad', dir: 'down' } },
  KeyA: { label: 'A', action: { t: 'dpad', dir: 'left' } },
  KeyD: { label: 'D', action: { t: 'dpad', dir: 'right' } },
};

/** Arrow keys act as the left stick; two arrows together give a diagonal. */
const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

export function attachKeyboard(target: Window, emit: (e: InputEvent) => void): void {
  const held = new Set<string>();
  let direction: Direction | null = null;

  const updateStick = () => {
    let x = 0;
    let y = 0;
    for (const code of held) {
      const arrow = ARROWS[code];
      if (arrow) [x, y] = [x + arrow[0], y + arrow[1]];
    }
    const next = x === 0 && y === 0 ? null : directionFromAngle(angleOf(x, y));
    if (next !== direction) {
      direction = next;
      emit({ t: 'stick', direction });
    }
  };

  const handle = (code: string, pressed: boolean) => {
    if (ARROWS[code]) return updateStick();
    const binding = KEYBOARD_MAPPING[code];
    const event = binding && actionEvent(binding.action, pressed);
    if (event) emit(event);
  };

  target.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLSelectElement) return;
    if (!(e.code in ARROWS) && !(e.code in KEYBOARD_MAPPING)) return;
    e.preventDefault();
    if (e.repeat || held.has(e.code)) return;
    held.add(e.code);
    handle(e.code, true);
  });

  target.addEventListener('keyup', (e) => {
    if (!held.delete(e.code)) return;
    handle(e.code, false);
  });

  target.addEventListener('blur', () => {
    const codes = [...held];
    held.clear();
    codes.forEach((code) => handle(code, false));
  });
}
