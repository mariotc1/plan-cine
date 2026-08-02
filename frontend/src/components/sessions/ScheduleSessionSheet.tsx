'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSheetAnimation } from '@/hooks/useSheetAnimation';
import { Check, Clock, Users, CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrumPicker } from '@/components/ui/DrumPicker';
import { Movie, User } from '@/types';
import { getPlatform } from '@/lib/constants';
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

function defaultTime(): { h: string; m: string } {
  const now = new Date();
  const snapped = Math.ceil(now.getMinutes() / 5) * 5;
  if (snapped >= 60) return { h: String((now.getHours() + 1) % 24).padStart(2, '0'), m: '00' };
  return { h: String(now.getHours()).padStart(2, '0'), m: String(snapped).padStart(2, '0') };
}

interface ScheduleSessionSheetProps {
  open: boolean;
  onClose: () => void;
  movie: Movie | null;
  members: User[];
  onSchedule: (participantIds: string[], scheduledAt: string) => void;
  loading?: boolean;
  // Edit mode: pre-fill existing session data
  initialParticipantIds?: string[];
  initialScheduledAt?: string;
  editMode?: boolean;
}

export function ScheduleSessionSheet({ open, onClose, movie, members, onSchedule, loading, initialParticipantIds, initialScheduledAt, editMode = false }: ScheduleSessionSheetProps) {
  const { motionProps, handleProps } = useSheetAnimation(onClose);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(todayMidnight());
  const [hour, setHour] = useState('21');
  const [minute, setMinute] = useState('00');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const today = todayMidnight();
  const calDays = getCalendarDays(calYear, calMonth);

  useEffect(() => {
    if (!open) return;
    setShowCalendar(false);

    // Participants
    setSelected(initialParticipantIds ?? members.map((m) => m.id));

    // Date + time
    if (initialScheduledAt) {
      const d = new Date(initialScheduledAt);
      const datePart = new Date(d);
      datePart.setHours(0, 0, 0, 0);
      setSelectedDate(datePart);
      setHour(String(d.getHours()).padStart(2, '0'));
      const snapped = Math.round(d.getMinutes() / 5) * 5 % 60;
      setMinute(String(snapped).padStart(2, '0'));
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
    } else {
      setSelectedDate(todayMidnight());
      const dt = defaultTime();
      setHour(dt.h);
      setMinute(dt.m);
      const now = new Date();
      setCalYear(now.getFullYear());
      setCalMonth(now.getMonth());
    }
  }, [open, movie, initialScheduledAt, initialParticipantIds]);

  const toggleMember = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const allSelected = selected.length === members.length;
  const toggleAll = () => setSelected(allSelected ? [] : members.map((m) => m.id));

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
    if (!movie || selected.length === 0) return;
    const scheduled = new Date(selectedDate);
    scheduled.setHours(parseInt(hour), parseInt(minute), 0, 0);
    onSchedule(selected, scheduled.toISOString());
  };

  const dateLabel = (() => {
    if (selectedDate.toDateString() === today.toDateString()) return 'Hoy';
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (selectedDate.toDateString() === tomorrow.toDateString()) return 'Mañana';
    return `${selectedDate.toLocaleDateString('es-ES', { weekday: 'short' })} ${selectedDate.getDate()} ${MONTH_SHORT[selectedDate.getMonth()]}`;
  })();

  const isValid = selected.length > 0;
  const platform = movie ? getPlatform(movie.platform) : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            {...motionProps}
            className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[480px] z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl flex flex-col"
            style={{ maxHeight: '92vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-0 flex-shrink-0 select-none" {...handleProps}>
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Movie header */}
            <div className="px-6 pt-4 pb-4 flex-shrink-0 border-b border-white/[0.06]">
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest mb-1">{editMode ? 'Editar sesión' : 'Programar sesión'}</p>
              <h2 className="text-white font-bold text-lg leading-tight">{movie?.title ?? ''}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                {movie && (
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Clock size={10} /> {movie.duration_formatted}
                  </span>
                )}
                {platform && (
                  <span className="text-xs font-medium" style={{ color: platform.color }}>
                    {platform.emoji} {platform.label}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

              {/* Participants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-zinc-500" />
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">¿Quién estará?</p>
                  </div>
                  <button onClick={toggleAll} className="text-xs text-amber-400 font-semibold">
                    {allSelected ? 'Deseleccionar' : 'Todos'}
                  </button>
                </div>
                <div className="space-y-2">
                  {members.map((member) => {
                    const isSel = selected.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => toggleMember(member.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all',
                          isSel ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/[0.06] bg-white/[0.03]',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: `${member.color}20` }}
                          >
                            {member.avatar}
                          </span>
                          <span className={cn('font-medium text-sm', isSel ? 'text-white' : 'text-zinc-400')}>
                            {member.name}
                          </span>
                        </div>
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                          isSel ? 'bg-amber-500 border-amber-500' : 'border-zinc-700',
                        )}>
                          {isSel && <Check size={11} className="text-zinc-950" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date + Time — compact, progressive disclosure */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">¿Cuándo y a qué hora?</p>

                {/* Date chip — tappable, toggles calendar */}
                <button
                  onClick={() => setShowCalendar((v) => !v)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all mb-3',
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

                {/* Calendar — inline, collapsible */}
                <AnimatePresence>
                  {showCalendar && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden mb-3"
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
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] border-t border-white/[0.06] bg-zinc-950">
              <Button
                onClick={handleConfirm}
                disabled={!isValid || loading}
                className="w-full h-12 rounded-xl font-semibold bg-amber-500/90 hover:bg-amber-500 text-zinc-950 disabled:opacity-35"
              >
                {loading
                  ? (editMode ? 'Guardando...' : 'Programando...')
                  : editMode
                  ? `Guardar cambios · ${dateLabel.toLowerCase()} a las ${hour}:${minute}`
                  : `Programar · ${dateLabel.toLowerCase()} a las ${hour}:${minute}`}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
