import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { ComplianceService, getComplianceService } from './compliance-service';
import { WalletService, getWalletService, WalletInfo } from './wallet-service';
import { ComplianceStatus, VerificationResult, ComplianceRequirements } from '@treza/sdk';

/**
 * Custom React hooks for TREZA SDK integration
 * 
 * These hooks provide easy-to-use React integration for compliance and wallet functionality
 */

// =========================================================================
// WALLET HOOKS
// =========================================================================

export interface UseWalletResult {
    isConnected: boolean;
    isConnecting: boolean;
    walletInfo: WalletInfo | null;
    provider: ethers.Provider | null;
    signer: ethers.Signer | null;
    address: string | null;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    switchNetwork: (chainId: number) => Promise<void>;
}

/**
 * Hook for wallet connection and management
 */
export function useWallet(): UseWalletResult {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
    const [provider, setProvider] = useState<ethers.Provider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const walletService = useRef<WalletService>(getWalletService());

    const connect = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        try {
            const result = await walletService.current.connectWallet();
            
            if (result.success) {
                setIsConnected(true);
                setProvider(result.provider || null);
                setSigner(result.signer || null);
                setAddress(result.address || null);
                
                // Get wallet info
                const info = await walletService.current.getWalletInfo();
                setWalletInfo(info);
            } else {
                setError(result.error || 'Failed to connect wallet');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        walletService.current.disconnect();
        setIsConnected(false);
        setProvider(null);
        setSigner(null);
        setAddress(null);
        setWalletInfo(null);
        setError(null);
    }, []);

    const switchNetwork = useCallback(async (chainId: number) => {
        setError(null);
        
        try {
            const result = await walletService.current.switchNetwork(chainId);
            if (!result.success) {
                setError(result.error || 'Failed to switch network');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to switch network');
        }
    }, []);

    // Set up event listeners
    useEffect(() => {
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnect();
            } else {
                setAddress(accounts[0]);
            }
        };

        const handleChainChanged = () => {
            // Reload wallet info when chain changes
            if (isConnected) {
                walletService.current.getWalletInfo().then(setWalletInfo);
            }
        };

        walletService.current.onAccountsChanged(handleAccountsChanged);
        walletService.current.onChainChanged(handleChainChanged);

        return () => {
            walletService.current.removeAllListeners();
        };
    }, [isConnected, disconnect]);

    return {
        isConnected,
        isConnecting,
        walletInfo,
        provider,
        signer,
        address,
        error,
        connect,
        disconnect,
        switchNetwork
    };
}

// =========================================================================
// COMPLIANCE HOOKS
// =========================================================================

export interface UseComplianceResult {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    initiateVerification: (requirements?: ComplianceRequirements) => Promise<string | null>;
    processVerification: (zkPassportResult: any, userAddress: string) => Promise<VerificationResult | null>;
    checkCompliance: (userAddress: string) => Promise<ComplianceStatus | null>;
    generateQRCode: (url: string) => Promise<string | null>;
}

/**
 * Hook for compliance operations
 */
export function useCompliance(provider?: ethers.Provider, signer?: ethers.Signer): UseComplianceResult {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const complianceService = useRef<ComplianceService>(getComplianceService());

    // Initialize service when provider/signer changes
    useEffect(() => {
        if (provider) {
            setIsLoading(true);
            complianceService.current.initialize(provider, signer)
                .then(() => {
                    setIsInitialized(true);
                    setError(null);
                })
                .catch((err) => {
                    setError(err instanceof Error ? err.message : 'Failed to initialize compliance');
                    setIsInitialized(false);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsInitialized(false);
        }
    }, [provider, signer]);

    const initiateVerification = useCallback(async (requirements?: ComplianceRequirements): Promise<string | null> => {
        setError(null);
        const result = await complianceService.current.initiateVerification(requirements);
        
        if (result.success) {
            return result.url || null;
        } else {
            setError(result.error || 'Failed to initiate verification');
            return null;
        }
    }, []);

    const processVerification = useCallback(async (
        zkPassportResult: any, 
        userAddress: string
    ): Promise<VerificationResult | null> => {
        setError(null);
        const result = await complianceService.current.processVerificationResult(zkPassportResult, userAddress);
        
        if (result.success) {
            return result.result || null;
        } else {
            setError(result.error || 'Failed to process verification');
            return null;
        }
    }, []);

    const checkCompliance = useCallback(async (userAddress: string): Promise<ComplianceStatus | null> => {
        setError(null);
        const result = await complianceService.current.checkComplianceStatus(userAddress);
        
        if (result.success) {
            return result.status || null;
        } else {
            setError(result.error || 'Failed to check compliance');
            return null;
        }
    }, []);

    const generateQRCode = useCallback(async (url: string): Promise<string | null> => {
        setError(null);
        const result = await complianceService.current.generateQRCode(url);
        
        if (result.success) {
            return result.qrCode || null;
        } else {
            setError(result.error || 'Failed to generate QR code');
            return null;
        }
    }, []);

    return {
        isInitialized,
        isLoading,
        error,
        initiateVerification,
        processVerification,
        checkCompliance,
        generateQRCode
    };
}

// =========================================================================
// COMBINED HOOKS
// =========================================================================

export interface UseTrezaResult {
    wallet: UseWalletResult;
    compliance: UseComplianceResult;
    isReady: boolean;
}

/**
 * Combined hook for wallet and compliance functionality
 */
export function useTreza(): UseTrezaResult {
    const wallet = useWallet();
    const compliance = useCompliance(wallet.provider || undefined, wallet.signer || undefined);

    const isReady = wallet.isConnected && compliance.isInitialized;

    return {
        wallet,
        compliance,
        isReady
    };
}

// =========================================================================
// VERIFICATION FLOW HOOK
// =========================================================================

export interface UseVerificationFlowResult {
    status: 'idle' | 'generating' | 'waiting' | 'processing' | 'completed' | 'error';
    verificationUrl: string | null;
    qrCode: string | null;
    result: VerificationResult | null;
    error: string | null;
    startVerification: (userAddress: string, requirements?: ComplianceRequirements) => Promise<void>;
    processResult: (zkPassportResult: any) => Promise<void>;
    reset: () => void;
}

/**
 * Hook for managing the complete verification flow
 */
export function useVerificationFlow(provider?: ethers.Provider, signer?: ethers.Signer): UseVerificationFlowResult {
    const [status, setStatus] = useState<'idle' | 'generating' | 'waiting' | 'processing' | 'completed' | 'error'>('idle');
    const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);

    const compliance = useCompliance(provider, signer);

    const startVerification = useCallback(async (userAddress: string, requirements?: ComplianceRequirements) => {
        setStatus('generating');
        setError(null);
        setResult(null);
        setCurrentUserAddress(userAddress);

        try {
            const url = await compliance.initiateVerification(requirements);
            if (url) {
                setVerificationUrl(url);
                
                const qr = await compliance.generateQRCode(url);
                if (qr) {
                    setQrCode(qr);
                    setStatus('waiting');
                } else {
                    throw new Error('Failed to generate QR code');
                }
            } else {
                throw new Error('Failed to initiate verification');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
            setStatus('error');
        }
    }, [compliance]);

    const processResult = useCallback(async (zkPassportResult: any) => {
        if (!currentUserAddress) {
            setError('No user address set');
            setStatus('error');
            return;
        }

        setStatus('processing');
        setError(null);

        try {
            const verificationResult = await compliance.processVerification(zkPassportResult, currentUserAddress);
            if (verificationResult) {
                setResult(verificationResult);
                setStatus('completed');
            } else {
                throw new Error('Failed to process verification result');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Processing failed');
            setStatus('error');
        }
    }, [compliance, currentUserAddress]);

    const reset = useCallback(() => {
        setStatus('idle');
        setVerificationUrl(null);
        setQrCode(null);
        setResult(null);
        setError(null);
        setCurrentUserAddress(null);
    }, []);

    return {
        status,
        verificationUrl,
        qrCode,
        result,
        error,
        startVerification,
        processResult,
        reset
    };
}
