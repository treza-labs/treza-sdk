import axios, { AxiosInstance, AxiosError } from 'axios';

export interface TrezaConfig {
  baseUrl?: string;
  timeout?: number;
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
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://app.trezalabs.com',
      timeout: config.timeout || 30000,
      headers: { 'Content-Type': 'application/json' },
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
}
