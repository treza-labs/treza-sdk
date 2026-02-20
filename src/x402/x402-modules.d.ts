/**
 * Type declarations for x402 optional peer dependencies.
 *
 * These packages use ESM subpath exports that require moduleResolution: "bundler".
 * Since they're dynamically imported as optional deps, we declare minimal types here.
 */

declare module '@x402/core/client' {
  export class x402Client {
    constructor();
  }
  export class x402HTTPClient {
    constructor(client: x402Client);
    getPaymentSettleResponse(headerGetter: (name: string) => string | null): unknown;
  }
}

declare module '@x402/evm/exact/client' {
  export function registerExactEvmScheme(
    client: import('@x402/core/client').x402Client,
    options: { signer: unknown },
  ): void;
}

declare module '@x402/fetch' {
  export function wrapFetchWithPayment(
    fetchFn: typeof fetch,
    client: import('@x402/core/client').x402Client,
  ): typeof fetch;
}
