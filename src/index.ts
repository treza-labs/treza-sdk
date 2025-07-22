// Main exports
export { TrezaClient } from './client';

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
  ApiError,
  TrezaSdkError
} from './types';

// Re-export the main client class as default
import { TrezaClient } from './client';
export default TrezaClient; 