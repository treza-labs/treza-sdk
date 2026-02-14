// Main exports
export { TrezaClient } from './client';

// KYC Module exports
export { TrezaKYCClient } from './kyc';
export type {
  ZKProof,
  TrezaKYCConfig,
  ProofSubmissionResponse,
  ProofVerificationResponse,
  BlockchainProof,
  KYCData,
  ProofStatus,
  UserKYCStatus
} from './kyc';

// Signing Module exports
export { EnclaveSigner, LocalSigner, BrowserWalletSigner } from './signing';
export type {
  SignerProvider,
  EnclaveSignerConfig,
  EnclaveSignResponse,
  EnclaveSignMessageResponse
} from './signing';

// Type exports
export {
  TrezaConfig,
  Enclave,
  Provider,
  Task,
  ApiKey,
  GitHubConnection,
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
  GitHubUser,
  Repository,
  Branch,
  GitHubAuthResponse,
  GitHubTokenRequest,
  GitHubTokenResponse,
  RepositoriesResponse,
  BranchesResponse,
  GetBranchesRequest,
  EnclaveLifecycleRequest,
  EnclaveLifecycleResponse,
  LogEntry,
  LogsResponse,
  DockerImage,
  DockerTag,
  DockerSearchResponse,
  DockerTagsResponse,
  AttestationDocument,
  AttestationVerification,
  AttestationResponse,
  VerificationRequest,
  VerificationResult,
  VerificationStatus,
  ApiError,
  TrezaSdkError
} from './types';

// Re-export the main client class as default
import { TrezaClient } from './client';
export default TrezaClient; 