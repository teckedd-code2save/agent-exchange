-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('draft', 'sandbox', 'testnet', 'live', 'paused');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('fixed', 'per_token', 'per_second');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('tempo', 'stripe', 'lightning', 'sandbox');

-- CreateEnum
CREATE TYPE "CallerType" AS ENUM ('anonymous', 'identified_agent', 'user_proxy');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('sandbox', 'testnet', 'production');

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "testnetBalance" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "liveBalance" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "studioSlug" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'draft',
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "pricingType" "PricingType" NOT NULL DEFAULT 'fixed',
    "pricingConfig" JSONB NOT NULL,
    "endpoints" JSONB,
    "mppChallengeEndpoint" TEXT,
    "supportedPayments" "PaymentType"[],
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "environment" "Environment" NOT NULL DEFAULT 'sandbox',
    "name" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "callerType" "CallerType" NOT NULL DEFAULT 'anonymous',
    "callerId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "challengeIssued" BOOLEAN NOT NULL DEFAULT false,
    "challengeSolved" BOOLEAN NOT NULL DEFAULT false,
    "receiptVerified" BOOLEAN NOT NULL DEFAULT false,
    "latencyMs" INTEGER NOT NULL,
    "environment" "Environment" NOT NULL DEFAULT 'sandbox',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "callId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaucetClaim" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "network" TEXT NOT NULL DEFAULT 'tempo-testnet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaucetClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_userId_key" ON "Provider"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_email_key" ON "Provider"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Service_studioSlug_key" ON "Service"("studioSlug");

-- CreateIndex
CREATE INDEX "Service_category_status_idx" ON "Service"("category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "Call_serviceId_createdAt_idx" ON "Call"("serviceId", "createdAt");

-- CreateIndex
CREATE INDEX "Call_serviceId_status_idx" ON "Call"("serviceId", "status");

-- CreateIndex
CREATE INDEX "Call_environment_createdAt_idx" ON "Call"("environment", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_callId_key" ON "Review"("callId");

-- CreateIndex
CREATE INDEX "Review_serviceId_rating_idx" ON "Review"("serviceId", "rating");

-- CreateIndex
CREATE INDEX "FaucetClaim_walletId_createdAt_idx" ON "FaucetClaim"("walletId", "createdAt");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

