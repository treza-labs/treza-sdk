# TREZA SDK

[![npm version](https://badge.fury.io/js/%40treza%2Fsdk.svg)](https://badge.fury.io/js/%40treza%2Fsdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

Privacy-first DeFi development tools with zero-knowledge compliance integration.

## 🚀 Features

- **🛡️ Privacy-First Compliance** - ZKPassport integration for zero-knowledge identity verification
- **⚡ Easy Integration** - Simple APIs for complex privacy-preserving operations
- **🔧 Developer Friendly** - TypeScript support with comprehensive documentation
- **⚛️ React Components** - Pre-built UI components for seamless integration
- **🌐 Multi-Chain Support** - Works across Ethereum and compatible networks
- **🔐 Secure by Design** - No personal data storage, cryptographic proofs only

## 📦 Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@treza/sdk`](./packages/core) | Core SDK functionality | ![npm](https://img.shields.io/npm/v/@treza/sdk) |
| [`@treza/react`](./packages/react) | React components and hooks | ![npm](https://img.shields.io/npm/v/@treza/react) |

## 🚀 Quick Start

### Installation

```bash
# Core SDK
npm install @treza/sdk ethers

# React components (includes core SDK)
npm install @treza/react @treza/sdk ethers react react-dom
```

### Basic Usage

```typescript
import { TrezaComplianceSDK } from '@treza/sdk';
import { ethers } from 'ethers';

// Initialize the SDK
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

// Initiate compliance verification
const verificationUrl = await sdk.initiateVerification({
  minAge: 18,
  allowedCountries: ['US', 'CA', 'GB'],
  requiredAttributes: ['firstname']
});

console.log('Scan this QR code:', verificationUrl);
```

### React Integration

```tsx
import React from 'react';
import {
  ComplianceProvider,
  ComplianceVerification,
  ComplianceStatusDisplay
} from '@treza/react';
import { ethers } from 'ethers';

function App() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = provider.getSigner();
  const userAddress = "0x...";

  return (
    <ComplianceProvider provider={provider} signer={signer}>
      <div>
        <h1>TREZA DApp</h1>
        
        {/* Show compliance status */}
        <ComplianceStatusDisplay 
          userAddress={userAddress}
          showDetails={true}
        />
        
        {/* Verification flow */}
        <ComplianceVerification
          userAddress={userAddress}
          requirements={{
            minAge: 18,
            allowedCountries: ['US', 'CA', 'GB']
          }}
          onVerificationComplete={(result) => {
            console.log('Verified!', result);
          }}
        />
      </div>
    </ComplianceProvider>
  );
}
```

## ⚛️ React Components & Hooks

The `@treza/react` package provides comprehensive React integration for ZKPassport compliance.

### Components

#### `ComplianceProvider`
Wraps your application to provide compliance context.

```tsx
<ComplianceProvider provider={ethersProvider} signer={ethersSigner}>
  {/* Your app */}
</ComplianceProvider>
```

#### `ComplianceVerification`
Handles the complete verification flow with QR code generation.

```tsx
<ComplianceVerification
  userAddress="0x..."
  requirements={{
    minAge: 18,
    allowedCountries: ['US', 'CA', 'GB'],
    requiredAttributes: ['firstname']
  }}
  onVerificationComplete={(result) => {
    console.log('Verification complete:', result);
  }}
/>
```

**Props:**
- `userAddress` - User's wallet address
- `requirements` - Compliance requirements (age, countries, attributes)
- `onVerificationComplete` - Callback when verification succeeds
- `onError` - Error callback
- `className` - Custom CSS class

#### `ComplianceStatusDisplay`
Shows the current compliance status of a user.

```tsx
<ComplianceStatusDisplay 
  userAddress="0x..."
  showDetails={true}
  autoRefresh={true}
  refreshInterval={30000}
/>
```

**Props:**
- `userAddress` - User's wallet address
- `showDetails` - Show detailed compliance information
- `autoRefresh` - Automatically refresh status
- `refreshInterval` - Refresh interval in milliseconds (default: 30000)
- `className` - Custom CSS class

#### `GovernanceEligibility`
Check and display governance voting eligibility.

```tsx
<GovernanceEligibility
  userAddress="0x..."
  proposalId={1}
  onEligibilityChange={(eligible) => {
    console.log('User eligible:', eligible);
  }}
/>
```

**Props:**
- `userAddress` - User's wallet address
- `proposalId` - Governance proposal ID
- `onEligibilityChange` - Callback when eligibility changes
- `className` - Custom CSS class

### Hooks

#### `useWallet()`
Manage wallet connection and state.

```tsx
const {
  isConnected,
  isConnecting,
  walletInfo,
  provider,
  signer,
  address,
  error,
  connect,
  disconnect,
  switchNetwork
} = useWallet();

// Connect wallet
await connect();

// Switch network
await switchNetwork(1); // Mainnet
```

#### `useCompliance(provider?, signer?)`
Access compliance functionality.

```tsx
const {
  isInitialized,
  isLoading,
  error,
  checkStatus,
  initiateVerification,
  completeVerification,
  checkGovernanceEligibility
} = useCompliance(provider, signer);

// Check compliance status
const status = await checkStatus('0x...');

// Initiate verification
const qrUrl = await initiateVerification({
  minAge: 18,
  allowedCountries: ['US', 'CA']
});
```

#### `useVerificationFlow(provider?, signer?)`
Simplified verification flow management.

```tsx
const {
  isVerifying,
  verificationUrl,
  status,
  error,
  startVerification,
  pollStatus,
  reset
} = useVerificationFlow(provider, signer);

// Start verification and get QR code
await startVerification({
  userAddress: '0x...',
  requirements: { minAge: 18 }
});

// Poll for completion
const result = await pollStatus('0x...');
```

#### `useTreza()`
Combined hook for full TREZA functionality (wallet + compliance).

```tsx
const {
  // Wallet
  isConnected,
  address,
  connect,
  disconnect,
  
  // Compliance
  checkCompliance,
  startVerification,
  
  // State
  isLoading,
  error
} = useTreza();
```

### Custom Styling

All components accept a `className` prop for custom styling. You can also import the default styles:

```tsx
import { complianceStyles } from '@treza/react';

// Inject into your app
const styleTag = document.createElement('style');
styleTag.innerHTML = complianceStyles;
document.head.appendChild(styleTag);
```

### Environment Variables

```bash
# React app environment variables
REACT_APP_TREZA_TOKEN_ADDRESS=0x...
REACT_APP_COMPLIANCE_VERIFIER_ADDRESS=0x...
REACT_APP_COMPLIANCE_INTEGRATION_ADDRESS=0x...
```

### ZKPassport Integration

The React components seamlessly integrate with ZKPassport for zero-knowledge identity verification:

1. **User initiates verification** → `ComplianceVerification` generates QR code
2. **User scans QR** → Opens ZKPassport mobile app
3. **ZKPassport verifies identity** → Government ID verification
4. **Zero-knowledge proof generated** → No personal data shared
5. **Proof submitted to zkVerify** → Proof verified on blockchain
6. **Compliance status updated** → Components automatically reflect new status

## 🏗️ Architecture

The TREZA SDK provides a complete privacy-preserving compliance solution:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your DApp     │    │   TREZA SDK     │    │   ZKPassport    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   React     │◄┼────┼►│   React     │ │    │ │   Mobile    │ │
│ │ Components  │ │    │ │ Components  │ │    │ │    App      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │        │        │    │        │        │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Business  │◄┼────┼►│    Core     │◄┼────┼►│ ZK Proofs   │ │
│ │    Logic    │ │    │ │     SDK     │ │    │ │ Generation  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ethereum      │    │    zkVerify     │    │  Government     │
│  Smart          │    │   Blockchain    │    │      ID         │
│  Contracts      │    │                 │    │  Verification   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📚 Documentation

### Core Concepts

- **[Getting Started](./docs/getting-started.md)** - Basic setup and first integration
- **[Compliance System](./docs/compliance.md)** - Understanding zero-knowledge compliance
- **[React Components](./docs/react-components.md)** - UI component documentation
- **[API Reference](./docs/api-reference.md)** - Complete API documentation

### Guides

- **[Integration Guide](./docs/integration-guide.md)** - Step-by-step integration
- **[Customization](./docs/customization.md)** - Customizing components and behavior
- **[Testing](./docs/testing.md)** - Testing your integration
- **[Deployment](./docs/deployment.md)** - Production deployment guide

### Examples

- **[Basic Integration](./examples/basic-usage.ts)** - Simple SDK usage
- **[React DApp](./examples/react-dapp/)** - Complete React application
- **[Next.js Integration](./examples/nextjs-compliance/)** - Next.js with compliance
- **[Governance Integration](./examples/governance/)** - DAO governance with compliance

## 🔧 Development

### Prerequisites

- Node.js 16+
- npm 8+
- Git

### Setup

```bash
git clone https://github.com/treza-labs/treza-sdk.git
cd treza-sdk
npm install
```

### Development Commands

```bash
# Build all packages
npm run build

# Build specific package
npm run build:core
npm run build:react

# Development mode (watch)
npm run dev

# Run tests
npm run test

# Lint and format
npm run lint
```

### Project Structure

```
packages/
├── core/                   # Core SDK (@treza/sdk)
│   ├── src/
│   │   ├── compliance/     # Compliance functionality
│   │   └── index.ts        # Main exports
│   └── package.json
├── react/                  # React components (@treza/react)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # React hooks
│   │   └── index.ts        # Main exports
│   └── package.json
examples/                   # Usage examples
docs/                       # Documentation
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [treza.finance](https://treza.finance)
- **Documentation**: [docs.treza.finance](https://docs.treza.finance)
- **Smart Contracts**: [treza-contracts](https://github.com/treza-labs/treza-contracts)
- **Discord**: [Join our community](https://discord.gg/treza)
- **Twitter**: [@TrezaFinance](https://twitter.com/TrezaFinance)

## 🆘 Support

- **Documentation**: [docs.treza.finance](https://docs.treza.finance)
- **Discord**: [Community support](https://discord.gg/treza)
- **GitHub Issues**: [Report bugs](https://github.com/treza-labs/treza-sdk/issues)
- **Email**: [dev@treza.finance](mailto:dev@treza.finance)

---