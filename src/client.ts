import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  TrezaConfig,
  Enclave,
  CreateEnclaveRequest,
  UpdateEnclaveRequest,
  EnclaveResponse,
  EnclavesResponse,
  GitHubAuthResponse,
  GitHubTokenRequest,
  GitHubTokenResponse,
  RepositoriesResponse,
  GetBranchesRequest,
  BranchesResponse,
  ApiError,
  TrezaSdkError
} from './types';

/**
 * Main client class for interacting with the Treza Platform API
 */
export class TrezaClient {
  private client: AxiosInstance;

  /**
   * Create a new Treza client instance
   * @param config Configuration options for the client
   */
  constructor(config: TrezaConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://app.treza.xyz',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        throw this.handleApiError(error);
      }
    );
  }

  // ===== ENCLAVE MANAGEMENT =====

  /**
   * Get all enclaves for a wallet address
   * @param walletAddress Wallet address to filter enclaves
   * @returns Promise resolving to list of enclaves
   */
  async getEnclaves(walletAddress: string): Promise<Enclave[]> {
    try {
      const response: AxiosResponse<EnclavesResponse> = await this.client.get('/api/enclaves', {
        params: { wallet: walletAddress }
      });
      return response.data.enclaves;
    } catch (error) {
      throw this.handleError(error, 'Failed to get enclaves');
    }
  }

  /**
   * Create a new enclave
   * @param request Enclave creation parameters
   * @returns Promise resolving to created enclave
   */
  async createEnclave(request: CreateEnclaveRequest): Promise<Enclave> {
    try {
      const response: AxiosResponse<EnclaveResponse> = await this.client.post('/api/enclaves', request);
      return response.data.enclave;
    } catch (error) {
      throw this.handleError(error, 'Failed to create enclave');
    }
  }

  /**
   * Update an existing enclave
   * @param request Enclave update parameters
   * @returns Promise resolving to updated enclave
   */
  async updateEnclave(request: UpdateEnclaveRequest): Promise<Enclave> {
    try {
      const response: AxiosResponse<EnclaveResponse> = await this.client.put('/api/enclaves', request);
      return response.data.enclave;
    } catch (error) {
      throw this.handleError(error, 'Failed to update enclave');
    }
  }

  /**
   * Delete an enclave
   * @param enclaveId Enclave ID to delete
   * @param walletAddress Wallet address for authorization
   * @returns Promise resolving to success message
   */
  async deleteEnclave(enclaveId: string, walletAddress: string): Promise<string> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.client.delete('/api/enclaves', {
        params: { id: enclaveId, wallet: walletAddress }
      });
      return response.data.message;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete enclave');
    }
  }

  // ===== GITHUB INTEGRATION =====

  /**
   * Get GitHub OAuth authorization URL
   * @param state Optional state parameter for OAuth flow
   * @returns Promise resolving to OAuth URL and state
   */
  async getGitHubAuthUrl(state?: string): Promise<GitHubAuthResponse> {
    try {
      const params = state ? { state } : {};
      const response: AxiosResponse<GitHubAuthResponse> = await this.client.get('/api/github/auth', {
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get GitHub auth URL');
    }
  }

  /**
   * Exchange GitHub OAuth code for access token
   * @param request OAuth code exchange parameters
   * @returns Promise resolving to access token and user info
   */
  async exchangeGitHubCode(request: GitHubTokenRequest): Promise<GitHubTokenResponse> {
    try {
      const response: AxiosResponse<GitHubTokenResponse> = await this.client.post('/api/github/auth', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to exchange GitHub OAuth code');
    }
  }

  /**
   * Get GitHub repositories for authenticated user
   * @param accessToken GitHub access token
   * @returns Promise resolving to list of repositories
   */
  async getGitHubRepositories(accessToken: string): Promise<RepositoriesResponse> {
    try {
      const response: AxiosResponse<RepositoriesResponse> = await this.client.get('/api/github/repositories', {
        params: { token: accessToken }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get GitHub repositories');
    }
  }

  /**
   * Get branches for a specific GitHub repository
   * @param request Repository branches request parameters
   * @returns Promise resolving to list of branches
   */
  async getRepositoryBranches(request: GetBranchesRequest): Promise<BranchesResponse> {
    try {
      const response: AxiosResponse<BranchesResponse> = await this.client.post('/api/github/repositories', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get repository branches');
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Handle API errors and convert them to TrezaSdkError
   */
  private handleApiError(error: AxiosError): TrezaSdkError {
    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const errorData = error.response.data as ApiError;
      
      return new TrezaSdkError(
        errorData?.error || error.message,
        `HTTP_${statusCode}`,
        { response: errorData },
        statusCode
      );
    } else if (error.request) {
      // Network error
      return new TrezaSdkError(
        'Network error: Unable to reach Treza API',
        'NETWORK_ERROR'
      );
    } else {
      // Other error
      return new TrezaSdkError(error.message, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Generic error handler
   */
  private handleError(error: any, defaultMessage: string): TrezaSdkError {
    if (error instanceof TrezaSdkError) {
      return error;
    }
    return new TrezaSdkError(defaultMessage, 'UNKNOWN_ERROR', { originalError: error.message });
  }
} 