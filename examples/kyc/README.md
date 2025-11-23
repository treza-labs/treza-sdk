# Treza KYC SDK Examples

Examples for using the Treza KYC SDK to submit and verify zero-knowledge proofs.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export TREZA_API_KEY="your-api-key"
export RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
export PRIVATE_KEY="your-private-key"  # Only for submission
```

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

- `submitProof()` - Submit proof to API
- `verifyProof()` - Verify proof via API
- `getProof()` - Get proof details
- `submitProofOnChain()` - Submit proof to blockchain
- `verifyProofOnChain()` - Verify proof on blockchain
- `hasValidKYC()` - Check if user has valid KYC
- `getProofFromChain()` - Get proof from blockchain
- `getUserProofId()` - Get user's latest proof ID

## Testing

Run tests:

```bash
npm test
```

## Support

For issues or questions:
- GitHub: https://github.com/treza/treza-sdk
- Discord: https://discord.gg/treza

