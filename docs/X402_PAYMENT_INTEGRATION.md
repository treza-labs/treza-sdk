# x402 Payment Integration

Treza integrates the [x402 protocol](https://docs.cdp.coinbase.com/x402/welcome) to enable instant, autonomous stablecoin micropayments for API access. AI agents and developers can pay for Treza services programmatically using USDC on Base — no API keys, subscriptions, or manual billing required.

## What is x402?

x402 is an open payment protocol built by [Coinbase](https://docs.cdp.coinbase.com/x402/welcome) that uses the HTTP `402 Payment Required` status code. When a client requests a paid resource:

1. The server responds with `402` and payment instructions (price, network, recipient)
2. The client signs a USDC payment
3. The client retries the request with a `Payment-Signature` header
4. The server verifies the payment, returns the data, and settles on-chain

Payments are instant, permissionless, and settled in USDC on Base (L2).

## How Treza Uses x402

### Paid Endpoints

The following Treza API endpoints support x402 payments when enabled:

| Endpoint | Method | Price | Description |
|----------|--------|-------|-------------|
| `/api/enclaves/{id}/attestation` | GET | $0.001 | Retrieve enclave attestation document with PCR measurements |
| `/api/enclaves/{id}/attestation/verify` | POST | $0.01 | Full cryptographic verification with compliance checks |

When x402 is disabled (default for development), these endpoints work normally without payment.

### Payment Flow

```
Client                          Treza API                     Facilitator         Base L2
  │                                │                              │                  │
  │── GET /attestation ───────────▶│                              │                  │
  │                                │                              │                  │
  │◀── 402 Payment Required ───────│                              │                  │
  │    price: $0.001               │                              │                  │
  │    network: eip155:8453        │                              │                  │
  │    payTo: 0xTreza...           │                              │                  │
  │                                │                              │                  │
  │── Sign USDC payment ──┐       │                              │                  │
  │◀── Payment-Signature ─┘       │                              │                  │
  │                                │                              │                  │
  │── GET /attestation ───────────▶│                              │                  │
  │    + Payment-Signature         │                              │                  │
  │                                │── Verify payment ───────────▶│                  │
  │                                │◀── Valid ───────────────────│                  │
  │                                │                              │                  │
  │◀── 200 Attestation Data ───────│                              │                  │
  │                                │── Settle payment ───────────▶│── USDC tx ──────▶│
  │                                │                              │                  │
```

## Client-Side: Paying for Treza Services

### Using the Treza SDK (Enclave as Wallet)

The most powerful pattern is using a Treza Enclave as the payment wallet itself. The private key lives inside the hardware-isolated TEE — it never leaves the enclave boundary.

#### Install Dependencies

```bash
npm install @treza/sdk @x402/core @x402/evm @x402/fetch
```

#### Auto-Paying Fetch

The simplest approach — `createEnclaveFetch` returns a `fetch` function that automatically handles 402 responses:

```typescript
import { TrezaClient, createEnclaveFetch } from '@treza/sdk';

const treza = new TrezaClient({
  baseUrl: 'https://app.trezalabs.com',
});

const paidFetch = await createEnclaveFetch(treza, {
  enclaveId: 'enc_abc123',
  verifyAttestation: true,  // verify enclave integrity before each payment
});

// Payments are handled automatically
const response = await paidFetch(
  'https://app.trezalabs.com/api/enclaves/enc_abc123/attestation'
);
const attestation = await response.json();
```

#### x402 Client (Advanced)

For more control, use the x402 client directly:

```typescript
import { TrezaClient, createEnclaveX402Client } from '@treza/sdk';

const treza = new TrezaClient({
  baseUrl: 'https://app.trezalabs.com',
});

const { x402, account } = await createEnclaveX402Client(treza, {
  enclaveId: 'enc_abc123',
  verifyAttestation: true,
});

// account.address → the enclave's signing address (fund this with USDC)
console.log('Payment wallet:', account.address);
```

#### Enclave Account (Low-Level)

Create a viem-compatible account backed by the enclave for use with any x402 library:

```typescript
import { TrezaClient, createEnclaveAccount } from '@treza/sdk';

const treza = new TrezaClient({
  baseUrl: 'https://app.trezalabs.com',
});

const account = await createEnclaveAccount(treza, {
  enclaveId: 'enc_abc123',
  verifyAttestation: true,
});

// Use with x402 directly
import { x402Client } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

const client = new x402Client();
registerExactEvmScheme(client, { signer: account });
```

### Using Any x402 Client (External Wallet)

You don't need the Treza SDK to pay. Any x402-compatible wallet works:

```typescript
import { wrapFetchWithPayment } from '@x402/fetch';
import { x402Client } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount('0xYourPrivateKey...');

const client = new x402Client();
registerExactEvmScheme(client, { signer: account });

const paidFetch = wrapFetchWithPayment(fetch, client);

const response = await paidFetch(
  'https://app.trezalabs.com/api/enclaves/enc_abc123/attestation/verify',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: 'my-verification-nonce' }),
  }
);
```

### Using curl (Manual)

To inspect the 402 response without paying:

```bash
curl -i https://app.trezalabs.com/api/enclaves/enc_abc123/attestation

# Response (when x402 is enabled):
# HTTP/2 402
# Payment-Required: {"accepts":[{"scheme":"exact","price":"0.001","network":"eip155:8453","payTo":"0x..."}],...}
# X-Payment-Network: eip155:8453
# X-Payment-Price: 0.001
```

## Server-Side: Adding x402 to Your Own Endpoints

If you're building on the Treza platform and want to monetize your own API endpoints, use the `withX402Payment` wrapper.

### Basic Usage

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withX402Payment } from '@/lib/x402';

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Your endpoint logic here
  return NextResponse.json({ data: 'your response' });
}

export const GET = withX402Payment(handleGET, {
  price: '0.001',       // USDC price per request
  description: 'Get resource data',
});
```

### With Bazaar Discovery

Make your endpoint discoverable by AI agents on the [x402 Bazaar](https://docs.cdp.coinbase.com/x402/bazaar):

```typescript
export const GET = withX402Payment(handleGET, {
  price: '0.001',
  description: 'Retrieve enclave attestation document',
  discovery: {
    output: {
      example: {
        enclaveId: 'enc_abc123',
        attestationDocument: { pcrs: { '0': '...' } },
        verification: { trustLevel: 'HIGH' },
      },
    },
  },
});
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `X402_ENABLED` | No | `false` | Set to `true` to enable x402 payment gating |
| `TREZA_X402_PAY_TO` | Yes (if enabled) | — | Wallet address to receive USDC payments |
| `X402_NETWORK` | No | `eip155:84532` | Network identifier (Base Sepolia for testnet) |
| `X402_FACILITATOR_URL` | No | `https://www.x402.org/facilitator` | Payment verification facilitator |

#### Testnet Configuration

```env
X402_ENABLED=true
TREZA_X402_PAY_TO=0xYourTestnetAddress
X402_NETWORK=eip155:84532
X402_FACILITATOR_URL=https://www.x402.org/facilitator
```

#### Mainnet Configuration

```env
X402_ENABLED=true
TREZA_X402_PAY_TO=0xYourWalletAddress
X402_NETWORK=eip155:8453
X402_FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
```

## Discovering Payable Services

AI agents can discover Treza's x402-payable endpoints through the Bazaar:

```typescript
import { discoverPayableServices } from '@treza/sdk';

const services = await discoverPayableServices({
  maxPrice: '0.01',          // filter by max price per call
  network: 'eip155:8453',   // filter by network
});

services.forEach(service => {
  console.log(service.url, service.description, service.accepts);
});
```

## Security Model

| Layer | Protection |
|-------|-----------|
| **TEE Signing** | Payment signatures are created inside the hardware-isolated enclave — private keys never leave the Nitro Enclave boundary |
| **Attestation Verification** | Optional pre-signing attestation check ensures the enclave is untampered before authorizing payments |
| **Facilitator Verification** | Payment signatures are verified by the Coinbase facilitator before the server returns data |
| **On-Chain Settlement** | Payments settle as real USDC transfers on Base, providing an immutable audit trail |
| **Replay Protection** | Each payment signature is bound to a specific request and cannot be reused |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  AI Agent / Client                                      │
│  ┌───────────────┐  ┌──────────────┐                    │
│  │  @treza/sdk   │  │  @x402/fetch │                    │
│  │  createEnclave│──│  auto-pay    │                    │
│  │  Fetch()      │  │  on 402      │                    │
│  └───────┬───────┘  └──────────────┘                    │
│          │                                              │
│  ┌───────▼───────┐                                      │
│  │ EnclaveAccount│  Signs payments inside TEE            │
│  └───────┬───────┘                                      │
└──────────│──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────┐
│  Treza Platform  │────▶│  Facilitator     │────▶│ Base │
│  withX402Payment │     │  (Coinbase/x402) │     │  L2  │
│  402 → verify →  │     │  verify + settle │     │ USDC │
│  respond + settle│     │                  │     │      │
└──────────────────┘     └──────────────────┘     └──────┘
```

## FAQ

**Do I need USDC to use Treza?**
Only if x402 is enabled on the endpoint you're calling. During development and on testnet, x402 is disabled by default.

**Which network are payments on?**
Base (Coinbase L2). Testnet uses Base Sepolia, mainnet uses Base mainnet. Both settle in USDC.

**Can I use a regular wallet instead of an enclave?**
Yes. Any viem-compatible account or x402 client works. The enclave-as-wallet pattern is optional — it just adds the security of TEE-based key management.

**How much do API calls cost?**
Attestation retrieval is $0.001 per call. Full verification is $0.01 per call. Prices are configurable per endpoint.

**Is there a minimum balance?**
No minimum. You just need enough USDC in your wallet to cover the call price.

## Related

- [x402 Protocol Documentation](https://docs.cdp.coinbase.com/x402/welcome)
- [x402 Bazaar](https://docs.cdp.coinbase.com/x402/bazaar)
- [Coinbase Payments MCP](https://docs.cdp.coinbase.com/payments-mcp/welcome)
- [Treza SDK README](https://github.com/treza-labs/treza-sdk)
- [Agent Commerce Guide](https://github.com/treza-labs/treza-sdk/blob/main/docs/AGENT_COMMERCE_GUIDE.md)
