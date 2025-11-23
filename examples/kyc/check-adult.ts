/**
 * Example: Check if user is an adult using SDK convenience methods
 */

import { TrezaKYCClient } from '../../src/kyc';

async function main() {
  // Load environment variables
  const API_URL = process.env.TREZA_API_URL || 'http://localhost:3000/api';
  const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
  const CONTRACT_ADDRESS = process.env.SEPOLIA_KYC_VERIFIER_ADDRESS || '0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA';
  
  // Initialize client
  const client = new TrezaKYCClient({
    apiUrl: API_URL,
    apiKey: process.env.TREZA_API_KEY,
    blockchain: {
      rpcUrl: RPC_URL,
      contractAddress: CONTRACT_ADDRESS,
    },
  });
  
  console.log('🔧 Configuration:');
  console.log('   API URL:', API_URL);
  console.log('   RPC URL:', RPC_URL);
  console.log('   Contract:', CONTRACT_ADDRESS);
  console.log();

  const proofId = process.argv[2];
  if (!proofId) {
    console.error('Usage: npx tsx check-adult.ts <proofId>');
    console.error('Example: npx tsx check-adult.ts abc123...');
    process.exit(1);
  }

  console.log('🔍 Checking proof:', proofId);
  console.log();

  try {
    // Method 1: Simple adult check
    console.log('📋 Method 1: Simple Check');
    const isAdult = await client.isAdult(proofId);
    console.log('   Is Adult:', isAdult ? '✅ Yes (18+)' : '❌ No (under 18)');
    console.log();

    // Method 2: Get all claims
    console.log('📋 Method 2: All Claims');
    const claims = await client.getClaims(proofId);
    console.log('   Country:', claims.country);
    console.log('   Is Adult:', claims.isAdult);
    console.log('   Document Valid:', claims.documentValid);
    console.log('   Document Type:', claims.documentType);
    console.log();

    // Method 3: Individual claim checks
    console.log('📋 Method 3: Individual Checks');
    const country = await client.getCountry(proofId);
    const hasValidDoc = await client.hasValidDocument(proofId);
    const docType = await client.getDocumentType(proofId);
    console.log('   Country:', country);
    console.log('   Valid Document:', hasValidDoc);
    console.log('   Document Type:', docType);
    console.log();

    // Method 4: Requirements check (most powerful)
    console.log('📋 Method 4: Requirements Check');
    const requirements = await client.meetsRequirements(proofId, {
      mustBeAdult: true,
      allowedCountries: ['US', 'CA', 'GB'],
      mustHaveValidDocument: true,
      allowedDocumentTypes: ['passport', 'passport_card', 'drivers_license']
    });
    
    if (requirements.meets) {
      console.log('   ✅ REQUIREMENTS MET!');
      console.log('   User can proceed');
    } else {
      console.log('   ❌ REQUIREMENTS NOT MET');
      console.log('   Reason:', requirements.reason);
    }
    console.log();

    // Bonus: Check from blockchain (trustless)
    console.log('⛓️  Bonus: Blockchain Verification');
    const isAdultOnChain = await client.isAdult(proofId, true); // useBlockchain = true
    console.log('   Is Adult (on-chain):', isAdultOnChain ? '✅ Yes' : '❌ No');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('\n✅ Complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

