import { Hono } from "hono";
import { prisma } from "@agent-exchange/db";

const FAUCET_AMOUNT = 1.0;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const faucet = new Hono();

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
        (lastClaim.createdAt.getTime() + COOLDOWN_MS - Date.now()) / 3_600_000
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
      message: `${FAUCET_AMOUNT} USDC testnet tokens sent to ${walletId}`,
    });
  } catch (err) {
    console.error("[Faucet Error]", err);
    return c.json({ error: "Faucet processing failed" }, 500);
  }
});
