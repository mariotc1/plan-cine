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
    <div
      className="relative min-h-[100dvh] flex flex-col items-center justify-center px-10 py-14 overflow-hidden lg:px-6"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 40px)' }}
    >
      {/* Desktop-only ambient glow — same language as the login/register card */}
      <div
        className="hidden lg:block fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(620px circle at 50% 42%, rgba(99,102,241,0.16), transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm space-y-9 lg:bg-zinc-900/50 lg:border lg:border-white/[0.07] lg:rounded-3xl lg:px-12 lg:py-16 lg:shadow-2xl lg:shadow-black/50">

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
            Decidid qué ver esta noche.
            <br />
            Sin discutir.
          </p>
        </motion.div>

        {/* CTAs — one clear primary action, the other lives as a quiet link */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full space-y-4"
        >
          <Link
            href="/login"
            className="flex items-center justify-center w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-medium text-[15px] transition-colors shadow-[0_2px_16px_-4px_rgba(99,102,241,0.45)]"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ¿No tienes cuenta? <span className="text-indigo-400 font-medium">Crear una</span>
          </Link>
        </motion.div>

      </div>

      <InstallBanner />
    </div>
  );
}
