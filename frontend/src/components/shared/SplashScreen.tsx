'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

// Full-screen branded loading state — shown for the brief instants where the
// app is deciding where to send you (checking the session, redirecting to
// login or into the app) instead of a blank screen. Same logo+glow language
// as the landing page, just a quieter breathing pulse instead of a hero entrance.
export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative inline-flex"
      >
        <div className="absolute inset-0 bg-indigo-500/25 blur-3xl rounded-full scale-150 pointer-events-none" />
        <Image src="/logo.png" alt="Plan Cine" width={96} height={96} className="relative" priority />
      </motion.div>
    </div>
  );
}
