// Main exports
export { TrezaClient } from './client';

// Type exports
export {
  TrezaConfig,
  Enclave,
  GitHubConnection,
  CreateEnclaveRequest,
  UpdateEnclaveRequest,
  EnclaveResponse,
  EnclavesResponse,
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