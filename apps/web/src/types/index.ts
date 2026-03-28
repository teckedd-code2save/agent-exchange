export type ServiceStatus = "draft" | "sandbox" | "testnet" | "live" | "paused";

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  status: ServiceStatus;
  studioSlug: string;
  endpoint: string;
  pricingType: string;
  pricingConfig: Record<string, string> | null;
  endpoints: unknown;
  supportedPayments: string[];
  totalCalls: number;
  createdAt: string;
}

export interface Call {
  id: string;
  serviceId: string;
  method: string;
  path: string;
  status: number;
  amount: number;
  currency: string;
  latencyMs: number;
  environment: string;
  createdAt: string;
  service: { name: string; studioSlug: string };
}
