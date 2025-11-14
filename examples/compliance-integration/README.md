# TREZA Compliance Integration Example

This example demonstrates how to integrate TREZA's privacy-preserving compliance system into your DApp using ZKPassport and zkVerify.

## Overview

The integration provides:
- **Zero-knowledge identity verification** using ZKPassport
- **Privacy-preserving compliance** without storing personal data
- **Seamless user experience** with QR code verification
- **Smart contract integration** for on-chain compliance verification

## Features Demonstrated

1. **User Verification Flow**
   - Initiate ZKPassport verification
   - Generate QR code for mobile scanning
   - Process verification results
   - Store compliance status on-chain

2. **Compliance Checking**
   - Check individual user compliance
   - Batch check multiple users
   - Governance eligibility verification
   - Real-time compliance status updates

3. **React Integration**
   - Pre-built UI components
   - Context providers for state management
   - Hooks for easy integration
   - Customizable styling

## Quick Start

### 1. Install Dependencies

```bash
npm install @treza/sdk @treza/react ethers
```

### 2. Basic Integration

```typescript
import { TrezaComplianceSDK } from '@treza/sdk';
import { ethers } from 'ethers';

// Initialize SDK
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = provider.getSigner();

const sdk = new TrezaComplianceSDK({
  zkPassportDomain: "your-domain.com",
  zkVerifyEndpoint: "https://api.zkverify.io",
  trezaTokenAddress: "0x...",
  complianceVerifierAddress: "0x...",
  complianceIntegrationAddress: "0x...",
  provider,
  signer
});

// Start verification
const verificationUrl = await sdk.initiateVerification({
  minAge: 18,
  allowedCountries: ['US', 'CA', 'GB']
});
```

### 3. React Components

```tsx
import React from 'react';
import {
  ComplianceProvider,
  ComplianceVerification,
  ComplianceStatusDisplay
} from '@treza/react';

function App() {
  return (
    <ComplianceProvider provider={provider} signer={signer}>
      <ComplianceVerification
        userAddress="0x..."
        onVerificationComplete={(result) => {
          console.log('Verification completed:', result);
        }}
      />
    </ComplianceProvider>
  );
}
```

## Files in this Example

- **`complete-integration-example.ts`** - Complete TypeScript integration example
- **`react-example.tsx`** - React component integration
- **`package.json`** - Dependencies and scripts
- **`README.md`** - This documentation

## Running the Example

1. **Clone the repository**:
   ```bash
   git clone https://github.com/treza-labs/treza-sdk.git
   cd treza-sdk/examples/compliance-integration
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the example**:
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables

```bash
# Blockchain Configuration
REACT_APP_TREZA_TOKEN_ADDRESS=0x...
REACT_APP_COMPLIANCE_VERIFIER_ADDRESS=0x...
REACT_APP_COMPLIANCE_INTEGRATION_ADDRESS=0x...

# Network Configuration
REACT_APP_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
REACT_APP_CHAIN_ID=11155111

# ZKPassport Configuration
REACT_APP_ZKPASSPORT_DOMAIN=your-domain.com

# zkVerify Configuration
REACT_APP_ZKVERIFY_ENDPOINT=https://api.zkverify.io
REACT_APP_ZKVERIFY_API_KEY=your-api-key
```

### Compliance Requirements

```typescript
const requirements = {
  minAge: 18,                           // Minimum age requirement
  allowedCountries: ['US', 'CA', 'GB'], // Allowed jurisdictions
  requiredAttributes: ['firstname'],    // Required identity attributes
  verificationLevel: 'basic'            // Verification level
};
```

## Integration Steps

### Step 1: Initialize SDK

```typescript
import { TrezaComplianceSDK } from '@treza/sdk';

const sdk = new TrezaComplianceSDK({
  // Configuration options
});
```

### Step 2: Start Verification

```typescript
const verificationUrl = await sdk.initiateVerification(requirements);
// Display QR code to user
```

### Step 3: Handle Results

```typescript
const result = await sdk.processVerificationResult(zkPassportResult, userAddress);
if (result.success) {
  // Grant access to features
}
```

### Step 4: Check Compliance

```typescript
const isCompliant = await sdk.checkComplianceStatus(userAddress);
if (isCompliant.isCompliant) {
  // User can access features
}
```

## Advanced Usage

### Custom Verification Requirements

```typescript
const customRequirements = {
  minAge: 21,
  allowedCountries: ['US'],
  requiredAttributes: ['firstname', 'lastname'],
  verificationLevel: 'enhanced',
  customValidation: (result) => {
    // Custom validation logic
    return result.someCustomField === 'expected_value';
  }
};
```

### Batch Compliance Checking

```typescript
const users = ['0x...', '0x...', '0x...'];
const complianceStatuses = await sdk.batchCheckCompliance(users);

complianceStatuses.forEach((status, index) => {
  console.log(`User ${users[index]}: ${status.isCompliant ? 'Compliant' : 'Not Compliant'}`);
});
```

### Governance Integration

```typescript
const eligibility = await sdk.checkGovernanceEligibility(userAddress, proposalId);
if (eligibility.canParticipate) {
  console.log(`Voting weight: ${eligibility.votingWeight}`);
}
```

## Troubleshooting

### Common Issues

1. **"Provider not found"**
   - Ensure MetaMask or another Web3 provider is installed
   - Check that the user has connected their wallet

2. **"Contract not deployed"**
   - Verify contract addresses in your configuration
   - Ensure you're connected to the correct network

3. **"Verification failed"**
   - Check ZKPassport integration
   - Verify zkVerify endpoint configuration
   - Ensure user completed verification in mobile app

### Debug Mode

Enable debug logging:

```typescript
const sdk = new TrezaComplianceSDK({
  // ... other config
  debug: true
});
```

## Support

- **Documentation**: [docs.treza.finance](https://docs.treza.finance)
- **Discord**: [Community support](https://discord.gg/treza)
- **GitHub Issues**: [Report issues](https://github.com/treza-labs/treza-sdk/issues)

---

For more examples and documentation, visit [docs.treza.finance](https://docs.treza.finance).

