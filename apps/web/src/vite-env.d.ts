/// <reference types="vite/client" />

/**
 * Declaración de tipos para variables de entorno expuestas por Vite.
 *
 * Vite solo expone al cliente las variables prefijadas con `VITE_`.
 * Tipar `ImportMetaEnv` aquí da autocompletado e impide referencias a
 * variables inexistentes en tiempo de compilación.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
