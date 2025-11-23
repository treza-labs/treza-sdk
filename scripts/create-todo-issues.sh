#!/bin/bash

# Create GitHub issues for existing TODOs and placeholders
# Prerequisites: GitHub CLI installed and authenticated (gh auth login)

set -e

REPO_SDK="treza-labs/treza-sdk"
REPO_CONTRACTS="treza-labs/treza-contracts"
REPO_APP="treza-labs/treza-app"

echo "🤖 Creating GitHub issues for TODOs and placeholders..."
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Install it first:"
    echo "   brew install gh"
    echo "   or visit: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub. Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI ready"
echo ""

# ============================================================================
# TREZA SDK ISSUES
# ============================================================================

echo "📦 Creating issues for treza-sdk..."
echo ""

# Issue 1: Proof Conversion
echo "Creating issue: ZKPassport proof conversion..."
gh issue create --repo "$REPO_SDK" \
  --title "Production: Implement real ZKPassport proof conversion" \
  --label "technical-debt,priority:high,zkverify-integration,production-blocker" \
  --body "## Problem

Currently using **simulated proof conversion** in \`zkverify-bridge.ts\`. This is a critical production blocker.

## Files Affected

- \`packages/core/src/compliance/zkverify-bridge.ts:64-69\`
- \`packages/core/src/compliance/zkverify-bridge.ts:596-606\`

## Current State

\`\`\`typescript
// For now, we'll simulate the conversion process
// In a real implementation, this would involve:
// 1. Parsing ZKPassport's proof format
// 2. Converting to Groth16 or other zkVerify-supported format
// 3. Generating appropriate verification key
\`\`\`

The \`convertProofFormat()\` function currently just does basic base64→hex conversion:

\`\`\`typescript
private convertProofFormat(proof: string): string {
    // This is a placeholder - actual implementation would depend on
    // ZKPassport's specific proof format and zkVerify's requirements
    
    // For now, we'll assume the proof needs to be hex-encoded
    if (!proof.startsWith(\"0x\")) {
        return \"0x\" + Buffer.from(proof, 'base64').toString('hex');
    }
    return proof;
}
\`\`\`

## What's Needed

- [ ] **Get ZKPassport proof format specification** (see #2 - depends on this)
- [ ] Implement proper Groth16/Plonk proof parsing
- [ ] Handle public input ordering correctly
- [ ] Handle endianness conversion (big-endian ↔ little-endian)
- [ ] Parse proof components (A, B, C points for Groth16)
- [ ] Validate proof structure before submission
- [ ] Add unit tests for proof conversion
- [ ] Add integration tests with real ZKPassport proofs

## Dependencies

Blocked by: Need ZKPassport integration specification

## Priority

🔴 **HIGH** - Required for production deployment

## Acceptance Criteria

- [ ] Successfully converts real ZKPassport proofs to zkVerify format
- [ ] Handles all edge cases (invalid proofs, format errors)
- [ ] Unit tests with 90%+ coverage
- [ ] Integration tests pass with real ZKPassport backend
- [ ] Documentation updated with proof format details

---
*Auto-generated from code analysis*" \
  2>/dev/null || echo "  ⚠️  Issue may already exist"

echo ""

# Issue 2: Verification Key
echo "Creating issue: Verification key generation..."
gh issue create --repo "$REPO_SDK" \
  --title "Production: Replace placeholder verification key generation" \
  --label "technical-debt,priority:high,zkverify-integration,production-blocker" \
  --body "## Problem

Using **hash-based placeholder** instead of real verification key. This prevents actual ZK proof verification.

## Files Affected

- \`packages/core/src/compliance/zkverify-bridge.ts:613-618\`

## Current State

\`\`\`typescript
private generateVerificationKey(proof: ZKPassportProof): string {
    // This would be the actual verification key used by ZKPassport
    // For now, we'll generate a placeholder based on the proof type
    
    const proofType = \"zkpassport_identity_v1\";
    return ethers.keccak256(ethers.toUtf8Bytes(proofType));
}
\`\`\`

## What's Needed

- [ ] **Obtain actual verification key from ZKPassport circuit**
- [ ] Implement VK retrieval mechanism (API call, file, or embedded)
- [ ] Update zkVerify VK registration flow
- [ ] Handle VK versioning (circuit upgrades)
- [ ] Cache VKs efficiently
- [ ] Add VK validation
- [ ] Document VK management process

## Options for Implementation

1. **Embedded VK** - Include VK in SDK (if public)
2. **ZKPassport API** - Fetch VK from ZKPassport service
3. **Config-based** - Load from environment/config file
4. **Registry contract** - Query on-chain VK registry

## Dependencies

Blocked by: Need ZKPassport team to provide:
- Verification key for their circuit
- Preferred VK distribution method
- VK update/versioning strategy

## Priority

🔴 **HIGH** - Required for production deployment

## Acceptance Criteria

- [ ] Uses real verification key from ZKPassport
- [ ] VK correctly registered with zkVerify
- [ ] Proof verification succeeds end-to-end
- [ ] VK updates handled gracefully
- [ ] Documentation includes VK management guide

---
*Auto-generated from code analysis*" \
  2>/dev/null || echo "  ⚠️  Issue may already exist"

echo ""

# Issue 3: ZKPassport Integration Spec
echo "Creating issue: ZKPassport integration specification..."
gh issue create --repo "$REPO_SDK" \
  --title "Documentation: Get ZKPassport integration specification" \
  --label "documentation,needs-spec,blocked,zkverify-integration" \
  --body "## Problem

Need official specification from ZKPassport team to complete integration.

## Required Information

### 1. Proof Format
- [ ] Proof system used (Groth16, Plonk, STARK, etc.)
- [ ] Proof encoding format (hex, base64, binary)
- [ ] Proof structure/components
- [ ] Byte ordering (endianness)

### 2. Public Inputs
- [ ] Number of public inputs
- [ ] Order of public inputs
- [ ] Encoding/format of each input
- [ ] Field modulus (if applicable)

### 3. Verification Key
- [ ] VK format and structure
- [ ] How to obtain VK (API, file, embedded)
- [ ] VK versioning strategy
- [ ] VK update process

### 4. ZKPassport API
- [ ] API endpoint URLs (testnet/mainnet)
- [ ] Authentication requirements
- [ ] Rate limits
- [ ] Error handling

### 5. Test Data
- [ ] Sample valid proofs
- [ ] Sample invalid proofs
- [ ] Test verification keys
- [ ] Integration test environment access

## Blocking Issues

This issue blocks:
- #1 - Proof conversion implementation
- #2 - Verification key generation
- All production deployment

## Action Items

- [ ] Contact ZKPassport team
- [ ] Schedule technical integration call
- [ ] Request developer documentation
- [ ] Request testnet access
- [ ] Get sample proof data

## Priority

🔴 **HIGH** - Blocks all production work

---
*Auto-generated from code analysis*" \
  2>/dev/null || echo "  ⚠️  Issue may already exist"

echo ""

# Issue 4: Receipt Verification
echo "Creating issue: Receipt verification implementation..."
gh issue create --repo "$REPO_SDK" \
  --title "Feature: Implement zkVerify receipt verification" \
  --label "feature,priority:medium,zkverify-integration" \
  --body "## Problem

Receipt verification is currently simulated with a basic contract call.

## Files Affected

- \`packages/core/src/compliance/zkverify-bridge.ts:535-548\`

## Current State

\`\`\`typescript
async verifyReceiptOnChain(
    receipt: string,
    contractAddress: string,
    provider: ethers.Provider
): Promise<boolean> {
    try {
        // This would interact with zkVerify's on-chain verification contract
        // For now, we'll simulate the verification
        
        const contract = new ethers.Contract(
            contractAddress,
            [\"function verifyReceipt(string memory receipt) external view returns (bool)\"],
            provider
        );
        
        const isValid = await contract.verifyReceipt(receipt);
        return isValid;
    } catch (error) {
        console.error(\"❌ Error verifying receipt on-chain:\", error);
        return false;
    }
}
\`\`\`

## What's Needed

- [ ] Get zkVerify receipt format specification
- [ ] Implement proper receipt parsing
- [ ] Update contract ABI if needed
- [ ] Add error handling for invalid receipts
- [ ] Add unit tests
- [ ] Document receipt verification flow

## Priority

🟡 **MEDIUM** - Nice to have for full verification

## Acceptance Criteria

- [ ] Successfully verifies zkVerify receipts on-chain
- [ ] Handles edge cases
- [ ] Tests pass with real zkVerify contracts

---
*Auto-generated from code analysis*" \
  --milestone "v1.1-features" 2>/dev/null || echo "  ⚠️  Issue may already exist"

echo ""

# ============================================================================
# TREZA CONTRACTS ISSUES
# ============================================================================

echo "📦 Creating issues for treza-contracts..."
echo ""

# Issue 5: zkVerify Contract Address
echo "Creating issue: zkVerify contract configuration..."
gh issue create --repo "$REPO_CONTRACTS" \
  --title "Config: Deploy or obtain ZKVERIFY_CONTRACT_ADDRESS" \
  --label "configuration,priority:high,zkverify-integration" \
  --body "## Problem

Placeholder address needs to be set before deployment.

## Files Affected

- \`scripts/deploy-aggregation-verifier.ts:21\`
- \`scripts/setup-zkverify-config.ts:54\`

## Current State

\`\`\`typescript
// TODO: Update these values for your deployment
const ZKVERIFY_CONTRACT_ADDRESS = process.env.ZKVERIFY_CONTRACT_ADDRESS || \"0x...\";
\`\`\`

\`\`\`typescript
// Placeholder for zkVerify contract
const zkVerifyContractAddress = \"0x0000000000000000000000000000000000000000\"; // UPDATE THIS
console.log(\"⚠️  This is a placeholder - update before deployment!\\n\");
\`\`\`

## Options

### Option 1: Use Horizen's Deployed Contract
- Contact Horizen Labs / zkVerify team
- Get testnet contract address for testing
- Get mainnet contract address for production

### Option 2: Deploy Own Contract
- Deploy KYC verification contracts
- Configure integration parameters

### Option 3: Check Relayer API Documentation
- Aggregation response may include contract references
- Check zkVerify docs for deployed addresses

## Action Items

- [ ] Determine which network (Sepolia, Ethereum mainnet)
- [ ] Contact Horizen/zkVerify for contract addresses
- [ ] Update \`.env.example\` with placeholder
- [ ] Update deployment documentation
- [ ] Add contract address to deployment checklist

## Priority

🟡 **HIGH** - Needed before smart contract verification deployment

## Acceptance Criteria

- [ ] Contract address obtained or deployed
- [ ] Address added to environment variables
- [ ] Documentation updated
- [ ] Deployment scripts work with real address

---
*Auto-generated from code analysis*" \
  2>/dev/null || echo "  ⚠️  Issue may already exist"

echo ""

# Issue 6: Verification Key Hash
echo "Creating issue: Verification key hash configuration..."
gh issue create --repo "$REPO_CONTRACTS" \
  --title "Config: Obtain VERIFICATION_KEY_HASH from zkVerify" \
  --label "configuration,priority:high,zkverify-integration" \
  --body "## Problem

Need to register verification key with zkVerify and obtain hash.

## Files Affected

- \`scripts/deploy-aggregation-verifier.ts:22\`
- \`ENV_SETUP.md\`

## Current State

\`\`\`typescript
const VERIFICATION_KEY_HASH = process.env.VERIFICATION_KEY_HASH || \"0x...\";
\`\`\`

## Solution

We have a script to automate this: \`scripts/setup-zkverify-config.ts\`

## Action Items

- [ ] **Get verification key file** from ZKPassport team (depends on SDK issue #3)
- [ ] **Run registration script**:
  \`\`\`bash
  cd treza-contracts
  npx hardhat run scripts/setup-zkverify-config.ts --network sepolia
  \`\`\`
- [ ] Script will:
  - Register VK with zkVerify Relayer API
  - Extract VK hash from response
  - Save to \`.env\` automatically
- [ ] Verify registration successful
- [ ] Update \`.env.example\` with instructions

## Dependencies

Blocked by:
- Need ZKPassport verification key file
- Need zkVerify Relayer API key

## Priority

🟡 **HIGH** - Needed before deployment

## Acceptance Criteria

- [ ] VK successfully registered with zkVerify
- [ ] VERIFICATION_KEY_HASH obtained and saved
- [ ] Can deploy aggregation verifier contract
- [ ] Documentation includes VK registration steps

---
*Auto-generated from code analysis*" \
  2>/dev/null || echo "  ⚠️  Issue may already exist"

echo ""

# ============================================================================
# DOCUMENTATION ISSUE
# ============================================================================

echo "📦 Creating cross-repository documentation issue..."

# Issue 7: Production Readiness Checklist
echo "Creating issue: Production readiness tracking..."
gh issue create --repo "$REPO_SDK" \
  --title "Meta: Production Readiness Checklist" \
  --label "documentation,production-blocker,meta" \
  --body "## Production Readiness Checklist

This meta-issue tracks all blockers for production deployment.

## Critical Blockers (v1.0)

### treza-sdk
- [ ] #1 - Implement real ZKPassport proof conversion
- [ ] #2 - Replace placeholder verification key
- [ ] #3 - Get ZKPassport integration specification (**BLOCKS ALL**)
- [ ] #4 - Implement receipt verification

### treza-contracts
- [ ] #5 - Configure ZKVERIFY_CONTRACT_ADDRESS
- [ ] #6 - Obtain VERIFICATION_KEY_HASH

### treza-app
- [ ] All API routes tested with real zkVerify
- [ ] Environment variables documented
- [ ] Rate limiting configured

## Integration Testing
- [ ] End-to-end test with real ZKPassport proofs
- [ ] Oracle verification tested on testnet
- [ ] Smart contract aggregation tested on testnet
- [ ] Gas optimization verified
- [ ] Error handling tested

## Security
- [ ] Security audit of smart contracts
- [ ] API key management reviewed
- [ ] Rate limiting implemented
- [ ] Input validation comprehensive

## Documentation
- [ ] API documentation complete
- [ ] Integration guide written
- [ ] Deployment guide tested
- [ ] Example applications working

## Performance
- [ ] Load testing completed
- [ ] Gas costs optimized
- [ ] API response times acceptable
- [ ] Caching strategy implemented

## Deployment
- [ ] Testnet deployment successful
- [ ] Mainnet deployment plan reviewed
- [ ] Rollback plan documented
- [ ] Monitoring setup

## Timeline

- **Week 1**: Get ZKPassport specification (#3)
- **Week 2-3**: Implement proof conversion (#1, #2)
- **Week 4**: Configuration and deployment (#5, #6)
- **Week 5**: Testing and documentation
- **Week 6**: Mainnet deployment

## Definition of Done

✅ All critical issues resolved
✅ All tests passing
✅ Documentation complete
✅ Security reviewed
✅ Successfully deployed to testnet
✅ Ready for mainnet deployment

---
*Meta-issue tracking production readiness*" \
  2>/dev/null || echo "  ⚠️  Issue may already exist"

echo ""
echo "============================================================================"
echo "✅ Issue creation complete!"
echo "============================================================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. View created issues:"
echo "   - SDK:       https://github.com/$REPO_SDK/issues"
echo "   - Contracts: https://github.com/$REPO_CONTRACTS/issues"
echo ""
echo "2. Prioritize and assign issues to team members"
echo ""
echo "3. Contact ZKPassport team for integration spec (Issue #3)"
echo ""
echo "4. Update code with issue references:"
echo "   TODO(issue:#1): Implement real ZKPassport proof conversion"
echo ""
echo "5. Track progress using GitHub Projects or Milestones"
echo ""

