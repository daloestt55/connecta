/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DEV_MODE: string
  readonly VITE_USE_MOCK_SERVER: string
  readonly VITE_TELEGRAM_BUG_BOT_TOKEN: string
  readonly VITE_TELEGRAM_BUG_CHAT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
