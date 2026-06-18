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
  EnclaveLifecycleRequest,
  EnclaveLifecycleResponse,
  LogsResponse,
  DockerSearchResponse,
  DockerTagsResponse,
  AttestationResponse,
  VerificationRequest,
  VerificationResult,
  VerificationStatus,
  RedactTextResponse,
  RedactionLogResponse,
  RedactionLogOptions,
  RedactionAttestation,
  RedactChatCompletionsRequest,
  RedactChatCompletionsOptions,
  RedactChatCompletionsResponse,
  ApiError,
  TrezaSdkError
} from './types';

/**
 * Main client class for interacting with the Treza Platform API
 */
export class TrezaClient {
  private client: AxiosInstance;
  private apiKey?: string;

  /**
   * Create a new Treza client instance
   * @param config Configuration options for the client
   */
  constructor(config: TrezaConfig = {}) {
    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://app.trezalabs.com',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        // API-key-authenticated endpoints (e.g. PII redaction) expect a Bearer
        // token. Wallet-scoped endpoints simply ignore it.
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
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
      const response: AxiosResponse<{ message: string }> = await this.client.delete(`/api/enclaves/${enclaveId}`, {
        params: { wallet: walletAddress }
      });
      return response.data.message;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete enclave');
    }
  }

  /**
   * Get a specific enclave by ID
   * @param enclaveId Enclave ID to retrieve
   * @returns Promise resolving to enclave details
   */
  async getEnclave(enclaveId: string): Promise<Enclave> {
    try {
      const response: AxiosResponse<EnclaveResponse> = await this.client.get(`/api/enclaves/${enclaveId}`);
      return response.data.enclave;
    } catch (error) {
      throw this.handleError(error, 'Failed to get enclave');
    }
  }

  /**
   * Perform lifecycle action on an enclave (pause, resume, terminate)
   * @param request Lifecycle action parameters
   * @returns Promise resolving to updated enclave
   */
  async performEnclaveAction(request: EnclaveLifecycleRequest): Promise<EnclaveLifecycleResponse> {
    try {
      const response: AxiosResponse<EnclaveLifecycleResponse> = await this.client.patch(`/api/enclaves/${request.id}`, {
        action: request.action,
        walletAddress: request.walletAddress
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to ${request.action} enclave`);
    }
  }

  /**
   * Pause an enclave
   * @param enclaveId Enclave ID to pause
   * @param walletAddress Wallet address for authorization
   * @returns Promise resolving to updated enclave
   */
  async pauseEnclave(enclaveId: string, walletAddress: string): Promise<EnclaveLifecycleResponse> {
    return this.performEnclaveAction({ id: enclaveId, action: 'pause', walletAddress });
  }

  /**
   * Resume a paused enclave
   * @param enclaveId Enclave ID to resume
   * @param walletAddress Wallet address for authorization
   * @returns Promise resolving to updated enclave
   */
  async resumeEnclave(enclaveId: string, walletAddress: string): Promise<EnclaveLifecycleResponse> {
    return this.performEnclaveAction({ id: enclaveId, action: 'resume', walletAddress });
  }

  /**
   * Terminate an enclave
   * @param enclaveId Enclave ID to terminate
   * @param walletAddress Wallet address for authorization
   * @returns Promise resolving to updated enclave
   */
  async terminateEnclave(enclaveId: string, walletAddress: string): Promise<EnclaveLifecycleResponse> {
    return this.performEnclaveAction({ id: enclaveId, action: 'terminate', walletAddress });
  }

  /**
   * Get logs for an enclave
   * @param enclaveId Enclave ID to get logs for
   * @param logType Type of logs to retrieve ('all', 'ecs', 'stepfunctions', 'lambda', 'application', 'errors')
   * @param limit Maximum number of log entries to return
   * @returns Promise resolving to logs response
   */
  async getEnclaveLogs(enclaveId: string, logType: string = 'all', limit: number = 100): Promise<LogsResponse> {
    try {
      const response: AxiosResponse<LogsResponse> = await this.client.get(`/api/enclaves/${enclaveId}/logs`, {
        params: { type: logType, limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get enclave logs');
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

  // ===== DOCKER INTEGRATION =====

  /**
   * Search Docker Hub for images
   * @param query Search query for Docker images
   * @returns Promise resolving to search results
   */
  async searchDockerImages(query: string): Promise<DockerSearchResponse> {
    try {
      const response: AxiosResponse<DockerSearchResponse> = await this.client.get('/api/docker/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to search Docker images');
    }
  }

  /**
   * Get tags for a specific Docker repository
   * @param repository Repository name (e.g., 'library/hello-world')
   * @returns Promise resolving to available tags
   */
  async getDockerTags(repository: string): Promise<DockerTagsResponse> {
    try {
      const response: AxiosResponse<DockerTagsResponse> = await this.client.get('/api/docker/search', {
        params: { repo: repository }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get Docker tags');
    }
  }

  // ===== ATTESTATION METHODS =====

  /**
   * Get attestation document and verification details for a deployed enclave
   * @param enclaveId Enclave identifier
   * @returns Promise resolving to attestation data with verification details
   */
  async getAttestation(enclaveId: string): Promise<AttestationResponse> {
    try {
      const response: AxiosResponse<AttestationResponse> = await this.client.get(`/api/enclaves/${enclaveId}/attestation`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get attestation document');
    }
  }

  /**
   * Get quick verification status for an enclave
   * @param enclaveId Enclave identifier
   * @returns Promise resolving to verification status
   */
  async getVerificationStatus(enclaveId: string): Promise<VerificationStatus> {
    try {
      const response: AxiosResponse<VerificationStatus> = await this.client.get(`/api/enclaves/${enclaveId}/attestation/verify`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get verification status');
    }
  }

  /**
   * Perform comprehensive verification of an attestation document
   * @param enclaveId Enclave identifier
   * @param request Optional verification parameters
   * @returns Promise resolving to detailed verification result
   */
  async verifyAttestation(enclaveId: string, request?: VerificationRequest): Promise<VerificationResult> {
    try {
      const response: AxiosResponse<VerificationResult> = await this.client.post(
        `/api/enclaves/${enclaveId}/attestation/verify`,
        request || {}
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to verify attestation');
    }
  }

  /**
   * Generate code snippets for integrating with enclave attestation
   * @param enclaveId Enclave identifier
   * @param language Programming language for the snippet
   * @returns Promise resolving to code snippet
   */
  async generateIntegrationSnippet(enclaveId: string, language: 'javascript' | 'python' | 'curl' | 'java' = 'javascript'): Promise<string> {
    try {
      const attestation = await this.getAttestation(enclaveId);
      
      switch (language) {
        case 'javascript':
          return `// Verify Treza Enclave Attestation
const response = await fetch('${attestation.endpoints.apiEndpoint}');
const attestation = await response.json();

// Verify the attestation
const verifyResponse = await fetch('${attestation.endpoints.verificationUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nonce: 'your-nonce-here' })
});
const verification = await verifyResponse.json();

if (verification.isValid && verification.trustLevel === 'HIGH') {
  console.log('Enclave verification successful!');
  console.log('Integrity Score:', verification.complianceChecks);
} else {
  console.error('Enclave verification failed:', verification.recommendations);
}`;

        case 'python':
          return `# Verify Treza Enclave Attestation
import requests
import json

# Get attestation document
response = requests.get('${attestation.endpoints.apiEndpoint}')
attestation = response.json()

# Verify the attestation
verify_response = requests.post('${attestation.endpoints.verificationUrl}', 
    headers={'Content-Type': 'application/json'},
    json={'nonce': 'your-nonce-here'}
)
verification = verify_response.json()

if verification['isValid'] and verification['trustLevel'] == 'HIGH':
    print('Enclave verification successful!')
    print('Integrity Score:', verification['complianceChecks'])
else:
    print('Enclave verification failed:', verification['recommendations'])`;

        case 'curl':
          return `# Verify Treza Enclave Attestation
# Get attestation document
curl -X GET "${attestation.endpoints.apiEndpoint}"

# Verify the attestation
curl -X POST "${attestation.endpoints.verificationUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"nonce": "your-nonce-here"}'`;

        case 'java':
          return `// Verify Treza Enclave Attestation
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();

// Get attestation document
HttpRequest attestationRequest = HttpRequest.newBuilder()
    .uri(URI.create("${attestation.endpoints.apiEndpoint}"))
    .GET()
    .build();
    
HttpResponse<String> attestationResponse = client.send(attestationRequest, 
    HttpResponse.BodyHandlers.ofString());

// Verify the attestation
HttpRequest verifyRequest = HttpRequest.newBuilder()
    .uri(URI.create("${attestation.endpoints.verificationUrl}"))
    .POST(HttpRequest.BodyPublishers.ofString("{\\"nonce\\": \\"your-nonce-here\\"}"))
    .header("Content-Type", "application/json")
    .build();
    
HttpResponse<String> verifyResponse = client.send(verifyRequest, 
    HttpResponse.BodyHandlers.ofString());

System.out.println("Verification result: " + verifyResponse.body());`;

        default:
          throw new TrezaSdkError('Unsupported language', 'INVALID_LANGUAGE');
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to generate integration snippet');
    }
  }



  // ===== PII REDACTION =====
  //
  // These endpoints authenticate with a Treza API key (Bearer token). Construct
  // the client with `new TrezaClient({ apiKey: 'treza_live_...' })` and grant the
  // key the matching `redact:*` permission. They are the programmatic
  // alternative to routing traffic through a hosted redaction proxy.

  /**
   * Redact PII from a text string (`POST /api/redact/run`).
   *
   * Runs the redaction pipeline and returns the redacted text plus the detected
   * entities. The original text is never stored or forwarded. This is the direct
   * alternative to the redaction proxy: redact locally, then do whatever you want
   * with the result.
   *
   * Requires an API key with the `redact:run` permission.
   *
   * @param text Text to redact
   * @returns Promise resolving to the redacted text and detected entities
   */
  async redactText(text: string): Promise<RedactTextResponse> {
    this.requireApiKey('redactText');
    try {
      const response: AxiosResponse<RedactTextResponse> = await this.client.post(
        '/api/redact/run',
        { text }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to redact text');
    }
  }

  /**
   * OpenAI-compatible chat completions with PII redaction
   * (`POST /api/redact/chat/completions`).
   *
   * A drop-in replacement for an OpenAI-style `/v1/chat/completions` call: string
   * and text-part message content is passed through the redaction pipeline before
   * being forwarded to the upstream provider. The upstream response is returned
   * verbatim in `data`, alongside the Treza request id and mode. Streaming is not
   * supported by this helper — omit `stream` (or set it to `false`).
   *
   * Requires an API key with the `redact:proxy` permission. Provide either a
   * configured `proxyId` (which can carry a stored upstream key) or a `modelKey`.
   *
   * @param request OpenAI-compatible chat completion request
   * @param options Upstream key / proxy selection / rehydration options
   * @returns Promise resolving to the upstream response plus redaction metadata
   */
  async redactChatCompletions<T = any>(
    request: RedactChatCompletionsRequest,
    options: RedactChatCompletionsOptions = {}
  ): Promise<RedactChatCompletionsResponse<T>> {
    this.requireApiKey('redactChatCompletions');
    const headers: Record<string, string> = {};
    if (options.modelKey) headers['x-model-key'] = options.modelKey;
    if (options.proxyId) headers['x-treza-proxy'] = options.proxyId;
    if (options.rehydrate) headers['x-treza-rehydrate'] = '1';

    try {
      const response: AxiosResponse<T> = await this.client.post(
        '/api/redact/chat/completions',
        { ...request, stream: false },
        { headers }
      );
      const rehydrationHeader = response.headers['x-treza-rehydration'];
      let rehydration: Record<string, string> | undefined;
      if (typeof rehydrationHeader === 'string' && rehydrationHeader) {
        try {
          rehydration = JSON.parse(rehydrationHeader);
        } catch {
          rehydration = undefined;
        }
      }
      return {
        data: response.data,
        requestId: (response.headers['x-treza-request-id'] as string) || '',
        mode: ((response.headers['x-treza-mode'] as string) || 'standard') as 'tee' | 'standard',
        ...(rehydration ? { rehydration } : {}),
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to run redaction proxy request');
    }
  }

  /**
   * Get the redaction audit log for the calling API key
   * (`GET /api/redact/log`).
   *
   * Entries contain entity counts by type — never the original or redacted text.
   * Requires an API key with the `redact:log` permission.
   *
   * @param options Optional `limit` and `since` filters
   * @returns Promise resolving to the audit log entries (newest first)
   */
  async getRedactionLog(options: RedactionLogOptions = {}): Promise<RedactionLogResponse> {
    this.requireApiKey('getRedactionLog');
    try {
      const params: Record<string, string | number> = {};
      if (options.limit !== undefined) params.limit = options.limit;
      if (options.since !== undefined) params.since = options.since;
      const response: AxiosResponse<RedactionLogResponse> = await this.client.get(
        '/api/redact/log',
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get redaction audit log');
    }
  }

  /**
   * Get the attestation summary for the redaction enclave
   * (`GET /api/redact/attest`).
   *
   * Requires an Enterprise plan (TEE redaction) and an API key with the
   * `redact:run` permission.
   *
   * @returns Promise resolving to the redaction enclave attestation summary
   */
  async getRedactionAttestation(): Promise<RedactionAttestation> {
    this.requireApiKey('getRedactionAttestation');
    try {
      const response: AxiosResponse<RedactionAttestation> = await this.client.get(
        '/api/redact/attest'
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get redaction attestation');
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Ensure an API key was provided for endpoints that require Bearer auth.
   */
  private requireApiKey(method: string): void {
    if (!this.apiKey) {
      throw new TrezaSdkError(
        `${method} requires a Treza API key. Construct the client with ` +
          `new TrezaClient({ apiKey: 'treza_live_...' }).`,
        'MISSING_API_KEY'
      );
    }
  }

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