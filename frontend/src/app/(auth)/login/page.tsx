'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { fadeInUp } from '@/lib/animations';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div {...fadeInUp}>
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-9">
        <div className="relative mb-5">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 pointer-events-none" />
          <Image src="/logo.png" alt="Plan Cine" width={80} height={80} className="relative" priority />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Bienvenido de nuevo</h1>
        <p className="text-zinc-500 mt-1 text-sm">Inicia sesión en Plan Cine</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Contraseña</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl h-12 pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-base mt-2 shadow-[0_4px_24px_-4px_rgba(99,102,241,0.55)]"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-7 pb-2">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-indigo-400 font-medium hover:text-indigo-300">
          Crear cuenta
        </Link>
      </p>
    </motion.div>
  );
}
