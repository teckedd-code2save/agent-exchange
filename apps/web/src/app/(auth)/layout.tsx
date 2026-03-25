import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_28%),#020617] text-gray-100 flex flex-col">
      <header className="px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-base font-bold tracking-tight">
          MPP<span className="text-sky-400">Studio</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
