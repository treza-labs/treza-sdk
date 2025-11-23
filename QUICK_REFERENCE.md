# Treza SDK Quick Reference

## Installation

```bash
npm install @treza/sdk
# or
yarn add @treza/sdk
```

## Setup

```typescript
import { TrezaKYCClient } from '@treza/sdk/kyc';

const client = new TrezaKYCClient({
  apiUrl: 'https://your-api.com/api',
  blockchain: {
    rpcUrl: 'https://rpc.sepolia.org',
    contractAddress: '0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA'
  }
});
```

---

## Common Use Cases

### ✅ Check if User is Adult (18+)

**Fastest way:**
```typescript
const isAdult = await client.isAdult(proofId);
console.log(isAdult); // true or false
```

**From blockchain (trustless):**
```typescript
const isAdult = await client.isAdult(proofId, true);
```

---

### 🌍 Get User's Country

```typescript
const country = await client.getCountry(proofId);
console.log(country); // "US", "CA", "GB", etc.
```

---

### 📄 Check Document Validity

```typescript
const isValid = await client.hasValidDocument(proofId);
console.log(isValid); // true or false
```

---

### 📋 Get All Claims at Once

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

---

### 🎯 Verify Requirements (Most Powerful)

```typescript
const result = await client.meetsRequirements(proofId, {
  mustBeAdult: true,
  allowedCountries: ['US', 'CA', 'GB'],
  mustHaveValidDocument: true,
  allowedDocumentTypes: ['passport', 'drivers_license']
});

if (result.meets) {
  console.log('✅ Access granted!');
  console.log('User claims:', result.claims);
} else {
  console.log('❌ Access denied:', result.reason);
}
```

---

## Real-World Examples

### Age-Gated Content

```typescript
async function checkAccess(proofId: string) {
  const isAdult = await client.isAdult(proofId);
  
  if (isAdult) {
    return { access: 'granted' };
  } else {
    return { access: 'denied', reason: 'Must be 18+' };
  }
}
```

### Country-Restricted Service

```typescript
async function checkEligibility(proofId: string) {
  const country = await client.getCountry(proofId);
  const allowedCountries = ['US', 'CA', 'GB'];
  
  if (allowedCountries.includes(country)) {
    return { eligible: true };
  } else {
    return { 
      eligible: false, 
      reason: `Service not available in ${country}` 
    };
  }
}
```

### KYC-Gated Platform

```typescript
async function verifyKYC(proofId: string) {
  const result = await client.meetsRequirements(proofId, {
    mustBeAdult: true,
    mustHaveValidDocument: true,
    allowedCountries: ['US', 'CA', 'MX', 'GB', 'EU'],
  });
  
  return result.meets;
}
```

---

## Advanced: Blockchain Verification

### Check User's KYC Status

```typescript
const hasKYC = await client.hasValidKYC(userAddress);
console.log('Has Valid KYC:', hasKYC);
```

### Get Proof Details from Blockchain

```typescript
const proof = await client.getProofFromChain(proofId);
console.log('Commitment:', proof.commitment);
console.log('Public Inputs:', proof.publicInputs);
console.log('Submitter:', proof.submitter);
console.log('Verified:', proof.isVerified);
console.log('Expires At:', new Date(proof.expiresAt * 1000));
```

### Get User's Latest Proof

```typescript
const proofId = await client.getUserProofId(userAddress);
const proof = await client.getProofFromChain(proofId);
```

---

## API vs Blockchain

| Method | Speed | Cost | Trust |
|--------|-------|------|-------|
| API (`useBlockchain: false`) | ⚡ Fast | Free | Trust your API |
| Blockchain (`useBlockchain: true`) | 🐢 Slower | Free (read) | Trustless |

**Recommendation:**
- Use **API** for real-time checks (user login, access control)
- Use **Blockchain** for high-security verification (financial, legal)

---

## Testing

Run the example:

```bash
cd treza-sdk
npx tsx examples/kyc/check-adult.ts <proofId>
```

---

## Support

- 📖 [Full Documentation](./examples/kyc/README.md)
- 💬 [GitHub Issues](https://github.com/treza/treza-sdk/issues)
- 🔗 [Website](https://treza.io)

