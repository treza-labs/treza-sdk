/**
 * Example: Redact PII from text with the Treza SDK.
 *
 * This is the programmatic alternative to routing traffic through a hosted
 * redaction proxy: you redact the text yourself and then do whatever you want
 * with the result (send it to your own LLM, store it, log it, ...).
 *
 * Prerequisites:
 *   - A Treza API key (treza_live_...) with the `redact:run` permission.
 *     Create one at app.trezalabs.com → Platform → API Keys.
 *
 * Run it:
 *   TREZA_API_KEY=treza_live_... npx tsx examples/redaction/redact-text.ts \
 *     "Email john@example.com about invoice AC-99821 (cell 212-555-0199)"
 */

import { TrezaClient, TrezaSdkError } from '../../src';

async function main() {
  const apiKey = process.env.TREZA_API_KEY;
  if (!apiKey) {
    console.error('❌ Set TREZA_API_KEY (treza_live_... with the redact:run scope).');
    process.exit(1);
  }

  const text =
    process.argv.slice(2).join(' ') ||
    'Customer Sarah Chen (sarah.chen@contoso.com, 212-555-0199) asked about refund AC-99821.';

  const client = new TrezaClient({
    apiKey,
    baseUrl: process.env.TREZA_BASE_URL, // optional; defaults to https://app.trezalabs.com
  });

  console.log('🔧 Input:');
  console.log('  ', text);
  console.log();

  try {
    const result = await client.redactText(text);

    console.log('🔒 Redacted:');
    console.log('  ', result.redacted);
    console.log();

    console.log(`🏷️  Detected ${result.entities.length} entit${result.entities.length === 1 ? 'y' : 'ies'}:`);
    for (const e of result.entities) {
      console.log(`   - ${e.type} → ${e.placeholder}  (offset ${e.start}-${e.end})`);
    }
    console.log();

    console.log('📋 Metadata:');
    console.log('   mode:        ', result.mode); // 'standard' | 'tee'
    console.log('   requestId:   ', result.requestId);
    console.log('   modelVersion:', result.modelVersion);
    if (result.attestation) {
      console.log('   attestation: ', JSON.stringify(result.attestation));
    }
  } catch (error) {
    if (error instanceof TrezaSdkError) {
      console.error('❌ Redaction error:', {
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
