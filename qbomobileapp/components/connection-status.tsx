import React, { useMemo } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectionStatusProps {
  state: ConnectionState;
  lastError?: string;
  onRetry?: () => void;
}

export function ConnectionStatus({ state, lastError, onRetry }: ConnectionStatusProps) {
  const { icon, color, label, showSpinner } = useMemo(() => {
    switch (state) {
      case 'connected':
        return {
          icon: '🟢',
          color: '#34C759',
          label: 'Connected',
          showSpinner: false,
        };
      case 'connecting':
        return {
          icon: '🟡',
          color: '#FF9500',
          label: 'Connecting...',
          showSpinner: true,
        };
      case 'error':
        return {
          icon: '🔴',
          color: '#FF3B30',
          label: 'Connection Error',
          showSpinner: false,
        };
      case 'disconnected':
      default:
        return {
          icon: '⚪',
          color: '#8E8E93',
          label: 'Disconnected',
          showSpinner: false,
        };
    }
  }, [state]);

  return (
    <ThemedView style={[styles.container, { borderColor: color }]}>
      <ThemedView style={styles.header}>
        <ThemedText style={{ fontSize: 16 }}>{icon}</ThemedText>
        <ThemedText style={[styles.label, { color }]}>{label}</ThemedText>
        {showSpinner && <ActivityIndicator color={color} />}
      </ThemedView>
      {lastError && (
        <ThemedText style={[styles.error, { color }]}>{lastError}</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
