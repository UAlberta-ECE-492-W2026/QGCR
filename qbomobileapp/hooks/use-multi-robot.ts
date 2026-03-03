import { useState, useCallback } from 'react';

export interface Robot {
  id: string;
  name: string;
  address: string;
  lastConnected?: Date;
}

export function useMultiRobotSupport() {
  const [robots, setRobots] = useState<Robot[]>([
    {
      id: '1',
      name: 'QBO-1',
      address: 'localhost:3000',
    },
  ]);
  const [selectedRobotId, setSelectedRobotId] = useState<string>('1');

  const selectedRobot = robots.find((r) => r.id === selectedRobotId);

  const addRobot = useCallback((name: string, address: string) => {
    const newRobot: Robot = {
      id: Date.now().toString(),
      name,
      address,
      lastConnected: undefined,
    };
    setRobots((prev) => [...prev, newRobot]);
    return newRobot;
  }, []);

  const removeRobot = useCallback((id: string) => {
    setRobots((prev) => prev.filter((r) => r.id !== id));
    if (selectedRobotId === id && robots.length > 1) {
      setSelectedRobotId(robots[0].id);
    }
  }, [selectedRobotId, robots]);

  const updateRobotLastConnected = useCallback((id: string) => {
    setRobots((prev) =>
      prev.map((r) => (r.id === id ? { ...r, lastConnected: new Date() } : r))
    );
  }, []);

  const switchRobot = useCallback((id: string) => {
    if (robots.find((r) => r.id === id)) {
      setSelectedRobotId(id);
    }
  }, [robots]);

  return {
    robots,
    selectedRobot,
    selectedRobotId,
    addRobot,
    removeRobot,
    switchRobot,
    updateRobotLastConnected,
  };
}
