# Treza Platform SDK

TypeScript/JavaScript SDK for the Treza Platform API. This SDK enables developers to manage secure enclaves, integrate GitHub repositories, and handle platform resources with wallet-based authentication.

## Features

🔐 **Enclave Management** - Create, update, delete, and manage secure enclaves  
⏸️ **Lifecycle Control** - Pause, resume, and terminate enclaves with real-time status tracking  
📜 **Comprehensive Logs** - Access application, deployment, and error logs from all sources  
🐳 **Docker Integration** - Search Docker Hub and browse image tags  
🏗️ **Provider System** - Support for multiple enclave providers (AWS Nitro, etc.)  
⚙️ **Task Scheduling** - Create and manage scheduled tasks within enclaves  
🔑 **API Key Management** - Generate and manage API keys with fine-grained permissions  
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
const walletAddress = '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB';

// Get available providers
const providers = await client.getProviders();

// Create an enclave
const enclave = await client.createEnclave({
  name: 'My Trading Bot',
  description: 'Secure environment for trading algorithms',
  region: 'us-east-1',
  walletAddress: walletAddress,
  providerId: providers[0].id, // Use the first available provider
  providerConfig: {
    dockerImage: 'trading-bot:latest',
    cpuCount: 2,
    memoryMiB: 512
  }
});

console.log('Enclave created:', enclave.id);
console.log('Status:', enclave.status); // PENDING_DEPLOY, DEPLOYING, DEPLOYED, etc.

// 🆕 NEW: Manage enclave lifecycle
if (enclave.status === 'DEPLOYED') {
  // Pause the enclave
  const pausedEnclave = await client.pauseEnclave(enclave.id, walletAddress);
  console.log('Enclave paused:', pausedEnclave.enclave.status); // PAUSING
  
  // Resume the enclave
  const resumedEnclave = await client.resumeEnclave(enclave.id, walletAddress);
  console.log('Enclave resumed:', resumedEnclave.enclave.status); // RESUMING
}

// 🆕 NEW: Get comprehensive logs
const logs = await client.getEnclaveLogs(enclave.id, 'application');
console.log('Application logs:', logs.logs.application?.length || 0);

// 🆕 NEW: Search Docker Hub
const dockerImages = await client.searchDockerImages('hello-world');
console.log('Found', dockerImages.results.length, 'Docker images');

// Get all enclaves for a wallet
const enclaves = await client.getEnclaves(walletAddress);
console.log('Total enclaves:', enclaves.length);
```

## Configuration

The `TrezaClient` accepts the following configuration options:

```typescript
const client = new TrezaClient({
  baseUrl: 'https://app.trezalabs.com', // Optional: API base URL (default shown)
  timeout: 30000                    // Optional: Request timeout in ms (default: 30000)
});
```

## API Reference

### Provider Management

#### `getProviders(): Promise<Provider[]>`

Retrieve all available enclave providers.

```typescript
const providers = await client.getProviders();
console.log('Available providers:', providers.length);
providers.forEach(provider => {
  console.log(`- ${provider.name} (${provider.id})`);
  console.log(`  Regions: ${provider.regions.join(', ')}`);
});
```

#### `getProvider(providerId: string): Promise<Provider>`

Get details for a specific provider.

```typescript
const provider = await client.getProvider('aws-nitro');
console.log('Provider:', provider.name);
console.log('Config schema:', provider.configSchema);
```

### Enclave Management

#### `getEnclaves(walletAddress: string): Promise<Enclave[]>`

Retrieve all enclaves associated with a wallet address.

```typescript
const enclaves = await client.getEnclaves('0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB');
console.log('Found enclaves:', enclaves.length);
```

#### `createEnclave(request: CreateEnclaveRequest): Promise<Enclave>`

Create a new secure enclave.

```typescript
const enclave = await client.createEnclave({
  name: 'ML Training Environment',
  description: 'Secure environment for model training',
  region: 'us-east-1',
  walletAddress: '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB',
  providerId: 'aws-nitro',
  providerConfig: {
    dockerImage: 'ml-training:latest',
    cpuCount: 4,
    memoryMiB: 2048
  },
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
  walletAddress: '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB',
  description: 'Updated description',
  region: 'us-west-2',
  providerConfig: {
    dockerImage: 'ml-training:v2',
    cpuCount: 8,
    memoryMiB: 4096
  }
});
```

#### `deleteEnclave(enclaveId: string, walletAddress: string): Promise<string>`

Delete an enclave.

```typescript
const message = await client.deleteEnclave('enc_123456', '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB');
console.log(message); // "Enclave deleted successfully"
```

### 🆕 Enclave Lifecycle Management

#### `getEnclave(enclaveId: string): Promise<Enclave>`

Get details for a specific enclave.

```typescript
const enclave = await client.getEnclave('enc_123456');
console.log('Enclave status:', enclave.status);
console.log('Enclave region:', enclave.region);
```

#### `pauseEnclave(enclaveId: string, walletAddress: string): Promise<EnclaveLifecycleResponse>`

Pause a running enclave.

```typescript
const result = await client.pauseEnclave('enc_123456', '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB');
console.log('Message:', result.message);
console.log('New status:', result.enclave.status); // PAUSING
```

#### `resumeEnclave(enclaveId: string, walletAddress: string): Promise<EnclaveLifecycleResponse>`

Resume a paused enclave.

```typescript
const result = await client.resumeEnclave('enc_123456', '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB');
console.log('Message:', result.message);
console.log('New status:', result.enclave.status); // RESUMING
```

#### `terminateEnclave(enclaveId: string, walletAddress: string): Promise<EnclaveLifecycleResponse>`

Terminate an enclave (this will destroy the enclave).

```typescript
const result = await client.terminateEnclave('enc_123456', '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB');
console.log('Message:', result.message);
console.log('New status:', result.enclave.status); // PENDING_DESTROY
```

### 🆕 Enclave Logs

#### `getEnclaveLogs(enclaveId: string, logType?: string, limit?: number): Promise<LogsResponse>`

Get logs for an enclave from various sources.

```typescript
// Get all logs
const allLogs = await client.getEnclaveLogs('enc_123456', 'all', 100);
console.log('Available log types:', Object.keys(allLogs.logs));

// Get only application logs
const appLogs = await client.getEnclaveLogs('enc_123456', 'application', 50);
const applicationLogs = appLogs.logs.application || [];
console.log('Application log entries:', applicationLogs.length);

// Get only error logs
const errorLogs = await client.getEnclaveLogs('enc_123456', 'errors', 20);
const errors = errorLogs.logs.errors || [];
console.log('Error entries:', errors.length);

// Available log types: 'all', 'ecs', 'stepfunctions', 'lambda', 'application', 'errors'
```

### Task Management

#### `getTasks(walletAddress: string): Promise<Task[]>`

Retrieve all tasks associated with a wallet address.

```typescript
const tasks = await client.getTasks('0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB');
console.log('Found tasks:', tasks.length);
```

#### `createTask(request: CreateTaskRequest): Promise<Task>`

Create a new scheduled task.

```typescript
const task = await client.createTask({
  name: 'Daily Price Monitor',
  description: 'Monitor cryptocurrency prices and send alerts',
  enclaveId: 'enc_123456',
  schedule: '0 9 * * *', // Every day at 9 AM
  walletAddress: '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB'
});
```

#### `updateTask(request: UpdateTaskRequest): Promise<Task>`

Update an existing task.

```typescript
const updatedTask = await client.updateTask({
  id: 'task_123456',
  walletAddress: '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB',
  schedule: '0 */6 * * *', // Every 6 hours
  status: 'running'
});
```

#### `deleteTask(taskId: string, walletAddress: string): Promise<string>`

Delete a task.

```typescript
const message = await client.deleteTask('task_123456', '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB');
console.log(message); // "Task deleted successfully"
```

### API Key Management

#### `getApiKeys(walletAddress: string): Promise<ApiKey[]>`

Retrieve all API keys associated with a wallet address.

```typescript
const apiKeys = await client.getApiKeys('0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB');
console.log('Found API keys:', apiKeys.length);
```

#### `createApiKey(request: CreateApiKeyRequest): Promise<ApiKey>`

Create a new API key with specified permissions.

```typescript
const apiKey = await client.createApiKey({
  name: 'Production API Key',
  permissions: ['enclaves:read', 'tasks:read', 'logs:read'],
  walletAddress: '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB'
});
console.log('API Key created:', apiKey.key); // Only shown on creation
```

#### `updateApiKey(request: UpdateApiKeyRequest): Promise<ApiKey>`

Update an existing API key.

```typescript
const updatedApiKey = await client.updateApiKey({
  id: 'key_123456',
  walletAddress: '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB',
  permissions: ['enclaves:read', 'enclaves:write', 'tasks:read'],
  status: 'active'
});
```

#### `deleteApiKey(apiKeyId: string, walletAddress: string): Promise<string>`

Delete an API key.

```typescript
const message = await client.deleteApiKey('key_123456', '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB');
console.log(message); // "API key deleted successfully"
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

### 🆕 Docker Hub Integration

#### `searchDockerImages(query: string): Promise<DockerSearchResponse>`

Search Docker Hub for container images.

```typescript
const searchResults = await client.searchDockerImages('hello-world');
console.log('Found images:', searchResults.count);

searchResults.results.forEach(image => {
  console.log(`- ${image.name}: ${image.description}`);
  console.log(`  ⭐ ${image.stars} stars, Official: ${image.official}`);
});
```

#### `getDockerTags(repository: string): Promise<DockerTagsResponse>`

Get available tags for a specific Docker repository.

```typescript
const tags = await client.getDockerTags('library/node');
console.log('Available tags:', tags.tags.length);

tags.tags.slice(0, 5).forEach(tag => {
  const sizeMB = (tag.size / (1024 * 1024)).toFixed(1);
  console.log(`- ${tag.name} (${sizeMB}MB, updated: ${tag.lastUpdated})`);
});
```

## Usage Examples

### Complete Enclave Setup

```typescript
import { TrezaClient } from '@treza/sdk';

const client = new TrezaClient();
const walletAddress = '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB';

async function setupEnclave() {
  try {
    // Get available providers
    const providers = await client.getProviders();
    console.log('🏗️  Available providers:', providers.length);

    // Create enclave
    const enclave = await client.createEnclave({
      name: 'Data Analytics Enclave',
      description: 'Secure environment for data processing',
      region: 'us-east-1',
      walletAddress: walletAddress,
      providerId: providers[0].id,
      providerConfig: {
        dockerImage: 'analytics:latest',
        cpuCount: 4,
        memoryMiB: 2048
      }
    });

    console.log('✅ Enclave created:', enclave.id);
    console.log('📊 Status:', enclave.status);
    console.log('🌍 Region:', enclave.region);
    console.log('🏗️  Provider:', enclave.providerId);

    // Create a scheduled task
    const task = await client.createTask({
      name: 'Data Processing Task',
      description: 'Process data files every hour',
      enclaveId: enclave.id,
      schedule: '0 * * * *', // Every hour
      walletAddress: walletAddress
    });

    console.log('⚙️  Task created:', task.id);

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
  Provider,
  Task,
  ApiKey,
  GitHubConnection,
  
  // Request/Response types
  CreateEnclaveRequest,
  UpdateEnclaveRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  EnclaveResponse,
  EnclavesResponse,
  ProviderResponse,
  ProvidersResponse,
  TaskResponse,
  TasksResponse,
  ApiKeyResponse,
  ApiKeysResponse,
  
  // 🆕 NEW: Lifecycle management types
  EnclaveLifecycleRequest,
  EnclaveLifecycleResponse,
  
  // 🆕 NEW: Logs types
  LogEntry,
  LogsResponse,
  
  // 🆕 NEW: Docker types
  DockerImage,
  DockerTag,
  DockerSearchResponse,
  DockerTagsResponse,
  
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
TREZA_BASE_URL=https://app.trezalabs.com

# For examples: Your wallet address
WALLET_ADDRESS=0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB

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
- **Provider Management** - Discovering and using enclave providers
- **Enclave Management** - Creating, updating, and managing enclaves with provider configuration
- **Task Management** - Creating and scheduling tasks within enclaves
- **API Key Management** - Generating and managing API keys with permissions
- **GitHub Integration** - OAuth flow and repository management
- **Error Handling** - Proper error handling patterns

Run the examples:

```bash
# Set your environment variables first
export WALLET_ADDRESS=0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB
export GITHUB_ACCESS_TOKEN=gho_xxxxxxxxxxxxxxxxxxxx

# Run the examples
npx ts-node examples/basic-usage.ts
```

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- 📖 **Documentation**: [docs.trezalabs.com](https://docs.trezalabs.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/treza-labs/treza-sdk/issues)

## About Treza

Treza provides secure enclave infrastructure for decentralized applications, enabling developers to build with confidence in secure, verifiable execution environments.

---

**⭐ Star this repository if you find it helpful!** 