import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MPP Studio',
  description: 'Build, test, and launch paid AI services with sandbox, discovery, and machine-payment workflows.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
