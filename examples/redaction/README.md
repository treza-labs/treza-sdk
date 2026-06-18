# PII Redaction Examples

Programmatic PII redaction with `@treza/sdk` — the alternative to routing your
traffic through a hosted Treza redaction proxy.

## Prerequisites

Create a Treza API key at **app.trezalabs.com → Platform → API Keys** with the
scope each example needs:

| Example | Scope | What it does |
|---|---|---|
| [`redact-text.ts`](./redact-text.ts) | `redact:run` | Redact PII from a string; get back redacted text + detected entities |
| [`proxy-chat.ts`](./proxy-chat.ts) | `redact:proxy` | OpenAI-compatible chat completions with PII redacted before forwarding upstream |

## Run

```bash
# Direct redaction
TREZA_API_KEY=treza_live_... \
  npx tsx examples/redaction/redact-text.ts "Email john@example.com about AC-99821"

# Redaction proxy (needs an upstream key or a configured proxy id)
TREZA_API_KEY=treza_live_... OPENAI_API_KEY=sk-... \
  npx tsx examples/redaction/proxy-chat.ts
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `TREZA_API_KEY` | yes | API key (`treza_live_...`) with the matching `redact:*` scope |
| `TREZA_BASE_URL` | no | API base URL (defaults to `https://app.trezalabs.com`) |
| `OPENAI_API_KEY` | proxy only | Upstream provider key, used as `modelKey` |
| `TREZA_PROXY_ID` | proxy only | A configured proxy id (alternative to passing `modelKey`) |

See the SDK reference for `redactText`, `redactChatCompletions`,
`getRedactionLog`, and `getRedactionAttestation`.
