import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

interface BatteryWarningProps {
  batteryLevel: number;
  isConnected: boolean;
}

export function BatteryWarning({ batteryLevel, isConnected }: BatteryWarningProps) {
  const { color, backgroundColor, message, showWarning } = useMemo(() => {
    if (!isConnected) {
      return {
        color: '#FF9500',
        backgroundColor: '#FFF3E0',
        message: '⚠️ Disconnected',
        showWarning: true,
      };
    }

    if (batteryLevel < 10) {
      return {
        color: '#FF0000',
        backgroundColor: '#FFEBEE',
        message: `🔴 CRITICAL: ${batteryLevel}% - Connect charger now!`,
        showWarning: true,
      };
    }

    if (batteryLevel < 20) {
      return {
        color: '#FF3B30',
        backgroundColor: '#FFE0E0',
        message: `⚠️ Low battery: ${batteryLevel}%`,
        showWarning: true,
      };
    }

    if (batteryLevel < 40) {
      return {
        color: '#FF9500',
        backgroundColor: '#FFF3E0',
        message: `⚡ Battery: ${batteryLevel}%`,
        showWarning: true,
      };
    }

    return {
      color: '#34C759',
      backgroundColor: 'transparent',
      message: `🔋 Battery: ${batteryLevel}%`,
      showWarning: false,
    };
  }, [batteryLevel, isConnected]);

  if (!showWarning) return null;

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText style={[styles.text, { color }]}>{message}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginVertical: 8,
  },
  text: {
    fontWeight: '600',
    fontSize: 14,
  },
});
