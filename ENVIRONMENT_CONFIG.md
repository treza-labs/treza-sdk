# TREZA SDK Environment Configuration

This guide explains how to configure the TREZA SDK using environment variables.

## Quick Setup

### Option 1: Interactive Setup (Recommended)

```bash
./setup-env.sh
```

This script will guide you through creating a `.env` file with the correct configuration.

### Option 2: Manual Setup

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env
```

### Option 3: Export Variables

```bash
export TREZA_API_URL="http://localhost:3000/api"
export SEPOLIA_RPC_URL="https://rpc.sepolia.org"
export SEPOLIA_KYC_VERIFIER_ADDRESS="0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA"
```

---

## Configuration Variables

### API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TREZA_API_URL` | ✅ Yes | - | API endpoint URL |
| `TREZA_API_KEY` | ⚠️ Optional | - | API authentication key |

**Examples:**
- Local: `http://localhost:3000/api`
- ngrok: `https://abc123.ngrok-free.app/api`
- Production: `https://api.treza.io/api`

### Blockchain Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SEPOLIA_RPC_URL` | ✅ Yes | `https://rpc.sepolia.org` | Sepolia testnet RPC |
| `SEPOLIA_KYC_VERIFIER_ADDRESS` | ✅ Yes | `0xB1D98F...` | KYCVerifier contract |
| `MAINNET_RPC_URL` | ⚠️ Optional | - | Ethereum mainnet RPC |
| `MAINNET_KYC_VERIFIER_ADDRESS` | ⚠️ Optional | - | Mainnet contract |
| `TREZA_PLATFORM_URL` | ⚠️ Optional | `https://app.trezalabs.com` | Treza Platform URL |
| `TREZA_ENCLAVE_ID` | ⚠️ Optional | - | Enclave ID for EnclaveSigner (production) |
| `PRIVATE_KEY` | ⚠️ Deprecated | - | For LocalSigner (dev only) |

**⚠️ Security Warning:**
- **NEVER** commit `.env` files to version control
- **NEVER** share your `PRIVATE_KEY`
- In production, use `EnclaveSigner` instead of `PRIVATE_KEY` — keys never leave the enclave
- `PRIVATE_KEY` should only be used with `LocalSigner` for local development

---

## Use Cases

### 1. Read-Only Operations (Most Common)

✅ Check if user is adult  
✅ Get claims from proofs  
✅ Verify requirements  

**Required:**
```bash
TREZA_API_URL=http://localhost:3000/api
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_KYC_VERIFIER_ADDRESS=0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA
```

**Example:**
```typescript
const client = new TrezaKYCClient({
  apiUrl: process.env.TREZA_API_URL,
  blockchain: {
    rpcUrl: process.env.SEPOLIA_RPC_URL,
    contractAddress: process.env.SEPOLIA_KYC_VERIFIER_ADDRESS,
  },
});

const isAdult = await client.isAdult(proofId);
```

### 2. API-Only Usage

✅ No blockchain interaction  
✅ Fastest performance  
✅ No gas fees  

**Required:**
```bash
TREZA_API_URL=https://api.treza.io/api
TREZA_API_KEY=your-api-key
```

**Example:**
```typescript
const client = new TrezaKYCClient({
  apiUrl: process.env.TREZA_API_URL,
  apiKey: process.env.TREZA_API_KEY,
});

const isAdult = await client.isAdult(proofId); // Fast API call
```

### 3. Write Operations — Production (EnclaveSigner)

✅ Submit proofs to blockchain  
✅ Verify proofs on-chain  
✅ Private keys never leave the enclave  

**Required:**
```bash
TREZA_API_URL=https://api.trezalabs.com/api
TREZA_PLATFORM_URL=https://app.trezalabs.com
TREZA_ENCLAVE_ID=enc_...your-enclave-id
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_KYC_VERIFIER_ADDRESS=0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA
```

**Example:**
```typescript
import { TrezaClient, TrezaKYCClient, EnclaveSigner } from '@treza/sdk';

const platform = new TrezaClient({
  baseUrl: process.env.TREZA_PLATFORM_URL,
});

const signer = new EnclaveSigner(platform, {
  enclaveId: process.env.TREZA_ENCLAVE_ID!,
  verifyAttestation: true,
});

const client = new TrezaKYCClient({
  apiUrl: process.env.TREZA_API_URL!,
  blockchain: {
    rpcUrl: process.env.SEPOLIA_RPC_URL!,
    contractAddress: process.env.SEPOLIA_KYC_VERIFIER_ADDRESS!,
    signerProvider: signer,
  },
});

const txHash = await client.submitProofOnChain({
  commitment: '0x...',
  proof: '0x...',
  publicInputs: ['country:US', 'isAdult:true'],
});
```

### 4. Write Operations — Local Dev (LocalSigner)

⚠️ Development and testing only  
⚠️ Do NOT use in production  

**Required:**
```bash
TREZA_API_URL=http://localhost:3000/api
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_KYC_VERIFIER_ADDRESS=0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA
PRIVATE_KEY=0x...your-private-key
```

**Example:**
```typescript
import { TrezaKYCClient, LocalSigner } from '@treza/sdk';

const client = new TrezaKYCClient({
  apiUrl: process.env.TREZA_API_URL!,
  blockchain: {
    rpcUrl: process.env.SEPOLIA_RPC_URL!,
    contractAddress: process.env.SEPOLIA_KYC_VERIFIER_ADDRESS!,
    signerProvider: new LocalSigner(process.env.PRIVATE_KEY!),
  },
});

const txHash = await client.submitProofOnChain({
  commitment: '0x...',
  proof: '0x...',
  publicInputs: ['country:US', 'isAdult:true'],
});
```

### 5. Local Development with ngrok

For testing on physical iOS devices:

```bash
TREZA_API_URL=https://abc123.ngrok-free.app/api
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_KYC_VERIFIER_ADDRESS=0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA
```

**Steps:**
1. Start your Next.js server: `npm run dev`
2. Start ngrok: `ngrok http 3000`
3. Update `TREZA_API_URL` with ngrok URL
4. Restart your Node.js scripts

---

## Network Configuration

### Sepolia Testnet (Default)

```bash
NETWORK=sepolia
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_CHAIN_ID=11155111
SEPOLIA_KYC_VERIFIER_ADDRESS=0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA
```

**Free RPC Endpoints:**
- Public: `https://rpc.sepolia.org`
- Alchemy: `https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY`
- Infura: `https://sepolia.infura.io/v3/YOUR-KEY`

### Ethereum Mainnet

```bash
NETWORK=mainnet
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY
MAINNET_CHAIN_ID=1
MAINNET_KYC_VERIFIER_ADDRESS=0x... # Not deployed yet
```

---

## Usage in Code

### TypeScript/JavaScript

```typescript
import { TrezaClient, TrezaKYCClient, EnclaveSigner } from '@treza/sdk';

// Production: EnclaveSigner (recommended)
const platform = new TrezaClient({ baseUrl: process.env.TREZA_PLATFORM_URL });
const signer = new EnclaveSigner(platform, {
  enclaveId: process.env.TREZA_ENCLAVE_ID!,
});

const client = new TrezaKYCClient({
  apiUrl: process.env.TREZA_API_URL!,
  apiKey: process.env.TREZA_API_KEY,
  blockchain: {
    rpcUrl: process.env.SEPOLIA_RPC_URL!,
    contractAddress: process.env.SEPOLIA_KYC_VERIFIER_ADDRESS!,
    signerProvider: signer,
  },
});
```

### React

```tsx
import { TrezaKYCClient } from '@treza/sdk/kyc';
import { useEffect, useState } from 'react';

function useKYCClient() {
  const [client] = useState(() => new TrezaKYCClient({
    apiUrl: process.env.REACT_APP_TREZA_API_URL!,
    blockchain: {
      rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL!,
      contractAddress: process.env.REACT_APP_SEPOLIA_KYC_VERIFIER_ADDRESS!,
    },
  }));
  
  return client;
}

function MyComponent() {
  const client = useKYCClient();
  
  const checkAdult = async (proofId: string) => {
    const isAdult = await client.isAdult(proofId);
    console.log('Is Adult:', isAdult);
  };
  
  return <button onClick={() => checkAdult('abc123')}>Check Age</button>;
}
```

### Next.js

```typescript
// lib/kyc-client.ts
import { TrezaClient, TrezaKYCClient, EnclaveSigner } from '@treza/sdk';

export function getKYCClient() {
  const platform = new TrezaClient({ baseUrl: process.env.TREZA_PLATFORM_URL });
  const signer = new EnclaveSigner(platform, {
    enclaveId: process.env.TREZA_ENCLAVE_ID!,
  });

  return new TrezaKYCClient({
    apiUrl: process.env.TREZA_API_URL!,
    blockchain: {
      rpcUrl: process.env.SEPOLIA_RPC_URL!,
      contractAddress: process.env.SEPOLIA_KYC_VERIFIER_ADDRESS!,
      signerProvider: signer,
    },
  });
}

// app/api/check-adult/route.ts
import { getKYCClient } from '@/lib/kyc-client';

export async function GET(request: Request) {
  const client = getKYCClient();
  const { searchParams } = new URL(request.url);
  const proofId = searchParams.get('proofId');
  
  const isAdult = await client.isAdult(proofId!);
  
  return Response.json({ isAdult });
}
```

---

## Troubleshooting

### "Invalid API URL" Error

**Problem:** `TREZA_API_URL` not set or incorrect

**Solution:**
```bash
export TREZA_API_URL="http://localhost:3000/api"
```

### "Blockchain not configured" Error

**Problem:** Missing blockchain configuration

**Solution:**
```bash
export SEPOLIA_RPC_URL="https://rpc.sepolia.org"
export SEPOLIA_KYC_VERIFIER_ADDRESS="0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA"
```

### "No signer available" Error

**Problem:** Trying to do write operations without a signer configured

**Solution:**
- For read-only: Remove write operation calls (no signer needed)
- For production: Configure `EnclaveSigner` with `TREZA_ENCLAVE_ID`
- For local dev: Configure `LocalSigner` with `PRIVATE_KEY`
- See [Key Management & Signing](./README.md#key-management--signing) for setup

### ngrok URL Changes

**Problem:** ngrok URL changes every restart

**Solution:**
1. Get new ngrok URL: `ngrok http 3000`
2. Update `.env`: `TREZA_API_URL=https://new-url.ngrok-free.app/api`
3. Restart your scripts

---

## Best Practices

### ✅ Do

- Use `.env` files for local development
- Use environment variables in production (Vercel, Netlify, etc.)
- Add `.env` to `.gitignore`
- Use separate keys for dev/staging/prod
- Validate env vars at startup

### ❌ Don't

- Commit `.env` files to git
- Share private keys
- Use production keys in development
- Hard-code API URLs
- Expose private keys in client-side code

---

## Environment Variables by Framework

### Next.js

Create `.env.local`:
```bash
TREZA_API_URL=http://localhost:3000/api
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_KYC_VERIFIER_ADDRESS=0xB1D98F...
```

For client-side access, prefix with `NEXT_PUBLIC_`:
```bash
NEXT_PUBLIC_TREZA_API_URL=http://localhost:3000/api
```

### Vite/React

Create `.env`:
```bash
VITE_TREZA_API_URL=http://localhost:3000/api
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_TREZA_API_URL;
```

### Node.js

Create `.env` and use `dotenv`:
```bash
npm install dotenv
```

```typescript
import 'dotenv/config';

const apiUrl = process.env.TREZA_API_URL;
```

---

## Support

- 📖 [Quick Reference](./QUICK_REFERENCE.md)
- 📚 [Examples](./examples/kyc/)
- 💬 [GitHub Issues](https://github.com/treza-labs/treza-sdk/issues)

