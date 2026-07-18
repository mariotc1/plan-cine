'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          className="sticky top-0 z-[100] flex items-center gap-2.5 px-4 py-2.5 bg-amber-500/95 backdrop-blur-sm border-b border-amber-400/30"
        >
          <WifiOff size={14} className="text-amber-950 flex-shrink-0" strokeWidth={2.5} />
          <p className="text-[12px] font-semibold text-amber-950 leading-none">
            Sin conexión · Los cambios se guardarán cuando vuelvas a conectarte
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
