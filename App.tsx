import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Alert, StyleSheet, Switch } from 'react-native';

// Tipos e constantes
type Mode = 'focus' | 'shortBreak';
const FOCUS_SECONDS = 25 * 60;
const SHORT_BREAK_SECONDS = 5 * 60;
const STORAGE_KEY = '@pomodoro_cycles_v1';

// Utils
function formatTime(totalSeconds: number) {
  const mm = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mm}:${ss}`;
}

// Components
const TimerDisplay: React.FC<{ seconds: number; mode: Mode; isRunning: boolean }> = ({ seconds, mode, isRunning }) => {
  return (
    <View style={styles.timerContainer}>
      <Text style={styles.modeText}>{mode === 'focus' ? 'FOCO' : 'PAUSA'}</Text>
      <Text style={styles.timerText}>{formatTime(seconds)}</Text>
      <Text style={styles.subText}>{isRunning ? 'Rodando...' : 'Pausado'}</Text>
    </View>
  );
};

const Controls: React.FC<{
  isRunning: boolean;
  onStartPause: () => void;
  onReset: () => void;
  onToggleMode?: () => void;
}> = ({ isRunning, onStartPause, onReset, onToggleMode }) => {
  return (
    <View style={styles.controlsRow}>
      <TouchableOpacity style={[styles.button, styles.primary]} onPress={onStartPause}>
        <Text style={styles.buttonText}>{isRunning ? 'Pausar' : 'Start'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondary]} onPress={onReset}>
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>

      {onToggleMode && (
        <TouchableOpacity style={[styles.button, styles.ghost]} onPress={onToggleMode}>
          <Text style={styles.buttonText}>Trocar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const CycleCounter: React.FC<{ cycles: number }> = ({ cycles }) => {
  return (
    <View style={styles.cycleContainer}>
      <Text style={styles.cycleLabel}>Ciclos completos</Text>
      <Text style={styles.cycleNumber}>{cycles}</Text>
    </View>
  );
};

// App principal
export default function App(): JSX.Element {
  const [mode, setMode] = useState<Mode>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [cycles, setCycles] = useState<number>(0);
  const [useShortBreaks, setUseShortBreaks] = useState<boolean>(true);
  const [darkTheme, setDarkTheme] = useState<boolean>(false);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const n = Number(saved);
          if (!Number.isNaN(n)) setCycles(n);
        }
      } catch (err) {
        // ignore if lib not installed
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(STORAGE_KEY, String(cycles));
      } catch (err) {}
    })();
  }, [cycles]);

  useEffect(() => {
    setSecondsLeft(mode === 'focus' ? FOCUS_SECONDS : SHORT_BREAK_SECONDS);
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = global.setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000) as unknown as number;
    }

    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setIsRunning(false);
      Alert.alert('Ciclo concluído', mode === 'focus' ? 'Você completou um ciclo de foco!' : 'Pausa finalizada');
      if (mode === 'focus') setCycles((c) => c + 1);

      if (useShortBreaks) {
        setMode((m) => (m === 'focus' ? 'shortBreak' : 'focus'));
      } else {
        setSecondsLeft(mode === 'focus' ? FOCUS_SECONDS : SHORT_BREAK_SECONDS);
      }
    }
  }, [secondsLeft]);

  const handleStartPause = () => {
    setIsRunning((r) => !r);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(mode === 'focus' ? FOCUS_SECONDS : SHORT_BREAK_SECONDS);
  };

  const toggleModeManually = () => {
    setIsRunning(false);
    setMode((m) => (m === 'focus' ? 'shortBreak' : 'focus'));
  };

  const themeStyles = darkTheme ? darkStyles : lightStyles;

  return (
    <SafeAreaView style={[styles.root, themeStyles.root]}>
      <View style={styles.header}>
        <Text style={[styles.title, themeStyles.title]}>Pomodoro</Text>

        <View style={styles.switchRow}>
          <View style={styles.switchItem}>
            <Text style={themeStyles.small}>Pausas</Text>
            <Switch value={useShortBreaks} onValueChange={setUseShortBreaks} />
          </View>

          <View style={styles.switchItem}>
            <Text style={themeStyles.small}>Tema</Text>
            <Switch value={darkTheme} onValueChange={setDarkTheme} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <TimerDisplay seconds={secondsLeft} mode={mode} isRunning={isRunning} />

        <Controls isRunning={isRunning} onStartPause={handleStartPause} onReset={handleReset} onToggleMode={toggleModeManually} />

        <CycleCounter cycles={cycles} />
      </View>

      <View style={styles.footer}>
        <Text style={themeStyles.small}>Dica: use Start para iniciar e Reset para voltar a 25:00</Text>
      </View>
    </SafeAreaView>
  );
}

// Styles
const baseStyles = {
  root: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  small: {
    fontSize: 12,
  },
};

const lightStyles = StyleSheet.create({
  root: {
    backgroundColor: '#F7F7F8',
  },
  title: {
    color: '#111',
  },
  small: {
    color: '#333',
  },
});

const darkStyles = StyleSheet.create({
  root: {
    backgroundColor: '#0F1720',
  },
  title: {
    color: '#fff',
  },
  small: {
    color: '#BBB',
  },
});

const styles = StyleSheet.create({
  ...baseStyles,
  header: {
    width: '100%',
    marginTop: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  root: {
    flex: 1,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
  },
  subText: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#2563EB',
  },
  secondary: {
    backgroundColor: '#10B981',
  },
  ghost: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cycleContainer: {
    marginTop: 22,
    alignItems: 'center',
  },
  cycleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  cycleNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 18,
  },
});