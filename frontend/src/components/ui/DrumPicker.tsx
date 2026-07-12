'use client';

import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

const ITEM_H = 42;
const VISIBLE = 3;
const PAD = Math.floor(VISIBLE / 2); // 1 padding item top + bottom

interface DrumPickerProps {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  width?: number;
}

export function DrumPicker({ items, value, onChange, width = 88 }: DrumPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerH = ITEM_H * VISIBLE;

  // Empty strings serve as top/bottom padding so first/last items can center
  const padded = [...Array(PAD).fill(''), ...items, ...Array(PAD).fill('')];

  // Scroll to value on mount
  useEffect(() => {
    if (!ref.current) return;
    const idx = items.indexOf(value);
    if (idx >= 0) ref.current.scrollTop = idx * ITEM_H;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync scroll when value changes externally (e.g. sheet pre-fill)
  useEffect(() => {
    if (!ref.current) return;
    const idx = items.indexOf(value);
    if (idx < 0) return;
    const expected = idx * ITEM_H;
    if (Math.abs(ref.current.scrollTop - expected) > 4) {
      ref.current.scrollTop = expected;
    }
  }, [value, items]);

  const handleScroll = useCallback(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(ref.current.scrollTop / ITEM_H)));
      if (items[idx] !== value) onChange(items[idx]);
    }, 60);
  }, [items, value, onChange]);

  return (
    <div className="relative select-none overflow-hidden" style={{ height: containerH, width }}>
      {/* Selection highlight */}
      <div
        className="absolute inset-x-1 pointer-events-none z-10 rounded-xl bg-white/[0.08] border border-white/[0.12]"
        style={{ top: PAD * ITEM_H, height: ITEM_H }}
      />
      {/* Top fade */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none z-10"
        style={{ height: PAD * ITEM_H, background: 'linear-gradient(to bottom, #09090b 20%, transparent)' }}
      />
      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
        style={{ height: PAD * ITEM_H, background: 'linear-gradient(to top, #09090b 20%, transparent)' }}
      />

      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll scrollbar-none"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {padded.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
          >
            <span className={cn(
              'text-[26px] font-bold tabular-nums tracking-tight transition-colors duration-100',
              item === value ? 'text-white' : item === '' ? '' : 'text-zinc-700',
            )}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
