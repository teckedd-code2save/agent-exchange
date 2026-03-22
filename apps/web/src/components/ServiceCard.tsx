import Link from 'next/link';
import { TierBadge, ProtocolBadge, PaymentBadge, HealthScore, ClassificationBadge } from './Badge';

interface ServiceCardProps {
  name: string;
  slug: string;
  tagline?: string | null;
  description: string;
  listingTier: string;
  dataClassification: string;
  healthScore: number;
  categories: Array<{ category: string }>;
  protocols: Array<{ protocol: string }>;
  paymentMethods: Array<{ method: string }>;
  href?: string;
}

export function ServiceCard({
  name,
  slug,
  tagline,
  description,
  listingTier,
  dataClassification,
  healthScore,
  categories,
  protocols,
  paymentMethods,
  href,
}: ServiceCardProps) {
  const link = href ?? `/marketplace/${slug}`;

  return (
    <Link
      href={link}
      className="group block p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-indigo-500/50 hover:bg-gray-900/80 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
            {name}
          </h3>
          {tagline && <p className="text-xs text-gray-400 mt-0.5 truncate">{tagline}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <HealthScore score={healthScore} />
          <TierBadge tier={listingTier} />
        </div>
      </div>

      <p className="text-sm text-gray-400 line-clamp-2 mb-4">{description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {categories.slice(0, 4).map((c) => (
          <span
            key={c.category}
            className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded"
          >
            {c.category}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {protocols.map((p) => (
            <ProtocolBadge key={p.protocol} protocol={p.protocol} />
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {paymentMethods.map((m) => (
            <PaymentBadge key={m.method} method={m.method} />
          ))}
          <ClassificationBadge classification={dataClassification} />
        </div>
      </div>
    </Link>
  );
}
