import type { NextConfig } from 'next';
import dotenv from 'dotenv';
import * as fs from 'fs';

const dfxEnvList = dotenv.config({ path: '../../.env' }).parsed || {};

const { version } = JSON.parse(fs.readFileSync('./package.json').toString());

const nextConfig: NextConfig = {
  env: {
    DFX_NETWORK: dfxEnvList.DFX_NETWORK,
    CANISTER_ID_BACKEND: dfxEnvList.CANISTER_ID_BACKEND,
    NEXT_PUBLIC_VERSION: version,
    NEXT_PUBLIC_IC_HOST:
      dfxEnvList.DFX_NETWORK === 'ic'
        ? 'https://icp-api.io'
        : 'http://127.0.0.1:4943',
  },
  output: 'export',
  images: {
    unoptimized: true,
  },
  staticPageGenerationTimeout: 10000,
  // rewrites are needed just in the dev server
  rewrites: async () => [
    {
      source: '/api/:path*',
      destination: 'http://127.0.0.1:4943/api/:path*',
    },
  ],
};

export default nextConfig;
