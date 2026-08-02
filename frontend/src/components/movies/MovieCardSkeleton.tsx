'use client';

export function MovieCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/[0.06]">
      <div className="h-[2px] w-2/3 skeleton" />
      <div className="p-4">
        <div className="flex gap-3.5 items-start">
          <div className="flex-shrink-0 w-[56px] h-[82px] rounded-xl skeleton" />
          <div className="flex-1 min-w-0 pt-0.5 space-y-2.5">
            <div className="h-[15px] skeleton rounded-lg w-4/5" />
            <div className="h-[13px] skeleton rounded-lg w-3/5" />
            <div className="flex gap-2">
              <div className="h-5 skeleton rounded-full w-16" />
              <div className="h-5 skeleton rounded-full w-14" />
            </div>
            <div className="h-[11px] skeleton rounded-lg w-2/5" />
          </div>
          <div className="w-3.5 h-3.5 skeleton rounded flex-shrink-0 mt-1.5" />
        </div>
      </div>
    </div>
  );
}
