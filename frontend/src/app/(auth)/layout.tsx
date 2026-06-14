export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center px-5 py-10 overflow-y-auto">
      <div className="w-full max-w-sm my-auto py-4">
        {children}
      </div>
    </div>
  );
}
