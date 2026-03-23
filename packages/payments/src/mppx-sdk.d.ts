declare module '@mppx/sdk' {
  type TempoTransactionStatus = 'pending' | 'confirmed' | 'failed';

  export interface TempoTransaction {
    txHash: string;
    status: TempoTransactionStatus;
    amount: string;
    toAddress: string;
    confirmedAt: string;
  }

  export interface TempoTransferPayload {
    from: string;
    to: string;
    amount: string;
    memo?: string;
  }

  export interface TempoTransferResponse {
    txHash: string;
    amount: string;
    confirmedAt: string;
  }

  export interface TempoClientOptions {
    apiKey: string;
  }

  export class TempoClient {
    constructor(options: TempoClientOptions);
    getTransaction(txHash: string): Promise<TempoTransaction>;
    transfer(payload: TempoTransferPayload): Promise<TempoTransferResponse>;
  }

  export interface TempoWalletOptions {
    privateKey: string;
  }

  export class TempoWallet {
    constructor(options: TempoWalletOptions);
    readonly address: string;
    transfer(args: TempoTransferPayload): Promise<TempoTransferResponse>;
  }
}
