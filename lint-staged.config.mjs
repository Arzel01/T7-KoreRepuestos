// ----------------------------------------------------------------------------
// lint-staged · configuración programática
// ----------------------------------------------------------------------------
// Se usa formato `.mjs` (en lugar de JSON) para poder filtrar archivos
// que están en `ignorePatterns` del .eslintrc.json (p.ej. *.config.js,
// vite.config.ts, *.eslintrc.json) antes de pasárselos a ESLint.
//
// Motivación: ESLint 8.x no expone el flag `--no-warn-ignored`. Si lint-staged
// le entrega un archivo ignorado, ESLint emite warning "File ignored because of
// a matching ignore pattern" → falla con --max-warnings=0 → bloquea el commit.
//
// La función devuelta por cada patrón recibe la lista de archivos staged
// que matchean el glob; devuelve el array de comandos a ejecutar.
// ----------------------------------------------------------------------------

/** Regex de archivos que ESLint ignora — debe coincidir con los `ignores` de eslint.config.mjs. */
const IGNORED_BY_ESLINT = /\.config\.(?:js|cjs)$/i;

/** Quita rutas (separador OS) y devuelve cita simple para shell. */
const escape = (file) => `"${file}"`;

/** Filtra archivos ignorados por ESLint y construye el comando, o vacía la cola. */
function eslintCmd(files) {
  const filtered = files.filter((f) => !IGNORED_BY_ESLINT.test(f));
  if (filtered.length === 0) return [];
  return [`eslint --fix --max-warnings=0 ${filtered.map(escape).join(' ')}`];
}

function prettierCmd(files) {
  if (files.length === 0) return [];
  return [`prettier --write ${files.map(escape).join(' ')}`];
}

export default {
  '*.{ts,tsx,js,jsx,cjs,mjs}': (files) => [...eslintCmd(files), ...prettierCmd(files)],
  '*.{json,md,yml,yaml,html,css}': (files) => prettierCmd(files),
};
