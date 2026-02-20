#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TrezaClient } from './treza-client';
import { TOOL_DEFINITIONS } from './tools';
import { handleToolCall } from './handlers';
import { RESOURCE_TEMPLATES, handleResourceRead } from './resources';

const TREZA_BASE_URL = process.env.TREZA_BASE_URL || 'https://app.trezalabs.com';
const TREZA_TIMEOUT = parseInt(process.env.TREZA_TIMEOUT || '30000', 10);

const client = new TrezaClient({
  baseUrl: TREZA_BASE_URL,
  timeout: TREZA_TIMEOUT,
});

const server = new McpServer({
  name: 'treza-enclaves',
  version: '0.1.0',
});

// ─── Register Tools ─────────────────────────────────────────────────────────

for (const tool of TOOL_DEFINITIONS) {
  const shape = tool.schema.shape;
  server.tool(
    tool.name,
    tool.description,
    shape,
    async (args: Record<string, unknown>) => handleToolCall(client, tool.name, args),
  );
}

// ─── Register Resource Templates ────────────────────────────────────────────

for (const template of RESOURCE_TEMPLATES) {
  server.resource(
    template.name,
    template.uriTemplate,
    { description: template.description, mimeType: template.mimeType },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: template.mimeType,
          text: await handleResourceRead(client, uri.href),
        },
      ],
    }),
  );
}

// ─── Start ──────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Treza MCP server running (API: ${TREZA_BASE_URL})`);
}

main().catch((error) => {
  console.error('Failed to start Treza MCP server:', error);
  process.exit(1);
});
