import { TrezaClient } from './treza-client';

/**
 * MCP Resources expose Treza data as browsable context that AI agents
 * can read without invoking a tool. This gives agents ambient awareness
 * of enclave state.
 */

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface ResourceTemplateDefinition {
  uriTemplate: string;
  name: string;
  description: string;
  mimeType: string;
}

export const RESOURCE_TEMPLATES: ResourceTemplateDefinition[] = [
  {
    uriTemplate: 'treza://enclaves/{walletAddress}',
    name: 'Wallet Enclaves',
    description: 'All enclaves owned by a wallet address, including status and configuration',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'treza://enclaves/{enclaveId}/details',
    name: 'Enclave Details',
    description: 'Full details for a specific enclave including provider config and GitHub connection',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'treza://enclaves/{enclaveId}/attestation',
    name: 'Enclave Attestation',
    description: 'Attestation document with PCR measurements, certificate chain, and verification status',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'treza://enclaves/{enclaveId}/verification',
    name: 'Verification Status',
    description: 'Quick verification status and trust level for an enclave',
    mimeType: 'application/json',
  },
];

export async function handleResourceRead(
  client: TrezaClient,
  uri: string,
): Promise<string> {
  const url = new URL(uri);
  const pathParts = url.pathname.replace(/^\/+/, '').split('/');

  // treza://enclaves/{walletAddress}
  if (url.host === 'enclaves' && pathParts.length === 1 && pathParts[0] !== '') {
    const walletAddress = pathParts[0];
    const enclaves = await client.getEnclaves(walletAddress);
    return JSON.stringify({ count: enclaves.length, enclaves }, null, 2);
  }

  // treza://enclaves/{enclaveId}/details
  if (url.host === 'enclaves' && pathParts.length === 2 && pathParts[1] === 'details') {
    const enclaveId = pathParts[0];
    const enclave = await client.getEnclave(enclaveId);
    return JSON.stringify(enclave, null, 2);
  }

  // treza://enclaves/{enclaveId}/attestation
  if (url.host === 'enclaves' && pathParts.length === 2 && pathParts[1] === 'attestation') {
    const enclaveId = pathParts[0];
    const attestation = await client.getAttestation(enclaveId);
    return JSON.stringify(attestation, null, 2);
  }

  // treza://enclaves/{enclaveId}/verification
  if (url.host === 'enclaves' && pathParts.length === 2 && pathParts[1] === 'verification') {
    const enclaveId = pathParts[0];
    const status = await client.getVerificationStatus(enclaveId);
    return JSON.stringify(status, null, 2);
  }

  throw new Error(`Unknown resource URI: ${uri}`);
}
