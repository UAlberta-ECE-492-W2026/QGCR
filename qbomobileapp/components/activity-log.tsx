import React, { useMemo } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

export interface ActivityEntry {
  id: string;
  action: string;
  timestamp: Date;
  type: 'movement' | 'animation' | 'light' | 'sound' | 'connection' | 'chat';
  status: 'success' | 'failed';
  details?: string;
}

interface ActivityLogProps {
  entries: ActivityEntry[];
  maxHeight?: number;
  onClear?: () => void;
}

export function ActivityLog({ entries, maxHeight = 200, onClear }: ActivityLogProps) {
  const typeColors = useMemo(
    () => ({
      movement: '#3498db',
      animation: '#e74c3c',
      light: '#f39c12',
      sound: '#9b59b6',
      connection: '#1abc9c',
      chat: '#2ecc71',
    }),
    []
  );

  const typeIcons = useMemo(
    () => ({
      movement: '🚀',
      animation: '💃',
      light: '💡',
      sound: '🔊',
      connection: '🔗',
      chat: '💬',
    }),
    []
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>📊 Activity Log</ThemedText>
        {onClear && (
          <ThemedText style={styles.clearButton} onPress={onClear}>
            Clear
          </ThemedText>
        )}
      </ThemedView>

      <ScrollView style={[styles.logContainer, { maxHeight }]} nestedScrollEnabled>
        {entries.length === 0 ? (
          <ThemedText style={styles.empty}>No activity yet</ThemedText>
        ) : (
          entries.map((entry) => (
            <ThemedView
              key={entry.id}
              style={[
                styles.logEntry,
                {
                  borderLeftColor: typeColors[entry.type],
                },
              ]}
            >
              <ThemedView style={styles.entryTop}>
                <ThemedText style={styles.icon}>
                  {typeIcons[entry.type]} {entry.action}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.status,
                    {
                      color: entry.status === 'success' ? '#34C759' : '#FF3B30',
                    },
                  ]}
                >
                  {entry.status === 'success' ? '✓' : '✗'}
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.timestamp}>
                {entry.timestamp.toLocaleTimeString()}
              </ThemedText>
              {entry.details && (
                <ThemedText style={styles.details}>{entry.details}</ThemedText>
              )}
            </ThemedView>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  clearButton: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  empty: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  logEntry: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  status: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
  },
  details: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
