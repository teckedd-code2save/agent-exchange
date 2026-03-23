MPP Studio: Product Strategy Document
The Opportunity
MPP (Machine Payments Protocol) provides the infrastructure for AI agents to pay for services via HTTP 402 challenges. However, the ecosystem lacks:
Developer tooling to test MPP integrations without real money
Provider dashboards to manage services, pricing, and analytics
Service discovery for agents to find and compare paid APIs
MPP Studio fills these gaps—becoming the "Stripe Dashboard" for the MPP ecosystem.
Core Value Proposition
"The testnet for paid AI services. Develop your MPP-compatible API with fake money, graduate to testnet with real (cheap) transactions, then go live with discovery and analytics."
Tagline: "Where AI services go live"
Target Users
Primary: Service Providers
AI developers building APIs that agents will pay to use. They need:
Zero-risk testing environment
Clear path to production
Revenue analytics and management
Secondary: AI Agents (via Developers)
Developers building autonomous agents that need to discover and pay for services. They need:
Machine-readable service registry
Guaranteed pricing before invocation
Automatic payment handling
The Core Loop
plain
Copy
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE PROVIDER                         │
│  Registers API → Sets Price (USDC/USD) → Gets Endpoint     │
│         ↓                                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │  SANDBOX    │ →  │  TESTNET    │ →  │   PRODUCTION    │ │
│  │  (Fake $)   │    │  (Real $0.01│    │  (Real volume)  │ │
│  │  Test 402   │    │   tests)    │    │  Live agents    │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
│         ↓                                                    │
│  Dashboard: Requests, Revenue, Errors, Webhooks             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        AI AGENT                              │
│  "I need image generation"                                   │
│         ↓                                                    │
│  Search Registry → Compare Price/Latency → Select Service   │
│         ↓                                                    │
│  Auto-negotiate 402 → Pay (Tempo/Stripe) → Use API         │
│         ↓                                                    │
│  Receipt + Attestation (rate service quality)               │
└─────────────────────────────────────────────────────────────┘
User Stories (Prioritized)
P0: Provider Testing Flow
"As a developer, I want to test MPP payments without spending real money, then run a $0.01 testnet transaction to verify end-to-end, before going live."
Key insight: Testing is the activation moment. If they can't test easily, they won't integrate.
P0: Agent Discovery & Payment
"As an AI agent, I want to find services by capability, see upfront pricing, and pay automatically without human intervention."
Key insight: Agents need machine-readable contracts (price, schema, SLA), not just human docs.
P1: Provider Dashboard
"As a service owner, I want to see usage stats, revenue, and manage my listing."
Key insight: This is retention, not acquisition. Build after you have providers.
Database Schema (6 Tables)
prisma
Copy
// 1. Services (the core entity)
model Service {
  id          String   @id @default(cuid())
  name        String
  description String
  providerId  String   // Link to auth (Supabase)
  endpoint    String   // Base URL
  status      Status   @default(draft) // draft, sandbox, testnet, live, paused
  
  // Capabilities for discovery
  category    String   // "image-generation", "search", "data"
  tags        String[] // ["stable-diffusion", "fast"]
  
  // Pricing (flexible schema)
  pricingType PricingType @default(fixed) // fixed, per_token, per_second
  pricingConfig Json    // { amount: "0.005", currency: "USDC" }
  
  // MPP specific
  mppChallengeEndpoint String? // Where to send 402 challenges
  supportedPayments PaymentType[] // [tempo, stripe]
  
  // Analytics (denormalized for speed)
  totalCalls  Int      @default(0)
  totalRevenue Decimal @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  calls       Call[]
  reviews     Review[]
}

// 2. Calls (the transaction log)
model Call {
  id          String   @id @default(cuid())
  serviceId   String
  service     Service  @relation(fields: [serviceId], references: [id])
  
  // Who called (agents are anonymous or identified)
  callerType  CallerType // anonymous, identified_agent, user_proxy
  callerId    String?    // If identified
  
  // The request
  method      String     // GET, POST
  path        String
  status      Int        // 200, 402, 500, etc.
  
  // Payment details
  paymentType PaymentType
  amount      Decimal
  currency    String     // USDC, USD, BTC
  
  // MPP flow tracking
  challengeIssued   Boolean @default(false)
  challengeSolved     Boolean @default(false)
  receiptVerified   Boolean @default(false)
  
  // Timing
  latencyMs   Int        // Total request time
  createdAt   DateTime   @default(now())
  
  // Sandbox/Testnet/Live tracking
  environment Environment @default(sandbox)
}

// 3. Reviews (agent attestation)
model Review {
  id          String   @id @default(cuid())
  serviceId   String
  service     Service  @relation(fields: [serviceId], references: [id])
  
  // Cryptographic attestation
  reviewerId  String   // Agent or user identifier
  rating      Int      // 1-5
  comment     String?
  callId      String   // Link to specific transaction (proof of usage)
  
  // Verified reviews only from actual callers
  verified    Boolean  @default(false)
  
  createdAt   DateTime @default(now())
}

// 4. ServiceVersions (for testing promotion)
model ServiceVersion {
  id          String   @id @default(cuid())
  serviceId   String
  environment Environment // sandbox, testnet, live
  
  endpoint    String     // Environment-specific URL
  pricingConfig Json     // May differ by env (testnet cheaper)
  
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
}

// 5. ProviderWallets (for settlement)
model ProviderWallet {
  id          String   @id @default(cuid())
  providerId  String   @unique
  
  // Tempo (USDC)
  tempoAddress String?
  
  // Stripe (fiat)
  stripeAccountId String?
  
  // Lightning (future)
  lightningAddress String?
  
  // Webhooks for notifications
  webhookUrl  String?
  webhookSecret String?
}

// 6. DiscoveryCache (for fast agent queries)
model DiscoveryCache {
  id          String   @id @default(cuid())
  
  // Pre-computed search index
  category    String
  tags        String[]
  minPrice    Decimal
  maxPrice    Decimal
  avgLatency  Int      // Rolling average
  
  // Ranking signals
  score       Float    // Composite: rating, uptime, price
  
  services    String[] // Service IDs
  updatedAt   DateTime @updatedAt
}
The Testing Flow (Key Differentiator)
1. Sandbox Mode (Zero Cost)
TypeScript
Copy
// Provider registers service
POST /api/v1/services
{
  "name": "My Image API",
  "endpoint": "https://api.example.com/generate",
  "pricing": { "type": "fixed", "amount": "0.01", "currency": "USDC" },
  "mode": "sandbox"
}

// Response includes sandbox endpoint
{
  "id": "svc_123",
  "sandboxEndpoint": "https://yourplatform.com/sandbox/svc_123/proxy",
  "testWallet": {
    "address": "0x sandbox",
    "balance": "1000.00",
    "privateKey": "0x..."
  }
}
What happens:
Platform proxies requests to their API
Injects fake 402 challenges
Simulates payment without blockchain
Returns immediate "receipt"
They test the integration without real money
2. Testnet Promotion (Real $0.01)
TypeScript
Copy
POST /api/v1/services/{id}/promote
{ "target": "testnet" }

// Platform verifies:
// - Their endpoint responds to 402
// - They have real testnet USDC (faucet available)
// - End-to-end payment works

// Then exposes:
// testnetEndpoint: "https://yourplatform.com/testnet/svc_123/proxy"
Testnet USDC Faucet:
Integrate with Base Sepolia or Arbitrum Sepolia
Drip $1.00 to new providers
They can run ~100 real tests
3. Live Promotion (Production)
TypeScript
Copy
POST /api/v1/services/{id}/promote
{ "target": "live", "tempoAddress": "0x...", "stripeAccount": "acct_..." }

// Manual review or automated checks
// Then: listed in discovery registry
The Discovery API (For Agents)
TypeScript
Copy
// Agent searches for services
GET /api/v1/discover?capability=image-generation&maxPrice=0.02&currency=USDC

// Response: Machine-readable service contracts
{
  "services": [
    {
      "id": "svc_123",
      "name": "FastDiffusion",
      "endpoint": "https://yourplatform.com/live/svc_123/proxy",
      "pricing": {
        "type": "fixed",
        "amount": "0.005",
        "currency": "USDC"
      },
      "schema": {
        "input": { "prompt": "string", "width": "number" },
        "output": { "url": "string", "seed": "number" }
      },
      "stats": {
        "avgLatencyMs": 450,
        "successRate": 0.98,
        "last24hCalls": 1240
      },
      "paymentMethods": ["tempo"],
      "mppChallengeUrl": "https://yourplatform.com/live/svc_123/challenge"
    }
  ]
}
Key insight: Agents don't browse HTML. They need structured contracts with guaranteed pricing.
The Agent SDK (Minimal Wrapper)
TypeScript
Copy
// @agent-exchange/client
import { AgentExchange } from '@agent-exchange/client'

const exchange = new AgentExchange({
  wallet: tempoWallet,
  environment: 'live'
})

// Discovery
const services = await exchange.find({
  capability: 'image-generation',
  maxPrice: '0.01',
  currency: 'USDC'
})

// Usage (auto-handles 402)
const result = await services[0].call({
  prompt: 'A red apple',
  width: 1024
})
// Automatically: fetch -> 402 -> pay -> retry -> return result

// Attestation (optional review)
await services[0].review({
  rating: 5,
  comment: 'Fast and cheap'
})
This is the moat: Not the protocol (MPP handles that), but the ergonomics for both sides.
Technical Architecture
plain
Copy
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 App                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Dashboard  │  │  Sandbox    │  │  Discovery API  │ │
│  │  (Providers)│  │  Proxy      │  │  (Agents)       │ │
│  │             │  │  (Fake 402) │  │                 │ │
│  │  - Register │  │             │  │  - Search       │ │
│  │  - Analytics│  │  - Testnet  │  │  - Compare      │ │
│  │  - Promote  │  │    Proxy    │  │  - Call         │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  packages/db (Prisma + 6 tables)                        │
│  packages/mpp (402 challenge/verify - wrap mppx)          │
│  packages/payments (Tempo + Stripe adapters)              │
├─────────────────────────────────────────────────────────┤
│  infra: Vercel + Supabase + Upstash                       │
└─────────────────────────────────────────────────────────┘
Simplified from original: Removed multi-cloud Terraform, complex caching, A2A, Lightning (Phase 2), self-hosted option.
Competitive Positioning
Table
Competitor	MPP Studio Differentiation
mpp.dev/services	They have a static list; we have searchable registry, provider tooling, and testing environments
mppx (wevm)	They provide the protocol SDK; we provide the marketplace layer and developer experience
Stripe	We speak MPP natively (402 challenges, crypto settlement) and understand agent patterns
LangChain Tools	We handle payments and discovery; they handle execution
Go-to-Market Strategy
Phase 1: Provider Tooling (Weeks 1-2)
Sandbox environment
Testnet faucet
Basic dashboard
Phase 2: Discovery Layer (Weeks 3-4)
Search API
Agent SDK
First 5 live services
Phase 3: Ecosystem (Ongoing)
Community reviews
Pricing oracles
Enterprise features (webhooks, SLAs)
7-Day Sprint Plan
Table
Day	Task	Output
1	Narrow schema to 6 tables, migrate	Clean Prisma schema
2	Build sandbox proxy (fake 402)	Working sandbox mode
3	Integrate Tempo testnet faucet	$1.00 testnet USDC flow
4	Build provider registration UI	Dashboard MVP
5	Build discovery API (3 endpoints)	Agent-searchable registry
6	Write provider onboarding docs	README + screencast
7	Post on X, MPP Discord, AI dev forums	3 beta providers
Key Decisions
1. Wrap mppx, Don't Reimplement
Use mppx for core 402 challenge/verify logic. Focus engineering effort on the proxy layer, dashboard, and discovery.
2. SaaS-First, Not Self-Hosted
Start with Vercel + Supabase. Add enterprise/self-hosted later if demand justifies the complexity.
3. Crypto-First, Fiat-Bridge
Lead with Tempo (USDC) for crypto-native agents. Stripe is a bridge for traditional services, not the primary flow.
4. Testnet as Core Feature
Don't treat testnet as an afterthought. Make it the centerpiece of the developer experience—this is the gap in the market.
Success Metrics
Month 1
10 services registered in sandbox
3 services promoted to testnet
1 service live with real transactions
Month 3
50 services in directory
1,000 API calls facilitated
$500 in total transaction volume
Month 6
200 services
10,000 API calls/month
$5,000 monthly transaction volume
5 enterprise providers (paid tier)
Open Questions
Custody model: Should we hold funds briefly (escrow) or direct-settle to providers?
Review authenticity: How do we prevent fake reviews without adding friction?
Dispute resolution: Who arbitrates when an agent claims a service didn't deliver?
Pricing oracle: Should we aggregate and display market rates for common services?
Conclusion
MPP Studio occupies the critical gap between protocol infrastructure (MPP/mppx) and usable developer experience. By focusing on testing, discovery, and payment orchestration—rather than protocol implementation—we build a defensible platform that grows with the MPP ecosystem.
The original 23-table, multi-cloud architecture was over-engineered for this stage. The simplified 6-table, SaaS-first approach prioritizes speed to market and validates demand before scaling complexity.
Next step: Execute the 7-day sprint to validate the sandbox/testing hypothesis with real providers.
