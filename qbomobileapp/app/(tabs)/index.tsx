import { ScrollView, StyleSheet, View, Alert, Pressable, SafeAreaView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmergencyStopButton } from '@/components/emergency-stop';
import { BatteryWarning } from '@/components/battery-warning';
import { ConnectionStatus, ConnectionState } from '@/components/connection-status';
import { CommandLog, CommandLogEntry } from '@/components/command-log';
import { RobotPositionMap } from '@/components/robot-position-map';
import { ActivityLog, ActivityEntry } from '@/components/activity-log';
import { RobotSelector } from '@/components/robot-selector';
import { RoutineManager } from '@/components/routine-manager';
import { PerformanceMetricsDisplay } from '@/components/performance-metrics-display';

import { useQboRobot } from '@/hooks/use-qbo-robot';
import { usePerformanceTracker } from '@/hooks/use-performance-tracker';
import { useVoiceFeedback } from '@/hooks/use-voice-feedback';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import { useMultiRobotSupport } from '@/hooks/use-multi-robot';

export default function HomeScreen() {
  const robot = useQboRobot();
  const { metrics, recordCommand } = usePerformanceTracker();
  const { speak } = useVoiceFeedback();
  const { queue } = useOfflineQueue();
  const { selectedRobot } = useMultiRobotSupport();

  // UI State
  const [connecting, setConnecting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);

  // Update connection state
  useEffect(() => {
    if (connecting) {
      setConnectionState('connecting');
    } else if (robot.status.isConnected) {
      setConnectionState('connected');
    } else if (robot.status.error) {
      setConnectionState('error');
    } else {
      setConnectionState('disconnected');
    }
  }, [robot.status.isConnected, robot.status.error, connecting]);

  // Log command helper
  const logCommand = useCallback(
    (command: string, status: 'success' | 'failed', duration: number = 0, error?: string) => {
      const entry: CommandLogEntry = {
        id: Date.now().toString(),
        command,
        timestamp: new Date(),
        status,
        error,
        duration,
      };
      setCommandLog((prev) => [entry, ...prev].slice(0, 20));
      if (status !== 'pending') {
        recordCommand(status === 'success', duration);
      }
    },
    [recordCommand]
  );

  // Log activity helper
  const logActivity = useCallback(
    (
      action: string,
      type: ActivityEntry['type'],
      status: 'success' | 'failed',
      details?: string
    ) => {
      const entry: ActivityEntry = {
        id: Date.now().toString(),
        action,
        type,
        timestamp: new Date(),
        status,
        details,
      };
      setActivityLog((prev) => [entry, ...prev].slice(0, 50));
    },
    []
  );

  const handleConnect = async () => {
    setConnecting(true);
    const startTime = Date.now();
    try {
      const success = await robot.connect();
      const duration = Date.now() - startTime;

      if (success) {
        logCommand('Connect', 'success', duration);
        logActivity('Connection established', 'connection', 'success');
        await speak('Connected to QBO robot');
        Alert.alert('Success', 'Connected to QBO Robot!');
      } else {
        logCommand('Connect', 'failed', duration, robot.status.error);
        logActivity('Connection failed', 'connection', 'failed', robot.status.error);
        Alert.alert('Error', robot.status.error || 'Failed to connect');
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logCommand('Connect', 'failed', duration, error.message);
      logActivity('Connection error', 'connection', 'failed', error.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await robot.disconnect();
    logActivity('Disconnected', 'connection', 'success');
    await speak('Disconnected from robot');
    Alert.alert('Disconnected', 'Disconnected from QBO Robot');
  };

  const handleMove = async (direction: 'forward' | 'backward') => {
    setMoving(true);
    const distance = direction === 'forward' ? 20 : -20;
    const startTime = Date.now();

    try {
      const result = await robot.move(distance, 100);
      const duration = Date.now() - startTime;
      const command = direction === 'forward' ? 'Move Forward' : 'Move Backward';

      if (result) {
        logCommand(command, 'success', duration);
        logActivity(`Moved ${direction}`, 'movement', 'success', `${distance}cm`);
        await speak(`Moving ${direction}`);
      } else {
        logCommand(command, 'failed', duration);
        logActivity(`Move failed`, 'movement', 'failed');
      }
    } finally {
      setMoving(false);
    }
  };

  const handleTurn = async (direction: 'left' | 'right') => {
    setMoving(true);
    const angle = direction === 'left' ? -90 : 90;
    const startTime = Date.now();

    try {
      const result = await robot.turn(angle, 100);
      const duration = Date.now() - startTime;
      const command = direction === 'left' ? 'Turn Left' : 'Turn Right';

      if (result) {
        logCommand(command, 'success', duration);
        logActivity(`Turned ${direction}`, 'movement', 'success', `${angle}°`);
        await speak(`Turning ${direction}`);
      } else {
        logCommand(command, 'failed', duration);
        logActivity(`Turn failed`, 'movement', 'failed');
      }
    } finally {
      setMoving(false);
    }
  };

  const handleStop = async () => {
    const startTime = Date.now();
    try {
      const result = await robot.stop();
      const duration = Date.now() - startTime;

      if (result) {
        logCommand('STOP', 'success', duration);
        logActivity('Stopped', 'movement', 'success');
        await speak('Robot stopped');
      } else {
        logCommand('STOP', 'failed', duration);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logCommand('STOP', 'failed', duration, error.message);
    }
  };

  const handleDance = async () => {
    const startTime = Date.now();
    try {
      const result = await robot.dance('simple');
      const duration = Date.now() - startTime;

      if (result) {
        logCommand('Dance', 'success', duration);
        logActivity('Dance animation', 'animation', 'success');
        await speak('Dancing');
      } else {
        logCommand('Dance', 'failed', duration);
        logActivity('Dance failed', 'animation', 'failed');
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logCommand('Dance', 'failed', duration, error.message);
    }
  };

  const handleLight = async (r: number, g: number, b: number, label: string) => {
    const startTime = Date.now();
    try {
      const result = await robot.setLight(r, g, b, 1000);
      const duration = Date.now() - startTime;

      if (result) {
        logCommand(`Light: ${label}`, 'success', duration);
        logActivity('Light changed', 'light', 'success', label);
        await speak(`Light set to ${label}`);
      } else {
        logCommand(`Light: ${label}`, 'failed', duration);
        logActivity(`Light change failed`, 'light', 'failed');
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logCommand(`Light: ${label}`, 'failed', duration, error.message);
    }
  };

  const handleSound = async () => {
    const startTime = Date.now();
    try {
      const result = await robot.playSound('beep', 50);
      const duration = Date.now() - startTime;

      if (result) {
        logCommand('Play Sound', 'success', duration);
        logActivity('Sound played', 'sound', 'success');
      } else {
        logCommand('Play Sound', 'failed', duration);
        logActivity('Sound failed', 'sound', 'failed');
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logCommand('Play Sound', 'failed', duration, error.message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Emergency Stop Button - Always Visible */}
        <EmergencyStopButton onStop={handleStop} />

        {/* Status Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Status</ThemedText>
          <ConnectionStatus state={connectionState} />
          <BatteryWarning battery={robot.status.battery} isConnected={robot.status.isConnected} />

          {/* Queue Status */}
          {queue.length > 0 && (
            <View style={[styles.card, styles.warningCard]}>
              <ThemedText style={{ color: '#FF9800' }}>📋 {queue.length} command(s) queued (offline)</ThemedText>
            </View>
          )}

          {/* Connection Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, connecting && styles.buttonDisabled]}
              onPress={handleConnect}
              disabled={connecting || robot.status.isConnected}
            >
              <ThemedText style={{ color: 'white' }}>
                {connecting ? 'Connecting...' : robot.status.isConnected ? 'Connected' : 'Connect'}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonDanger]}
              onPress={handleDisconnect}
              disabled={!robot.status.isConnected}
            >
              <ThemedText style={{ color: 'white' }}>Disconnect</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Position Map */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Position & Orientation</ThemedText>
          <RobotPositionMap x={robot.status.x || 0} y={robot.status.y || 0} angle={robot.status.angle || 0} />
        </View>

        {/* Control Pad */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Movement Controls</ThemedText>
          <View style={styles.controlGrid}>
            {/* Forward */}
            <View>
              <Pressable style={styles.controlButton} onPress={() => handleMove('forward')} disabled={!robot.status.isConnected}>
                <ThemedText>⬆️</ThemedText>
              </Pressable>
            </View>

            {/* Left, Stop, Right */}
            <View style={styles.controlRow}>
              <Pressable style={styles.controlButton} onPress={() => handleTurn('left')} disabled={!robot.status.isConnected}>
                <ThemedText>⬅️</ThemedText>
              </Pressable>
              <Pressable style={[styles.controlButton, styles.buttonDanger]} onPress={handleStop} disabled={!robot.status.isConnected}>
                <ThemedText>⏹️</ThemedText>
              </Pressable>
              <Pressable style={styles.controlButton} onPress={() => handleTurn('right')} disabled={!robot.status.isConnected}>
                <ThemedText>➡️</ThemedText>
              </Pressable>
            </View>

            {/* Backward */}
            <View>
              <Pressable style={styles.controlButton} onPress={() => handleMove('backward')} disabled={!robot.status.isConnected}>
                <ThemedText>⬇️</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Animation & Effects */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Animation & Effects</ThemedText>
          <View style={styles.buttonRow}>
            <Pressable style={styles.button} onPress={handleDance} disabled={!robot.status.isConnected}>
              <ThemedText style={{ color: 'white' }}>💃 Dance</ThemedText>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSound} disabled={!robot.status.isConnected}>
              <ThemedText style={{ color: 'white' }}>🔊 Sound</ThemedText>
            </Pressable>
          </View>

          {/* Light Controls */}
          <View style={styles.lightGrid}>
            <Pressable style={[styles.lightButton, { backgroundColor: '#FF0000' }]} onPress={() => handleLight(255, 0, 0, 'Red')} disabled={!robot.status.isConnected}>
              <ThemedText style={{ color: 'white', fontSize: 12 }}>Red</ThemedText>
            </Pressable>
            <Pressable style={[styles.lightButton, { backgroundColor: '#00FF00' }]} onPress={() => handleLight(0, 255, 0, 'Green')} disabled={!robot.status.isConnected}>
              <ThemedText style={{ color: 'white', fontSize: 12 }}>Green</ThemedText>
            </Pressable>
            <Pressable style={[styles.lightButton, { backgroundColor: '#0000FF' }]} onPress={() => handleLight(0, 0, 255, 'Blue')} disabled={!robot.status.isConnected}>
              <ThemedText style={{ color: 'white', fontSize: 12 }}>Blue</ThemedText>
            </Pressable>
            <Pressable style={[styles.lightButton, { backgroundColor: '#FFFFFF' }]} onPress={() => handleLight(255, 255, 255, 'White')} disabled={!robot.status.isConnected}>
              <ThemedText style={{ color: 'black', fontSize: 12 }}>White</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Multi-Robot Support */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Robot: {selectedRobot.name}</ThemedText>
          <RobotSelector />
        </View>

        {/* Command History & Routines */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Commands & Routines</ThemedText>
          <RoutineManager />
          <CommandLog commands={commandLog} />
        </View>

        {/* Activity Log */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Activity Log</ThemedText>
          <ActivityLog activities={activityLog} />
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Performance Metrics</ThemedText>
          <PerformanceMetricsDisplay metrics={metrics} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDanger: {
    backgroundColor: '#f44336',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  controlGrid: {
    alignItems: 'center',
    gap: 8,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#999',
  },
  lightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  lightButton: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
});
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#999',
  },
  lightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  lightButton: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
});
