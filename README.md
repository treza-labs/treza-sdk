# TREZA SDK

[![npm version](https://badge.fury.io/js/%40treza%2Fsdk.svg)](https://badge.fury.io/js/%40treza%2Fsdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

TypeScript SDK for interacting with TREZA's privacy-preserving KYC system and secure enclave management platform.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Core Features](#core-features)
  - [KYC Features](#kyc-features)
  - [Enclave Platform](#enclave-platform)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Documentation](#documentation)
- [Development](#development)
- [Support](#support)
- [License](#license)

## Features

### KYC Features
- **Zero-Knowledge KYC** - Verify identity without exposing personal data
- **Blockchain Integration** - Direct integration with KYCVerifier smart contracts  
- **Convenience Methods** - Simple APIs for common KYC checks (age, country, document validity)
- **Dual Verification** - API-based (fast) OR blockchain-based (trustless)
- **Multi-Chain Support** - Ethereum, Sepolia, and compatible networks

### Enclave Platform Features
- **Secure Enclave Deployment** - Deploy and manage AWS Nitro Enclaves with cryptographic attestation
- **Lifecycle Management** - Full control over enclave state (deploy, pause, resume, terminate)
- **Attestation & Verification** - Hardware-backed cryptographic proof of enclave integrity
- **Comprehensive Logging** - Access logs from ECS, Step Functions, Lambda, and applications
- **Provider Management** - Support for multiple cloud providers and regions
- **Task Scheduling** - Schedule and manage automated tasks within enclaves
- **GitHub Integration** - Connect enclaves directly to GitHub repositories
- **Docker Support** - Search and deploy Docker Hub images
- **API Key Management** - Fine-grained access control with permissions

### Developer Experience
- **TypeScript Support** - Full type safety and IntelliSense
- **Easy Integration** - Works with any TypeScript/JavaScript project
- **Code Generation** - Auto-generate integration snippets in multiple languages
- **No Authentication Required** - Open API protected by rate limiting (KYC endpoints)
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

# Enclave Platform
TREZA_PLATFORM_URL=https://app.trezalabs.com
WALLET_ADDRESS=0x...your-wallet-address

# Blockchain Configuration (for KYC)
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_KYC_VERIFIER_ADDRESS=0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA

# For write operations (proof submission)
PRIVATE_KEY=0x...your-private-key
```

See [`.env.example`](./.env.example) for all available configuration options.

### Basic Usage - KYC

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

### Basic Usage - Enclave Platform

```typescript
import { TrezaClient } from '@treza/sdk';

// Initialize client
const client = new TrezaClient({
  baseUrl: process.env.TREZA_PLATFORM_URL
});

// Create a secure enclave
const enclave = await client.createEnclave({
  name: 'My Secure Enclave',
  description: 'Privacy-preserving computation',
  region: 'us-east-1',
  walletAddress: process.env.WALLET_ADDRESS,
  providerId: 'aws-nitro-enclave'
});

console.log('Enclave created:', enclave.id);
console.log('Status:', enclave.status);

// Get attestation and verify
const attestation = await client.getAttestation(enclave.id);
console.log('Trust Level:', attestation.verification.trustLevel);
console.log('PCR Measurements:', attestation.attestationDocument.pcrs);

// Verify enclave integrity
const verification = await client.verifyAttestation(enclave.id);
console.log('Is Valid:', verification.isValid);
console.log('Compliance:', verification.complianceChecks);
```

See [Quick Reference](./QUICK_REFERENCE.md) for more examples and complete API documentation.

## Core Features

### KYC Features

#### Convenience Methods

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

#### Dual Verification

Choose between API-based (fast) or blockchain-based (trustless) verification:

```typescript
// Via API (fast)
const isAdult = await client.isAdult(proofId);

// Via blockchain (trustless)  
const isAdultOnChain = await client.isAdult(proofId, true);
```

#### Blockchain Operations

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

### KYC Platform

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

### Enclave Platform

```
┌─────────────────────────────────────┐
│        Your Application             │
│  (Node.js / Browser / React)        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         TREZA SDK                   │
│  • TrezaClient                      │
│  • Enclave Management               │
│  • Attestation & Verification       │
│  • Task Scheduling                  │
│  • GitHub & Docker Integration      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│       TREZA Platform API            │
│  • Enclave Orchestration            │
│  • Lifecycle Management             │
│  • Log Aggregation                  │
│  • Attestation Services             │
└─────────────┬───────────────────────┘
              │
        ┌─────┴─────────┐
        │               │
        ▼               ▼
┌─────────────┐  ┌─────────────────┐
│  AWS Nitro  │  │  Verification   │
│  Enclaves   │  │  Infrastructure │
│             │  │                 │
│ • Hardware  │  │ • PCR Checks    │
│   Isolation │  │ • Certificate   │
│ • Crypto    │  │   Validation    │
│   Attest.   │  │ • Compliance    │
└─────────────┘  └─────────────────┘
```

## API Reference

### TrezaClient

Main client for enclave platform management.

#### Constructor

```typescript
new TrezaClient(config?: TrezaConfig)
```

**Config Options:**
- `baseUrl`: Base API URL (default: `https://app.trezalabs.com`)
- `timeout`: Request timeout in milliseconds (default: `30000`)

#### Enclave Methods

**Core Operations:**
- `getEnclaves(walletAddress)` - Get all enclaves
- `getEnclave(enclaveId)` - Get specific enclave
- `createEnclave(request)` - Create new enclave
- `updateEnclave(request)` - Update enclave
- `deleteEnclave(enclaveId, walletAddress)` - Delete enclave

**Lifecycle Management:**
- `pauseEnclave(enclaveId, walletAddress)` - Pause enclave
- `resumeEnclave(enclaveId, walletAddress)` - Resume enclave
- `terminateEnclave(enclaveId, walletAddress)` - Terminate enclave
- `performEnclaveAction(request)` - Generic lifecycle action

**Logging:**
- `getEnclaveLogs(enclaveId, logType?, limit?)` - Get logs
  - Log types: `'all'`, `'ecs'`, `'stepfunctions'`, `'lambda'`, `'application'`, `'errors'`

**Attestation & Verification:**
- `getAttestation(enclaveId)` - Get attestation document with PCR measurements
- `getVerificationStatus(enclaveId)` - Quick verification status
- `verifyAttestation(enclaveId, request?)` - Comprehensive verification with compliance checks
- `generateIntegrationSnippet(enclaveId, language?)` - Generate code snippets
  - Languages: `'javascript'`, `'python'`, `'curl'`, `'java'`

#### Provider Methods

- `getProviders()` - Get all available providers
- `getProvider(providerId)` - Get specific provider

#### Task Methods

- `getTasks(walletAddress)` - Get all tasks
- `createTask(request)` - Create scheduled task
- `updateTask(request)` - Update task
- `deleteTask(taskId, walletAddress)` - Delete task

#### API Key Methods

- `getApiKeys(walletAddress)` - Get all API keys
- `createApiKey(request)` - Create API key with permissions
- `updateApiKey(request)` - Update API key
- `deleteApiKey(apiKeyId, walletAddress)` - Delete API key

#### GitHub Methods

- `getGitHubAuthUrl(state?)` - Get OAuth authorization URL
- `exchangeGitHubCode(request)` - Exchange OAuth code for token
- `getGitHubRepositories(accessToken)` - Get user repositories
- `getRepositoryBranches(request)` - Get repository branches

#### Docker Methods

- `searchDockerImages(query)` - Search Docker Hub
- `getDockerTags(repository)` - Get available tags for image

---

### TrezaKYCClient

Client for KYC verification operations.

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

## Enclave Platform

The TREZA SDK provides comprehensive management of secure AWS Nitro Enclaves with cryptographic attestation for privacy-preserving computation.

### Getting Started with Enclaves

```typescript
import { TrezaClient } from '@treza/sdk';

// Initialize client
const client = new TrezaClient({
  baseUrl: 'https://app.trezalabs.com', // optional, this is the default
  timeout: 30000 // optional, request timeout in ms
});

const WALLET_ADDRESS = '0x...'; // Your wallet address
```

### Enclave Management

#### Create and Deploy an Enclave

```typescript
// Get available providers
const providers = await client.getProviders();
const awsProvider = providers.find(p => p.id === 'aws-nitro-enclave');

// Create a new enclave
const enclave = await client.createEnclave({
  name: 'Trading Bot Enclave',
  description: 'Secure enclave for automated trading',
  region: 'us-east-1',
  walletAddress: WALLET_ADDRESS,
  providerId: awsProvider.id,
  providerConfig: {
    instanceType: 't3.small',
    dockerImage: 'myapp:latest'
  }
});

console.log('Enclave created:', enclave.id);
console.log('Status:', enclave.status); // PENDING_DEPLOY -> DEPLOYING -> DEPLOYED
```

#### List and Get Enclaves

```typescript
// Get all enclaves for your wallet
const enclaves = await client.getEnclaves(WALLET_ADDRESS);

// Get specific enclave details
const enclave = await client.getEnclave(enclaveId);
console.log(`${enclave.name} - Status: ${enclave.status}`);
```

#### Update an Enclave

```typescript
const updated = await client.updateEnclave({
  id: enclaveId,
  walletAddress: WALLET_ADDRESS,
  description: 'Updated description',
  providerConfig: {
    instanceType: 't3.medium'
  }
});
```

### Enclave Lifecycle Management

Control enclave state with pause, resume, and terminate operations:

```typescript
// Pause an enclave (stops compute, reduces costs)
const paused = await client.pauseEnclave(enclaveId, WALLET_ADDRESS);
console.log('Status:', paused.enclave.status); // PAUSED

// Resume a paused enclave
const resumed = await client.resumeEnclave(enclaveId, WALLET_ADDRESS);
console.log('Status:', resumed.enclave.status); // DEPLOYED

// Terminate an enclave (permanent deletion)
const terminated = await client.terminateEnclave(enclaveId, WALLET_ADDRESS);
console.log('Status:', terminated.enclave.status); // DESTROYED
```

### Attestation & Cryptographic Verification

TREZA enclaves provide hardware-backed cryptographic proof of integrity:

```typescript
// Get full attestation document with PCR measurements
const attestation = await client.getAttestation(enclaveId);
console.log('PCR0 (Enclave Image):', attestation.attestationDocument.pcrs[0]);
console.log('PCR1 (Kernel):', attestation.attestationDocument.pcrs[1]);
console.log('PCR2 (Application):', attestation.attestationDocument.pcrs[2]);
console.log('Trust Level:', attestation.verification.trustLevel); // HIGH, MEDIUM, LOW

// Quick verification status check
const status = await client.getVerificationStatus(enclaveId);
console.log('Is Verified:', status.isVerified);
console.log('Trust Level:', status.trustLevel);

// Comprehensive verification with compliance checks
const verification = await client.verifyAttestation(enclaveId, {
  nonce: 'your-unique-nonce-here' // For replay attack protection
});

console.log('Valid:', verification.isValid);
console.log('PCR Verification:', verification.verificationDetails.pcrVerification);
console.log('Certificate Chain:', verification.verificationDetails.certificateChain);
console.log('Compliance:', verification.complianceChecks);
// {
//   soc2: true,
//   hipaa: true,
//   fips: true,
//   commonCriteria: true
// }
console.log('Risk Score:', verification.riskScore); // Lower is better
console.log('Recommendations:', verification.recommendations);
```

### Integration Code Generation

Generate ready-to-use code snippets for third-party integration:

```typescript
// Generate JavaScript/TypeScript snippet
const jsCode = await client.generateIntegrationSnippet(enclaveId, 'javascript');

// Generate Python snippet
const pyCode = await client.generateIntegrationSnippet(enclaveId, 'python');

// Generate cURL commands
const curlCode = await client.generateIntegrationSnippet(enclaveId, 'curl');

// Generate Java snippet
const javaCode = await client.generateIntegrationSnippet(enclaveId, 'java');
```

### Comprehensive Logging

Access logs from all enclave components:

```typescript
// Get all logs
const allLogs = await client.getEnclaveLogs(enclaveId);

// Get specific log types
const ecsLogs = await client.getEnclaveLogs(enclaveId, 'ecs', 100);
const appLogs = await client.getEnclaveLogs(enclaveId, 'application', 100);
const errorLogs = await client.getEnclaveLogs(enclaveId, 'errors', 50);
const lambdaLogs = await client.getEnclaveLogs(enclaveId, 'lambda', 100);
const stepFunctionLogs = await client.getEnclaveLogs(enclaveId, 'stepfunctions', 100);

// Log structure
console.log(allLogs.logs.application?.[0]);
// {
//   timestamp: 1700000000000,
//   message: 'Application started',
//   source: 'application',
//   stream: 'app-stream-1',
//   type: 'stdout'
// }
```

### Task Scheduling

Schedule automated tasks within enclaves:

```typescript
// Create a scheduled task
const task = await client.createTask({
  name: 'Daily Data Sync',
  description: 'Sync data every day at midnight',
  enclaveId: enclaveId,
  schedule: '0 0 * * *', // Cron expression
  walletAddress: WALLET_ADDRESS
});

// List all tasks
const tasks = await client.getTasks(WALLET_ADDRESS);

// Update task schedule
const updated = await client.updateTask({
  id: task.id,
  walletAddress: WALLET_ADDRESS,
  schedule: '0 */6 * * *', // Every 6 hours
  status: 'running'
});

// Delete a task
await client.deleteTask(task.id, WALLET_ADDRESS);
```

### GitHub Integration

Connect enclaves to GitHub repositories for automated deployments:

```typescript
// Get GitHub OAuth URL
const auth = await client.getGitHubAuthUrl();
console.log('Authorize at:', auth.authUrl);

// After user authorization, exchange code for token
const tokenResponse = await client.exchangeGitHubCode({
  code: 'oauth-code-from-callback'
});

// Get user's repositories
const repos = await client.getGitHubRepositories(tokenResponse.access_token);

// Get branches for a specific repository
const branches = await client.getRepositoryBranches({
  accessToken: tokenResponse.access_token,
  repository: 'username/repo-name'
});

// Create enclave with GitHub connection
const enclave = await client.createEnclave({
  name: 'GitHub-connected Enclave',
  description: 'Auto-deploys from GitHub',
  region: 'us-east-1',
  walletAddress: WALLET_ADDRESS,
  providerId: awsProvider.id,
  githubConnection: {
    isConnected: true,
    username: tokenResponse.user.login,
    selectedRepo: 'username/repo-name',
    selectedBranch: 'main',
    accessToken: tokenResponse.access_token
  }
});
```

### Docker Integration

Search and use Docker Hub images:

```typescript
// Search for Docker images
const searchResults = await client.searchDockerImages('nodejs');
console.log('Found images:', searchResults.count);
searchResults.results.forEach(img => {
  console.log(`${img.name}: ${img.description} (⭐ ${img.stars})`);
});

// Get available tags for an image
const tags = await client.getDockerTags('library/node');
tags.tags.forEach(tag => {
  console.log(`${tag.name} - ${tag.size} bytes - Updated: ${tag.lastUpdated}`);
});
```

### API Key Management

Create and manage API keys with fine-grained permissions:

```typescript
// Create an API key with specific permissions
const apiKey = await client.createApiKey({
  name: 'Production API Key',
  walletAddress: WALLET_ADDRESS,
  permissions: ['enclaves:read', 'enclaves:write', 'tasks:read', 'logs:read']
});

console.log('API Key:', apiKey.key); // Only shown once!
console.log('Permissions:', apiKey.permissions);

// List all API keys
const keys = await client.getApiKeys(WALLET_ADDRESS);

// Update API key permissions
const updated = await client.updateApiKey({
  id: apiKey.id,
  walletAddress: WALLET_ADDRESS,
  permissions: ['enclaves:read', 'logs:read'], // Reduced permissions
  status: 'active'
});

// Revoke an API key
await client.deleteApiKey(apiKey.id, WALLET_ADDRESS);
```

## Documentation

### KYC Documentation
- **[Quick Reference](./QUICK_REFERENCE.md)** - Common use cases and examples
- **[Environment Configuration](./ENVIRONMENT_CONFIG.md)** - Complete configuration guide
- **[Setup Guide](./setup-env.sh)** - Interactive setup script
- **[KYC Examples](./examples/kyc/)** - Working code examples

### Enclave Platform Documentation
- **[Basic Usage Example](./examples/basic-usage.ts)** - Complete SDK walkthrough
- **[Compliance Integration](./examples/compliance-integration/)** - Enterprise compliance examples
- **[Production Readiness](./PRODUCTION_READINESS.md)** - Production deployment guide

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

#### KYC Examples

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

#### Enclave Platform Examples

```bash
# Complete SDK demonstration
npx tsx examples/basic-usage.ts

# Examples include:
# - Provider management
# - Enclave lifecycle (create, pause, resume, terminate)
# - Comprehensive logging
# - Docker Hub integration
# - Attestation and verification
# - Task scheduling
# - API key management
# - GitHub integration
# - Complete setup workflows
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

