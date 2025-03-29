/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_CANISTER_ID_BACKEND: string;
  readonly VITE_CANISTER_ID_INTERNET_IDENTITY: string;
  readonly VITE_DFX_NETWORK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
