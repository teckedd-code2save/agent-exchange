import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MPP Studio — The Payment Layer for AI Services',
  description:
    'Build, test, and launch paid APIs with HTTP 402. Sandbox with fake money, graduate to real USDC, get discovered by agents.',
  keywords:
    'HTTP 402, MPP, x402, AI payments, USDC, agent payments, API monetization, Coinbase, Base, testnet',
  openGraph: {
    title: 'MPP Studio — The Payment Layer for AI Services',
    description: 'Build, test, and launch paid APIs that AI agents can discover and pay for.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-surface-900 text-ink-primary antialiased font-sans">{children}</body>
    </html>
  );
}
