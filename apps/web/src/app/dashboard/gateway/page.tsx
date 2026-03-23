'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceSummary {
  slug: string;
  name: string;
  status: string;
  endpoints?: EndpointSummary[];
}

interface EndpointSummary {
  id: string;
  path: string;
  method: string;
  name: string;
  pricing?: PricingSummary[];
}

interface PricingSummary {
  amount: string;
  currency: string;
  pricingModel: string;
}

type FlowStep = 'idle' | 'challenging' | 'challenged' | 'paying' | 'done' | 'error';

interface Challenge {
  challengeId: string;
  method: string;
  amount: string;
  currency: string;
  expires: string;
  rawHeader: string;
}

interface FlowResult {
  status: number;
  txId: string | null;
  body: string;
  durationMs: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function base64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function parseWwwAuth(header: string): Omit<Challenge, 'rawHeader'> | null {
  const get = (key: string) => new RegExp(`${key}="([^"]+)"`).exec(header)?.[1];
  const challengeId = get('challenge');
  const method      = get('method');
  const amount      = get('amount');
  const currency    = get('currency') ?? 'USDC';
  const expires     = get('expires') ?? '';
  if (!challengeId || !method || !amount) return null;
  return { challengeId, method, amount, currency, expires };
}

function mintCredential(challenge: Challenge, wallet: string): string {
  const payload = {
    challengeId:        challenge.challengeId,
    paymentMethod:      challenge.method,
    agentWalletAddress: wallet,
    proof:              `test_proof_${Date.now()}`,
  };
  return `Payment ${base64url(payload)}`;
}

function getActiveWallet(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('ax_active_wallet') ??
    'agent:0xTEST000000000000000000000000000001'
  );
}

function StatusBadge({ status }: { status: number }) {
  const cls =
    status >= 200 && status < 300 ? 'bg-green-900/40 text-green-400 border-green-800/40' :
    status === 402                 ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800/40' :
    status === 401                 ? 'bg-red-900/40 text-red-400 border-red-800/40' :
    status >= 500                  ? 'bg-orange-900/40 text-orange-400 border-orange-800/40' :
                                     'bg-gray-800 text-gray-400 border-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-bold ${cls}`}>
      {status}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-xs text-gray-500 hover:text-gray-300 transition-colors shrink-0"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function GatewayTestInner() {
  const searchParams = useSearchParams();
  const preselect = searchParams.get('service') ?? '';

  const [services,        setServices]       = useState<ServiceSummary[]>([]);
  const [selectedSlug,    setSelectedSlug]   = useState(preselect);
  const [selectedEp,      setSelectedEp]     = useState('');
  const [wallet,          setWallet]         = useState('');
  const [reqMethod,       setReqMethod]      = useState('GET');
  const [reqBody,         setReqBody]        = useState('');
  const [extraHeaders,    setExtraHeaders]   = useState('');

  const [step,            setStep]           = useState<FlowStep>('idle');
  const [challenge,       setChallenge]      = useState<Challenge | null>(null);
  const [credential,      setCredential]     = useState('');
  const [result402,       setResult402]      = useState<FlowResult | null>(null);
  const [result200,       setResult200]      = useState<FlowResult | null>(null);
  const [errorMsg,        setErrorMsg]       = useState('');
  const [log,             setLog]            = useState<string[]>([]);

  const appendLog = (msg: string) => setLog((prev) => [...prev, `${new Date().toISOString().slice(11, 23)}  ${msg}`]);

  // Load services
  useEffect(() => {
    setWallet(getActiveWallet());
    fetch('/api/v1/services?limit=50')
      .then((r) => r.json())
      .then((d: { data: ServiceSummary[] }) => {
        const active = d.data.filter((s) => s.status === 'active');
        setServices(active);
        // Use preselected slug if valid, else fall back to first
        const match = preselect && active.find((s) => s.slug === preselect);
        if (!selectedSlug || !match) {
          setSelectedSlug(match ? preselect : (active[0]?.slug ?? ''));
        }
      })
      .catch(() => appendLog('ERROR: could not load services'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load endpoints when service changes
  const currentService = services.find((s) => s.slug === selectedSlug);
  useEffect(() => {
    if (!selectedSlug) return;
    fetch(`/api/v1/services/${selectedSlug}`)
      .then((r) => r.json())
      .then((d: ServiceSummary) => {
        setServices((prev) =>
          prev.map((s) => (s.slug === selectedSlug ? { ...s, endpoints: d.endpoints } : s))
        );
        const firstPath = d.endpoints?.[0]?.path ?? '';
        setSelectedEp(firstPath);
      })
      .catch(() => {});
  }, [selectedSlug]);

  const endpoints = currentService?.endpoints ?? [];
  const currentEp = endpoints.find((e) => e.path === selectedEp);
  const pricing   = currentEp?.pricing?.[0];

  const gatewayUrl = selectedSlug && selectedEp
    ? `/api/v1/gateway/${selectedSlug}${selectedEp}`
    : '';

  function reset() {
    setStep('idle');
    setChallenge(null);
    setCredential('');
    setResult402(null);
    setResult200(null);
    setErrorMsg('');
    setLog([]);
  }

  // Step 1: Hit endpoint without auth → get 402
  const getChallenge = useCallback(async () => {
    if (!gatewayUrl) return;
    reset();
    setStep('challenging');
    appendLog(`→ ${reqMethod} ${gatewayUrl}`);
    const t0 = Date.now();
    try {
      const resp = await fetch(gatewayUrl, { method: reqMethod });
      const ms = Date.now() - t0;
      const body = await resp.text();
      appendLog(`← ${resp.status} (${ms}ms)`);

      if (resp.status !== 402) {
        setErrorMsg(`Expected 402, got ${resp.status}. ${resp.status === 404 ? 'Check the service is active and endpoint is registered.' : ''}`);
        setResult402({ status: resp.status, txId: null, body, durationMs: ms });
        setStep('error');
        return;
      }

      const wwwAuth = resp.headers.get('www-authenticate') ?? '';
      appendLog(`  WWW-Authenticate: ${wwwAuth.slice(0, 80)}...`);
      const parsed = parseWwwAuth(wwwAuth);
      if (!parsed) { setErrorMsg('Could not parse WWW-Authenticate header'); setStep('error'); return; }

      const ch: Challenge = { ...parsed, rawHeader: wwwAuth };
      setChallenge(ch);
      setResult402({ status: 402, txId: null, body, durationMs: ms });

      const cred = mintCredential(ch, wallet);
      setCredential(cred);
      appendLog(`  Challenge: ${ch.challengeId}`);
      appendLog(`  Amount: ${ch.amount} ${ch.currency}  Method: ${ch.method}`);
      appendLog(`  Credential minted (stub proof)`);
      setStep('challenged');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  }, [gatewayUrl, reqMethod, wallet]);

  // Step 2: Replay with credential → get 200/502
  const sendPayment = useCallback(async () => {
    if (!challenge || !credential) return;
    setStep('paying');
    appendLog(`→ ${reqMethod} ${gatewayUrl}  [with credential]`);
    const t0 = Date.now();

    // Parse extra headers
    const extraHdr: Record<string, string> = {};
    extraHeaders.split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        if (k) extraHdr[k] = v;
      }
    });

    try {
      const resp = await fetch(gatewayUrl, {
        method: reqMethod,
        headers: {
          Authorization: credential,
          'Content-Type': 'application/json',
          ...extraHdr,
        },
        body: ['GET', 'HEAD'].includes(reqMethod) ? undefined : (reqBody || undefined),
      });
      const ms = Date.now() - t0;
      const body = await resp.text();
      const txId = resp.headers.get('x-agent-exchange-tx');
      appendLog(`← ${resp.status} (${ms}ms)${txId ? `  tx=${txId}` : ''}`);

      setResult200({ status: resp.status, txId, body, durationMs: ms });
      setStep('done');

      if (resp.status === 401) {
        const parsed = JSON.parse(body) as { detail?: string };
        setErrorMsg('Credential rejected: ' + (parsed.detail ?? body));
        setStep('error');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  }, [challenge, credential, gatewayUrl, reqMethod, reqBody, extraHeaders]);

  const isLoading = step === 'challenging' || step === 'paying';

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gateway Tester</h1>
        <p className="text-sm text-gray-400 mt-1">
          Test the MPP 402 payment flow interactively — select a service endpoint, get a challenge, pay, and see the proxied response.
        </p>
      </div>

      {/* Config panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: service + endpoint */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Service &amp; Endpoint</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Service</label>
            <select
              value={selectedSlug}
              onChange={(e) => { setSelectedSlug(e.target.value); reset(); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {services.length === 0 && <option value="">Loading...</option>}
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Endpoint</label>
            <select
              value={selectedEp}
              onChange={(e) => { setSelectedEp(e.target.value); reset(); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={endpoints.length === 0}
            >
              {endpoints.length === 0 && <option value="">No endpoints</option>}
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.path}>{ep.path}  ({ep.method})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">HTTP Method</label>
            <select
              value={reqMethod}
              onChange={(e) => setReqMethod(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: wallet + pricing */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Payment Config</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Agent wallet address</label>
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="agent:0x..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              <a href="/dashboard/wallet" className="underline hover:text-gray-400">Manage wallets →</a>
            </p>
          </div>
          {pricing && (
            <div className="pt-2 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Endpoint pricing</p>
              <p className="text-lg font-bold text-white">
                {pricing.amount} <span className="text-sm font-normal text-gray-400">{pricing.currency}</span>
              </p>
              <p className="text-xs text-gray-500">{pricing.pricingModel} · 10% exchange fee</p>
            </div>
          )}
          {!pricing && currentEp && (
            <div className="pt-2 border-t border-gray-800">
              <p className="text-xs text-gray-500">No pricing configured for this endpoint.</p>
            </div>
          )}
        </div>
      </div>

      {/* Request body + extra headers (collapsible) */}
      {!['GET', 'HEAD'].includes(reqMethod) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Request Body (JSON)</h2>
          <textarea
            value={reqBody}
            onChange={(e) => setReqBody(e.target.value)}
            rows={4}
            placeholder='{"key": "value"}'
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      )}

      {/* Gateway URL */}
      {gatewayUrl && (
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5">
          <span className="text-xs font-mono text-indigo-300 font-semibold shrink-0">{reqMethod}</span>
          <code className="text-xs font-mono text-gray-300 flex-1 break-all">{gatewayUrl}</code>
          <CopyButton text={`http://localhost:3000${gatewayUrl}`} />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={getChallenge}
          disabled={isLoading || !gatewayUrl}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {step === 'challenging' && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {step === 'challenging' ? 'Getting challenge...' : '1. Get Challenge (402)'}
        </button>

        <button
          onClick={sendPayment}
          disabled={isLoading || step !== 'challenged'}
          className="px-5 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {step === 'paying' && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {step === 'paying' ? 'Paying...' : '2. Pay & Call'}
        </button>

        {step !== 'idle' && (
          <button onClick={reset} className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 transition-colors">
            Reset
          </button>
        )}
      </div>

      {/* Error banner */}
      {step === 'error' && errorMsg && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Two-column results */}
      {(result402 || result200) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 402 response */}
          {result402 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Step 1 — Unauthenticated</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={result402.status} />
                  <span className="text-xs text-gray-600">{result402.durationMs}ms</span>
                </div>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-auto max-h-56 whitespace-pre-wrap break-all">
                {(() => { try { return JSON.stringify(JSON.parse(result402.body), null, 2); } catch { return result402.body; } })()}
              </pre>
            </div>
          )}

          {/* 200/502 response */}
          {result200 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Step 2 — Authenticated</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={result200.status} />
                  <span className="text-xs text-gray-600">{result200.durationMs}ms</span>
                </div>
              </div>
              {result200.txId && (
                <div className="px-4 py-2 border-b border-gray-800 bg-green-900/10 flex items-center gap-2">
                  <span className="text-xs text-green-400 font-semibold">TX recorded:</span>
                  <code className="text-xs font-mono text-green-300 flex-1 truncate">{result200.txId}</code>
                  <CopyButton text={result200.txId} />
                </div>
              )}
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-auto max-h-56 whitespace-pre-wrap break-all">
                {(() => { try { return JSON.stringify(JSON.parse(result200.body), null, 2); } catch { return result200.body; } })()}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Challenge details */}
      {challenge && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Challenge Details</span>
            <CopyButton text={challenge.rawHeader} />
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Challenge ID', value: challenge.challengeId },
              { label: 'Method',       value: challenge.method },
              { label: 'Amount',       value: `${challenge.amount} ${challenge.currency}` },
              { label: 'Expires',      value: challenge.expires ? new Date(challenge.expires).toLocaleTimeString() : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-gray-600 mb-0.5">{label}</p>
                <p className="font-mono text-gray-300 break-all">{value}</p>
              </div>
            ))}
          </div>
          {credential && (
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-600 mb-1">Authorization header (minted credential):</p>
              <div className="flex items-start gap-2 bg-gray-800 rounded-lg p-2">
                <code className="text-xs font-mono text-indigo-300 flex-1 break-all">{credential}</code>
                <CopyButton text={credential} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity log */}
      {log.length > 0 && (
        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Activity Log</span>
            <button onClick={() => setLog([])} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Clear</button>
          </div>
          <div className="p-4 font-mono text-xs text-gray-400 space-y-0.5 max-h-48 overflow-auto">
            {log.map((line, i) => (
              <div key={i} className="leading-5">{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* curl snippet */}
      {challenge && (
        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">curl equivalent</span>
            <CopyButton text={`# Step 1\ncurl -i http://localhost:3000${gatewayUrl}\n\n# Step 2\ncurl -i http://localhost:3000${gatewayUrl} \\\n  -H 'Authorization: ${credential}'`} />
          </div>
          <pre className="p-4 text-xs font-mono text-gray-400 overflow-auto whitespace-pre-wrap">{
`# Step 1 — get 402 challenge
curl -i http://localhost:3000${gatewayUrl}

# Step 2 — pay with credential
curl -i http://localhost:3000${gatewayUrl} \\
  -H 'Authorization: ${credential}'`
          }</pre>
        </div>
      )}
    </div>
  );
}


export default function GatewayTestPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm p-8">Loading...</div>}>
      <GatewayTestInner />
    </Suspense>
  );
}
