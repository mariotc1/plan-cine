'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useSheetAnimation } from '@/hooks/useSheetAnimation';

interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmSheet({
  open, onClose, onConfirm, loading,
  title, message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
}: ConfirmSheetProps) {
  const { motionProps, handleProps } = useSheetAnimation(onClose);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/65 z-[80] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            {...motionProps}
            className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[480px] z-[81] bg-zinc-950 border-t border-white/10 rounded-t-3xl"
          >
            <div className="flex justify-center pt-3 pb-0 select-none" {...handleProps}>
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="px-6 pt-6 pb-[max(env(safe-area-inset-bottom),28px)]">
              <div className="w-11 h-11 rounded-2xl bg-red-500/15 flex items-center justify-center mb-4">
                <AlertTriangle size={20} className="text-red-400" />
              </div>

              <h3 className="text-[18px] font-bold text-white leading-tight mb-2">{title}</h3>
              {message && (
                <p className="text-sm text-zinc-500 leading-relaxed mb-7">{message}</p>
              )}

              <div className="space-y-2.5 mt-6">
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-red-500/90 hover:bg-red-500 active:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Un momento...' : confirmLabel}
                </button>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-zinc-400 font-medium transition-colors border border-white/[0.08]"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
