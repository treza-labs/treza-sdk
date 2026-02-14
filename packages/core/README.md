# @treza/sdk

[![npm version](https://badge.fury.io/js/%40treza%2Fsdk.svg)](https://www.npmjs.com/package/@treza/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

Core SDK for the **Treza Platform** - privacy-preserving KYC verification and secure enclave management.

## Features

### KYC Verification
- **Zero-Knowledge KYC** - Verify identity claims without exposing personal data
- **Dual Verification** - API-based (fast) or blockchain-based (trustless)
- **Convenience Methods** - Simple APIs for common checks (age, country, document validity)
- **Multi-Chain Support** - Ethereum, Sepolia, and compatible networks

### Enclave Platform
- **Secure Enclave Deployment** - Deploy and manage AWS Nitro Enclaves
- **Cryptographic Attestation** - Hardware-backed proof of enclave integrity
- **Lifecycle Management** - Deploy, pause, resume, terminate enclaves
- **Task Scheduling** - Automated task execution within enclaves

## Installation

```bash
npm install @treza/sdk ethers
```

## Quick Start

### KYC Verification with Enclave Signing (Recommended)

In production, use `EnclaveSigner` so private keys never leave the Nitro Enclave:

```typescript
import { TrezaClient, TrezaKYCClient, EnclaveSigner } from '@treza/sdk';

const platform = new TrezaClient();
const signer = new EnclaveSigner(platform, {
  enclaveId: process.env.TREZA_ENCLAVE_ID!,
  verifyAttestation: true,
});

const client = new TrezaKYCClient({
  apiUrl: 'https://api.trezalabs.com/api',
  blockchain: {
    rpcUrl: 'https://rpc.sepolia.org',
    contractAddress: '0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA',
    signerProvider: signer,
  },
});

// Submit proof on-chain (signed inside the enclave)
const txHash = await client.submitProofOnChain({ commitment, proof, publicInputs });
```

### Read-Only KYC Checks (No Signing Required)

```typescript
import { TrezaKYCClient } from '@treza/sdk';

const client = new TrezaKYCClient({
  apiUrl: 'https://api.trezalabs.com/api',
  blockchain: {
    rpcUrl: 'https://rpc.sepolia.org',
    contractAddress: '0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA',
  },
});

// Check if user is an adult
const isAdult = await client.isAdult(proofId);

// Get country
const country = await client.getCountry(proofId);

// Verify multiple requirements
const result = await client.meetsRequirements(proofId, {
  mustBeAdult: true,
  allowedCountries: ['US', 'CA', 'GB'],
  mustHaveValidDocument: true,
});

if (result.meets) {
  console.log('User meets all requirements');
}
```

### Local Development (Demo Only)

For local dev and testing, use `LocalSigner`. **Do not use in production.**

```typescript
import { TrezaKYCClient, LocalSigner } from '@treza/sdk';

const client = new TrezaKYCClient({
  apiUrl: 'http://localhost:3000/api',
  blockchain: {
    rpcUrl: 'http://localhost:8545',
    contractAddress: '0x...',
    signerProvider: new LocalSigner(process.env.PRIVATE_KEY!),
  },
});
```

### Enclave Management

```typescript
import { TrezaClient } from '@treza/sdk';

const client = new TrezaClient({
  baseUrl: 'https://app.trezalabs.com'
});

// Create an enclave
const enclave = await client.createEnclave({
  name: 'My Secure Enclave',
  description: 'Privacy-preserving computation',
  region: 'us-east-1',
  walletAddress: '0x...',
  providerId: 'aws-nitro',
  providerConfig: {
    dockerImage: 'my-app:latest',
    cpuCount: '2',
    memoryMiB: '2048'
  }
});

// Get attestation
const attestation = await client.getAttestation(enclave.id);
console.log('Trust Level:', attestation.verification.trustLevel);
console.log('PCR Measurements:', attestation.attestationDocument.pcrs);

// Verify attestation
const verification = await client.verifyAttestation(enclave.id);
console.log('Is Valid:', verification.isValid);
console.log('Compliance:', verification.complianceChecks);
```

## API Reference

### TrezaKYCClient

KYC verification client.

| Method | Description |
|--------|-------------|
| `isAdult(proofId, useBlockchain?)` | Check if user is 18+ |
| `getCountry(proofId, useBlockchain?)` | Get user's nationality |
| `hasValidDocument(proofId, useBlockchain?)` | Check document validity |
| `getClaims(proofId, useBlockchain?)` | Get all public claims |
| `meetsRequirements(proofId, requirements, useBlockchain?)` | Verify multiple requirements |
| `hasValidKYC(userAddress)` | Check on-chain KYC status |

### TrezaClient

Enclave management client.

| Method | Description |
|--------|-------------|
| `getEnclaves(walletAddress)` | List all enclaves |
| `createEnclave(request)` | Create new enclave |
| `getAttestation(enclaveId)` | Get attestation document |
| `verifyAttestation(enclaveId, options?)` | Comprehensive verification |
| `pauseEnclave(enclaveId, walletAddress)` | Pause enclave |
| `resumeEnclave(enclaveId, walletAddress)` | Resume enclave |
| `terminateEnclave(enclaveId, walletAddress)` | Terminate enclave |
| `getEnclaveLogs(enclaveId, logType?, limit?)` | Get enclave logs |

## Environment Variables

```bash
# API Configuration
TREZA_API_URL=https://api.trezalabs.com/api
TREZA_PLATFORM_URL=https://app.trezalabs.com

# Blockchain (for KYC)
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_KYC_VERIFIER_ADDRESS=0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA

# Enclave signing (production - recommended)
TREZA_ENCLAVE_ID=enc_...your-enclave-id

# Local dev only (do NOT use in production):
# PRIVATE_KEY=0x...
```

## Related Packages

- **[@treza/react](https://www.npmjs.com/package/@treza/react)** - React components and hooks

## Links

- **Website**: [trezalabs.com](https://trezalabs.com)
- **Documentation**: [docs.trezalabs.com](https://docs.trezalabs.com)
- **GitHub**: [github.com/treza-labs/treza-sdk](https://github.com/treza-labs/treza-sdk)
- **Smart Contracts**: [github.com/treza-labs/treza-contracts](https://github.com/treza-labs/treza-contracts)

## License

MIT
