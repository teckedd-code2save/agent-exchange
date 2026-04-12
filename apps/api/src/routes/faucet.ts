import { Hono } from "hono";
import { prisma } from "@agent-exchange/db";
import { usdcContractAddress, X402_DEFAULT_NETWORK } from "@agent-exchange/mpp";

const FAUCET_AMOUNT = 1.0;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const faucet = new Hono();

/**
 * POST /api/v1/faucet/claim
 *
 * Sandbox faucet — credits 1 USDC to the provider's testnetBalance in the DB.
 * This is a local accounting entry only (no on-chain transfer). Use it to
 * simulate wallet balance for sandbox-mode services.
 *
 * For real on-chain testnet USDC (needed for x402 payments), see GET /testnet-info.
 */
faucet.post("/claim", async (c) => {
  try {
    const { walletId } = await c.req.json<{ walletId: string }>();
    if (!walletId) return c.json({ error: "Missing walletId" }, 400);

    const lastClaim = await prisma.faucetClaim.findFirst({
      where: { walletId, createdAt: { gte: new Date(Date.now() - COOLDOWN_MS) } },
      orderBy: { createdAt: "desc" },
    });

    if (lastClaim) {
      const remaining = Math.ceil(
        (lastClaim.createdAt.getTime() + COOLDOWN_MS - Date.now()) / 3_600_000,
      );
      return c.json({ error: `Faucet on cooldown. Try again in ${remaining} hours.` }, 429);
    }

    await prisma.faucetClaim.create({
      data: { walletId, amount: FAUCET_AMOUNT, currency: "USDC", network: "tempo-testnet" },
    });

    const provider = await prisma.provider.findFirst({ where: { userId: walletId } });
    if (provider) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: { testnetBalance: { increment: FAUCET_AMOUNT } },
      });
    }

    return c.json({
      success: true,
      amount: FAUCET_AMOUNT,
      currency: "USDC",
      network: "tempo-testnet",
      note: "This is a sandbox balance credit. For real testnet USDC (x402 payments), see GET /api/v1/faucet/testnet-info",
      message: `${FAUCET_AMOUNT} USDC testnet tokens credited to ${walletId}`,
    });
  } catch (err) {
    console.error("[Faucet Error]", err);
    return c.json({ error: "Faucet processing failed" }, 500);
  }
});

/**
 * GET /api/v1/faucet/testnet-info
 *
 * Returns everything an MPP client needs to fund a wallet with real testnet
 * USDC and start making x402 payments against services on this platform.
 *
 * Typical flow:
 *   1. Visit https://faucet.circle.com → paste your EVM wallet → pick Base Sepolia → claim 20 USDC
 *   2. Hit a protected endpoint (you'll get a 402 with an x402 block in the body)
 *   3. Sign an EIP-712 transferWithAuthorization using the x402 details
 *   4. Retry with X-PAYMENT: <base64url EIP-712 payload>
 *   5. Server verifies via Coinbase CDP facilitator and proxies to upstream
 */
faucet.get("/testnet-info", (c) => {
  const network = process.env["X402_NETWORK"] ?? X402_DEFAULT_NETWORK;
  const payTo = process.env["X402_PAY_TO_ADDRESS"];
  const usdcAddress = usdcContractAddress(network);

  return c.json({
    sandbox: {
      description:
        "Sandbox mode uses fake USDC tracked in the platform DB. No wallet needed.",
      faucet: "/api/v1/faucet/claim",
      credential: "sandbox-credential",
      usage: 'Add  Authorization: Payment <base64url({"challengeId":"...","paymentMethod":"sandbox","agentWalletAddress":"any","proof":"sandbox-credential"})>',
    },
    testnet: {
      description:
        "x402 uses real USDC on Base Sepolia. Get free tokens from the Circle faucet, then sign an EIP-712 payment.",
      steps: [
        "1. Get 20 USDC on Base Sepolia: https://faucet.circle.com (no account needed, 20 USDC per 2 hours)",
        "2. Call any x402-enabled endpoint — you'll receive a 402 with an x402 block in the JSON body",
        "3. Use the x402 SDK (https://github.com/coinbase/x402) or craft the EIP-712 signature manually",
        "4. Retry the request with  X-PAYMENT: <base64url-encoded EIP-712 payload>",
        "5. The server verifies via the Coinbase CDP facilitator and forwards to the upstream API",
      ],
      network,
      usdcContract: usdcAddress ?? "unknown — check X402_NETWORK env var",
      payTo: payTo ?? "not configured — set X402_PAY_TO_ADDRESS in server env",
      cdpFacilitator: "https://facilitator.cdp.coinbase.com",
      circleFaucet: "https://faucet.circle.com",
      x402Sdk: "https://github.com/coinbase/x402",
      x402Spec: "https://www.x402.org",
    },
    supportedNetworks: {
      "base-sepolia": {
        usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        faucet: "https://faucet.circle.com",
        explorer: "https://sepolia.basescan.org",
      },
      base: {
        usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        note: "Mainnet — real money",
        explorer: "https://basescan.org",
      },
      "ethereum-sepolia": {
        usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        faucet: "https://faucet.circle.com",
        explorer: "https://sepolia.etherscan.io",
      },
    },
  });
});
