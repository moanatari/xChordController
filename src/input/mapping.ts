import type { DpadDirection, InputEvent } from '../core/state';

export type ButtonAction =
  | { t: 'chord'; degree: number }
  | { t: 'shift' }
  | { t: 'lock' }
  | { t: 'dpad'; dir: DpadDirection }
  | { t: 'nextPlayMode' }
  | { t: 'nextJoystickMode' }
  | { t: 'nextFxPage' };

export interface ButtonBinding {
  label: string;
  action: ButtonAction;
}

// Indices of the W3C "standard" gamepad layout, which Chrome/Edge use for Xbox controllers.
export const XBOX_BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  View: 8,
  Menu: 9,
  L3: 10,
  R3: 11,
  Up: 12,
  Down: 13,
  Left: 14,
  Right: 15,
} as const;

export const XBOX_AXES = { leftX: 0, leftY: 1, rightX: 2, rightY: 3 } as const;

const B = XBOX_BUTTONS;

/**
 * Default layout: the most common chords (I IV V vi) sit under the right thumb,
 * the others on the shoulders so they stay playable while using the right stick.
 */
export const XBOX_MAPPING: Record<number, ButtonBinding> = {
  [B.A]: { label: 'A', action: { t: 'chord', degree: 0 } },
  [B.RB]: { label: 'RB', action: { t: 'chord', degree: 1 } },
  [B.RT]: { label: 'RT', action: { t: 'chord', degree: 2 } },
  [B.X]: { label: 'X', action: { t: 'chord', degree: 3 } },
  [B.B]: { label: 'B', action: { t: 'chord', degree: 4 } },
  [B.Y]: { label: 'Y', action: { t: 'chord', degree: 5 } },
  [B.LB]: { label: 'LB', action: { t: 'chord', degree: 6 } },
  [B.LT]: { label: 'LT', action: { t: 'shift' } },
  [B.L3]: { label: 'L3', action: { t: 'lock' } },
  [B.R3]: { label: 'R3', action: { t: 'nextFxPage' } },
  [B.View]: { label: 'View', action: { t: 'nextPlayMode' } },
  [B.Menu]: { label: 'Menu', action: { t: 'nextJoystickMode' } },
  [B.Up]: { label: '↑', action: { t: 'dpad', dir: 'up' } },
  [B.Down]: { label: '↓', action: { t: 'dpad', dir: 'down' } },
  [B.Left]: { label: '←', action: { t: 'dpad', dir: 'left' } },
  [B.Right]: { label: '→', action: { t: 'dpad', dir: 'right' } },
};

/** Controller button label playing each degree, for the UI. */
export function chordButtonLabels(mapping: Record<number, ButtonBinding>): string[] {
  const labels: string[] = [];
  for (const { label, action } of Object.values(mapping)) {
    if (action.t === 'chord') labels[action.degree] = label;
  }
  return labels;
}

/** Event for a button edge, or null when the action only reacts to presses. */
export function actionEvent(action: ButtonAction, pressed: boolean): InputEvent | null {
  switch (action.t) {
    case 'chord':
      return { t: pressed ? 'chordDown' : 'chordUp', degree: action.degree };
    case 'shift':
      return { t: 'shift', down: pressed };
    case 'dpad':
      return pressed ? { t: 'dpad', dir: action.dir } : null;
    default:
      return pressed ? { t: action.t } : null;
  }
}
