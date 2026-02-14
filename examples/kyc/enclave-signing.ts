/**
 * Example: Submit ZK Proof with Enclave Signing (Production Recommended)
 *
 * This example demonstrates the production-recommended approach where
 * private keys are managed inside a Treza Nitro Enclave. The key never
 * leaves the hardware-isolated TEE.
 *
 * Flow:
 * 1. Connect to Treza Platform
 * 2. Create EnclaveSigner (points to your enclave)
 * 3. Initialize KYC client with the enclave signer
 * 4. Submit proof — signing happens inside the enclave
 *
 * Prerequisites:
 * - A deployed Treza enclave with blockchain signing enabled
 * - Environment variables: TREZA_PLATFORM_URL, TREZA_ENCLAVE_ID, TREZA_API_URL,
 *   SEPOLIA_RPC_URL, SEPOLIA_KYC_VERIFIER_ADDRESS
 */

import { TrezaClient } from '../../src/client';
import { TrezaKYCClient } from '../../src/kyc';
import { EnclaveSigner } from '../../src/signing';

async function main() {
  // ─── 1. Connect to Treza Platform ────────────────────────────────
  const platform = new TrezaClient({
    baseUrl: process.env.TREZA_PLATFORM_URL || 'https://app.trezalabs.com',
  });

  console.log('Connected to Treza Platform');

  // ─── 2. Verify the enclave is healthy ────────────────────────────
  const enclaveId = process.env.TREZA_ENCLAVE_ID;
  if (!enclaveId) {
    console.error('Error: TREZA_ENCLAVE_ID environment variable is required.');
    console.error('Create an enclave at https://app.trezalabs.com or via the SDK.');
    process.exit(1);
  }

  const enclave = await platform.getEnclave(enclaveId);
  console.log(`Enclave: ${enclave.name} (${enclave.status})`);

  if (enclave.status !== 'DEPLOYED') {
    console.error(`Enclave is not deployed (status: ${enclave.status}). Deploy it first.`);
    process.exit(1);
  }

  // ─── 3. Create EnclaveSigner ─────────────────────────────────────
  // The signer routes all signing requests to the enclave.
  // Private keys never leave the hardware-isolated TEE.
  const signer = new EnclaveSigner(platform, {
    enclaveId,
    verifyAttestation: true, // verify TEE integrity before each sign operation
  });

  const signerAddress = await signer.getAddress();
  console.log(`Signer address (from enclave): ${signerAddress}`);

  // ─── 4. Verify attestation ───────────────────────────────────────
  console.log('\nVerifying enclave attestation...');
  const attestation = await platform.getAttestation(enclaveId);
  console.log(`  Trust Level: ${attestation.verification.trustLevel}`);
  console.log(`  PCR0 (Image): ${attestation.attestationDocument.pcrs[0]?.substring(0, 32)}...`);

  const verification = await platform.verifyAttestation(enclaveId);
  console.log(`  Attestation Valid: ${verification.isValid}`);
  console.log(`  Risk Score: ${verification.riskScore}`);

  // ─── 5. Initialize KYC Client with EnclaveSigner ─────────────────
  const client = new TrezaKYCClient({
    apiUrl: process.env.TREZA_API_URL || 'https://api.trezalabs.com/api',
    apiKey: process.env.TREZA_API_KEY,
    blockchain: {
      rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      contractAddress: process.env.SEPOLIA_KYC_VERIFIER_ADDRESS || '0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA',
      signerProvider: signer,  // <-- production signing via enclave
    },
  });

  // ─── 6. Submit proof to API ──────────────────────────────────────
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

  console.log('\nSubmitting proof to API...');
  const apiResult = await client.submitProof({
    userId: 'user-123',
    proof,
  });

  console.log('Proof submitted to API:');
  console.log(`  Proof ID: ${apiResult.proofId}`);
  console.log(`  Verification URL: ${apiResult.verificationUrl}`);

  // ─── 7. Submit proof on-chain (signed inside the enclave) ────────
  console.log('\nSubmitting proof to blockchain (signing in enclave)...');
  try {
    const txHash = await client.submitProofOnChain({
      commitment: proof.commitment,
      proof: proof.proof,
      publicInputs: proof.publicInputs,
      // No signer passed — uses the EnclaveSigner from config
    });

    console.log('Proof submitted on-chain:');
    console.log(`  Transaction Hash: ${txHash}`);
    console.log(`  View on Etherscan: https://sepolia.etherscan.io/tx/${txHash}`);
    console.log('\nThe transaction was signed inside the Nitro Enclave.');
    console.log('The private key never left the TEE boundary.');
  } catch (error: any) {
    console.error('Failed to submit to blockchain:', error.message);
  }
}

main()
  .then(() => {
    console.log('\nComplete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
