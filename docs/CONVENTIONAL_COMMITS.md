# Convención de Commits — Conventional Commits 1.0.0

Esta guía define el formato **obligatorio** de todos los mensajes de commit
y títulos de Pull Request en Kore Repuestos. El objetivo es generar
changelogs automáticos, disparar releases por SemVer y mantener un historial
legible para todo el equipo.

---

## 1. Formato general

```
<tipo>(<scope opcional>): <descripción imperativa>

<cuerpo opcional, explicando el QUÉ y el POR QUÉ>

<footer opcional: BREAKING CHANGE, refs a tickets, co-autores>
```

Reglas estrictas:

- **Asunto en minúsculas**, sin punto final, máximo **72 caracteres**.
- **Verbo en imperativo presente**: `add`, `fix`, `remove`, `update` — NO
  `added`, `fixing`.
- El **cuerpo** se separa del asunto por una línea en blanco.
- El **footer** se separa del cuerpo por otra línea en blanco.

---

## 2. Tipos permitidos

| Tipo       | Cuándo usarlo                                                      | Impacto en SemVer |
| ---------- | ------------------------------------------------------------------ | ----------------- |
| `feat`     | Nueva funcionalidad visible para el usuario o consumidor de la API | MINOR             |
| `fix`      | Corrección de bug                                                  | PATCH             |
| `perf`     | Mejora de rendimiento sin cambiar comportamiento                   | PATCH             |
| `refactor` | Refactor interno sin cambiar API ni comportamiento observable      | —                 |
| `docs`     | Cambios únicamente en documentación                                | —                 |
| `style`    | Formato, espacios, comas — sin cambio lógico                       | —                 |
| `test`     | Añadir o corregir tests                                            | —                 |
| `build`    | Cambios en build system, dependencias, scripts de empaquetado      | —                 |
| `ci`       | Cambios en pipelines de CI/CD                                      | —                 |
| `chore`    | Tareas de mantenimiento que no encajan en otras categorías         | —                 |
| `revert`   | Revertir un commit anterior (referenciar SHA en cuerpo)            | depende           |

Un commit con `BREAKING CHANGE:` en el footer o `!` después del tipo
(`feat!:`) implica **MAJOR**.

---

## 3. Scopes recomendados

Usar el scope para indicar el módulo o paquete afectado:

`auth`, `users`, `products`, `categories`, `vehicles`, `maintenance`,
`compatibility`, `inventory`, `backend`, `web`, `mobile`, `shared`,
`db`, `deps`, `ci`, `docker`.

---

## 4. Ejemplos

### Feature simple

```
feat(maintenance): añadir cálculo automático de plan por kilometraje
```

### Fix con detalle

```
fix(auth): rechazar token JWT cuando el usuario está inactivo

El guard de roles no estaba consultando `is_active`, lo que permitía
sesiones vivas tras desactivar un asesor. Se añade el check en
JwtAuthGuard antes de validar el rol.

Refs: KORE-188
```

### Breaking change

```
feat(products)!: migrar SKU a UUID v7 y eliminar campo legacy_id

BREAKING CHANGE: el campo `legacy_id` desaparece del endpoint
GET /products/:id. Los clientes deben usar `id` (UUID).
```

### Refactor sin cambio visible

```
refactor(backend): extraer BaseRepository a common/repositories
```

### Chore con scope `deps`

```
chore(deps): actualizar nestjs a 10.4.0 y typeorm a 0.3.20
```

### Revert

```
revert: feat(maintenance): añadir cálculo automático de plan

Reverts 7a3b9c1. Causaba timeout en vehículos sin historial.
Refs: KORE-201
```

---

## 5. Validación automática

Para evitar commits mal formados, instalar **commitlint** + **husky** en
la raíz del monorepo:

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional husky
npx husky install
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

`.commitlintrc.json`:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "scope-enum": [
      2,
      "always",
      [
        "auth", "users", "products", "categories", "vehicles", "maintenance",
        "compatibility", "inventory", "backend", "web", "mobile", "shared",
        "db", "deps", "ci", "docker"
      ]
    ],
    "subject-case": [2, "never", ["upper-case", "pascal-case", "start-case"]],
    "header-max-length": [2, "always", 72]
  }
}
```

---

## 6. Anti-patrones (NO hacer)

| ❌ Mal                              | ✅ Bien                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| `arreglo bug`                       | `fix(auth): corregir expiración de refresh token`        |
| `WIP`                               | (commit local, no se mergea — usar squash en el PR)      |
| `Update README`                     | `docs(readme): añadir instrucciones de docker compose`   |
| `feat: Cambios varios`              | un commit por cambio lógico                              |
| `feat(auth): Implementó el login.`  | sin mayúscula inicial, sin punto, en imperativo          |
