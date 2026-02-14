/**
 * LocalSigner - Development/Demo Only
 *
 * Wraps a raw private key string into a SignerProvider.
 * This is the simplest signer and is intended ONLY for:
 * - Local development
 * - Demos and tutorials
 * - Automated testing
 *
 * WARNING: Do NOT use LocalSigner in production. Private keys stored in
 * environment variables or configuration files are vulnerable to leaks.
 * Use EnclaveSigner for production workloads.
 *
 * @example
 * ```typescript
 * import { LocalSigner } from '@treza/sdk/signing';
 *
 * // Development only - uses a private key from environment
 * const signer = new LocalSigner(process.env.PRIVATE_KEY!);
 *
 * const client = new TrezaKYCClient({
 *   apiUrl: 'http://localhost:3000/api',
 *   blockchain: {
 *     rpcUrl: 'http://localhost:8545',
 *     contractAddress: '0x...',
 *     signerProvider: signer,
 *   },
 * });
 * ```
 */

import { ethers } from 'ethers';
import { SignerProvider } from './types';

export class LocalSigner implements SignerProvider {
  readonly type = 'local';

  private readonly privateKey: string;
  private wallet: ethers.Wallet;
  private hasWarned = false;

  /**
   * Create a LocalSigner from a raw private key.
   *
   * @param privateKey - Hex-encoded private key (with or without 0x prefix)
   */
  constructor(privateKey: string) {
    if (!privateKey) {
      throw new Error('LocalSigner requires a private key. Did you forget to set PRIVATE_KEY in your .env?');
    }

    this.privateKey = privateKey;
    this.wallet = new ethers.Wallet(privateKey);
  }

  /**
   * Returns an ethers.Wallet connected to the given provider.
   */
  async getSigner(provider?: ethers.Provider): Promise<ethers.Signer> {
    this.emitDevWarning();

    if (provider) {
      return this.wallet.connect(provider);
    }

    return this.wallet;
  }

  /**
   * Returns the wallet address derived from the private key.
   */
  async getAddress(): Promise<string> {
    return this.wallet.address;
  }

  /**
   * Emit a one-time warning that this signer should not be used in production.
   */
  private emitDevWarning(): void {
    if (this.hasWarned) return;
    this.hasWarned = true;

    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
      console.warn(
        '[Treza SDK] WARNING: LocalSigner is being used in a production environment. ' +
        'This is insecure — private keys should never be stored in environment variables ' +
        'or configuration files in production. Use EnclaveSigner for secure key management ' +
        'via Treza Nitro Enclaves. See: https://docs.trezalabs.com/sdk/signing/enclave-signer'
      );
    }
  }
}
