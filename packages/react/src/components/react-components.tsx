import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { TrezaComplianceSDK, ComplianceStatus, VerificationResult, ComplianceRequirements } from '@treza/sdk';

/**
 * React Components for TREZA Compliance Integration
 * 
 * These components provide easy-to-use React integration for DApps
 * that want to add ZKPassport compliance features.
 */

interface ComplianceProviderProps {
    provider: ethers.Provider;
    signer?: ethers.Signer;
    children: React.ReactNode;
    verificationMode?: 'fallback' | 'oracle' | 'attestation' | 'hybrid';
    zkVerifyOracleAddress?: string;
    attestationSystemAddress?: string;
    transactionValueThreshold?: string;
}

interface ComplianceContextType {
    sdk: TrezaComplianceSDK | null;
    isLoading: boolean;
    error: string | null;
}

// Context for compliance SDK
const ComplianceContext = React.createContext<ComplianceContextType>({
    sdk: null,
    isLoading: true,
    error: null
});

/**
 * Provider component that initializes the compliance SDK
 */
export const ComplianceProvider: React.FC<ComplianceProviderProps> = ({
    provider,
    signer,
    children,
    verificationMode = 'hybrid',
    zkVerifyOracleAddress,
    attestationSystemAddress,
    transactionValueThreshold = '100'
}) => {
    const [sdk, setSdk] = useState<TrezaComplianceSDK | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        try {
            const config = {
                zkPassportDomain: "trezalabs.com",
                zkVerifyEndpoint: "https://api.zkverify.io",
                trezaTokenAddress: process.env.REACT_APP_TREZA_TOKEN_ADDRESS || "0x8278d4FbfaB7dac14eC0295421D0a2733b4504E5",
                complianceVerifierAddress: process.env.REACT_APP_COMPLIANCE_VERIFIER_ADDRESS || "0x8c0C6e0Eaf6bc693745A1A3a722e2c9028BBe874",
                complianceIntegrationAddress: process.env.REACT_APP_COMPLIANCE_INTEGRATION_ADDRESS || "0xf3ecfC409761D715F137Bfe7078Acec6d7F55428",
                zkVerifyOracleAddress: zkVerifyOracleAddress || process.env.REACT_APP_ZKVERIFY_ORACLE_ADDRESS,
                attestationSystemAddress: attestationSystemAddress || process.env.REACT_APP_ATTESTATION_SYSTEM_ADDRESS,
                verificationMode,
                transactionValueThreshold,
                provider,
                signer
            };
            
            const complianceSDK = new TrezaComplianceSDK(config);
            setSdk(complianceSDK);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize compliance SDK');
        } finally {
            setIsLoading(false);
        }
    }, [provider, signer]);
    
    return (
        <ComplianceContext.Provider value={{ sdk, isLoading, error }}>
            {children}
        </ComplianceContext.Provider>
    );
};

/**
 * Hook to use compliance context (for use within ComplianceProvider)
 */
export const useComplianceContext = () => {
    const context = React.useContext(ComplianceContext);
    if (!context) {
        throw new Error('useComplianceContext must be used within a ComplianceProvider');
    }
    return context;
};

/**
 * Props for ComplianceVerification component
 */
interface ComplianceVerificationProps {
    userAddress: string;
    requirements?: ComplianceRequirements;
    onVerificationComplete?: (result: VerificationResult) => void;
    onError?: (error: string) => void;
    className?: string;
}

/**
 * Main compliance verification component
 */
export const ComplianceVerification: React.FC<ComplianceVerificationProps> = ({
    userAddress,
    requirements,
    onVerificationComplete,
    onError,
    className = ""
}) => {
    const { sdk } = useComplianceContext();
    const [verificationUrl, setVerificationUrl] = useState<string>("");
    const [qrCode, setQrCode] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<'idle' | 'generating' | 'waiting' | 'processing' | 'complete' | 'error'>('idle');
    const [error, setError] = useState<string>("");
    
    const initiateVerification = useCallback(async () => {
        if (!sdk) return;
        
        setIsGenerating(true);
        setStatus('generating');
        setError("");
        
        try {
            const url = await sdk.initiateVerification(requirements);
            setVerificationUrl(url);
            
            const qr = await sdk.generateQRCode(url);
            setQrCode(qr);
            
            setStatus('waiting');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to initiate verification';
            setError(errorMessage);
            setStatus('error');
            onError?.(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    }, [sdk, requirements, onError]);
    
    const handleVerificationResult = useCallback(async (zkPassportResult: any) => {
        if (!sdk) return;
        
        setStatus('processing');
        
        try {
            const result = await sdk.processVerificationResult(zkPassportResult, userAddress);
            setStatus('complete');
            onVerificationComplete?.(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process verification';
            setError(errorMessage);
            setStatus('error');
            onError?.(errorMessage);
        }
    }, [sdk, userAddress, onVerificationComplete, onError]);
    
    return (
        <div className={`treza-compliance-verification ${className}`}>
            <div className="verification-header">
                <h3>🛡️ Identity Verification</h3>
                <p>Verify your identity to access TREZA features while keeping your personal data private.</p>
            </div>
            
            {status === 'idle' && (
                <div className="verification-start">
                    <button 
                        onClick={initiateVerification}
                        disabled={isGenerating}
                        className="btn-primary"
                    >
                        {isGenerating ? 'Generating...' : 'Start Verification'}
                    </button>
                </div>
            )}
            
            {status === 'generating' && (
                <div className="verification-generating">
                    <div className="spinner"></div>
                    <p>Generating verification request...</p>
                </div>
            )}
            
            {status === 'waiting' && (
                <div className="verification-waiting">
                    <div className="qr-code-section">
                        <h4>📱 Scan with ZKPassport App</h4>
                        {qrCode && (
                            <img 
                                src={qrCode} 
                                alt="Verification QR Code"
                                className="qr-code"
                            />
                        )}
                        <p>Scan this QR code with the ZKPassport mobile app to verify your identity.</p>
                        <a 
                            href={verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="verification-link"
                        >
                            Or open verification link directly
                        </a>
                    </div>
                    
                    <div className="verification-instructions">
                        <h5>Instructions:</h5>
                        <ol>
                            <li>Download the ZKPassport app if you haven't already</li>
                            <li>Scan the QR code above</li>
                            <li>Follow the app instructions to verify your government ID</li>
                            <li>Your verification will be processed automatically</li>
                        </ol>
                    </div>
                </div>
            )}
            
            {status === 'processing' && (
                <div className="verification-processing">
                    <div className="spinner"></div>
                    <p>Processing your verification...</p>
                </div>
            )}
            
            {status === 'complete' && (
                <div className="verification-complete">
                    <div className="success-icon">✅</div>
                    <h4>Verification Complete!</h4>
                    <p>Your identity has been verified successfully. You now have access to TREZA compliance features.</p>
                </div>
            )}
            
            {status === 'error' && (
                <div className="verification-error">
                    <div className="error-icon">❌</div>
                    <h4>Verification Error</h4>
                    <p>{error}</p>
                    <button 
                        onClick={() => setStatus('idle')}
                        className="btn-secondary"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * Props for ComplianceStatus component
 */
interface ComplianceStatusProps {
    userAddress: string;
    showDetails?: boolean;
    className?: string;
}

/**
 * Component to display current compliance status
 */
export const ComplianceStatusDisplay: React.FC<ComplianceStatusProps> = ({
    userAddress,
    showDetails = false,
    className = ""
}) => {
    const { sdk } = useComplianceContext();
    const [status, setStatus] = useState<ComplianceStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");
    
    useEffect(() => {
        const checkStatus = async () => {
            if (!sdk || !userAddress) return;
            
            setIsLoading(true);
            try {
                const complianceStatus = await sdk.checkComplianceStatus(userAddress);
                setStatus(complianceStatus);
                setError("");
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to check compliance status');
            } finally {
                setIsLoading(false);
            }
        };
        
        checkStatus();
    }, [sdk, userAddress]);
    
    if (isLoading) {
        return (
            <div className={`compliance-status loading ${className}`}>
                <div className="spinner"></div>
                <span>Checking compliance status...</span>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className={`compliance-status error ${className}`}>
                <span className="status-icon">⚠️</span>
                <span>Error: {error}</span>
            </div>
        );
    }
    
    if (!status) {
        return (
            <div className={`compliance-status unknown ${className}`}>
                <span className="status-icon">❓</span>
                <span>Status unknown</span>
            </div>
        );
    }
    
    return (
        <div className={`compliance-status ${status.isCompliant ? 'compliant' : 'non-compliant'} ${className}`}>
            <div className="status-header">
                <span className="status-icon">
                    {status.isCompliant ? '✅' : '❌'}
                </span>
                <span className="status-text">
                    {status.isCompliant ? 'Verified' : 'Not Verified'}
                </span>
            </div>
            
            {showDetails && status.isCompliant && (
                <div className="status-details">
                    <div className="detail-item">
                        <span className="label">Level:</span>
                        <span className="value">{status.verificationLevel}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Expires:</span>
                        <span className="value">
                            {new Date(status.expirationTime).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Attributes:</span>
                        <div className="attributes">
                            {status.attributes.ageVerified && <span className="attribute">Age ✓</span>}
                            {status.attributes.nationalityVerified && <span className="attribute">Nationality ✓</span>}
                            {status.attributes.uniquenessVerified && <span className="attribute">Uniqueness ✓</span>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Props for GovernanceEligibility component
 */
interface GovernanceEligibilityProps {
    userAddress: string;
    proposalId: number;
    className?: string;
}

/**
 * Component to display governance eligibility
 */
export const GovernanceEligibility: React.FC<GovernanceEligibilityProps> = ({
    userAddress,
    proposalId,
    className = ""
}) => {
    const { sdk } = useComplianceContext();
    const [eligibility, setEligibility] = useState<{
        canParticipate: boolean;
        votingWeight: number;
        complianceLevel: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const checkEligibility = async () => {
            if (!sdk || !userAddress) return;
            
            setIsLoading(true);
            try {
                const result = await sdk.checkGovernanceEligibility(userAddress, proposalId);
                setEligibility(result);
            } catch (err) {
                console.error('Error checking governance eligibility:', err);
            } finally {
                setIsLoading(false);
            }
        };
        
        checkEligibility();
    }, [sdk, userAddress, proposalId]);
    
    if (isLoading) {
        return (
            <div className={`governance-eligibility loading ${className}`}>
                <div className="spinner"></div>
                <span>Checking eligibility...</span>
            </div>
        );
    }
    
    if (!eligibility) {
        return (
            <div className={`governance-eligibility error ${className}`}>
                <span>Unable to check eligibility</span>
            </div>
        );
    }
    
    return (
        <div className={`governance-eligibility ${eligibility.canParticipate ? 'eligible' : 'ineligible'} ${className}`}>
            <div className="eligibility-status">
                <span className="status-icon">
                    {eligibility.canParticipate ? '🗳️' : '🚫'}
                </span>
                <span className="status-text">
                    {eligibility.canParticipate ? 'Eligible to Vote' : 'Not Eligible'}
                </span>
            </div>
            
            {eligibility.canParticipate && (
                <div className="voting-details">
                    <div className="voting-weight">
                        <span className="label">Voting Weight:</span>
                        <span className="value">{eligibility.votingWeight}x</span>
                    </div>
                    <div className="compliance-level">
                        <span className="label">Compliance Level:</span>
                        <span className="value">{eligibility.complianceLevel}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// CSS styles (you would typically put this in a separate CSS file)
export const complianceStyles = `
.treza-compliance-verification {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
}

.verification-header h3 {
    margin: 0 0 10px 0;
    color: #333;
}

.verification-header p {
    margin: 0 0 20px 0;
    color: #666;
    font-size: 14px;
}

.btn-primary, .btn-secondary {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover {
    background: #0056b3;
}

.btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.qr-code {
    max-width: 200px;
    height: auto;
    margin: 10px 0;
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.compliance-status {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 6px;
    margin: 10px 0;
}

.compliance-status.compliant {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.compliance-status.non-compliant {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.status-icon {
    margin-right: 8px;
    font-size: 18px;
}

.status-details {
    margin-top: 10px;
    font-size: 14px;
}

.detail-item {
    margin: 5px 0;
}

.label {
    font-weight: bold;
    margin-right: 8px;
}

.attributes {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.attribute {
    background: #e9ecef;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
}
`;
