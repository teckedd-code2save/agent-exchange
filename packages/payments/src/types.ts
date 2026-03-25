export interface PaymentVerificationResult {
  valid: boolean;
  amount?: string;
  currency?: string;
  error?: string;
}
