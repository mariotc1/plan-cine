'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

// global-error replaces the root layout when it fires — must include <html> + <body>
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global error boundary]', error);
  }, [error]);

  return (
    <html lang="es" className="dark" style={{ backgroundColor: '#09090b' }}>
      <body style={{ margin: 0, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#fafafa', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '320px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            ⚠️
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>Error crítico</p>
            <p style={{ color: '#71717a', fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
              La aplicación no pudo cargarse. Recarga la página para continuar.
            </p>
          </div>
          <button
            onClick={reset}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}
          >
            <RefreshCw size={15} />
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
