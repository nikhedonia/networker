import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Game } from './game';
import { Menu, type RaceConfig } from './Menu';
import { RaceMode } from './RaceMode';
import { StatsPage } from './StatsPage';
import { analytics } from './analytics';

type Screen = 'menu' | 'freeplay' | 'race' | 'stats';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [raceConfig, setRaceConfig] = useState<RaceConfig | null>(null);

  useEffect(() => {
    analytics.pageView();
  }, []);

  const goMenu = useCallback(() => setScreen('menu'), []);

  const handleStartRace = useCallback((config: RaceConfig) => {
    setRaceConfig(config);
    setScreen('race');
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {screen === 'menu' && (
            <Menu
              onFreeplay={() => setScreen('freeplay')}
              onRace={handleStartRace}
              onStats={() => setScreen('stats')}
            />
          )}
          {screen === 'freeplay' && <Game onMenu={goMenu} />}
          {screen === 'race' && raceConfig && (
            <RaceMode config={raceConfig} onBack={goMenu} />
          )}
          {screen === 'stats' && <StatsPage onBack={goMenu} />}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
});
