/**
 * Treza KYC Client
 * 
 * SDK for interacting with Treza KYC proof system
 * Supports API and blockchain integration
 */

import axios, { AxiosInstance } from 'axios';
import { ethers } from 'ethers';

export interface ZKProof {
  commitment: string;
  proof: string;
  publicInputs: string[];
  timestamp: string;
  algorithm: string;
}

export interface TrezaKYCConfig {
  apiUrl: string;
  apiKey?: string;
  blockchain?: {
    rpcUrl: string;
    contractAddress: string;
    privateKey?: string;
  };
}

export interface ProofSubmissionResponse {
  proofId: string;
  verificationUrl: string;
  expiresAt: string;
  chainTxHash?: string;
}

export interface ProofVerificationResponse {
  proofId: string;
  isValid: boolean;
  publicInputs: string[];
  verifiedAt?: string;
  chainVerified: boolean;
  expiresAt?: string;
}

export interface BlockchainProof {
  commitment: string;
  publicInputs: string[];
  timestamp: number;
  submitter: string;
  isVerified: boolean;
  expiresAt: number;
}

export class TrezaKYCClient {
  private config: TrezaKYCConfig;
  private httpClient: AxiosInstance;
  private provider?: ethers.Provider;
  private contract?: ethers.Contract;
  
  // KYCVerifier ABI (minimal interface)
  private static readonly CONTRACT_ABI = [
    'function submitProof(bytes32 commitment, bytes proof, string[] publicInputs) external returns (bytes32)',
    'function verifyProof(bytes32 proofId) external returns (bool)',
    'function getProof(bytes32 proofId) external view returns (bytes32 commitment, string[] publicInputs, uint256 timestamp, address submitter, bool isVerified, uint256 expiresAt)',
    'function hasValidKYC(address user) external view returns (bool)',
    'function getPublicClaims(bytes32 proofId) external view returns (string[])',
    'function getUserProofId(address user) external view returns (bytes32)',
    'function doesCommitmentExist(bytes32 commitment) external view returns (bool)',
    'event ProofSubmitted(bytes32 indexed proofId, address indexed submitter, bytes32 commitment, uint256 timestamp)',
    'event ProofVerified(bytes32 indexed proofId, bool isValid, address verifier)',
  ];
  
  constructor(config: TrezaKYCConfig) {
    this.config = config;
    
    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
    });
    
    // Initialize blockchain if configured
    if (config.blockchain) {
      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
      
      this.contract = new ethers.Contract(
        config.blockchain.contractAddress,
        TrezaKYCClient.CONTRACT_ABI,
        this.provider
      );
    }
  }
  
  // ==================== API Methods ====================
  
  /**
   * Submit a ZK proof to the API
   */
  async submitProof(params: {
    userId: string;
    proof: ZKProof;
  }): Promise<ProofSubmissionResponse> {
    try {
      const response = await this.httpClient.post('/kyc/proof', {
        userId: params.userId,
        proof: params.proof,
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to submit proof: ${error.response?.data?.error || error.message}`);
    }
  }
  
  /**
   * Verify a proof via API
   */
  async verifyProof(proofId: string): Promise<ProofVerificationResponse> {
    try {
      const response = await this.httpClient.get(`/kyc/proof/${proofId}/verify`);
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to verify proof: ${error.response?.data?.error || error.message}`);
    }
  }
  
  /**
   * Get proof details from API
   */
  async getProof(proofId: string, includePrivate: boolean = false): Promise<ZKProof> {
    try {
      const url = includePrivate 
        ? `/kyc/proof/${proofId}?includePrivate=true`
        : `/kyc/proof/${proofId}`;
        
      const response = await this.httpClient.get(url);
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get proof: ${error.response?.data?.error || error.message}`);
    }
  }
  
  // ==================== Blockchain Methods ====================
  
  /**
   * Submit proof to blockchain
   */
  async submitProofOnChain(params: {
    commitment: string;
    proof: string;
    publicInputs: string[];
    signer?: ethers.Signer;
  }): Promise<string> {
    if (!this.contract || !this.provider) {
      throw new Error('Blockchain not configured');
    }
    
    try {
      // Get signer
      let signer: ethers.Signer;
      if (params.signer) {
        signer = params.signer;
      } else if (this.config.blockchain?.privateKey) {
        signer = new ethers.Wallet(this.config.blockchain.privateKey, this.provider);
      } else {
        throw new Error('No signer available');
      }
      
      // Connect contract to signer
      const contractWithSigner = this.contract.connect(signer);
      
      // Convert commitment to bytes32
      const commitmentBytes32 = params.commitment.startsWith('0x')
        ? params.commitment
        : '0x' + params.commitment;
      
      // Convert proof to bytes
      const proofBytes = ethers.toUtf8Bytes(params.proof);
      
      // Submit proof
      const tx = await contractWithSigner.submitProof(
        commitmentBytes32,
        proofBytes,
        params.publicInputs
      );
      
      const receipt = await tx.wait();
      
      return tx.hash;
    } catch (error: any) {
      throw new Error(`Failed to submit proof on-chain: ${error.message}`);
    }
  }
  
  /**
   * Verify proof on blockchain
   */
  async verifyProofOnChain(params: {
    proofId: string;
    signer?: ethers.Signer;
  }): Promise<boolean> {
    if (!this.contract || !this.provider) {
      throw new Error('Blockchain not configured');
    }
    
    try {
      // Get signer
      let signer: ethers.Signer;
      if (params.signer) {
        signer = params.signer;
      } else if (this.config.blockchain?.privateKey) {
        signer = new ethers.Wallet(this.config.blockchain.privateKey, this.provider);
      } else {
        throw new Error('No signer available');
      }
      
      // Connect contract to signer
      const contractWithSigner = this.contract.connect(signer);
      
      // Verify proof
      const tx = await contractWithSigner.verifyProof(params.proofId);
      const receipt = await tx.wait();
      
      // Get verification result from event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return this.contract!.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'ProofVerified');
      
      return event?.args?.isValid || false;
    } catch (error: any) {
      throw new Error(`Failed to verify proof on-chain: ${error.message}`);
    }
  }
  
  /**
   * Check if user has valid KYC on blockchain
   */
  async hasValidKYC(userAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Blockchain not configured');
    }
    
    try {
      return await this.contract.hasValidKYC(userAddress);
    } catch (error: any) {
      throw new Error(`Failed to check KYC status: ${error.message}`);
    }
  }
  
  /**
   * Get proof from blockchain
   */
  async getProofFromChain(proofId: string): Promise<BlockchainProof> {
    if (!this.contract) {
      throw new Error('Blockchain not configured');
    }
    
    try {
      const result = await this.contract.getProof(proofId);
      
      return {
        commitment: result.commitment,
        publicInputs: result.publicInputs,
        timestamp: Number(result.timestamp),
        submitter: result.submitter,
        isVerified: result.isVerified,
        expiresAt: Number(result.expiresAt),
      };
    } catch (error: any) {
      throw new Error(`Failed to get proof from chain: ${error.message}`);
    }
  }
  
  /**
   * Get user's latest proof ID from blockchain
   */
  async getUserProofId(userAddress: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain not configured');
    }
    
    try {
      return await this.contract.getUserProofId(userAddress);
    } catch (error: any) {
      throw new Error(`Failed to get user proof ID: ${error.message}`);
    }
  }
  
  /**
   * Check if commitment exists on blockchain
   */
  async doesCommitmentExist(commitment: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Blockchain not configured');
    }
    
    try {
      const commitmentBytes32 = commitment.startsWith('0x')
        ? commitment
        : '0x' + commitment;
        
      return await this.contract.doesCommitmentExist(commitmentBytes32);
    } catch (error: any) {
      throw new Error(`Failed to check commitment: ${error.message}`);
    }
  }
  
  // ==================== Utility Methods ====================
  
  /**
   * Set API key for authenticated requests
   */
  setAPIKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
  }
  
  /**
   * Clear API key
   */
  clearAPIKey(): void {
    this.config.apiKey = undefined;
    delete this.httpClient.defaults.headers.common['Authorization'];
  }
  
  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health');
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }
  
  /**
   * Get blockchain provider
   */
  getProvider(): ethers.Provider | undefined {
    return this.provider;
  }
  
  /**
   * Get contract instance
   */
  getContract(): ethers.Contract | undefined {
    return this.contract;
  }
}

export default TrezaKYCClient;

