import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import sillyName from 'sillyname';
import type { RaceConfig } from './Menu';
import { saveSession, type PuzzleResult } from './storage';
import { Grid } from './game';

type RaceModeProps = {
  config: RaceConfig;
  onBack: () => void;
};

// ─── Bar chart ────────────────────────────────────────────────────────────────
function PuzzleTimeChart({ puzzles }: { puzzles: PuzzleResult[] }) {
  if (puzzles.length === 0) return null;
  const times = puzzles.map(p => p.timeSeconds);
  const maxTime = Math.max(...times, 1);
  const W = 300;
  const H = 80;
  const gap = 2;
  const barW = Math.max(8, W / puzzles.length - gap);

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 20}`}
      style={{ width: '100%', maxWidth: 480, display: 'block' }}
    >
      {puzzles.map((p, i) => {
        const barH = Math.max(2, (p.timeSeconds / maxTime) * H);
        const x = i * (W / puzzles.length);
        return (
          <g key={i}>
            <rect
              x={x + gap / 2}
              y={H - barH}
              width={barW}
              height={barH}
              fill="#3b82f6"
              rx={2}
            />
            <text
              x={x + barW / 2 + gap / 2}
              y={H + 14}
              textAnchor="middle"
              fontSize="7"
              fill="#6b7280"
            >
              {p.timeSeconds}s
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Results screen ────────────────────────────────────────────────────────────
function RaceResults({
  puzzles,
  config,
  onBack,
}: {
  puzzles: PuzzleResult[];
  config: RaceConfig;
  onBack: () => void;
}) {
  const totalTime = puzzles.reduce((s, p) => s + p.timeSeconds, 0);
  const avgTime = puzzles.length > 0 ? Math.round(totalTime / puzzles.length) : 0;
  const bestTime = puzzles.length > 0 ? Math.min(...puzzles.map(p => p.timeSeconds)) : 0;

  return (
    <View style={resultStyles.container}>
      <Text style={resultStyles.emoji}>🏁</Text>
      <Text style={resultStyles.title}>Time's Up!</Text>

      <View style={resultStyles.statsRow}>
        <View style={resultStyles.stat}>
          <Text style={resultStyles.statValue}>{puzzles.length}</Text>
          <Text style={resultStyles.statLabel}>Puzzles</Text>
        </View>
        <View style={resultStyles.stat}>
          <Text style={resultStyles.statValue}>{avgTime}s</Text>
          <Text style={resultStyles.statLabel}>Avg Time</Text>
        </View>
        <View style={resultStyles.stat}>
          <Text style={resultStyles.statValue}>{bestTime}s</Text>
          <Text style={resultStyles.statLabel}>Best</Text>
        </View>
      </View>

      {puzzles.length > 0 && (
        <View style={resultStyles.chartSection}>
          <Text style={resultStyles.chartTitle}>Time per puzzle</Text>
          <PuzzleTimeChart puzzles={puzzles} />
        </View>
      )}

      <Pressable style={resultStyles.btn} onPress={onBack}>
        <Text style={resultStyles.btnText}>Back to Menu</Text>
      </Pressable>
    </View>
  );
}

// ─── Race Mode ─────────────────────────────────────────────────────────────────
export function RaceMode({ config, onBack }: RaceModeProps) {
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(config.startDifficulty);
  const [currentName, setCurrentName] = useState<string>(() => sillyName());
  const [celebrating, setCelebrating] = useState(false);
  const [celebrateData, setCelebrateData] = useState({ time: 0, moves: 0 });
  const [puzzles, setPuzzles] = useState<PuzzleResult[]>([]);
  const [finished, setFinished] = useState(false);
  const sessionSaved = useRef(false);
  const celebrateOpacity = useRef(new Animated.Value(0)).current;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Countdown timer — paused while celebrating or finished
  useEffect(() => {
    if (finished || celebrating) return;
    const h = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(h);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(h);
  }, [finished, celebrating]);

  // Save session when race finishes
  useEffect(() => {
    if (!finished || sessionSaved.current) return;
    sessionSaved.current = true;
    setPuzzles(current => {
      saveSession({
        id: `race-${Date.now()}`,
        mode: 'race',
        startedAt: Date.now(),
        raceDuration: config.duration,
        startDifficulty: config.startDifficulty,
        autoIncrease: config.autoIncrease,
        puzzles: current,
      });
      return current;
    });
  }, [finished, config]);

  const handlePuzzleComplete = useCallback((time: number, moves: number, level: number) => {
    const result: PuzzleResult = { difficulty: level, timeSeconds: time, moves };
    setPuzzles(prev => [...prev, result]);
    setCelebrateData({ time, moves });
    setCelebrating(true);

    Animated.sequence([
      Animated.timing(celebrateOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(900),
      Animated.timing(celebrateOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCelebrating(false);
      const nextLevel = config.autoIncrease ? Math.min(60, level + 3) : level;
      setCurrentLevel(nextLevel);
      setCurrentName(sillyName());
      setPuzzleIndex(i => i + 1);
    });
  }, [config.autoIncrease, celebrateOpacity]);

  if (finished) {
    return (
      <View style={styles.flex}>
        <RaceResults puzzles={puzzles} config={config} onBack={onBack} />
      </View>
    );
  }

  const pct = timeLeft / config.duration;
  const timerColor = pct > 0.4 ? '#22c55e' : pct > 0.2 ? '#f59e0b' : '#ef4444';

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>✕</Text>
        </Pressable>
        <View style={styles.timerBlock}>
          <Text style={[styles.timer, { color: timerColor }]}>{formatTime(timeLeft)}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.puzzleCount}>#{puzzleIndex + 1}</Text>
          <Text style={styles.levelText}>Lv {currentLevel}</Text>
        </View>
      </View>

      {/* Thin progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` as unknown as number, backgroundColor: timerColor }]} />
      </View>

      {/* Game grid — key forces remount when puzzle changes */}
      <View style={styles.flex}>
        <Grid
          key={`${currentLevel}-${currentName}-${puzzleIndex}`}
          raceMode
          initialLevel={currentLevel}
          initialName={currentName}
          onPuzzleComplete={handlePuzzleComplete}
        />
      </View>

      {/* Celebration overlay */}
      {celebrating && (
        <Animated.View
          style={[styles.celebrateOverlay, { opacity: celebrateOpacity }]}
          pointerEvents="none"
        >
          <Text style={styles.celebrateCheck}>✓</Text>
          <Text style={styles.celebrateText}>Solved in {celebrateData.time}s!</Text>
          <Text style={styles.celebrateMoves}>{celebrateData.moves} moves</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 16, color: '#6b7280' },
  timerBlock: { flex: 1, alignItems: 'center' },
  timer: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  } as object,
  infoBlock: { alignItems: 'flex-end', minWidth: 52 },
  puzzleCount: { fontSize: 16, fontWeight: '700', color: '#111827' },
  levelText: { fontSize: 12, color: '#6b7280' },
  progressTrack: {
    height: 4,
    backgroundColor: '#e5e7eb',
  },
  progressFill: {
    height: 4,
  },
  celebrateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34,197,94,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  celebrateCheck: { fontSize: 72, color: '#fff' },
  celebrateText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  celebrateMoves: { fontSize: 16, color: 'rgba(255,255,255,0.85)' },
});

const resultStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    gap: 20,
    justifyContent: 'center',
  },
  emoji: { fontSize: 56 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  statsRow: { flexDirection: 'row', gap: 32 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 13, color: '#6b7280' },
  chartSection: { width: '100%', gap: 8 },
  chartTitle: { fontSize: 14, fontWeight: '600', color: '#374151', textAlign: 'center' },
  btn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
