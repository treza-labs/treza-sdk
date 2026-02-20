import { z } from 'zod';

/**
 * Zod schemas and metadata for all MCP tools exposed by the Treza server.
 * Each tool maps to a TrezaClient SDK method.
 */

// ─── Enclave Management ─────────────────────────────────────────────────────

export const listEnclavesSchema = z.object({
  walletAddress: z.string().describe('Ethereum wallet address that owns the enclaves'),
});

export const getEnclaveSchema = z.object({
  enclaveId: z.string().describe('Unique enclave identifier (e.g. "enc_abc123")'),
});

export const createEnclaveSchema = z.object({
  name: z.string().describe('Human-readable name for the enclave'),
  description: z.string().describe('Description of the enclave purpose'),
  region: z.string().describe('AWS region to deploy in (e.g. "us-east-1", "eu-west-1")'),
  walletAddress: z.string().describe('Ethereum wallet address of the owner'),
  providerId: z.string().default('aws-nitro-enclave').describe('Provider ID (default: "aws-nitro-enclave")'),
  dockerImage: z.string().optional().describe('Docker image to run inside the enclave'),
  cpuCount: z.enum(['2', '4', '8', '16']).optional().describe('Number of vCPUs'),
  memoryMiB: z.enum(['1024', '2048', '4096', '8192', '16384']).optional().describe('Memory in MiB'),
  workloadType: z.enum(['batch', 'service', 'daemon']).optional().describe('Workload type'),
  exposePorts: z.string().optional().describe('Comma-separated ports to expose'),
  enableDebug: z.boolean().optional().describe('Enable debug mode'),
});

export const updateEnclaveSchema = z.object({
  id: z.string().describe('Enclave ID to update'),
  walletAddress: z.string().describe('Wallet address for authorization'),
  name: z.string().optional().describe('New name'),
  description: z.string().optional().describe('New description'),
});

export const deleteEnclaveSchema = z.object({
  enclaveId: z.string().describe('Enclave ID to delete'),
  walletAddress: z.string().describe('Wallet address for authorization'),
});

export const enclaveActionSchema = z.object({
  enclaveId: z.string().describe('Enclave ID to act on'),
  action: z.enum(['pause', 'resume', 'terminate']).describe('Lifecycle action'),
  walletAddress: z.string().describe('Wallet address for authorization'),
});

export const getEnclaveLogsSchema = z.object({
  enclaveId: z.string().describe('Enclave ID'),
  logType: z.enum(['all', 'ecs', 'stepfunctions', 'lambda', 'application', 'errors']).default('all').describe('Type of logs'),
  limit: z.number().default(50).describe('Max log entries to return'),
});

// ─── Attestation & Verification ─────────────────────────────────────────────

export const getAttestationSchema = z.object({
  enclaveId: z.string().describe('Enclave ID to get attestation for'),
});

export const verifyAttestationSchema = z.object({
  enclaveId: z.string().describe('Enclave ID to verify'),
  nonce: z.string().optional().describe('Nonce for replay protection'),
  challenge: z.string().optional().describe('Challenge string for additional verification'),
});

export const getVerificationStatusSchema = z.object({
  enclaveId: z.string().describe('Enclave ID to check'),
});

// ─── Providers ──────────────────────────────────────────────────────────────

export const listProvidersSchema = z.object({});

export const getProviderSchema = z.object({
  providerId: z.string().describe('Provider ID (e.g. "aws-nitro-enclave")'),
});

// ─── Tasks ──────────────────────────────────────────────────────────────────

export const listTasksSchema = z.object({
  walletAddress: z.string().describe('Wallet address that owns the tasks'),
});

export const createTaskSchema = z.object({
  name: z.string().describe('Task name'),
  description: z.string().describe('Task description'),
  enclaveId: z.string().describe('Enclave to run the task on'),
  schedule: z.string().describe('Cron expression (e.g. "0 */6 * * *")'),
  walletAddress: z.string().describe('Wallet address for authorization'),
});

// ─── API Keys ───────────────────────────────────────────────────────────────

export const listApiKeysSchema = z.object({
  walletAddress: z.string().describe('Wallet address that owns the API keys'),
});

export const createApiKeySchema = z.object({
  name: z.string().describe('Human-readable key name'),
  permissions: z.array(
    z.enum(['enclaves:read', 'enclaves:write', 'tasks:read', 'tasks:write', 'logs:read'])
  ).describe('Array of permission scopes'),
  walletAddress: z.string().describe('Wallet address for authorization'),
});

// ─── Tool Definitions ───────────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'treza_list_enclaves',
    description: 'List all Treza Nitro Enclaves owned by a wallet address. Returns enclave IDs, names, statuses, regions, and configuration.',
    schema: listEnclavesSchema,
  },
  {
    name: 'treza_get_enclave',
    description: 'Get detailed information about a specific Treza enclave including its status, configuration, provider settings, and GitHub connection.',
    schema: getEnclaveSchema,
  },
  {
    name: 'treza_create_enclave',
    description: 'Create a new AWS Nitro Enclave with hardware-isolated TEE. The enclave will generate and manage private keys internally — keys never leave the enclave boundary. Deployment takes 2-5 minutes via Step Functions.',
    schema: createEnclaveSchema,
  },
  {
    name: 'treza_update_enclave',
    description: 'Update an existing enclave\'s name, description, or configuration.',
    schema: updateEnclaveSchema,
  },
  {
    name: 'treza_delete_enclave',
    description: 'Permanently delete a terminated enclave. The enclave must be in DESTROYED status before deletion.',
    schema: deleteEnclaveSchema,
  },
  {
    name: 'treza_enclave_action',
    description: 'Perform a lifecycle action on an enclave: pause (stop billing), resume (restart), or terminate (destroy infrastructure). Terminate is irreversible.',
    schema: enclaveActionSchema,
  },
  {
    name: 'treza_get_enclave_logs',
    description: 'Retrieve logs from an enclave. Supports filtering by source: ECS deployment, Step Functions workflow, Lambda triggers, application stdout/stderr, or errors only.',
    schema: getEnclaveLogsSchema,
  },
  {
    name: 'treza_get_attestation',
    description: 'Get the attestation document for a deployed enclave. Returns PCR measurements (enclave image hash, kernel hash, application hash, signing cert), certificate chain, and verification endpoints. Use this to cryptographically verify an enclave is running the expected code.',
    schema: getAttestationSchema,
  },
  {
    name: 'treza_verify_attestation',
    description: 'Perform comprehensive cryptographic verification of an enclave\'s attestation. Checks PCR measurements, certificate chain, timestamp validity, nonce matching, and signature. Returns trust level (HIGH/MEDIUM/LOW), compliance status (SOC2, HIPAA, FIPS), and risk score.',
    schema: verifyAttestationSchema,
  },
  {
    name: 'treza_get_verification_status',
    description: 'Quick check of an enclave\'s verification status and trust level without performing full verification.',
    schema: getVerificationStatusSchema,
  },
  {
    name: 'treza_list_providers',
    description: 'List all available enclave providers (e.g., AWS Nitro Enclave) with their supported regions and configuration schemas.',
    schema: listProvidersSchema,
  },
  {
    name: 'treza_get_provider',
    description: 'Get detailed information about a specific enclave provider including supported regions and configuration options.',
    schema: getProviderSchema,
  },
  {
    name: 'treza_list_tasks',
    description: 'List all scheduled tasks for a wallet. Tasks are cron-scheduled operations that run inside enclaves.',
    schema: listTasksSchema,
  },
  {
    name: 'treza_create_task',
    description: 'Create a new scheduled task to run inside an enclave on a cron schedule.',
    schema: createTaskSchema,
  },
  {
    name: 'treza_list_api_keys',
    description: 'List all API keys for a wallet address. Keys have scoped permissions (enclaves:read, enclaves:write, tasks:read, tasks:write, logs:read).',
    schema: listApiKeysSchema,
  },
  {
    name: 'treza_create_api_key',
    description: 'Create a new scoped API key for programmatic access to the Treza platform. Returns the key only once — store it securely.',
    schema: createApiKeySchema,
  },
];
