import { TrezaClient, TrezaSdkError } from '../src';

// Example wallet address (replace with your actual wallet)
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || '0x4B0897b0513fdc7C541B6d9D7E929C4e5364D2dB';

// Example: Enclave Management
async function enclaveManagementExample() {
  const client = new TrezaClient({
    baseUrl: process.env.TREZA_BASE_URL, // Optional: defaults to https://app.treza.xyz
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
      });
    }

    console.log('\n🚀 Creating a new enclave...');
    
    // Create a new enclave
    const newEnclave = await client.createEnclave({
      name: 'Trading Bot Enclave',
      description: 'Secure environment for automated trading strategies',
      region: 'us-east-1',
      walletAddress: WALLET_ADDRESS,
      githubConnection: {
        isConnected: false
      }
    });

    console.log('✅ Enclave created successfully!');
    console.log(`📋 Enclave ID: ${newEnclave.id}`);
    console.log(`📊 Status: ${newEnclave.status}`);
    console.log(`🌍 Region: ${newEnclave.region}`);

    console.log('\n📝 Updating enclave...');
    
    // Update the enclave
    const updatedEnclave = await client.updateEnclave({
      id: newEnclave.id,
      walletAddress: WALLET_ADDRESS,
      description: 'Updated: Advanced trading strategies with ML capabilities',
      region: 'us-west-2'
    });

    console.log('✅ Enclave updated successfully!');
    console.log(`📝 New description: ${updatedEnclave.description}`);
    console.log(`🌍 New region: ${updatedEnclave.region}`);

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

    // 1. Create enclave with GitHub connection
    const enclave = await client.createEnclave({
      name: 'ML Training Enclave',
      description: 'Secure environment for machine learning model training',
      region: 'us-east-1',
      walletAddress: WALLET_ADDRESS,
      githubConnection: {
        isConnected: true,
        accessToken: accessToken,
        selectedRepo: 'username/ml-project', // Replace with actual repo
        selectedBranch: 'main'
      }
    });

    console.log('✅ Enclave created with GitHub integration!');
    console.log(`📋 Enclave: ${enclave.name} (${enclave.id})`);
    
    if (enclave.githubConnection?.isConnected) {
      console.log(`🔗 Connected to: ${enclave.githubConnection.selectedRepo}`);
      console.log(`🌿 Branch: ${enclave.githubConnection.selectedBranch}`);
    }

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
  
  enclaveManagementExample()
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