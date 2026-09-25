/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENROUTER_API_KEY: string
  readonly VITE_OPENROUTER_API_MODEL: string
  readonly VITE_MAGNIFIC_ENABLED: string
  readonly VITE_MAGNIFIC_WEBHOOK_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
