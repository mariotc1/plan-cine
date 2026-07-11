'use client';

import { useState } from 'react';
import { AVATAR_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (avatar: string) => void;
  color: string;
}

export function AvatarPicker({ value, onChange, color }: Props) {
  const [activeKey, setActiveKey] = useState(
    () => AVATAR_CATEGORIES.find((c) => c.avatars.includes(value))?.key ?? 'cine'
  );

  const category = AVATAR_CATEGORIES.find((c) => c.key === activeKey) ?? AVATAR_CATEGORIES[0];

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {AVATAR_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveKey(cat.key)}
            className={cn(
              'flex-1 h-7 rounded-lg text-xs font-medium transition-all',
              activeKey === cat.key
                ? 'bg-indigo-500/25 text-indigo-300'
                : 'bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08]'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-2 p-1">
        {category.avatars.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className={cn(
              'aspect-square rounded-xl text-2xl flex items-center justify-center transition-all',
              value === a ? 'ring-2 ring-indigo-500' : 'bg-white/5 hover:bg-white/10'
            )}
            style={value === a ? { backgroundColor: `${color}28` } : undefined}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
