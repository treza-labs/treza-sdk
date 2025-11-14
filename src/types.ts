/**
 * Configuration options for the Treza SDK client
 */
export interface TrezaConfig {
  /** Base URL for the Treza API (defaults to https://app.trezalabs.com) */
  baseUrl?: string;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;
}

/**
 * Enclave object as defined in the API
 */
export interface Enclave {
  /** Unique enclave identifier */
  id: string;
  /** Human-readable enclave name */
  name: string;
  /** Enclave description */
  description: string;
  /** Current enclave status */
  status: 'PENDING_DEPLOY' | 'DEPLOYING' | 'DEPLOYED' | 'PAUSING' | 'PAUSED' | 'RESUMING' | 'PENDING_DESTROY' | 'DESTROYING' | 'DESTROYED' | 'FAILED';
  /** AWS region where enclave is deployed */
  region: string;
  /** Associated wallet address */
  walletAddress: string;
  /** Provider ID used for this enclave */
  providerId: string;
  /** Provider-specific configuration settings */
  providerConfig?: Record<string, any>;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** GitHub connection details */
  githubConnection?: GitHubConnection;
  /** Error message if enclave failed */
  error_message?: string;
}

/**
 * Provider information for enclave deployment
 */
export interface Provider {
  /** Unique provider identifier */
  id: string;
  /** Human-readable provider name */
  name: string;
  /** Provider description */
  description: string;
  /** Available regions for this provider */
  regions: string[];
  /** Configuration schema for this provider */
  configSchema: Record<string, any>;
}

/**
 * GitHub connection configuration
 */
export interface GitHubConnection {
  /** Whether GitHub is connected */
  isConnected: boolean;
  /** GitHub username */
  username?: string;
  /** Selected repository in format "owner/repo" */
  selectedRepo?: string;
  /** Selected branch name */
  selectedBranch?: string;
  /** GitHub access token */
  accessToken?: string;
}

/**
 * Request body for creating a new enclave
 */
export interface CreateEnclaveRequest {
  /** Enclave name */
  name: string;
  /** Enclave description */
  description: string;
  /** AWS region */
  region: string;
  /** Wallet address */
  walletAddress: string;
  /** Provider ID for enclave deployment */
  providerId: string;
  /** Optional provider-specific configuration */
  providerConfig?: Record<string, any>;
  /** Optional GitHub connection */
  githubConnection?: GitHubConnection;
}

/**
 * Request body for updating an enclave
 */
export interface UpdateEnclaveRequest {
  /** Enclave ID */
  id: string;
  /** Wallet address for authorization */
  walletAddress: string;
  /** Optional updated name */
  name?: string;
  /** Optional updated description */
  description?: string;
  /** Optional updated region */
  region?: string;
  /** Optional updated provider ID */
  providerId?: string;
  /** Optional updated provider configuration */
  providerConfig?: Record<string, any>;
  /** Optional updated GitHub connection */
  githubConnection?: GitHubConnection;
}

/**
 * Response for enclave operations
 */
export interface EnclaveResponse {
  enclave: Enclave;
}

/**
 * Response for listing enclaves
 */
export interface EnclavesResponse {
  enclaves: Enclave[];
}

/**
 * Response for provider operations
 */
export interface ProviderResponse {
  provider: Provider;
}

/**
 * Response for listing providers
 */
export interface ProvidersResponse {
  providers: Provider[];
}

/**
 * Task object for scheduled operations
 */
export interface Task {
  /** Unique task identifier */
  id: string;
  /** Task name */
  name: string;
  /** Task description */
  description: string;
  /** Associated enclave ID */
  enclaveId: string;
  /** Current task status */
  status: 'running' | 'stopped' | 'failed' | 'pending';
  /** Cron-style schedule expression */
  schedule: string;
  /** Associated wallet address */
  walletAddress: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Last execution timestamp */
  lastRun?: string;
}

/**
 * Request body for creating a new task
 */
export interface CreateTaskRequest {
  /** Task name */
  name: string;
  /** Task description */
  description: string;
  /** Associated enclave ID */
  enclaveId: string;
  /** Cron-style schedule expression */
  schedule: string;
  /** Wallet address for authorization */
  walletAddress: string;
}

/**
 * Request body for updating a task
 */
export interface UpdateTaskRequest {
  /** Task ID */
  id: string;
  /** Wallet address for authorization */
  walletAddress: string;
  /** Optional updated name */
  name?: string;
  /** Optional updated description */
  description?: string;
  /** Optional updated schedule */
  schedule?: string;
  /** Optional updated status */
  status?: 'running' | 'stopped' | 'failed' | 'pending';
}

/**
 * Response for task operations
 */
export interface TaskResponse {
  task: Task;
}

/**
 * Response for listing tasks
 */
export interface TasksResponse {
  tasks: Task[];
}

/**
 * API Key object for authentication
 */
export interface ApiKey {
  /** Unique API key identifier */
  id: string;
  /** Human-readable API key name */
  name: string;
  /** The actual API key (only returned on creation) */
  key?: string;
  /** SHA256 hash of the API key */
  keyHash: string;
  /** Array of permissions granted to this API key */
  permissions: ('enclaves:read' | 'enclaves:write' | 'tasks:read' | 'tasks:write' | 'logs:read')[];
  /** Current API key status */
  status: 'active' | 'inactive';
  /** Associated wallet address */
  walletAddress: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Last usage timestamp */
  lastUsed?: string;
}

/**
 * Request body for creating a new API key
 */
export interface CreateApiKeyRequest {
  /** API key name */
  name: string;
  /** Array of permissions to grant */
  permissions: ('enclaves:read' | 'enclaves:write' | 'tasks:read' | 'tasks:write' | 'logs:read')[];
  /** Wallet address for authorization */
  walletAddress: string;
}

/**
 * Request body for updating an API key
 */
export interface UpdateApiKeyRequest {
  /** API key ID */
  id: string;
  /** Wallet address for authorization */
  walletAddress: string;
  /** Optional updated name */
  name?: string;
  /** Optional updated permissions */
  permissions?: ('enclaves:read' | 'enclaves:write' | 'tasks:read' | 'tasks:write' | 'logs:read')[];
  /** Optional updated status */
  status?: 'active' | 'inactive';
}

/**
 * Response for API key operations
 */
export interface ApiKeyResponse {
  apiKey: ApiKey;
}

/**
 * Response for listing API keys
 */
export interface ApiKeysResponse {
  apiKeys: ApiKey[];
}

/**
 * GitHub user information
 */
export interface GitHubUser {
  /** GitHub user ID */
  id: number;
  /** GitHub username */
  login: string;
  /** Display name */
  name: string;
  /** Avatar URL */
  avatar_url: string;
}

/**
 * GitHub repository information
 */
export interface Repository {
  /** Repository ID */
  id: number;
  /** Repository name */
  name: string;
  /** Full name in format "owner/repo" */
  fullName: string;
  /** Repository description */
  description?: string;
  /** Whether repository is private */
  private: boolean;
  /** Default branch name */
  defaultBranch: string;
  /** Primary language */
  language?: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Repository HTML URL */
  htmlUrl: string;
}

/**
 * GitHub branch information
 */
export interface Branch {
  /** Branch name */
  name: string;
  /** Commit information */
  commit: {
    /** Commit SHA */
    sha: string;
    /** Commit API URL */
    url: string;
  };
}

/**
 * GitHub OAuth authorization response
 */
export interface GitHubAuthResponse {
  /** OAuth authorization URL */
  authUrl: string;
  /** State parameter */
  state: string;
}

/**
 * GitHub OAuth token exchange response
 */
export interface GitHubTokenResponse {
  /** Access token */
  access_token: string;
  /** User information */
  user: GitHubUser;
}

/**
 * GitHub repositories response
 */
export interface RepositoriesResponse {
  repositories: Repository[];
}

/**
 * GitHub branches response
 */
export interface BranchesResponse {
  branches: Branch[];
}

/**
 * Request for getting repository branches
 */
export interface GetBranchesRequest {
  /** GitHub access token */
  accessToken: string;
  /** Repository in format "owner/repo" */
  repository: string;
}

/**
 * GitHub OAuth token exchange request
 */
export interface GitHubTokenRequest {
  /** OAuth authorization code */
  code: string;
  /** Optional state parameter */
  state?: string;
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  details?: string[];
}

/**
 * Enclave lifecycle action request
 */
export interface EnclaveLifecycleRequest {
  /** Enclave ID */
  id: string;
  /** Action to perform */
  action: 'pause' | 'resume' | 'terminate';
  /** Wallet address for authorization */
  walletAddress: string;
}

/**
 * Enclave lifecycle action response
 */
export interface EnclaveLifecycleResponse {
  /** Updated enclave */
  enclave: Enclave;
  /** Success message */
  message: string;
}

/**
 * Log entry from various sources
 */
export interface LogEntry {
  /** Log timestamp */
  timestamp: number;
  /** Log message content */
  message: string;
  /** Log source (ecs, stepfunctions, lambda, application, etc.) */
  source: string;
  /** Log stream name */
  stream?: string;
  /** Log type (application, stdout, stderr, etc.) */
  type?: string;
  /** Log group name */
  logGroup?: string;
  /** Function name for lambda logs */
  function?: string;
  /** Execution name for step function logs */
  execution?: string;
  /** State machine type */
  stateMachine?: string;
}

/**
 * Logs response from the API
 */
export interface LogsResponse {
  /** Enclave ID */
  enclave_id: string;
  /** Enclave name */
  enclave_name: string;
  /** Current enclave status */
  enclave_status: string;
  /** Log entries organized by type */
  logs: {
    /** ECS deployment logs */
    ecs?: LogEntry[];
    /** Step Functions workflow logs */
    stepfunctions?: LogEntry[];
    /** Lambda function logs */
    lambda?: LogEntry[];
    /** Application logs from the enclave */
    application?: LogEntry[];
    /** Error logs from all sources */
    errors?: LogEntry[];
  };
}

/**
 * Docker image search result
 */
export interface DockerImage {
  /** Image name */
  name: string;
  /** Image description */
  description: string;
  /** Star count */
  stars: number;
  /** Whether it's an official image */
  official: boolean;
  /** Whether it's automated */
  automated: boolean;
  /** Image owner */
  owner?: string;
}

/**
 * Docker tag information
 */
export interface DockerTag {
  /** Tag name */
  name: string;
  /** Image size in bytes */
  size: number;
  /** Last updated timestamp */
  lastUpdated: string;
  /** Image digest */
  digest: string;
}

/**
 * Docker search response
 */
export interface DockerSearchResponse {
  /** Total count of results */
  count: number;
  /** Search results */
  results: DockerImage[];
}

/**
 * Docker tags response
 */
export interface DockerTagsResponse {
  /** Available tags */
  tags: DockerTag[];
}

/**
 * Attestation document containing cryptographic proof
 */
export interface AttestationDocument {
  /** Unique identifier for the enclave module */
  moduleId: string;
  /** SHA-384 digest of the enclave image */
  digest: string;
  /** Unix timestamp when attestation was generated */
  timestamp: number;
  /** Platform Configuration Registers */
  pcrs: {
    /** PCR0: Hash of the enclave image file */
    0: string;
    /** PCR1: Linux kernel and bootstrap hash */
    1: string;
    /** PCR2: Application hash */
    2: string;
    /** PCR8: Signing certificate hash */
    8: string;
  };
  /** X.509 certificate for verification */
  certificate: string;
  /** Certificate authority bundle */
  cabundle: string[];
  /** Public key for verification */
  publicKey?: string;
  /** User-provided data included in attestation */
  userData?: string;
  /** Nonce for replay attack protection */
  nonce?: string;
}

/**
 * Attestation verification details
 */
export interface AttestationVerification {
  /** Whether the attestation is valid */
  isValid: boolean;
  /** Trust level based on verification results */
  trustLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Current verification status */
  verificationStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  /** Integrity score as a percentage */
  integrityScore: number;
  /** Timestamp of last verification */
  lastVerified: string;
  /** List of verification errors (if any) */
  errors?: string[];
}

/**
 * Complete attestation response
 */
export interface AttestationResponse {
  /** Enclave identifier */
  enclaveId: string;
  /** Attestation document */
  attestationDocument: AttestationDocument;
  /** Verification details */
  verification: AttestationVerification;
  /** API endpoints for integration */
  endpoints: {
    /** URL for third-party verification */
    verificationUrl: string;
    /** API endpoint for attestation data */
    apiEndpoint: string;
    /** Webhook URL for real-time verification updates */
    webhookUrl: string;
  };
}

/**
 * Verification request payload
 */
export interface VerificationRequest {
  /** Base64 encoded attestation document (optional) */
  attestationDocument?: string;
  /** Nonce for replay attack protection */
  nonce?: string;
  /** Challenge string for additional verification */
  challenge?: string;
}

/**
 * Detailed verification result
 */
export interface VerificationResult {
  /** Whether the attestation verification passed */
  isValid: boolean;
  /** Overall trust level */
  trustLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Detailed verification checks */
  verificationDetails: {
    /** Whether PCR measurements are valid */
    pcrVerification: boolean;
    /** Whether certificate chain verification passed */
    certificateChain: boolean;
    /** Whether timestamp is within acceptable range */
    timestampValid: boolean;
    /** Whether provided nonce matches */
    nonceMatches: boolean;
    /** Whether cryptographic signature is valid */
    signatureValid: boolean;
  };
  /** Compliance status checks */
  complianceChecks: {
    /** SOC 2 compliance status */
    soc2: boolean;
    /** HIPAA compliance status */
    hipaa: boolean;
    /** FIPS 140-2 compliance status */
    fips: boolean;
    /** Common Criteria compliance status */
    commonCriteria: boolean;
  };
  /** Risk score (lower is better) */
  riskScore: number;
  /** Security recommendations and observations */
  recommendations: string[];
  /** Timestamp when verification was performed */
  verifiedAt: string;
}

/**
 * Quick verification status response
 */
export interface VerificationStatus {
  /** Enclave identifier */
  enclaveId: string;
  /** Whether enclave is verified */
  isVerified: boolean;
  /** Current enclave status */
  status: string;
  /** Timestamp of last verification */
  lastVerified: string | null;
  /** Trust level */
  trustLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
}

/**
 * Custom error class for Treza SDK
 */
export class TrezaSdkError extends Error {
  public readonly code?: string;
  public readonly details?: Record<string, any>;
  public readonly statusCode?: number;

  constructor(message: string, code?: string, details?: Record<string, any>, statusCode?: number) {
    super(message);
    this.name = 'TrezaSdkError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
} 