/**
 * Treza Signing Module
 *
 * Pluggable signing strategies for the Treza SDK.
 * Choose the signer that matches your environment:
 *
 * - EnclaveSigner: Production — keys managed inside Treza Nitro Enclaves (recommended)
 * - LocalSigner:   Development — wraps a raw private key (demo/testing only)
 * - BrowserWalletSigner: Client-side — delegates to MetaMask or injected wallet
 */

// Core interface
export type { SignerProvider, EnclaveSignerConfig, EnclaveSignResponse, EnclaveSignMessageResponse } from './types';

// Signer implementations
export { EnclaveSigner } from './enclave-signer';
export { LocalSigner } from './local-signer';
export { BrowserWalletSigner } from './browser-signer';
