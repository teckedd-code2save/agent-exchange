'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

type Mode = 'magic' | 'password';
type Step = 'form' | 'sent' | 'loading';

function getSupabase() {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const [mode, setMode]   = useState<Mode>('magic');
  const [step, setStep]   = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = next;
    });
  }, [next]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStep('loading');
    const { error: err } = await getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (err) { setError(err.message); setStep('form'); return; }
    setStep('sent');
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStep('loading');
    const { error: err } = await getSupabase().auth.signInWithPassword({ email, password: pass });
    if (err) { setError(err.message); setStep('form'); return; }
    window.location.href = next;
  }

  if (step === 'sent') {
    return (
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Check your email</h2>
        <p className="text-sm text-gray-400">
          We sent a magic link to <span className="text-white font-medium">{email}</span>.
          <br />Click the link to sign in — it expires in 5 minutes.
        </p>
        <button onClick={() => setStep('form')} className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-gray-400 mt-1">Access your Agent Exchange dashboard</p>
      </div>

      <div className="flex rounded-lg border border-gray-800 p-1 gap-1 bg-gray-900">
        {(['magic', 'password'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); }}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              mode === m ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {m === 'magic' ? 'Magic Link' : 'Password'}
          </button>
        ))}
      </div>

      <form onSubmit={mode === 'magic' ? handleMagicLink : handlePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        {mode === 'password' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        )}
        {error && (
          <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={step === 'loading'}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {step === 'loading' && <Spinner />}
          {mode === 'magic'
            ? step === 'loading' ? 'Sending...' : 'Send Magic Link'
            : step === 'loading' ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-600">
        No account yet?{' '}
        <a href="/auth/signup" className="underline hover:text-gray-400">Create one free</a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
