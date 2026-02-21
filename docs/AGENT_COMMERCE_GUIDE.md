# How an AI Agent Discovers, Deploys, Pays For, and Uses a Treza Enclave

> End-to-end walkthrough: from zero to an autonomous agent running paid workloads inside a hardware-isolated TEE.

## The Big Picture

An AI agent needs to run sensitive code — maybe signing blockchain transactions, processing private data, or executing a trading strategy. It needs:

1. **Isolation** — code runs in a hardware-secured environment (TEE)
2. **Attestation** — cryptographic proof that the environment is untampered
3. **Autonomous payment** — the agent pays for compute without human intervention
4. **Programmable tasks** — schedule and manage workloads via API

Treza provides all four. Here's how an agent goes from discovery to running paid workloads, step by step.

---

## Phase 1: Discovery

The agent needs to find Treza. There are three discovery paths depending on the agent framework.

### Path A: MCP (Claude, Cursor, any MCP client)

The agent's MCP config includes Treza as a tool server:

```json
{
  "mcpServers": {
    "treza": {
      "command": "npx",
      "args": ["@treza/mcp"],
      "env": {
        "TREZA_BASE_URL": "https://app.trezalabs.com"
      }
    }
  }
}
```

The agent now has 16 tools available: `treza_list_enclaves`, `treza_create_enclave`, `treza_verify_attestation`, etc. It can also browse resources like `treza://enclaves/{wallet}` to inspect existing infrastructure.

### Path B: OpenAPI (OpenAI, Gemini, LangChain, CrewAI)

The agent fetches the machine-readable API spec:

```
GET https://app.trezalabs.com/.well-known/openapi.json
```

This returns an OpenAPI 3.0 spec with 21 paths and 35 operationIds. Agent frameworks auto-generate tool definitions from this. Every operation has a unique `operationId` like `createEnclave`, `verifyAttestation`, `submitZKProof`.

### Path C: Agent Manifest (orchestration systems)

```
GET https://app.trezalabs.com/.well-known/ai-plugin.json
```

Returns a structured manifest describing Treza's capabilities (secure compute, attestation, signing, compliance), authentication method, and links to the OpenAPI spec and MCP package.

### Path D: x402 Bazaar (autonomous commerce)

The agent discovers Treza's paid endpoints through the Coinbase x402 Bazaar:

```typescript
import { discoverPayableServices } from '@treza/sdk';

const services = await discoverPayableServices({
  maxPrice: '0.01',         // under 1 cent per call
  network: 'eip155:8453',   // Base mainnet
});

// Returns Treza attestation verification, enclave operations, etc.
```

---

## Phase 2: Provision an Enclave

The agent decides it needs a secure environment. Using the SDK (or any of the discovery paths above):

```typescript
import { TrezaClient } from '@treza/sdk';

const treza = new TrezaClient({
  baseUrl: 'https://app.trezalabs.com',
});

// 1. Check available providers and regions
const providers = await treza.getProviders();
// → [{ id: 'aws-nitro', name: 'AWS Nitro Enclaves', regions: ['us-east-1', ...] }]

// 2. Create the enclave
const enclave = await treza.createEnclave({
  name: 'agent-trading-bot',
  description: 'Autonomous trading strategy execution',
  region: 'us-east-1',
  walletAddress: '0xAgentWallet...',
  providerId: 'aws-nitro',
  providerConfig: {
    dockerImage: 'myorg/trading-bot:latest',
    cpuCount: '2',
    memoryMiB: '1024',
    workloadType: 'service',
    exposePorts: '8080',
  },
});

console.log(enclave.id);     // 'enc_abc123'
console.log(enclave.status); // 'DEPLOYING'
```

Deployment takes 2-5 minutes. The enclave:
- Pulls the Docker image
- Boots inside an AWS Nitro Enclave (hardware-isolated VM)
- Generates a private key **inside** the enclave — it never leaves
- Starts the application
- Generates an attestation document

### Polling for deployment

```typescript
let status = 'DEPLOYING';
while (status === 'DEPLOYING' || status === 'PENDING_DEPLOY') {
  await new Promise(r => setTimeout(r, 15000));
  const updated = await treza.getEnclave(enclave.id);
  status = updated.status;
  console.log(`Enclave status: ${status}`);
}
// → 'DEPLOYED'
```

---

## Phase 3: Verify Enclave Integrity

Before trusting the enclave with sensitive operations, the agent verifies it's running the expected code:

```typescript
// Get the attestation document
const attestation = await treza.getAttestation(enclave.id);

console.log(attestation.attestationDocument.pcrs);
// {
//   "0": "a1b2c3...",   ← hash of the enclave image
//   "1": "d4e5f6...",   ← hash of the Linux kernel
//   "2": "g7h8i9...",   ← hash of the application
//   "8": "j0k1l2...",   ← hash of the signing certificate
// }

// Full cryptographic verification
const verification = await treza.verifyAttestation(enclave.id, {
  nonce: 'agent-session-' + Date.now(),  // replay protection
});

console.log(verification.isValid);          // true
console.log(verification.trustLevel);       // 'HIGH'
console.log(verification.riskScore);        // 5 (out of 100, lower is better)
console.log(verification.complianceChecks); // { soc2: false, hipaa: false, fips: true, commonCriteria: true }
```

The agent now has cryptographic proof that:
- The enclave is running the expected Docker image (PCR0)
- The kernel is unmodified (PCR1)
- The application code matches (PCR2)
- The signing certificate is valid (PCR8)

---

## Phase 4: Pay for Services with x402

When x402 is enabled, certain Treza API endpoints require micropayments. The agent pays automatically using its enclave's private key — funds never leave the TEE.

### Setup: Enclave as Payment Wallet

```typescript
import { TrezaClient, createEnclaveFetch } from '@treza/sdk';

const treza = new TrezaClient({
  baseUrl: 'https://app.trezalabs.com',
});

// Create a fetch function that auto-pays 402 responses
// The enclave's internal key signs USDC payments on Base
const paidFetch = await createEnclaveFetch(treza, {
  enclaveId: enclave.id,
  verifyAttestation: true,  // verify enclave before every payment
});
```

### Making Paid API Calls

```typescript
// This endpoint costs $0.001 per call when x402 is enabled
const response = await paidFetch(
  `https://app.trezalabs.com/api/enclaves/${enclave.id}/attestation/verify`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: 'verify-' + Date.now() }),
  }
);

const result = await response.json();
// Payment was handled automatically:
// 1. First request got 402 with price=$0.001 on Base
// 2. Enclave signed a USDC payment inside the TEE
// 3. Request retried with Payment-Signature header
// 4. Server verified payment, returned data, settled on-chain
```

### The Payment Flow (what happens under the hood)

```
Agent                        Treza API                    Facilitator          Base L2
  │                              │                            │                  │
  │─── GET /attestation ────────▶│                            │                  │
  │                              │                            │                  │
  │◀── 402 Payment Required ─────│                            │                  │
  │    price: $0.001             │                            │                  │
  │    network: eip155:8453      │                            │                  │
  │    payTo: 0xTreza...         │                            │                  │
  │                              │                            │                  │
  │── Sign payment (in TEE) ──┐  │                            │                  │
  │◀─ Payment-Signature ──────┘  │                            │                  │
  │                              │                            │                  │
  │─── GET /attestation ────────▶│                            │                  │
  │    + Payment-Signature       │                            │                  │
  │                              │─── Verify payment ────────▶│                  │
  │                              │◀── Valid ──────────────────│                  │
  │                              │                            │                  │
  │◀── 200 Attestation Data ─────│                            │                  │
  │                              │─── Settle payment ────────▶│──── USDC tx ────▶│
  │                              │                            │                  │
```

---

## Phase 5: Schedule and Run Tasks

With the enclave deployed and verified, the agent can schedule workloads:

```typescript
// Create a recurring task inside the enclave
const task = await treza.createTask({
  name: 'hourly-rebalance',
  description: 'Rebalance portfolio based on market conditions',
  enclaveId: enclave.id,
  schedule: '0 * * * *',  // every hour
  walletAddress: '0xAgentWallet...',
});

console.log(task.id);     // 'task_xyz789'
console.log(task.status); // 'pending'
```

### Sign Blockchain Transactions from the Enclave

The agent can also use the enclave to sign transactions — the private key was generated inside the TEE and never leaves:

```typescript
import { TrezaClient, EnclaveSigner } from '@treza/sdk';
import { ethers } from 'ethers';

const signer = new EnclaveSigner(treza, {
  enclaveId: enclave.id,
  verifyAttestation: true,
});

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const ethersSigner = await signer.getSigner(provider);

// Sign and send a transaction — key never leaves the enclave
const tx = await ethersSigner.sendTransaction({
  to: '0xRecipient...',
  value: ethers.parseEther('0.01'),
});

console.log('TX hash:', tx.hash);
```

### Monitor with Logs

```typescript
const logs = await treza.getEnclaveLogs(enclave.id, {
  type: 'application',
  limit: 50,
});

logs.logs.application.forEach(entry => {
  console.log(`[${new Date(entry.timestamp)}] ${entry.message}`);
});
```

---

## Phase 6: Lifecycle Management

The agent manages the enclave lifecycle based on demand:

```typescript
// Pause when idle (stops billing, preserves state)
await treza.enclaveLifecycleAction(enclave.id, {
  action: 'pause',
  walletAddress: '0xAgentWallet...',
});

// Resume when needed
await treza.enclaveLifecycleAction(enclave.id, {
  action: 'resume',
  walletAddress: '0xAgentWallet...',
});

// Terminate when done
await treza.enclaveLifecycleAction(enclave.id, {
  action: 'terminate',
  walletAddress: '0xAgentWallet...',
});
```

---

## Complete Agent Script

Putting it all together — a fully autonomous agent that discovers, deploys, verifies, pays, and runs a task:

```typescript
import {
  TrezaClient,
  EnclaveSigner,
  createEnclaveFetch,
  discoverPayableServices,
} from '@treza/sdk';

async function autonomousAgent() {
  const treza = new TrezaClient({
    baseUrl: 'https://app.trezalabs.com',
  });

  // ── Discovery ──────────────────────────────────────────
  const services = await discoverPayableServices({ maxPrice: '0.01' });
  console.log(`Found ${services.length} affordable services on x402 Bazaar`);

  // ── Deploy ─────────────────────────────────────────────
  const enclave = await treza.createEnclave({
    name: 'autonomous-agent-enclave',
    description: 'AI agent secure compute environment',
    region: 'us-east-1',
    walletAddress: '0xAgentWallet...',
    providerId: 'aws-nitro',
    providerConfig: {
      dockerImage: 'myorg/agent-runtime:latest',
      cpuCount: '2',
      memoryMiB: '1024',
      workloadType: 'service',
    },
  });
  console.log(`Enclave ${enclave.id} deploying...`);

  // Wait for deployment
  let status = enclave.status;
  while (status !== 'DEPLOYED' && status !== 'FAILED') {
    await new Promise(r => setTimeout(r, 15000));
    const updated = await treza.getEnclave(enclave.id);
    status = updated.status;
  }

  if (status === 'FAILED') throw new Error('Deployment failed');
  console.log(`Enclave ${enclave.id} is live`);

  // ── Verify ─────────────────────────────────────────────
  const verification = await treza.verifyAttestation(enclave.id);
  if (!verification.isValid || verification.trustLevel !== 'HIGH') {
    throw new Error('Enclave failed attestation — aborting');
  }
  console.log(`Attestation verified: trust=${verification.trustLevel}, risk=${verification.riskScore}`);

  // ── Pay ────────────────────────────────────────────────
  const paidFetch = await createEnclaveFetch(treza, {
    enclaveId: enclave.id,
    verifyAttestation: true,
  });

  // Use paid endpoints (x402 payments handled automatically)
  const attestation = await paidFetch(
    `https://app.trezalabs.com/api/enclaves/${enclave.id}/attestation`
  );
  console.log('Paid attestation retrieved:', (await attestation.json()).enclaveId);

  // ── Run Tasks ──────────────────────────────────────────
  const task = await treza.createTask({
    name: 'agent-workload',
    description: 'Process and sign transactions',
    enclaveId: enclave.id,
    schedule: '*/30 * * * *',  // every 30 minutes
    walletAddress: '0xAgentWallet...',
  });
  console.log(`Task ${task.id} scheduled`);

  // ── Sign Transactions ──────────────────────────────────
  const signer = new EnclaveSigner(treza, {
    enclaveId: enclave.id,
    verifyAttestation: true,
  });
  const address = await signer.getAddress();
  console.log(`Enclave signing address: ${address}`);

  return { enclaveId: enclave.id, taskId: task.id, signerAddress: address };
}

autonomousAgent()
  .then(result => console.log('Agent ready:', result))
  .catch(err => console.error('Agent failed:', err));
```

---

## Security Model

| Layer | What it protects | How |
|-------|-----------------|-----|
| **AWS Nitro Enclave** | Code execution | Hardware-isolated VM, no SSH, no persistent storage |
| **PCR Attestation** | Code integrity | Cryptographic hash of image, kernel, app, and signing cert |
| **EnclaveSigner** | Private keys | Keys generated and used only inside the TEE boundary |
| **x402 Payments** | Financial autonomy | Agent pays with enclave-held USDC — keys never exposed |
| **Attestation before signing** | Trust verification | Every signing/payment operation can verify enclave integrity first |

---

## Integration Matrix

| Agent Framework | Discovery Method | Tools Available |
|----------------|-----------------|-----------------|
| Claude / Cursor | MCP Server (`@treza/mcp`) | 16 tools + 4 resources |
| OpenAI Agents | OpenAPI spec (`.well-known/openapi.json`) | 35 operations |
| LangChain / CrewAI | OpenAPI spec | 35 operations |
| Autonomous agents | x402 Bazaar + SDK | Full SDK + paid endpoints |
| Custom agents | REST API + SDK | Full SDK |

---

## What's Next

- **Multi-chain payments**: SVM (Solana) support for x402 payments
- **Agent-to-agent**: Enclaves serving as x402 resource servers for other agents
- **KYC-gated access**: Agents proving compliance via ZK proofs before accessing regulated endpoints
- **Governance**: On-chain voting for enclave policies via TrezaGovernor
