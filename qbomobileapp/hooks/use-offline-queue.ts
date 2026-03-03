import { useState, useCallback, useEffect } from 'react';

export interface QueuedCommand {
  id: string;
  command: string;
  params?: any;
  addedAt: Date;
  retries: number;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedCommand[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const addToQueue = useCallback((command: string, params?: any) => {
    const queuedCommand: QueuedCommand = {
      id: Date.now().toString(),
      command,
      params,
      addedAt: new Date(),
      retries: 0,
    };
    setQueue((prev) => [...prev, queuedCommand]);
    return queuedCommand;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((cmd) => cmd.id !== id));
  }, []);

  const executeQueue = useCallback(
    async (executor: (cmd: QueuedCommand) => Promise<boolean>) => {
      for (const cmd of queue) {
        try {
          const success = await executor(cmd);
          if (success) {
            removeFromQueue(cmd.id);
          } else {
            // Increment retry count
            setQueue((prev) =>
              prev.map((c) => (c.id === cmd.id ? { ...c, retries: c.retries + 1 } : c))
            );
          }
        } catch (error) {
          console.error('Queue execution error:', error);
        }
      }
    },
    [queue, removeFromQueue]
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    queue,
    isOnline,
    setIsOnline,
    addToQueue,
    removeFromQueue,
    executeQueue,
    clearQueue,
  };
}
