import type {
  Organisation,
  OrganisationMember,
  ApiKey,
  Service,
  ServiceCategory,
  ServiceProtocol,
  ServiceEndpoint,
  ServiceGeoRestriction,
  ServicePaymentMethod,
  EndpointPricing,
  AccessTier,
  AccessGrant,
  MppChallenge,
  MppCredential,
  MppReceipt,
  Transaction,
  Session,
  HealthCheck,
  SlaCommitment,
  SlaBreach,
  DiscoveryEvent,
  ServiceStatsDaily,
  Payout,
} from '@prisma/client';

export type {
  Organisation,
  OrganisationMember,
  ApiKey,
  Service,
  ServiceCategory,
  ServiceProtocol,
  ServiceEndpoint,
  ServiceGeoRestriction,
  ServicePaymentMethod,
  EndpointPricing,
  AccessTier,
  AccessGrant,
  MppChallenge,
  MppCredential,
  MppReceipt,
  Transaction,
  Session,
  HealthCheck,
  SlaCommitment,
  SlaBreach,
  DiscoveryEvent,
  ServiceStatsDaily,
  Payout,
};

export type ServiceWithRelations = Service & {
  categories: ServiceCategory[];
  protocols: ServiceProtocol[];
  endpoints: (ServiceEndpoint & { pricing: EndpointPricing[] })[];
  geoRestrictions: ServiceGeoRestriction[];
  paymentMethods: ServicePaymentMethod[];
  slaCommitment: SlaCommitment | null;
  healthChecks: HealthCheck[];
};

export type ServiceListItem = Pick<
  Service,
  | 'id'
  | 'name'
  | 'slug'
  | 'description'
  | 'tagline'
  | 'serviceUrl'
  | 'logoUrl'
  | 'listingTier'
  | 'status'
  | 'dataClassification'
  | 'healthScore'
  | 'createdAt'
> & {
  categories: ServiceCategory[];
  protocols: ServiceProtocol[];
  paymentMethods: ServicePaymentMethod[];
};

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Vector search stub — Phase 2
export type SearchResult = ServiceListItem & { relevanceScore: number };
