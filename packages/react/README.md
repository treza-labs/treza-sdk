# @treza/react

[![npm version](https://badge.fury.io/js/%40treza%2Freact.svg)](https://www.npmjs.com/package/@treza/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

React components and hooks for the **Treza Platform** - privacy-preserving KYC verification and compliance UI.

## Features

- **Pre-built Components** - Ready-to-use KYC verification and compliance UI
- **React Hooks** - Easily integrate compliance checks into your app
- **TypeScript** - Full type safety and IntelliSense
- **Customizable** - Style components to match your design system
- **Wallet Integration** - Works with popular wallet providers

## Installation

```bash
npm install @treza/react @treza/sdk ethers react react-dom
```

## Quick Start

### ComplianceProvider

Wrap your app with the `ComplianceProvider`:

```tsx
import { ComplianceProvider } from '@treza/react';

function App() {
  return (
    <ComplianceProvider
      config={{
        apiUrl: 'https://api.trezalabs.com/api',
        contractAddress: '0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA',
      }}
    >
      <YourApp />
    </ComplianceProvider>
  );
}
```

### useCompliance Hook

```tsx
import { useCompliance } from '@treza/react';

function VerificationStatus() {
  const { 
    isVerified, 
    isLoading, 
    verifyUser,
    claims 
  } = useCompliance();

  if (isLoading) return <div>Checking verification...</div>;

  if (!isVerified) {
    return (
      <button onClick={() => verifyUser()}>
        Verify Identity
      </button>
    );
  }

  return (
    <div>
      <p>✓ Verified</p>
      <p>Country: {claims?.nationality}</p>
    </div>
  );
}
```

### KYCVerificationBadge

Display verification status:

```tsx
import { KYCVerificationBadge } from '@treza/react';

function UserProfile({ address }) {
  return (
    <div>
      <h2>User Profile</h2>
      <KYCVerificationBadge 
        address={address}
        showDetails={true}
      />
    </div>
  );
}
```

### ComplianceGate

Restrict access based on compliance:

```tsx
import { ComplianceGate } from '@treza/react';

function ProtectedContent() {
  return (
    <ComplianceGate
      requirements={{
        mustBeAdult: true,
        allowedCountries: ['US', 'CA', 'GB'],
      }}
      fallback={<VerifyPrompt />}
    >
      <RestrictedContent />
    </ComplianceGate>
  );
}
```

## Components

| Component | Description |
|-----------|-------------|
| `ComplianceProvider` | Context provider for compliance state |
| `KYCVerificationBadge` | Shows verification status |
| `ComplianceGate` | Conditionally render based on compliance |
| `VerifyButton` | One-click verification flow |
| `ClaimsDisplay` | Show verified claims |

## Hooks

| Hook | Description |
|------|-------------|
| `useCompliance` | Main compliance hook |
| `useKYCStatus` | Check KYC verification status |
| `useClaims` | Access verified claims |
| `useComplianceCheck` | Run compliance checks |

## Services

### WalletService

Handle wallet connections and signing:

```tsx
import { WalletService } from '@treza/react';

const walletService = new WalletService();

// Connect wallet
const address = await walletService.connect();

// Sign message for verification
const signature = await walletService.signMessage('Verify KYC');

// Get network info
const network = await walletService.getNetwork();
```

### ComplianceService

Direct compliance operations:

```tsx
import { ComplianceService } from '@treza/react';

const compliance = new ComplianceService({
  apiUrl: 'https://api.trezalabs.com/api',
  contractAddress: '0x...'
});

// Check requirements
const result = await compliance.checkRequirements(address, {
  mustBeAdult: true,
  allowedCountries: ['US']
});
```

## Environment Variables

```bash
NEXT_PUBLIC_TREZA_API_URL=https://api.trezalabs.com/api
NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA
```

## Related Packages

- **[@treza/sdk](https://www.npmjs.com/package/@treza/sdk)** - Core SDK (required peer dependency)

## Links

- **Website**: [trezalabs.com](https://trezalabs.com)
- **Documentation**: [docs.trezalabs.com](https://docs.trezalabs.com)
- **GitHub**: [github.com/treza-labs/treza-sdk](https://github.com/treza-labs/treza-sdk)

## License

MIT
