import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// The real SDK source lives at the repo-root `src/` (TrezaClient, KYC, signing,
// x402, PII redaction). packages/core is the npm package that owns the
// `@treza/sdk` name, so it builds and publishes that source directly.
const INPUT = '../../src/index.ts';

// Runtime dependencies and optional peer deps are kept external rather than
// bundled. `ethers`/`axios` are declared dependencies; the `@x402/*` packages
// and `viem` are optional (loaded via dynamic import) and declared as peers.
const external = (id) =>
  ['ethers', 'axios', '@zkpassport/sdk', 'viem'].includes(id) ||
  id.startsWith('@x402/');

export default [
  // Main build
  {
    input: INPUT,
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
        exports: 'named',
      },
    ],
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
    external,
  },
  // Type definitions
  {
    input: INPUT,
    output: {
      file: pkg.types,
      format: 'esm',
    },
    plugins: [dts()],
    external,
  },
];
