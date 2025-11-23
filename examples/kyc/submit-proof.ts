/**
 * Example: Submit ZK Proof to Treza API and Blockchain
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
      privateKey: process.env.PRIVATE_KEY,
    },
  });

  // Sample proof from mobile app
  const proof = {
    commitment: 'a1b2c3d4e5f6789012345678901234567890abcdefabcdef1234567890abcdef',
    proof: 'x1y2z3w4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0...',
    publicInputs: [
      'country:United States',
      'documentType:Passport',
      'isAdult:true',
      'documentValid:true',
    ],
    timestamp: new Date().toISOString(),
    algorithm: 'Pedersen-SHA256',
  };

  console.log('📤 Submitting proof to API...');
  
  // Submit to API
  const apiResult = await client.submitProof({
    userId: 'user-123',
    proof,
  });

  console.log('✅ Proof submitted to API:');
  console.log('   Proof ID:', apiResult.proofId);
  console.log('   Verification URL:', apiResult.verificationUrl);
  console.log('   Expires At:', apiResult.expiresAt);
  console.log();

  console.log('⛓️  Submitting proof to blockchain...');

  // Submit to blockchain
  try {
    const txHash = await client.submitProofOnChain({
      commitment: proof.commitment,
      proof: proof.proof,
      publicInputs: proof.publicInputs,
    });

    console.log('✅ Proof submitted on-chain:');
    console.log('   Transaction Hash:', txHash);
    console.log('   View on Etherscan: https://sepolia.etherscan.io/tx/' + txHash);
  } catch (error) {
    console.error('❌ Failed to submit to blockchain:', error);
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

