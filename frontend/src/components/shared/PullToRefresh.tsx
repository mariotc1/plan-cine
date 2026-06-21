'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const THRESHOLD = 70;
const RESISTANCE = 0.42;

const R = 13;
const CIRC = 2 * Math.PI * R;
const SPINNER_ARC = CIRC * 0.72; // 260° arc for the spinning state

type Phase = 'idle' | 'pulling' | 'refreshing' | 'done';

export function PullToRefresh() {
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>('idle');
  const [pullY, setPullY] = useState(0);

  const startYRef = useRef(0);
  const pullYRef = useRef(0);
  const activeRef = useRef(false);
  const phaseRef = useRef<Phase>('idle');

  const syncPhase = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const syncPullY = (y: number) => { pullYRef.current = y; setPullY(y); };

  const doRefresh = useCallback(async () => {
    syncPhase('refreshing');
    syncPullY(0);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      syncPhase('done');
      setTimeout(() => syncPhase('idle'), 640);
    }
  }, [queryClient]);

  useEffect(() => {
    const winScrollTop = () =>
      Math.max(0, window.scrollY, document.documentElement.scrollTop);

    const insideScrolled = (el: EventTarget | null): boolean => {
      let node = el as HTMLElement | null;
      while (node && node !== document.documentElement) {
        if (node.scrollTop > 0) return true;
        node = node.parentElement;
      }
      return false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (phaseRef.current === 'refreshing' || phaseRef.current === 'done') return;
      if (winScrollTop() > 2) return;
      if (insideScrolled(e.target)) return;
      startYRef.current = e.touches[0].clientY;
      activeRef.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!activeRef.current || phaseRef.current === 'refreshing') return;
      if (winScrollTop() > 2) {
        activeRef.current = false;
        syncPhase('idle');
        syncPullY(0);
        return;
      }
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff <= 0) {
        syncPhase('idle');
        syncPullY(0);
        return;
      }
      syncPhase('pulling');
      syncPullY(Math.min(diff * RESISTANCE, THRESHOLD * 1.65));
    };

    const onTouchEnd = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      if (phaseRef.current === 'pulling' && pullYRef.current >= THRESHOLD) {
        doRefresh();
      } else {
        syncPhase('idle');
        syncPullY(0);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [doRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const isReady = progress >= 1;

  // Indicator position: follows finger while pulling, snaps to rest when refreshing/done
  const indicatorY = phase === 'pulling' ? Math.max(10, pullY * 0.85) : 52;

  // Arc fill: from empty (CIRC) to full (0) as progress goes 0→1
  const arcOffset = CIRC * (1 - progress * 0.88);

  // Colors
  const arcColor = isReady ? '#6366f1' : 'rgba(255,255,255,0.25)';
  const ringColor = phase === 'done' ? '#22c55e' : isReady ? '#6366f1' : 'rgba(255,255,255,0.07)';

  return (
    <AnimatePresence>
      {phase !== 'idle' && (
        <div
          className="fixed top-0 z-[55] pointer-events-none"
          style={{
            left: '50%',
            transform: `translateX(-50%) translateY(${indicatorY}px)`,
            transition: phase !== 'pulling'
              ? 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1)'
              : 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{
              opacity: phase === 'pulling' ? Math.max(0.35, progress * 1.1) : 1,
              scale: phase === 'pulling' ? 0.55 + progress * 0.45 : 1,
            }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.22 } }}
            transition={{ duration: 0 }}
          >
            {/* Container */}
            <div className="relative w-11 h-11 flex items-center justify-center">

              {/* Glass pill background */}
              <div className="absolute inset-0 rounded-full bg-zinc-900/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]" />

              {/* Pulling: filling arc */}
              {phase === 'pulling' && (
                <svg
                  width="44" height="44" viewBox="0 0 44 44"
                  className="absolute"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  {/* Track ring */}
                  <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                  {/* Filling arc */}
                  <circle
                    cx="22" cy="22" r={R}
                    fill="none"
                    stroke={arcColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={arcOffset}
                    style={{ transition: 'stroke 0.15s ease' }}
                  />
                </svg>
              )}

              {/* Refreshing: spinning arc */}
              {phase === 'refreshing' && (
                <motion.svg
                  width="44" height="44" viewBox="0 0 44 44"
                  className="absolute"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  style={{ originX: '50%', originY: '50%' }}
                >
                  <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                  <circle
                    cx="22" cy="22" r={R}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${SPINNER_ARC} ${CIRC - SPINNER_ARC}`}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </motion.svg>
              )}

              {/* Done: green ring + check */}
              {phase === 'done' && (
                <motion.svg
                  width="44" height="44" viewBox="0 0 44 44"
                  className="absolute"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                >
                  <circle cx="22" cy="22" r={R} fill="none" stroke={ringColor} strokeWidth="2.5" />
                </motion.svg>
              )}

              {/* Center icon */}
              <div className="relative z-10 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {phase === 'done' ? (
                    <motion.div
                      key="check"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <Check size={14} className="text-emerald-400" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dot"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full transition-colors duration-150"
                        style={{ backgroundColor: phase === 'refreshing' ? '#6366f1' : isReady ? '#6366f1' : 'rgba(255,255,255,0.3)' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
