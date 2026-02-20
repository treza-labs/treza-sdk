import { TrezaClient } from './treza-client';
import {
  listEnclavesSchema,
  getEnclaveSchema,
  createEnclaveSchema,
  updateEnclaveSchema,
  deleteEnclaveSchema,
  enclaveActionSchema,
  getEnclaveLogsSchema,
  getAttestationSchema,
  verifyAttestationSchema,
  getVerificationStatusSchema,
  listProvidersSchema,
  getProviderSchema,
  listTasksSchema,
  createTaskSchema,
  listApiKeysSchema,
  createApiKeySchema,
} from './tools';

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

function err(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

export async function handleToolCall(
  client: TrezaClient,
  toolName: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  try {
    switch (toolName) {
      // ── Enclave Management ──────────────────────────────────────────
      case 'treza_list_enclaves': {
        const { walletAddress } = listEnclavesSchema.parse(args);
        const enclaves = await client.getEnclaves(walletAddress);
        return ok({
          count: enclaves.length,
          enclaves: enclaves.map((e: Record<string, unknown>) => ({
            id: e.id,
            name: e.name,
            status: e.status,
            region: e.region,
            description: e.description,
            createdAt: e.createdAt,
          })),
        });
      }

      case 'treza_get_enclave': {
        const { enclaveId } = getEnclaveSchema.parse(args);
        const enclave = await client.getEnclave(enclaveId);
        return ok(enclave);
      }

      case 'treza_create_enclave': {
        const params = createEnclaveSchema.parse(args);
        const providerConfig: Record<string, unknown> = {};
        if (params.dockerImage) providerConfig.dockerImage = params.dockerImage;
        if (params.cpuCount) providerConfig.cpuCount = params.cpuCount;
        if (params.memoryMiB) providerConfig.memoryMiB = params.memoryMiB;
        if (params.workloadType) providerConfig.workloadType = params.workloadType;
        if (params.exposePorts) providerConfig.exposePorts = params.exposePorts;
        if (params.enableDebug !== undefined) providerConfig.enableDebug = params.enableDebug;

        const enclave = await client.createEnclave({
          name: params.name,
          description: params.description,
          region: params.region,
          walletAddress: params.walletAddress,
          providerId: params.providerId,
          providerConfig: Object.keys(providerConfig).length > 0 ? providerConfig : undefined,
        });
        return ok({
          message: `Enclave "${enclave.name}" created. Deployment in progress (typically 2-5 minutes).`,
          enclave,
        });
      }

      case 'treza_update_enclave': {
        const params = updateEnclaveSchema.parse(args);
        const enclave = await client.updateEnclave(params);
        return ok(enclave);
      }

      case 'treza_delete_enclave': {
        const { enclaveId, walletAddress } = deleteEnclaveSchema.parse(args);
        const message = await client.deleteEnclave(enclaveId, walletAddress);
        return ok({ message });
      }

      case 'treza_enclave_action': {
        const { enclaveId, action, walletAddress } = enclaveActionSchema.parse(args);
        const result = await client.performEnclaveAction({
          id: enclaveId,
          action,
          walletAddress,
        });
        return ok(result);
      }

      case 'treza_get_enclave_logs': {
        const { enclaveId, logType, limit } = getEnclaveLogsSchema.parse(args);
        const logs = await client.getEnclaveLogs(enclaveId, logType, limit);
        return ok(logs);
      }

      // ── Attestation ─────────────────────────────────────────────────
      case 'treza_get_attestation': {
        const { enclaveId } = getAttestationSchema.parse(args);
        const attestation = await client.getAttestation(enclaveId);
        return ok(attestation);
      }

      case 'treza_verify_attestation': {
        const { enclaveId, nonce, challenge } = verifyAttestationSchema.parse(args);
        const result = await client.verifyAttestation(enclaveId, {
          ...(nonce && { nonce }),
          ...(challenge && { challenge }),
        });
        return ok(result);
      }

      case 'treza_get_verification_status': {
        const { enclaveId } = getVerificationStatusSchema.parse(args);
        const status = await client.getVerificationStatus(enclaveId);
        return ok(status);
      }

      // ── Providers ───────────────────────────────────────────────────
      case 'treza_list_providers': {
        listProvidersSchema.parse(args);
        const providers = await client.getProviders();
        return ok(providers);
      }

      case 'treza_get_provider': {
        const { providerId } = getProviderSchema.parse(args);
        const provider = await client.getProvider(providerId);
        return ok(provider);
      }

      // ── Tasks ───────────────────────────────────────────────────────
      case 'treza_list_tasks': {
        const { walletAddress } = listTasksSchema.parse(args);
        const tasks = await client.getTasks(walletAddress);
        return ok({ count: tasks.length, tasks });
      }

      case 'treza_create_task': {
        const params = createTaskSchema.parse(args);
        const task = await client.createTask(params);
        return ok(task);
      }

      // ── API Keys ────────────────────────────────────────────────────
      case 'treza_list_api_keys': {
        const { walletAddress } = listApiKeysSchema.parse(args);
        const apiKeys = await client.getApiKeys(walletAddress);
        return ok({
          count: apiKeys.length,
          apiKeys: apiKeys.map((k: Record<string, unknown>) => ({
            id: k.id,
            name: k.name,
            status: k.status,
            permissions: k.permissions,
            createdAt: k.createdAt,
            lastUsed: k.lastUsed,
          })),
        });
      }

      case 'treza_create_api_key': {
        const params = createApiKeySchema.parse(args);
        const apiKey = await client.createApiKey(params);
        return ok({
          message: 'API key created. Store the key securely — it will not be shown again.',
          apiKey,
        });
      }

      default:
        return err(`Unknown tool: ${toolName}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return err(message);
  }
}
