/**
 * x402 Payment Integration Types
 *
 * Types for using Treza Enclaves as x402 payment wallets.
 * The EnclaveSigner signs x402 payment headers inside the TEE,
 * so private keys never leave the hardware boundary.
 */

export interface EnclaveX402Config {
  /** The Treza enclave ID that holds the signing key */
  enclaveId: string;

  /** Treza Platform API base URL */
  baseUrl?: string;

  /** Optional: verify enclave attestation before each payment signing */
  verifyAttestation?: boolean;

  /** Optional: nonce for attestation replay protection */
  attestationNonce?: string;

  /**
   * x402 network identifier (e.g. 'eip155:84532' for Base Sepolia,
   * 'eip155:8453' for Base mainnet)
   */
  network?: string;
}

export interface X402PaymentReceipt {
  txHash?: string;
  network: string;
  amount: string;
  settled: boolean;
}
