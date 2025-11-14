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

// Example: NEW - Enclave Lifecycle Management
async function enclaveLifecycleExample() {
  const client = new TrezaClient();

  try {
    console.log('🔍 Getting deployed enclaves for lifecycle management...');
    
    // Get all enclaves
    const enclaves = await client.getEnclaves(WALLET_ADDRESS);
    const deployedEnclaves = enclaves.filter(e => e.status === 'DEPLOYED');
    
    if (deployedEnclaves.length === 0) {
      console.log('⚠️  No deployed enclaves found - skipping lifecycle example');
      return;
    }

    const targetEnclave = deployedEnclaves[0];
    console.log(`🎯 Target enclave: ${targetEnclave.name} (${targetEnclave.id})`);
    console.log(`📊 Current status: ${targetEnclave.status}`);

    // 1. Pause the enclave
    console.log('\n⏸️  Pausing enclave...');
    const pausedResult = await client.pauseEnclave(targetEnclave.id, WALLET_ADDRESS);
    console.log(`✅ ${pausedResult.message}`);
    console.log(`📊 New status: ${pausedResult.enclave.status}`);

    // 2. Resume the enclave (after a short delay for demo)
    console.log('\n▶️  Resuming enclave...');
    const resumedResult = await client.resumeEnclave(targetEnclave.id, WALLET_ADDRESS);
    console.log(`✅ ${resumedResult.message}`);
    console.log(`📊 New status: ${resumedResult.enclave.status}`);

    // 3. Terminate the enclave (commented out for safety)
    console.log('\n💡 To terminate an enclave:');
    console.log(`   await client.terminateEnclave('${targetEnclave.id}', '${WALLET_ADDRESS}');`);
    
    // Uncomment below to actually terminate (WARNING: This will destroy the enclave!)
    // console.log('\n🛑 Terminating enclave...');
    // const terminatedResult = await client.terminateEnclave(targetEnclave.id, WALLET_ADDRESS);
    // console.log(`✅ ${terminatedResult.message}`);
    // console.log(`📊 New status: ${terminatedResult.enclave.status}`);

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Lifecycle Management Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      });
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Example: NEW - Enclave Logs Management
async function enclaveLogsExample() {
  const client = new TrezaClient();

  try {
    console.log('📋 Getting enclaves for log viewing...');
    
    // Get all enclaves
    const enclaves = await client.getEnclaves(WALLET_ADDRESS);
    
    if (enclaves.length === 0) {
      console.log('⚠️  No enclaves found - skipping logs example');
      return;
    }

    const targetEnclave = enclaves[0];
    console.log(`🎯 Viewing logs for: ${targetEnclave.name} (${targetEnclave.id})`);

    // 1. Get all logs
    console.log('\n📜 Fetching all logs...');
    const allLogs = await client.getEnclaveLogs(targetEnclave.id, 'all', 50);
    console.log(`📊 Enclave: ${allLogs.enclave_name} (Status: ${allLogs.enclave_status})`);
    console.log(`📦 Available log types: ${Object.keys(allLogs.logs).join(', ')}`);

    // Display log counts
    Object.entries(allLogs.logs).forEach(([type, logs]) => {
      if (logs && logs.length > 0) {
        console.log(`  📋 ${type}: ${logs.length} entries`);
      }
    });

    // 2. Get application logs specifically
    console.log('\n📱 Fetching application logs...');
    const appLogs = await client.getEnclaveLogs(targetEnclave.id, 'application', 20);
    const applicationLogs = appLogs.logs.application || [];
    
    if (applicationLogs.length > 0) {
      console.log(`📋 Latest ${applicationLogs.length} application log entries:`);
      applicationLogs.slice(0, 5).forEach((log, i) => {
        const time = new Date(log.timestamp).toISOString();
        console.log(`  ${i + 1}. [${time}] ${log.message.substring(0, 100)}...`);
      });
    } else {
      console.log('📋 No application logs found');
    }

    // 3. Get error logs
    console.log('\n🚨 Fetching error logs...');
    const errorLogs = await client.getEnclaveLogs(targetEnclave.id, 'errors', 10);
    const errors = errorLogs.logs.errors || [];
    
    if (errors.length > 0) {
      console.log(`🚨 Found ${errors.length} error entries:`);
      errors.slice(0, 3).forEach((log, i) => {
        const time = new Date(log.timestamp).toISOString();
        console.log(`  ${i + 1}. [${time}] ${log.source}: ${log.message.substring(0, 80)}...`);
      });
    } else {
      console.log('✅ No errors found');
    }

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Logs Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      });
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Example: NEW - Docker Hub Integration
async function dockerSearchExample() {
  const client = new TrezaClient();

  try {
    console.log('🐳 Searching Docker Hub for images...');
    
    // 1. Search for hello-world images
    console.log('\n🔍 Searching for "hello-world" images...');
    const helloWorldResults = await client.searchDockerImages('hello-world');
    console.log(`📋 Found ${helloWorldResults.count} total results`);
    console.log(`📦 Showing first ${helloWorldResults.results.length} results:`);
    
    helloWorldResults.results.slice(0, 3).forEach((image, i) => {
      console.log(`  ${i + 1}. ${image.name}`);
      console.log(`     📝 ${image.description.substring(0, 80)}...`);
      console.log(`     ⭐ ${image.stars} stars, Official: ${image.official ? '✅' : '❌'}`);
    });

    // 2. Search for Node.js images
    console.log('\n🔍 Searching for "node" images...');
    const nodeResults = await client.searchDockerImages('node');
    console.log(`📋 Found ${nodeResults.count} total results`);
    
    const officialNode = nodeResults.results.find(img => img.official && img.name.includes('node'));
    if (officialNode) {
      console.log(`🎯 Official Node.js image found: ${officialNode.name}`);
      console.log(`   📝 ${officialNode.description}`);
      console.log(`   ⭐ ${officialNode.stars} stars`);

      // 3. Get tags for official Node.js image
      console.log('\n🏷️  Fetching tags for Node.js image...');
      try {
        const nodeTags = await client.getDockerTags(officialNode.name);
        console.log(`📋 Found ${nodeTags.tags.length} tags:`);
        
        // Show latest, LTS, and alpine tags
        const interestingTags = nodeTags.tags.filter(tag => 
          ['latest', 'lts', 'alpine'].some(keyword => 
            tag.name.includes(keyword)
          )
        ).slice(0, 5);
        
        if (interestingTags.length > 0) {
          console.log('🎯 Popular tags:');
          interestingTags.forEach(tag => {
            const sizeMB = (tag.size / (1024 * 1024)).toFixed(1);
            const updated = new Date(tag.lastUpdated).toLocaleDateString();
            console.log(`   📦 ${tag.name} (${sizeMB}MB, updated: ${updated})`);
          });
        }
      } catch (tagError) {
        console.log(`⚠️  Could not fetch tags: ${tagError instanceof TrezaSdkError ? tagError.message : 'Unknown error'}`);
      }
    }

    // 4. Search for Python images
    console.log('\n🔍 Searching for "python" images...');
    const pythonResults = await client.searchDockerImages('python');
    const officialPython = pythonResults.results.find(img => img.official);
    
    if (officialPython) {
      console.log(`🐍 Official Python image: ${officialPython.name}`);
      console.log(`   ⭐ ${officialPython.stars} stars`);
    }

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Docker Search Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      });
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Example: NEW - Attestation and Verification
async function attestationExample() {
  const client = new TrezaClient({
    baseUrl: process.env.TREZA_BASE_URL,
  });

  try {
    console.log('🔐 Getting enclaves for attestation testing...');
    
    // Get enclaves to find a deployed one
    const enclaves = await client.getEnclaves(WALLET_ADDRESS);
    const deployedEnclave = enclaves.find(e => e.status === 'DEPLOYED');
    
    if (!deployedEnclave) {
      console.log('⚠️  No deployed enclaves found - skipping attestation example');
      console.log('   (Attestation is only available for deployed enclaves)');
      return;
    }

    console.log(`🛡️  Testing attestation for enclave: ${deployedEnclave.name} (${deployedEnclave.id})`);

    // Get attestation document
    console.log('\n📋 Getting attestation document...');
    const attestation = await client.getAttestation(deployedEnclave.id);
    
    console.log('✅ Attestation document retrieved!');
    console.log(`📊 Trust Level: ${attestation.verification.trustLevel}`);
    console.log(`🔒 Verification Status: ${attestation.verification.verificationStatus}`);
    console.log(`📈 Integrity Score: ${attestation.verification.integrityScore}%`);
    
    // Show PCR measurements
    console.log('\n🔐 Platform Configuration Registers (PCRs):');
    console.log(`   PCR0 (Enclave Image): ${attestation.attestationDocument.pcrs[0].substring(0, 16)}...`);
    console.log(`   PCR1 (Linux Kernel): ${attestation.attestationDocument.pcrs[1].substring(0, 16)}...`);
    console.log(`   PCR2 (Application): ${attestation.attestationDocument.pcrs[2].substring(0, 16)}...`);
    console.log(`   PCR8 (Certificate): ${attestation.attestationDocument.pcrs[8].substring(0, 16)}...`);



    // Get quick verification status
    console.log('\n⚡ Getting quick verification status...');
    const verificationStatus = await client.getVerificationStatus(deployedEnclave.id);
    console.log(`✅ Quick verification: ${verificationStatus.isVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
    console.log(`🔒 Trust Level: ${verificationStatus.trustLevel}`);

    // Perform comprehensive verification
    console.log('\n🔍 Performing comprehensive verification with nonce...');
    const verificationResult = await client.verifyAttestation(deployedEnclave.id, {
      nonce: Math.random().toString(36).substring(2, 15),
      challenge: 'test-verification-' + Date.now()
    });

    console.log('✅ Comprehensive verification completed!');
    console.log(`📊 Verification Details:`);
    console.log(`   🔐 PCR Verification: ${verificationResult.verificationDetails.pcrVerification ? '✅' : '❌'}`);
    console.log(`   📜 Certificate Chain: ${verificationResult.verificationDetails.certificateChain ? '✅' : '❌'}`);
    console.log(`   ⏰ Timestamp Valid: ${verificationResult.verificationDetails.timestampValid ? '✅' : '❌'}`);
    console.log(`   🔢 Nonce Matches: ${verificationResult.verificationDetails.nonceMatches ? '✅' : '❌'}`);
    console.log(`   ✍️  Signature Valid: ${verificationResult.verificationDetails.signatureValid ? '✅' : '❌'}`);

    console.log(`\n📋 Compliance Checks:`);
    console.log(`   SOC 2: ${verificationResult.complianceChecks.soc2 ? '✅' : '❌'}`);
    console.log(`   HIPAA: ${verificationResult.complianceChecks.hipaa ? '✅' : '❌'}`);
    console.log(`   FIPS 140-2: ${verificationResult.complianceChecks.fips ? '✅' : '❌'}`);
    console.log(`   Common Criteria: ${verificationResult.complianceChecks.commonCriteria ? '✅' : '❌'}`);

    console.log(`\n⚠️  Risk Score: ${verificationResult.riskScore}/100 (lower is better)`);
    
    if (verificationResult.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      verificationResult.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Generate integration snippets
    console.log('\n📄 Generating integration code snippets...');
    
    const jsSnippet = await client.generateIntegrationSnippet(deployedEnclave.id, 'javascript');
    console.log(`\n🟨 JavaScript Integration Example:`);
    console.log(jsSnippet.split('\n').slice(0, 8).join('\n') + '\n// ... (truncated for display)');

    const pythonSnippet = await client.generateIntegrationSnippet(deployedEnclave.id, 'python');
    console.log(`\n🐍 Python Integration Example:`);
    console.log(pythonSnippet.split('\n').slice(0, 8).join('\n') + '\n# ... (truncated for display)');

    // Show API endpoints for third-party integration
    console.log('\n🔗 API Endpoints for Third-Party Integration:');
    console.log(`   🔍 Verification URL: ${attestation.endpoints.verificationUrl}`);
    console.log(`   📋 API Endpoint: ${attestation.endpoints.apiEndpoint}`);
    console.log(`   🔔 Webhook URL: ${attestation.endpoints.webhookUrl}`);

  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Attestation Error:', {
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
  console.log('=== Treza Platform SDK v0.3.0 Examples ===\n');
  console.log('🆕 NEW: Enhanced with cryptographic attestation and verification!\n');
  
  providerManagementExample()
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return enclaveManagementExample();
    })
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return enclaveLifecycleExample(); // NEW
    })
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return enclaveLogsExample(); // NEW
    })
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return dockerSearchExample(); // NEW
    })
    .then(() => {
      console.log('\n' + '='.repeat(60) + '\n');
      return attestationExample(); // NEW
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
      console.log('\n🆕 NEW FEATURES DEMONSTRATED:');
      console.log('- 🛡️  Cryptographic Attestation Documents & PCR Measurements');
      console.log('- 🔍 Comprehensive Attestation Verification & Compliance Checks');
      console.log('- 📋 Developer Integration Tools & Code Generation');
      console.log('- 🏦 Business Use Cases (Financial, Healthcare, Enterprise)');
      console.log('');
      console.log('\n📋 Previous Features:');
      console.log('- ⏸️  Enclave Lifecycle Management (pause, resume, terminate)');
      console.log('- 📜 Comprehensive Logs Access (application, ECS, Step Functions, Lambda, errors)');
      console.log('- 🐳 Docker Hub Integration (search images, get tags)');
      console.log('- 📊 Enhanced Status Tracking (DEPLOYED, PAUSED, PENDING_DESTROY, etc.)');
      console.log('\n💡 Tips:');
      console.log('- Set WALLET_ADDRESS environment variable for enclave operations');
      console.log('- Set GITHUB_ACCESS_TOKEN environment variable for GitHub integration');
      console.log('- Set TREZA_BASE_URL environment variable to use a different API endpoint');
      console.log('- All attestation APIs provide cryptographic proof of enclave integrity!');
      console.log('- Use generated code snippets for seamless third-party integration!');
    })
    .catch(console.error);
} 