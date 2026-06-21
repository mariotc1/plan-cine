'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share, Plus } from 'lucide-react';
import Image from 'next/image';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallBanner() {
  const { canInstall, isInstalled, platform, install, dismiss } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  // Small delay so no aparece al instante en cada carga
  useEffect(() => {
    if (!canInstall || isInstalled) return;
    const t = setTimeout(() => setVisible(true), 2200);
    return () => clearTimeout(t);
  }, [canInstall, isInstalled]);

  const handleDismiss = () => {
    setVisible(false);
    setShowIOSGuide(false);
    dismiss();
  };

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowIOSGuide(true);
    } else {
      await install();
      setVisible(false);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Banner principal */}
      <AnimatePresence>
        {visible && !showIOSGuide && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96"
          >
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/60 flex items-center gap-3">
              <Image src="/icon-192.png" alt="Plan Cine" width={44} height={44} className="rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">Instala Plan Cine</p>
                <p className="text-zinc-400 text-xs mt-0.5 leading-tight">
                  {platform === 'ios' ? 'Añádela a tu pantalla de inicio' : 'Acceso rápido desde tu móvil'}
                </p>
              </div>
              <button
                onClick={handleInstall}
                className="flex-shrink-0 flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                {platform === 'ios' ? <Share size={13} /> : <Download size={13} />}
                {platform === 'ios' ? 'Cómo' : 'Instalar'}
              </button>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal guía iOS */}
      <AnimatePresence>
        {showIOSGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
              onClick={() => setShowIOSGuide(false)}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-white/10 rounded-t-3xl p-6 pb-10"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold text-xl">Instalar Plan Cine</h2>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-zinc-400"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Paso 1 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                    <Share size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Paso 1 — Toca Compartir</p>
                    <p className="text-zinc-400 text-sm mt-0.5 leading-relaxed">
                      En Safari, pulsa el icono <span className="text-white font-medium">Compartir</span> de la barra inferior (cuadrado con flecha hacia arriba).
                    </p>
                  </div>
                </div>

                <div className="w-px h-4 bg-white/10 ml-5" />

                {/* Paso 2 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                    <Plus size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Paso 2 — Añadir a pantalla de inicio</p>
                    <p className="text-zinc-400 text-sm mt-0.5 leading-relaxed">
                      Desplázate por el menú y pulsa <span className="text-white font-medium">"Añadir a pantalla de inicio"</span>.
                    </p>
                  </div>
                </div>

                <div className="w-px h-4 bg-white/10 ml-5" />

                {/* Paso 3 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                    <Image src="/icon-192.png" alt="" width={22} height={22} className="rounded-md" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Paso 3 — Confirma</p>
                    <p className="text-zinc-400 text-sm mt-0.5 leading-relaxed">
                      Pulsa <span className="text-white font-medium">"Añadir"</span> arriba a la derecha. Plan Cine aparecerá en tu pantalla de inicio.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="mt-8 w-full h-13 rounded-2xl bg-white/[0.06] border border-white/[0.09] text-zinc-400 text-sm font-medium"
              >
                Ya lo haré más tarde
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
