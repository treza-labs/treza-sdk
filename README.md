# TREZA SDK

[![npm version](https://badge.fury.io/js/%40treza%2Fsdk.svg)](https://badge.fury.io/js/%40treza%2Fsdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

TypeScript SDK for interacting with TREZA's privacy-preserving KYC system.

## Features

- **Zero-Knowledge KYC** - Verify identity without exposing personal data
- **Blockchain Integration** - Direct integration with KYCVerifier smart contracts  
- **Convenience Methods** - Simple APIs for common KYC checks (age, country, document validity)
- **Dual Verification** - API-based (fast) OR blockchain-based (trustless)
- **TypeScript Support** - Full type safety and IntelliSense
- **Easy Integration** - Works with any TypeScript/JavaScript project
- **No Authentication Required** - Open API protected by rate limiting
- **Multi-Chain Support** - Ethereum, Sepolia, and compatible networks
- **Secure by Design** - No personal data storage, cryptographic proofs only

## Quick Start

### Installation

```bash
npm install @treza/sdk ethers
```

### Environment Setup

Create a `.env` file:

```bash
# API Configuration
TREZA_API_URL=https://api.trezalabs.com/api
# For local development: http://localhost:3000/api

# Blockchain Configuration  
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_KYC_VERIFIER_ADDRESS=0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA

# For write operations (proof submission)
PRIVATE_KEY=0x...your-private-key
```

See [`.env.example`](./.env.example) for all available configuration options.

### Basic Usage

```typescript
import { TrezaKYCClient } from '@treza/sdk/kyc';

// Initialize client
const client = new TrezaKYCClient({
  apiUrl: process.env.TREZA_API_URL,
  blockchain: {
    rpcUrl: process.env.SEPOLIA_RPC_URL,
    contractAddress: process.env.SEPOLIA_KYC_VERIFIER_ADDRESS,
  },
});

// Check if user is an adult
const isAdult = await client.isAdult(proofId);
console.log('User is 18+:', isAdult);

// Get all claims
const claims = await client.getClaims(proofId);
console.log(claims);
// {
//   country: 'US',
//   isAdult: true,
//   documentValid: true,
//   documentType: 'passport'
// }

// Verify requirements
const result = await client.meetsRequirements(proofId, {
  mustBeAdult: true,
  allowedCountries: ['US', 'CA', 'GB'],
  mustHaveValidDocument: true,
});

if (result.meets) {
  console.log('✅ User meets all requirements!');
} else {
  console.log('❌ Requirements not met:', result.reason);
}
```

See [Quick Reference](./QUICK_REFERENCE.md) for more examples and complete API documentation.

## Core Features

### Convenience Methods

The SDK provides simple methods for common KYC checks:

```typescript
// Check specific claims
const isAdult = await client.isAdult(proofId);
const country = await client.getCountry(proofId);
const hasValidDoc = await client.hasValidDocument(proofId);
const docType = await client.getDocumentType(proofId);

// Get all claims at once
const claims = await client.getClaims(proofId);

// Verify multiple requirements
const result = await client.meetsRequirements(proofId, {
  mustBeAdult: true,
  allowedCountries: ['US', 'CA', 'GB'],
  mustHaveValidDocument: true,
  allowedDocumentTypes: ['passport', 'drivers_license']
});
```

### Dual Verification

Choose between API-based (fast) or blockchain-based (trustless) verification:

```typescript
// Via API (fast)
const isAdult = await client.isAdult(proofId);

// Via blockchain (trustless)  
const isAdultOnChain = await client.isAdult(proofId, true);
```

### Blockchain Operations

Direct interaction with KYCVerifier smart contracts:

```typescript
// Check if user has valid KYC on-chain
const hasKYC = await client.hasValidKYC(userAddress);

// Get proof details from blockchain
const proof = await client.getProofFromChain(proofId);

// Get user's latest proof ID
const proofId = await client.getUserProofId(userAddress);
```

## Architecture

```
┌─────────────────────────────────────┐
│        Your Application             │
│  (Node.js / Browser / React)        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         TREZA SDK                   │
│  • TrezaKYCClient                   │
│  • Convenience methods              │
│  • Type-safe API                    │
└─────────────┬───────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
┌───────────┐  ┌────────────────┐
│  API      │  │   Blockchain   │
│  (Fast)   │  │  (Trustless)   │
│           │  │                │
│ • Verify  │  │ • KYCVerifier  │
│   Claims  │  │   Contract     │
│ • Get     │  │ • On-chain     │
│   Proofs  │  │   Proofs       │
└───────────┘  └────────────────┘
```

## API Reference

### TrezaKYCClient

#### Constructor

```typescript
new TrezaKYCClient(config: TrezaKYCConfig)
```

**Config Options:**
- `apiUrl`: API endpoint URL (required)
- `apiKey`: API key for authenticated requests (optional)
- `blockchain`: Blockchain configuration (optional)
  - `rpcUrl`: Ethereum RPC URL
  - `contractAddress`: KYCVerifier contract address
  - `privateKey`: Private key for write operations (optional)

#### Methods

**Convenience Methods:**
- `isAdult(proofId, useBlockchain?)` - Check if user is 18+
- `getCountry(proofId, useBlockchain?)` - Get user's nationality
- `hasValidDocument(proofId, useBlockchain?)` - Check document validity
- `getDocumentType(proofId, useBlockchain?)` - Get document type
- `getClaims(proofId, useBlockchain?)` - Get all public claims
- `meetsRequirements(proofId, requirements, useBlockchain?)` - Verify requirements

**Core Methods:**
- `submitProof(params)` - Submit proof to API
- `verifyProof(proofId)` - Verify proof via API
- `getProof(proofId)` - Get proof details

**Blockchain Methods:**
- `hasValidKYC(userAddress)` - Check if user has valid KYC on-chain
- `getProofFromChain(proofId)` - Get proof from blockchain
- `getUserProofId(userAddress)` - Get user's latest proof ID
- `submitProofOnChain(params)` - Submit proof to blockchain
- `verifyProofOnChain(params)` - Verify proof on blockchain

## Examples

### Age-Gated Content

```typescript
async function checkAccess(proofId: string) {
  const client = new TrezaKYCClient({ apiUrl: process.env.TREZA_API_URL });
  const isAdult = await client.isAdult(proofId);
  
  if (isAdult) {
    return { access: 'granted' };
  } else {
    return { access: 'denied', reason: 'Must be 18+' };
  }
}
```

### Country Restrictions

```typescript
async function checkEligibility(proofId: string) {
  const client = new TrezaKYCClient({ apiUrl: process.env.TREZA_API_URL });
  const country = await client.getCountry(proofId);
  const allowedCountries = ['US', 'CA', 'GB'];
  
  if (allowedCountries.includes(country)) {
    return { eligible: true };
  } else {
    return { eligible: false, reason: `Not available in ${country}` };
  }
}
```

### KYC-Gated Platform

```typescript
async function verifyKYC(proofId: string) {
  const client = new TrezaKYCClient({ apiUrl: process.env.TREZA_API_URL });
  
  const result = await client.meetsRequirements(proofId, {
    mustBeAdult: true,
    mustHaveValidDocument: true,
    allowedCountries: ['US', 'CA', 'MX', 'GB'],
  });
  
  return result.meets;
}
```

## Documentation

- **[Quick Reference](./QUICK_REFERENCE.md)** - Common use cases and examples
- **[Environment Configuration](./ENVIRONMENT_CONFIG.md)** - Complete configuration guide
- **[Setup Guide](./setup-env.sh)** - Interactive setup script
- **[Examples](./examples/kyc/)** - Working code examples

## Development

### Setup

```bash
git clone https://github.com/treza-labs/treza-sdk.git
cd treza-sdk
npm install
```

### Build

```bash
npm run build
```

### Run Examples

```bash
# Setup environment
./setup-env.sh

# Check adult status
npx tsx examples/kyc/check-adult.ts <proofId>

# Submit proof
npx tsx examples/kyc/submit-proof.ts

# Verify proof
npx tsx examples/kyc/verify-proof.ts <proofId>
```

## Support

- **Documentation**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **GitHub Issues**: [Report bugs](https://github.com/treza-labs/treza-sdk/issues)
- **Website**: [trezalabs.com](https://trezalabs.com)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- **GitHub**: [github.com/treza-labs/treza-sdk](https://github.com/treza-labs/treza-sdk)
- **npm**: [@treza/sdk](https://www.npmjs.com/package/@treza/sdk)
- **Smart Contracts**: [treza-contracts](https://github.com/treza-labs/treza-contracts)
- **Mobile App**: [treza-mobile](https://github.com/treza-labs/treza-mobile)
- **Backend API**: [treza-app](https://github.com/treza-labs/treza-app)

---

