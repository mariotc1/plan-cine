'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { fadeInUp } from '@/lib/animations';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <div className="text-center mb-10">
        <div className="flex justify-center mb-3">
          <Image src="/logo.png" alt="Plan Cine" width={140} height={140} className="drop-shadow-[0_0_28px_rgba(255,255,255,0.15)]" priority />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Plan Cine</h1>
        <p className="text-zinc-400 mt-1 text-sm">Las noches de cine en familia</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-zinc-300">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Contraseña</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-base mt-2 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.5)]"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-6">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-indigo-400 font-medium hover:text-indigo-300">
          Regístrate
        </Link>
      </p>
    </motion.div>
  );
}
