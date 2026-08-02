'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Buscar...', className = '' }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search size={15} className="absolute left-3.5 text-zinc-500 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 bg-zinc-800/60 border border-white/[0.06] rounded-xl pl-9 pr-9 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-white/[0.14] focus:bg-zinc-800/90 transition-all"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            className="absolute right-3 w-5 h-5 rounded-full bg-zinc-600 flex items-center justify-center"
          >
            <X size={10} className="text-white" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
