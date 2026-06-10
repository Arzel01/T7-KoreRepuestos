# Kore Repuestos — Contexto del Proyecto

## Visión General

**Kore Repuestos** es un sistema integral de gestión de repuestos automotrices, catálogos y cálculo automatizado de planes de mantenimiento. Es una solución empresarial completa con API REST, panel administrativo web y app móvil.

- **Empresa**: Aniprotein
- **Repositorio**: Kore-Repuestos
- **Rama principal**: `main`
- **Rama de desarrollo**: `develop`

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
├── docker-compose.yml
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
| **Database**         | PostgreSQL      | 13+ (Supabase)         |
| **Auth**             | JWT (Passport)  | passport-jwt ^4.0.1    |
| **Password Hashing** | bcrypt          | ^5.1.1                 |
| **Validation**       | class-validator | ^0.14.1                |
| **Docs API**         | Swagger/OpenAPI | @nestjs/swagger ^7.4.2 |
| **Security**         | Helmet          | ^7.2.0                 |
| **Testing**          | Jest            | ^29.7.0                |
| **Language**         | TypeScript      | ^5.9.3                 |

**Estructura de `src/`:**

```
src/
├── common/          # Filtros, decoradores, guards, interceptores compartidos
├── config/          # Configuración (TypeORM, env, constants)
├── modules/         # Módulos de negocio (users, products, maintenance, etc.)
└── main.ts          # Punto de entrada
```

**Scripts principales:**

```powershell
pnpm dev:backend                                              # Modo desarrollo con watch
pnpm build:backend                                            # Compilar a JavaScript
pnpm --filter @kore/backend test                              # Tests unitarios
pnpm --filter @kore/backend migration:run                     # Ejecutar migraciones
pnpm --filter @kore/backend migration:generate src/db/Nombre  # Generar migración
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
| **Language**      | TypeScript   | ^5.9.3     |

**Estructura de `src/`:**

```
src/
├── components/      # Componentes reutilizables (Shadcn/ui y custom)
│   └── ui/          # Componentes Shadcn/ui generados
├── features/        # Módulos de características (feature-based)
│   ├── auth/
│   ├── dashboard/
│   ├── home/
│   └── products/
├── layouts/         # Layouts específicos (admin, public, etc.)
├── lib/             # Utilidades, helpers, API clients
├── router/          # Configuración de React Router
└── main.tsx         # Punto de entrada
```

**Scripts principales:**

```powershell
pnpm dev:web                          # Modo desarrollo con Vite HMR
pnpm build:web                        # Build optimizado para producción
pnpm --filter @kore/web test:watch    # Tests con Vitest en watch
```

**Servidor de desarrollo:** `http://localhost:5173`

**Patrones de UI:**

- Usar primero componentes de **Shadcn/ui**: `pnpm dlx shadcn@latest add <component>` desde `apps/web`
- Tailwind para customización adicional
- Lucide React para iconos
- CVA (Class Variance Authority) para variantes de componentes complejos

---

### Paquete Compartido (`packages/shared`)

Contiene:

- **DTOs** — Data Transfer Objects para request/response
- **Enums** — Constantes de dominio (roles, estados, tipos)
- **Interfaces** — Contratos de tipos TypeScript
- **Validaciones** — Esquemas con class-validator reutilizables

Usado por backend y frontend para sincronizar tipos y contratos de API.

---

## Requisitos del Sistema

| Herramienta        | Versión Mínima | Instalación                                |
| ------------------ | -------------- | ------------------------------------------ |
| **Node.js**        | >= 22.13.x     | https://nodejs.org                         |
| **pnpm**           | >= 11.x        | `npm install -g pnpm`                      |
| **Docker Desktop** | >= 4.x         | https://docker.com/products/docker-desktop |
| **Git**            | >= 2.40        | https://git-scm.com                        |

```powershell
node --version        # v22.13.x+
pnpm --version        # 11.x+
docker --version      # 4.x+
git --version         # 2.40+
```

---

## Flujo de Desarrollo

### 1. Inicialización (Primera vez)

```powershell
# Clonar repo
git clone <repo-url>
cd Kore-Repuestos

# Instalar dependencias
pnpm install

# Copiar archivos .env
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/web/.env.example     apps/web/.env
```

Edita `apps/backend/.env` y completa:

1. **`DATABASE_URL`** — obtén la cadena de conexión directa (puerto 5432) desde:
   `Supabase Dashboard → Project Settings → Database → Connection string → URI`

2. **`JWT_SECRET` y `JWT_REFRESH_SECRET`** — genera dos valores distintos:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

```powershell
# Compilar shared + backend (solo primera vez)
pnpm build:backend

# Ejecutar migraciones contra Supabase
pnpm --filter @kore/backend migration:run
```

### 2. Desarrollo Diario

**Terminal 1 — Backend:**

```powershell
pnpm dev:backend
# API en  http://localhost:3000/api/v1
# Swagger http://localhost:3000/docs
```

**Terminal 2 — Frontend:**

```powershell
pnpm dev:web
# Web en  http://localhost:5173
```

**Terminal 3 — Tests en watch (opcional):**

```powershell
pnpm --filter @kore/backend test:watch
pnpm --filter @kore/web     test:watch
```

### 3. Linting y Formato

```powershell
pnpm lint          # ESLint v9 con fix automático
pnpm format        # Prettier
pnpm typecheck     # TypeScript en todos los paquetes
```

### 4. Tests

**Backend (Jest):**

```powershell
pnpm --filter @kore/backend test        # Run once
pnpm --filter @kore/backend test:watch  # Watch mode
pnpm --filter @kore/backend test:cov    # Con coverage
```

**Web (Vitest):**

```powershell
pnpm --filter @kore/web test            # Run once
pnpm --filter @kore/web test:watch      # Watch mode
```

---

## Convenciones de Código

### Commits

Seguir **Conventional Commits** ([docs/CONVENTIONAL_COMMITS.md](./docs/CONVENTIONAL_COMMITS.md)):

```
<type>(<scope>): <subject>
```

**Tipos:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `perf`, `style`, `revert`

```
feat(auth): add JWT refresh token endpoint
fix(products): prevent duplicate entries on bulk import
refactor(web): restructure to feature-based architecture
```

> Los commits **los hace el usuario** — no ejecutar `git commit` salvo solicitud explícita.

### Ramificación (GitFlow)

Seguir **GitFlow** ([docs/GITFLOW.md](./docs/GITFLOW.md)):

- `main` — Producción (tags: vX.Y.Z)
- `develop` — Integración (rama base para PRs)
- `feature/*` — Nuevas features
- `hotfix/*` — Fixes críticos en producción
- `release/*` — Preparación de release

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/nombre-feature
# ... commits ...
# Abrir PR: feature/* → develop
```

### Estándares TypeScript

- `strict: true` en `tsconfig.json`
- Tipos explícitos en parámetros públicos
- Evitar `any` — usar `unknown` si es necesario
- Path alias `@/*` → `src/`

### Backend (NestJS)

- Estructura: Controllers → Services → Repositories
- `JwtAuthGuard` en rutas autenticadas (global por defecto, `@Public()` para excepciones)
- DTOs con `class-validator` para validación de entrada
- Swagger decorators en todos los controllers

### Frontend (React)

- Componentes funcionales con hooks
- **Shadcn/ui primero** — `pnpm dlx shadcn@latest add <component>` desde `apps/web`
- Props tipadas con `interface`
- Custom hooks en `lib/` para lógica reutilizable

---

## Patrones de Diseño Implementados

1. **Repository Pattern** — Abstracción de acceso a datos vía `IRepository<T>`
2. **Strategy Pattern** — Algoritmos intercambiables para cálculo de planes de mantenimiento
3. **Observer Pattern** — Notificaciones de stock bajo y vencimientos de mantenimiento
4. **Builder Pattern** — Construcción incremental de cotizaciones y planes

---

## Variables de Entorno

### Backend (`apps/backend/.env`)

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Supabase: Direct Connection (puerto 5432) — obligatorio para TypeORM/migraciones
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Supabase: Transaction Mode / pgBouncer (puerto 6543) — para producción serverless
DATABASE_TRANSACTION_URL=postgresql://...

# Supabase APIs — Dashboard → Project Settings → API
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # NUNCA exponer al cliente

JWT_SECRET=<64-hex-chars>
JWT_REFRESH_SECRET=<64-hex-chars>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=10
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
THROTTLE_TTL=60
THROTTLE_LIMIT=100
LOG_LEVEL=debug
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
```

> Si `DATABASE_URL` está definida, `typeorm.config.ts` la usa con SSL.
> Si no, cae al fallback de variables individuales `DB_HOST/PORT/USERNAME/PASSWORD/NAME`.

### Web (`apps/web/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## Docker & Base de Datos

> **La base de datos es externa (Supabase).** No se levanta PostgreSQL local con Docker.
> Configura `DATABASE_URL` en `apps/backend/.env` con la cadena de Supabase.

**pgAdmin (opcional):**

```powershell
# Levantar en http://localhost:5050
docker compose --profile tools up -d

# Detener
docker compose down
```

**Migraciones TypeORM:**

```powershell
pnpm --filter @kore/backend migration:generate src/database/migrations/NombreMigracion
pnpm --filter @kore/backend migration:run
pnpm --filter @kore/backend migration:revert
```

---

## Estructura de Módulos del Backend

```
src/modules/
├── auth/             # Autenticación, JWT, refresh tokens
├── users/            # Gestión de usuarios
├── products/         # Catálogo de repuestos
├── categories/       # Categorías de productos
├── inventory/        # Stock y movimientos (pendiente)
├── maintenance/      # Planes de mantenimiento (pendiente)
├── quotes/           # Cotizaciones (pendiente)
├── orders/           # Órdenes de compra (pendiente)
└── notifications/    # Sistema de notificaciones (pendiente)
```

Cada módulo sigue MVC:

- `*.controller.ts` — Endpoints HTTP + decoradores Swagger
- `*.service.ts` — Lógica de negocio
- `*.repository.ts` — Acceso a datos vía TypeORM
- `*.entity.ts` — Modelos TypeORM
- `dto/` — DTOs con class-validator

---

## Estructura de Features del Frontend

```
src/features/
├── auth/             # Login, logout, register
│   ├── components/
│   ├── hooks/        # AuthContext
│   └── server/       # auth.api.ts
├── dashboard/        # Panel principal
├── products/         # Catálogo y búsqueda
│   ├── components/
│   └── server/       # products.api.ts
├── home/
├── inventory/        # (pendiente)
├── maintenance/      # (pendiente)
├── quotes/           # (pendiente)
├── orders/           # (pendiente)
└── settings/         # (pendiente)
```

Cada feature contiene (según aplique):

- `components/` — Componentes de página y específicos de la feature
- `hooks/` — Custom hooks
- `server/` — Llamadas a la API (`*.api.ts`)
- `types/` — Interfaces locales

---

## Integración Continua

GitHub Actions configurado (`.github/workflows/`):

- Linting y type checking en PRs
- Build de producción
- Tests automáticos

Estado actual: **configurado y funcional** tras los fixes de CI en la rama `develop`.

---

## Estado Actual del Proyecto

### Git

- **Rama activa:** `develop`
- **Árbol de trabajo:** limpio (sin cambios pendientes)

### Commits Recientes

1. `fix(ci)`: resolve build and lint failures
2. `fix(ci)`: add Tailwind CSS-var color tokens + prettier single-quote config
3. `refactor(workspace)`: typescript/@types/node on root and fix pnpm-workspace
4. `feat(web)`: add Shadcn/ui components + fix TypeScript path resolution
5. `refactor(web)`: restructure to feature-based architecture + add Shadcn/ui

### Módulos Implementados

| Módulo     | Backend | Frontend |
| ---------- | ------- | -------- |
| Auth       | ✅      | ✅       |
| Users      | ✅      | —        |
| Products   | ✅      | ✅       |
| Categories | ✅      | —        |
| Inventory  | —       | —        |
| Quotes     | —       | —        |
| Orders     | —       | —        |

---

## Checklist de PR

- [ ] TypeScript compila sin errores: `pnpm typecheck`
- [ ] Linting pasa: `pnpm lint`
- [ ] Tests pasan: `pnpm test`
- [ ] Commits siguen Conventional Commits
- [ ] Branch: `feature/*`, `hotfix/*` o `release/*`
- [ ] PR hacia `develop` (o `main` si es hotfix)

---

## Troubleshooting

### "Cannot find module '@kore/shared'"

```powershell
pnpm install
pnpm build:backend
```

### "EADDRINUSE: address already in use :::3000"

```powershell
netstat -ano | findstr :3000
# taskkill /PID <PID> /F
```

### Base de datos no conecta

Verificar que `DATABASE_URL` en `apps/backend/.env` apunte a Supabase con el formato correcto:
`postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

### "pnpm: command not found"

```powershell
npm install -g pnpm
```

---

## Recursos

- **Gitflow:** [docs/GITFLOW.md](./docs/GITFLOW.md)
- **Commits:** [docs/CONVENTIONAL_COMMITS.md](./docs/CONVENTIONAL_COMMITS.md)
- **README:** [README.md](./README.md)

---

## Contacto

- **Email:** pasanteti@aniprotein.com
- **Developer:** arzel01

---

**Última actualización:** 2026-06-10
