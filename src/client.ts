import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  TrezaConfig,
  Enclave,
  Provider,
  Task,
  ApiKey,
  CreateEnclaveRequest,
  UpdateEnclaveRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  EnclaveResponse,
  EnclavesResponse,
  ProviderResponse,
  ProvidersResponse,
  TaskResponse,
  TasksResponse,
  ApiKeyResponse,
  ApiKeysResponse,
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
      baseURL: config.baseUrl || 'https://app.trezalabs.com',
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

  // ===== PROVIDER MANAGEMENT =====

  /**
   * Get all available providers
   * @returns Promise resolving to list of providers
   */
  async getProviders(): Promise<Provider[]> {
    try {
      const response: AxiosResponse<ProvidersResponse> = await this.client.get('/api/providers');
      return response.data.providers;
    } catch (error) {
      throw this.handleError(error, 'Failed to get providers');
    }
  }

  /**
   * Get a specific provider by ID
   * @param providerId Provider ID to retrieve
   * @returns Promise resolving to provider details
   */
  async getProvider(providerId: string): Promise<Provider> {
    try {
      const response: AxiosResponse<ProviderResponse> = await this.client.get('/api/providers', {
        params: { id: providerId }
      });
      return response.data.provider;
    } catch (error) {
      throw this.handleError(error, 'Failed to get provider');
    }
  }

  // ===== TASK MANAGEMENT =====

  /**
   * Get all tasks for a wallet address
   * @param walletAddress Wallet address to filter tasks
   * @returns Promise resolving to list of tasks
   */
  async getTasks(walletAddress: string): Promise<Task[]> {
    try {
      const response: AxiosResponse<TasksResponse> = await this.client.get('/api/tasks', {
        params: { wallet: walletAddress }
      });
      return response.data.tasks;
    } catch (error) {
      throw this.handleError(error, 'Failed to get tasks');
    }
  }

  /**
   * Create a new task
   * @param request Task creation parameters
   * @returns Promise resolving to created task
   */
  async createTask(request: CreateTaskRequest): Promise<Task> {
    try {
      const response: AxiosResponse<TaskResponse> = await this.client.post('/api/tasks', request);
      return response.data.task;
    } catch (error) {
      throw this.handleError(error, 'Failed to create task');
    }
  }

  /**
   * Update an existing task
   * @param request Task update parameters
   * @returns Promise resolving to updated task
   */
  async updateTask(request: UpdateTaskRequest): Promise<Task> {
    try {
      const response: AxiosResponse<TaskResponse> = await this.client.put('/api/tasks', request);
      return response.data.task;
    } catch (error) {
      throw this.handleError(error, 'Failed to update task');
    }
  }

  /**
   * Delete a task
   * @param taskId Task ID to delete
   * @param walletAddress Wallet address for authorization
   * @returns Promise resolving to success message
   */
  async deleteTask(taskId: string, walletAddress: string): Promise<string> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.client.delete('/api/tasks', {
        params: { id: taskId, wallet: walletAddress }
      });
      return response.data.message;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete task');
    }
  }

  // ===== API KEY MANAGEMENT =====

  /**
   * Get all API keys for a wallet address
   * @param walletAddress Wallet address to filter API keys
   * @returns Promise resolving to list of API keys
   */
  async getApiKeys(walletAddress: string): Promise<ApiKey[]> {
    try {
      const response: AxiosResponse<ApiKeysResponse> = await this.client.get('/api/api-keys', {
        params: { wallet: walletAddress }
      });
      return response.data.apiKeys;
    } catch (error) {
      throw this.handleError(error, 'Failed to get API keys');
    }
  }

  /**
   * Create a new API key
   * @param request API key creation parameters
   * @returns Promise resolving to created API key
   */
  async createApiKey(request: CreateApiKeyRequest): Promise<ApiKey> {
    try {
      const response: AxiosResponse<ApiKeyResponse> = await this.client.post('/api/api-keys', request);
      return response.data.apiKey;
    } catch (error) {
      throw this.handleError(error, 'Failed to create API key');
    }
  }

  /**
   * Update an existing API key
   * @param request API key update parameters
   * @returns Promise resolving to updated API key
   */
  async updateApiKey(request: UpdateApiKeyRequest): Promise<ApiKey> {
    try {
      const response: AxiosResponse<ApiKeyResponse> = await this.client.put('/api/api-keys', request);
      return response.data.apiKey;
    } catch (error) {
      throw this.handleError(error, 'Failed to update API key');
    }
  }

  /**
   * Delete an API key
   * @param apiKeyId API key ID to delete
   * @param walletAddress Wallet address for authorization
   * @returns Promise resolving to success message
   */
  async deleteApiKey(apiKeyId: string, walletAddress: string): Promise<string> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.client.delete('/api/api-keys', {
        params: { id: apiKeyId, wallet: walletAddress }
      });
      return response.data.message;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete API key');
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
   * Handle general errors and convert them to TrezaSdkError
   */
  private handleError(error: any, defaultMessage: string): TrezaSdkError {
    if (error instanceof TrezaSdkError) {
      return error;
    }
    
    return new TrezaSdkError(
      error.message || defaultMessage,
      'UNKNOWN_ERROR'
    );
  }
} 