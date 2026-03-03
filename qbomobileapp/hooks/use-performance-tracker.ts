import { useState, useCallback, useRef } from 'react';

export interface PerformanceMetrics {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageLatency: number; // ms
  successRate: number; // 0-100%
  uptime: number; // ms
}

export function usePerformanceTracker() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalCommands: 0,
    successfulCommands: 0,
    failedCommands: 0,
    averageLatency: 0,
    successRate: 0,
    uptime: 0,
  });

  const latencies = useRef<number[]>([]);
  const startTime = useRef<number>(Date.now());

  const recordCommand = useCallback(
    (success: boolean, latency: number) => {
      latencies.current.push(latency);

      const total = metrics.totalCommands + 1;
      const successful = success ? metrics.successfulCommands + 1 : metrics.successfulCommands;
      const failed = !success ? metrics.failedCommands + 1 : metrics.failedCommands;

      const avgLatency = latencies.current.reduce((a, b) => a + b, 0) / latencies.current.length;
      const successRate = (successful / total) * 100;
      const uptime = Date.now() - startTime.current;

      setMetrics({
        totalCommands: total,
        successfulCommands: successful,
        failedCommands: failed,
        averageLatency: avgLatency,
        successRate,
        uptime,
      });
    },
    [metrics]
  );

  const reset = useCallback(() => {
    latencies.current = [];
    startTime.current = Date.now();
    setMetrics({
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      averageLatency: 0,
      successRate: 0,
      uptime: 0,
    });
  }, []);

  return { metrics, recordCommand, reset };
}
