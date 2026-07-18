'use client';

export function StatCardSkeleton() {
  return (
    <div className="px-5 pb-8 space-y-3">
      {/* Hero row: 2 big number cards */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-zinc-900 rounded-2xl border border-white/5 p-5">
            <div className="h-10 w-14 skeleton rounded-lg mb-3" />
            <div className="h-3 skeleton rounded-lg w-3/4 mb-1.5" />
            <div className="h-3 skeleton rounded-lg w-1/2" />
          </div>
        ))}
      </div>

      {/* Second row: favorites */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-zinc-900 rounded-2xl border border-white/5 p-4 h-[88px]">
            <div className="h-2.5 skeleton rounded-lg w-2/3 mb-4" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 skeleton rounded-md flex-shrink-0" />
              <div className="h-4 skeleton rounded-lg flex-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Full-width card: protagonistas */}
      <div className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 pt-4 pb-3">
          <div className="h-2.5 skeleton rounded-lg w-1/3" />
        </div>
        <div className="divide-y divide-white/[0.04]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-9 h-9 skeleton rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 skeleton rounded-lg w-3/5" />
                <div className="h-2.5 skeleton rounded-lg w-2/5" />
              </div>
              <div className="h-3.5 skeleton rounded-lg w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Full-width card: top películas */}
      <div className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 pt-4 pb-3">
          <div className="h-2.5 skeleton rounded-lg w-1/4" />
        </div>
        <div className="divide-y divide-white/[0.04]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="w-5 h-4 skeleton rounded flex-shrink-0" />
              <div className="w-8 h-12 skeleton rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 skeleton rounded-lg w-4/5" />
                <div className="h-2.5 skeleton rounded-lg w-2/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
