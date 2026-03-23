import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="px-6 py-4 border-b border-gray-900">
        <Link href="/" className="text-base font-bold tracking-tight">
          Agent<span className="text-indigo-400">Exchange</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
