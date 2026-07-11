'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, emoji, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="relative mb-7">
        <div className="absolute inset-0 rounded-full bg-indigo-500/15 blur-2xl scale-[2]" />
        <div className="relative w-[72px] h-[72px] rounded-2xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center shadow-inner">
          {icon ? (
            <div className="text-zinc-500">{icon}</div>
          ) : (
            <span className="text-3xl">{emoji}</span>
          )}
        </div>
      </div>

      <h3 className="text-[17px] font-semibold text-white mb-1.5 tracking-tight">{title}</h3>
      {description && (
        <p className="text-[13px] text-zinc-500 max-w-[260px] leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
