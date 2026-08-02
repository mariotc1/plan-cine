'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App error boundary]', error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-5 max-w-xs w-full"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-white font-bold text-xl">Algo salió mal</h1>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
            Ha ocurrido un error inesperado en esta pantalla.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-indigo-500 text-white font-semibold text-sm shadow-[0_4px_20px_-4px_rgba(99,102,241,0.5)]"
          >
            <RefreshCw size={15} />
            Intentar de nuevo
          </motion.button>
          <Link
            href="/groups"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] text-zinc-300 font-semibold text-sm"
          >
            <ArrowLeft size={15} />
            Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
