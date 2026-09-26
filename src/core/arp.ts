export type ArpPattern = 'up' | 'down' | 'updown' | 'random';

export const ARP_PATTERNS: readonly ArpPattern[] = ['up', 'down', 'updown', 'random'];

/**
 * Ordered notes the arpeggiator steps through. `random` returns the notes
 * ascending; the player picks a random index instead of stepping.
 */
export function arpSequence(notes: readonly number[], pattern: ArpPattern): number[] {
  const up = [...notes].sort((a, b) => a - b);
  switch (pattern) {
    case 'up':
    case 'random':
      return up;
    case 'down':
      return up.reverse();
    case 'updown':
      return up.length < 3 ? up : [...up, ...up.slice(1, -1).reverse()];
  }
}
