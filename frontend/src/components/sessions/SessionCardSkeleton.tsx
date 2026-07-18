'use client';

export function SessionCardSkeleton() {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="h-[2px] w-2/3 skeleton" />
      <div className="p-4">
        <div className="flex gap-3.5 items-start">
          <div className="flex-shrink-0 w-[52px] h-[76px] rounded-xl skeleton" />
          <div className="flex-1 min-w-0 pt-0.5 space-y-2.5">
            <div className="h-[15px] skeleton rounded-lg w-4/5" />
            <div className="h-[13px] skeleton rounded-lg w-2/5" />
            <div className="flex gap-2 mt-1">
              <div className="h-5 skeleton rounded-full w-20" />
            </div>
            <div className="flex gap-1.5 mt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 skeleton rounded-lg" />
              ))}
            </div>
          </div>
          <div className="w-3.5 h-3.5 skeleton rounded flex-shrink-0 mt-1.5" />
        </div>
      </div>
    </div>
  );
}
