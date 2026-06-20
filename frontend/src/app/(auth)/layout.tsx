export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] bg-zinc-950 flex flex-col items-center px-5 py-10 overflow-y-auto">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[320px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.11) 0%, transparent 65%)' }}
      />
      <div className="relative z-10 w-full max-w-sm my-auto py-4">
        {children}
      </div>
    </div>
  );
}
