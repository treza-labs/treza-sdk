import { ethers } from 'ethers';

/**
 * Wallet Service for React applications
 * 
 * Provides React-friendly wallet connection and management utilities
 * with proper error handling and state management integration.
 */

export interface WalletConnectionResult {
    success: boolean;
    provider?: ethers.Provider;
    signer?: ethers.Signer;
    address?: string;
    chainId?: number;
    error?: string;
}

export interface WalletInfo {
    address: string;
    chainId: number;
    balance: string;
    isConnected: boolean;
}

export class WalletService {
    private provider: ethers.Provider | null = null;
    private signer: ethers.Signer | null = null;
    private currentAddress: string | null = null;

    /**
     * Connect to MetaMask or other Web3 wallet
     */
    async connectWallet(): Promise<WalletConnectionResult> {
        try {
            // Check if Web3 is available
            if (typeof window === 'undefined' || !window.ethereum) {
                return {
                    success: false,
                    error: 'Web3 wallet not found. Please install MetaMask or another Web3 wallet.'
                };
            }

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Create provider and signer
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            // Store references
            this.provider = provider;
            this.signer = signer;
            this.currentAddress = address;

            return {
                success: true,
                provider,
                signer,
                address,
                chainId: Number(network.chainId)
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Disconnect wallet
     */
    disconnect(): void {
        this.provider = null;
        this.signer = null;
        this.currentAddress = null;
    }

    /**
     * Get current wallet info
     */
    async getWalletInfo(): Promise<WalletInfo | null> {
        if (!this.provider || !this.currentAddress) {
            return null;
        }

        try {
            const balance = await this.provider.getBalance(this.currentAddress);
            const network = await this.provider.getNetwork();

            return {
                address: this.currentAddress,
                chainId: Number(network.chainId),
                balance: ethers.formatEther(balance),
                isConnected: true
            };
        } catch (error) {
            console.error('Failed to get wallet info:', error);
            return null;
        }
    }

    /**
     * Switch to a specific network
     */
    async switchNetwork(chainId: number): Promise<{ success: boolean; error?: string }> {
        try {
            if (!window.ethereum) {
                return { success: false, error: 'Web3 wallet not found' };
            }

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
            });

            return { success: true };
        } catch (error: any) {
            // If the chain hasn't been added to MetaMask
            if (error.code === 4902) {
                return { success: false, error: 'Network not added to wallet' };
            }

            const errorMessage = error instanceof Error ? error.message : 'Failed to switch network';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Add a custom network to the wallet
     */
    async addNetwork(networkConfig: {
        chainId: number;
        chainName: string;
        rpcUrls: string[];
        nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
        };
        blockExplorerUrls?: string[];
    }): Promise<{ success: boolean; error?: string }> {
        try {
            if (!window.ethereum) {
                return { success: false, error: 'Web3 wallet not found' };
            }

            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${networkConfig.chainId.toString(16)}`,
                    chainName: networkConfig.chainName,
                    rpcUrls: networkConfig.rpcUrls,
                    nativeCurrency: networkConfig.nativeCurrency,
                    blockExplorerUrls: networkConfig.blockExplorerUrls
                }],
            });

            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add network';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Sign a message
     */
    async signMessage(message: string): Promise<{ success: boolean; signature?: string; error?: string }> {
        try {
            if (!this.signer) {
                return { success: false, error: 'Wallet not connected' };
            }

            const signature = await this.signer.signMessage(message);
            return { success: true, signature };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to sign message';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Get current provider
     */
    getProvider(): ethers.Provider | null {
        return this.provider;
    }

    /**
     * Get current signer
     */
    getSigner(): ethers.Signer | null {
        return this.signer;
    }

    /**
     * Get current address
     */
    getCurrentAddress(): string | null {
        return this.currentAddress;
    }

    /**
     * Check if wallet is connected
     */
    isConnected(): boolean {
        return this.provider !== null && this.signer !== null && this.currentAddress !== null;
    }

    /**
     * Listen for account changes
     */
    onAccountsChanged(callback: (accounts: string[]) => void): void {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', callback);
        }
    }

    /**
     * Listen for chain changes
     */
    onChainChanged(callback: (chainId: string) => void): void {
        if (window.ethereum) {
            window.ethereum.on('chainChanged', callback);
        }
    }

    /**
     * Remove event listeners
     */
    removeAllListeners(): void {
        if (window.ethereum) {
            window.ethereum.removeAllListeners('accountsChanged');
            window.ethereum.removeAllListeners('chainChanged');
        }
    }
}

// Singleton instance for React apps
let walletServiceInstance: WalletService | null = null;

/**
 * Get or create the global wallet service instance
 */
export function getWalletService(): WalletService {
    if (!walletServiceInstance) {
        walletServiceInstance = new WalletService();
    }
    return walletServiceInstance;
}

/**
 * Reset the global wallet service instance
 */
export function resetWalletService(): void {
    if (walletServiceInstance) {
        walletServiceInstance.removeAllListeners();
        walletServiceInstance.disconnect();
        walletServiceInstance = null;
    }
}

// Type declarations for window.ethereum
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            on: (event: string, callback: (...args: any[]) => void) => void;
            removeAllListeners: (event: string) => void;
        };
    }
}
