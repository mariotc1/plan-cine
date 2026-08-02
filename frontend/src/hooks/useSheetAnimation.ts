'use client';

import { useDragControls, useReducedMotion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';

/**
 * Encapsulates Apple-style bottom sheet behaviour:
 *  - Spring entrance / exit (skipped if prefers-reduced-motion)
 *  - Drag handle area triggers pull-to-dismiss
 *  - Velocity or distance threshold closes the sheet
 */
export function useSheetAnimation(onClose: () => void) {
  const controls = useDragControls();
  const reduced = useReducedMotion();

  const motionProps = {
    initial: { y: reduced ? 0 : '100%' },
    animate: { y: 0 },
    exit: { y: reduced ? 0 : '100%' },
    transition: reduced
      ? { duration: 0.15 }
      : { type: 'spring' as const, stiffness: 320, damping: 32 },

    // Drag is only wired when not in reduced-motion mode
    ...(reduced
      ? {}
      : {
          drag: 'y' as const,
          dragConstraints: { top: 0, bottom: 0 },
          dragElastic: { top: 0, bottom: 0.4 },
          dragControls: controls,
          dragListener: false,
          onDragEnd: (
            _event: MouseEvent | TouchEvent | PointerEvent,
            info: PanInfo
          ) => {
            // Close on slow long-drag OR fast flick downward
            if (info.offset.y > 120 || info.velocity.y > 500) {
              onClose();
            }
          },
        }),
  };

  // Spread on the handle pill container to start drag
  const handleProps = reduced
    ? {}
    : {
        onPointerDown: (e: React.PointerEvent) => controls.start(e),
        style: { touchAction: 'none' as const, cursor: 'grab' as const },
      };

  return { motionProps, handleProps };
}
