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
import { AVATARS, COLORS } from '@/lib/constants';
import { fadeInUp } from '@/lib/animations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, password_confirmation: passwordConfirm, avatar, color });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div {...fadeInUp}>
      <div className="text-center mb-7">
        <div className="flex justify-center mb-3">
          <Image src="/logo.png" alt="Plan Cine" width={110} height={110} className="drop-shadow-[0_0_24px_rgba(255,255,255,0.15)]" priority />
        </div>
        <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
        <p className="text-zinc-400 text-sm mt-1">Únete a Plan Cine</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar picker */}
        <div className="space-y-2">
          <Label className="text-zinc-300 text-sm">Elige tu avatar</Label>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={cn(
                  'w-full aspect-square rounded-xl text-lg flex items-center justify-center transition-all',
                  avatar === a
                    ? 'bg-indigo-500/30 ring-2 ring-indigo-500'
                    : 'bg-zinc-900 hover:bg-zinc-800'
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker — 8 colores, una fila */}
        <div className="space-y-2">
          <Label className="text-zinc-300 text-sm">Color identificativo</Label>
          <div className="flex justify-between">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-9 h-9 rounded-full transition-transform',
                  color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : 'hover:scale-110'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300 text-sm">Nombre</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300 text-sm">Email</Label>
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
          <Label className="text-zinc-300 text-sm">Contraseña</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12 pr-11"
              required
              minLength={8}
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

        <div className="space-y-2">
          <Label className="text-zinc-300 text-sm">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12 pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-base shadow-[0_4px_20px_-4px_rgba(99,102,241,0.5)]"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-6 pb-4">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-indigo-400 font-medium hover:text-indigo-300">
          Inicia sesión
        </Link>
      </p>
    </motion.div>
  );
}
