/**
 * Example: OpenAI-compatible chat completions with PII redacted before the
 * prompt reaches your model provider.
 *
 * Message content is run through the Treza redaction pipeline, forwarded to the
 * upstream provider, and the upstream response is returned verbatim. Pass
 * `rehydrate: true` to get a placeholder → original map back so you can restore
 * values in the response client-side.
 *
 * Prerequisites:
 *   - A Treza API key (treza_live_...) with the `redact:proxy` permission.
 *   - Either an upstream provider key (passed as `modelKey`) or a configured
 *     proxy id (passed as `proxyId`) that already stores an upstream key.
 *
 * Run it:
 *   TREZA_API_KEY=treza_live_... OPENAI_API_KEY=sk-... \
 *     npx tsx examples/redaction/proxy-chat.ts
 */

import { TrezaClient, TrezaSdkError } from '../../src';

async function main() {
  const apiKey = process.env.TREZA_API_KEY;
  if (!apiKey) {
    console.error('❌ Set TREZA_API_KEY (treza_live_... with the redact:proxy scope).');
    process.exit(1);
  }

  const modelKey = process.env.OPENAI_API_KEY;
  const proxyId = process.env.TREZA_PROXY_ID;
  if (!modelKey && !proxyId) {
    console.error('❌ Set OPENAI_API_KEY (upstream key) or TREZA_PROXY_ID (a configured proxy).');
    process.exit(1);
  }

  const client = new TrezaClient({ apiKey, baseUrl: process.env.TREZA_BASE_URL });

  try {
    const response = await client.redactChatCompletions(
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content:
              'Draft a one-line reply to sarah.chen@contoso.com about order AC-99821.',
          },
        ],
      },
      {
        ...(modelKey ? { modelKey } : {}),
        ...(proxyId ? { proxyId } : {}),
        rehydrate: true,
      }
    );

    console.log('🤖 Upstream response:');
    console.log('  ', response.data?.choices?.[0]?.message?.content ?? response.data);
    console.log();
    console.log('📋 Treza metadata:');
    console.log('   requestId:', response.requestId);
    console.log('   mode:     ', response.mode); // 'standard' | 'tee'
    if (response.rehydration) {
      console.log('   rehydration map:', JSON.stringify(response.rehydration));
      console.log('   (restore placeholders in the response against accumulated text)');
    }
  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Proxy error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });
    } else {
      console.error('❌ Unexpected error:', error);
    }
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('\n✅ Done.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
