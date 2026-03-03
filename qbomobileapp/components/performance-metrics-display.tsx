import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { PerformanceMetrics } from '@/hooks/use-performance-tracker';

interface PerformanceDisplayProps {
  metrics: PerformanceMetrics;
}

export function PerformanceMetricsDisplay({ metrics }: PerformanceDisplayProps) {
  const uptimeMinutes = Math.floor(metrics.uptime / 60000);
  const uptimeSeconds = Math.floor((metrics.uptime % 60000) / 1000);

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>📊 Performance Metrics</ThemedText>

      <ThemedView style={styles.metricsGrid}>
        <ThemedView style={styles.metricBox}>
          <ThemedText style={styles.metricValue}>{metrics.totalCommands}</ThemedText>
          <ThemedText style={styles.metricLabel}>Total Commands</ThemedText>
        </ThemedView>

        <ThemedView style={styles.metricBox}>
          <ThemedText style={[styles.metricValue, { color: '#34C759' }]}>
            {metrics.successfulCommands}
          </ThemedText>
          <ThemedText style={styles.metricLabel}>Successful</ThemedText>
        </ThemedView>

        <ThemedView style={styles.metricBox}>
          <ThemedText style={[styles.metricValue, { color: '#FF3B30' }]}>
            {metrics.failedCommands}
          </ThemedText>
          <ThemedText style={styles.metricLabel}>Failed</ThemedText>
        </ThemedView>

        <ThemedView style={styles.metricBox}>
          <ThemedText style={styles.metricValue}>
            {metrics.successRate.toFixed(1)}%
          </ThemedText>
          <ThemedText style={styles.metricLabel}>Success Rate</ThemedText>
        </ThemedView>

        <ThemedView style={styles.metricBox}>
          <ThemedText style={styles.metricValue}>
            {metrics.averageLatency.toFixed(0)}ms
          </ThemedText>
          <ThemedText style={styles.metricLabel}>Avg Latency</ThemedText>
        </ThemedView>

        <ThemedView style={styles.metricBox}>
          <ThemedText style={styles.metricValue}>
            {uptimeMinutes}:{uptimeSeconds.toString().padStart(2, '0')}
          </ThemedText>
          <ThemedText style={styles.metricLabel}>Uptime</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  metricLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'center',
  },
});
