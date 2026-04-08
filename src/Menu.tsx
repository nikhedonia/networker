import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type RaceConfig = {
  duration: 60 | 180 | 300;
  startDifficulty: number;
  autoIncrease: boolean;
};

type MenuProps = {
  onFreeplay: () => void;
  onRace: (config: RaceConfig) => void;
  onStats: () => void;
};

export function Menu({ onFreeplay, onRace, onStats }: MenuProps) {
  const [duration, setDuration] = useState<60 | 180 | 300>(60);
  const [startDifficulty, setStartDifficulty] = useState(15);
  const [autoIncrease, setAutoIncrease] = useState(true);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔗 Networker</Text>
      <Text style={styles.subtitle}>Connect the pipes</Text>

      <Pressable style={[styles.btn, styles.btnGreen]} onPress={onFreeplay}>
        <Text style={styles.btnText}>🎮 Free Play</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⏱ Race Against Time</Text>

        <Text style={styles.label}>Duration</Text>
        <View style={styles.pillRow}>
          {([60, 180, 300] as const).map(d => (
            <Pressable
              key={d}
              style={[styles.pill, duration === d && styles.pillActive]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.pillText, duration === d && styles.pillTextActive]}>
                {d === 60 ? '1 min' : d === 180 ? '3 min' : '5 min'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Start Difficulty: {startDifficulty}</Text>
        <input
          type="range"
          value={startDifficulty}
          min={15}
          max={57}
          step={3}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDifficulty(Number(e.target.value))}
          style={{ width: '100%', margin: '6px 0' }}
        />

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Auto-increase difficulty</Text>
          <Pressable
            style={[styles.toggle, autoIncrease && styles.toggleOn]}
            onPress={() => setAutoIncrease(v => !v)}
          >
            <Text style={[styles.toggleText, autoIncrease && styles.toggleTextOn]}>
              {autoIncrease ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.btn, styles.btnBlue]}
          onPress={() => onRace({ duration, startDifficulty, autoIncrease })}
        >
          <Text style={styles.btnText}>Start Race 🏁</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.btn, styles.btnGray]} onPress={onStats}>
        <Text style={[styles.btnText, styles.btnTextDark]}>📊 View Stats</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    gap: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  } as object,
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  pillActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  pillTextActive: {
    color: '#3b82f6',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  toggleOn: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
  },
  toggleTextOn: {
    color: '#16a34a',
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnGreen: { backgroundColor: '#22c55e' },
  btnBlue: { backgroundColor: '#3b82f6' },
  btnGray: { backgroundColor: '#e5e7eb' },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  btnTextDark: {
    color: '#374151',
  },
});
