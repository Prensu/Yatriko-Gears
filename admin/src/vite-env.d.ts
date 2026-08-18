/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full API base URL including /api/v1. Empty in dev — the Vite proxy handles it. */
  readonly VITE_API_BASE_URL?: string
  /** Public site origin for the "View public site" link. */
  readonly VITE_PUBLIC_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.svg" {
  const src: string
  export default src
}
