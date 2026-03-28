'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const CATEGORIES = [
  'image-generation', 'text-generation', 'search', 'data',
  'code', 'audio', 'video', 'embeddings', 'moderation', 'other',
];

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    sandboxEndpoint: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    endpoint: '',
    category: 'text-generation',
    tags: '',
    pricingType: 'fixed',
    amount: '0.01',
    currency: 'USDC',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`${apiUrl}/api/v1/provider/services`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          endpoint: form.endpoint,
          category: form.category,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          pricingType: form.pricingType,
          pricingConfig: { amount: form.amount, currency: form.currency },
          supportedPayments: ['sandbox'],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <main className="max-w-2xl mx-auto p-8">
        <div className="bg-slate-900 rounded-xl p-8 border border-emerald-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">✓</div>
            <div>
              <h1 className="text-xl font-bold text-white">Service Registered!</h1>
              <p className="text-slate-400 text-sm">Your sandbox endpoint is ready</p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm mb-6 border border-slate-800">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Sandbox Proxy Endpoint</p>
            <p className="text-emerald-400 break-all">{result.sandboxEndpoint}</p>
          </div>

          <div className="space-y-3 mb-8">
            <h3 className="font-semibold text-white">Test it right now:</h3>
            <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs border border-slate-800 overflow-x-auto">
              <p className="text-slate-500 mb-1"># Step 1: Hit the endpoint — get a 402 challenge</p>
              <p className="text-white">curl -X POST {result.sandboxEndpoint}/your/path \</p>
              <p className="text-white ml-4">-H &quot;Content-Type: application/json&quot; \</p>
              <p className="text-white ml-4">-d {'\'{"input": "test"}\''}</p>
              <p className="text-slate-500 mt-3 mb-1"># Step 2: Resend with sandbox credential</p>
              <p className="text-white">curl -X POST {result.sandboxEndpoint}/your/path \</p>
              <p className="text-white ml-4">-H &quot;Content-Type: application/json&quot; \</p>
              <p className="text-white ml-4">-H &quot;Authorization: Payment sandbox-credential&quot; \</p>
              <p className="text-white ml-4">-d {'\'{"input": "test"}\''}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 rounded-md bg-slate-50 text-slate-900 font-medium h-10 px-4 hover:bg-slate-50/90 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => { setResult(null); setForm({ name: '', description: '', endpoint: '', category: 'text-generation', tags: '', pricingType: 'fixed', amount: '0.01', currency: 'USDC' }); }}
              className="flex-1 rounded-md border border-slate-700 text-slate-300 font-medium h-10 px-4 hover:bg-slate-800 transition-colors"
            >
              Register Another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Register a Service</h1>
      <p className="text-slate-400 mb-8">
        Your service will start in sandbox mode. Test the full 402 MPP flow, then promote to testnet when ready.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Service Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="My Image Generation API"
            className="w-full rounded-md bg-slate-900 border border-slate-700 text-white px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Description *</label>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What does your API do? What makes it unique?"
            className="w-full rounded-md bg-slate-900 border border-slate-700 text-white px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Your API Endpoint *</label>
          <input
            required
            type="url"
            value={form.endpoint}
            onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
            placeholder="https://api.yourservice.com/v1"
            className="w-full rounded-md bg-slate-900 border border-slate-700 text-white px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">We&apos;ll proxy requests from MPP Studio to this URL after payment verification.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-md bg-slate-900 border border-slate-700 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tags</label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="fast, cheap, high-quality"
              className="w-full rounded-md bg-slate-900 border border-slate-700 text-white px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
          <h3 className="font-semibold text-white mb-4">Pricing</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
              <select
                value={form.pricingType}
                onChange={(e) => setForm({ ...form, pricingType: e.target.value })}
                className="w-full rounded-md bg-slate-950 border border-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="fixed">Fixed per call</option>
                <option value="per_token">Per token</option>
                <option value="per_second">Per second</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-md bg-slate-950 border border-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full rounded-md bg-slate-950 border border-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="USDC">USDC</option>
                <option value="USD">USD</option>
                <option value="BTC">BTC</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-950 border border-red-800 p-3 text-sm text-red-400">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-50 text-slate-900 font-semibold h-11 hover:bg-slate-50/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register Service →'}
        </button>
      </form>
    </main>
  );
}
