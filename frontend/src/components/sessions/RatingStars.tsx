'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RatingStarsProps {
  value?: number;
  onChange?: (score: number) => void;
  readonly?: boolean;
  size?: number;
}

export function RatingStars({ value = 0, onChange, readonly, size = 24 }: RatingStarsProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star;
        return (
          <motion.button
            key={star}
            type="button"
            whileTap={!readonly ? { scale: 0.8 } : {}}
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn('transition-colors', readonly ? 'cursor-default' : 'cursor-pointer')}
          >
            <Star
              size={size}
              className={cn(
                'transition-colors',
                filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-zinc-700'
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
