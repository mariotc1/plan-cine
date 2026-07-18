'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { ShareCard, type ShareCardProps } from './ShareCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CinemaSession } from '@/types';
import { useAuthStore } from '@/stores/authStore';

// ─── Canvas image generation ────────────────────────────────────────────────

const W = 390;
const H = 560;
const SCALE = 2;

// Layout constants — mirror ShareCard.tsx (portrait)
const PAD = 24;
const POSTER_X = PAD;
const POSTER_Y = PAD;
const POSTER_W = W - PAD * 2;   // 342
const POSTER_H_C = 295;
const INFO_X = PAD;
const INFO_W = W - PAD * 2;     // 342
const INFO_Y = POSTER_Y + POSTER_H_C + 18; // 337
const INFO_BOTTOM = H - PAD;    // 536
const FONT = '-apple-system, BlinkMacSystemFont, system-ui, sans-serif';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const inner = r * 0.42;
  const pts = 5;
  let angle = -Math.PI / 2;
  const step = (Math.PI * 2) / pts;
  ctx.beginPath();
  for (let i = 0; i < pts; i++) {
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    angle += step / 2;
    ctx.lineTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    angle += step / 2;
  }
  ctx.closePath();
}

async function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

async function generateImage(props: ShareCardProps): Promise<Blob | null> {
  const {
    mode, movieTitle, posterPath, rating, ratingCount,
    userName, userAvatar, userColor, groupName, participants = [],
  } = props;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(SCALE, SCALE);

  // 1 — Background + clip card
  roundRectPath(ctx, 0, 0, W, H, 24);
  ctx.fillStyle = '#09090b';
  ctx.fill();
  ctx.save();
  roundRectPath(ctx, 0, 0, W, H, 24);
  ctx.clip();

  // 2 — App gradient: indigo glow from bottom-left
  const grd = ctx.createRadialGradient(0, H, 0, 0, H, W * 0.9);
  grd.addColorStop(0, 'rgba(99,102,241,0.28)');
  grd.addColorStop(0.6, 'rgba(99,102,241,0.08)');
  grd.addColorStop(1, 'rgba(99,102,241,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // 3 — Poster shadow then background fill
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 10;
  roundRectPath(ctx, POSTER_X, POSTER_Y, POSTER_W, POSTER_H_C, 14);
  ctx.fillStyle = '#18181b';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 4 — Poster image clipped to rounded rect
  ctx.save();
  roundRectPath(ctx, POSTER_X, POSTER_Y, POSTER_W, POSTER_H_C, 14);
  ctx.clip();
  if (posterPath) {
    const img = await loadImg(`https://image.tmdb.org/t/p/w500${posterPath}`);
    if (img && img.naturalWidth > 0) {
      const targetAR = POSTER_W / POSTER_H_C;
      const imgAR = img.naturalWidth / img.naturalHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (imgAR > targetAR) { sw = sh * targetAR; sx = (img.naturalWidth - sw) / 2; }
      else { sh = sw / targetAR; sy = (img.naturalHeight - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, POSTER_X, POSTER_Y, POSTER_W, POSTER_H_C);
    }
  }
  ctx.restore(); // end poster clip

  // ── Info section ─────────────────────────────────────────────────────────

  const modeLabel = mode === 'personal'
    ? (userName ?? '').toUpperCase()
    : (groupName ?? 'El grupo').toUpperCase();

  const displayRating = rating > 0 ? (Math.round(rating * 10) / 10).toFixed(1) : null;

  const ratingLine = mode === 'personal'
    ? 'Mi valoración'
    : ratingCount
      ? `${ratingCount} ${ratingCount === 1 ? 'valoración' : 'valoraciones'}`
      : 'Sin valoraciones';

  let y = INFO_Y;

  // 5 — Mode label
  ctx.fillStyle = '#52525b';
  ctx.font = `600 10px ${FONT}`;
  ctx.fillText(modeLabel, INFO_X, y + 10);
  y += 10 + 8;

  // 6 — Title (max 2 lines)
  const titleSize = movieTitle.length > 22 ? 18 : 22;
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${titleSize}px ${FONT}`;
  const titleLines = wrapText(ctx, movieTitle, INFO_W).slice(0, 2);
  for (const line of titleLines) {
    ctx.fillText(line, INFO_X, y + titleSize);
    y += Math.round(titleSize * 1.2);
  }
  y += 10;

  // 7 — Stars row
  const full = Math.round(Math.max(0, Math.min(5, rating)));
  const starR = 6.5;
  const starSpacing = 15;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, INFO_X + starR + i * starSpacing, y + starR, starR);
    ctx.fillStyle = i < full ? '#f59e0b' : 'rgba(245,158,11,0.15)';
    ctx.fill();
    ctx.strokeStyle = i < full ? '#f59e0b' : 'rgba(245,158,11,0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  if (displayRating) {
    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillText(displayRating, INFO_X + 5 * starSpacing + 8, y + starR + 5);
  }
  y += starR * 2 + 3;

  // 8 — Rating sub-label
  ctx.fillStyle = '#52525b';
  ctx.font = `11px ${FONT}`;
  ctx.fillText(ratingLine, INFO_X, y + 11);

  // ── Bottom row — anchored from bottom ────────────────────────────────────

  const AV = 28;
  const AV_Y = INFO_BOTTOM - AV; // 508

  // Separator
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(INFO_X, AV_Y - 14 - 1, INFO_W, 1);

  // 9 — Avatars
  if (mode === 'personal') {
    roundRectPath(ctx, INFO_X, AV_Y, AV, AV, 8);
    ctx.fillStyle = userColor ? `${userColor}28` : '#27272a';
    ctx.fill();
    ctx.font = `15px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(userAvatar ?? '🎬', INFO_X + AV / 2, AV_Y + 21);
    ctx.textAlign = 'left';
  } else {
    let ax = INFO_X;
    for (const p of participants.slice(0, 5)) {
      roundRectPath(ctx, ax, AV_Y, AV, AV, 8);
      ctx.fillStyle = `${p.color}28`;
      ctx.fill();
      ctx.font = `14px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.avatar, ax + AV / 2, AV_Y + 20);
      ctx.textAlign = 'left';
      ax += AV + 6;
    }
    if (participants.length > 5) {
      roundRectPath(ctx, ax, AV_Y, AV, AV, 8);
      ctx.fillStyle = '#27272a';
      ctx.fill();
      ctx.fillStyle = '#71717a';
      ctx.font = `600 10px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`+${participants.length - 5}`, ax + AV / 2, AV_Y + 18);
      ctx.textAlign = 'left';
    }
  }

  // 10 — "Plan Cine" branding
  ctx.fillStyle = '#52525b';
  ctx.font = `600 10px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText('Plan Cine', INFO_X + INFO_W, AV_Y + 19);
  ctx.textAlign = 'left';

  ctx.restore(); // end card clip

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// ─── Sheet component ─────────────────────────────────────────────────────────

interface ShareCardSheetProps {
  open: boolean;
  onClose: () => void;
  session: CinemaSession;
  groupName?: string;
}

const CARD_W = 390;
const CARD_H = 560;
const PREVIEW_SCALE = 0.6;

export function ShareCardSheet({ open, onClose, session, groupName }: ShareCardSheetProps) {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'personal' | 'group'>('group');
  const [sharing, setSharing] = useState(false);

  const userRating = session.ratings.find((r) => r.user.id === user?.id);
  const hasPersonalRating = !!userRating;
  const rating = mode === 'personal' && userRating ? userRating.score : (session.average_rating ?? 0);

  const cardProps: ShareCardProps = {
    mode,
    movieTitle: session.movie?.title ?? '',
    posterPath: session.movie?.poster_path,
    rating,
    ratingCount: session.ratings.length,
    userName: user?.name,
    userAvatar: user?.avatar,
    userColor: user?.color,
    groupName,
    participants: session.participants,
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await generateImage(cardProps);
      if (!blob) return;
      const file = new File([blob], 'plan-cine.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${session.movie?.title} — Plan Cine` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plan-cine.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // user cancelled or share unsupported — silent
    } finally {
      setSharing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 z-[80] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[480px] z-[81] bg-zinc-950 border-t border-white/10 rounded-t-3xl"
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="px-6 pt-3 pb-4 border-b border-white/[0.06]">
              <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mb-1">Compartir</p>
              <h2 className="text-white font-bold text-lg leading-tight">{session.movie?.title}</h2>
            </div>

            <div className="px-6 py-5">
              {/* Toggle */}
              <div className="flex gap-2 mb-5 p-1 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
                {(['group', 'personal'] as const).map((m) => {
                  const disabled = m === 'personal' && !hasPersonalRating;
                  return (
                    <button
                      key={m}
                      onClick={() => !disabled && setMode(m)}
                      disabled={disabled}
                      className={cn(
                        'flex-1 h-8 rounded-xl text-[13px] font-semibold transition-all',
                        mode === m ? 'bg-white/10 text-white' : 'text-zinc-500',
                        disabled && 'opacity-35 cursor-not-allowed',
                      )}
                    >
                      {m === 'group' ? 'Grupo' : 'Mi valoración'}
                    </button>
                  );
                })}
              </div>

              {/* Preview */}
              <div className="flex justify-center mb-5">
                <div style={{
                  width: `${CARD_W * PREVIEW_SCALE}px`,
                  height: `${CARD_H * PREVIEW_SCALE}px`,
                  borderRadius: '15px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.65)',
                  flexShrink: 0,
                }}>
                  <div style={{
                    transform: `scale(${PREVIEW_SCALE})`,
                    transformOrigin: 'top left',
                    width: `${CARD_W}px`,
                    height: `${CARD_H}px`,
                    pointerEvents: 'none',
                  }}>
                    <ShareCard {...cardProps} />
                  </div>
                </div>
              </div>

              {/* Share button */}
              <Button
                onClick={handleShare}
                disabled={sharing}
                className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Share2 size={15} />
                {sharing ? 'Generando imagen...' : 'Compartir imagen'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
