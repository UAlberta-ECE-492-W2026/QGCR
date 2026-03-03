import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { ProgressBar } from 'react-native-paper';

interface RobotStatusDisplayProps {
  isConnected: boolean;
  batteryLevel: number;
  lastCommand: string;
  error: string | null;
  position?: {
    x: number;
    y: number;
    angle: number;
  };
}

export const RobotStatusDisplay: React.FC<RobotStatusDisplayProps> = ({
  isConnected,
  batteryLevel,
  lastCommand,
  error,
  position,
}) => {
  const getBatteryColor = (level: number) => {
    if (level > 60) return '#34C759';
    if (level > 30) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.statusRow}>
        <ThemedText style={styles.label}>Status:</ThemedText>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isConnected ? '#34C759' : '#8E8E93' },
          ]}
        />
        <ThemedText style={styles.value}>{isConnected ? 'Connected' : 'Disconnected'}</ThemedText>
      </View>

      <View style={styles.batteryRow}>
        <ThemedText style={styles.label}>Battery:</ThemedText>
        <View style={styles.batteryContainer}>
          <View
            style={[
              styles.batteryFill,
              {
                width: `${batteryLevel}%`,
                backgroundColor: getBatteryColor(batteryLevel),
              },
            ]}
          />
        </View>
        <ThemedText style={styles.value}>{Math.round(batteryLevel)}%</ThemedText>
      </View>

      {position && (
        <>
          <View style={styles.statusRow}>
            <ThemedText style={styles.label}>Position:</ThemedText>
            <ThemedText style={styles.value}>
              X: {position.x.toFixed(1)}, Y: {position.y.toFixed(1)}
            </ThemedText>
          </View>
          <View style={styles.statusRow}>
            <ThemedText style={styles.label}>Angle:</ThemedText>
            <ThemedText style={styles.value}>{Math.round(position.angle)}°</ThemedText>
          </View>
        </>
      )}

      <View style={styles.statusRow}>
        <ThemedText style={styles.label}>Last Command:</ThemedText>
        <ThemedText style={[styles.value, { flex: 1 }]} numberOfLines={1}>
          {lastCommand}
        </ThemedText>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontWeight: '600',
    minWidth: 100,
  },
  value: {
    opacity: 0.7,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  batteryContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
  },
  errorContainer: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
