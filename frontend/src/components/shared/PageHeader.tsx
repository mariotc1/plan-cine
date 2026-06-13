'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, back, action }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-5 pt-14 pb-4">
      <div className="flex items-center gap-3">
        {back && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 text-zinc-300"
          >
            <ArrowLeft size={18} />
          </motion.button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
