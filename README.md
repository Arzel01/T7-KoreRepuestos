# Kore Repuestos

Sistema de gestión de repuestos automotrices, catálogos y cálculo automatizado
de planes de mantenimiento.

## Arquitectura

Monorepo con tres aplicaciones y un paquete compartido:

| Paquete           | Stack                                   | Descripción                            |
| ----------------- | --------------------------------------- | -------------------------------------- |
| `apps/backend`    | Node.js · NestJS · TypeORM · TypeScript | API REST y lógica de dominio           |
| `apps/web`        | React · Vite · TailwindCSS · Shadcn/ui  | Panel administrativo y portal cliente  |
| `apps/mobile`     | React Native · TypeScript               | App para clientes / asesores (planned) |
| `packages/shared` | TypeScript                              | DTOs, enums, interfaces y validaciones |

## Requisitos previos

| Herramienta    | Versión mínima | Descarga                                       |
| -------------- | -------------- | ---------------------------------------------- |
| Node.js        | >= 22.13.x     | https://nodejs.org                             |
| pnpm           | >= 11.x        | `npm install -g pnpm`                          |
| Docker Desktop | >= 4.x         | https://www.docker.com/products/docker-desktop |
| Git            | >= 2.40        | https://git-scm.com                            |

Verificar versiones instaladas:

```powershell
node --version   # v22.13.x+
pnpm --version   # 11.x+
docker --version # 4.x+
git --version    # 2.40+
```

## Puesta en marcha

> PowerShell desde la raíz del proyecto.

### 1. Instalar dependencias

```powershell
pnpm install
```

### 2. Configurar variables de entorno

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/web/.env.example     apps/web/.env
```

Abre `apps/backend/.env` y completa los valores obligatorios:

**JWT Secrets** — ejecuta este comando **dos veces** y pega cada resultado en `JWT_SECRET` y `JWT_REFRESH_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Base de datos (Supabase)** — obtén la cadena de conexión en:
`Supabase Dashboard → Project Settings → Database → Connection string → URI`

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### 3. Compilar el paquete compartido

El backend consume `@kore/shared` ya compilado, por lo que es necesario al clonar
el repo o tras modificar `packages/shared` (el frontend lo lee directo del código
fuente, no requiere este paso):

```powershell
pnpm build:shared
```

### 4. Ejecutar migraciones

> Requiere `DATABASE_URL` configurado en el paso 2. Solo la primera vez
> (o cuando existan migraciones nuevas).

```powershell
pnpm --filter @kore/backend migration:run
```

### 5. Levantar servidores de desarrollo

**Terminal 1 — Backend:**

```powershell
pnpm dev:backend
```

**Terminal 2 — Frontend:**

```powershell
pnpm dev:web
```

| Servicio | URL                          |
| -------- | ---------------------------- |
| API      | http://localhost:3000/api/v1 |
| Swagger  | http://localhost:3000/docs   |
| Web      | http://localhost:5173        |

## Herramientas opcionales

**pgAdmin** (inspección visual de la base de datos):

```powershell
# Levantar en http://localhost:5050
docker compose --profile tools up -d

# Detener
docker compose down
```

Conectar usando los datos de `Supabase Dashboard → Project Settings → Database → Connection info`.

## Comandos útiles

```powershell
# Linting y formato
pnpm lint           # ESLint + fix automático
pnpm format         # Prettier

# Tests
pnpm test                                    # Todos
pnpm --filter @kore/backend test:watch       # Backend en watch
pnpm --filter @kore/web     test:watch       # Web en watch

# Base de datos
pnpm --filter @kore/backend migration:generate src/database/migrations/NombreMigracion
pnpm --filter @kore/backend migration:run
pnpm --filter @kore/backend migration:revert

# Type checking
pnpm typecheck
```

## Documentación

- [Estrategia de ramificación (GitFlow)](./docs/GITFLOW.md)
- [Convención de commits](./docs/CONVENTIONAL_COMMITS.md)
- [Contexto del proyecto](./CONTEXT.md)

## Patrones de diseño aplicados

- **Repository** — abstrae el acceso a datos vía `IRepository<T>`.
- **Strategy** — algoritmos intercambiables para el cálculo de planes de mantenimiento.
- **Observer** — notificaciones de stock bajo, vencimientos de mantenimiento.
- **Builder** — construcción incremental de cotizaciones y planes.
