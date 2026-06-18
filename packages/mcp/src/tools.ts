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

// ─── PII Tracking ────────────────────────────────────────────────────────────

export const piiScanSchema = z.object({
  payload: z.record(z.unknown()).describe('The JSON object (agent context or step input) to scan for PII fields'),
  customPIIFields: z.array(z.string()).optional().describe('Additional field names to treat as PII beyond the built-in heuristics (e.g. ["employeeId", "taxId"])'),
});

export const piiWorkflowCheckSchema = z.object({
  workflow: z.object({
    id: z.string().describe('Workflow identifier'),
    name: z.string().describe('Human-readable workflow name'),
    steps: z.array(z.object({
      id: z.string(),
      name: z.string(),
      requiresPII: z.array(z.string()).describe('PII field names this step is allowed to receive'),
    })).describe('Ordered list of workflow steps with their PII declarations'),
  }).describe('Workflow definition to analyse'),
  initialPayload: z.record(z.unknown()).optional().describe('The data object that will be passed into the first step, used to show which fields are affected'),
});

export const redactTextSchema = z.object({
  text: z.string().describe('The text to redact. PII is detected and replaced with typed placeholders (e.g. [EMAIL_1]).'),
});

export const redactChatCompletionsSchema = z.object({
  messages: z.array(z.object({
    role: z.string().describe('Message role (e.g. "system", "user", "assistant")'),
    content: z.string().describe('Message content; PII is redacted before forwarding upstream'),
  })).describe('OpenAI-style chat messages'),
  model: z.string().default('gpt-4o-mini').describe('Upstream model name'),
  modelKey: z.string().optional().describe('Upstream provider API key (x-model-key). Omit when the selected proxy stores one.'),
  proxyId: z.string().optional().describe('Configured redaction proxy id (x-treza-proxy) carrying the upstream URL, stored key, and policy'),
  rehydrate: z.boolean().optional().describe('When true, also return the placeholder → original map so values can be restored in the response'),
});

export const piiAuditQuerySchema = z.object({
  workflowId: z.string().optional().describe('Filter events by workflow ID'),
  walletAddress: z.string().optional().describe('Filter events by wallet address'),
  violationsOnly: z.boolean().optional().describe('If true, return only events where PII flowed into a step that declared requiresPII: []'),
  limit: z.number().optional().describe('Maximum number of events to return (default 50, max 500)'),
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
  {
    name: 'treza_pii_scan',
    description: 'Scan a JSON payload for fields that likely contain Personally Identifiable Information (PII). Uses built-in heuristics (name, email, dob, ssn, address, passport, etc.) plus any custom fields you supply. Returns a classified field list and a risk summary. Use this before passing context to a workflow step to understand what sensitive data is present.',
    schema: piiScanSchema,
  },
  {
    name: 'treza_pii_workflow_check',
    description: 'Analyse a full workflow definition and report which steps receive PII, which strip it, and flag any steps where PII would flow in despite the step declaring requiresPII: []. Use this to audit a workflow design before running it, or to document your data-flow for compliance purposes.',
    schema: piiWorkflowCheckSchema,
  },
  {
    name: 'treza_redact_text',
    description: 'Redact PII from a text string using the Treza redaction enclave. Returns the redacted text (PII replaced with typed placeholders like [EMAIL_1]), the detected entities, and the redaction mode (tee/standard). The original text is never stored or forwarded. Use this before sending agent context to an external LLM or storing it. Requires TREZA_API_KEY with the redact:run permission.',
    schema: redactTextSchema,
  },
  {
    name: 'treza_redact_chat_completions',
    description: 'OpenAI-compatible chat completion with PII redacted before the prompt is forwarded to the upstream model provider. Message content is stripped of PII, sent upstream, and the provider response is returned verbatim along with the Treza request id and mode. Pass rehydrate:true to also get the placeholder → original map so you can restore values in the response. Provide either modelKey (upstream key) or proxyId (a configured proxy that stores one). Requires TREZA_API_KEY with the redact:proxy permission.',
    schema: redactChatCompletionsSchema,
  },
  {
    name: 'treza_pii_audit_query',
    description: 'Query the PII audit log for past workflow runs. Returns PIIAccessEvent records showing which PII fields were present, allowed, and stripped at each step boundary. Filter by workflowId, walletAddress, or show only violation events where PII leaked into a step that should not have received it.',
    schema: piiAuditQuerySchema,
  },
];
