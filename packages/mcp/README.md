# @treza/mcp

[![npm version](https://badge.fury.io/js/%40treza%2Fmcp.svg)](https://badge.fury.io/js/%40treza%2Fmcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Model Context Protocol (MCP) server for Treza Enclaves. Lets AI agents manage hardware-isolated TEEs, verify cryptographic attestations, and interact with the Treza platform — all through natural tool calls.

## Quick Start

### With Claude Desktop / Cursor / Any MCP Client

Add to your MCP configuration:

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

### As a Standalone Server

```bash
npm install -g @treza/mcp
treza-mcp
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TREZA_BASE_URL` | `https://app.trezalabs.com` | Treza Platform API URL |
| `TREZA_TIMEOUT` | `30000` | Request timeout in milliseconds |

## Available Tools

### Enclave Management

| Tool | Description |
|---|---|
| `treza_list_enclaves` | List all enclaves owned by a wallet address |
| `treza_get_enclave` | Get detailed info about a specific enclave |
| `treza_create_enclave` | Create a new AWS Nitro Enclave with hardware-isolated TEE |
| `treza_update_enclave` | Update enclave name, description, or config |
| `treza_delete_enclave` | Permanently delete a terminated enclave |
| `treza_enclave_action` | Pause, resume, or terminate an enclave |
| `treza_get_enclave_logs` | Retrieve logs filtered by source type |

### Attestation & Verification

| Tool | Description |
|---|---|
| `treza_get_attestation` | Get attestation document with PCR measurements and certificate chain |
| `treza_verify_attestation` | Full cryptographic verification with compliance checks (SOC2, HIPAA, FIPS) |
| `treza_get_verification_status` | Quick trust level check |

### Platform

| Tool | Description |
|---|---|
| `treza_list_providers` | List available enclave providers and regions |
| `treza_get_provider` | Get provider details and config schema |
| `treza_list_tasks` | List scheduled tasks |
| `treza_create_task` | Create a cron-scheduled task in an enclave |
| `treza_list_api_keys` | List scoped API keys |
| `treza_create_api_key` | Create a new API key with specific permissions |

## MCP Resources

The server also exposes browsable resources that give agents ambient context:

| Resource URI | Description |
|---|---|
| `treza://enclaves/{walletAddress}` | All enclaves for a wallet |
| `treza://enclaves/{enclaveId}/details` | Full enclave details |
| `treza://enclaves/{enclaveId}/attestation` | Attestation document |
| `treza://enclaves/{enclaveId}/verification` | Verification status |

## Example Agent Interactions

An AI agent using the Treza MCP server can:

```
"Create me a Nitro Enclave in us-west-2 for my trading bot"
→ treza_create_enclave

"Is my enclave verified? What's the trust level?"
→ treza_verify_attestation

"Show me the last 20 error logs from my enclave"
→ treza_get_enclave_logs

"Pause my enclave to save costs while I'm not using it"
→ treza_enclave_action (pause)
```

## Architecture

```
AI Agent (Claude, Cursor, etc.)
    │
    ▼
┌──────────────┐
│  @treza/mcp  │  ← MCP Server (this package)
│  16 tools    │
│  4 resources │
└──────┬───────┘
       │ HTTP
       ▼
┌──────────────────┐
│  Treza Platform  │  ← https://app.trezalabs.com
│  REST API        │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  AWS Nitro       │  ← Hardware-isolated TEEs
│  Enclaves        │
└──────────────────┘
```

## Development

```bash
git clone https://github.com/treza-labs/treza-sdk.git
cd treza-sdk/packages/mcp
npm install
npm run build
npm start
```

## Related

- [@treza/sdk](https://www.npmjs.com/package/@treza/sdk) — Core SDK
- [Treza Platform](https://app.trezalabs.com) — Web dashboard
- [OpenAPI Spec](https://app.trezalabs.com/.well-known/openapi.json) — Full API schema
- [Agent Manifest](https://app.trezalabs.com/.well-known/ai-plugin.json) — Machine-readable capabilities

## License

MIT
