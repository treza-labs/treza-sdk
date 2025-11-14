# TREZA SDK

[![npm version](https://badge.fury.io/js/%40treza%2Fsdk.svg)](https://badge.fury.io/js/%40treza%2Fsdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

Privacy-first DeFi development tools with zero-knowledge compliance integration.

## 🚀 Features

- **🛡️ Production zkVerify Integration** - Oracle and Attestation systems for enterprise-grade verification
- **🤖 Smart Verification Routing** - Automatic selection between Oracle (fast) and Attestation (secure) modes
- **🏛️ Professional Attestation** - KYC'd institutional attesters with staking and slashing mechanisms
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
import { TrezaComplianceSDK, TrezaComplianceHelper } from '@treza/sdk';
import { ethers } from 'ethers';

// Initialize the SDK
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Option 1: Production SDK with Oracle and Attestation systems
const sdk = TrezaComplianceHelper.createProductionSDK(
  provider,
  "0x...", // zkVerifyOracleAddress
  "0x...", // attestationSystemAddress
  signer
);

// Option 2: Custom configuration
const customSdk = new TrezaComplianceSDK({
  zkPassportDomain: "your-domain.com",
  zkVerifyEndpoint: "https://api.zkverify.io",
  trezaTokenAddress: "0x...",
  complianceVerifierAddress: "0x...",
  complianceIntegrationAddress: "0x...",
  zkVerifyOracleAddress: "0x...",        // New: Oracle system
  attestationSystemAddress: "0x...",     // New: Attestation system
  verificationMode: 3,                   // New: Hybrid mode (0=fallback, 1=oracle, 2=attestation, 3=hybrid)
  transactionValueThreshold: "1000000",  // New: $1M threshold for attestation
  provider,
  signer
});

// Initiate compliance verification (automatically routes to best verification method)
const verificationUrl = await sdk.initiateVerification({
  minAge: 18,
  allowedCountries: ['US', 'CA', 'GB'],
  requiredAttributes: ['firstname']
});

console.log('Scan this QR code:', verificationUrl);

// Check verification mode being used
const mode = await sdk.getVerificationMode();
console.log('Current verification mode:', mode); // 0=fallback, 1=oracle, 2=attestation, 3=hybrid
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
  const signer = await provider.getSigner();
  const userAddress = "0x...";

  return (
    <ComplianceProvider 
      provider={provider} 
      signer={signer}
      // New: zkVerify production system configuration
      verificationMode={3}                    // Hybrid mode
      zkVerifyOracleAddress="0x..."          // Oracle contract
      attestationSystemAddress="0x..."       // Attestation contract
      transactionValueThreshold="1000000"    // $1M threshold
    >
      <div>
        <h1>TREZA DApp</h1>
        
        {/* Show compliance status */}
        <ComplianceStatusDisplay 
          userAddress={userAddress}
          showDetails={true}
        />
        
        {/* Verification flow - automatically uses best verification method */}
        <ComplianceVerification
          userAddress={userAddress}
          requirements={{
            minAge: 18,
            allowedCountries: ['US', 'CA', 'GB']
          }}
          onVerificationComplete={(result) => {
            console.log('Verified with method:', result.verificationMethod);
            console.log('Oracle used:', result.oracleVerified);
            console.log('Attestation used:', result.attestationVerified);
          }}
        />
      </div>
    </ComplianceProvider>
  );
}
```

## 🏭 zkVerify Production Integration

The TREZA SDK now includes production-ready zkVerify integration with Oracle and Attestation systems:

### 🤖 Oracle System
- **Fast Verification**: Automated verification for high-volume transactions
- **Multi-Oracle Consensus**: Multiple authorized oracles for redundancy
- **Cryptographic Proofs**: Signature verification of zkVerify results
- **Gas Optimized**: Efficient on-chain storage and retrieval

### 👨‍💼 Attestation System  
- **Professional Review**: KYC'd institutional and individual attesters
- **Tier-Based Access**: Bronze, Silver, Gold, Platinum attester levels
- **Economic Security**: Staking mechanism with slashing for incorrect attestations
- **Rich Metadata**: Detailed context for attestation decisions

### 🔄 Hybrid Verification
- **Smart Routing**: Automatic selection between Oracle and Attestation
- **Value-Based Logic**: High-value transactions → Attestation, High-volume → Oracle
- **Fallback Modes**: Graceful degradation when systems are unavailable
- **Runtime Configuration**: Admin controls for verification strategies

### 📊 Verification Modes

| Mode | Description | Use Case | Speed | Security |
|------|-------------|----------|-------|----------|
| **0 - Fallback** | Basic verification without zkVerify | Development/Testing | ⚡ Fast | 🔒 Basic |
| **1 - Oracle** | Automated oracle verification | High-volume DeFi | ⚡ Fast | 🔒🔒 High |
| **2 - Attestation** | Professional attester review | High-value transactions | 🐌 Slower | 🔒🔒🔒 Maximum |
| **3 - Hybrid** | Smart routing based on value/risk | Production systems | ⚡🐌 Variable | 🔒🔒🔒 Adaptive |

## ⚛️ React Components & Hooks

The `@treza/react` package provides comprehensive React integration for ZKPassport compliance with full zkVerify support.

### Components

#### `ComplianceProvider`
Wraps your application to provide compliance context with zkVerify integration.

```tsx
<ComplianceProvider 
  provider={ethersProvider} 
  signer={ethersSigner}
  verificationMode={3}                    // 0=fallback, 1=oracle, 2=attestation, 3=hybrid
  zkVerifyOracleAddress="0x..."          // Oracle contract address
  attestationSystemAddress="0x..."       // Attestation contract address
  transactionValueThreshold="1000000"    // Threshold for attestation routing
>
  {/* Your app */}
</ComplianceProvider>
```

**New Props:**
- `verificationMode` - Verification strategy (0-3)
- `zkVerifyOracleAddress` - Oracle system contract address
- `attestationSystemAddress` - Attestation system contract address  
- `transactionValueThreshold` - USD value threshold for attestation routing

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

# New: zkVerify production system addresses
REACT_APP_ZKVERIFY_ORACLE_ADDRESS=0x...
REACT_APP_ATTESTATION_SYSTEM_ADDRESS=0x...

# New: Verification configuration
REACT_APP_VERIFICATION_MODE=3                    # 0=fallback, 1=oracle, 2=attestation, 3=hybrid
REACT_APP_TRANSACTION_VALUE_THRESHOLD=1000000    # USD threshold for attestation routing
```

### ZKPassport Integration

The React components seamlessly integrate with ZKPassport and zkVerify for production-grade zero-knowledge identity verification:

1. **User initiates verification** → `ComplianceVerification` generates QR code
2. **User scans QR** → Opens ZKPassport mobile app  
3. **ZKPassport verifies identity** → Government ID verification
4. **Zero-knowledge proof generated** → No personal data shared
5. **Proof submitted to zkVerify** → Proof verified on zkVerify blockchain
6. **TREZA SDK routes verification** → Oracle (fast) or Attestation (secure) based on transaction value
7. **On-chain verification** → Oracle consensus or professional attester review
8. **Compliance status updated** → Components automatically reflect new status with verification method details

## 🏗️ Architecture

The TREZA SDK provides a complete privacy-preserving compliance solution with production zkVerify integration:

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
│ │   Business  │◄┼────┼►│ Core SDK +  │◄┼────┼►│ ZK Proofs   │ │
│ │    Logic    │ │    │ │ Hybrid      │ │    │ │ Generation  │ │
│ │             │ │    │ │ Routing     │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ethereum      │    │    zkVerify     │    │  Government     │
│  Smart          │    │   Blockchain    │    │      ID         │
│  Contracts      │    │                 │    │  Verification   │
│                 │    └─────────────────┘    └─────────────────┘
│ ┌─────────────┐ │             │
│ │   Oracle    │◄┼─────────────┘
│ │  System     │ │    ⚡ Fast verification
│ └─────────────┘ │      for high-volume
│                 │
│ ┌─────────────┐ │
│ │ Attestation │ │    🔒 Secure verification  
│ │  System     │ │      for high-value
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │ ZKPassport  │ │    🛡️ Main compliance
│ │  Verifier   │ │      contract
│ └─────────────┘ │
└─────────────────┘
```

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