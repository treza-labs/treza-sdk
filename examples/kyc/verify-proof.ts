/**
 * Example: Verify ZK Proof
 */

import { TrezaKYCClient } from '../../src/kyc';
import addresses from '../../src/contracts/addresses.json';

async function main() {
  // Initialize client
  const client = new TrezaKYCClient({
    apiUrl: 'https://api.treza.io',
    apiKey: process.env.TREZA_API_KEY,
    blockchain: {
      rpcUrl: process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY',
      contractAddress: addresses.sepolia.KYCVerifier,
    },
  });

  const proofId = process.argv[2];
  if (!proofId) {
    console.error('Usage: ts-node verify-proof.ts <proofId>');
    process.exit(1);
  }

  console.log('🔍 Verifying proof:', proofId);
  console.log();

  // Verify via API
  console.log('📡 Verifying via API...');
  try {
    const apiVerification = await client.verifyProof(proofId);

    console.log('✅ API Verification Result:');
    console.log('   Valid:', apiVerification.isValid);
    console.log('   Public Inputs:', apiVerification.publicInputs);
    console.log('   Verified At:', apiVerification.verifiedAt);
    console.log('   Chain Verified:', apiVerification.chainVerified);
    console.log('   Expires At:', apiVerification.expiresAt);
  } catch (error) {
    console.error('❌ API verification failed:', error);
  }

  console.log();

  // Check user KYC status on-chain
  const userAddress = process.argv[3];
  if (userAddress) {
    console.log('⛓️  Checking KYC status on blockchain...');
    try {
      const hasKYC = await client.hasValidKYC(userAddress);

      console.log('✅ Blockchain KYC Status:');
      console.log('   User:', userAddress);
      console.log('   Has Valid KYC:', hasKYC);

      if (hasKYC) {
        // Get user's proof details
        const userProofId = await client.getUserProofId(userAddress);
        console.log('   Proof ID:', userProofId);

        const proof = await client.getProofFromChain(userProofId);
        console.log('   Public Claims:', proof.publicInputs);
      }
    } catch (error) {
      console.error('❌ Blockchain verification failed:', error);
    }
  }
}

main()
  .then(() => {
    console.log('\n✅ Complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

