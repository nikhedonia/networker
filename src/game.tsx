import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import generate from 'generate-maze';
import sillyName from 'sillyname';
import stringHash from 'string-hash';
import Rand from 'rand-seed';
import { analytics } from './analytics';
import { saveSession } from './storage';

// ─── Types & constants ──────────────────────────────────────────────────────────
export type CellType = "L" | "I" | "T" | 'X' | 'P';
export const SINK = 2;
export const SOURCE = 1;
export type Cell = {
  kind: CellType;
  rotation: number;
  sinkOrSource: 0 | 1 | 2;
  connected: boolean;
};

const centerColors = ['black', 'blue', 'red'];

// ─── SVG pipe shapes ─────────────────────────────────────────────────────────────
// Standard HTML SVG elements – valid on web inside an Animated.View (which renders
// as a <div> via react-native-web).

const CellX = (props: Cell) => (
  <>
    <rect x={1} y={1} width={1} height={1}
      stroke="white" strokeWidth={0.1}
      fill={props.connected ? '#afa' : centerColors[props.sinkOrSource]} />
    <rect x={1} y={2} width={1} height={1}
      stroke="white" strokeWidth={0.1}
      fill={props.connected ? '#afa' : 'black'} />
  </>
);

const CellL = (props: Cell) => (
  <>
    <rect x={1} y={0} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
    <rect x={1} y={1} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : centerColors[props.sinkOrSource]} />
    <rect x={2} y={1} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
  </>
);

const CellI = (props: Cell) => (
  <>
    <rect x={1} y={0} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
    <rect x={1} y={1} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : centerColors[props.sinkOrSource]} />
    <rect x={1} y={2} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
  </>
);

const CellT = (props: Cell) => (
  <>
    <rect x={0} y={1} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
    <rect x={1} y={1} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : centerColors[props.sinkOrSource]} />
    <rect x={2} y={1} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
    <rect x={1} y={2} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
  </>
);

const CellP = (props: Cell) => (
  <>
    <rect x={1} y={0} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
    <rect x={0} y={1} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
    <rect x={1} y={1} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : centerColors[props.sinkOrSource]} />
    <rect x={2} y={1} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
    <rect x={1} y={2} width={1} height={1} stroke="white" strokeWidth={0.1} fill={props.connected ? '#afa' : 'black'} />
  </>
);

const CellView = {
  I: CellI,
  L: CellL,
  T: CellT,
  X: CellX,
  P: CellP,
} as unknown as Record<CellType, React.FC<Cell>>;

// ─── Animated tile ───────────────────────────────────────────────────────────────
// rotation prop grows monotonically (0, 1, 2, 3, …) so toValue always increases,
// giving a consistent clockwise spin with no wrap-around discontinuity.
const CellComponent = (props: Cell) => {
  const rotAnim = useRef(new Animated.Value(props.rotation * 90)).current;
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return; // snap to initial rotation without animation
    }
    Animated.timing(rotAnim, {
      toValue: props.rotation * 90,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.rotation]);

  // Linear interpolation extrapolates correctly past 360° for unbounded rotation
  const rotate = rotAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const producer = props.sinkOrSource === SOURCE;
  const consumer = props.sinkOrSource === SINK;
  const dotFill = producer ? 'blue' : consumer ? 'purple' : 'white';
  const Component = CellView[props.kind];

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
      <svg viewBox="0 0 3 3" style={{ width: '100%', height: '100%' }}>
        <Component {...props} />
        <circle cx={1.5} cy={1.5} r={0.2} fill={dotFill} />
      </svg>
    </Animated.View>
  );
};

// ─── Game logic (unchanged) ──────────────────────────────────────────────────────
export function findPossiblyConnected(cells: Cell[][], [x, y]: [number, number]): [number, number][] {
  const cell = cells?.[y]?.[x];
  if (!cell) return [];

  switch (cell.kind.toUpperCase()) {
    case "L":
      switch (cell.rotation % 4) {
        case 0: return [[x, y - 1], [x + 1, y]];
        case 1: return [[x, y + 1], [x + 1, y]];
        case 2: return [[x - 1, y], [x, y + 1]];
        case 3: return [[x - 1, y], [x, y - 1]];
      }
      break;
    case "I":
      switch (cell.rotation % 4) {
        case 0: return [[x, y + 1], [x, y - 1]];
        case 1: return [[x - 1, y], [x + 1, y]];
        case 2: return [[x, y + 1], [x, y - 1]];
        case 3: return [[x + 1, y], [x - 1, y]];
      }
      break;
    case "T":
      switch (cell.rotation % 4) {
        case 0: return [[x - 1, y], [x + 1, y], [x, y + 1]];
        case 1: return [[x - 1, y], [x, y - 1], [x, y + 1]];
        case 2: return [[x - 1, y], [x + 1, y], [x, y - 1]];
        case 3: return [[x + 1, y], [x, y - 1], [x, y + 1]];
      }
      break;
    case "P":
      return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    default:
    case "X":
      switch (cell.rotation % 4) {
        case 0: return [[x, y + 1]];
        case 1: return [[x - 1, y]];
        case 2: return [[x, y - 1]];
        case 3: return [[x + 1, y]];
      }
  }
  return [];
}

function findConnected(cells: Cell[][], [x, y]: [number, number]) {
  return findPossiblyConnected(cells, [x, y]).filter(([x1, y1]) => {
    const connectable = findPossiblyConnected(cells, [x1, y1]);
    return connectable?.find(([x2, y2]) => `${x2}-${y2}` === `${x}-${y}`);
  }) as [number, number][];
}

function findCells(cells: Cell[][], sinkOrSource = SOURCE) {
  const result: [number, number][] = [];
  cells.forEach((row, y) => row.forEach((cell, x) => {
    if (cell.sinkOrSource === sinkOrSource) result.push([x, y]);
  }));
  return result;
}

function floodFill(cells: Cell[][]) {
  const todo = findCells(cells, SOURCE);
  const connected = new Set<string>();
  for (const [x, y] of todo) {
    if (connected.has(`${x}-${y}`)) continue;
    connected.add(`${x}-${y}`);
    findConnected(cells, [x, y]).forEach(p => todo.push(p));
  }
  return connected;
}

export function validateGame(cells: Cell[][]) {
  const connected = floodFill(cells);
  const consumers = findCells(cells, SINK);
  const done = consumers.every(([x, y]) => connected.has(`${x}-${y}`));
  return { done, cells, connected };
}

function shuffle<T>(rand: Rand, arr: T[]): T[] {
  return arr.toSorted(() => rand.next() - 0.5);
}

function randomPoint(rand: Rand, n: number) {
  return [Math.floor(rand.next() * n), Math.floor(rand.next() * n)];
}

export function generateRandomGame(seed: number, size: number, inputs: number, outputs = 1) {
  const rand = new Rand(seed.toString());
  const maze = generate(size, size, true, seed)
    .map(row => row.map(c => ({
      ...c,
      edges: +!c.bottom + +!c.left + +!c.right + +!c.top,
    })));

  console.log({ maze });
  const sinksArray = shuffle(rand, maze.flatMap(x => x))
    .sort((a, b) => a.edges - b.edges)
    .slice(0, inputs);

  const sinks = new Set(sinksArray.map(n => `${n.x}-${n.y}`));
  const sources = new Set<string>();
  while (sources.size < outputs) {
    const [x, y] = randomPoint(rand, size);
    if (!sinks.has(`${x}-${y}`)) sources.add(`${x}-${y}`);
  }

  return maze.map(row => row.map(c => {
    const isSink = sinks.has(`${c.x}-${c.y}`);
    const isSource = sources.has(`${c.x}-${c.y}`);
    let kind = 'P';
    switch (c.edges) {
      case 1: kind = 'X'; break;
      case 3: kind = 'T'; break;
      case 2: kind = c.left === c.right ? 'I' : 'L'; break;
    }
    return {
      cell: c,
      kind,
      sinkOrSource: +isSink * 2 + +isSource,
      rotation: 0,
      connected: isSource,
    };
  })) as Cell[][];
}

function getSeedFromURL() {
  if (typeof window === 'undefined') return { level: 15, name: 'server-side' };
  const [level, ...parts] = window.location.hash.split('#').at(-1)?.split('-') || [15, sillyName().split(' ')];
  const name = parts.join('-');
  console.log({ level, name });
  return {
    level: level !== '' ? level : 15,
    name: name !== '' ? name : sillyName(),
  };
}

export function generateGame(n = 15, name = "server") {
  const seed = stringHash(name);
  const size = Math.floor(n / 3);
  const inputs = size + Math.floor(size / 2) * (n % 3);
  console.log({ seed, n, size, inputs });
  return validateGame(generateRandomGame(seed, size, inputs));
}

// ─── Web-only range slider ────────────────────────────────────────────────────────
// This component is web-only. For a cross-platform build, swap for
// @react-native-community/slider.
function WebSlider({
  value, min, max, step, onValueChange,
}: {
  value: number; min: number; max: number; step: number; onValueChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(Number(e.target.value))}
      style={{ flex: 1, margin: '0 8px' }}
    />
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────────
type CompletionProps = {
  time: number; moves: number; level: number;
  onNewGame: () => void; onNextLevel: () => void;
};

function CompletionScreen({ time, moves, level, onNewGame, onNextLevel }: CompletionProps) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.cardTitle}>Puzzle Solved!</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{time}s</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{moves}</Text>
              <Text style={styles.statLabel}>Moves</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Difficulty</Text>
            </View>
          </View>
          <View style={styles.cardButtons}>
            {level < 60 && (
              <Pressable style={[styles.btn, styles.btnGreen]} onPress={onNextLevel}>
                <Text style={styles.btnText}>Next Level 🚀</Text>
              </Pressable>
            )}
            <Pressable style={[styles.btn, styles.btnBlue]} onPress={onNewGame}>
              <Text style={styles.btnText}>Play Again</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────────
type GridProps = {
  /** In race mode: no URL hash, no modal, fires onPuzzleComplete */
  raceMode?: boolean;
  initialLevel?: number;
  initialName?: string;
  onPuzzleComplete?: (time: number, moves: number, level: number) => void;
  onMenu?: () => void;
};

export function Grid({ raceMode, initialLevel, initialName, onPuzzleComplete, onMenu }: GridProps = {}) {
  const [{ level, name }, setSettings] = useState<{ level: number | string; name: string }>(() => {
    if (raceMode && initialLevel !== undefined && initialName !== undefined) {
      return { level: initialLevel, name: initialName };
    }
    return getSeedFromURL();
  });
  const [game, setGame] = useState(() => generateGame(+level, name));
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const completionStatsRef = useRef({ time: 0, moves: 0 });
  const puzzleCompletedRef = useRef(false);

  const setNewLocation = (nextLevel: number, nextName = sillyName()) => {
    if (moves > 0 && !game.done) {
      analytics.puzzleAbandoned(+level, name, time, moves);
    }
    window.location.hash = `${nextLevel}-${nextName.replace(/ /g, '-')}`;
    setSettings({ level: nextLevel, name: nextName });
  };

  useEffect(() => {
    // Pause timer when puzzle is done (either mode)
    if (showCompletion || game.done) return;
    const h = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(h);
  }, [showCompletion, game.done]);

  useEffect(() => {
    setGame(generateGame(+level, name));
    analytics.gameStarted(+level, name);
    setTime(0);
    setMoves(0);
    setShowCompletion(false);
    puzzleCompletedRef.current = false;
  }, [level, name]);

  useEffect(() => {
    if (!game.done) return;
    if (puzzleCompletedRef.current) return;
    puzzleCompletedRef.current = true;
    completionStatsRef.current = { time, moves };
    analytics.gameCompleted(+level, name, time, moves);

    if (raceMode) {
      onPuzzleComplete?.(time, moves, +level);
    } else {
      // Save freeplay stat
      saveSession({
        id: `${Date.now()}`,
        mode: 'freeplay',
        startedAt: Date.now(),
        startDifficulty: +level,
        autoIncrease: false,
        puzzles: [{ difficulty: +level, timeSeconds: time, moves }],
      });
      setShowCompletion(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.done]);

  const handleCellPress = (x: number, y: number) => {
    if (game.done) return; // don't allow moves after solved
    const newRow = game.cells[y].with(x, {
      ...game.cells[y][x],
      rotation: game.cells[y][x].rotation + 1,
    } as Cell);
    setGame(validateGame(game.cells.with(y, newRow)));
    const newMoves = moves + 1;
    setMoves(newMoves);
    analytics.moveMade(+level, newMoves, time);
  };

  return (
    <View style={styles.screen}>
      {/* ── Header bar ── always visible, outside the scroll view */}
      {!raceMode && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onMenu && (
              <Pressable style={styles.headerBtn} onPress={onMenu}>
                <Text style={styles.headerBtnText}>← Menu</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.headerTitle}>🔗 Networker</Text>
          <View style={styles.headerRight}>
            <Pressable style={styles.headerBtn} onPress={() => setNewLocation(+level)}>
              <Text style={styles.headerBtnText}>New Game</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Difficulty slider ── outside scroll, below header */}
      {!raceMode && (
        <View style={styles.difficultyBar}>
          <Text style={styles.difficultyLabel}>Difficulty: {level}</Text>
          <WebSlider
            value={+level}
            min={15}
            max={60}
            step={1}
            onValueChange={(v) => {
              const nextLevel = Math.max(15, v);
              analytics.difficultyChanged(+level, nextLevel);
              setNewLocation(nextLevel);
            }}
          />
        </View>
      )}

      {showCompletion && !raceMode && (
        <CompletionScreen
          time={completionStatsRef.current.time}
          moves={completionStatsRef.current.moves}
          level={+level}
          onNewGame={() => setNewLocation(+level)}
          onNextLevel={() => {
            const nextLevel = Math.min(60, +level + 3);
            analytics.difficultyChanged(+level, nextLevel);
            setNewLocation(nextLevel);
          }}
        />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* Game grid
              key forces full remount (fresh animated values) when a new game loads */}
          <View key={`${level}-${name}`} style={styles.grid}>
            {game.cells.map((row, y) => (
              <View key={y} style={styles.row}>
                {row.map((cell, x) => (
                  <Pressable
                    key={x}
                    style={styles.cell}
                    onPress={() => handleCellPress(x, y)}
                  >
                    <CellComponent
                      {...cell}
                      connected={game.connected.has(`${x}-${y}`)}
                    />
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={styles.statsBar}>
            <Text style={styles.statBarText}>⏱ {time}s</Text>
            <Text style={styles.statBarText}>↩ {moves} moves</Text>
          </View>
          {!raceMode && (
            <Text style={styles.hint}>Connect green pipes to red sinks · Tap a pipe to rotate</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export type GameProps = {
  onMenu?: () => void;
};

export function Game({ onMenu }: GameProps = {}) {
  return <Grid onMenu={onMenu} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // ── Header bar ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: { minWidth: 80 },
  headerRight: { minWidth: 80, alignItems: 'flex-end' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  headerBtnText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#374151',
  },

  // ── Difficulty slider row ──
  difficultyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  difficultyLabel: {
    fontSize: 13,
    color: '#6b7280',
    whiteSpace: 'nowrap',
  } as object,

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    padding: 12,
    gap: 10,
  },

  // Grid – collapsed-border equivalent:
  //   container gets top+left border; each cell gets right+bottom border.
  grid: {
    width: '100%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  // Each cell is a square: flex:1 distributes width evenly; aspectRatio:1 locks height
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBarText: {
    fontSize: 14,
    color: '#374151',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Completion modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 20,
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: {
    fontSize: 48,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16a34a',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  cardButtons: {
    width: '100%',
    gap: 12,
  },
  btn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnGreen: { backgroundColor: '#22c55e' },
  btnBlue: { backgroundColor: '#3b82f6' },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
