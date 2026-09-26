import { describe, expect, it } from 'vitest';
import { StickQuantizer, directionFromAngle } from '../../src/input/stick';

describe('directionFromAngle', () => {
  it('maps angles to 8 sectors', () => {
    expect(directionFromAngle(0)).toBe('R');
    expect(directionFromAngle(44)).toBe('UR');
    expect(directionFromAngle(90)).toBe('U');
    expect(directionFromAngle(-90)).toBe('D');
    expect(directionFromAngle(180)).toBe('L');
    expect(directionFromAngle(-170)).toBe('L');
    expect(directionFromAngle(-135)).toBe('DL');
    expect(directionFromAngle(350)).toBe('R');
  });
});

describe('StickQuantizer', () => {
  it('needs a strong push to engage and a clear release to disengage', () => {
    const q = new StickQuantizer();
    expect(q.update(0.4, 0)).toBeNull();
    expect(q.update(0.6, 0)).toBe('R');
    expect(q.update(0.4, 0)).toBe('R');
    expect(q.update(0.2, 0)).toBeNull();
  });

  it('holds its direction slightly past a sector edge', () => {
    const q = new StickQuantizer();
    q.update(1, 0);
    const at = (deg: number) => q.update(Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180));
    expect(at(28)).toBe('R'); // past the 22.5° edge but within hysteresis
    expect(at(40)).toBe('UR');
    expect(at(18)).toBe('UR');
    expect(at(5)).toBe('R');
  });
});
