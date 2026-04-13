export interface ProviderAnalyticsService {
  serviceId: string;
  name: string;
  studioSlug: string;
  status: 'draft' | 'sandbox' | 'testnet' | 'live' | 'paused';
  stats: {
    callsLast30d: number;
    successRate: number;
    revenueUsd: string;
    avgLatencyMs: number;
  };
}

export interface ProviderAnalyticsResponse {
  summary: {
    totalRevenue: string;
    totalCallsLast30d: number;
    serviceCount: number;
  };
  services: ProviderAnalyticsService[];
}

export interface ProviderServiceRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  studioSlug: string;
  status: string;
  pricingType: string;
  pricingConfig: { amount?: string; currency?: string } | null;
  tags: string[];
  endpoint: string;
  supportedPayments: string[];
  _count?: { calls: number; reviews: number };
}

export interface DiscoveryServiceRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  studioSlug: string;
  status: 'draft' | 'sandbox' | 'testnet' | 'live' | 'paused';
  supportedPayments: string[];
  totalCalls: number;
  pricingConfig: {
    amount?: string;
    currency?: string;
  } | null;
}
