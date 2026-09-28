import { DIRECTIONS, type Direction } from '../core/modifiers';

/** Default deadzone: deflection needed to enter a direction from the centre. */
export const DEFAULT_DEADZONE = 0.5;
export const DEADZONE_RANGE = { min: 0.15, max: 0.85 } as const;
/** The stick returns to the centre below this fraction of the deadzone (magnitude hysteresis). */
const EXIT_RATIO = 0.7;
/** Deflection below which the stick is considered back at the centre. */
export const exitThreshold = (deadzone: number) => deadzone * EXIT_RATIO;
/** Extra degrees past a sector edge before switching direction, to avoid flicker on diagonals. */
export const ANGLE_HYSTERESIS = 10;

const SECTOR = 360 / DIRECTIONS.length;

/** `x` right-positive, `y` up-positive. */
export function angleOf(x: number, y: number): number {
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function directionFromAngle(deg: number): Direction {
  const index = Math.round((((deg % 360) + 360) % 360) / SECTOR) % DIRECTIONS.length;
  return DIRECTIONS[index];
}

const angularDistance = (a: number, b: number) => {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
};

/** Quantizes an analog stick into 8 directions with magnitude and angle hysteresis. */
export class StickQuantizer {
  current: Direction | null = null;

  constructor(public deadzone = DEFAULT_DEADZONE) {}

  update(x: number, y: number): Direction | null {
    const magnitude = Math.hypot(x, y);
    if (this.current === null) {
      if (magnitude >= this.deadzone) this.current = directionFromAngle(angleOf(x, y));
      return this.current;
    }
    if (magnitude < exitThreshold(this.deadzone)) {
      this.current = null;
      return null;
    }
    const angle = angleOf(x, y);
    const centre = DIRECTIONS.indexOf(this.current) * SECTOR;
    if (angularDistance(angle, centre) > SECTOR / 2 + ANGLE_HYSTERESIS) {
      this.current = directionFromAngle(angle);
    }
    return this.current;
  }
}
