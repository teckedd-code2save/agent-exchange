import type {
  PrismaClient,
  Prisma,
  AgentProtocol,
  PaymentMethod,
  DataClassification,
} from '@prisma/client';
import type {
  ServiceWithRelations,
  ServiceListItem,
  PaginatedResult,
  SearchResult,
} from '../types';

export interface ServiceFilters {
  category?: string;
  protocol?: string;
  method?: string;
  classification?: string;
  region?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export class ServicesRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(filters: ServiceFilters = {}): Promise<PaginatedResult<ServiceListItem>> {
    const { category, protocol, method, classification, q, limit = 20, offset = 0 } = filters;

    const where: Prisma.ServiceWhereInput = {
      status: 'active',
      deletedAt: null,
      ...(category && { categories: { some: { category } } }),
      ...(protocol && { protocols: { some: { protocol: protocol as AgentProtocol } } }),
      ...(method && { paymentMethods: { some: { method: method as PaymentMethod } } }),
      ...(classification && { dataClassification: classification as DataClassification }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tagline: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.db.service.count({ where }),
      this.db.service.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          tagline: true,
          serviceUrl: true,
          logoUrl: true,
          listingTier: true,
          status: true,
          dataClassification: true,
          healthScore: true,
          createdAt: true,
          categories: true,
          protocols: true,
          paymentMethods: true,
        },
        orderBy: [{ listingTier: 'desc' }, { healthScore: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(limit, 100),
        skip: offset,
      }),
    ]);

    return { data, meta: { total, limit: Math.min(limit, 100), offset } };
  }

  async findBySlug(slug: string): Promise<ServiceWithRelations | null> {
    return this.db.service.findFirst({
      where: { slug, deletedAt: null },
      include: {
        categories: true,
        protocols: true,
        endpoints: {
          where: { deprecatedAt: null },
          include: { pricing: true },
        },
        geoRestrictions: true,
        paymentMethods: true,
        slaCommitment: true,
        healthChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async create(data: Prisma.ServiceCreateInput): Promise<{ id: string; slug: string }> {
    const service = await this.db.service.create({
      data,
      select: { id: true, slug: true },
    });
    return service;
  }

  async update(slug: string, data: Prisma.ServiceUpdateInput): Promise<ServiceWithRelations> {
    return this.db.service.update({
      where: { slug },
      data,
      include: {
        categories: true,
        protocols: true,
        endpoints: { include: { pricing: true } },
        geoRestrictions: true,
        paymentMethods: true,
        slaCommitment: true,
        healthChecks: { take: 10, orderBy: { checkedAt: 'desc' } },
      },
    });
  }

  async softDelete(slug: string): Promise<void> {
    await this.db.service.update({
      where: { slug },
      data: { deletedAt: new Date(), status: 'deprecated' },
    });
  }

  async search(query: string, limit = 20, offset = 0): Promise<PaginatedResult<SearchResult>> {
    // pg_trgm similarity search via raw query
    const results = await this.db.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      description: string;
      tagline: string | null;
      serviceUrl: string;
      logoUrl: string | null;
      listingTier: string;
      status: string;
      dataClassification: string;
      healthScore: number;
      createdAt: Date;
      relevance: number;
    }>>`
      SELECT
        s.id, s.name, s.slug, s.description, s.tagline, s."serviceUrl", s."logoUrl",
        s."listingTier", s.status, s."dataClassification", s."healthScore", s."createdAt",
        similarity(s.name || ' ' || s.description, ${query}) AS relevance
      FROM services s
      WHERE s.status = 'active'
        AND s."deletedAt" IS NULL
        AND (
          s.name % ${query}
          OR s.description % ${query}
        )
      ORDER BY relevance DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = results.length;
    const data: SearchResult[] = results.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      tagline: r.tagline,
      serviceUrl: r.serviceUrl,
      logoUrl: r.logoUrl,
      listingTier: r.listingTier as ServiceListItem['listingTier'],
      status: r.status as ServiceListItem['status'],
      dataClassification: r.dataClassification as ServiceListItem['dataClassification'],
      healthScore: r.healthScore,
      createdAt: r.createdAt,
      categories: [],
      protocols: [],
      paymentMethods: [],
      relevanceScore: Number(r.relevance),
    }));

    return { data, meta: { total, limit, offset } };
  }

  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    const result = await this.db.serviceCategory.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });
    return result.map((r) => ({ category: r.category, count: r._count.category }));
  }

  async compare(slugs: string[]): Promise<ServiceWithRelations[]> {
    return this.db.service.findMany({
      where: { slug: { in: slugs }, status: 'active', deletedAt: null },
      include: {
        categories: true,
        protocols: true,
        endpoints: { include: { pricing: true } },
        geoRestrictions: true,
        paymentMethods: true,
        slaCommitment: true,
        healthChecks: { take: 1, orderBy: { checkedAt: 'desc' } },
      },
    });
  }

  async submitForVerification(slug: string): Promise<void> {
    await this.db.service.update({
      where: { slug },
      data: { status: 'draft' },
    });
  }

  async approve(slug: string): Promise<void> {
    await this.db.service.update({
      where: { slug },
      data: { status: 'active', verifiedAt: new Date() },
    });
  }

  async suspend(slug: string): Promise<void> {
    await this.db.service.update({
      where: { slug },
      data: { status: 'suspended' },
    });
  }

  async findAllActive(): Promise<Array<{ id: string; slug: string; serviceUrl: string; healthScore: number }>> {
    return this.db.service.findMany({
      where: { status: 'active', deletedAt: null },
      select: { id: true, slug: true, serviceUrl: true, healthScore: true },
    });
  }

  async addEndpoint(
    serviceId: string,
    data: Prisma.ServiceEndpointCreateWithoutServiceInput,
  ): Promise<{ id: string }> {
    return this.db.serviceEndpoint.create({
      data: { ...data, service: { connect: { id: serviceId } } },
      select: { id: true },
    });
  }

  async addEndpointPricing(
    endpointId: string,
    paymentMethodId: string,
    data: Omit<Prisma.EndpointPricingCreateInput, 'endpoint' | 'paymentMethod'>,
  ): Promise<{ id: string }> {
    return this.db.endpointPricing.create({
      data: {
        ...data,
        endpoint: { connect: { id: endpointId } },
        paymentMethod: { connect: { id: paymentMethodId } },
      },
      select: { id: true },
    });
  }
}
