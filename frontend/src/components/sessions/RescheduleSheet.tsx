'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrumPicker } from '@/components/ui/DrumPicker';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DAY_GRID_HEADERS = ['L','M','X','J','V','S','D'];

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  return [
    ...Array.from({ length: startDow }, () => null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];
}

function snapMinuteToFive(m: number): string {
  const snapped = Math.round(m / 5) * 5 % 60;
  return String(snapped).padStart(2, '0');
}

interface RescheduleSheetProps {
  open: boolean;
  onClose: () => void;
  currentScheduledAt?: string;
  onConfirm: (scheduledAt: string) => void;
  loading?: boolean;
}

export function RescheduleSheet({ open, onClose, currentScheduledAt, onConfirm, loading }: RescheduleSheetProps) {
  const today = todayMidnight();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [hour, setHour] = useState('21');
  const [minute, setMinute] = useState('00');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const calDays = getCalendarDays(calYear, calMonth);

  useEffect(() => {
    if (!open) return;
    setShowCalendar(false);

    if (currentScheduledAt) {
      const d = new Date(currentScheduledAt);
      const datePart = new Date(d);
      datePart.setHours(0, 0, 0, 0);
      setSelectedDate(datePart);
      setHour(String(d.getHours()).padStart(2, '0'));
      setMinute(snapMinuteToFive(d.getMinutes()));
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
    } else {
      const now = new Date();
      setSelectedDate(todayMidnight());
      const snapped = Math.ceil(now.getMinutes() / 5) * 5;
      if (snapped >= 60) {
        setHour(String((now.getHours() + 1) % 24).padStart(2, '0'));
        setMinute('00');
      } else {
        setHour(String(now.getHours()).padStart(2, '0'));
        setMinute(String(snapped).padStart(2, '0'));
      }
      setCalYear(now.getFullYear());
      setCalMonth(now.getMonth());
    }
  }, [open, currentScheduledAt]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };
  const canPrevMonth = new Date(calYear, calMonth, 1) > today;

  const pickDay = (day: Date) => {
    setSelectedDate(day);
    setTimeout(() => setShowCalendar(false), 150);
  };

  const handleConfirm = () => {
    const scheduled = new Date(selectedDate);
    scheduled.setHours(parseInt(hour), parseInt(minute), 0, 0);
    onConfirm(scheduled.toISOString());
  };

  const dateLabel = (() => {
    if (selectedDate.toDateString() === today.toDateString()) return 'Hoy';
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (selectedDate.toDateString() === tomorrow.toDateString()) return 'Mañana';
    return `${selectedDate.toLocaleDateString('es-ES', { weekday: 'short' })} ${selectedDate.getDate()} ${MONTH_SHORT[selectedDate.getMonth()]}`;
  })();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[480px] z-[71] bg-zinc-950 border-t border-white/10 rounded-t-3xl flex flex-col"
            style={{ maxHeight: '75vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pt-4 pb-4 flex-shrink-0 border-b border-white/[0.06]">
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest mb-1">Cambiar fecha</p>
              <h2 className="text-white font-bold text-lg leading-tight">¿Cuándo la veis?</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

              {/* Date chip */}
              <button
                onClick={() => setShowCalendar((v) => !v)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all',
                  showCalendar
                    ? 'bg-amber-500/10 border-amber-500/35'
                    : 'bg-white/[0.03] border-white/[0.06]',
                )}
              >
                <CalendarDays size={15} className={showCalendar ? 'text-amber-400' : 'text-zinc-500'} />
                <span className={cn('text-sm font-semibold flex-1 text-left', showCalendar ? 'text-amber-400' : 'text-white')}>
                  {dateLabel}
                </span>
                <ChevronDown
                  size={14}
                  className={cn('transition-transform duration-200', showCalendar ? 'rotate-180 text-amber-400' : 'text-zinc-600')}
                />
              </button>

              {/* Calendar inline */}
              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={prevMonth} disabled={!canPrevMonth}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-20 transition-colors">
                          <ChevronLeft size={15} />
                        </button>
                        <span className="text-sm font-semibold text-white capitalize">
                          {MONTH_NAMES[calMonth]} {calYear}
                        </span>
                        <button onClick={nextMonth}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                          <ChevronRight size={15} />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 mb-1">
                        {DAY_GRID_HEADERS.map((d) => (
                          <div key={d} className="text-center text-[10px] font-semibold text-zinc-600 py-0.5">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5">
                        {calDays.map((day, i) => {
                          if (!day) return <div key={`e-${i}`} />;
                          const isPast = day < today;
                          const isSel = selectedDate.toDateString() === day.toDateString();
                          const isToday = day.toDateString() === today.toDateString();
                          return (
                            <button key={i} onClick={() => pickDay(day)} disabled={isPast}
                              className={cn(
                                'w-full aspect-square rounded-xl text-[13px] font-medium transition-all flex items-center justify-center',
                                isPast ? 'text-zinc-700 cursor-not-allowed' :
                                isSel ? 'bg-amber-500 text-zinc-950 font-bold shadow-[0_2px_10px_-2px_rgba(245,158,11,0.5)]' :
                                isToday ? 'text-amber-400 ring-1 ring-amber-500/40' :
                                'text-zinc-300 hover:bg-white/[0.07]',
                              )}
                            >
                              {day.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Time drums — always visible, tight to calendar chip */}
              <div className="flex items-center justify-center gap-3">
                <DrumPicker items={HOURS} value={hour} onChange={setHour} width={84} />
                <span className="text-[30px] font-bold text-zinc-500 leading-none select-none">:</span>
                <DrumPicker items={MINUTES} value={minute} onChange={setMinute} width={84} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] border-t border-white/[0.06] bg-zinc-950">
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full h-12 rounded-xl font-semibold bg-amber-500/90 hover:bg-amber-500 text-zinc-950 disabled:opacity-35"
              >
                {loading ? 'Guardando...' : `Guardar · ${dateLabel.toLowerCase()} a las ${hour}:${minute}`}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
