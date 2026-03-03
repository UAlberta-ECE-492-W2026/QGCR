import { useState, useCallback, useEffect } from 'react';

export interface RobotStatus {
  isConnected: boolean;
  batteryLevel: number;
  position: {
    x: number;
    y: number;
    angle: number;
  };
  isMoving: boolean;
  lastCommand: string;
  error: string | null;
}

interface RobotCommand {
  type: 'move' | 'turn' | 'stop' | 'dance' | 'light' | 'sound';
  parameters: Record<string, any>;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const useQboRobot = () => {
  const [status, setStatus] = useState<RobotStatus>({
    isConnected: false,
    batteryLevel: 100,
    position: { x: 0, y: 0, angle: 0 },
    isMoving: false,
    lastCommand: 'None',
    error: null,
  });

  // Connect to robot
  const connect = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/robot/connect`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setStatus((prev) => ({
          ...prev,
          isConnected: true,
          error: null,
        }));
        return true;
      }
      throw new Error(data.message || 'Connection failed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus((prev) => ({
        ...prev,
        error: errorMessage,
        isConnected: false,
      }));
      return false;
    }
  }, []);

  // Disconnect from robot
  const disconnect = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/robot/disconnect`, {
        method: 'POST',
      });
      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Send command to robot
  const sendCommand = useCallback(async (command: RobotCommand) => {
    try {
      const response = await fetch(`${API_BASE_URL}/robot/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });
      const data = await response.json();
      if (data.success) {
        setStatus((prev) => ({
          ...prev,
          lastCommand: `${command.type.toUpperCase()} ${JSON.stringify(command.parameters)}`,
          error: null,
        }));
        return true;
      }
      throw new Error(data.message || 'Command failed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  // Move robot forward/backward
  const move = useCallback(
    async (distance: number, speed: number = 50) => {
      return sendCommand({
        type: 'move',
        parameters: { distance, speed },
      });
    },
    [sendCommand]
  );

  // Turn robot left/right
  const turn = useCallback(
    async (angle: number, speed: number = 50) => {
      return sendCommand({
        type: 'turn',
        parameters: { angle, speed },
      });
    },
    [sendCommand]
  );

  // Stop robot
  const stop = useCallback(async () => {
    return sendCommand({
      type: 'stop',
      parameters: {},
    });
  }, [sendCommand]);

  // Make robot dance
  const dance = useCallback(
    async (danceType: string = 'default') => {
      return sendCommand({
        type: 'dance',
        parameters: { danceType },
      });
    },
    [sendCommand]
  );

  // Control RGB lights
  const setLight = useCallback(
    async (red: number, green: number, blue: number, duration: number = 1000) => {
      return sendCommand({
        type: 'light',
        parameters: { red, green, blue, duration },
      });
    },
    [sendCommand]
  );

  // Play sound
  const playSound = useCallback(
    async (soundType: string, volume: number = 80) => {
      return sendCommand({
        type: 'sound',
        parameters: { soundType, volume },
      });
    },
    [sendCommand]
  );

  // Fetch robot status periodically
  useEffect(() => {
    if (!status.isConnected) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/robot/status`);
        const data = await response.json();
        if (data.success) {
          setStatus((prev) => ({
            ...prev,
            batteryLevel: data.battery || prev.batteryLevel,
            position: data.position || prev.position,
            isMoving: data.isMoving || false,
            error: null,
          }));
        }
      } catch (error) {
        // Silent error for polling
      }
    };

    const interval = setInterval(fetchStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [status.isConnected]);

  return {
    status,
    connect,
    disconnect,
    move,
    turn,
    stop,
    dance,
    setLight,
    playSound,
    sendCommand,
  };
};
