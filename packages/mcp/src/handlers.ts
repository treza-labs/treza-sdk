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
  piiScanSchema,
  piiWorkflowCheckSchema,
  piiAuditQuerySchema,
  redactTextSchema,
  redactChatCompletionsSchema,
} from './tools';

// Built-in PII field name heuristics (case-insensitive substring match)
const PII_HEURISTICS = [
  'name', 'firstname', 'lastname', 'fullname',
  'email', 'phone', 'mobile', 'tel',
  'dob', 'dateofbirth', 'birthdate', 'birthday', 'age',
  'ssn', 'sin', 'nin', 'taxid', 'passport', 'license',
  'address', 'street', 'city', 'zip', 'postcode', 'country',
  'ip', 'deviceid', 'userid', 'nationalid', 'gender',
  'salary', 'income', 'creditcard', 'cardnumber', 'iban',
  'biometric', 'fingerprint', 'faceid',
];

function isPIIField(fieldName: string, customFields: string[]): boolean {
  const lower = fieldName.toLowerCase().replace(/[_\-\s]/g, '');
  return (
    PII_HEURISTICS.some(h => lower.includes(h)) ||
    customFields.some(f => lower.includes(f.toLowerCase().replace(/[_\-\s]/g, '')))
  );
}

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

      // ── PII Redaction ───────────────────────────────────────────────
      case 'treza_redact_text': {
        const { text } = redactTextSchema.parse(args);
        const result = await client.redactText(text);
        return ok(result);
      }

      case 'treza_redact_chat_completions': {
        const { messages, model, modelKey, proxyId, rehydrate } =
          redactChatCompletionsSchema.parse(args);
        const result = await client.redactChatCompletions(
          { model, messages },
          {
            ...(modelKey && { modelKey }),
            ...(proxyId && { proxyId }),
            ...(rehydrate && { rehydrate }),
          },
        );
        return ok(result);
      }

      // ── PII Tracking ────────────────────────────────────────────────
      case 'treza_pii_scan': {
        const { payload, customPIIFields = [] } = piiScanSchema.parse(args);
        const fields = Object.keys(payload);
        const piiFields = fields.filter(f => isPIIField(f, customPIIFields));
        const nonPIIFields = fields.filter(f => !isPIIField(f, customPIIFields));
        const riskLevel = piiFields.length === 0 ? 'none' : piiFields.length <= 2 ? 'low' : piiFields.length <= 5 ? 'medium' : 'high';
        return ok({
          summary: {
            totalFields: fields.length,
            piiFieldCount: piiFields.length,
            riskLevel,
          },
          piiFields: piiFields.map(f => ({ field: f, classification: 'pii' })),
          nonPIIFields: nonPIIFields.map(f => ({ field: f, classification: 'non-pii' })),
          recommendation: piiFields.length > 0
            ? `This payload contains ${piiFields.length} PII field(s): ${piiFields.join(', ')}. Use PIIContext.fromObject() and declare requiresPII on each WorkflowStep to control where these fields flow.`
            : 'No PII detected. Safe to pass to any workflow step.',
        });
      }

      case 'treza_pii_workflow_check': {
        const { workflow, initialPayload = {} } = piiWorkflowCheckSchema.parse(args);
        const payloadFields = Object.keys(initialPayload);
        const detectedPIIFields = payloadFields.filter(f => isPIIField(f, []));

        const stepAnalysis = workflow.steps.map((step, index) => {
          const prevStepAllowed = index === 0
            ? detectedPIIFields
            : workflow.steps.slice(0, index).reduce<string[]>((acc, s) => {
                return acc.filter(f => s.requiresPII.includes(f));
              }, detectedPIIFields);

          const piiThatWouldArrive = prevStepAllowed;
          const piiStripped = piiThatWouldArrive.filter(f => !step.requiresPII.includes(f));
          const violation = piiThatWouldArrive.length > 0 && step.requiresPII.length === 0;

          return {
            stepId: step.id,
            stepName: step.name,
            requiresPII: step.requiresPII,
            piiFieldsReceived: piiThatWouldArrive.filter(f => step.requiresPII.includes(f)),
            piiFieldsStripped: piiStripped,
            violation,
            violationNote: violation
              ? `PII fields [${piiThatWouldArrive.join(', ')}] are present in context but this step declares requiresPII: []. They will be stripped — verify this is intentional.`
              : null,
          };
        });

        const violations = stepAnalysis.filter(s => s.violation);
        return ok({
          workflowId: workflow.id,
          workflowName: workflow.name,
          summary: {
            totalSteps: workflow.steps.length,
            stepsReceivingPII: stepAnalysis.filter(s => s.piiFieldsReceived.length > 0).length,
            violations: violations.length,
            status: violations.length === 0 ? 'clean' : 'violations_detected',
          },
          steps: stepAnalysis,
          ...(violations.length > 0 && {
            actionRequired: `${violations.length} step(s) will silently strip PII. Review these steps to confirm requiresPII is correctly declared.`,
          }),
        });
      }

      case 'treza_pii_audit_query': {
        const { workflowId, walletAddress, violationsOnly, limit = 50 } = piiAuditQuerySchema.parse(args);
        const data = await client.queryPIIAudit({
          workflowId: workflowId ?? undefined,
          walletAddress: walletAddress ?? undefined,
          violations: violationsOnly ?? false,
          limit: Math.min(limit, 500),
        });
        return ok(data);
      }

      default:
        return err(`Unknown tool: ${toolName}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return err(message);
  }
}
