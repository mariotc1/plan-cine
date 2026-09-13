'use client';

import { useEffect, useState } from 'react';

const QUERY = '(min-width: 768px)';

/** Mirrors the `lg:` Tailwind breakpoint (redefined to 768px in globals.css) for logic that can't be expressed in pure CSS. */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isDesktop;
}
