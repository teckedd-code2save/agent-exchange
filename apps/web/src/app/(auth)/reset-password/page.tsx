'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseBrowserKey } from '@/lib/env';

function getSupabase() {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    getSupabaseBrowserKey(),
  );
}

export default function ResetPasswordPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setReady(true);
    });
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSuccess(true);
  }

  return (
    <div className="max-w-sm w-full space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="text-sm text-gray-400 mt-1">Finish recovery for your MPP Studio account</p>
      </div>

      {!ready ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
          Loading recovery session...
        </div>
      ) : success ? (
        <div className="rounded-lg border border-emerald-700/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">
          Password updated. You can now <a href="/login" className="underline text-white">sign in</a>.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">New password</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              placeholder="Repeat your password"
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
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}
