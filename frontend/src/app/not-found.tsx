'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Film, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center gap-5 max-w-xs w-full"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
          <Film size={28} className="text-zinc-500" />
        </div>
        <div>
          <p className="text-zinc-600 text-xs font-semibold uppercase tracking-widest mb-2">404</p>
          <h1 className="text-white font-bold text-xl">Página no encontrada</h1>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
            Esta página no existe o ha sido eliminada.
          </p>
        </div>
        <Link
          href="/groups"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white font-semibold text-sm"
        >
          <ArrowLeft size={15} />
          Volver al inicio
        </Link>
      </motion.div>
    </div>
  );
}
