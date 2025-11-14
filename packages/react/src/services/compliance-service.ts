import { TrezaComplianceSDK, ComplianceStatus, VerificationResult, ComplianceRequirements } from '@treza/sdk';
import { ethers } from 'ethers';

/**
 * React-specific service wrapper for TREZA Compliance SDK
 * 
 * This service provides React-optimized methods for compliance operations
 * with proper error handling and state management integration.
 */

export interface ComplianceServiceConfig {
    zkPassportDomain?: string;
    zkVerifyEndpoint?: string;
    zkVerifyApiKey?: string;
    trezaTokenAddress?: string;
    complianceVerifierAddress?: string;
    complianceIntegrationAddress?: string;
}

export class ComplianceService {
    private sdk: TrezaComplianceSDK | null = null;
    private config: ComplianceServiceConfig;

    constructor(config: ComplianceServiceConfig = {}) {
        this.config = {
            zkPassportDomain: "trezalabs.com",
            zkVerifyEndpoint: "https://api.zkverify.io",
            trezaTokenAddress: process.env.REACT_APP_TREZA_TOKEN_ADDRESS || "0x8278d4FbfaB7dac14eC0295421D0a2733b4504E5",
            complianceVerifierAddress: process.env.REACT_APP_COMPLIANCE_VERIFIER_ADDRESS || "0x8c0C6e0Eaf6bc693745A1A3a722e2c9028BBe874",
            complianceIntegrationAddress: process.env.REACT_APP_COMPLIANCE_INTEGRATION_ADDRESS || "0xf3ecfC409761D715F137Bfe7078Acec6d7F55428",
            ...config
        };
    }

    /**
     * Initialize the compliance SDK with provider and signer
     */
    async initialize(provider: ethers.Provider, signer?: ethers.Signer): Promise<void> {
        try {
            this.sdk = new TrezaComplianceSDK({
                zkPassportDomain: this.config.zkPassportDomain!,
                zkVerifyEndpoint: this.config.zkVerifyEndpoint!,
                zkVerifyApiKey: this.config.zkVerifyApiKey,
                trezaTokenAddress: this.config.trezaTokenAddress!,
                complianceVerifierAddress: this.config.complianceVerifierAddress!,
                complianceIntegrationAddress: this.config.complianceIntegrationAddress!,
                provider,
                signer
            });
        } catch (error) {
            console.error('Failed to initialize compliance service:', error);
            throw error;
        }
    }

    /**
     * Get the initialized SDK instance
     */
    getSDK(): TrezaComplianceSDK {
        if (!this.sdk) {
            throw new Error('Compliance service not initialized. Call initialize() first.');
        }
        return this.sdk;
    }

    /**
     * Check if the service is initialized
     */
    isInitialized(): boolean {
        return this.sdk !== null;
    }

    /**
     * Initiate verification with React-friendly error handling
     */
    async initiateVerification(requirements?: ComplianceRequirements): Promise<{
        success: boolean;
        url?: string;
        error?: string;
    }> {
        try {
            if (!this.sdk) {
                throw new Error('Service not initialized');
            }

            const url = await this.sdk.initiateVerification(requirements);
            return { success: true, url };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Process verification result with React-friendly error handling
     */
    async processVerificationResult(
        zkPassportResult: any,
        userAddress: string
    ): Promise<{
        success: boolean;
        result?: VerificationResult;
        error?: string;
    }> {
        try {
            if (!this.sdk) {
                throw new Error('Service not initialized');
            }

            const result = await this.sdk.processVerificationResult(zkPassportResult, userAddress);
            return { success: true, result };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Check compliance status with React-friendly error handling
     */
    async checkComplianceStatus(userAddress: string): Promise<{
        success: boolean;
        status?: ComplianceStatus;
        error?: string;
    }> {
        try {
            if (!this.sdk) {
                throw new Error('Service not initialized');
            }

            const status = await this.sdk.checkComplianceStatus(userAddress);
            return { success: true, status };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Generate QR code for verification URL
     */
    async generateQRCode(url: string): Promise<{
        success: boolean;
        qrCode?: string;
        error?: string;
    }> {
        try {
            if (!this.sdk) {
                throw new Error('Service not initialized');
            }

            const qrCode = await this.sdk.generateQRCode(url);
            return { success: true, qrCode };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Batch check compliance for multiple users
     */
    async batchCheckCompliance(userAddresses: string[]): Promise<{
        success: boolean;
        results?: ComplianceStatus[];
        error?: string;
    }> {
        try {
            if (!this.sdk) {
                throw new Error('Service not initialized');
            }

            const results = await this.sdk.batchCheckCompliance(userAddresses);
            return { success: true, results };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Check governance eligibility
     */
    async checkGovernanceEligibility(userAddress: string, proposalId?: string): Promise<{
        success: boolean;
        eligibility?: any;
        error?: string;
    }> {
        try {
            if (!this.sdk) {
                throw new Error('Service not initialized');
            }

            if (!proposalId) {
                throw new Error('Proposal ID is required');
            }

            const proposalIdNum = parseInt(proposalId, 10);
            if (isNaN(proposalIdNum)) {
                throw new Error('Invalid proposal ID: must be a number');
            }

            const eligibility = await this.sdk.checkGovernanceEligibility(userAddress, proposalIdNum);
            return { success: true, eligibility };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.sdk = null;
    }
}

// Singleton instance for React apps
let complianceServiceInstance: ComplianceService | null = null;

/**
 * Get or create the global compliance service instance
 */
export function getComplianceService(config?: ComplianceServiceConfig): ComplianceService {
    if (!complianceServiceInstance) {
        complianceServiceInstance = new ComplianceService(config);
    }
    return complianceServiceInstance;
}

/**
 * Reset the global compliance service instance
 */
export function resetComplianceService(): void {
    if (complianceServiceInstance) {
        complianceServiceInstance.destroy();
        complianceServiceInstance = null;
    }
}
