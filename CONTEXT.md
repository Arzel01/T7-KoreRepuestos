# Kore Repuestos — Contexto del Proyecto

## Visión General

**Kore Repuestos** es un sistema integral de gestión de repuestos automotrices, catálogos y cálculo automatizado de planes de mantenimiento. Es una solución empresarial completa con API REST, panel administrativo web y app móvil.

- **Empresa**: Aniprotein
- **Repositorio**: Kore-Repuestos
- **Rama principal**: `main`
- **Rama de desarrollo**: `develop`
- **Rama actual**: `develop` (al momento de escribir este documento)

---

## Arquitectura del Monorepo

El proyecto utiliza **pnpm workspaces** para gestionar un monorepo con múltiples aplicaciones y un paquete compartido:

```
Kore-Repuestos/
├── apps/
│   ├── backend/      # API REST (NestJS)
│   ├── web/          # Panel web administrativo (React + Vite)
│   └── mobile/       # App móvil (React Native) — en desarrollo
├── packages/
│   └── shared/       # DTOs, enums, interfaces, validaciones
├── docs/             # Documentación del proyecto
├── pnpm-workspace.yaml
└── package.json (raíz)
```

### Configuración de pnpm

El workspace está configurado en `pnpm-workspace.yaml`:

- Incluye `apps/*` y `packages/*`
- Compilaciones nativas permitidas para: `@nestjs/core`, `bcrypt`, `esbuild`, `msw`, `unrs-resolver`

---

## Stack Tecnológico

### Backend (`apps/backend`)

| Layer                | Tecnología      | Versión                |
| -------------------- | --------------- | ---------------------- |
| **Runtime**          | Node.js         | >= 22.13.x             |
| **Framework**        | NestJS          | ^10.4.0                |
| **Database ORM**     | TypeORM         | ^0.3.20                |
| **Database**         | PostgreSQL      | 13+ (Docker)           |
| **Auth**             | JWT (Passport)  | passport-jwt ^4.0.1    |
| **Password Hashing** | bcrypt          | ^5.1.1                 |
| **Validation**       | class-validator | ^0.14.1                |
| **Docs API**         | Swagger/OpenAPI | @nestjs/swagger ^7.4.2 |
| **Security**         | Helmet          | ^7.2.0                 |
| **Testing**          | Jest            | ^29.7.0                |
| **Language**         | TypeScript      | ^5.6.3                 |

**Estructura de `src/`:**

```
src/
├── common/          # Filtros, decoradores, guards, interceptores compartidos
├── config/          # Configuración (TypeORM, env, constants)
├── modules/         # Módulos de negocio (users, products, maintenance, etc.)
└── main.ts         # Punto de entrada
```

**Scripts principales:**

```bash
pnpm dev:backend          # Modo desarrollo con watch
pnpm build:backend        # Compilar a JavaScript
pnpm start:prod          # Ejecutar en producción
pnpm lint                # Ejecutar ESLint con fix automático
pnpm test                # Tests unitarios con Jest
pnpm migration:generate  # Generar migraciones TypeORM
pnpm migration:run       # Ejecutar migraciones
```

**Endpoints:**

- API REST: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/docs`

---

### Frontend Web (`apps/web`)

| Layer             | Tecnología   | Versión    |
| ----------------- | ------------ | ---------- |
| **Runtime**       | Node.js      | >= 22.13.x |
| **Framework**     | React        | ^18.3.1    |
| **Build Tool**    | Vite         | ^5.4.8     |
| **Routing**       | React Router | ^6.27.0    |
| **Styling**       | TailwindCSS  | ^3.4.13    |
| **UI Components** | Shadcn/ui    | ^4.9.0     |
| **Icons**         | Lucide React | ^1.17.0    |
| **HTTP Client**   | Axios        | ^1.7.7     |
| **Testing**       | Vitest       | ^2.1.2     |
| **Language**      | TypeScript   | ^5.6.3     |

**Estructura de `src/`:**

```
src/
├── app/             # Layout raíz y configuración global
├── components/      # Componentes reutilizables (Shadcn/ui y custom)
├── features/        # Módulos de características (based on feature flags)
├── layouts/         # Layouts específicos (admin, public, etc.)
├── lib/             # Utilidades, helpers, API clients
├── router/          # Configuración de React Router
└── main.tsx        # Punto de entrada
```

**Scripts principales:**

```bash
pnpm dev:web        # Modo desarrollo con Vite HMR
pnpm build:web      # Build optimizado para producción
pnpm preview        # Preview del build
pnpm lint           # ESLint con fix automático
pnpm test           # Tests con Vitest
```

**Servidor de desarrollo:**

- Web: `http://localhost:5173`

**Patrones de UI:**

- Usar primero componentes de **Shadcn/ui** (via `pnpm dlx shadcn@latest add <component>` desde `apps/web`)
- Tailwind para customización
- Lucide React para iconos
- CVA (Class Variance Authority) para componentes complejos

---

### Paquete Compartido (`packages/shared`)

Contiene:

- **DTOs** — Data Transfer Objects para request/response
- **Enums** — Constantes de dominio (roles, estados, tipos)
- **Interfaces** — Contratos de tipos TypeScript
- **Validaciones** — Esquemas Zod o class-validator reutilizables

Usado por backend y frontend para sincronizar tipos y contratos.

---

## Requisitos del Sistema

| Herramienta        | Versión Mínima | Instalación                                |
| ------------------ | -------------- | ------------------------------------------ |
| **Node.js**        | >= 22.13.x     | https://nodejs.org                         |
| **pnpm**           | >= 11.x        | `npm install -g pnpm`                      |
| **Docker Desktop** | >= 4.x         | https://docker.com/products/docker-desktop |
| **Git**            | >= 2.40        | https://git-scm.com                        |

**Comando para verificar:**

```powershell
node --version        # v22.13.x+
pnpm --version       # 11.x+
docker --version     # 4.x+
git --version        # 2.40+
```

---

## Flujo de Desarrollo

### 1. Inicialización (Primera vez)

```powershell
# Clonar repo (si no lo tienes)
git clone <repo-url> && cd Kore-Repuestos

# Instalar dependencias
pnpm install

# Copiar archivos .env
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/web/.env.example apps/web/.env

# Generar JWT secrets en apps/backend/.env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Pegar resultado en JWT_SECRET y JWT_REFRESH_SECRET (dos veces)

# Iniciar Docker y PostgreSQL
docker compose up -d postgres

# Compilar backend (solo primera vez)
pnpm build:backend

# Ejecutar migraciones
pnpm --filter @kore/backend migration:run
```

### 2. Desarrollo Diario

**Terminal 1 — Backend:**

```powershell
pnpm dev:backend
# Escucha en http://localhost:3000/api/v1
# Swagger en http://localhost:3000/docs
```

**Terminal 2 — Frontend:**

```powershell
pnpm dev:web
# Escucha en http://localhost:5173
```

**Terminal 3 — (Opcional) Tests en watch:**

```powershell
# Backend
pnpm --filter @kore/backend test:watch

# Web
pnpm --filter @kore/web test:watch
```

### 3. Linting y Formatos

```powershell
# Lintear y corregir automáticamente (ambas apps)
pnpm lint

# ESLint v9 (migrado desde v8)
# Formato: eslint "src/**/*.{ts,tsx}" --fix
```

### 4. Tests

**Backend (Jest):**

```powershell
pnpm --filter @kore/backend test          # Run once
pnpm --filter @kore/backend test:watch    # Watch mode
pnpm --filter @kore/backend test:cov      # Con coverage
```

**Web (Vitest):**

```powershell
pnpm --filter @kore/web test              # Run once
pnpm --filter @kore/web test:watch        # Watch mode
```

---

## Convenciones de Código

### Commits

Seguir **Conventional Commits** ([docs/CONVENTIONAL_COMMITS.md](./docs/CONVENTIONAL_COMMITS.md)):

```
<type>(<scope>): <subject>

<body>
<footer>
```

**Tipos:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `perf`, `style`, `revert`

**Ejemplos:**

```
feat(auth): add JWT refresh token endpoint
fix(products): prevent duplicate entries on bulk import
refactor(web): restructure to feature-based architecture
```

**Importante:** ⚠️ Los commits **los hace el usuario**, no ejecutar `git commit` salvo que lo pida explícitamente.

### Ramificación (GitFlow)

Seguir **GitFlow** ([docs/GITFLOW.md](./docs/GITFLOW.md)):

- `main` — Producción (tags: vX.Y.Z)
- `develop` — Integración (rama base para PRs)
- `feature/*` — Nuevas features
- `hotfix/*` — Fixes críticos en producción
- `release/*` — Preparación de release

**Flujo típico:**

```powershell
# Crear feature desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nombre-feature

# ... hacer cambios, commits regulares ...

# Crear PR: feature/* → develop
# Después merge: develop → main + tag
```

### Estilos y Estándares

**TypeScript:**

- `strict: true` en `tsconfig.json`
- Tipos explícitos en parámetros públicos
- Evitar `any` — usar `unknown` si es necesario

**Backend (NestJS):**

- Estructura: Controllers → Services → Repositories
- Guard `JwtAuthGuard` para rutas autenticadas
- DTOs con `class-validator` para validación
- Swagger decorators para documentación de APIs

**Frontend (React):**

- Componentes funcionales con hooks
- Preferir Shadcn/ui para componentes
- Props interface bien tipificada
- Custom hooks en `lib/` para lógica reutilizable

---

## Patrones de Diseño Implementados

1. **Repository Pattern** — Abstracción de acceso a datos vía `IRepository<T>`
2. **Strategy Pattern** — Algoritmos intercambiables para cálculo de planes de mantenimiento
3. **Observer Pattern** — Notificaciones (stock bajo, vencimientos de mantenimiento)
4. **Builder Pattern** — Construcción incremental de cotizaciones y planes

---

## Variables de Entorno

### Backend (`apps/backend/.env`)

```
NODE_ENV=development
PORT=3000

# Supabase: Direct Connection (puerto 5432) — obligatorio para TypeORM/migraciones
# Obtener en: Supabase Dashboard → Project Settings → Database → Connection string → URI
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Supabase: Transaction Mode / pgBouncer (puerto 6543) — opcional, para producción serverless
DATABASE_TRANSACTION_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase: APIs — Dashboard → Project Settings → API
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # NUNCA exponer al cliente

JWT_SECRET=<64-hex-chars>
JWT_REFRESH_SECRET=<64-hex-chars>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

> **Nota:** Si `DATABASE_URL` está definida, `typeorm.config.ts` la usa con `ssl: { rejectUnauthorized: false }`.
> Si no está definida, cae al fallback de variables individuales `DB_HOST/PORT/USERNAME/PASSWORD/NAME` para desarrollo local sin Supabase.

### Web (`apps/web/.env`)

```
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Docker & Base de Datos

> **La base de datos es externa (Supabase).** Ya no se levanta un PostgreSQL local con Docker.
> Configura `DATABASE_URL` en `apps/backend/.env` con la cadena de conexión directa de Supabase.

**pgAdmin (opcional, solo herramienta de inspección):**

```powershell
# Levantar pgAdmin en http://localhost:5050
docker compose --profile tools up -d

# Detener
docker compose down
```

Conectar desde pgAdmin con los datos de:
`Supabase Dashboard → Project Settings → Database → Connection info`

**Migraciones TypeORM (contra Supabase):**

```powershell
# Generar nueva migración
pnpm --filter @kore/backend migration:generate src/database/migrations/AddNewTable

# Ejecutar pendientes (requiere DATABASE_URL en .env)
pnpm --filter @kore/backend migration:run

# Revertir última
pnpm --filter @kore/backend migration:revert
```

---

## Estructura de Módulos del Backend

El backend organiza funcionalidad en módulos NestJS dentro de `src/modules/`:

```
modules/
├── auth/             # Autenticación, JWT, refresh tokens
├── users/            # Gestión de usuarios
├── products/         # Catálogo de repuestos
├── inventory/        # Stock y movimientos
├── maintenance/      # Planes de mantenimiento
├── quotes/           # Cotizaciones
├── orders/           # Órdenes de compra
└── notifications/    # Sistema de notificaciones
```

Cada módulo sigue MVC:

- `*.controller.ts` — Endpoints HTTP
- `*.service.ts` — Lógica de negocio
- `*.repository.ts` — Acceso a datos (opcional)
- `*.entity.ts` — Modelos TypeORM
- `*.dto.ts` — Validación y transfer objects

---

## Estructura de Features del Frontend

El frontend organiza por features en `src/features/`:

```
features/
├── auth/             # Login, logout, register
├── dashboard/        # Panel principal
├── products/         # Catálogo y búsqueda
├── inventory/        # Gestión de stock
├── maintenance/      # Planes y calendarios
├── quotes/           # Generador de cotizaciones
├── orders/           # Gestión de órdenes
└── settings/         # Configuración de usuario
```

Cada feature contiene:

- `pages/` — Componentes de página
- `components/` — Componentes específicos de la feature
- `hooks/` — Custom hooks
- `services/` — Llamadas a API
- `types/` — Interfaces locales
- `index.ts` — Exports públicos

---

## Integración Continua / Deployment

_A configurar:_ GitHub Actions / GitLab CI para:

- Tests automáticos en PRs
- Linting y type checking
- Build de producción
- Deploy a staging/producción

---

## Estado Actual del Proyecto

### Cambios Pendientes

```
M apps/backend/tsconfig.json
```

### Commits Recientes

1. **feat(web)**: add Shadcn/ui components + fix TypeScript path resolution
2. **refactor(web)**: restructure to feature-based architecture + add Shadcn/ui
3. **fix(deps)**: add missing explicit deps required by pnpm isolation
4. **fix(ci)**: upgrade Node.js to v22 — required by pnpm@11.5.0
5. **feat**: migrate from npm to pnpm + ESLint v8 → v9

**Última actividad:** Migración a pnpm y ESLint v9, restructuración de web con feature-based architecture y adopción de Shadcn/ui.

---

## Recursos y Documentación

- **Gitflow:** [docs/GITFLOW.md](./docs/GITFLOW.md)
- **Commits:** [docs/CONVENTIONAL_COMMITS.md](./docs/CONVENTIONAL_COMMITS.md)
- **README:** [README.md](./README.md)

---

## Contacto y Roles

- **Email del Proyecto:** pasanteti@aniprotein.com
- **Developer:** arzel01 (git user)

---

## Checklist de Desarrollo

Antes de hacer un PR:

- [ ] Código compilado sin errores TypeScript
- [ ] Linting passou: `pnpm lint`
- [ ] Tests pasan: `pnpm test`
- [ ] Commits siguiendo Conventional Commits
- [ ] Branch naming: `feature/*`, `hotfix/*`, `release/*`
- [ ] Descripción clara de cambios en el commit message
- [ ] Si es feature: PR hacia `develop`
- [ ] Si es hotfix: PR hacia `main` + merge a `develop`

---

## Troubleshooting

### Error: "Cannot find module '@kore/shared'"

```powershell
# Limpiar y reinstalar
pnpm install
pnpm build:backend
```

### Error: "EADDRINUSE: address already in use :::3000"

```powershell
# Verificar qué proceso usa el puerto
netstat -ano | findstr :3000
# Terminar proceso: taskkill /PID <PID> /F
# O cambiar PORT en .env
```

### Base de datos no conecta

```powershell
# Verificar Docker
docker compose ps

# Logs de PostgreSQL
docker compose logs postgres

# Reiniciar
docker compose restart postgres
```

### "pnpm: command not found"

```powershell
npm install -g pnpm
pnpm --version
```

---

**Última actualización:** 2026-06-10
