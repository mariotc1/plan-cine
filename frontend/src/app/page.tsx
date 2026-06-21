'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Film, Shuffle, Star } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { InstallBanner } from '@/components/shared/InstallBanner';

const features = [
  { icon: Film, label: 'Lista compartida de películas' },
  { icon: Shuffle, label: 'Ruleta para elegir qué ver' },
  { icon: Star, label: 'Valoraciones y estadísticas del grupo' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/groups');
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  return (
    <div className="relative min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center px-6 py-14 overflow-hidden">

      {/* Subtle static glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 65%)' }}
      />

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm space-y-8">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-indigo-500/25 blur-3xl rounded-full scale-150 pointer-events-none" />
            <Image src="/logo.png" alt="Plan Cine" width={116} height={116} className="relative" priority />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h1 className="text-[44px] font-bold text-white tracking-tight leading-none">Plan Cine</h1>
          <p className="text-zinc-400 mt-3 text-[15px] leading-relaxed max-w-[260px] mx-auto">
            Las mejores noches de cine, organizadas y perfectas.
          </p>
        </motion.div>

        {/* Feature list — iOS settings style */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42 }}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.05]"
        >
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-indigo-400" />
              </div>
              <span className="text-sm text-zinc-300 text-left">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.56 }}
          className="w-full space-y-3"
        >
          <Link
            href="/login"
            className="flex items-center justify-center w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold text-base transition-colors shadow-[0_4px_32px_-4px_rgba(99,102,241,0.6)]"
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

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.72 }}
          className="text-zinc-600 text-xs"
        >
          Gratis · Sin anuncios · Para cualquier grupo
        </motion.p>

      </div>

      <InstallBanner />
    </div>
  );
}
