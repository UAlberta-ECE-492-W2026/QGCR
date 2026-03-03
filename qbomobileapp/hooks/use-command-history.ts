import { useState, useCallback } from 'react';

export interface CommandHistoryItem {
  id: string;
  name: string;
  commands: string[];
  createdAt: Date;
}

export function useCommandHistory() {
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);

  const saveRoutine = useCallback(
    (name: string, commands: string[]) => {
      const newRoutine: CommandHistoryItem = {
        id: Date.now().toString(),
        name,
        commands,
        createdAt: new Date(),
      };
      setHistory((prev) => [newRoutine, ...prev]);
      return newRoutine;
    },
    []
  );

  const replayRoutine = useCallback((id: string) => {
    const routine = history.find((r) => r.id === id);
    return routine?.commands || [];
  }, [history]);

  const deleteRoutine = useCallback((id: string) => {
    setHistory((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    saveRoutine,
    replayRoutine,
    deleteRoutine,
    clearHistory,
  };
}
