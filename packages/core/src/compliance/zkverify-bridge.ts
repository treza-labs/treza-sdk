import { ethers } from "ethers";

/**
 * ZKVerify Bridge Service
 * 
 * This service bridges ZKPassport proofs with zkVerify for on-chain verification.
 * It handles the conversion of ZKPassport proofs to zkVerify-compatible format
 * and manages the verification process.
 */

interface ZKPassportProof {
    uniqueIdentifier: string;
    verified: boolean;
    result: {
        age?: number;
        nationality?: string;
        firstname?: string;
        [key: string]: any;
    };
    proof: string; // ZKPassport's internal proof format
    timestamp: number;
}

interface ZKVerifyProof {
    proof: string;      // Hex-encoded proof for zkVerify
    publicInputs: string[]; // Public inputs for verification
    verificationKey: string; // Verification key hash
}

interface ComplianceProof {
    userAddress: string;
    proofHash: string;
    verificationLevel: "basic" | "enhanced" | "institutional";
    attributes: {
        ageVerified: boolean;
        nationalityVerified: boolean;
        uniquenessVerified: boolean;
    };
    zkVerifyReceipt?: string; // zkVerify verification receipt
}

export class ZKVerifyBridge {
    private apiEndpoint: string; // Your Next.js API endpoint
    
    /**
     * @param apiEndpoint The base URL of your Next.js API (e.g., "http://localhost:3000/api" or "https://yourdomain.com/api")
     */
    constructor(apiEndpoint: string) {
        this.apiEndpoint = apiEndpoint;
    }
    
    /**
     * Convert ZKPassport proof to zkVerify-compatible format
     * @param zkPassportProof The proof from ZKPassport
     * @returns ZKVerify-compatible proof
     */
    async convertToZKVerifyFormat(zkPassportProof: ZKPassportProof): Promise<ZKVerifyProof> {
        console.log("🔄 Converting ZKPassport proof to zkVerify format...");
        
        try {
            // Extract public inputs from ZKPassport proof
            const publicInputs = this.extractPublicInputs(zkPassportProof);
            
            // For now, we'll simulate the conversion process
            // In a real implementation, this would involve:
            // 1. Parsing ZKPassport's proof format
            // 2. Converting to Groth16 or other zkVerify-supported format
            // 3. Generating appropriate verification key
            
            const zkVerifyProof: ZKVerifyProof = {
                proof: this.convertProofFormat(zkPassportProof.proof),
                publicInputs: publicInputs,
                verificationKey: this.generateVerificationKey(zkPassportProof)
            };
            
            console.log("✅ Successfully converted to zkVerify format");
            return zkVerifyProof;
            
        } catch (error) {
            console.error("❌ Error converting proof format:", error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Proof conversion failed: ${message}`);
        }
    }
    
    /**
     * Submit proof to zkVerify for verification via Horizen Relayer
     * @param zkVerifyProof The zkVerify-compatible proof
     * @param userAddress Optional user address for tracking
     * @param enableAggregation Whether to enable aggregation for smart contract verification
     * @param chainId Target chain ID for aggregation (e.g., 11155111 for Sepolia)
     * @returns Job ID and optimistic verification status
     */
    async submitToZKVerify(
        zkVerifyProof: ZKVerifyProof,
        userAddress?: string,
        enableAggregation: boolean = false,
        chainId?: number
    ): Promise<{ jobId: string; optimisticVerify: string }> {
        console.log("📤 Submitting proof to zkVerify via Relayer...");
        if (enableAggregation) {
            console.log("🔗 Aggregation enabled for smart contract verification");
        }
        
        try {
            const response = await fetch(`${this.apiEndpoint}/zkverify/submit-proof`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    proof: zkVerifyProof.proof,
                    publicSignals: zkVerifyProof.publicInputs,
                    vk: zkVerifyProof.verificationKey,
                    proofType: "groth16", // Can be made configurable
                    userAddress,
                    // Include chainId only if aggregation is enabled
                    ...(enableAggregation && chainId && { chainId })
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Submission failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log(`✅ Proof submitted. JobId: ${result.jobId}`);
            
            return {
                jobId: result.jobId,
                optimisticVerify: result.optimisticVerify
            };
            
        } catch (error: any) {
            console.error("❌ Error submitting to zkVerify:", error);
            throw new Error(`zkVerify submission failed: ${error.message}`);
        }
    }
    
    /**
     * Poll job status until finalized or aggregated
     * @param jobId The job ID to poll
     * @param waitForAggregation Wait for aggregation instead of just finalization
     * @param maxAttempts Maximum number of polling attempts (default: 60 for finalization, 120 for aggregation)
     * @param intervalMs Polling interval in milliseconds (default: 5000)
     * @returns Job status when finalized or aggregated
     */
    async waitForJobFinalization(
        jobId: string,
        waitForAggregation: boolean = false,
        maxAttempts?: number,
        intervalMs: number = 5000
    ): Promise<any> {
        // Aggregation takes longer (5-10 minutes), so increase default attempts
        const defaultMaxAttempts = waitForAggregation ? 120 : 60;
        const attempts = maxAttempts || defaultMaxAttempts;
        
        console.log(`⏳ Waiting for job ${jobId} to ${waitForAggregation ? 'aggregate' : 'finalize'}...`);
        
        let attemptCount = 0;
        
        while (attemptCount < attempts) {
            try {
                const response = await fetch(`${this.apiEndpoint}/zkverify/job-status/${jobId}`);
                
                if (!response.ok) {
                    throw new Error(`Failed to get job status: ${response.statusText}`);
                }
                
                const { jobStatus } = await response.json();
                console.log(`Job status: ${jobStatus.status}`);
                
                // Check for terminal states based on what we're waiting for
                if (waitForAggregation) {
                    if (jobStatus.status === 'Aggregated' || jobStatus.status === 'AggregationPublished') {
                        console.log(`✅ Job ${jobId} aggregated`);
                        return jobStatus;
                    }
                } else {
                    if (jobStatus.status === 'Finalized' || jobStatus.status === 'Aggregated') {
                        console.log(`✅ Job ${jobId} ${jobStatus.status.toLowerCase()}`);
                        return jobStatus;
                    }
                }
                
                if (jobStatus.status === 'Failed') {
                    throw new Error(`Job ${jobId} failed verification`);
                }
                
                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, intervalMs));
                attemptCount++;
                
            } catch (error: any) {
                console.error(`❌ Error polling job status:`, error.message);
                throw error;
            }
        }
        
        throw new Error(`Timeout: Job ${jobId} did not ${waitForAggregation ? 'aggregate' : 'finalize'} after ${attempts} attempts`);
    }
    
    /**
     * Get aggregation data for smart contract verification
     * @param aggregationId The aggregation ID from zkVerify
     * @returns Aggregation data including Merkle proof
     */
    async getAggregationData(aggregationId: number): Promise<any> {
        console.log(`📦 Fetching aggregation data for: ${aggregationId}`);
        
        try {
            const response = await fetch(
                `${this.apiEndpoint}/zkverify/aggregation/${aggregationId}`
            );
            
            if (!response.ok) {
                throw new Error(`Failed to get aggregation data: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log(`✅ Aggregation data retrieved`);
            
            return result.aggregation;
            
        } catch (error: any) {
            console.error("❌ Error fetching aggregation data:", error.message);
            throw error;
        }
    }
    
    /**
     * Get aggregation data directly from job ID
     * @param jobId The job ID to get aggregation data for
     * @returns Aggregation data if job is aggregated
     */
    async getAggregationDataForJob(jobId: string): Promise<any> {
        console.log(`📦 Fetching aggregation data for job: ${jobId}`);
        
        try {
            const response = await fetch(
                `${this.apiEndpoint}/zkverify/aggregation/job/${jobId}`
            );
            
            if (!response.ok) {
                throw new Error(`Failed to get aggregation data: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Job not yet aggregated');
            }
            
            console.log(`✅ Aggregation data retrieved for job`);
            return result.aggregation;
            
        } catch (error: any) {
            console.error("❌ Error fetching aggregation data:", error.message);
            throw error;
        }
    }
    
    /**
     * Register a verification key with zkVerify
     * @param vk Verification key data
     * @param proofType Type of proof (default: groth16)
     * @returns VK hash for future proof submissions
     */
    async registerVerificationKey(
        vk: any,
        proofType: string = "groth16"
    ): Promise<string> {
        console.log(`🔑 Registering verification key for ${proofType}...`);
        
        try {
            const response = await fetch(`${this.apiEndpoint}/zkverify/register-vk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vk,
                    proofType,
                    proofOptions: {
                        library: "snarkjs",
                        curve: "bn128"
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'VK registration failed');
            }
            
            const result = await response.json();
            console.log(`✅ Verification key registered: ${result.vkHash}`);
            
            return result.vkHash;
            
        } catch (error: any) {
            console.error("❌ Error registering VK:", error.message);
            throw error;
        }
    }
    
    /**
     * Submit attestation to oracle contract after zkVerify finalization
     * @param proofHash Proof hash
     * @param verified Whether proof was verified
     * @param zkVerifyJobStatus Job status from zkVerify
     * @param userAddress User's Ethereum address
     * @returns Transaction hash of oracle submission
     */
    async submitAttestationToOracle(
        proofHash: string,
        verified: boolean,
        zkVerifyJobStatus: any,
        userAddress?: string
    ): Promise<string> {
        console.log("📝 Submitting attestation to oracle contract...");
        
        try {
            const response = await fetch(`${this.apiEndpoint}/zkverify/submit-attestation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    proofHash,
                    verified,
                    zkVerifyBlockHash: zkVerifyJobStatus.blockHash,
                    zkVerifyTxHash: zkVerifyJobStatus.txHash,
                    userAddress
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Attestation submission failed');
            }
            
            const result = await response.json();
            console.log(`✅ Attestation submitted: ${result.transactionHash}`);
            
            return result.transactionHash;
            
        } catch (error: any) {
            console.error("❌ Error submitting attestation:", error.message);
            throw error;
        }
    }
    
    /**
     * Process complete ZKPassport verification flow with zkVerify (Oracle-based)
     * @param zkPassportProof The proof from ZKPassport
     * @param userAddress The Ethereum address of the user
     * @param submitToOracle Whether to submit attestation to oracle contract (default: true)
     * @returns Complete compliance proof
     */
    async processComplianceVerification(
        zkPassportProof: ZKPassportProof,
        userAddress: string,
        submitToOracle: boolean = true
    ): Promise<ComplianceProof & { jobId?: string; txHash?: string }> {
        console.log("🚀 Processing compliance verification for:", userAddress);
        console.log("   Mode: Oracle-based (faster, requires trust in oracle)");
        
        try {
            // Step 1: Validate ZKPassport proof
            if (!zkPassportProof.verified) {
                throw new Error("ZKPassport proof is not verified");
            }
            
            // Step 2: Convert to zkVerify format
            console.log("🔄 Converting proof to zkVerify format...");
            const zkVerifyProof = await this.convertToZKVerifyFormat(zkPassportProof);
            
            // Step 3: Submit to zkVerify via Relayer (no aggregation)
            console.log("📤 Submitting to zkVerify...");
            const { jobId, optimisticVerify } = await this.submitToZKVerify(
                zkVerifyProof,
                userAddress,
                false // Don't enable aggregation for oracle mode
            );
            
            if (optimisticVerify !== 'success') {
                throw new Error("Optimistic verification failed");
            }
            
            // Step 4: Wait for finalization
            console.log("⏳ Waiting for zkVerify finalization...");
            const jobStatus = await this.waitForJobFinalization(jobId, false);
            
            // Step 5: Generate proof hash
            const proofHash = ethers.keccak256(
                ethers.toUtf8Bytes(zkPassportProof.proof + userAddress)
            );
            
            // Step 6: Submit to oracle contract (if enabled)
            let oracleTxHash: string | undefined;
            if (submitToOracle && jobStatus.blockHash) {
                console.log("📝 Submitting attestation to oracle...");
                oracleTxHash = await this.submitAttestationToOracle(
                    proofHash,
                    true,
                    jobStatus,
                    userAddress
                );
            }
            
            // Step 7: Generate compliance proof
            const complianceProof: ComplianceProof & { jobId?: string; txHash?: string } = {
                userAddress: userAddress,
                proofHash,
                verificationLevel: this.determineVerificationLevel(zkPassportProof),
                attributes: {
                    ageVerified: zkPassportProof.result.age !== undefined,
                    nationalityVerified: zkPassportProof.result.nationality !== undefined,
                    uniquenessVerified: zkPassportProof.uniqueIdentifier !== undefined
                },
                zkVerifyReceipt: jobStatus.txHash,
                jobId,
                txHash: oracleTxHash
            };
            
            console.log("✅ Compliance verification completed successfully");
            console.log(`   zkVerify Tx: ${jobStatus.txHash}`);
            if (oracleTxHash) {
                console.log(`   Oracle Tx: ${oracleTxHash}`);
            }
            
            return complianceProof;
            
        } catch (error: any) {
            console.error("❌ Error processing compliance verification:", error);
            throw error;
        }
    }
    
    /**
     * Process compliance verification with smart contract aggregation (Trustless)
     * @param zkPassportProof The proof from ZKPassport
     * @param userAddress The Ethereum address of the user
     * @param chainId Target chain ID for aggregation (e.g., 11155111 for Sepolia)
     * @returns Compliance proof with aggregation data for smart contract verification
     */
    async processComplianceWithAggregation(
        zkPassportProof: ZKPassportProof,
        userAddress: string,
        chainId: number = 11155111
    ): Promise<ComplianceProof & { jobId?: string; aggregationData?: any }> {
        console.log("🚀 Processing compliance verification for:", userAddress);
        console.log("   Mode: Smart Contract (trustless, takes 5-10 min for aggregation)");
        
        try {
            // Step 1: Validate ZKPassport proof
            if (!zkPassportProof.verified) {
                throw new Error("ZKPassport proof is not verified");
            }
            
            // Step 2: Convert to zkVerify format
            console.log("🔄 Converting proof to zkVerify format...");
            const zkVerifyProof = await this.convertToZKVerifyFormat(zkPassportProof);
            
            // Step 3: Submit to zkVerify with aggregation enabled
            console.log("📤 Submitting to zkVerify with aggregation...");
            const { jobId, optimisticVerify } = await this.submitToZKVerify(
                zkVerifyProof,
                userAddress,
                true, // Enable aggregation
                chainId
            );
            
            if (optimisticVerify !== 'success') {
                throw new Error("Optimistic verification failed");
            }
            
            // Step 4: Wait for aggregation (takes longer)
            console.log("⏳ Waiting for zkVerify aggregation (5-10 minutes)...");
            const jobStatus = await this.waitForJobFinalization(jobId, true); // Wait for aggregation
            
            // Step 5: Get aggregation data for smart contract verification
            console.log("📦 Fetching aggregation data...");
            const aggregationData = await this.getAggregationDataForJob(jobId);
            
            // Step 6: Generate proof hash
            const proofHash = ethers.keccak256(
                ethers.toUtf8Bytes(zkPassportProof.proof + userAddress)
            );
            
            // Step 7: Generate compliance proof with aggregation data
            const complianceProof: ComplianceProof & { jobId?: string; aggregationData?: any } = {
                userAddress: userAddress,
                proofHash,
                verificationLevel: this.determineVerificationLevel(zkPassportProof),
                attributes: {
                    ageVerified: zkPassportProof.result.age !== undefined,
                    nationalityVerified: zkPassportProof.result.nationality !== undefined,
                    uniquenessVerified: zkPassportProof.uniqueIdentifier !== undefined
                },
                zkVerifyReceipt: jobStatus.txHash,
                jobId,
                aggregationData // Include full aggregation data for smart contract verification
            };
            
            console.log("✅ Compliance verification with aggregation completed");
            console.log(`   zkVerify Tx: ${jobStatus.txHash}`);
            console.log(`   Aggregation ID: ${aggregationData.aggregationId}`);
            console.log("   📝 Use aggregationData to verify on-chain via smart contract");
            
            return complianceProof;
            
        } catch (error: any) {
            console.error("❌ Error processing compliance with aggregation:", error);
            throw error;
        }
    }
    
    /**
     * Verify a zkVerify receipt on-chain
     * @param receipt The zkVerify verification receipt
     * @param contractAddress The address of the verification contract
     * @param provider Ethereum provider
     * @returns Whether the receipt is valid on-chain
     */
    async verifyReceiptOnChain(
        receipt: string,
        contractAddress: string,
        provider: ethers.Provider
    ): Promise<boolean> {
        console.log("🔍 Verifying zkVerify receipt on-chain...");
        
        try {
            // This would interact with zkVerify's on-chain verification contract
            // For now, we'll simulate the verification
            
            const contract = new ethers.Contract(
                contractAddress,
                ["function verifyReceipt(string memory receipt) external view returns (bool)"],
                provider
            );
            
            const isValid = await contract.verifyReceipt(receipt);
            
            console.log(`✅ Receipt verification result: ${isValid}`);
            return isValid;
            
        } catch (error) {
            console.error("❌ Error verifying receipt on-chain:", error);
            return false;
        }
    }
    
    /**
     * Extract public inputs from ZKPassport proof
     * @param proof ZKPassport proof
     * @returns Array of public inputs
     */
    private extractPublicInputs(proof: ZKPassportProof): string[] {
        const inputs: string[] = [];
        
        // Add age threshold (18+) as public input
        if (proof.result.age !== undefined) {
            inputs.push(proof.result.age >= 18 ? "1" : "0");
        }
        
        // Add nationality hash as public input
        if (proof.result.nationality) {
            const nationalityHash = ethers.keccak256(
                ethers.toUtf8Bytes(proof.result.nationality)
            );
            inputs.push(nationalityHash);
        }
        
        // Add uniqueness identifier hash
        if (proof.uniqueIdentifier) {
            const uniquenessHash = ethers.keccak256(
                ethers.toUtf8Bytes(proof.uniqueIdentifier)
            );
            inputs.push(uniquenessHash);
        }
        
        // Add timestamp
        inputs.push(proof.timestamp.toString());
        
        return inputs;
    }
    
    /**
     * Convert ZKPassport proof format to zkVerify format
     * @param proof ZKPassport proof string
     * @returns zkVerify-compatible proof string
     */
    private convertProofFormat(proof: string): string {
        // This is a placeholder - actual implementation would depend on
        // ZKPassport's specific proof format and zkVerify's requirements
        
        // For now, we'll assume the proof needs to be hex-encoded
        if (!proof.startsWith("0x")) {
            return "0x" + Buffer.from(proof, 'base64').toString('hex');
        }
        
        return proof;
    }
    
    /**
     * Generate verification key for zkVerify
     * @param proof ZKPassport proof
     * @returns Verification key string
     */
    private generateVerificationKey(proof: ZKPassportProof): string {
        // This would be the actual verification key used by ZKPassport
        // For now, we'll generate a placeholder based on the proof type
        
        const proofType = "zkpassport_identity_v1";
        return ethers.keccak256(ethers.toUtf8Bytes(proofType));
    }
    
    /**
     * Determine verification level based on ZKPassport proof
     * @param proof ZKPassport proof
     * @returns Verification level
     */
    private determineVerificationLevel(proof: ZKPassportProof): "basic" | "enhanced" | "institutional" {
        const attributeCount = Object.keys(proof.result).length;
        
        if (attributeCount >= 5) {
            return "institutional";
        } else if (attributeCount >= 3) {
            return "enhanced";
        } else {
            return "basic";
        }
    }
}

// Example usage
export async function exampleUsage() {
    // Initialize bridge with your Next.js API endpoint
    const bridge = new ZKVerifyBridge("http://localhost:3000/api");
    // Or in production: const bridge = new ZKVerifyBridge("https://yourdomain.com/api");
    
    // Simulate ZKPassport proof
    const zkPassportProof: ZKPassportProof = {
        uniqueIdentifier: "unique_user_123",
        verified: true,
        result: {
            age: 25,
            nationality: "US",
            firstname: "John"
        },
        proof: "base64_encoded_proof_data",
        timestamp: Date.now()
    };
    
    try {
        // Process complete verification flow
        const complianceProof = await bridge.processComplianceVerification(
            zkPassportProof,
            "0x1234567890123456789012345678901234567890",
            true // Submit to oracle contract
        );
        
        console.log("🎉 Compliance proof generated:", complianceProof);
        console.log("   zkVerify Job ID:", complianceProof.jobId);
        console.log("   zkVerify Receipt:", complianceProof.zkVerifyReceipt);
        console.log("   Oracle Tx Hash:", complianceProof.txHash);
        
    } catch (error) {
        console.error("💥 Error:", error);
    }
}

