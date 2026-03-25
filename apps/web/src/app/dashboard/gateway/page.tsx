'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ServiceSummary = {
  id: string;
  studioSlug: string;
  name: string;
  status: string;
  description: string;
  pricingType: string;
  pricingConfig?: { amount?: string; currency?: string } | null;
  supportedPayments: string[];
};

type FlowStep = 'idle' | 'challenging' | 'challenged' | 'paying' | 'done' | 'error';

type FlowResult = {
  status: number;
  body: string;
  durationMs: number;
  receipt: string | null;
};

type Challenge = {
  rawHeader: string;
  challengeId: string;
  method: string;
  amount: string;
  currency: string;
};

function getActiveWallet() {
  if (typeof window === 'undefined') {
    return '';
  }
  return localStorage.getItem('ax_active_wallet') ?? 'agent:0xTEST000000000000000000000000000001';
}

function parseWwwAuthenticate(header: string): Challenge | null {
  const read = (key: string) => new RegExp(`${key}="([^"]+)"`).exec(header)?.[1];
  const challengeId = read('challenge');
  const method = read('methods') ?? read('method');
  const amount = read('amount');
  const currency = read('currency') ?? 'USDC';

  if (!challengeId || !method || !amount) {
    return null;
  }

  return { rawHeader: header, challengeId, method, amount, currency };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="text-xs text-slate-500 transition hover:text-slate-200"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function GatewayTesterInner() {
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get('service') ?? '';

  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(preselectedService);
  const [requestPath, setRequestPath] = useState('/reflect');
  const [requestMethod, setRequestMethod] = useState('POST');
  const [requestBody, setRequestBody] = useState('{\n  "input": "hello from MPP Studio"\n}');
  const [wallet, setWallet] = useState('');
  const [step, setStep] = useState<FlowStep>('idle');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [result402, setResult402] = useState<FlowResult | null>(null);
  const [resultFinal, setResultFinal] = useState<FlowResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [origin, setOrigin] = useState('http://localhost:3000');

  const appendLog = useCallback((message: string) => {
    setLog((current) => [...current, `${new Date().toISOString().slice(11, 19)}  ${message}`]);
  }, []);

  useEffect(() => {
    setWallet(getActiveWallet());
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    fetch('/api/v1/provider/services')
      .then((response) => response.json())
      .then((payload: { results?: ServiceSummary[] }) => {
        const results = payload.results ?? [];
        setServices(results);
        const chosen = preselectedService
          ? results.find((service) => service.studioSlug === preselectedService)
          : undefined;
        setSelectedSlug(chosen?.studioSlug ?? results[0]?.studioSlug ?? '');
      })
      .catch(() => appendLog('Failed to load provider services'));
  }, [appendLog, preselectedService]);

  const currentService = useMemo(
    () => services.find((service) => service.studioSlug === selectedSlug) ?? null,
    [selectedSlug, services],
  );

  const proxyUrl = useMemo(() => {
    if (!selectedSlug) {
      return '';
    }
    const normalizedPath = requestPath.startsWith('/') ? requestPath : `/${requestPath}`;
    return `/api/v1/proxy/${selectedSlug}${normalizedPath}`;
  }, [requestPath, selectedSlug]);

  function resetFlow() {
    setStep('idle');
    setChallenge(null);
    setResult402(null);
    setResultFinal(null);
    setErrorMessage('');
    setLog([]);
  }

  const getChallenge = useCallback(async () => {
    if (!proxyUrl) {
      return;
    }

    resetFlow();
    setStep('challenging');
    appendLog(`→ ${requestMethod} ${proxyUrl}`);

    try {
      const startedAt = Date.now();
      const response = await fetch(proxyUrl, {
        method: requestMethod,
        headers: ['GET', 'HEAD'].includes(requestMethod) ? undefined : { 'Content-Type': 'application/json' },
        body: ['GET', 'HEAD'].includes(requestMethod) ? undefined : requestBody,
      });
      const durationMs = Date.now() - startedAt;
      const body = await response.text();
      appendLog(`← ${response.status} (${durationMs}ms)`);

      if (response.status !== 402) {
        setErrorMessage(`Expected a 402 challenge, got ${response.status}.`);
        setResult402({ status: response.status, body, durationMs, receipt: null });
        setStep('error');
        return;
      }

      const header = response.headers.get('www-authenticate') ?? '';
      const parsed = parseWwwAuthenticate(header);
      if (!parsed) {
        setErrorMessage('Could not parse the WWW-Authenticate header.');
        setStep('error');
        return;
      }

      setChallenge(parsed);
      setResult402({ status: response.status, body, durationMs, receipt: null });
      setStep('challenged');
      appendLog(`Challenge ${parsed.challengeId} for ${parsed.amount} ${parsed.currency} via ${parsed.method}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStep('error');
    }
  }, [appendLog, proxyUrl, requestBody, requestMethod]);

  const sendPaidRequest = useCallback(async () => {
    if (!proxyUrl || !challenge) {
      return;
    }

    setStep('paying');
    appendLog(`→ ${requestMethod} ${proxyUrl} [paid]`);

    try {
      const startedAt = Date.now();
      const response = await fetch(proxyUrl, {
        method: requestMethod,
        headers: {
          Authorization: currentService?.status === 'sandbox' ? 'Payment sandbox-credential' : `Payment ${challenge.challengeId}`,
          'Content-Type': 'application/json',
          'x-agent-wallet': wallet,
        },
        body: ['GET', 'HEAD'].includes(requestMethod) ? undefined : requestBody,
      });
      const durationMs = Date.now() - startedAt;
      const body = await response.text();
      const receipt = response.headers.get('payment-receipt');

      appendLog(`← ${response.status} (${durationMs}ms)`);
      setResultFinal({ status: response.status, body, durationMs, receipt });

      if (!response.ok) {
        setErrorMessage(`Paid request returned ${response.status}.`);
        setStep('error');
        return;
      }

      setStep('done');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStep('error');
    }
  }, [appendLog, challenge, currentService?.status, proxyUrl, requestBody, requestMethod, wallet]);

  const pricingLabel = currentService?.pricingConfig
    ? `${currentService.pricingConfig.amount ?? '0.01'} ${currentService.pricingConfig.currency ?? 'USDC'}`
    : '0.01 USDC';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Proxy Tester</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Run the Studio payment loop</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          Pick one of your services, hit the Studio proxy, inspect the 402 challenge, then replay the call with a sandbox credential. This is the fastest way to verify that your API and the Studio proxy agree on the contract.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Request config</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Service</label>
              <select
                value={selectedSlug}
                onChange={(event) => {
                  setSelectedSlug(event.target.value);
                  resetFlow();
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {services.length === 0 && <option value="">Loading services...</option>}
                {services.map((service) => (
                  <option key={service.id} value={service.studioSlug}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-[0.35fr_0.65fr]">
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Method</label>
                <select
                  value={requestMethod}
                  onChange={(event) => setRequestMethod(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Request path</label>
                <input
                  value={requestPath}
                  onChange={(event) => setRequestPath(event.target.value)}
                  placeholder="/reflect"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Agent wallet</label>
              <input
                value={wallet}
                onChange={(event) => setWallet(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {!['GET', 'HEAD'].includes(requestMethod) && (
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">JSON body</label>
                <textarea
                  value={requestBody}
                  onChange={(event) => setRequestBody(event.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Studio contract</h2>
          {currentService ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-lg font-semibold text-white">{currentService.name}</p>
                <p className="mt-2 text-sm leading-7 text-slate-400">{currentService.description}</p>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Environment</dt>
                  <dd className="text-white">{currentService.status}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Price</dt>
                  <dd className="text-white">{pricingLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Payments</dt>
                  <dd className="text-white">{currentService.supportedPayments.join(', ')}</dd>
                </div>
              </dl>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Proxy URL</p>
                <div className="mt-2 flex items-start gap-2">
                  <code className="flex-1 break-all text-xs text-sky-300">{proxyUrl || '/api/v1/proxy/<service>/<path>'}</code>
                  <CopyButton text={`${origin}${proxyUrl}`} />
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Register a service first to use the tester.</p>
          )}
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          onClick={getChallenge}
          disabled={!proxyUrl || step === 'challenging' || step === 'paying'}
          className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === 'challenging' ? 'Requesting challenge...' : '1. Get challenge'}
        </button>
        <button
          onClick={sendPaidRequest}
          disabled={step !== 'challenged'}
          className="rounded-full border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          2. Replay with payment
        </button>
        <button
          onClick={resetFlow}
          className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70"
        >
          Reset
        </button>
      </section>

      {challenge && (
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Challenge</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Method</p>
              <p className="mt-2 text-lg font-semibold text-white">{challenge.method}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Amount</p>
              <p className="mt-2 text-lg font-semibold text-white">{challenge.amount} {challenge.currency}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credential</p>
              <p className="mt-2 text-sm font-mono text-emerald-300">Payment sandbox-credential</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">WWW-Authenticate</p>
            <p className="mt-2 break-all font-mono text-xs text-slate-300">{challenge.rawHeader}</p>
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">402 response</h2>
          {result402 ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-400">Status {result402.status} in {result402.durationMs}ms</p>
              <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">{result402.body}</pre>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Run step 1 to capture the challenge response.</p>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Paid response</h2>
          {resultFinal ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-400">Status {resultFinal.status} in {resultFinal.durationMs}ms</p>
              {resultFinal.receipt && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Payment receipt</p>
                  <p className="mt-2 break-all font-mono text-xs text-emerald-200">{resultFinal.receipt}</p>
                </div>
              )}
              <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">{resultFinal.body}</pre>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Replay the request with payment to see the proxied response.</p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Run log</h2>
        {log.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No events yet.</p>
        ) : (
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">{log.join('\n')}</pre>
        )}
        {errorMessage && <p className="mt-4 text-sm text-rose-300">{errorMessage}</p>}
      </section>
    </div>
  );
}

export default function GatewayPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading tester...</div>}>
      <GatewayTesterInner />
    </Suspense>
  );
}
