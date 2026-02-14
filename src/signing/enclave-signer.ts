/**
 * EnclaveSigner - Production-Grade Signing via Treza Nitro Enclaves
 *
 * Routes all signing operations through a Treza-managed AWS Nitro Enclave,
 * ensuring that private keys never leave the hardware-isolated TEE.
 *
 * Key properties:
 * - Private keys are generated and stored inside the enclave
 * - Signing requests are sent to the enclave via the Treza Platform API
 * - Attestation is verified before signing (optional but recommended)
 * - Implements ethers.js Signer so it works everywhere ethers expects one
 *
 * @example
 * ```typescript
 * import { TrezaClient } from '@treza/sdk';
 * import { EnclaveSigner } from '@treza/sdk/signing';
 *
 * const platformClient = new TrezaClient({
 *   baseUrl: 'https://app.trezalabs.com',
 * });
 *
 * const signer = new EnclaveSigner(platformClient, {
 *   enclaveId: 'enc_abc123',
 *   verifyAttestation: true,
 * });
 *
 * const client = new TrezaKYCClient({
 *   apiUrl: 'https://api.trezalabs.com/api',
 *   blockchain: {
 *     rpcUrl: 'https://rpc.sepolia.org',
 *     contractAddress: '0x...',
 *     signerProvider: signer,
 *   },
 * });
 * ```
 */

import { ethers } from 'ethers';
import { SignerProvider, EnclaveSignerConfig, EnclaveSignResponse, EnclaveSignMessageResponse } from './types';
import { TrezaClient } from '../client';

/**
 * Custom ethers.js Signer that delegates all signing to a Treza Enclave.
 * Private keys never leave the enclave boundary.
 */
class EnclaveEthersSigner extends ethers.AbstractSigner {
  private readonly platformClient: TrezaClient;
  private readonly config: EnclaveSignerConfig;
  private cachedAddress: string | null = null;

  constructor(
    platformClient: TrezaClient,
    config: EnclaveSignerConfig,
    provider?: ethers.Provider | null,
  ) {
    super(provider);
    this.platformClient = platformClient;
    this.config = config;
  }

  async getAddress(): Promise<string> {
    if (this.cachedAddress) {
      return this.cachedAddress;
    }

    // Fetch the signing address from the enclave
    const enclave = await this.platformClient.getEnclave(this.config.enclaveId);

    // The signing address is stored in the enclave's provider config
    const address = enclave.providerConfig?.signingAddress;
    if (!address) {
      throw new Error(
        `Enclave ${this.config.enclaveId} does not have a signing address configured. ` +
        'Ensure the enclave was created with the blockchain signing provider.'
      );
    }

    this.cachedAddress = address;
    return address;
  }

  connect(provider: ethers.Provider): EnclaveEthersSigner {
    return new EnclaveEthersSigner(this.platformClient, this.config, provider);
  }

  async signTransaction(tx: ethers.TransactionLike): Promise<string> {
    // Optionally verify attestation before signing
    if (this.config.verifyAttestation) {
      await this.verifyEnclaveIntegrity();
    }

    // Serialize the unsigned transaction for the enclave
    const unsignedTx = ethers.Transaction.from(tx).unsignedSerialized;

    // Send to enclave for signing via platform API
    const response = await this.requestEnclaveSigning<EnclaveSignResponse>(
      '/sign/transaction',
      { unsignedTransaction: unsignedTx },
    );

    return response.signedTransaction;
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    // Optionally verify attestation before signing
    if (this.config.verifyAttestation) {
      await this.verifyEnclaveIntegrity();
    }

    // Convert message to hex if it's bytes
    const messageHex = typeof message === 'string'
      ? ethers.hexlify(ethers.toUtf8Bytes(message))
      : ethers.hexlify(message);

    const response = await this.requestEnclaveSigning<EnclaveSignMessageResponse>(
      '/sign/message',
      { message: messageHex },
    );

    return response.signature;
  }

  async signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>,
  ): Promise<string> {
    // Optionally verify attestation before signing
    if (this.config.verifyAttestation) {
      await this.verifyEnclaveIntegrity();
    }

    const response = await this.requestEnclaveSigning<EnclaveSignMessageResponse>(
      '/sign/typed-data',
      { domain, types, value },
    );

    return response.signature;
  }

  /**
   * Verify enclave attestation before performing a signing operation.
   * Throws if the enclave is not verified or has a low trust level.
   */
  private async verifyEnclaveIntegrity(): Promise<void> {
    const verification = await this.platformClient.verifyAttestation(
      this.config.enclaveId,
      this.config.attestationNonce
        ? { nonce: this.config.attestationNonce }
        : undefined,
    );

    if (!verification.isValid) {
      throw new Error(
        `Enclave ${this.config.enclaveId} failed attestation verification. ` +
        'Signing request rejected for security reasons. ' +
        `Details: ${JSON.stringify(verification.verificationDetails)}`
      );
    }
  }

  /**
   * Send a signing request to the enclave via the platform API.
   */
  private async requestEnclaveSigning<T>(
    signingPath: string,
    payload: Record<string, any>,
  ): Promise<T> {
    // The platform client uses its internal HTTP client. We access the
    // enclave signing endpoint through the platform's REST API.
    // This endpoint forwards the request to the enclave's signing service.
    const enclaveId = this.config.enclaveId;

    try {
      // Use the platform client's internal mechanism to call the signing endpoint.
      // The signing API is: POST /api/enclaves/{enclaveId}/sign/{operation}
      const response = await (this.platformClient as any).client.post(
        `/api/enclaves/${enclaveId}${signingPath}`,
        payload,
      );
      return response.data as T;
    } catch (error: any) {
      const message = error.response?.data?.error || error.message;
      throw new Error(
        `Enclave signing request failed: ${message}. ` +
        `Enclave: ${enclaveId}, Operation: ${signingPath}`
      );
    }
  }
}

/**
 * EnclaveSigner implements SignerProvider by delegating to a Treza Nitro Enclave.
 *
 * This is the recommended signer for production workloads. Private keys are
 * generated and managed entirely within the enclave's hardware-isolated
 * environment and never leave the TEE boundary.
 */
export class EnclaveSigner implements SignerProvider {
  readonly type = 'enclave';

  private readonly platformClient: TrezaClient;
  private readonly config: EnclaveSignerConfig;

  /**
   * Create an EnclaveSigner.
   *
   * @param platformClient - An authenticated TrezaClient instance
   * @param config - Enclave signing configuration
   */
  constructor(platformClient: TrezaClient, config: EnclaveSignerConfig) {
    if (!config.enclaveId) {
      throw new Error('EnclaveSigner requires an enclaveId');
    }

    this.platformClient = platformClient;
    this.config = {
      verifyAttestation: true, // Verify by default for security
      ...config,
    };
  }

  /**
   * Returns an ethers.js Signer that routes signing through the enclave.
   */
  async getSigner(provider?: ethers.Provider): Promise<ethers.Signer> {
    return new EnclaveEthersSigner(
      this.platformClient,
      this.config,
      provider ?? null,
    );
  }

  /**
   * Returns the signing address managed by the enclave.
   */
  async getAddress(): Promise<string> {
    const signer = new EnclaveEthersSigner(
      this.platformClient,
      this.config,
    );
    return signer.getAddress();
  }
}
