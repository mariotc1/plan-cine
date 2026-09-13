'use client';

import { AlertTriangle } from 'lucide-react';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';

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
  return (
    <ResponsiveSheet open={open} onClose={onClose} size="sm">
      <div className="px-6 pt-6 pb-[max(env(safe-area-inset-bottom),28px)] lg:pb-8">
        <div className="w-11 h-11 rounded-2xl bg-red-500/15 flex items-center justify-center mb-4">
          <AlertTriangle size={20} className="text-red-400" />
        </div>

        <h3 className="text-[18px] font-bold text-white leading-tight mb-2 lg:pr-8">{title}</h3>
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
    </ResponsiveSheet>
  );
}
