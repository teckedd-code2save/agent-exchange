// MPP Studio — mpp package
// Core 402 challenge logic lives in the proxy route directly for now.
// This package will wrap mppx SDK once we're on testnet/live.
// For the sandbox, all challenge logic is handled in apps/web/src/app/api/v1/proxy

export interface SandboxChallenge {
  challengeId: string
  amount: string
  currency: string
  methods: string[]
}

export function createSandboxChallenge(amount: string, currency: string): SandboxChallenge {
  return {
    challengeId: `sand_chal_${Math.random().toString(36).slice(2)}`,
    amount,
    currency,
    methods: ['sandbox'],
  }
}

export function validateSandboxCredential(authHeader: string): boolean {
  // Any credential with "sandbox-credential" or "Bearer sand_" prefix is accepted
  return authHeader.includes('sandbox-credential') || authHeader.includes('Bearer sand_')
}

export function formatWwwAuthenticate(challenge: SandboxChallenge): string {
  return `Payment method="mpp", challenge="${challenge.challengeId}", amount="${challenge.amount}", currency="${challenge.currency}", methods="${challenge.methods.join(',')}"`
}
