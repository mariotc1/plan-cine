'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { InstallBanner } from '@/components/shared/InstallBanner';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/groups');
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 overflow-hidden">

      {/* Glow orbs de fondo */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full bg-violet-500/8 blur-3xl pointer-events-none"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">

        {/* Logo animado */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-7"
        >
          <motion.div
            animate={{
              filter: [
                'drop-shadow(0 0 12px rgba(99,102,241,0.2))',
                'drop-shadow(0 0 36px rgba(99,102,241,0.55))',
                'drop-shadow(0 0 12px rgba(99,102,241,0.2))',
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image src="/logo.png" alt="Plan Cine" width={130} height={130} priority />
          </motion.div>
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="text-4xl font-bold text-white tracking-tight"
        >
          Plan Cine
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42 }}
          className="text-zinc-400 mt-2 text-[15px] leading-relaxed"
        >
          Las noches de cine en familia,<br />organizadas y perfectas.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-wrap justify-center gap-2 mt-7"
        >
          {['🎬 Lista de pelis', '🎰 Ruleta', '⭐ Valoraciones', '📊 Estadísticas'].map((f) => (
            <span
              key={f}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-zinc-400 border border-white/[0.07]"
            >
              {f}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.7 }}
          className="w-full mt-10 space-y-3"
        >
          <Link
            href="/login"
            className="flex items-center justify-center w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold text-base transition-colors shadow-[0_4px_28px_-4px_rgba(99,102,241,0.55)]"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="flex items-center justify-center w-full h-14 rounded-2xl bg-white/[0.06] hover:bg-white/10 active:bg-white/[0.04] text-white font-semibold text-base transition-colors border border-white/[0.09]"
          >
            Crear cuenta
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-zinc-600 text-xs mt-8"
        >
          Gratis · Sin anuncios · Solo para tu familia
        </motion.p>

      </div>

      <InstallBanner />
    </div>
  );
}
