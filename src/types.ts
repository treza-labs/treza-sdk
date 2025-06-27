/**
 * Configuration options for the Treza SDK client
 */
export interface TrezaConfig {
  /** Base URL for the Treza API (defaults to https://app.treza.xyz) */
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
  status: 'active' | 'inactive' | 'pending';
  /** AWS region where enclave is deployed */
  region: string;
  /** Associated wallet address */
  walletAddress: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** GitHub connection details */
  githubConnection?: GitHubConnection;
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
 * API error response
 */
export interface ApiError {
  error: string;
}

/**
 * Custom error class for Treza SDK errors
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