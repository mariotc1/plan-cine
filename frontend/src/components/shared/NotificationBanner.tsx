'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToPush, isPushSupported } from '@/hooks/usePushNotifications';

export function NotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (isPushSupported()) setPermission(Notification.permission);
  }, []);

  const handleActivate = async () => {
    if (requesting) return;
    setRequesting(true);
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') subscribeToPush();
    setRequesting(false);
  };

  if (!isPushSupported() || permission !== 'default') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="notif-banner"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 340, damping: 30 }}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-40"
      >
        <div className="bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl shadow-black/50">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={15} className="text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">Activa las notificaciones</p>
            <p className="text-zinc-500 text-xs mt-0.5">Para saber cuándo termina cada película</p>
          </div>
          <button
            onClick={handleActivate}
            disabled={requesting}
            className="flex-shrink-0 h-8 px-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {requesting ? '...' : 'Activar'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
