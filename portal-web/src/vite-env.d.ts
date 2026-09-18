/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MT_DASHBOARD_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
