import axios, { AxiosInstance, AxiosError } from 'axios';

export interface TrezaConfig {
  baseUrl?: string;
  timeout?: number;
  /** Treza API key (treza_live_... / treza_test_...) — required for authenticated endpoints like /api/pii/audit. */
  apiKey?: string;
  /** Tenant account the API key belongs to; sent as the x-treza-account header. */
  account?: string;
}

export class TrezaSdkError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;

  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = 'TrezaSdkError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Lightweight Treza API client for the MCP server.
 * Mirrors the full SDK's TrezaClient but with no extra dependencies.
 */
export class TrezaClient {
  private client: AxiosInstance;

  constructor(config: TrezaConfig = {}) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
    if (config.account) headers['x-treza-account'] = config.account;

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://app.trezalabs.com',
      timeout: config.timeout || 30000,
      headers,
    });

    this.client.interceptors.response.use(
      (r) => r,
      (error: AxiosError) => {
        if (error.response) {
          const data = error.response.data as Record<string, unknown>;
          throw new TrezaSdkError(
            (data?.error as string) || error.message,
            `HTTP_${error.response.status}`,
            error.response.status,
          );
        }
        throw new TrezaSdkError(error.message, 'NETWORK_ERROR');
      },
    );
  }

  // ── Enclaves ────────────────────────────────────────────────────────────
  async getEnclaves(walletAddress: string) {
    const r = await this.client.get('/api/enclaves', { params: { wallet: walletAddress } });
    return r.data.enclaves;
  }

  async getEnclave(enclaveId: string) {
    const r = await this.client.get(`/api/enclaves/${enclaveId}`);
    return r.data.enclave;
  }

  async createEnclave(request: Record<string, unknown>) {
    const r = await this.client.post('/api/enclaves', request);
    return r.data.enclave;
  }

  async updateEnclave(request: Record<string, unknown>) {
    const r = await this.client.put('/api/enclaves', request);
    return r.data.enclave;
  }

  async deleteEnclave(enclaveId: string, walletAddress: string) {
    const r = await this.client.delete(`/api/enclaves/${enclaveId}`, {
      params: { wallet: walletAddress },
    });
    return r.data.message;
  }

  async performEnclaveAction(request: { id: string; action: string; walletAddress: string }) {
    const r = await this.client.patch(`/api/enclaves/${request.id}`, {
      action: request.action,
      walletAddress: request.walletAddress,
    });
    return r.data;
  }

  async getEnclaveLogs(enclaveId: string, logType = 'all', limit = 100) {
    const r = await this.client.get(`/api/enclaves/${enclaveId}/logs`, {
      params: { type: logType, limit },
    });
    return r.data;
  }

  // ── Attestation ─────────────────────────────────────────────────────────
  async getAttestation(enclaveId: string) {
    const r = await this.client.get(`/api/enclaves/${enclaveId}/attestation`);
    return r.data;
  }

  async getVerificationStatus(enclaveId: string) {
    const r = await this.client.get(`/api/enclaves/${enclaveId}/attestation/verify`);
    return r.data;
  }

  async verifyAttestation(enclaveId: string, request?: Record<string, unknown>) {
    const r = await this.client.post(`/api/enclaves/${enclaveId}/attestation/verify`, request || {});
    return r.data;
  }

  // ── Providers ───────────────────────────────────────────────────────────
  async getProviders() {
    const r = await this.client.get('/api/providers');
    return r.data.providers;
  }

  async getProvider(providerId: string) {
    const r = await this.client.get('/api/providers', { params: { id: providerId } });
    return r.data.provider;
  }

  // ── Tasks ───────────────────────────────────────────────────────────────
  async getTasks(walletAddress: string) {
    const r = await this.client.get('/api/tasks', { params: { wallet: walletAddress } });
    return r.data.tasks;
  }

  async createTask(request: Record<string, unknown>) {
    const r = await this.client.post('/api/tasks', request);
    return r.data.task;
  }

  // ── API Keys ────────────────────────────────────────────────────────────
  async getApiKeys(walletAddress: string) {
    const r = await this.client.get('/api/api-keys', { params: { wallet: walletAddress } });
    return r.data.apiKeys;
  }

  async createApiKey(request: Record<string, unknown>) {
    const r = await this.client.post('/api/api-keys', request);
    return r.data.apiKey;
  }

  // ── PII Redaction ──────────────────────────────────────────────────────────
  /**
   * Redact PII from a text string via the redaction enclave (`POST /api/redact/run`).
   * Requires an API key with the `redact:run` permission. The original text is
   * never stored or forwarded.
   */
  async redactText(text: string) {
    const r = await this.client.post('/api/redact/run', { text });
    return r.data;
  }

  /**
   * OpenAI-compatible chat completions with PII redacted before forwarding
   * upstream (`POST /api/redact/chat/completions`). Requires an API key with the
   * `redact:proxy` permission and either a stored proxy key (via `proxyId`) or an
   * upstream `modelKey`. Streaming is not supported here. Returns the upstream
   * response body plus the Treza request id, mode, and (optional) rehydration map.
   */
  async redactChatCompletions(
    request: Record<string, unknown>,
    options: { modelKey?: string; proxyId?: string; rehydrate?: boolean } = {},
  ) {
    const headers: Record<string, string> = {};
    if (options.modelKey) headers['x-model-key'] = options.modelKey;
    if (options.proxyId) headers['x-treza-proxy'] = options.proxyId;
    if (options.rehydrate) headers['x-treza-rehydrate'] = '1';

    const r = await this.client.post(
      '/api/redact/chat/completions',
      { ...request, stream: false },
      { headers },
    );

    let rehydration: Record<string, string> | undefined;
    const rehydrationHeader = r.headers['x-treza-rehydration'];
    if (typeof rehydrationHeader === 'string' && rehydrationHeader) {
      try {
        rehydration = JSON.parse(rehydrationHeader);
      } catch {
        rehydration = undefined;
      }
    }

    return {
      data: r.data,
      requestId: (r.headers['x-treza-request-id'] as string) || '',
      mode: (r.headers['x-treza-mode'] as string) || 'standard',
      ...(rehydration ? { rehydration } : {}),
    };
  }

  // ── PII Audit ────────────────────────────────────────────────────────────
  async queryPIIAudit(params: {
    workflowId?: string;
    walletAddress?: string;
    violations?: boolean;
    limit?: number;
  }) {
    const r = await this.client.get('/api/pii/audit', { params: {
      ...(params.workflowId && { workflowId: params.workflowId }),
      ...(params.walletAddress && { walletAddress: params.walletAddress }),
      ...(params.violations && { violations: 'true' }),
      limit: params.limit ?? 50,
    }});
    return r.data;
  }
}
