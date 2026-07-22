/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_GEMINI_API_KEY?: string
  readonly MAIN_VITE_DEEPSEEK_API_KEY?: string
  readonly MAIN_VITE_GROQ_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
