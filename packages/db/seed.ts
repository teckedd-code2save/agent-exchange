#!/usr/bin/env tsx
/**
 * Comprehensive seed — realistic Agent Exchange marketplace data
 * Run: cd packages/db && DATABASE_URL=... npx tsx seed.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.info('→ Seeding Agent Exchange...\n');

  // ── Organisations ────────────────────────────────────────────────────────────

  const [orgNexus, orgDataForge, orgQuantAI, orgWeatherStack] = await Promise.all([
    prisma.organisation.upsert({
      where: { slug: 'nexus-labs' },
      update: {},
      create: {
        name: 'Nexus Labs',
        slug: 'nexus-labs',
        tier: 'featured',
        status: 'active',
        billingEmail: 'billing@nexuslabs.ai',
        tempoWalletAddress: '0xA1b2C3d4E5f6a7B8c9D0e1F2a3b4C5d6E7f8A9B0',
        stripeCustomerId: 'cus_nexus_labs_001',
        metadata: { website: 'https://nexuslabs.ai', founded: 2022 },
      },
    }),
    prisma.organisation.upsert({
      where: { slug: 'dataforge-inc' },
      update: {},
      create: {
        name: 'DataForge Inc',
        slug: 'dataforge-inc',
        tier: 'proprietary_data',
        status: 'active',
        billingEmail: 'finance@dataforge.io',
        tempoWalletAddress: '0xB2c3D4e5F6a7b8C9d0E1f2A3b4c5D6e7F8a9B0C1',
        stripeCustomerId: 'cus_dataforge_inc_002',
        metadata: { website: 'https://dataforge.io', sector: 'financial-data' },
      },
    }),
    prisma.organisation.upsert({
      where: { slug: 'quant-ai' },
      update: {},
      create: {
        name: 'QuantAI Research',
        slug: 'quant-ai',
        tier: 'verified',
        status: 'active',
        billingEmail: 'ops@quantai.dev',
        tempoWalletAddress: '0xC3d4E5f6A7b8c9D0e1F2a3B4c5d6E7f8A9b0C1D2',
        metadata: { website: 'https://quantai.dev' },
      },
    }),
    prisma.organisation.upsert({
      where: { slug: 'weatherstack' },
      update: {},
      create: {
        name: 'WeatherStack',
        slug: 'weatherstack',
        tier: 'free',
        status: 'active',
        billingEmail: 'hello@weatherstack.io',
        metadata: { website: 'https://weatherstack.io' },
      },
    }),
  ]);

  console.info('✓ Organisations');

  // ── API Keys ──────────────────────────────────────────────────────────────────

  await prisma.apiKey.createMany({
    data: [
      {
        organisationId: orgNexus.id,
        name: 'Production Key',
        keyHash: 'sha256:nexus_prod_aabbccdd11223344',
        scopes: ['services:read', 'services:write', 'analytics:read'],
        lastUsedAt: new Date(),
      },
      {
        organisationId: orgDataForge.id,
        name: 'Integration Key',
        keyHash: 'sha256:dataforge_int_eeff55667788',
        scopes: ['services:read', 'transactions:read'],
        lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        organisationId: orgQuantAI.id,
        name: 'Dev Key',
        keyHash: 'sha256:quantai_dev_99aabb001122',
        scopes: ['services:read'],
      },
    ],
    skipDuplicates: true,
  });

  console.info('✓ API Keys');

  // ── Services ──────────────────────────────────────────────────────────────────

  const [svcInfer, svcMarket, svcWeather, svcEmbed, svcScraper, svcCodeExec] =
    await Promise.all([
      // 1. LLM inference gateway
      prisma.service.upsert({
        where: { slug: 'nexus-infer' },
        update: {},
        create: {
          organisationId: orgNexus.id,
          name: 'Nexus Infer',
          slug: 'nexus-infer',
          tagline: 'Multi-model LLM gateway with MPP-native billing',
          description:
            'Route to GPT-4o, Claude 3, Gemini Ultra, and 40+ open-source models via a single MPP-compatible endpoint. Pay-per-token in USDC or Stripe.',
          serviceUrl: 'https://infer.nexuslabs.ai',
          llmsTxtUrl: 'https://infer.nexuslabs.ai/llms.txt',
          logoUrl: 'https://infer.nexuslabs.ai/logo.png',
          registrationType: 'curated',
          listingTier: 'featured',
          status: 'active',
          dataClassification: 'public',
          healthScore: 99,
          verifiedAt: new Date('2025-01-15'),
          featuredUntil: new Date('2026-12-31'),
        },
      }),

      // 2. Financial market data
      prisma.service.upsert({
        where: { slug: 'dataforge-markets' },
        update: {},
        create: {
          organisationId: orgDataForge.id,
          name: 'DataForge Markets',
          slug: 'dataforge-markets',
          tagline: 'Real-time and historical market data — equities, FX, crypto',
          description:
            'Institutional-grade market data covering 80,000+ instruments across equities, FX, crypto, and derivatives. Tick-level granularity, 15-year history, live feeds via WebSocket.',
          serviceUrl: 'https://markets.dataforge.io',
          llmsTxtUrl: 'https://markets.dataforge.io/llms.txt',
          registrationType: 'curated',
          listingTier: 'proprietary_data',
          status: 'active',
          dataClassification: 'proprietary',
          healthScore: 100,
          verifiedAt: new Date('2025-03-01'),
        },
      }),

      // 3. Weather & climate data
      prisma.service.upsert({
        where: { slug: 'weatherstack-api' },
        update: {},
        create: {
          organisationId: orgWeatherStack.id,
          name: 'WeatherStack API',
          slug: 'weatherstack-api',
          tagline: 'Global weather data for AI agents',
          description:
            'Current conditions, 10-day forecasts, and 50-year historical climate data for 200,000+ locations worldwide. JSON + MCP compatible.',
          serviceUrl: 'https://api.weatherstack.io',
          registrationType: 'self_serve',
          listingTier: 'free',
          status: 'active',
          dataClassification: 'public',
          healthScore: 94,
          verifiedAt: new Date('2025-06-10'),
        },
      }),

      // 4. Vector embeddings
      prisma.service.upsert({
        where: { slug: 'nexus-embed' },
        update: {},
        create: {
          organisationId: orgNexus.id,
          name: 'Nexus Embed',
          slug: 'nexus-embed',
          tagline: 'High-throughput embedding service — 1024-dim vectors',
          description:
            'Generate dense vector embeddings using our fine-tuned E5-large and GTE-Qwen2 models. Optimised for retrieval, clustering, and semantic search at scale.',
          serviceUrl: 'https://embed.nexuslabs.ai',
          registrationType: 'self_serve',
          listingTier: 'verified',
          status: 'active',
          dataClassification: 'public',
          healthScore: 100,
          verifiedAt: new Date('2025-04-20'),
        },
      }),

      // 5. Web scraper
      prisma.service.upsert({
        where: { slug: 'quantai-scraper' },
        update: {},
        create: {
          organisationId: orgQuantAI.id,
          name: 'QuantAI Scraper',
          slug: 'quantai-scraper',
          tagline: 'JS-rendered web scraping with structured output',
          description:
            'Extract structured data from any webpage with JavaScript rendering, CAPTCHA bypass, and LLM-powered schema extraction. Returns clean JSON.',
          serviceUrl: 'https://scraper.quantai.dev',
          registrationType: 'self_serve',
          listingTier: 'verified',
          status: 'active',
          dataClassification: 'public',
          healthScore: 87,
        },
      }),

      // 6. Code execution sandbox
      prisma.service.upsert({
        where: { slug: 'nexus-sandbox' },
        update: {},
        create: {
          organisationId: orgNexus.id,
          name: 'Nexus Sandbox',
          slug: 'nexus-sandbox',
          tagline: 'Secure code execution — Python, JS, Rust, Go',
          description:
            'Run arbitrary code in isolated gVisor containers with network access, file system mounts, and resource limits. Ideal for agent tool-use.',
          serviceUrl: 'https://sandbox.nexuslabs.ai',
          registrationType: 'curated',
          listingTier: 'featured',
          status: 'active',
          dataClassification: 'public',
          healthScore: 98,
          verifiedAt: new Date('2025-02-01'),
          featuredUntil: new Date('2026-06-30'),
        },
      }),
    ]);

  console.info('✓ Services');

  // ── Categories ────────────────────────────────────────────────────────────────

  await prisma.serviceCategory.createMany({
    data: [
      { serviceId: svcInfer.id, category: 'llm' },
      { serviceId: svcInfer.id, category: 'inference' },
      { serviceId: svcInfer.id, category: 'nlp' },
      { serviceId: svcMarket.id, category: 'finance' },
      { serviceId: svcMarket.id, category: 'market-data' },
      { serviceId: svcMarket.id, category: 'real-time' },
      { serviceId: svcWeather.id, category: 'weather' },
      { serviceId: svcWeather.id, category: 'climate' },
      { serviceId: svcWeather.id, category: 'geospatial' },
      { serviceId: svcEmbed.id, category: 'embeddings' },
      { serviceId: svcEmbed.id, category: 'nlp' },
      { serviceId: svcEmbed.id, category: 'ml' },
      { serviceId: svcScraper.id, category: 'web-scraping' },
      { serviceId: svcScraper.id, category: 'data-extraction' },
      { serviceId: svcCodeExec.id, category: 'code-execution' },
      { serviceId: svcCodeExec.id, category: 'sandbox' },
      { serviceId: svcCodeExec.id, category: 'devtools' },
    ],
    skipDuplicates: true,
  });

  console.info('✓ Categories');

  // ── Protocols ─────────────────────────────────────────────────────────────────

  await prisma.serviceProtocol.createMany({
    data: [
      { serviceId: svcInfer.id, protocol: 'mpp', specUrl: 'https://infer.nexuslabs.ai/.well-known/mpp' },
      { serviceId: svcInfer.id, protocol: 'openapi', specUrl: 'https://infer.nexuslabs.ai/openapi.json' },
      { serviceId: svcMarket.id, protocol: 'mpp', specUrl: 'https://markets.dataforge.io/.well-known/mpp' },
      { serviceId: svcMarket.id, protocol: 'openapi', specUrl: 'https://markets.dataforge.io/openapi.json' },
      { serviceId: svcWeather.id, protocol: 'mcp', mcpServerUrl: 'https://api.weatherstack.io/mcp' },
      { serviceId: svcWeather.id, protocol: 'openapi', specUrl: 'https://api.weatherstack.io/openapi.json' },
      { serviceId: svcEmbed.id, protocol: 'mpp', specUrl: 'https://embed.nexuslabs.ai/.well-known/mpp' },
      { serviceId: svcEmbed.id, protocol: 'openapi', specUrl: 'https://embed.nexuslabs.ai/openapi.json' },
      { serviceId: svcScraper.id, protocol: 'mpp', specUrl: 'https://scraper.quantai.dev/.well-known/mpp' },
      { serviceId: svcCodeExec.id, protocol: 'mpp', specUrl: 'https://sandbox.nexuslabs.ai/.well-known/mpp' },
      { serviceId: svcCodeExec.id, protocol: 'a2a', specUrl: 'https://sandbox.nexuslabs.ai/a2a' },
    ],
    skipDuplicates: true,
  });

  console.info('✓ Protocols');

  // ── Endpoints ─────────────────────────────────────────────────────────────────

  const [
    epInferChat,
    epInferComplete,
    epMarketQuote,
    epMarketHistory,
    epWeatherCurrent,
    epWeatherForecast,
    epEmbedBatch,
    epScraperExtract,
    epCodeRun,
  ] = await Promise.all([
    prisma.serviceEndpoint.upsert({
      where: { serviceId_path_method: { serviceId: svcInfer.id, path: '/v1/chat/completions', method: 'POST' } },
      update: {},
      create: { serviceId: svcInfer.id, path: '/v1/chat/completions', method: 'POST', name: 'Chat Completions', description: 'OpenAI-compatible chat endpoint', rateLimitRpm: 1000 },
    }),
    prisma.serviceEndpoint.upsert({
      where: { serviceId_path_method: { serviceId: svcInfer.id, path: '/v1/completions', method: 'POST' } },
      update: {},
      create: { serviceId: svcInfer.id, path: '/v1/completions', method: 'POST', name: 'Text Completions', description: 'Raw text completion', rateLimitRpm: 500 },
    }),
    prisma.serviceEndpoint.upsert({
      where: { serviceId_path_method: { serviceId: svcMarket.id, path: '/v1/quote', method: 'GET' } },
      update: {},
      create: { serviceId: svcMarket.id, path: '/v1/quote', method: 'GET', name: 'Real-time Quote', description: 'Live bid/ask for a symbol', rateLimitRpm: 600, dataClassification: 'proprietary' },
    }),
    prisma.serviceEndpoint.upsert({
      where: { serviceId_path_method: { serviceId: svcMarket.id, path: '/v1/history', method: 'GET' } },
      update: {},
      create: { serviceId: svcMarket.id, path: '/v1/history', method: 'GET', name: 'OHLCV History', description: 'Daily and intraday OHLCV bars', rateLimitRpm: 120, dataClassification: 'proprietary' },
    }),
    prisma.serviceEndpoint.upsert({
      where: { serviceId_path_method: { serviceId: svcWeather.id, path: '/v1/current', method: 'GET' } },
      update: {},
      create: { serviceId: svcWeather.id, path: '/v1/current', method: 'GET', name: 'Current Conditions', description: 'Current weather for a location', rateLimitRpm: 300 },
    }),
    prisma.serviceEndpoint.upsert({
      where: { serviceId_path_method: { serviceId: svcWeather.id, path: '/v1/forecast', method: 'GET' } },
      update: {},
      create: { serviceId: svcWeather.id, path: '/v1/forecast', method: 'GET', name: '10-Day Forecast', description: 'Hourly forecast for 10 days', rateLimitRpm: 120 },
    }),
    prisma.serviceEndpoint.upsert({
      where: { serviceId_path_method: { serviceId: svcEmbed.id, path: '/v1/embeddings', method: 'POST' } },
      update: {},
      create: { serviceId: svcEmbed.id, path: '/v1/embeddings', method: 'POST', name: 'Batch Embeddings', description: 'Embed up to 256 texts per request', rateLimitRpm: 200 },
    }),
    prisma.serviceEndpoint.upsert({
      where: { serviceId_path_method: { serviceId: svcScraper.id, path: '/v1/extract', method: 'POST' } },
      update: {},
      create: { serviceId: svcScraper.id, path: '/v1/extract', method: 'POST', name: 'Structured Extract', description: 'Extract structured JSON from a URL', rateLimitRpm: 60 },
    }),
    prisma.serviceEndpoint.upsert({
      where: { serviceId_path_method: { serviceId: svcCodeExec.id, path: '/v1/run', method: 'POST' } },
      update: {},
      create: { serviceId: svcCodeExec.id, path: '/v1/run', method: 'POST', name: 'Execute Code', description: 'Run code in an isolated sandbox', rateLimitRpm: 120 },
    }),
  ]);

  console.info('✓ Endpoints');

  // ── Payment Methods ───────────────────────────────────────────────────────────

  const [
    pmInferTempo, pmInferStripe,
    pmMarketTempo, pmMarketStripe,
    pmWeatherTempo,
    pmEmbedTempo,
    pmScraperTempo,
    pmCodeTempo, pmCodeStripe,
  ] = await Promise.all([
    prisma.servicePaymentMethod.upsert({
      where: { serviceId_method_intent: { serviceId: svcInfer.id, method: 'tempo', intent: 'charge' } },
      update: {},
      create: { serviceId: svcInfer.id, method: 'tempo', intent: 'charge', isActive: true, config: { network: 'base' } },
    }),
    prisma.servicePaymentMethod.upsert({
      where: { serviceId_method_intent: { serviceId: svcInfer.id, method: 'stripe', intent: 'charge' } },
      update: {},
      create: { serviceId: svcInfer.id, method: 'stripe', intent: 'charge', isActive: true, config: {} },
    }),
    prisma.servicePaymentMethod.upsert({
      where: { serviceId_method_intent: { serviceId: svcMarket.id, method: 'tempo', intent: 'session' } },
      update: {},
      create: { serviceId: svcMarket.id, method: 'tempo', intent: 'session', isActive: true, config: { network: 'base' } },
    }),
    prisma.servicePaymentMethod.upsert({
      where: { serviceId_method_intent: { serviceId: svcMarket.id, method: 'stripe', intent: 'charge' } },
      update: {},
      create: { serviceId: svcMarket.id, method: 'stripe', intent: 'charge', isActive: true, config: {} },
    }),
    prisma.servicePaymentMethod.upsert({
      where: { serviceId_method_intent: { serviceId: svcWeather.id, method: 'tempo', intent: 'charge' } },
      update: {},
      create: { serviceId: svcWeather.id, method: 'tempo', intent: 'charge', isActive: true, config: {} },
    }),
    prisma.servicePaymentMethod.upsert({
      where: { serviceId_method_intent: { serviceId: svcEmbed.id, method: 'tempo', intent: 'charge' } },
      update: {},
      create: { serviceId: svcEmbed.id, method: 'tempo', intent: 'charge', isActive: true, config: {} },
    }),
    prisma.servicePaymentMethod.upsert({
      where: { serviceId_method_intent: { serviceId: svcScraper.id, method: 'tempo', intent: 'charge' } },
      update: {},
      create: { serviceId: svcScraper.id, method: 'tempo', intent: 'charge', isActive: true, config: {} },
    }),
    prisma.servicePaymentMethod.upsert({
      where: { serviceId_method_intent: { serviceId: svcCodeExec.id, method: 'tempo', intent: 'charge' } },
      update: {},
      create: { serviceId: svcCodeExec.id, method: 'tempo', intent: 'charge', isActive: true, config: {} },
    }),
    prisma.servicePaymentMethod.upsert({
      where: { serviceId_method_intent: { serviceId: svcCodeExec.id, method: 'stripe', intent: 'charge' } },
      update: {},
      create: { serviceId: svcCodeExec.id, method: 'stripe', intent: 'charge', isActive: true, config: {} },
    }),
  ]);

  console.info('✓ Payment Methods');

  // ── Endpoint Pricing ──────────────────────────────────────────────────────────

  await prisma.endpointPricing.createMany({
    data: [
      // Infer - Chat (per_token)
      { endpointId: epInferChat.id, paymentMethodId: pmInferTempo.id, pricingModel: 'per_token', amount: '0.00000200', currency: 'USDC', unit: 'token' },
      { endpointId: epInferChat.id, paymentMethodId: pmInferStripe.id, pricingModel: 'per_token', amount: '0.00000250', currency: 'USD', unit: 'token' },
      // Infer - Completions (per_token)
      { endpointId: epInferComplete.id, paymentMethodId: pmInferTempo.id, pricingModel: 'per_token', amount: '0.00000150', currency: 'USDC', unit: 'token' },
      // Markets - Quote (flat per call)
      { endpointId: epMarketQuote.id, paymentMethodId: pmMarketTempo.id, pricingModel: 'flat', amount: '0.00100000', currency: 'USDC' },
      { endpointId: epMarketQuote.id, paymentMethodId: pmMarketStripe.id, pricingModel: 'flat', amount: '0.00120000', currency: 'USD' },
      // Markets - History (tiered)
      { endpointId: epMarketHistory.id, paymentMethodId: pmMarketTempo.id, pricingModel: 'tiered', amount: '0.00500000', currency: 'USDC', unit: 'request' },
      // Weather - Current (flat)
      { endpointId: epWeatherCurrent.id, paymentMethodId: pmWeatherTempo.id, pricingModel: 'flat', amount: '0.00010000', currency: 'USDC' },
      // Weather - Forecast (flat)
      { endpointId: epWeatherForecast.id, paymentMethodId: pmWeatherTempo.id, pricingModel: 'flat', amount: '0.00050000', currency: 'USDC' },
      // Embeddings (per_token)
      { endpointId: epEmbedBatch.id, paymentMethodId: pmEmbedTempo.id, pricingModel: 'per_token', amount: '0.00000010', currency: 'USDC', unit: 'token' },
      // Scraper (flat per request)
      { endpointId: epScraperExtract.id, paymentMethodId: pmScraperTempo.id, pricingModel: 'flat', amount: '0.00500000', currency: 'USDC' },
      // Code execution (per_second)
      { endpointId: epCodeRun.id, paymentMethodId: pmCodeTempo.id, pricingModel: 'per_second', amount: '0.00020000', currency: 'USDC', unit: 'second', minAmount: '0.00010000', maxAmount: '0.05000000' },
      { endpointId: epCodeRun.id, paymentMethodId: pmCodeStripe.id, pricingModel: 'per_second', amount: '0.00025000', currency: 'USD', unit: 'second' },
    ],
    skipDuplicates: true,
  });

  console.info('✓ Pricing');

  // ── Access Tiers ──────────────────────────────────────────────────────────────

  const [atMarketPro, atMarketEnterprise] = await Promise.all([
    prisma.accessTier.upsert({
      where: { id: 'aaaa0001-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: 'aaaa0001-0000-0000-0000-000000000001',
        serviceId: svcMarket.id,
        name: 'Pro',
        description: 'Real-time quotes + 5yr history, 600 RPM',
        dataClassification: 'licensed',
        requiresApproval: false,
        priceMonthly: '199.00',
        stripePriceId: 'price_market_pro_monthly',
      },
    }),
    prisma.accessTier.upsert({
      where: { id: 'aaaa0001-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: 'aaaa0001-0000-0000-0000-000000000002',
        serviceId: svcMarket.id,
        name: 'Enterprise',
        description: 'Tick-level data, full history, SLA, 6000 RPM',
        dataClassification: 'proprietary',
        requiresApproval: true,
        priceMonthly: '999.00',
        stripePriceId: 'price_market_ent_monthly',
      },
    }),
  ]);

  // Access grants — QuantAI subscribes to DataForge Markets Pro
  await prisma.accessGrant.upsert({
    where: { organisationId_accessTierId: { organisationId: orgQuantAI.id, accessTierId: atMarketPro.id } },
    update: {},
    create: {
      organisationId: orgQuantAI.id,
      accessTierId: atMarketPro.id,
      grantedBy: 'system',
      expiresAt: new Date('2027-01-01'),
    },
  });

  console.info('✓ Access Tiers & Grants');

  // ── Transactions ──────────────────────────────────────────────────────────────

  const txData = [
    { orgId: orgQuantAI.id, svcId: svcInfer.id, epId: epInferChat.id, method: 'tempo' as const, gross: '0.04200000', fee: '0.00084000', net: '0.04116000', currency: 'USDC', status: 'settled' as const, wallet: '0xC3d4E5f6A7b8c9D0e1F2a3B4c5d6E7f8A9b0C1D2', daysAgo: 0 },
    { orgId: orgQuantAI.id, svcId: svcMarket.id, epId: epMarketQuote.id, method: 'tempo' as const, gross: '0.10000000', fee: '0.00200000', net: '0.09800000', currency: 'USDC', status: 'settled' as const, wallet: '0xC3d4E5f6A7b8c9D0e1F2a3B4c5d6E7f8A9b0C1D2', daysAgo: 0 },
    { orgId: orgNexus.id, svcId: svcEmbed.id, epId: epEmbedBatch.id, method: 'stripe' as const, gross: '0.01500000', fee: '0.00030000', net: '0.01470000', currency: 'USD', status: 'settled' as const, wallet: null, daysAgo: 1 },
    { orgId: orgWeatherStack.id, svcId: svcWeather.id, epId: epWeatherCurrent.id, method: 'tempo' as const, gross: '0.00100000', fee: '0.00002000', net: '0.00098000', currency: 'USDC', status: 'settled' as const, wallet: '0xD4e5F6a7B8c9d0E1f2A3b4C5d6E7F8a9B0c1D2E3', daysAgo: 1 },
    { orgId: orgQuantAI.id, svcId: svcScraper.id, epId: epScraperExtract.id, method: 'tempo' as const, gross: '0.05000000', fee: '0.00100000', net: '0.04900000', currency: 'USDC', status: 'settled' as const, wallet: '0xC3d4E5f6A7b8c9D0e1F2a3B4c5d6E7f8A9b0C1D2', daysAgo: 2 },
    { orgId: orgNexus.id, svcId: svcCodeExec.id, epId: epCodeRun.id, method: 'tempo' as const, gross: '0.02400000', fee: '0.00048000', net: '0.02352000', currency: 'USDC', status: 'settled' as const, wallet: '0xA1b2C3d4E5f6a7B8c9D0e1F2a3b4C5d6E7f8A9B0', daysAgo: 3 },
    { orgId: orgQuantAI.id, svcId: svcInfer.id, epId: epInferChat.id, method: 'stripe' as const, gross: '1.25000000', fee: '0.02500000', net: '1.22500000', currency: 'USD', status: 'settled' as const, wallet: null, daysAgo: 5 },
    { orgId: orgWeatherStack.id, svcId: svcWeather.id, epId: epWeatherForecast.id, method: 'tempo' as const, gross: '0.00500000', fee: '0.00010000', net: '0.00490000', currency: 'USDC', status: 'pending' as const, wallet: '0xD4e5F6a7B8c9d0E1f2A3b4C5d6E7F8a9B0c1D2E3', daysAgo: 0 },
  ];

  for (let i = 0; i < txData.length; i++) {
    const t = txData[i];
    const ts = new Date(Date.now() - t.daysAgo * 86400000 - i * 300000);
    await prisma.transaction.upsert({
      where: { idempotencyKey: `seed-tx-${i + 1}` },
      update: {},
      create: {
        organisationId: t.orgId,
        serviceId: t.svcId,
        endpointId: t.epId,
        paymentMethod: t.method,
        intent: 'charge',
        status: t.status,
        grossAmount: t.gross,
        exchangeFee: t.fee,
        netAmount: t.net,
        currency: t.currency,
        agentWalletAddress: t.wallet,
        idempotencyKey: `seed-tx-${i + 1}`,
        initiatedAt: ts,
        settledAt: t.status === 'settled' ? new Date(ts.getTime() + 2000) : null,
      },
    });
  }

  console.info('✓ Transactions');

  // ── Health Checks ─────────────────────────────────────────────────────────────

  const healthData: Array<{ svcId: string; hoursAgo: number; status: 'up' | 'degraded' | 'down'; httpStatus: number; latencyMs: number }> = [
    { svcId: svcInfer.id, hoursAgo: 0, status: 'up', httpStatus: 200, latencyMs: 142 },
    { svcId: svcInfer.id, hoursAgo: 1, status: 'up', httpStatus: 200, latencyMs: 138 },
    { svcId: svcInfer.id, hoursAgo: 2, status: 'up', httpStatus: 200, latencyMs: 155 },
    { svcId: svcMarket.id, hoursAgo: 0, status: 'up', httpStatus: 200, latencyMs: 48 },
    { svcId: svcMarket.id, hoursAgo: 1, status: 'up', httpStatus: 200, latencyMs: 51 },
    { svcId: svcWeather.id, hoursAgo: 0, status: 'up', httpStatus: 200, latencyMs: 210 },
    { svcId: svcWeather.id, hoursAgo: 1, status: 'degraded', httpStatus: 200, latencyMs: 1850 },
    { svcId: svcWeather.id, hoursAgo: 2, status: 'up', httpStatus: 200, latencyMs: 230 },
    { svcId: svcEmbed.id, hoursAgo: 0, status: 'up', httpStatus: 200, latencyMs: 89 },
    { svcId: svcEmbed.id, hoursAgo: 1, status: 'up', httpStatus: 200, latencyMs: 92 },
    { svcId: svcScraper.id, hoursAgo: 0, status: 'up', httpStatus: 200, latencyMs: 3200 },
    { svcId: svcScraper.id, hoursAgo: 2, status: 'down', httpStatus: 503, latencyMs: 30000 },
    { svcId: svcCodeExec.id, hoursAgo: 0, status: 'up', httpStatus: 200, latencyMs: 520 },
    { svcId: svcCodeExec.id, hoursAgo: 1, status: 'up', httpStatus: 200, latencyMs: 488 },
  ];

  await prisma.healthCheck.createMany({
    data: healthData.map((h) => ({
      serviceId: h.svcId,
      checkedAt: new Date(Date.now() - h.hoursAgo * 3600000),
      status: h.status,
      httpStatus: h.httpStatus,
      latencyMs: h.latencyMs,
    })),
    skipDuplicates: false,
  });

  console.info('✓ Health Checks');

  // ── SLA Commitments ───────────────────────────────────────────────────────────

  await prisma.slaCommitment.createMany({
    data: [
      { serviceId: svcInfer.id, uptimeTargetPct: '99.90', maxLatencyMs: 500, supportEmail: 'sla@nexuslabs.ai', statusPageUrl: 'https://status.nexuslabs.ai' },
      { serviceId: svcMarket.id, uptimeTargetPct: '99.95', maxLatencyMs: 100, supportEmail: 'sla@dataforge.io', statusPageUrl: 'https://status.dataforge.io' },
      { serviceId: svcCodeExec.id, uptimeTargetPct: '99.50', maxLatencyMs: 2000, supportEmail: 'sla@nexuslabs.ai' },
    ],
    skipDuplicates: true,
  });

  console.info('✓ SLA Commitments');

  // ── Daily Stats (last 14 days) ────────────────────────────────────────────────

  const statsRows = [];
  for (let d = 13; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);

    statsRows.push(
      { serviceId: svcInfer.id, date, discoveryImpressions: 320 + Math.floor(Math.random() * 80), discoveryClicks: 48 + Math.floor(Math.random() * 20), endpointCalls: 2100 + Math.floor(Math.random() * 500), totalVolume: '4.20000000', totalFees: '0.08400000', p50LatencyMs: 140, p99LatencyMs: 380, uptimePct: '99.95' },
      { serviceId: svcMarket.id, date, discoveryImpressions: 180 + Math.floor(Math.random() * 40), discoveryClicks: 22 + Math.floor(Math.random() * 10), endpointCalls: 8500 + Math.floor(Math.random() * 1000), totalVolume: '85.00000000', totalFees: '1.70000000', p50LatencyMs: 49, p99LatencyMs: 120, uptimePct: '100.00' },
      { serviceId: svcWeather.id, date, discoveryImpressions: 90 + Math.floor(Math.random() * 20), discoveryClicks: 12 + Math.floor(Math.random() * 5), endpointCalls: 450 + Math.floor(Math.random() * 100), totalVolume: '0.45000000', totalFees: '0.00900000', p50LatencyMs: 215, p99LatencyMs: 890, uptimePct: d === 1 ? '97.20' : '99.50' },
      { serviceId: svcEmbed.id, date, discoveryImpressions: 120 + Math.floor(Math.random() * 30), discoveryClicks: 18 + Math.floor(Math.random() * 8), endpointCalls: 640 + Math.floor(Math.random() * 150), totalVolume: '0.96000000', totalFees: '0.01920000', p50LatencyMs: 90, p99LatencyMs: 210, uptimePct: '100.00' },
      { serviceId: svcScraper.id, date, discoveryImpressions: 65 + Math.floor(Math.random() * 15), discoveryClicks: 8 + Math.floor(Math.random() * 4), endpointCalls: 120 + Math.floor(Math.random() * 40), totalVolume: '0.60000000', totalFees: '0.01200000', p50LatencyMs: 3100, p99LatencyMs: 12000, uptimePct: d === 2 ? '85.00' : '95.00' },
      { serviceId: svcCodeExec.id, date, discoveryImpressions: 200 + Math.floor(Math.random() * 50), discoveryClicks: 30 + Math.floor(Math.random() * 12), endpointCalls: 980 + Math.floor(Math.random() * 200), totalVolume: '2.35000000', totalFees: '0.04700000', p50LatencyMs: 510, p99LatencyMs: 2100, uptimePct: '99.80' },
    );
  }

  await prisma.serviceStatsDaily.createMany({ data: statsRows, skipDuplicates: true });

  console.info('✓ Daily Stats (14 days × 6 services)');

  // ── Discovery Events ──────────────────────────────────────────────────────────

  await prisma.discoveryEvent.createMany({
    data: [
      { agentWalletAddress: '0xC3d4E5f6A7b8c9D0e1F2a3B4c5d6E7f8A9b0C1D2', queryText: 'llm inference pay per token', filters: { category: 'llm' }, resultCount: 3, paymentMethod: 'tempo', amount: '0.00000200', currency: 'USDC', queriedAt: new Date(Date.now() - 10 * 60000) },
      { agentWalletAddress: '0xD4e5F6a7B8c9d0E1f2A3b4C5d6E7F8a9B0c1D2E3', queryText: 'real time stock market data', filters: { category: 'finance' }, resultCount: 1, queriedAt: new Date(Date.now() - 30 * 60000) },
      { agentWalletAddress: '0xE5f6A7b8C9d0e1F2a3B4c5D6e7f8A9B0c1D2e3F4', queryText: 'weather forecast api', filters: {}, resultCount: 2, queriedAt: new Date(Date.now() - 2 * 3600000) },
      { agentWalletAddress: '0xC3d4E5f6A7b8c9D0e1F2a3B4c5d6E7f8A9b0C1D2', queryText: 'embedding model usdc payment', filters: { paymentMethod: 'tempo' }, resultCount: 2, paymentMethod: 'tempo', queriedAt: new Date(Date.now() - 5 * 3600000) },
      { agentWalletAddress: '0xF6a7B8c9D0e1f2A3b4C5d6E7f8A9b0C1d2E3f4A5', queryText: 'code sandbox python execution', filters: { category: 'code-execution' }, resultCount: 1, queriedAt: new Date(Date.now() - 86400000) },
    ],
    skipDuplicates: false,
  });

  console.info('✓ Discovery Events');

  // ── Payouts ───────────────────────────────────────────────────────────────────

  const periodStart = new Date('2026-03-01');
  const periodEnd = new Date('2026-03-15');

  await prisma.payout.createMany({
    data: [
      { organisationId: orgNexus.id, periodStart, periodEnd, grossAmount: '312.50000000', exchangeFee: '6.25000000', netAmount: '306.25000000', currency: 'USDC', paymentMethod: 'tempo', status: 'settled', settledAt: new Date('2026-03-18') },
      { organisationId: orgDataForge.id, periodStart, periodEnd, grossAmount: '1275.00000000', exchangeFee: '25.50000000', netAmount: '1249.50000000', currency: 'USDC', paymentMethod: 'tempo', status: 'processing' },
      { organisationId: orgQuantAI.id, periodStart, periodEnd, grossAmount: '48.30000000', exchangeFee: '0.97000000', netAmount: '47.33000000', currency: 'USDC', paymentMethod: 'tempo', status: 'pending' },
    ],
    skipDuplicates: false,
  });

  console.info('✓ Payouts');

  console.info('\n✅ Seed complete!\n');
  console.info('Services seeded:');
  console.info('  • nexus-infer       — LLM gateway (featured, tempo+stripe, per-token)');
  console.info('  • dataforge-markets — Financial data (proprietary, tempo+stripe, access-tiered)');
  console.info('  • weatherstack-api  — Weather (public, tempo)');
  console.info('  • nexus-embed       — Embeddings (verified, tempo, per-token)');
  console.info('  • quantai-scraper   — Web scraping (verified, tempo)');
  console.info('  • nexus-sandbox     — Code execution (featured, tempo+stripe, per-second)');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
