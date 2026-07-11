export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center px-5 overflow-y-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: '40px' }}
    >
      <div className="relative z-10 w-full max-w-sm my-auto py-4">
        {children}
      </div>
    </div>
  );
}
