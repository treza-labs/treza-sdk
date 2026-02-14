/**
 * Treza Signer Abstraction Layer
 *
 * Defines the interface for pluggable signing strategies.
 * Instead of storing private keys in environment variables, applications
 * should use a SignerProvider to abstract key management:
 *
 * - LocalSigner: For local development and demos only
 * - EnclaveSigner: Production-grade signing via Treza Nitro Enclaves (recommended)
 * - BrowserWalletSigner: Client-side signing via MetaMask or other browser wallets
 */

import { ethers } from 'ethers';

/**
 * Configuration for the EnclaveSigner
 */
export interface EnclaveSignerConfig {
  /** The Treza enclave ID that holds the signing key */
  enclaveId: string;
  /** Optional: verify enclave attestation before each signing request */
  verifyAttestation?: boolean;
  /** Optional: nonce for attestation replay protection */
  attestationNonce?: string;
}

/**
 * Response from an enclave signing request
 */
export interface EnclaveSignResponse {
  /** The signed transaction as a hex string */
  signedTransaction: string;
  /** The enclave attestation at time of signing (if requested) */
  attestation?: {
    isValid: boolean;
    trustLevel: string;
    timestamp: string;
  };
}

/**
 * Response from an enclave message signing request
 */
export interface EnclaveSignMessageResponse {
  /** The signature as a hex string */
  signature: string;
  /** The enclave attestation at time of signing (if requested) */
  attestation?: {
    isValid: boolean;
    trustLevel: string;
    timestamp: string;
  };
}

/**
 * Interface for pluggable signing strategies.
 *
 * Implementations decouple transaction signing from key storage,
 * allowing the same SDK code to work with local keys (dev),
 * enclave-managed keys (production), or browser wallets (client-side).
 */
export interface SignerProvider {
  /**
   * Returns an ethers.js Signer instance connected to the given provider.
   * This is the primary method used by TrezaKYCClient for blockchain operations.
   *
   * @param provider - Optional ethers Provider to connect the signer to
   * @returns A connected ethers.Signer
   */
  getSigner(provider?: ethers.Provider): Promise<ethers.Signer>;

  /**
   * Returns the address associated with this signer.
   * Must not require network access for local signers.
   *
   * @returns The signer's Ethereum address
   */
  getAddress(): Promise<string>;

  /**
   * Returns a human-readable name for this signer type.
   * Useful for logging and debugging.
   */
  readonly type: string;
}
