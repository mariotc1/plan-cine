'use client';

import { motion } from 'framer-motion';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-zinc-700 border-t-indigo-500 rounded-full"
      />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5 animate-pulse">
      <div className="h-5 bg-zinc-800 rounded-lg w-3/4 mb-3" />
      <div className="h-4 bg-zinc-800 rounded-lg w-1/2 mb-2" />
      <div className="h-4 bg-zinc-800 rounded-lg w-1/3" />
    </div>
  );
}
