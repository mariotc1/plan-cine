'use client';

import { useRef, useCallback } from 'react';

interface Options {
  onLongPress: () => void;
  /** ms to hold before firing (default 450) */
  delay?: number;
  /** px of movement that cancels the press (default 8) */
  moveThreshold?: number;
}

/**
 * Returns pointer event handlers that fire `onLongPress` after `delay` ms
 * of stationary touch/click, and cancel on any significant movement.
 * Completely independent of Framer Motion drag — they don't conflict because
 * drag requires movement while long-press requires stillness.
 */
export function useLongPress({ onLongPress, delay = 450, moveThreshold = 8 }: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      firedRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY };
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress();
        timerRef.current = null;
        startRef.current = null;
      }, delay);
    },
    [onLongPress, delay]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current || !timerRef.current) return;
      const dx = Math.abs(e.clientX - startRef.current.x);
      const dy = Math.abs(e.clientY - startRef.current.y);
      if (dx > moveThreshold || dy > moveThreshold) cancel();
    },
    [cancel, moveThreshold]
  );

  const onPointerUp = useCallback(() => cancel(), [cancel]);
  const onPointerLeave = useCallback(() => cancel(), [cancel]);

  /** True if the last interaction ended via long-press (use to suppress click) */
  const didFire = useCallback(() => {
    const result = firedRef.current;
    firedRef.current = false;
    return result;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerLeave, didFire };
}
