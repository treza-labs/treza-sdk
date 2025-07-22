import { TrezaClient, TrezaSdkError } from '../src';

// Example wallet address (replace with your actual wallet)
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB';

// Example: Provider Management
async function providerManagementExample() {
  const client = new TrezaClient({
    baseUrl: process.env.TREZA_BASE_URL, // Optional: defaults to https://app.trezalabs.com
  });

  try {
    console.log('🔍 Getting available providers...');
    
    // Get all available providers
    const providers = await client.getProviders();
    console.log(`📋 Found ${providers.length} available providers`);
    
    if (providers.length > 0) {
      console.log('🏗️  Available providers:');
      providers.forEach(provider => {
        console.log(`  - ${provider.name} (${provider.id})`);
        console.log(`    Description: ${provider.description}`);
        console.log(`    Regions: ${provider.regions.join(', ')}`);
      });

      // Get details for a specific provider
      const firstProvider = providers[0];
      console.log(`\n📊 Getting details for provider: ${firstProvider.id}`);
      
      const providerDetails = await client.getProvider(firstProvider.id);
      console.log(`✅ Provider details retrieved:`);
      console.log(`   Name: ${providerDetails.name}`);
      console.log(`   Available regions: ${providerDetails.regions.join(', ')}`);
      console.log(`   Config schema keys: ${Object.keys(providerDetails.configSchema).join(', ')}`);
    }

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Provider Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      });
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Example: Enclave Management
async function enclaveManagementExample() {
  const client = new TrezaClient({
    baseUrl: process.env.TREZA_BASE_URL, // Optional: defaults to https://app.trezalabs.com
  });

  try {
    console.log('🔍 Getting existing enclaves...');
    
    // Get all enclaves for the wallet
    const enclaves = await client.getEnclaves(WALLET_ADDRESS);
    console.log(`📋 Found ${enclaves.length} existing enclaves`);
    
    if (enclaves.length > 0) {
      console.log('📊 Existing enclaves:');
      enclaves.forEach(enclave => {
        console.log(`  - ${enclave.name} (${enclave.id}) - Status: ${enclave.status}`);
        console.log(`    Provider: ${enclave.providerId}, Region: ${enclave.region}`);
      });
    }

    // Get available providers first
    const providers = await client.getProviders();
    if (providers.length === 0) {
      console.log('⚠️  No providers available - skipping enclave creation');
      return;
    }

    const defaultProvider = providers[0];
    console.log(`\n🚀 Creating a new enclave with provider: ${defaultProvider.id}...`);
    
    // Create a new enclave
    const newEnclave = await client.createEnclave({
      name: 'Trading Bot Enclave',
      description: 'Secure environment for automated trading strategies',
      region: 'us-east-1',
      walletAddress: WALLET_ADDRESS,
      providerId: defaultProvider.id,
      providerConfig: {
        dockerImage: 'trading-bot:latest',
        cpuCount: 2,
        memoryMiB: 512
      },
      githubConnection: {
        isConnected: false
      }
    });

    console.log('✅ Enclave created successfully!');
    console.log(`📋 Enclave ID: ${newEnclave.id}`);
    console.log(`📊 Status: ${newEnclave.status}`);
    console.log(`🌍 Region: ${newEnclave.region}`);
    console.log(`🏗️  Provider: ${newEnclave.providerId}`);

    console.log('\n📝 Updating enclave...');
    
    // Update the enclave
    const updatedEnclave = await client.updateEnclave({
      id: newEnclave.id,
      walletAddress: WALLET_ADDRESS,
      description: 'Updated: Advanced trading strategies with ML capabilities',
      region: 'us-west-2',
      providerConfig: {
        dockerImage: 'trading-bot:v2',
        cpuCount: 4,
        memoryMiB: 1024
      }
    });

    console.log('✅ Enclave updated successfully!');
    console.log(`📝 New description: ${updatedEnclave.description}`);
    console.log(`🌍 New region: ${updatedEnclave.region}`);
    console.log(`⚙️  Updated config: ${JSON.stringify(updatedEnclave.providerConfig, null, 2)}`);

    // Note: Uncomment to delete the enclave
    // console.log('\n🗑️ Deleting enclave...');
    // const deleteMessage = await client.deleteEnclave(newEnclave.id, WALLET_ADDRESS);
    // console.log(`✅ ${deleteMessage}`);

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Treza SDK Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      });
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Example: Task Management
async function taskManagementExample() {
  const client = new TrezaClient();

  try {
    console.log('🔍 Getting existing tasks...');
    
    // Get all tasks for the wallet
    const tasks = await client.getTasks(WALLET_ADDRESS);
    console.log(`📋 Found ${tasks.length} existing tasks`);
    
    if (tasks.length > 0) {
      console.log('📊 Existing tasks:');
      tasks.forEach(task => {
        console.log(`  - ${task.name} (${task.id}) - Status: ${task.status}`);
        console.log(`    Schedule: ${task.schedule}, Enclave: ${task.enclaveId}`);
      });
    }

    // Get enclaves first to use for task creation
    const enclaves = await client.getEnclaves(WALLET_ADDRESS);
    if (enclaves.length === 0) {
      console.log('⚠️  No enclaves available - skipping task creation');
      return;
    }

    const targetEnclave = enclaves[0];
    console.log(`\n🚀 Creating a new task for enclave: ${targetEnclave.id}...`);
    
    // Create a new task
    const newTask = await client.createTask({
      name: 'Daily Price Monitor',
      description: 'Monitor cryptocurrency prices and send alerts',
      enclaveId: targetEnclave.id,
      schedule: '0 9 * * *', // Every day at 9 AM
      walletAddress: WALLET_ADDRESS
    });

    console.log('✅ Task created successfully!');
    console.log(`📋 Task ID: ${newTask.id}`);
    console.log(`📊 Status: ${newTask.status}`);
    console.log(`⏰ Schedule: ${newTask.schedule}`);
    console.log(`🔗 Enclave: ${newTask.enclaveId}`);

    console.log('\n📝 Updating task...');
    
    // Update the task
    const updatedTask = await client.updateTask({
      id: newTask.id,
      walletAddress: WALLET_ADDRESS,
      description: 'Updated: Monitor crypto prices with ML-based alerts',
      schedule: '0 */6 * * *', // Every 6 hours
      status: 'running'
    });

    console.log('✅ Task updated successfully!');
    console.log(`📝 New description: ${updatedTask.description}`);
    console.log(`⏰ New schedule: ${updatedTask.schedule}`);
    console.log(`▶️  Status: ${updatedTask.status}`);

    // Note: Uncomment to delete the task
    // console.log('\n🗑️ Deleting task...');
    // const deleteMessage = await client.deleteTask(newTask.id, WALLET_ADDRESS);
    // console.log(`✅ ${deleteMessage}`);

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Task Management Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      });
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Example: API Key Management
async function apiKeyManagementExample() {
  const client = new TrezaClient();

  try {
    console.log('🔍 Getting existing API keys...');
    
    // Get all API keys for the wallet
    const apiKeys = await client.getApiKeys(WALLET_ADDRESS);
    console.log(`📋 Found ${apiKeys.length} existing API keys`);
    
    if (apiKeys.length > 0) {
      console.log('📊 Existing API keys:');
      apiKeys.forEach(key => {
        console.log(`  - ${key.name} (${key.id}) - Status: ${key.status}`);
        console.log(`    Permissions: ${key.permissions.join(', ')}`);
        console.log(`    Created: ${key.createdAt}`);
      });
    }

    console.log('\n🚀 Creating a new API key...');
    
    // Create a new API key
    const newApiKey = await client.createApiKey({
      name: 'Production API Key',
      permissions: ['enclaves:read', 'tasks:read', 'logs:read'],
      walletAddress: WALLET_ADDRESS
    });

    console.log('✅ API key created successfully!');
    console.log(`📋 API Key ID: ${newApiKey.id}`);
    console.log(`🔑 Key: ${newApiKey.key || 'Hidden for security'}`);
    console.log(`📊 Status: ${newApiKey.status}`);
    console.log(`🔒 Permissions: ${newApiKey.permissions.join(', ')}`);

    console.log('\n📝 Updating API key...');
    
    // Update the API key
    const updatedApiKey = await client.updateApiKey({
      id: newApiKey.id,
      walletAddress: WALLET_ADDRESS,
      name: 'Updated Production API Key',
      permissions: ['enclaves:read', 'enclaves:write', 'tasks:read', 'tasks:write'],
      status: 'active'
    });

    console.log('✅ API key updated successfully!');
    console.log(`📝 New name: ${updatedApiKey.name}`);
    console.log(`🔒 New permissions: ${updatedApiKey.permissions.join(', ')}`);
    console.log(`▶️  Status: ${updatedApiKey.status}`);

    // Note: Uncomment to delete the API key
    // console.log('\n🗑️ Deleting API key...');
    // const deleteMessage = await client.deleteApiKey(newApiKey.id, WALLET_ADDRESS);
    // console.log(`✅ ${deleteMessage}`);

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ API Key Management Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      });
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Example: GitHub Integration
async function githubIntegrationExample() {
  const client = new TrezaClient();

  try {
    console.log('🔗 Starting GitHub OAuth flow...');
    
    // Get GitHub OAuth URL
    const authResponse = await client.getGitHubAuthUrl('example-state-123');
    console.log('📋 OAuth URL generated');
    console.log(`🔗 Visit: ${authResponse.authUrl}`);
    console.log(`🎫 State: ${authResponse.state}`);

    // Note: In a real application, you would redirect the user to the OAuth URL
    // and handle the callback to get the authorization code
    
    console.log('\n💡 To complete this example:');
    console.log('1. Visit the OAuth URL above');
    console.log('2. Authorize the application');
    console.log('3. Get the authorization code from the callback');
    console.log('4. Use exchangeGitHubCode() to get the access token');

    // Example of exchanging code for token (you'll need a real code)
    // const tokenResponse = await client.exchangeGitHubCode({
    //   code: 'your-oauth-code-here',
    //   state: 'example-state-123'
    // });
    // console.log('✅ Access token obtained:', tokenResponse.access_token);
    // console.log('👤 User:', tokenResponse.user.login);

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ GitHub OAuth Error:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Example: Repository Management (requires GitHub access token)
async function repositoryManagementExample() {
  const client = new TrezaClient();
  const accessToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!accessToken) {
    console.log('⚠️  Skipping repository example - GITHUB_ACCESS_TOKEN not provided');
    console.log('💡 Set GITHUB_ACCESS_TOKEN environment variable to run this example');
    return;
  }

  try {
    console.log('📚 Fetching GitHub repositories...');
    
    // Get user repositories
    const reposResponse = await client.getGitHubRepositories(accessToken);
    console.log(`📋 Found ${reposResponse.repositories.length} repositories`);

    if (reposResponse.repositories.length > 0) {
      const firstRepo = reposResponse.repositories[0];
      console.log(`📊 First repository: ${firstRepo.fullName}`);
      console.log(`📝 Description: ${firstRepo.description || 'No description'}`);
      console.log(`🔒 Private: ${firstRepo.private}`);
      console.log(`🌟 Language: ${firstRepo.language || 'Not specified'}`);

      console.log('\n🌿 Fetching branches...');
      
      // Get branches for the first repository
      const branchesResponse = await client.getRepositoryBranches({
        accessToken: accessToken,
        repository: firstRepo.fullName
      });

      console.log(`📋 Found ${branchesResponse.branches.length} branches:`);
      branchesResponse.branches.forEach(branch => {
        console.log(`  - ${branch.name} (${branch.commit.sha.substring(0, 7)})`);
      });
    }

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Repository Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      });
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Example: Complete enclave setup with GitHub integration
async function completeSetupExample() {
  const client = new TrezaClient();
  const accessToken = process.env.GITHUB_ACCESS_TOKEN;

  if (!accessToken) {
    console.log('⚠️  Skipping complete setup - GITHUB_ACCESS_TOKEN not provided');
    return;
  }

  try {
    console.log('🔧 Complete enclave setup with GitHub integration...');

    // Get available providers
    const providers = await client.getProviders();
    if (providers.length === 0) {
      console.log('⚠️  No providers available - skipping complete setup');
      return;
    }

    const defaultProvider = providers[0];

    // 1. Create enclave with GitHub connection
    const enclave = await client.createEnclave({
      name: 'ML Training Enclave',
      description: 'Secure environment for machine learning model training',
      region: 'us-east-1',
      walletAddress: WALLET_ADDRESS,
      providerId: defaultProvider.id,
      providerConfig: {
        dockerImage: 'ml-training:latest',
        cpuCount: 4,
        memoryMiB: 2048
      },
      githubConnection: {
        isConnected: true,
        accessToken: accessToken,
        selectedRepo: 'username/ml-project', // Replace with actual repo
        selectedBranch: 'main'
      }
    });

    console.log('✅ Enclave created with GitHub integration!');
    console.log(`📋 Enclave: ${enclave.name} (${enclave.id})`);
    console.log(`🏗️  Provider: ${enclave.providerId}`);
    
    if (enclave.githubConnection?.isConnected) {
      console.log(`🔗 Connected to: ${enclave.githubConnection.selectedRepo}`);
      console.log(`🌿 Branch: ${enclave.githubConnection.selectedBranch}`);
    }

    // 2. Create a task for the enclave
    const task = await client.createTask({
      name: 'ML Model Training',
      description: 'Automated machine learning model training pipeline',
      enclaveId: enclave.id,
      schedule: '0 2 * * *', // Every day at 2 AM
      walletAddress: WALLET_ADDRESS
    });

    console.log(`✅ Task created: ${task.name} (${task.id})`);
    console.log(`⏰ Schedule: ${task.schedule}`);

    // 3. Create an API key for monitoring
    const apiKey = await client.createApiKey({
      name: 'ML Pipeline Monitor',
      permissions: ['enclaves:read', 'tasks:read', 'logs:read'],
      walletAddress: WALLET_ADDRESS
    });

    console.log(`✅ API key created: ${apiKey.name} (${apiKey.id})`);
    console.log(`🔒 Permissions: ${apiKey.permissions.join(', ')}`);

    console.log('\n🎉 Complete setup finished!');
    console.log(`📋 Enclave: ${enclave.id}`);
    console.log(`⚙️  Task: ${task.id}`);
    console.log(`🔑 API Key: ${apiKey.id}`);

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Setup Error:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Run examples
if (require.main === module) {
  console.log('=== Treza Platform SDK Examples ===\n');
  
  providerManagementExample()
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return enclaveManagementExample();
    })
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return taskManagementExample();
    })
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return apiKeyManagementExample();
    })
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return githubIntegrationExample();
    })
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return repositoryManagementExample();
    })
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return completeSetupExample();
    })
    .then(() => {
      console.log('\n🎉 All examples completed!');
      console.log('\n💡 Tips:');
      console.log('- Set WALLET_ADDRESS environment variable for enclave operations');
      console.log('- Set GITHUB_ACCESS_TOKEN environment variable for GitHub integration');
      console.log('- Set TREZA_BASE_URL environment variable to use a different API endpoint');
    })
    .catch(console.error);
} 