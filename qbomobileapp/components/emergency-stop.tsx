import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

interface EmergencyStopButtonProps {
  onStop: () => Promise<void>;
  disabled?: boolean;
}

export function EmergencyStopButton({ onStop, disabled }: EmergencyStopButtonProps) {
  const handleStop = useCallback(async () => {
    Alert.alert('Emergency Stop', 'Stop all robot movement immediately?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'STOP',
        style: 'destructive',
        onPress: async () => {
          try {
            await onStop();
          } catch (e) {
            Alert.alert('Error', 'Failed to stop robot');
          }
        },
      },
    ]);
  }, [onStop]);

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={handleStop}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <ThemedText style={styles.text}>🛑 EMERGENCY STOP</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF0000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    borderWidth: 2,
    borderColor: '#CC0000',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
