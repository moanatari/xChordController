import { DIRECTIONS, type Direction } from '../core/modifiers';

/** Deflection needed to enter a direction from the centre. */
export const ENTER_THRESHOLD = 0.5;
/** Deflection below which the stick is considered back at the centre. */
export const EXIT_THRESHOLD = 0.35;
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

  update(x: number, y: number): Direction | null {
    const magnitude = Math.hypot(x, y);
    if (this.current === null) {
      if (magnitude >= ENTER_THRESHOLD) this.current = directionFromAngle(angleOf(x, y));
      return this.current;
    }
    if (magnitude < EXIT_THRESHOLD) {
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
