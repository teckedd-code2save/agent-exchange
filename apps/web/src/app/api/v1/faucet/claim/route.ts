import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@agent-exchange/db';

const FAUCET_AMOUNT = 1.0;
const COOLDOWN_HOURS = 24;

export async function POST(request: NextRequest) {
  try {
    const { walletId } = await request.json();

    if (!walletId) {
      return NextResponse.json({ error: 'Missing walletId' }, { status: 400 });
    }

    // 1. Check rate limit (cooldown)
    const lastClaim = await prisma.faucetClaim.findFirst({
      where: {
        walletId,
        createdAt: {
          gte: new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastClaim) {
      const remainingMs = lastClaim.createdAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000 - Date.now();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      return NextResponse.json(
        { error: `Faucet on cooldown. Try again in ${remainingHours} hours.` },
        { status: 429 }
      );
    }

    // 2. Register the claim
    await prisma.faucetClaim.create({
      data: {
        walletId,
        amount: FAUCET_AMOUNT,
        currency: 'USDC',
        network: 'tempo-testnet',
      },
    });

    // 3. Update Provider balance if the wallet belongs to a provider
    const provider = await prisma.provider.findFirst({
      where: { userId: walletId }, // Simple mapping for demo: walletId = userId
    });

    if (provider) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          testnetBalance: { increment: FAUCET_AMOUNT },
        },
      });
    }

    return NextResponse.json({
      success: true,
      amount: FAUCET_AMOUNT,
      currency: 'USDC',
      network: 'tempo-testnet',
      message: `🎉 ${FAUCET_AMOUNT} USDC testnet tokens sent to ${walletId}`,
    });
  } catch (err: unknown) {
    console.error('[Faucet Error]', err);
    return NextResponse.json({ error: 'Faucet processing failed' }, { status: 500 });
  }
}
