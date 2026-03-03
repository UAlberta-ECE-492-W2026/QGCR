import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

export interface CommandLogEntry {
  id: string;
  command: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  duration?: number; // milliseconds
}

interface CommandLogProps {
  entries: CommandLogEntry[];
  maxHeight?: number;
}

export function CommandLog({ entries, maxHeight = 120 }: CommandLogProps) {
  return (
    <ScrollView style={[styles.container, { maxHeight }]} nestedScrollEnabled>
      <ThemedText style={styles.title}>📋 Command History</ThemedText>
      {entries.length === 0 ? (
        <ThemedText style={styles.empty}>No commands yet</ThemedText>
      ) : (
        entries.map((entry) => (
          <ThemedView key={entry.id} style={styles.entry}>
            <ThemedView style={styles.entryHeader}>
              <ThemedText
                style={[
                  styles.command,
                  {
                    color:
                      entry.status === 'success'
                        ? '#34C759'
                        : entry.status === 'failed'
                          ? '#FF3B30'
                          : '#FF9500',
                  },
                ]}
              >
                {entry.status === 'success' ? '✓' : entry.status === 'failed' ? '✗' : '⏳'}{' '}
                {entry.command}
              </ThemedText>
              <ThemedText style={styles.time}>
                {entry.timestamp.toLocaleTimeString()}
              </ThemedText>
            </ThemedView>
            {entry.duration && (
              <ThemedText style={styles.duration}>{entry.duration}ms</ThemedText>
            )}
            {entry.error && <ThemedText style={styles.error}>{entry.error}</ThemedText>}
          </ThemedView>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 8,
  },
  empty: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  entry: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 6,
    marginBottom: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  command: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  time: {
    fontSize: 11,
    opacity: 0.5,
    marginLeft: 8,
  },
  duration: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  error: {
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 2,
    fontStyle: 'italic',
  },
});
