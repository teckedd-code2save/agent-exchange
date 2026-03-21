import type { PrismaClient, Prisma, Organisation, OrganisationMember, OrgMemberRole, OrgTier } from '@prisma/client';

export class OrganisationsRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Organisation | null> {
    return this.db.organisation.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Organisation | null> {
    return this.db.organisation.findUnique({ where: { slug } });
  }

  async findMembership(organisationId: string, userId: string): Promise<OrganisationMember | null> {
    return this.db.organisationMember.findUnique({
      where: { organisationId_userId: { organisationId, userId } },
    });
  }

  async create(data: Prisma.OrganisationCreateInput): Promise<Organisation> {
    return this.db.organisation.create({ data });
  }

  async update(id: string, data: Prisma.OrganisationUpdateInput): Promise<Organisation> {
    return this.db.organisation.update({ where: { id }, data });
  }

  async addMember(
    organisationId: string,
    userId: string,
    role: OrgMemberRole,
  ): Promise<OrganisationMember> {
    return this.db.organisationMember.create({
      data: { organisationId, userId, role },
    });
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<Organisation | null> {
    return this.db.organisation.findUnique({ where: { stripeCustomerId } });
  }

  async updateTier(id: string, tier: OrgTier): Promise<Organisation> {
    return this.db.organisation.update({
      where: { id },
      data: { tier },
    });
  }
}
