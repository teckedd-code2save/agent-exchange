'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseBrowserKey } from '@/lib/env';

type Mode = 'magic' | 'password';
type Step = 'form' | 'sent' | 'loading';

function getSupabase() {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    getSupabaseBrowserKey(),
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

function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';
  const authBypassEnabled = process.env['NEXT_PUBLIC_AUTH_BYPASS'] === 'true';

  const [mode, setMode] = useState<Mode>('password');
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = next;
      }
    });
  }, [next]);

  async function handleMagicSignup(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setStep('loading');

    const { error: authError } = await getSupabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (authError) {
      setError(authError.message);
      setStep('form');
      return;
    }

    setStep('sent');
  }

  async function handlePasswordSignup(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setStep('loading');

    const { error: authError } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (authError) {
      setError(authError.message);
      setStep('form');
      return;
    }

    setStep('sent');
  }

  if (step === 'sent') {
    return (
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Check your email</h2>
        <p className="text-sm text-gray-400">
          We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
          <br />Open it to finish creating your MPP Studio account.
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
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-gray-400 mt-1">Create your MPP Studio account with email and password</p>
      </div>

      {authBypassEnabled && (
        <div className="rounded-lg border border-amber-700/30 bg-amber-950/20 p-4 text-sm text-amber-200">
          Local auth bypass is enabled. You can still use signup, but for quick UI access you do not need a magic link in this environment.
        </div>
      )}

      <div className="flex rounded-lg border border-gray-800 p-1 gap-1 bg-gray-900">
        {(['magic', 'password'] as Mode[]).map((variant) => (
          <button
            key={variant}
            onClick={() => {
              setMode(variant);
              setError('');
            }}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              mode === variant ? 'bg-sky-500 text-slate-950' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {variant === 'magic' ? 'Magic Link' : 'Email + Password'}
          </button>
        ))}
      </div>

      <form onSubmit={mode === 'magic' ? handleMagicSignup : handlePasswordSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
          />
        </div>
        {mode === 'password' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>
        )}
        {error && (
          <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={step === 'loading'}
          className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm text-slate-950 transition-colors flex items-center justify-center gap-2"
        >
          {step === 'loading' && <Spinner />}
          {mode === 'magic'
            ? step === 'loading' ? 'Sending link...' : 'Send signup link'
            : step === 'loading' ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="underline hover:text-gray-400">Sign in</a>
      </p>

      <p className="text-center text-[11px] text-gray-600 leading-5">
        Supabase must allow the exact callback origin you are using locally, including the port, such as `http://localhost:3000/callback` or `http://localhost:3001/callback`.
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
