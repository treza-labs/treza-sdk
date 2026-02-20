/**
 * Viem-compatible Account backed by a Treza Nitro Enclave.
 *
 * x402 uses viem signers for payment header signing. This adapter
 * bridges the EnclaveSigner (ethers.js) to viem's Account interface,
 * so an enclave can act as an x402 payment wallet.
 *
 * All signing happens inside the enclave — private keys never leave
 * the hardware-isolated TEE boundary.
 *
 * @example
 * ```typescript
 * import { TrezaClient } from '@treza/sdk';
 * import { createEnclaveAccount } from '@treza/sdk/x402';
 *
 * const client = new TrezaClient({ baseUrl: 'https://app.trezalabs.com' });
 * const account = await createEnclaveAccount(client, {
 *   enclaveId: 'enc_abc123',
 *   verifyAttestation: true,
 * });
 *
 * // Use with x402 client
 * import { x402Client } from '@x402/core/client';
 * import { registerExactEvmScheme } from '@x402/evm/exact/client';
 *
 * const x402 = new x402Client();
 * registerExactEvmScheme(x402, { signer: account });
 * ```
 */

import { ethers } from 'ethers';
import { TrezaClient } from '../client';
import { EnclaveSignerConfig } from '../signing/types';

/**
 * Minimal viem Account interface required by x402.
 * We define this locally to avoid a hard dependency on viem.
 */
export interface ViemAccount {
  address: `0x${string}`;
  signMessage: (params: { message: string | Uint8Array }) => Promise<`0x${string}`>;
  signTransaction: (transaction: Record<string, unknown>) => Promise<`0x${string}`>;
  signTypedData: (typedData: {
    domain?: Record<string, unknown>;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => Promise<`0x${string}`>;
  type: 'local';
  source: 'custom';
}

/**
 * Creates a viem-compatible Account that delegates all signing to a Treza Enclave.
 *
 * This is the bridge between Treza's EnclaveSigner and the x402 payment protocol.
 * The returned account can be passed directly to `registerExactEvmScheme()`.
 *
 * @param platformClient - An authenticated TrezaClient instance
 * @param config - Enclave signer configuration
 * @returns A viem-compatible Account backed by the enclave
 */
export async function createEnclaveAccount(
  platformClient: TrezaClient,
  config: EnclaveSignerConfig,
): Promise<ViemAccount> {
  const enclaveId = config.enclaveId;

  // Fetch the signing address from the enclave
  const enclave = await platformClient.getEnclave(enclaveId);
  const signingAddress = enclave.providerConfig?.signingAddress;

  if (!signingAddress) {
    throw new Error(
      `Enclave ${enclaveId} does not have a signing address. ` +
      'Ensure it was created with the blockchain signing provider.'
    );
  }

  const address = signingAddress as `0x${string}`;

  async function verifyIfNeeded(): Promise<void> {
    if (!config.verifyAttestation) return;

    const verification = await platformClient.verifyAttestation(
      enclaveId,
      config.attestationNonce ? { nonce: config.attestationNonce } : undefined,
    );

    if (!verification.isValid) {
      throw new Error(
        `Enclave ${enclaveId} failed attestation — signing rejected. ` +
        `Details: ${JSON.stringify(verification.verificationDetails)}`
      );
    }
  }

  async function requestSigning<T>(path: string, payload: Record<string, unknown>): Promise<T> {
    try {
      const response = await (platformClient as any).client.post(
        `/api/enclaves/${enclaveId}${path}`,
        payload,
      );
      return response.data as T;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      throw new Error(`Enclave signing failed: ${message} (${enclaveId}, ${path})`);
    }
  }

  return {
    address,
    type: 'local' as const,
    source: 'custom' as const,

    async signMessage({ message }: { message: string | Uint8Array }): Promise<`0x${string}`> {
      await verifyIfNeeded();

      const messageHex = typeof message === 'string'
        ? ethers.hexlify(ethers.toUtf8Bytes(message))
        : ethers.hexlify(message);

      const result = await requestSigning<{ signature: string }>(
        '/sign/message',
        { message: messageHex },
      );
      return result.signature as `0x${string}`;
    },

    async signTransaction(transaction: Record<string, unknown>): Promise<`0x${string}`> {
      await verifyIfNeeded();

      const tx = ethers.Transaction.from(transaction as ethers.TransactionLike);
      const unsignedTx = tx.unsignedSerialized;

      const result = await requestSigning<{ signedTransaction: string }>(
        '/sign/transaction',
        { unsignedTransaction: unsignedTx },
      );
      return result.signedTransaction as `0x${string}`;
    },

    async signTypedData(typedData: {
      domain?: Record<string, unknown>;
      types: Record<string, Array<{ name: string; type: string }>>;
      primaryType: string;
      message: Record<string, unknown>;
    }): Promise<`0x${string}`> {
      await verifyIfNeeded();

      const result = await requestSigning<{ signature: string }>(
        '/sign/typed-data',
        {
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          value: typedData.message,
        },
      );
      return result.signature as `0x${string}`;
    },
  };
}
