'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error boundary]', error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
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
            Ha ocurrido un error inesperado. Puedes intentarlo de nuevo.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm shadow-[0_4px_20px_-4px_rgba(99,102,241,0.5)]"
        >
          <RefreshCw size={15} />
          Intentar de nuevo
        </motion.button>
      </motion.div>
    </div>
  );
}
