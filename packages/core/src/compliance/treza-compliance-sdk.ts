import { ZKPassport } from "@zkpassport/sdk";
import { ethers } from "ethers";
import { ZKVerifyBridge } from "./zkverify-bridge";

/**
 * TREZA Compliance SDK
 * 
 * A comprehensive SDK that provides easy integration of ZKPassport + zkVerify
 * compliance features for DApps in the TREZA ecosystem.
 */

export interface TrezaComplianceConfig {
    zkPassportDomain: string;
    zkVerifyEndpoint: string;
    zkVerifyApiKey?: string;
    trezaTokenAddress: string;
    complianceVerifierAddress: string;
    complianceIntegrationAddress: string;
    zkVerifyOracleAddress?: string;
    attestationSystemAddress?: string;
    provider: ethers.Provider;
    signer?: ethers.Signer;
    verificationMode?: 'fallback' | 'oracle' | 'attestation' | 'hybrid';
    transactionValueThreshold?: string; // ETH value threshold for attestation vs oracle
}

export interface ComplianceRequirements {
    minAge?: number;
    allowedCountries?: string[];
    requiredAttributes?: string[];
    verificationLevel?: "basic" | "enhanced" | "institutional";
}

export interface ComplianceStatus {
    isCompliant: boolean;
    verificationLevel: string;
    expirationTime: number;
    attributes: {
        ageVerified: boolean;
        nationalityVerified: boolean;
        uniquenessVerified: boolean;
    };
    zkVerifyReceipt?: string;
}

export interface VerificationResult {
    success: boolean;
    userAddress: string;
    complianceStatus: ComplianceStatus;
    transactionHash?: string;
    error?: string;
}

export class TrezaComplianceSDK {
    private zkPassport: ZKPassport;
    private zkVerifyBridge: ZKVerifyBridge;
    private config: TrezaComplianceConfig;
    private complianceVerifierContract: ethers.Contract;
    private complianceIntegrationContract: ethers.Contract;
    private zkVerifyOracleContract?: ethers.Contract;
    private attestationSystemContract?: ethers.Contract;
    
    constructor(config: TrezaComplianceConfig) {
        this.config = config;
        this.zkPassport = new ZKPassport(config.zkPassportDomain);
        this.zkVerifyBridge = new ZKVerifyBridge(config.zkVerifyEndpoint, config.zkVerifyApiKey);
        
        // Initialize smart contracts
        this.complianceVerifierContract = new ethers.Contract(
            config.complianceVerifierAddress,
            this.getComplianceVerifierABI(),
            config.provider
        );
        
        this.complianceIntegrationContract = new ethers.Contract(
            config.complianceIntegrationAddress,
            this.getComplianceIntegrationABI(),
            config.provider
        );
        
        // Initialize Oracle contract if provided
        if (config.zkVerifyOracleAddress) {
            this.zkVerifyOracleContract = new ethers.Contract(
                config.zkVerifyOracleAddress,
                this.getZKVerifyOracleABI(),
                config.provider
            );
        }
        
        // Initialize Attestation System contract if provided
        if (config.attestationSystemAddress) {
            this.attestationSystemContract = new ethers.Contract(
                config.attestationSystemAddress,
                this.getAttestationSystemABI(),
                config.provider
            );
        }
    }
    
    /**
     * Initiate compliance verification for a user
     * @param requirements Compliance requirements
     * @returns Verification URL for user to scan
     */
    async initiateVerification(requirements: ComplianceRequirements = {}): Promise<string> {
        console.log("🚀 Initiating compliance verification...");
        
        try {
            const queryBuilder = await this.zkPassport.request({
                name: "TREZA Token Compliance",
                logo: "https://treza.finance/logo.png",
                purpose: "Verify identity for TREZA token compliance",
                scope: "treza-kyc-compliance",
            });
            
            // Apply requirements
            let builder = queryBuilder;
            
            if (requirements.minAge) {
                builder = builder.gte("age", requirements.minAge);
            } else {
                builder = builder.gte("age", 18); // Default minimum age
            }
            
            if (requirements.allowedCountries && requirements.allowedCountries.length > 0) {
                builder = builder.in("nationality", requirements.allowedCountries);
            }
            
            if (requirements.requiredAttributes) {
                requirements.requiredAttributes.forEach(attr => {
                    builder = builder.disclose(attr);
                });
            }
            
            const { url } = builder.done();
            
            console.log("✅ Verification URL generated:", url);
            return url;
            
        } catch (error) {
            console.error("❌ Error initiating verification:", error);
            throw new Error(`Verification initiation failed: ${error.message}`);
        }
    }
    
    /**
     * Process verification result from ZKPassport
     * @param zkPassportResult Result from ZKPassport verification
     * @param userAddress Ethereum address of the user
     * @returns Complete verification result
     */
    async processVerificationResult(
        zkPassportResult: any,
        userAddress: string
    ): Promise<VerificationResult> {
        console.log("🔄 Processing verification result for:", userAddress);
        
        try {
            if (!zkPassportResult.verified) {
                return {
                    success: false,
                    userAddress,
                    complianceStatus: {
                        isCompliant: false,
                        verificationLevel: "none",
                        expirationTime: 0,
                        attributes: {
                            ageVerified: false,
                            nationalityVerified: false,
                            uniquenessVerified: false
                        }
                    },
                    error: "ZKPassport verification failed"
                };
            }
            
            // Step 1: Process through zkVerify bridge
            const complianceProof = await this.zkVerifyBridge.processComplianceVerification(
                zkPassportResult,
                userAddress
            );
            
            // Step 2: Submit to smart contract
            const transactionHash = await this.submitComplianceToContract(complianceProof);
            
            // Step 3: Return success result
            const complianceStatus: ComplianceStatus = {
                isCompliant: true,
                verificationLevel: complianceProof.verificationLevel,
                expirationTime: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year from now
                attributes: complianceProof.attributes,
                zkVerifyReceipt: complianceProof.zkVerifyReceipt
            };
            
            console.log("✅ Verification processing completed successfully");
            
            return {
                success: true,
                userAddress,
                complianceStatus,
                transactionHash
            };
            
        } catch (error) {
            console.error("❌ Error processing verification result:", error);
            
            return {
                success: false,
                userAddress,
                complianceStatus: {
                    isCompliant: false,
                    verificationLevel: "error",
                    expirationTime: 0,
                    attributes: {
                        ageVerified: false,
                        nationalityVerified: false,
                        uniquenessVerified: false
                    }
                },
                error: error.message
            };
        }
    }
    
    /**
     * Check current compliance status for a user
     * @param userAddress Ethereum address to check
     * @returns Current compliance status
     */
    async checkComplianceStatus(userAddress: string): Promise<ComplianceStatus> {
        console.log("🔍 Checking compliance status for:", userAddress);
        
        try {
            const contractStatus = await this.complianceVerifierContract.getComplianceStatus(userAddress);
            
            const complianceStatus: ComplianceStatus = {
                isCompliant: contractStatus.isVerified && Date.now() / 1000 <= contractStatus.expirationTimestamp,
                verificationLevel: contractStatus.verificationLevel,
                expirationTime: contractStatus.expirationTimestamp * 1000,
                attributes: {
                    ageVerified: true, // Assume verified if compliance exists
                    nationalityVerified: true,
                    uniquenessVerified: true
                }
            };
            
            console.log("✅ Compliance status retrieved");
            return complianceStatus;
            
        } catch (error) {
            console.error("❌ Error checking compliance status:", error);
            
            return {
                isCompliant: false,
                verificationLevel: "none",
                expirationTime: 0,
                attributes: {
                    ageVerified: false,
                    nationalityVerified: false,
                    uniquenessVerified: false
                }
            };
        }
    }
    
    /**
     * Check if user can participate in governance
     * @param userAddress User's Ethereum address
     * @param proposalId Governance proposal ID
     * @returns Governance eligibility and voting weight
     */
    async checkGovernanceEligibility(userAddress: string, proposalId: number): Promise<{
        canParticipate: boolean;
        votingWeight: number;
        complianceLevel: string;
    }> {
        console.log("🗳️ Checking governance eligibility for:", userAddress);
        
        try {
            const result = await this.complianceIntegrationContract.checkGovernanceEligibility(
                userAddress,
                proposalId
            );
            
            return {
                canParticipate: result.canParticipate,
                votingWeight: result.votingWeight.toNumber(),
                complianceLevel: result.complianceLevel || "basic"
            };
            
        } catch (error) {
            console.error("❌ Error checking governance eligibility:", error);
            
            return {
                canParticipate: false,
                votingWeight: 0,
                complianceLevel: "none"
            };
        }
    }
    
    /**
     * Batch check compliance for multiple users
     * @param userAddresses Array of addresses to check
     * @returns Array of compliance statuses
     */
    async batchCheckCompliance(userAddresses: string[]): Promise<ComplianceStatus[]> {
        console.log("📊 Batch checking compliance for", userAddresses.length, "users");
        
        try {
            const results = await this.complianceIntegrationContract.batchCheckCompliance(userAddresses);
            
            return results.map((isCompliant: boolean, index: number) => ({
                isCompliant,
                verificationLevel: isCompliant ? "basic" : "none",
                expirationTime: isCompliant ? Date.now() + (365 * 24 * 60 * 60 * 1000) : 0,
                attributes: {
                    ageVerified: isCompliant,
                    nationalityVerified: isCompliant,
                    uniquenessVerified: isCompliant
                }
            }));
            
        } catch (error) {
            console.error("❌ Error in batch compliance check:", error);
            
            // Return default non-compliant status for all users
            return userAddresses.map(() => ({
                isCompliant: false,
                verificationLevel: "none",
                expirationTime: 0,
                attributes: {
                    ageVerified: false,
                    nationalityVerified: false,
                    uniquenessVerified: false
                }
            }));
        }
    }
    
    /**
     * Generate QR code for verification URL
     * @param verificationUrl URL from initiateVerification
     * @returns Base64 encoded QR code image
     */
    async generateQRCode(verificationUrl: string): Promise<string> {
        // This would typically use a QR code library
        // For now, we'll return a placeholder
        console.log("📱 Generating QR code for verification URL");
        
        try {
            // In a real implementation, you'd use a library like 'qrcode'
            // const QRCode = require('qrcode');
            // return await QRCode.toDataURL(verificationUrl);
            
            // Placeholder implementation
            return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
            
        } catch (error) {
            console.error("❌ Error generating QR code:", error);
            throw error;
        }
    }
    
    /**
     * Process verification using Oracle system
     * @param zkPassportResult ZKPassport verification result
     * @param userAddress User's Ethereum address
     * @returns Verification result
     */
    async processVerificationWithOracle(
        zkPassportResult: any,
        userAddress: string
    ): Promise<VerificationResult> {
        console.log("🔮 Processing verification with Oracle system...");
        
        if (!this.zkVerifyOracleContract) {
            throw new Error("Oracle contract not configured");
        }
        
        try {
            // Step 1: Process through zkVerify bridge
            const complianceProof = await this.zkVerifyBridge.processComplianceVerification(
                zkPassportResult,
                userAddress
            );
            
            // Step 2: Check if oracle has verified this proof
            const isVerified = await this.zkVerifyOracleContract.isProofVerified(complianceProof.proofHash);
            
            if (!isVerified) {
                // Wait for oracle verification (in production, you'd poll or use events)
                console.log("⏳ Waiting for oracle verification...");
                await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second wait
                
                const isVerifiedAfterWait = await this.zkVerifyOracleContract.isProofVerified(complianceProof.proofHash);
                if (!isVerifiedAfterWait) {
                    throw new Error("Oracle verification timeout");
                }
            }
            
            // Step 3: Submit to compliance contract
            const transactionHash = await this.submitComplianceToContract(complianceProof);
            
            const complianceStatus: ComplianceStatus = {
                isCompliant: true,
                verificationLevel: complianceProof.verificationLevel,
                expirationTime: Date.now() + (365 * 24 * 60 * 60 * 1000),
                attributes: complianceProof.attributes,
                zkVerifyReceipt: complianceProof.zkVerifyReceipt
            };
            
            console.log("✅ Oracle verification completed successfully");
            
            return {
                success: true,
                userAddress,
                complianceStatus,
                transactionHash
            };
            
        } catch (error) {
            console.error("❌ Error in oracle verification:", error);
            
            return {
                success: false,
                userAddress,
                complianceStatus: {
                    isCompliant: false,
                    verificationLevel: "error",
                    expirationTime: 0,
                    attributes: {
                        ageVerified: false,
                        nationalityVerified: false,
                        uniquenessVerified: false
                    }
                },
                error: error.message
            };
        }
    }
    
    /**
     * Process verification using Attestation system
     * @param zkPassportResult ZKPassport verification result
     * @param userAddress User's Ethereum address
     * @param attestationLevel Required attestation level
     * @returns Verification result
     */
    async processVerificationWithAttestation(
        zkPassportResult: any,
        userAddress: string,
        attestationLevel: 'basic' | 'enhanced' | 'institutional' = 'basic'
    ): Promise<VerificationResult> {
        console.log("🏛️ Processing verification with Attestation system...");
        
        if (!this.attestationSystemContract) {
            throw new Error("Attestation system contract not configured");
        }
        
        try {
            // Step 1: Process through zkVerify bridge
            const complianceProof = await this.zkVerifyBridge.processComplianceVerification(
                zkPassportResult,
                userAddress
            );
            
            // Step 2: Check if attestation exists
            const attestationLevelMap = { basic: 0, enhanced: 1, institutional: 2 };
            const isAttested = await this.attestationSystemContract.isProofAttested(
                complianceProof.proofHash,
                attestationLevelMap[attestationLevel]
            );
            
            if (!isAttested) {
                // In production, this would trigger attester notification
                console.log("⏳ Waiting for professional attestation...");
                throw new Error("Attestation required - please wait for professional review");
            }
            
            // Step 3: Submit to compliance contract
            const transactionHash = await this.submitComplianceToContract(complianceProof);
            
            const complianceStatus: ComplianceStatus = {
                isCompliant: true,
                verificationLevel: attestationLevel,
                expirationTime: Date.now() + (180 * 24 * 60 * 60 * 1000), // 180 days for attestations
                attributes: complianceProof.attributes,
                zkVerifyReceipt: complianceProof.zkVerifyReceipt
            };
            
            console.log("✅ Attestation verification completed successfully");
            
            return {
                success: true,
                userAddress,
                complianceStatus,
                transactionHash
            };
            
        } catch (error) {
            console.error("❌ Error in attestation verification:", error);
            
            return {
                success: false,
                userAddress,
                complianceStatus: {
                    isCompliant: false,
                    verificationLevel: "error",
                    expirationTime: 0,
                    attributes: {
                        ageVerified: false,
                        nationalityVerified: false,
                        uniquenessVerified: false
                    }
                },
                error: error.message
            };
        }
    }
    
    /**
     * Process verification using Hybrid system (smart routing)
     * @param zkPassportResult ZKPassport verification result
     * @param userAddress User's Ethereum address
     * @param transactionValue Transaction value in ETH (for routing decision)
     * @returns Verification result
     */
    async processVerificationHybrid(
        zkPassportResult: any,
        userAddress: string,
        transactionValue?: string
    ): Promise<VerificationResult> {
        console.log("🔀 Processing verification with Hybrid system...");
        
        const threshold = this.config.transactionValueThreshold || "100"; // Default 100 ETH
        const useAttestation = transactionValue && 
            parseFloat(transactionValue) >= parseFloat(threshold);
        
        if (useAttestation && this.attestationSystemContract) {
            console.log("📈 High-value transaction - using attestation system");
            return this.processVerificationWithAttestation(zkPassportResult, userAddress, 'enhanced');
        } else if (this.zkVerifyOracleContract) {
            console.log("📊 Standard transaction - using oracle system");
            return this.processVerificationWithOracle(zkPassportResult, userAddress);
        } else {
            console.log("🔄 Falling back to standard verification");
            return this.processVerificationResult(zkPassportResult, userAddress);
        }
    }
    
    /**
     * Get verification mode configuration
     * @returns Current verification mode and available systems
     */
    async getVerificationMode(): Promise<{
        mode: string;
        oracleAvailable: boolean;
        attestationAvailable: boolean;
        currentMode: number;
    }> {
        try {
            const currentMode = await this.complianceVerifierContract.verificationMode();
            const modeNames = ['fallback', 'oracle', 'attestation', 'hybrid'];
            
            return {
                mode: this.config.verificationMode || modeNames[currentMode] || 'fallback',
                oracleAvailable: !!this.zkVerifyOracleContract,
                attestationAvailable: !!this.attestationSystemContract,
                currentMode: currentMode
            };
        } catch (error) {
            console.error("❌ Error getting verification mode:", error);
            return {
                mode: 'fallback',
                oracleAvailable: false,
                attestationAvailable: false,
                currentMode: 0
            };
        }
    }
    
    /**
     * Submit compliance proof to smart contract
     * @param complianceProof Proof from zkVerify bridge
     * @returns Transaction hash
     */
    private async submitComplianceToContract(complianceProof: any): Promise<string> {
        if (!this.config.signer) {
            throw new Error("Signer required for contract submission");
        }
        
        const contractWithSigner = this.complianceVerifierContract.connect(this.config.signer);
        
        const tx = await contractWithSigner.verifyCompliance(
            complianceProof.userAddress,
            complianceProof.proofHash,
            complianceProof.verificationLevel
        );
        
        await tx.wait();
        return tx.hash;
    }
    
    /**
     * Get ABI for ComplianceVerifier contract
     */
    private getComplianceVerifierABI(): string[] {
        return [
            "function verifyCompliance(address user, bytes32 proofHash, string memory verificationLevel) external",
            "function isCompliant(address user) external view returns (bool)",
            "function getComplianceStatus(address user) external view returns (tuple(bool isVerified, bytes32 proofHash, uint256 verificationTimestamp, uint256 expirationTimestamp, string verificationLevel))"
        ];
    }
    
    /**
     * Get ABI for ComplianceIntegration contract
     */
    private getComplianceIntegrationABI(): string[] {
        return [
            "function checkGovernanceEligibility(address user, uint256 proposalId) external returns (bool canParticipate, uint256 votingWeight)",
            "function batchCheckCompliance(address[] calldata users) external view returns (bool[] memory)",
            "function isUserCompliant(address user) external returns (bool)"
        ];
    }
    
    /**
     * Get ABI for ZKVerifyOracle contract
     */
    private getZKVerifyOracleABI(): string[] {
        return [
            "function isProofVerified(bytes32 proofHash) external view returns (bool verified)",
            "function getVerificationResult(bytes32 proofHash) external view returns (tuple(bool verified, bytes32 zkVerifyBlockHash, bytes32 proofHash, uint256 timestamp, address submitter, uint256 confirmations, bool finalized))",
            "function isResultFinalized(bytes32 proofHash) external view returns (bool finalized)",
            "function getActiveOracleCount() external view returns (uint256 count)",
            "function getRequiredConfirmations() external view returns (uint256 confirmations)"
        ];
    }
    
    /**
     * Get ABI for AttestationSystem contract
     */
    private getAttestationSystemABI(): string[] {
        return [
            "function isProofAttested(bytes32 proofHash, uint8 minLevel) external view returns (bool valid)",
            "function getAttestation(bytes32 proofHash) external view returns (tuple(bool verified, address attester, uint8 level, uint8 attesterTier, uint8 status, bytes32 zkVerifyBlockHash, uint256 timestamp, uint256 expirationTimestamp, uint256 stakeAmount, string metadata, bytes signature))",
            "function getAttesterProfile(address attester) external view returns (tuple(bool isActive, uint8 tier, uint256 totalAttestations, uint256 successfulAttestations, uint256 challengedAttestations, uint256 stakedAmount, uint256 earnedFees, uint256 slashedAmount, uint256 registrationTimestamp, string companyName, string licenseNumber, string jurisdiction, string[] specializations))",
            "function isQualifiedAttester(address attester, uint8 level) external view returns (bool qualified)",
            "function getAttestationFee(address attester, uint8 level) external view returns (uint256 fee)",
            "function getActiveAttesterCount() external view returns (uint256 count)"
        ];
    }
}

// Example usage and helper functions
export class TrezaComplianceHelper {
    /**
     * Create SDK instance with default configuration
     * @param provider Ethereum provider
     * @param signer Optional signer for transactions
     * @returns Configured SDK instance
     */
    static createSDK(
        provider: ethers.Provider,
        signer?: ethers.Signer,
        options?: {
            verificationMode?: 'fallback' | 'oracle' | 'attestation' | 'hybrid';
            zkVerifyOracleAddress?: string;
            attestationSystemAddress?: string;
            transactionValueThreshold?: string;
        }
    ): TrezaComplianceSDK {
        const config: TrezaComplianceConfig = {
            zkPassportDomain: "treza.finance",
            zkVerifyEndpoint: "https://api.zkverify.io",
            trezaTokenAddress: "0x8278d4FbfaB7dac14eC0295421D0a2733b4504E5", // Mock TREZA Token on Sepolia
            complianceVerifierAddress: "0x8c0C6e0Eaf6bc693745A1A3a722e2c9028BBe874", // ZKPassportVerifier on Sepolia
            complianceIntegrationAddress: "0xf3ecfC409761D715F137Bfe7078Acec6d7F55428", // TrezaComplianceIntegration on Sepolia
            zkVerifyOracleAddress: options?.zkVerifyOracleAddress, // Will be set after deployment
            attestationSystemAddress: options?.attestationSystemAddress, // Will be set after deployment
            verificationMode: options?.verificationMode || 'hybrid',
            transactionValueThreshold: options?.transactionValueThreshold || "100", // 100 ETH threshold
            provider,
            signer
        };
        
        return new TrezaComplianceSDK(config);
    }
    
    /**
     * Create SDK instance for production with Oracle and Attestation systems
     * @param provider Ethereum provider
     * @param signer Optional signer for transactions
     * @param oracleAddress ZKVerifyOracle contract address
     * @param attestationAddress AttestationSystem contract address
     * @returns Configured SDK instance with production systems
     */
    static createProductionSDK(
        provider: ethers.Provider,
        oracleAddress: string,
        attestationAddress: string,
        signer?: ethers.Signer
    ): TrezaComplianceSDK {
        const config: TrezaComplianceConfig = {
            zkPassportDomain: "treza.finance",
            zkVerifyEndpoint: "https://api.zkverify.io",
            trezaTokenAddress: "0x8278d4FbfaB7dac14eC0295421D0a2733b4504E5",
            complianceVerifierAddress: "0x8c0C6e0Eaf6bc693745A1A3a722e2c9028BBe874",
            complianceIntegrationAddress: "0xf3ecfC409761D715F137Bfe7078Acec6d7F55428",
            zkVerifyOracleAddress: oracleAddress,
            attestationSystemAddress: attestationAddress,
            verificationMode: 'hybrid',
            transactionValueThreshold: "100", // 100 ETH threshold
            provider,
            signer
        };
        
        return new TrezaComplianceSDK(config);
    }
    
    /**
     * Default compliance requirements for TREZA
     */
    static getDefaultRequirements(): ComplianceRequirements {
        return {
            minAge: 18,
            allowedCountries: ["US", "CA", "GB", "DE", "FR", "AU", "JP", "SG"],
            requiredAttributes: ["firstname"],
            verificationLevel: "basic"
        };
    }
}
