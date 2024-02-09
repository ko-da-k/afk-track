/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SLACK_USER_TOKEN: string
    // その他の環境変数...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
