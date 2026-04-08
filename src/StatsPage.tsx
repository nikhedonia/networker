import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { clearSessions, loadSessions, type GameSession, type PuzzleResult } from './storage';

// ─── Bar chart ────────────────────────────────────────────────────────────────
function PuzzleTimeChart({ puzzles }: { puzzles: PuzzleResult[] }) {
  if (puzzles.length === 0) return null;
  const times = puzzles.map(p => p.timeSeconds);
  const maxTime = Math.max(...times, 1);
  const W = 300;
  const H = 70;
  const gap = 2;
  const barW = Math.max(6, W / puzzles.length - gap);

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 18}`}
      style={{ width: '100%', maxWidth: 480, display: 'block' }}
    >
      {puzzles.map((p, i) => {
        const barH = Math.max(2, (p.timeSeconds / maxTime) * H);
        const x = i * (W / puzzles.length);
        const fill = p.timeSeconds === Math.min(...times) ? '#22c55e' : '#3b82f6';
        return (
          <g key={i}>
            <rect
              x={x + gap / 2}
              y={H - barH}
              width={barW}
              height={barH}
              fill={fill}
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

// ─── Session card ─────────────────────────────────────────────────────────────
function SessionCard({ session }: { session: GameSession }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(session.startedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const solved = session.puzzles.length;
  const avgTime = solved > 0
    ? Math.round(session.puzzles.reduce((s, p) => s + p.timeSeconds, 0) / solved)
    : 0;
  const bestTime = solved > 0 ? Math.min(...session.puzzles.map(p => p.timeSeconds)) : 0;
  const isRace = session.mode === 'race';

  return (
    <Pressable style={styles.card} onPress={() => setExpanded(v => !v)}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.modeBadge, isRace ? styles.badgeRace : styles.badgeFree]}>
            <Text style={styles.modeBadgeText}>
              {isRace ? '⏱ Race' : '🎮 Free Play'}
            </Text>
          </View>
          <Text style={styles.dateText}>{date}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.statCell}>
          <Text style={styles.statVal}>{solved}</Text>
          <Text style={styles.statLab}>Solved</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statVal}>{avgTime}s</Text>
          <Text style={styles.statLab}>Avg</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statVal}>{bestTime}s</Text>
          <Text style={styles.statLab}>Best</Text>
        </View>
        {isRace && session.raceDuration && (
          <View style={styles.statCell}>
            <Text style={styles.statVal}>{session.raceDuration / 60}m</Text>
            <Text style={styles.statLab}>Duration</Text>
          </View>
        )}
      </View>

      {expanded && solved > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartLabel}>Time per puzzle (green = best)</Text>
          <PuzzleTimeChart puzzles={session.puzzles} />
          <View style={styles.puzzleList}>
            {session.puzzles.map((p, i) => (
              <View key={i} style={styles.puzzleRow}>
                <Text style={styles.puzzleNum}>#{i + 1}</Text>
                <Text style={styles.puzzleTime}>{p.timeSeconds}s</Text>
                <Text style={styles.puzzleMoves}>{p.moves} moves</Text>
                <Text style={styles.puzzleDiff}>Lv {p.difficulty}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ─── Stats page ───────────────────────────────────────────────────────────────
type StatsPageProps = {
  onBack: () => void;
};

export function StatsPage({ onBack }: StatsPageProps) {
  const [sessions, setSessions] = useState<GameSession[]>(() => loadSessions());

  const handleClear = useCallback(() => {
    clearSessions();
    setSessions([]);
  }, []);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Menu</Text>
        </Pressable>
        <Text style={styles.headerTitle}>📊 Stats</Text>
        {sessions.length > 0 ? (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No games yet</Text>
            <Text style={styles.emptySubtitle}>Complete a puzzle or race to see your stats here.</Text>
          </View>
        ) : (
          sessions.map(s => <SessionCard key={s.id} session={s} />)
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 70,
  },
  backText: { fontSize: 15, color: '#3b82f6', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 70,
    alignItems: 'flex-end',
  },
  clearText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeRace: { backgroundColor: '#fef3c7' },
  badgeFree: { backgroundColor: '#f0fdf4' },
  modeBadgeText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 12, color: '#9ca3af' },
  chevron: { fontSize: 12, color: '#9ca3af' },
  summaryRow: { flexDirection: 'row', gap: 16 },
  statCell: { alignItems: 'center', minWidth: 48 },
  statVal: { fontSize: 22, fontWeight: '700', color: '#111827' },
  statLab: { fontSize: 11, color: '#9ca3af' },
  chartSection: { gap: 8 },
  chartLabel: { fontSize: 12, color: '#6b7280' },
  puzzleList: { gap: 4 },
  puzzleRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  puzzleNum: { fontSize: 13, color: '#9ca3af', minWidth: 28 },
  puzzleTime: { fontSize: 13, fontWeight: '600', color: '#111827', minWidth: 36 },
  puzzleMoves: { fontSize: 13, color: '#6b7280', flex: 1 },
  puzzleDiff: { fontSize: 13, color: '#6b7280' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});
