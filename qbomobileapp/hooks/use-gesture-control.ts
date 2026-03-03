import { useState, useCallback, useRef, useEffect } from 'react';
import { GestureResponderEvent } from 'react-native';

interface GestureState {
  x: number;
  y: number;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  distance: number;
}

type GestureHandler = (state: GestureState) => void;

export function useGestureControl() {
  const [isSwipe, setIsSwipe] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);

  const onTouchStart = useCallback((evt: GestureResponderEvent) => {
    const { x, y } = evt.nativeEvent;
    startPos.current = { x, y };
    lastPos.current = { x, y };
    lastTime.current = Date.now();
  }, []);

  const onTouchMove = useCallback(
    (evt: GestureResponderEvent, onGesture: GestureHandler) => {
      const { x, y } = evt.nativeEvent;
      const currentTime = Date.now();
      const timeDelta = currentTime - lastTime.current;

      const dx = x - startPos.current.x;
      const dy = y - startPos.current.y;
      const vx = (x - lastPos.current.x) / (timeDelta || 1);
      const vy = (y - lastPos.current.y) / (timeDelta || 1);
      const distance = Math.sqrt(dx * dx + dy * dy);

      lastPos.current = { x, y };
      lastTime.current = currentTime;

      if (distance > 10) {
        setIsSwipe(true);
      }

      onGesture({
        x,
        y,
        dx,
        dy,
        vx,
        vy,
        distance,
      });
    },
    []
  );

  const onTouchEnd = useCallback(() => {
    setIsSwipe(false);
  }, []);

  return {
    isSwipe,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// Helper to detect specific gestures
export function detectSwipeDirection(
  state: GestureState,
  threshold: number = 50
): 'up' | 'down' | 'left' | 'right' | 'none' {
  const { dx, dy } = state;

  if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }

  if (Math.abs(dy) > threshold && Math.abs(dy) > Math.abs(dx)) {
    return dy > 0 ? 'down' : 'up';
  }

  return 'none';
}
