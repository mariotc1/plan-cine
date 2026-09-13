'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useSheetAnimation } from '@/hooks/useSheetAnimation';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'lg:max-w-sm',
  md: 'lg:max-w-md',
  lg: 'lg:max-w-lg',
} as const;

interface ResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: keyof typeof SIZES;
  /** Base z-index — backdrop uses this, panel uses +1. Bump for a sheet stacked above another. */
  zIndex?: number;
  showHandle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Bottom sheet on mobile (drag-to-dismiss, unchanged from the original hand-rolled pattern),
 * centered modal on desktop (`lg:`) — fade/scale, no drag, closes on backdrop/Escape/X.
 * Swap-in replacement for the old per-file `AnimatePresence` + backdrop + `motion.div` block.
 */
export function ResponsiveSheet({
  open,
  onClose,
  children,
  size = 'md',
  zIndex = 60,
  showHandle = true,
  className,
  style,
}: ResponsiveSheetProps) {
  const isDesktop = useIsDesktop();
  const sheet = useSheetAnimation(onClose);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const desktopMotionProps = {
    initial: { opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 8 },
    transition: reduced ? { duration: 0.15 } : { type: 'spring' as const, stiffness: 420, damping: 34 },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:bg-black/70 lg:backdrop-blur-md"
            style={{ zIndex }}
            onClick={onClose}
          />

          {/* Layout wrapper — bottom-anchored on mobile, centered on desktop. Not itself animated. */}
          <div
            className="fixed inset-0 flex flex-col justify-end items-stretch lg:items-center lg:justify-center lg:p-6 pointer-events-none"
            style={{ zIndex: zIndex + 1 }}
          >
            <motion.div
              {...(isDesktop ? desktopMotionProps : sheet.motionProps)}
              className={cn(
                'pointer-events-auto relative w-full bg-zinc-950 border-t border-white/10 rounded-t-3xl',
                'lg:border lg:rounded-3xl lg:shadow-2xl lg:shadow-black/50 lg:mx-auto',
                SIZES[size],
                className
              )}
              style={style}
            >
              {showHandle && (
                <div
                  className="flex justify-center pt-3 pb-1 select-none lg:hidden"
                  {...sheet.handleProps}
                >
                  <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>
              )}
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="hidden lg:flex absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 items-center justify-center text-zinc-400 transition-colors z-10"
              >
                <X size={15} />
              </button>
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
