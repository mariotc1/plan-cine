'use client';

import { forwardRef } from 'react';

interface Participant {
  avatar: string;
  name: string;
  color: string;
}

export interface ShareCardProps {
  mode: 'personal' | 'group';
  movieTitle: string;
  posterPath?: string | null;
  rating: number;
  ratingCount?: number;
  userName?: string;
  userAvatar?: string;
  userColor?: string;
  groupName?: string;
  participants?: Participant[];
}

function FilmIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
        stroke="#52525b" strokeWidth="1.8" strokeLinecap="round"
      />
    </svg>
  );
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i < full ? '#f59e0b' : 'rgba(245,158,11,0.15)'}
            stroke={i < full ? '#f59e0b' : 'rgba(245,158,11,0.3)'}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

// Card is 390×620 — portrait, poster-first design
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({
  mode, movieTitle, posterPath, rating, ratingCount,
  userName, userAvatar, userColor, groupName, participants = [],
}, ref) => {
  const displayRating = rating > 0 ? (Math.round(rating * 10) / 10).toFixed(1) : null;

  const modeLabel = mode === 'personal'
    ? (userName ?? '')
    : (groupName ?? 'El grupo');

  const ratingLine = mode === 'personal'
    ? 'Mi valoración'
    : ratingCount
      ? `${ratingCount} ${ratingCount === 1 ? 'valoración' : 'valoraciones'}`
      : 'Sin valoraciones';

  return (
    <div
      ref={ref}
      style={{
        width: '390px',
        height: '620px',
        backgroundColor: '#09090b',
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* App gradient — purple glow from bottom-left */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 0% 100%, rgba(99,102,241,0.22) 0%, transparent 65%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Poster — contained at top with padding */}
      <div style={{ padding: '24px 24px 0 24px', position: 'relative', zIndex: 2 }}>
        <div style={{
          width: '100%',
          height: '380px',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.75)',
          backgroundColor: '#18181b',
        }}>
          {posterPath ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`https://image.tmdb.org/t/p/w500${posterPath}`}
              alt={movieTitle}
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                  stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Info section */}
      <div style={{
        flex: 1,
        padding: '18px 24px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Top info */}
        <div>
          <div style={{
            color: '#52525b', fontSize: '10px', fontWeight: '600',
            letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px',
          }}>
            {modeLabel}
          </div>

          <div style={{
            color: '#ffffff',
            fontSize: movieTitle.length > 22 ? '18px' : '22px',
            fontWeight: '800',
            lineHeight: '1.2',
            letterSpacing: '-0.3px',
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {movieTitle}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <StarRow rating={rating} size={13} />
            {displayRating && (
              <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '700' }}>{displayRating}</span>
            )}
          </div>
          <div style={{ color: '#52525b', fontSize: '11px' }}>
            {ratingLine}
          </div>
        </div>

        {/* Bottom row — avatars + branding */}
        <div>
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {mode === 'personal' ? (
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                backgroundColor: userColor ? `${userColor}28` : '#27272a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', flexShrink: 0,
              }}>
                {userAvatar}
              </div>
            ) : (
              <>
                {participants.slice(0, 5).map((p, i) => (
                  <div key={i} style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    backgroundColor: `${p.color}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', flexShrink: 0,
                  }}>
                    {p.avatar}
                  </div>
                ))}
                {participants.length > 5 && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    backgroundColor: '#27272a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: '#71717a', fontWeight: '600', flexShrink: 0,
                  }}>
                    +{participants.length - 5}
                  </div>
                )}
              </>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FilmIcon />
              <span style={{ color: '#52525b', fontSize: '10px', fontWeight: '600', letterSpacing: '0.3px' }}>
                Plan Cine
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';
