/**
 * x402 Client Factory for Treza Enclaves
 *
 * Convenience functions for creating x402 payment clients backed by
 * a Treza EnclaveSigner. Handles all the wiring between Treza's
 * platform API and the x402 protocol.
 *
 * @example Basic fetch with automatic payments
 * ```typescript
 * import { TrezaClient } from '@treza/sdk';
 * import { createEnclaveFetch } from '@treza/sdk/x402';
 *
 * const client = new TrezaClient({ baseUrl: 'https://app.trezalabs.com' });
 *
 * const paidFetch = await createEnclaveFetch(client, {
 *   enclaveId: 'enc_abc123',
 *   verifyAttestation: true,
 * });
 *
 * // Payments are handled automatically on 402 responses
 * const res = await paidFetch('https://api.example.com/paid-endpoint');
 * const data = await res.json();
 * ```
 *
 * @example Using the x402 client directly
 * ```typescript
 * import { TrezaClient } from '@treza/sdk';
 * import { createEnclaveX402Client } from '@treza/sdk/x402';
 *
 * const client = new TrezaClient({ baseUrl: 'https://app.trezalabs.com' });
 * const { x402, account } = await createEnclaveX402Client(client, {
 *   enclaveId: 'enc_abc123',
 * });
 *
 * // Use x402 client with any HTTP library
 * ```
 */

import { TrezaClient } from '../client';
import { createEnclaveAccount, ViemAccount } from './enclave-account';
import { EnclaveX402Config } from './types';

/**
 * Result of creating an x402 client backed by an enclave.
 */
export interface EnclaveX402ClientResult {
  /** The x402 client instance — pass to wrapFetchWithPayment, wrapAxiosWithPayment, etc. */
  x402: any;
  /** The viem-compatible enclave account used for signing payments */
  account: ViemAccount;
}

/**
 * Creates an x402 client backed by a Treza Enclave.
 *
 * Requires `@x402/core` and `@x402/evm` as peer dependencies.
 * The enclave signs all x402 payment headers inside the TEE.
 *
 * @param platformClient - An authenticated TrezaClient instance
 * @param config - Enclave and x402 configuration
 * @returns An x402 client and the enclave account
 *
 * @throws If `@x402/core` or `@x402/evm` are not installed
 * @throws If the enclave has no signing address
 */
export async function createEnclaveX402Client(
  platformClient: TrezaClient,
  config: EnclaveX402Config,
): Promise<EnclaveX402ClientResult> {
  const account = await createEnclaveAccount(platformClient, {
    enclaveId: config.enclaveId,
    verifyAttestation: config.verifyAttestation,
    attestationNonce: config.attestationNonce,
  });

  // Dynamically import x402 to keep it as an optional peer dependency
  let x402Client: any;
  let registerExactEvmScheme: any;

  try {
    const core = await import('@x402/core/client');
    x402Client = core.x402Client;
  } catch {
    throw new Error(
      'Missing dependency: @x402/core. Install it with: npm install @x402/core'
    );
  }

  try {
    const evm = await import('@x402/evm/exact/client');
    registerExactEvmScheme = evm.registerExactEvmScheme;
  } catch {
    throw new Error(
      'Missing dependency: @x402/evm. Install it with: npm install @x402/evm'
    );
  }

  const client = new x402Client();
  registerExactEvmScheme(client, { signer: account });

  return { x402: client, account };
}

/**
 * Creates a `fetch` function that automatically handles x402 payments
 * using a Treza Enclave as the payment wallet.
 *
 * Requires `@x402/fetch`, `@x402/core`, and `@x402/evm` as peer dependencies.
 *
 * @param platformClient - An authenticated TrezaClient instance
 * @param config - Enclave and x402 configuration
 * @returns A fetch function with automatic x402 payment handling
 *
 * @example
 * ```typescript
 * const paidFetch = await createEnclaveFetch(client, { enclaveId: 'enc_abc123' });
 *
 * // This automatically pays if the server returns 402
 * const response = await paidFetch('https://api.example.com/paid-resource');
 * ```
 */
export async function createEnclaveFetch(
  platformClient: TrezaClient,
  config: EnclaveX402Config,
): Promise<typeof fetch> {
  const { x402 } = await createEnclaveX402Client(platformClient, config);

  let wrapFetchWithPayment: any;
  try {
    const fetchModule = await import('@x402/fetch');
    wrapFetchWithPayment = fetchModule.wrapFetchWithPayment;
  } catch {
    throw new Error(
      'Missing dependency: @x402/fetch. Install it with: npm install @x402/fetch'
    );
  }

  return wrapFetchWithPayment(fetch, x402);
}

/**
 * Discovers available x402-payable services from the Bazaar.
 *
 * @param filters - Optional filters for discovery
 * @returns List of available payable services
 */
export async function discoverPayableServices(filters?: {
  maxPrice?: string;
  network?: string;
  tags?: string[];
}): Promise<any[]> {
  const url = new URL('https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources');

  if (filters?.tags?.length) {
    url.searchParams.set('tags', filters.tags.join(','));
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Bazaar discovery failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  let items = data.items || [];

  if (filters?.maxPrice) {
    const maxCents = parseFloat(filters.maxPrice);
    items = items.filter((item: any) =>
      item.accepts?.some((a: any) => parseFloat(a.amount || a.price || '0') <= maxCents)
    );
  }

  if (filters?.network) {
    items = items.filter((item: any) =>
      item.accepts?.some((a: any) => a.network === filters.network)
    );
  }

  return items;
}
