# Treza KYC SDK Examples

Examples for using the Treza KYC SDK to submit and verify zero-knowledge proofs.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:

**Option A: Using .env file (Recommended)**
```bash
# Copy example file
cp ../../.env.example .env

# Edit .env with your values
nano .env
```

**Option B: Export variables**
```bash
export TREZA_API_URL="http://localhost:3000/api"
export TREZA_API_KEY="your-api-key"
export SEPOLIA_RPC_URL="https://rpc.sepolia.org"
export SEPOLIA_KYC_VERIFIER_ADDRESS="0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA"
export PRIVATE_KEY="0x..."  # Only for proof submission
```

**Required Variables:**
- `TREZA_API_URL` - API endpoint (local dev or production)
- `SEPOLIA_RPC_URL` - Ethereum RPC endpoint
- `SEPOLIA_KYC_VERIFIER_ADDRESS` - KYCVerifier contract address

**Optional Variables:**
- `TREZA_API_KEY` - API authentication key
- `PRIVATE_KEY` - Private key for blockchain write operations

See [`../../.env.example`](../../.env.example) for all available options.

## Examples

### Submit Proof

Submit a ZK proof to both API and blockchain:

```bash
ts-node examples/kyc/submit-proof.ts
```

### Verify Proof

Verify a proof by ID:

```bash
ts-node examples/kyc/verify-proof.ts <proofId>
```

Check user's KYC status on blockchain:

```bash
ts-node examples/kyc/verify-proof.ts <proofId> <userAddress>
```

### Check Adult Status

Quick check if a user is an adult (18+):

```bash
npx tsx examples/kyc/check-adult.ts <proofId>
```

## Usage in Your Application

### Basic Usage

```typescript
import { TrezaKYCClient } from 'treza-sdk/kyc';

const client = new TrezaKYCClient({
  apiUrl: 'https://api.treza.io',
  apiKey: 'your-api-key',
});

// Submit proof
const result = await client.submitProof({
  userId: 'user-123',
  proof: zkProof,
});

// Verify proof
const verification = await client.verifyProof(result.proofId);
console.log('Valid:', verification.isValid);
```

### With Blockchain

```typescript
import { TrezaKYCClient } from 'treza-sdk/kyc';
import { ethers } from 'ethers';

const client = new TrezaKYCClient({
  apiUrl: 'https://api.treza.io',
  blockchain: {
    rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/YOUR-KEY',
    contractAddress: '0x...KYCVerifier',
  },
});

// Check KYC status
const hasKYC = await client.hasValidKYC('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
console.log('Has KYC:', hasKYC);

// Get proof details
const proofId = await client.getUserProofId(userAddress);
const proof = await client.getProofFromChain(proofId);
console.log('Public Claims:', proof.publicInputs);
```

### Convenience Methods (Quick Checks)

**Check if user is an adult:**
```typescript
const client = new TrezaKYCClient({ apiUrl: 'https://api.treza.io' });

// Via API (fast)
const isAdult = await client.isAdult(proofId);
console.log('Is Adult:', isAdult); // true or false

// Via blockchain (trustless)
const isAdultOnChain = await client.isAdult(proofId, true);
```

**Get all claims at once:**
```typescript
const claims = await client.getClaims(proofId);
console.log(claims);
// {
//   country: 'US',
//   isAdult: true,
//   documentValid: true,
//   documentType: 'passport'
// }
```

**Verify requirements:**
```typescript
const result = await client.meetsRequirements(proofId, {
  mustBeAdult: true,
  allowedCountries: ['US', 'CA', 'GB'],
  mustHaveValidDocument: true,
  allowedDocumentTypes: ['passport', 'drivers_license']
});

if (result.meets) {
  console.log('✅ User meets all requirements!');
  console.log('Claims:', result.claims);
} else {
  console.log('❌ Requirements not met:', result.reason);
}
```

### React Hook

```typescript
import { TrezaKYCClient } from 'treza-sdk/kyc';
import { useState, useEffect } from 'react';

function useKYCStatus(userAddress: string) {
  const [hasKYC, setHasKYC] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = new TrezaKYCClient({
      apiUrl: 'https://api.treza.io',
      blockchain: {
        rpcUrl: process.env.RPC_URL,
        contractAddress: process.env.KYC_CONTRACT,
      },
    });

    client.hasValidKYC(userAddress)
      .then(setHasKYC)
      .finally(() => setLoading(false));
  }, [userAddress]);

  return { hasKYC, loading };
}

// Usage
function MyComponent({ userAddress }) {
  const { hasKYC, loading } = useKYCStatus(userAddress);

  if (loading) return <div>Loading...</div>;
  return <div>{hasKYC ? 'KYC Verified ✅' : 'KYC Required ❌'}</div>;
}
```

## API Reference

See [TrezaKYCClient.ts](../../src/kyc/TrezaKYCClient.ts) for full API documentation.

### Key Methods

#### Core Methods
- `submitProof()` - Submit proof to API
- `verifyProof()` - Verify proof via API
- `getProof()` - Get proof details
- `submitProofOnChain()` - Submit proof to blockchain
- `verifyProofOnChain()` - Verify proof on blockchain
- `hasValidKYC()` - Check if user has valid KYC
- `getProofFromChain()` - Get proof from blockchain
- `getUserProofId()` - Get user's latest proof ID

#### Convenience Methods (New!)
- `isAdult(proofId, useBlockchain?)` - Check if user is 18+
- `getCountry(proofId, useBlockchain?)` - Get user's country
- `hasValidDocument(proofId, useBlockchain?)` - Check if document is valid
- `getDocumentType(proofId, useBlockchain?)` - Get document type
- `getClaims(proofId, useBlockchain?)` - Get all public claims
- `meetsRequirements(proofId, requirements, useBlockchain?)` - Verify requirements

## Testing

Run tests:

```bash
npm test
```

## Support

For issues or questions:
- GitHub: https://github.com/treza/treza-sdk
- Discord: https://discord.gg/treza

