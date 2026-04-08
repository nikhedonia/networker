import { describe, it, expect } from 'vitest';
import {
  Cell,
  SOURCE,
  SINK,
  findPossiblyConnected,
  validateGame,
  generateRandomGame,
  generateGame,
} from '../game';

// Helper to build a minimal cell
function cell(kind: Cell['kind'], rotation: number, sinkOrSource: 0 | 1 | 2 = 0): Cell {
  return { kind, rotation, sinkOrSource, connected: false };
}

describe('findPossiblyConnected', () => {
  const grid = (c: Cell) => [[c]]; // 1x1 grid with the cell at [0,0]

  describe('X (endpoint) cell', () => {
    it('rotation 0 → points down (y+1)', () => {
      const cells = [[cell('X', 0)]];
      expect(findPossiblyConnected(cells, [0, 0])).toEqual([[0, 1]]);
    });
    it('rotation 1 → points left (x-1)', () => {
      const cells = [[cell('X', 1)]];
      expect(findPossiblyConnected(cells, [0, 0])).toEqual([[-1, 0]]);
    });
    it('rotation 2 → points up (y-1)', () => {
      const cells = [[cell('X', 2)]];
      expect(findPossiblyConnected(cells, [0, 0])).toEqual([[0, -1]]);
    });
    it('rotation 3 → points right (x+1)', () => {
      const cells = [[cell('X', 3)]];
      expect(findPossiblyConnected(cells, [0, 0])).toEqual([[1, 0]]);
    });
  });

  describe('I (straight) cell', () => {
    it('rotation 0 → vertical (up and down)', () => {
      const cells = [[cell('I', 0)]];
      const result = findPossiblyConnected(cells, [0, 0]);
      expect(result).toContainEqual([0, 1]);
      expect(result).toContainEqual([0, -1]);
    });
    it('rotation 1 → horizontal (left and right)', () => {
      const cells = [[cell('I', 1)]];
      const result = findPossiblyConnected(cells, [0, 0]);
      expect(result).toContainEqual([-1, 0]);
      expect(result).toContainEqual([1, 0]);
    });
    it('rotation 2 → same as rotation 0 (vertical)', () => {
      const cells0 = [[cell('I', 0)]];
      const cells2 = [[cell('I', 2)]];
      expect(findPossiblyConnected(cells0, [0, 0])).toEqual(findPossiblyConnected(cells2, [0, 0]));
    });
  });

  describe('L (corner) cell', () => {
    it('rotation 0 → up and right', () => {
      const cells = [[cell('L', 0)]];
      const result = findPossiblyConnected(cells, [0, 0]);
      expect(result).toContainEqual([0, -1]);
      expect(result).toContainEqual([1, 0]);
    });
    it('rotation 2 → down and left', () => {
      const cells = [[cell('L', 2)]];
      const result = findPossiblyConnected(cells, [0, 0]);
      expect(result).toContainEqual([-1, 0]);
      expect(result).toContainEqual([0, 1]);
    });
  });

  describe('T (tee) cell', () => {
    it('rotation 0 → left, right, down', () => {
      const cells = [[cell('T', 0)]];
      const result = findPossiblyConnected(cells, [0, 0]);
      expect(result).toContainEqual([-1, 0]);
      expect(result).toContainEqual([1, 0]);
      expect(result).toContainEqual([0, 1]);
      expect(result).toHaveLength(3);
    });
  });

  describe('P (plus/cross) cell', () => {
    it('always connects all 4 directions', () => {
      for (let rotation = 0; rotation < 4; rotation++) {
        const cells = [[cell('P', rotation)]];
        const result = findPossiblyConnected(cells, [0, 0]);
        expect(result).toContainEqual([-1, 0]);
        expect(result).toContainEqual([1, 0]);
        expect(result).toContainEqual([0, -1]);
        expect(result).toContainEqual([0, 1]);
      }
    });
  });

  it('returns [] for out-of-bounds coordinates', () => {
    const cells = [[cell('I', 0)]];
    expect(findPossiblyConnected(cells, [5, 5])).toEqual([]);
  });
});

describe('validateGame', () => {
  it('marks game done when all sinks are reachable from source', () => {
    // 1x3 grid: source (I,0) → I(0) → sink (X,2)
    // I rotation 0 = up/down. Let's use a horizontal chain:
    // source I rotation 1 (left/right), plain I rotation 1, sink X rotation 3 (right)
    const row: Cell[] = [
      { kind: 'I', rotation: 1, sinkOrSource: SOURCE, connected: false }, // [0,0] → connects left/right
      { kind: 'I', rotation: 1, sinkOrSource: 0, connected: false },      // [1,0] → connects left/right
      { kind: 'X', rotation: 1, sinkOrSource: SINK, connected: false },   // [2,0] X rotation 1 → points left
    ];
    const result = validateGame([row]);
    expect(result.done).toBe(true);
    expect(result.connected.has('0-0')).toBe(true);
    expect(result.connected.has('1-0')).toBe(true);
    expect(result.connected.has('2-0')).toBe(true);
  });

  it('marks game not done when a sink is unreachable', () => {
    // Source at [0,0] (X pointing right rotation 3), sink at [1,0] (X pointing right rotation 3 - away from source)
    const row: Cell[] = [
      { kind: 'X', rotation: 3, sinkOrSource: SOURCE, connected: false }, // points right
      { kind: 'X', rotation: 3, sinkOrSource: SINK, connected: false },   // also points right (away from source)
    ];
    const result = validateGame([row]);
    expect(result.done).toBe(false);
  });

  it('connected set contains source even if isolated', () => {
    const row: Cell[] = [
      { kind: 'X', rotation: 2, sinkOrSource: SOURCE, connected: false }, // points up (nothing above in 1-row grid)
    ];
    const result = validateGame([row]);
    expect(result.connected.has('0-0')).toBe(true);
  });

  it('marks done with no sinks (trivially complete)', () => {
    const row: Cell[] = [
      { kind: 'I', rotation: 0, sinkOrSource: SOURCE, connected: false },
    ];
    const result = validateGame([row]);
    expect(result.done).toBe(true);
  });
});

describe('generateRandomGame', () => {
  it('returns a 2D grid of the correct size', () => {
    const grid = generateRandomGame(42, 3, 2);
    expect(grid).toHaveLength(3);
    expect(grid[0]).toHaveLength(3);
  });

  it('each cell has required properties', () => {
    const grid = generateRandomGame(42, 3, 2);
    for (const row of grid) {
      for (const c of row) {
        expect(c).toHaveProperty('kind');
        expect(c).toHaveProperty('rotation');
        expect(c).toHaveProperty('sinkOrSource');
        expect(c).toHaveProperty('connected');
        expect(['X', 'I', 'L', 'T', 'P']).toContain(c.kind);
      }
    }
  });

  it('produces deterministic output for the same seed', () => {
    const g1 = generateRandomGame(123, 4, 3);
    const g2 = generateRandomGame(123, 4, 3);
    expect(JSON.stringify(g1)).toBe(JSON.stringify(g2));
  });

  it('produces different output for different seeds', () => {
    const g1 = generateRandomGame(1, 4, 3);
    const g2 = generateRandomGame(2, 4, 3);
    expect(JSON.stringify(g1)).not.toBe(JSON.stringify(g2));
  });

  it('has exactly the requested number of sources', () => {
    const grid = generateRandomGame(42, 4, 3, 2);
    const sources = grid.flat().filter(c => c.sinkOrSource === SOURCE);
    expect(sources).toHaveLength(2);
  });
});

describe('generateGame', () => {
  it('returns an object with done, cells, and connected', () => {
    const result = generateGame(15, 'test-seed');
    expect(result).toHaveProperty('done');
    expect(result).toHaveProperty('cells');
    expect(result).toHaveProperty('connected');
    expect(typeof result.done).toBe('boolean');
    expect(Array.isArray(result.cells)).toBe(true);
    expect(result.connected).toBeInstanceOf(Set);
  });

  it('generates a game with cells forming a grid', () => {
    const result = generateGame(15, 'networker');
    expect(result.cells.length).toBeGreaterThan(0);
    expect(result.cells[0].length).toBeGreaterThan(0);
  });

  it('is deterministic for the same name and level', () => {
    const r1 = generateGame(15, 'same-name');
    const r2 = generateGame(15, 'same-name');
    expect(JSON.stringify(r1.cells)).toBe(JSON.stringify(r2.cells));
  });
});
