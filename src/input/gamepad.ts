import type { InputEvent } from '../core/state';
import { XBOX_AXES, XBOX_BUTTONS, actionEvent, type ButtonBinding } from './mapping';
import { StickQuantizer } from './stick';

/** Right-stick deadzone; below it the stick sends nothing. */
const RIGHT_DEADZONE = 0.15;
/** Analog triggers: press/release thresholds (hysteresis). */
const TRIGGER_PRESS = 0.4;
const TRIGGER_RELEASE = 0.25;
const TRIGGERS: readonly number[] = [XBOX_BUTTONS.LT, XBOX_BUTTONS.RT];

/** Polls the Gamepad API (call once per frame) and turns it into input events. */
export class GamepadInput {
  private pressed: boolean[] = [];
  private stick = new StickQuantizer();
  private index: number | null = null;
  name: string | null = null;

  constructor(
    private mapping: Record<number, ButtonBinding>,
    private emit: (e: InputEvent) => void,
  ) {}

  poll(dt: number): void {
    const pad = this.pick();
    if (!pad) {
      if (this.index !== null) this.disconnect();
      return;
    }
    this.index = pad.index;
    this.name = pad.id;

    pad.buttons.forEach((button, i) => {
      const was = this.pressed[i] ?? false;
      const is = TRIGGERS.includes(i)
        ? button.value > (was ? TRIGGER_RELEASE : TRIGGER_PRESS)
        : button.pressed;
      if (is !== was) {
        this.pressed[i] = is;
        this.fire(i, is);
      }
    });

    const before = this.stick.current;
    const direction = this.stick.update(pad.axes[XBOX_AXES.leftX], -pad.axes[XBOX_AXES.leftY]);
    if (direction !== before) this.emit({ t: 'stick', direction });

    const rx = pad.axes[XBOX_AXES.rightX];
    const ry = -pad.axes[XBOX_AXES.rightY];
    if (Math.hypot(rx, ry) > RIGHT_DEADZONE) this.emit({ t: 'fxStick', x: rx, y: ry, dt });
  }

  private pick(): Gamepad | null {
    const pads = navigator.getGamepads().filter((p): p is Gamepad => p !== null && p.connected);
    return pads.find((p) => p.index === this.index) ?? pads.find((p) => p.mapping === 'standard') ?? pads[0] ?? null;
  }

  private fire(button: number, pressed: boolean): void {
    const binding = this.mapping[button];
    const event = binding && actionEvent(binding.action, pressed);
    if (event) this.emit(event);
  }

  /** Release everything that was held so no chord gets stuck. */
  private disconnect(): void {
    this.pressed.forEach((was, i) => was && this.fire(i, false));
    this.pressed = [];
    if (this.stick.current !== null) this.emit({ t: 'stick', direction: null });
    this.stick = new StickQuantizer();
    this.index = null;
    this.name = null;
  }
}
