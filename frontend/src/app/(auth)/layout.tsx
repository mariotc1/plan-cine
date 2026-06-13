export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
