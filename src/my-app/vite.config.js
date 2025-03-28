import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import childProcess from 'node:child_process';
import tailwindcss from 'tailwindcss';
import dotenv from 'dotenv';

const dfxEnvList = dotenv.config({ path: '../../.env' }).parsed || {};
const DFX_NETWORK = dfxEnvList.DFX_NETWORK;

const { version } = JSON.parse(readFileSync('./package.json').toString());
const lastCommitShortSha = childProcess
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

// Set environment variables
process.env.VITE_APP_VERSION = `v${version}+${lastCommitShortSha}`;
process.env.VITE_CANISTER_ID =
  dfxEnvList.CANISTER_ID || dfxEnvList.CANISTER_ID_BACKEND;
process.env.VITE_CANISTER_ID_INTERNET_IDENTITY =
  dfxEnvList.CANISTER_ID_INTERNET_IDENTITY;
process.env.VITE_DFX_NETWORK = DFX_NETWORK;
process.env.DFX_NETWORK = DFX_NETWORK;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
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
    'process.env': {},
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
