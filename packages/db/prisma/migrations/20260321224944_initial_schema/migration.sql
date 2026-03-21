-- CreateEnum
CREATE TYPE "OrgTier" AS ENUM ('free', 'verified', 'featured', 'proprietary_data');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('active', 'suspended', 'pending_review');

-- CreateEnum
CREATE TYPE "OrgMemberRole" AS ENUM ('owner', 'admin', 'viewer');

-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('self_serve', 'curated', 'gateway_wrapped');

-- CreateEnum
CREATE TYPE "ListingTier" AS ENUM ('free', 'verified', 'featured', 'proprietary_data');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('draft', 'active', 'suspended', 'deprecated');

-- CreateEnum
CREATE TYPE "DataClassification" AS ENUM ('public', 'licensed', 'proprietary', 'restricted');

-- CreateEnum
CREATE TYPE "AgentProtocol" AS ENUM ('mpp', 'mcp', 'openapi', 'a2a', 'acp', 'custom');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

-- CreateEnum
CREATE TYPE "RestrictionType" AS ENUM ('allowlist', 'denylist');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('tempo', 'stripe', 'lightning', 'custom');

-- CreateEnum
CREATE TYPE "PaymentIntent" AS ENUM ('charge', 'session');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('flat', 'per_token', 'per_byte', 'per_second', 'tiered');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'settled', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('open', 'closed', 'expired', 'force_closed');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'settled', 'failed');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('up', 'degraded', 'down', 'timeout');

-- CreateEnum
CREATE TYPE "BreachType" AS ENUM ('uptime', 'latency');

-- CreateTable
CREATE TABLE "organisations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" "OrgTier" NOT NULL DEFAULT 'free',
    "status" "OrgStatus" NOT NULL DEFAULT 'active',
    "billingEmail" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "tempoWalletAddress" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_members" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgMemberRole" NOT NULL DEFAULT 'viewer',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "organisation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tagline" TEXT,
    "serviceUrl" TEXT NOT NULL,
    "llmsTxtUrl" TEXT,
    "logoUrl" TEXT,
    "registrationType" "RegistrationType" NOT NULL DEFAULT 'self_serve',
    "listingTier" "ListingTier" NOT NULL DEFAULT 'free',
    "status" "ServiceStatus" NOT NULL DEFAULT 'draft',
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'public',
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "verifiedAt" TIMESTAMP(3),
    "featuredUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "serviceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("serviceId","category")
);

-- CreateTable
CREATE TABLE "service_protocols" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "protocol" "AgentProtocol" NOT NULL,
    "specUrl" TEXT,
    "mcpServerUrl" TEXT,
    "openapiSpec" JSONB,
    "notes" TEXT,

    CONSTRAINT "service_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_endpoints" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" "HttpMethod" NOT NULL DEFAULT 'POST',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'public',
    "rateLimitRpm" INTEGER,
    "deprecatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_geo_restrictions" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "restrictionType" "RestrictionType" NOT NULL,
    "regions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_geo_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_payment_methods" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "intent" "PaymentIntent" NOT NULL DEFAULT 'charge',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endpoint_pricing" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "pricingModel" "PricingModel" NOT NULL DEFAULT 'flat',
    "amount" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "unit" TEXT,
    "minAmount" DECIMAL(18,8),
    "maxAmount" DECIMAL(18,8),
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),

    CONSTRAINT "endpoint_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_tiers" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataClassification" "DataClassification" NOT NULL DEFAULT 'licensed',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "priceMonthly" DECIMAL(12,2),
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_grants" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "accessTierId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "grantedBy" TEXT,

    CONSTRAINT "access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mpp_challenges" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "endpointPath" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "intent" "PaymentIntent" NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "digest" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "mpp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mpp_credentials" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "agentWalletAddress" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mpp_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mpp_receipts" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "resourcePath" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mpp_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "serviceId" TEXT NOT NULL,
    "endpointId" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "intent" "PaymentIntent" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "grossAmount" DECIMAL(18,8) NOT NULL,
    "exchangeFee" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "agentWalletAddress" TEXT,
    "stripePaymentIntentId" TEXT,
    "lightningPaymentHash" TEXT,
    "tempoTxHash" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "serviceId" TEXT NOT NULL,
    "agentWalletAddress" TEXT NOT NULL,
    "channelId" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'open',
    "totalAmount" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_checks" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "HealthStatus" NOT NULL,
    "httpStatus" INTEGER,
    "latencyMs" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_commitments" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "uptimeTargetPct" DECIMAL(5,2) NOT NULL,
    "maxLatencyMs" INTEGER,
    "supportEmail" TEXT,
    "statusPageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_breaches" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "slaCommitmentId" TEXT NOT NULL,
    "breachType" "BreachType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "actualValue" DECIMAL(10,4) NOT NULL,
    "targetValue" DECIMAL(10,4) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sla_breaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_events" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "agentWalletAddress" TEXT,
    "queryText" TEXT,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "resultCount" INTEGER,
    "paymentMethod" "PaymentMethod",
    "amount" DECIMAL(18,8),
    "currency" TEXT,
    "queriedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_stats_daily" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "discoveryImpressions" INTEGER NOT NULL DEFAULT 0,
    "discoveryClicks" INTEGER NOT NULL DEFAULT 0,
    "endpointCalls" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalFees" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "p50LatencyMs" INTEGER,
    "p99LatencyMs" INTEGER,
    "uptimePct" DECIMAL(5,2),

    CONSTRAINT "service_stats_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossAmount" DECIMAL(18,8) NOT NULL,
    "exchangeFee" DECIMAL(18,8) NOT NULL,
    "netAmount" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organisations_slug_key" ON "organisations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_stripeCustomerId_key" ON "organisations"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_members_organisationId_userId_key" ON "organisation_members"("organisationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "service_protocols_serviceId_protocol_key" ON "service_protocols"("serviceId", "protocol");

-- CreateIndex
CREATE UNIQUE INDEX "service_endpoints_serviceId_path_method_key" ON "service_endpoints"("serviceId", "path", "method");

-- CreateIndex
CREATE UNIQUE INDEX "service_payment_methods_serviceId_method_intent_key" ON "service_payment_methods"("serviceId", "method", "intent");

-- CreateIndex
CREATE UNIQUE INDEX "access_grants_organisationId_accessTierId_key" ON "access_grants"("organisationId", "accessTierId");

-- CreateIndex
CREATE UNIQUE INDEX "mpp_challenges_challengeId_key" ON "mpp_challenges"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "mpp_credentials_challengeId_key" ON "mpp_credentials"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "mpp_receipts_credentialId_key" ON "mpp_receipts"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "mpp_receipts_receiptId_key" ON "mpp_receipts"("receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_stripePaymentIntentId_key" ON "transactions"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_lightningPaymentHash_key" ON "transactions"("lightningPaymentHash");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tempoTxHash_key" ON "transactions"("tempoTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_channelId_key" ON "sessions"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "sla_commitments_serviceId_key" ON "sla_commitments"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "service_stats_daily_serviceId_date_key" ON "service_stats_daily"("serviceId", "date");

-- AddForeignKey
ALTER TABLE "organisation_members" ADD CONSTRAINT "organisation_members_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_protocols" ADD CONSTRAINT "service_protocols_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_endpoints" ADD CONSTRAINT "service_endpoints_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_geo_restrictions" ADD CONSTRAINT "service_geo_restrictions_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_payment_methods" ADD CONSTRAINT "service_payment_methods_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endpoint_pricing" ADD CONSTRAINT "endpoint_pricing_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "service_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endpoint_pricing" ADD CONSTRAINT "endpoint_pricing_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "service_payment_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_tiers" ADD CONSTRAINT "access_tiers_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_accessTierId_fkey" FOREIGN KEY ("accessTierId") REFERENCES "access_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mpp_credentials" ADD CONSTRAINT "mpp_credentials_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "mpp_challenges"("challengeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mpp_receipts" ADD CONSTRAINT "mpp_receipts_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "mpp_credentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "service_endpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_checks" ADD CONSTRAINT "health_checks_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_commitments" ADD CONSTRAINT "sla_commitments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_breaches" ADD CONSTRAINT "sla_breaches_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_breaches" ADD CONSTRAINT "sla_breaches_slaCommitmentId_fkey" FOREIGN KEY ("slaCommitmentId") REFERENCES "sla_commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_events" ADD CONSTRAINT "discovery_events_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_stats_daily" ADD CONSTRAINT "service_stats_daily_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
