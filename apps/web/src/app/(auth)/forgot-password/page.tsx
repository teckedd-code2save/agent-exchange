'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseBrowserKey } from '@/lib/env';

function getSupabase() {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    getSupabaseBrowserKey(),
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="max-w-sm w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-gray-400 mt-1">We’ll send you a recovery link for your MPP Studio account</p>
      </div>

      {sent ? (
        <div className="rounded-lg border border-sky-700/30 bg-sky-950/20 p-4 text-sm text-sky-200">
          Password reset email sent to <span className="font-medium text-white">{email}</span>.
          <div className="mt-2 text-xs text-sky-300/80">
            Open the link, then choose a new password on the next screen.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm text-slate-950 transition-colors"
          >
            {loading ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-gray-600">
        Remembered it?{' '}
        <a href="/login" className="underline hover:text-gray-400">Back to sign in</a>
      </p>
    </div>
  );
}
