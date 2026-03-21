import { issueChallenge, verifyCredential, issueReceipt, withMppAuth } from '@agent-exchange/mpp';
import { prisma } from './db';
import { getCache } from './cache';

export { issueChallenge, verifyCredential, issueReceipt, withMppAuth };

export function getMppDeps() {
  return { db: prisma, cache: getCache() };
}
