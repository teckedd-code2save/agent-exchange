'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ax_agent_wallets';

interface SavedWallet {
  address: string;
  label: string;
  addedAt: string;
}

function loadWallets(): SavedWallet[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SavedWallet[];
  } catch {
    return [];
  }
}

function saveWallets(wallets: SavedWallet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

export default function WalletPage() {
  const [wallets, setWallets]   = useState<SavedWallet[]>([]);
  const [address, setAddress]   = useState('');
  const [label, setLabel]       = useState('');
  const [active, setActive]     = useState('');
  const [copied, setCopied]     = useState('');
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    const saved = loadWallets();
    setWallets(saved);
    const act = localStorage.getItem('ax_active_wallet') ?? saved[0]?.address ?? '';
    setActive(act);
    setMounted(true);
  }, []);

  function addWallet(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    const entry: SavedWallet = { address: address.trim(), label: label.trim() || address.trim().slice(0, 16), addedAt: new Date().toISOString() };
    const next = [entry, ...wallets.filter((w) => w.address !== entry.address)];
    setWallets(next);
    saveWallets(next);
    if (!active) setActiveWallet(entry.address);
    setAddress('');
    setLabel('');
  }

  function setActiveWallet(addr: string) {
    setActive(addr);
    localStorage.setItem('ax_active_wallet', addr);
  }

  function removeWallet(addr: string) {
    const next = wallets.filter((w) => w.address !== addr);
    setWallets(next);
    saveWallets(next);
    if (active === addr) {
      const fallback = next[0]?.address ?? '';
      setActiveWallet(fallback);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 1500);
  }

  if (!mounted) return null;

  const SAMPLE_WALLETS = [
    { address: 'agent:0xTEST000000000000000000000000000001', label: 'Test wallet A' },
    { address: 'agent:0xTEST000000000000000000000000000002', label: 'Test wallet B' },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Agent Wallets</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage wallet addresses used when calling the gateway tester or making MPP payments.
          The active wallet is passed as <code className="text-indigo-300 bg-gray-800 px-1 rounded text-xs">agentWalletAddress</code> in payment credentials.
        </p>
      </div>

      {/* Active wallet callout */}
      {active && (
        <div className="bg-indigo-900/20 border border-indigo-800/40 rounded-xl p-4">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Active Wallet</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <code className="text-sm text-white font-mono flex-1 break-all">{active}</code>
            <button onClick={() => copy(active)} className="text-xs text-gray-400 hover:text-white transition-colors shrink-0">
              {copied === active ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Add wallet form */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h2 className="font-semibold">Add wallet address</h2>
        <form onSubmit={addWallet} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wallet address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="agent:0x... or tempo:0x..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Label (optional)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My test wallet"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={!address.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            Add wallet
          </button>
        </form>

        {/* Quick-add test wallets */}
        <div className="pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Quick-add test wallets:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_WALLETS.map((sw) => (
              <button
                key={sw.address}
                onClick={() => { setAddress(sw.address); setLabel(sw.label); }}
                className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors font-mono"
              >
                {sw.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Wallet list */}
      {wallets.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h2 className="font-semibold text-sm">Saved wallets</h2>
          </div>
          <ul className="divide-y divide-gray-800">
            {wallets.map((w) => (
              <li key={w.address} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${active === w.address ? 'bg-green-400' : 'bg-gray-700'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{w.label}</p>
                  <p className="text-xs text-gray-500 font-mono truncate">{w.address}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {active !== w.address && (
                    <button
                      onClick={() => setActiveWallet(w.address)}
                      className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-indigo-600 transition-colors"
                    >
                      Set active
                    </button>
                  )}
                  {active === w.address && (
                    <span className="text-xs px-2 py-1 rounded bg-green-900/30 border border-green-800/40 text-green-400">Active</span>
                  )}
                  <button onClick={() => copy(w.address)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    {copied === w.address ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => removeWallet(w.address)} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {wallets.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <p className="text-sm">No wallets saved yet.</p>
          <p className="text-xs mt-1">Add one above or use a quick-add test wallet to get started.</p>
        </div>
      )}

      {/* Info box */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-xs text-gray-500 space-y-2">
        <p className="font-semibold text-gray-400">How wallets work in MPP</p>
        <p>When an agent calls a gated service endpoint, it includes its wallet address in the payment credential. The exchange records it on every transaction for audit and settlement purposes.</p>
        <p>In Phase 1 (stub mode), any wallet address is accepted. In production, Tempo wallet addresses will be verified against on-chain balances before the proof is accepted.</p>
      </div>
    </div>
  );
}
