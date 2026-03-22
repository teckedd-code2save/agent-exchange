import type { ReactNode } from 'react';

const FALLBACK = 'bg-gray-700/60 text-gray-300 border border-gray-600';

const tierColors: Record<string, string> = {
  featured: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  proprietary_data: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  verified: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  free: FALLBACK,
};

const tierLabels: Record<string, string> = {
  featured: 'Featured',
  proprietary_data: 'Proprietary',
  verified: 'Verified',
  free: 'Free',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-300 border border-green-500/30',
  draft: 'bg-gray-700/60 text-gray-400 border border-gray-600',
  suspended: 'bg-red-500/20 text-red-300 border border-red-500/30',
  deprecated: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  pending_review: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
};

const protocolColors: Record<string, string> = {
  mpp: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  mcp: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  openapi: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  a2a: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  acp: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  custom: FALLBACK,
};

const paymentColors: Record<string, string> = {
  tempo: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
  stripe: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  lightning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  custom: FALLBACK,
};

const classificationColors: Record<string, string> = {
  public: 'bg-green-500/20 text-green-300 border border-green-500/30',
  licensed: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  proprietary: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  restricted: 'bg-red-500/20 text-red-300 border border-red-500/30',
};

const txStatusColors: Record<string, string> = {
  settled: 'bg-green-500/20 text-green-300 border border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  failed: 'bg-red-500/20 text-red-300 border border-red-500/30',
  refunded: 'bg-gray-700/60 text-gray-400 border border-gray-600',
};

const payoutStatusColors: Record<string, string> = {
  settled: 'bg-green-500/20 text-green-300 border border-green-500/30',
  processing: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  failed: 'bg-red-500/20 text-red-300 border border-red-500/30',
};

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  return <Badge className={tierColors[tier] ?? FALLBACK}>{tierLabels[tier] ?? tier}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusColors[status] ?? FALLBACK}>{status}</Badge>;
}

export function ProtocolBadge({ protocol }: { protocol: string }) {
  return <Badge className={protocolColors[protocol] ?? FALLBACK}>{protocol.toUpperCase()}</Badge>;
}

export function PaymentBadge({ method }: { method: string }) {
  return <Badge className={paymentColors[method] ?? FALLBACK}>{method}</Badge>;
}

export function ClassificationBadge({ classification }: { classification: string }) {
  return <Badge className={classificationColors[classification] ?? FALLBACK}>{classification}</Badge>;
}

export function TxStatusBadge({ status }: { status: string }) {
  return <Badge className={txStatusColors[status] ?? FALLBACK}>{status}</Badge>;
}

export function PayoutStatusBadge({ status }: { status: string }) {
  return <Badge className={payoutStatusColors[status] ?? FALLBACK}>{status}</Badge>;
}

export function HealthScore({ score }: { score: number }) {
  const color = score >= 95 ? 'text-green-400' : score >= 80 ? 'text-yellow-400' : 'text-red-400';
  const dot = score >= 95 ? 'bg-green-400' : score >= 80 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {score}/100
    </span>
  );
}
