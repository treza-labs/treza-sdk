# Treza Platform SDK

TypeScript/JavaScript SDK for the Treza Platform API. This SDK enables developers to manage secure enclaves, integrate GitHub repositories, and handle platform resources with wallet-based authentication.

## Features

🔐 **Enclave Management** - Create, update, delete, and manage secure enclaves  
🐙 **GitHub Integration** - OAuth flow, repository access, and branch management  
💳 **Wallet Authentication** - Secure wallet-based authentication system  
🌍 **Multi-Region Support** - Deploy enclaves across different AWS regions  
📱 **TypeScript First** - Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @treza/sdk
```

## Quick Start

```typescript
import { TrezaClient } from '@treza/sdk';

// Initialize the client
const client = new TrezaClient();
const walletAddress = '0x1234567890abcdef';

// Create an enclave
const enclave = await client.createEnclave({
  name: 'My Trading Bot',
  description: 'Secure environment for trading algorithms',
  region: 'us-east-1',
  walletAddress: walletAddress
});

console.log('Enclave created:', enclave.id);

// Get all enclaves for a wallet
const enclaves = await client.getEnclaves(walletAddress);
console.log('Total enclaves:', enclaves.length);
```

## Configuration

The `TrezaClient` accepts the following configuration options:

```typescript
const client = new TrezaClient({
  baseUrl: 'https://app.treza.xyz', // Optional: API base URL (default shown)
  timeout: 30000                    // Optional: Request timeout in ms (default: 30000)
});
```

## API Reference

### Enclave Management

#### `getEnclaves(walletAddress: string): Promise<Enclave[]>`

Retrieve all enclaves associated with a wallet address.

```typescript
const enclaves = await client.getEnclaves('0x1234567890abcdef');
console.log('Found enclaves:', enclaves.length);
```

#### `createEnclave(request: CreateEnclaveRequest): Promise<Enclave>`

Create a new secure enclave.

```typescript
const enclave = await client.createEnclave({
  name: 'ML Training Environment',
  description: 'Secure environment for model training',
  region: 'us-east-1',
  walletAddress: '0x1234567890abcdef',
  githubConnection: {
    isConnected: false
  }
});
```

#### `updateEnclave(request: UpdateEnclaveRequest): Promise<Enclave>`

Update an existing enclave.

```typescript
const updatedEnclave = await client.updateEnclave({
  id: 'enc_123456',
  walletAddress: '0x1234567890abcdef',
  description: 'Updated description',
  region: 'us-west-2'
});
```

#### `deleteEnclave(enclaveId: string, walletAddress: string): Promise<string>`

Delete an enclave.

```typescript
const message = await client.deleteEnclave('enc_123456', '0x1234567890abcdef');
console.log(message); // "Enclave deleted successfully"
```

### GitHub Integration

#### `getGitHubAuthUrl(state?: string): Promise<GitHubAuthResponse>`

Get GitHub OAuth authorization URL.

```typescript
const auth = await client.getGitHubAuthUrl('custom-state');
console.log('Visit this URL to authorize:', auth.authUrl);
```

#### `exchangeGitHubCode(request: GitHubTokenRequest): Promise<GitHubTokenResponse>`

Exchange OAuth authorization code for access token.

```typescript
const tokenResponse = await client.exchangeGitHubCode({
  code: 'authorization-code-from-callback',
  state: 'custom-state'
});

console.log('Access token:', tokenResponse.access_token);
console.log('User:', tokenResponse.user.login);
```

#### `getGitHubRepositories(accessToken: string): Promise<RepositoriesResponse>`

Get user's GitHub repositories.

```typescript
const repos = await client.getGitHubRepositories('gho_xxxxxxxxxxxxxxxxxxxx');
console.log('Repositories:', repos.repositories.length);
```

#### `getRepositoryBranches(request: GetBranchesRequest): Promise<BranchesResponse>`

Get branches for a specific repository.

```typescript
const branches = await client.getRepositoryBranches({
  accessToken: 'gho_xxxxxxxxxxxxxxxxxxxx',
  repository: 'username/repo-name'
});

console.log('Branches:', branches.branches.map(b => b.name));
```

## Usage Examples

### Complete Enclave Setup

```typescript
import { TrezaClient } from '@treza/sdk';

const client = new TrezaClient();
const walletAddress = '0x1234567890abcdef';

async function setupEnclave() {
  try {
    // Create enclave
    const enclave = await client.createEnclave({
      name: 'Data Analytics Enclave',
      description: 'Secure environment for data processing',
      region: 'us-east-1',
      walletAddress: walletAddress
    });

    console.log('✅ Enclave created:', enclave.id);
    console.log('📊 Status:', enclave.status);
    console.log('🌍 Region:', enclave.region);

    // Update enclave with GitHub integration
    const updatedEnclave = await client.updateEnclave({
      id: enclave.id,
      walletAddress: walletAddress,
      githubConnection: {
        isConnected: true,
        selectedRepo: 'myorg/data-analytics',
        selectedBranch: 'main'
      }
    });

    console.log('🔗 GitHub connected:', updatedEnclave.githubConnection?.selectedRepo);

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupEnclave();
```

### GitHub OAuth Flow

```typescript
import { TrezaClient } from '@treza/sdk';

const client = new TrezaClient();

async function handleGitHubAuth() {
  try {
    // Step 1: Get authorization URL
    const auth = await client.getGitHubAuthUrl();
    console.log('🔗 Authorize GitHub access at:', auth.authUrl);
    
    // Step 2: User visits URL and authorizes
    // Step 3: Handle the callback (you'll get the code)
    const code = 'code-from-callback'; // This comes from your OAuth callback
    
    // Step 4: Exchange code for token
    const tokenResponse = await client.exchangeGitHubCode({ code });
    console.log('✅ GitHub authenticated for user:', tokenResponse.user.login);
    
    // Step 5: Use token to access repositories
    const repos = await client.getGitHubRepositories(tokenResponse.access_token);
    console.log('📚 Available repositories:');
    repos.repositories.forEach(repo => {
      console.log(`  - ${repo.fullName} (${repo.language || 'No language'})`);
    });

  } catch (error) {
    console.error('❌ GitHub auth failed:', error);
  }
}
```

### Repository and Branch Management

```typescript
async function manageRepository() {
  const accessToken = 'gho_xxxxxxxxxxxxxxxxxxxx';
  
  try {
    // Get repositories
    const repos = await client.getGitHubRepositories(accessToken);
    const selectedRepo = repos.repositories[0];
    
    console.log('📊 Selected repository:', selectedRepo.fullName);
    console.log('🔒 Private:', selectedRepo.private);
    console.log('⭐ Language:', selectedRepo.language);
    
    // Get branches for selected repository
    const branches = await client.getRepositoryBranches({
      accessToken: accessToken,
      repository: selectedRepo.fullName
    });
    
    console.log('🌿 Available branches:');
    branches.branches.forEach(branch => {
      console.log(`  - ${branch.name} (${branch.commit.sha.substring(0, 7)})`);
    });
    
  } catch (error) {
    console.error('❌ Repository management failed:', error);
  }
}
```

### Error Handling

```typescript
import { TrezaSdkError } from '@treza/sdk';

async function handleErrors() {
  try {
    const enclaves = await client.getEnclaves('invalid-wallet');
  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('🚨 Treza SDK Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details
      });
      
      // Handle specific error types
      if (error.statusCode === 400) {
        console.log('💡 Tip: Check your wallet address format');
      } else if (error.statusCode === 404) {
        console.log('💡 Tip: Enclave not found or access denied');
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}
```

## TypeScript Support

The SDK is built with TypeScript and exports comprehensive type definitions:

```typescript
import {
  // Core types
  TrezaConfig,
  Enclave,
  GitHubConnection,
  
  // Request/Response types
  CreateEnclaveRequest,
  UpdateEnclaveRequest,
  EnclaveResponse,
  EnclavesResponse,
  
  // GitHub types
  GitHubUser,
  Repository,
  Branch,
  GitHubAuthResponse,
  GitHubTokenResponse,
  
  // Utility types
  ApiError,
  TrezaSdkError
} from '@treza/sdk';
```

## Environment Variables

For development and testing, you can set these environment variables:

```bash
# Optional: Custom API endpoint
TREZA_BASE_URL=https://app.treza.xyz

# For examples: Your wallet address
WALLET_ADDRESS=0x1234567890abcdef

# For GitHub integration examples
GITHUB_ACCESS_TOKEN=gho_xxxxxxxxxxxxxxxxxxxx
```

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Examples

Check out the comprehensive examples in the [`examples/`](./examples/) directory:

- **Basic Usage** (`examples/basic-usage.ts`) - Complete examples of all SDK functionality
- **Enclave Management** - Creating, updating, and managing enclaves
- **GitHub Integration** - OAuth flow and repository management
- **Error Handling** - Proper error handling patterns

Run the examples:

```bash
# Set your environment variables first
export WALLET_ADDRESS=0x1234567890abcdef
export GITHUB_ACCESS_TOKEN=gho_xxxxxxxxxxxxxxxxxxxx

# Run the examples
npx ts-node examples/basic-usage.ts
```

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- 📖 **Documentation**: [docs.treza.xyz](https://docs.treza.xyz)
- 🐛 **Issues**: [GitHub Issues](https://github.com/treza-labs/treza-sdk/issues)

## About Treza

Treza provides secure enclave infrastructure for decentralized applications, enabling developers to build with confidence in secure, verifiable execution environments.

---

**⭐ Star this repository if you find it helpful!** 