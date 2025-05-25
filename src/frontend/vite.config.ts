import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactScan from '@react-scan/vite-plugin-react-scan';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { config as dotenvConfig } from 'dotenv';
import tailwindcss from '@tailwindcss/vite';

const dfxEnvList = dotenvConfig({ path: '../../.env' }).parsed || {};
const DFX_NETWORK = dfxEnvList.DFX_NETWORK;

const { version } = JSON.parse(readFileSync('../../package.json').toString());
const lastCommitShortSha = execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

// Set environment variables
process.env.VITE_APP_VERSION = `v${version}+${lastCommitShortSha}`;
// avoid injecting the canister id unless we are running locally
process.env.VITE_CANISTER_ID =
  DFX_NETWORK === 'local'
    ? dfxEnvList.CANISTER_ID || dfxEnvList.CANISTER_ID_BACKEND
    : '';
process.env.VITE_CANISTER_ID_INTERNET_IDENTITY =
  dfxEnvList.CANISTER_ID_INTERNET_IDENTITY;
process.env.VITE_DFX_NETWORK = DFX_NETWORK;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    reactScan(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  // from https://github.com/vitejs/vite/issues/1973#issuecomment-787571499
  define: {
    'process.env': {
      DFX_NETWORK,
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4943',
        changeOrigin: true,
      },
    },
  },
});
