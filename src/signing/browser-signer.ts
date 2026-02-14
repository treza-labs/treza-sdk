/**
 * BrowserWalletSigner - Client-Side Signing via Browser Wallets
 *
 * Wraps MetaMask or any injected Web3 wallet (window.ethereum) into a
 * SignerProvider. Suitable for client-side dApps where the user signs
 * transactions directly from their browser wallet.
 *
 * This signer handles:
 * - Wallet connection prompts
 * - Network switching
 * - Account change detection
 *
 * @example
 * ```typescript
 * import { BrowserWalletSigner } from '@treza/sdk/signing';
 *
 * const signer = new BrowserWalletSigner();
 *
 * const client = new TrezaKYCClient({
 *   apiUrl: 'https://api.trezalabs.com/api',
 *   blockchain: {
 *     rpcUrl: 'https://rpc.sepolia.org',
 *     contractAddress: '0x...',
 *     signerProvider: signer,
 *   },
 * });
 *
 * // User will be prompted to connect their wallet on first signing operation
 * const txHash = await client.submitProofOnChain({ ... });
 * ```
 */

import { ethers } from 'ethers';
import { SignerProvider } from './types';

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (event: string) => void;
    };
  }
}

export class BrowserWalletSigner implements SignerProvider {
  readonly type = 'browser-wallet';

  private browserProvider: ethers.BrowserProvider | null = null;
  private cachedSigner: ethers.JsonRpcSigner | null = null;

  /**
   * Returns an ethers.js Signer from the connected browser wallet.
   * Will prompt the user to connect their wallet if not already connected.
   *
   * Note: The `provider` parameter is ignored for browser wallets since
   * the signer is always tied to the browser's injected provider.
   */
  async getSigner(_provider?: ethers.Provider): Promise<ethers.Signer> {
    await this.ensureConnected();
    return this.cachedSigner!;
  }

  /**
   * Returns the connected wallet address.
   * Will prompt connection if not already connected.
   */
  async getAddress(): Promise<string> {
    await this.ensureConnected();
    return this.cachedSigner!.getAddress();
  }

  /**
   * Ensure the browser wallet is connected, prompting the user if needed.
   */
  private async ensureConnected(): Promise<void> {
    if (this.cachedSigner) return;

    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error(
        'BrowserWalletSigner requires a Web3 wallet (e.g., MetaMask). ' +
        'No injected provider found at window.ethereum. ' +
        'If running server-side, use EnclaveSigner or LocalSigner instead.'
      );
    }

    // Request account access - this prompts the wallet connection dialog
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    this.browserProvider = new ethers.BrowserProvider(window.ethereum);
    this.cachedSigner = await this.browserProvider.getSigner();
  }

  /**
   * Disconnect and clear cached state.
   * The next getSigner() call will prompt the user again.
   */
  disconnect(): void {
    this.browserProvider = null;
    this.cachedSigner = null;
  }

  /**
   * Get the underlying BrowserProvider (useful for reading chain state).
   * Returns null if not yet connected.
   */
  getBrowserProvider(): ethers.BrowserProvider | null {
    return this.browserProvider;
  }
}
