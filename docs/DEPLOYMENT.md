# Guía de Despliegue — Kore Repuestos

Guía exhaustiva para instalar, configurar y desplegar el sistema completo: **backend** (API REST en
NestJS), **frontend web** (SPA en React/Vite) y su dependencia de **base de datos** (PostgreSQL
gestionado por Supabase). Cubre desde un entorno de desarrollo local en una máquina nueva hasta un
despliegue de producción en contenedores o en una plataforma serverless, pasando por CI/CD, checklist
de seguridad y resolución de problemas.

> Convención de esta guía: los bloques de comando usan sintaxis de **PowerShell** cuando el paso es
> específico de Windows (el entorno de desarrollo del equipo) y **bash** cuando el paso es agnóstico
> de sistema operativo (Docker, curl, CI en GitHub Actions con `ubuntu-latest`).

---

## Tabla de contenidos

1. [Visión general de la arquitectura](#1-visión-general-de-la-arquitectura)
2. [Requisitos previos](#2-requisitos-previos)
3. [Estructura del repositorio](#3-estructura-del-repositorio)
4. [Clonado e instalación de dependencias](#4-clonado-e-instalación-de-dependencias)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Base de datos: Supabase y migraciones](#6-base-de-datos-supabase-y-migraciones)
7. [Compilación (build)](#7-compilación-build)
8. [Ejecución en desarrollo](#8-ejecución-en-desarrollo)
9. [Despliegue en producción](#9-despliegue-en-producción)
10. [Integración continua (CI/CD)](#10-integración-continua-cicd)
11. [Health checks y monitoreo](#11-health-checks-y-monitoreo)
12. [Consideraciones de la PWA (service worker y push)](#12-consideraciones-de-la-pwa-service-worker-y-push)
13. [Verificación post-despliegue (smoke tests)](#13-verificación-post-despliegue-smoke-tests)
14. [Rollback](#14-rollback)
15. [Checklist de producción](#15-checklist-de-producción)
16. [Troubleshooting](#16-troubleshooting)
17. [Referencias](#17-referencias)

---

## 1. Visión general de la arquitectura

Kore Repuestos es un **monorepo pnpm** con tres aplicaciones desplegables y un paquete de tipos
compartido:

| Paquete           | Stack                                       | Rol en producción                                                      |
| ----------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/backend`    | Node.js 22 · NestJS 10 · TypeORM · Postgres | Proceso (o función serverless) que expone la API REST.                 |
| `apps/web`        | React 18 · Vite · TailwindCSS · Shadcn/ui   | Build estático (HTML/CSS/JS) servido por Nginx o un CDN.               |
| `apps/mobile`     | React Native                                | Planificada, sin pipeline de despliegue todavía.                       |
| `packages/shared` | TypeScript (DTOs, enums, validaciones)      | No se despliega: se **compila** y ambas apps lo consumen desde `dist`. |

**No hay base de datos autoalojada.** El sistema depende de un proyecto **Supabase** (PostgreSQL
gestionado) tanto en desarrollo como en producción — no existe un contenedor Postgres local en
`docker-compose.yml`; solo hay una herramienta auxiliar (pgAdmin) para inspeccionar esa base remota.
Esto significa que **desplegar el backend nunca implica desplegar una base de datos**: solo apuntar
la variable `DATABASE_URL` al proyecto Supabase correcto (desarrollo, staging o producción — normalmente
tres proyectos Supabase distintos).

Diagrama de alto nivel (ver también [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) para los diagramas
Mermaid completos, incluido el de infraestructura CI/CD):

```
Navegador ──HTTPS──▶ apps/web (Nginx / CDN, estático)
                          │  fetch/axios → /api/v1
                          ▼
                    apps/backend (NestJS, :3000)
                          │  TypeORM (pg driver, SSL)
                          ▼
                    Supabase (PostgreSQL + Storage)
```

El backend no depende de Redis, colas de mensajes, Elasticsearch ni Firebase — decisiones
documentadas explícitamente en los ADR del proyecto:

- Búsqueda: PostgreSQL Full-Text Search + `pg_trgm` — [ADR-0001](./adr/0001-search-engine-postgres-fts.md)
- Notificaciones: outbox en Postgres + cron in-process (`@nestjs/schedule`) — [ADR-0002](./adr/0002-notifications-postgres-outbox.md)
- PDF de cotizaciones: `pdfkit` en memoria, sin Chromium — [ADR-0003](./adr/0003-quotations-pdf-pdfkit.md)
- Framework backend: NestJS — [ADR-0004](./adr/0004-backend-framework-nestjs.md)
- Base de datos gestionada: Supabase — [ADR-0005](./adr/0005-database-hosting-supabase.md)

Esto simplifica mucho el despliegue: **el único servicio de infraestructura externo real es
Supabase.** Todo lo demás (backend, frontend, PDF, cron, búsqueda) corre dentro del propio proceso
Node del backend o como archivos estáticos.

---

## 2. Requisitos previos

| Herramienta         | Versión mínima | Por qué se necesita                                                                                                                                                  | Instalación                                     |
| ------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Node.js**         | ≥ 22.13.0      | Runtime de backend y de las herramientas de build del frontend.                                                                                                      | https://nodejs.org (usar la versión LTS "22.x") |
| **pnpm**            | ≥ 11.5.0       | Gestor de paquetes del monorepo (workspaces). El proyecto fija `packageManager: pnpm@11.5.0` en `package.json`, así que `corepack` puede instalar la versión exacta. | `npm install -g pnpm` o `corepack enable`       |
| **Git**             | ≥ 2.40         | Clonar el repositorio y flujo GitFlow.                                                                                                                               | https://git-scm.com                             |
| **Docker Desktop**  | ≥ 4.x          | Opcional en desarrollo (solo para pgAdmin); **obligatorio** si el despliegue objetivo es Docker Compose.                                                             | https://www.docker.com/products/docker-desktop  |
| **Cuenta Supabase** | —              | Provee el PostgreSQL gestionado (obligatorio en todos los entornos, incluido desarrollo local).                                                                      | https://supabase.com                            |

No se necesita instalar PostgreSQL localmente, ni Redis, ni ninguna otra base de datos: todo pasa por
Supabase.

Verificación de versiones instaladas:

```powershell
node --version    # debe imprimir v22.13.x o superior
pnpm --version    # 11.x o superior
docker --version  # 4.x o superior (solo si se usará Docker)
git --version     # 2.40 o superior
```

Si `pnpm` no está disponible, instálalo con `npm install -g pnpm`. Si prefieres no depender de una
instalación global, `corepack` (incluido en Node 22) puede activarlo automáticamente en base al campo
`packageManager` del `package.json` raíz — es lo que hacen los `Dockerfile` del proyecto
(`corepack enable && corepack prepare pnpm@latest --activate`).

### Cuenta de Supabase

1. Crea una cuenta gratuita en https://supabase.com.
2. Crea un **proyecto** por entorno que necesites (mínimo: uno para desarrollo/staging, otro para
   producción — no compartas el mismo proyecto entre ambos, para no mezclar datos de prueba con datos
   reales).
3. Anota la contraseña del usuario `postgres` que Supabase pide al crear el proyecto: la necesitarás
   para construir `DATABASE_URL` (no queda visible en texto plano después, solo se puede resetear).

---

## 3. Estructura del repositorio

```
Kore-Repuestos/
├── apps/
│   ├── backend/           # API REST — NestJS
│   │   ├── src/
│   │   │   ├── common/    # Guards, decoradores, filtros, pipes compartidos
│   │   │   ├── config/    # typeorm.config.ts y configuración de entorno
│   │   │   ├── database/
│   │   │   │   ├── migrations/   # Migraciones TypeORM (ver sección 6)
│   │   │   │   └── seeds/        # dev-seed.ts, vehicles-seed.ts
│   │   │   ├── modules/   # Un módulo NestJS por dominio de negocio
│   │   │   └── main.ts    # Bootstrap (Helmet, CORS, ValidationPipe, Swagger)
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── uploads/        # Imágenes subidas (gitignored, solo .gitkeep)
│   ├── web/                # SPA — React + Vite
│   │   ├── src/
│   │   │   ├── app/         # Páginas (rutas) públicas y de admin
│   │   │   ├── features/    # Módulos por feature (auth, cart, garage, etc.)
│   │   │   ├── components/  # Componentes reutilizables (incluye ui/ de Shadcn)
│   │   │   ├── layouts/
│   │   │   ├── router/      # AppRouter (React Router v6)
│   │   │   └── sw.ts        # Service worker (injectManifest de vite-plugin-pwa)
│   │   ├── nginx.conf       # Config Nginx usada por el Dockerfile de producción
│   │   ├── Dockerfile
│   │   └── .env.example
│   └── mobile/              # React Native (planificada)
├── packages/
│   └── shared/              # @kore/shared — DTOs, enums, validaciones compartidas
├── api/
│   └── index.ts             # Entry point serverless (Vercel) — reexporta el backend Nest
├── docker/
│   └── postgres/            # Artefactos de un Postgres local (no usado: ver sección 1)
├── docs/                    # Toda la documentación del proyecto (esta guía incluida)
├── .github/workflows/ci.yml # Pipeline de CI (lint, typecheck, tests, Sonar)
├── docker-compose.yml           # Herramientas de desarrollo (pgAdmin)
├── docker-compose.staging.yml   # Backend + web en contenedores (staging/prod-like)
├── vercel.json                  # Configuración de despliegue serverless
├── pnpm-workspace.yaml
└── package.json                 # Scripts raíz que orquestan todo el monorepo
```

Puntos clave para el despliegue:

- **`packages/shared` no es una app**: se compila a `packages/shared/dist` y tanto el backend como el
  build de producción del frontend lo importan desde ahí. El frontend en **modo desarrollo** lee
  directamente el código fuente TypeScript (alias en `vite.config.ts`), así que no requiere el build
  de `shared` para `pnpm dev:web` — pero sí lo requiere para `pnpm build:web`.
- **`api/index.ts`** es el único artefacto pensado específicamente para Vercel (funciones
  serverless); no se usa en el despliegue por Docker.
- **`docker/postgres/`** existe en el repo pero **no se usa** en el flujo actual (la base de datos es
  Supabase, externa) — no levantar un Postgres local a partir de esta carpeta, es vestigial.

---

## 4. Clonado e instalación de dependencias

```powershell
git clone <url-del-repositorio>
cd Kore-Repuestos

# Instala TODAS las dependencias del monorepo (backend, web, shared) de una vez.
# pnpm resuelve el workspace completo y crea los symlinks entre paquetes internos.
pnpm install
```

`pnpm install` respeta `pnpm-workspace.yaml` (incluye `apps/*` y `packages/*`) y las
`onlyBuiltDependencies` configuradas para permitir scripts de compilación nativa de paquetes que los
requieren: `@nestjs/core`, `bcrypt`, `esbuild`, `msw`, `unrs-resolver`. Si `pnpm install` se queda
"colgado" pidiendo aprobar builds, es por estos paquetes — aprueba la ejecución (`pnpm approve-builds`
si tu versión de pnpm lo requiere explícitamente).

En **CI y en los `Dockerfile`** se usa `pnpm install --frozen-lockfile`: falla si `pnpm-lock.yaml` no
coincide exactamente con los `package.json`, para garantizar reproducibilidad. Si modificas
dependencias, corre `pnpm install` normal localmente y **commitea el `pnpm-lock.yaml` actualizado**.

---

## 5. Variables de entorno

Cada app tiene su propio `.env.example` versionado en el repositorio, que sirve como plantilla y como
documentación. **Nunca** commitees un `.env` real con secretos.

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/web/.env.example     apps/web/.env
```

> En Linux/macOS: `cp apps/backend/.env.example apps/backend/.env`.
> Para un entorno de staging en Docker se usa además `apps/backend/.env.staging` (mismo formato,
> valores de ese entorno) — ver [9.2](#92-docker-compose-staging).

### 5.1 Backend (`apps/backend/.env`)

#### Servidor

| Variable       | Obligatoria | Default  | Descripción                                                                                                                                                   |
| -------------- | :---------: | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`     |     No      | —        | `development`, `production` o `test`. Afecta logging y algunos defaults de NestJS/TypeORM.                                                                    |
| `PORT`         |     No      | `3000`   | Puerto HTTP donde escucha el backend.                                                                                                                         |
| `API_PREFIX`   |     No      | `api/v1` | Prefijo global de todas las rutas (`app.setGlobalPrefix`). Cambiarlo rompe rutas hardcodeadas en el frontend si `VITE_API_BASE_URL` no se actualiza a la par. |
| `API_BASE_URL` |     No      | —        | URL pública base del backend; usada para construir enlaces absolutos (p. ej. en emails).                                                                      |

#### Base de datos (Supabase PostgreSQL)

| Variable                                                          | Obligatoria | Descripción                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------- | :---------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                    |   **Sí**    | Cadena de conexión completa. **Usar siempre la Direct Connection (puerto `5432`)**: TypeORM emite _prepared statements_, incompatibles con el modo Transaction/pgBouncer (puerto `6543`). Se obtiene en `Supabase Dashboard → Project Settings → Database → Connection string → URI`.              |
| `DATABASE_TRANSACTION_URL`                                        |     No      | Cadena alternativa en modo **Transaction / pgBouncer** (puerto `6543`). Pensada para runtimes serverless de vida corta (ver [9.3](#93-serverless-vercel)) — **no** usar para correr migraciones.                                                                                                   |
| `DB_LOGGING`                                                      |     No      | `true`/`false`. Loguea cada SQL ejecutado por TypeORM — útil en desarrollo, ruidoso y con costo en producción.                                                                                                                                                                                     |
| `DB_SYNCHRONIZE`                                                  |     No      | **Debe ser `false` en todo momento fuera de un experimento local descartable.** Si es `true`, TypeORM sincroniza el esquema automáticamente en cada arranque a partir de las entidades, sin pasar por migraciones — puede borrar o alterar columnas de forma destructiva.                          |
| `DB_SSL_REJECT_UNAUTHORIZED`                                      |     No      | `true` (default recomendado) valida el certificado TLS de Supabase. Ponerlo en `false` solo si el runtime no tiene CA certificates actualizados (p. ej. una imagen Alpine muy antigua) — es un downgrade de seguridad, documentarlo si se usa.                                                     |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` |     No      | Fallback si **no** se define `DATABASE_URL`: `typeorm.config.ts` arma la conexión a partir de estas variables individuales. Es el mecanismo que usa el job `test-backend` de CI, que levanta un Postgres efímero en Docker (ver [10](#10-integración-continua-cicd)) en vez de apuntar a Supabase. |

#### Supabase (APIs adicionales)

| Variable                    | Obligatoria | Descripción                                                                                                                                                              |
| --------------------------- | :---------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_URL`              |    No\*     | URL del proyecto (`Dashboard → Project Settings → API`).                                                                                                                 |
| `SUPABASE_ANON_KEY`         |    No\*     | Clave pública (anon), segura de exponer al cliente.                                                                                                                      |
| `SUPABASE_SERVICE_ROLE_KEY` |    No\*     | Clave con privilegios totales, **bypassa Row Level Security**. **NUNCA** debe llegar al navegador, a la app móvil ni a ningún log — solo la usa el backend, server-side. |

`*` No obligatorias para el flujo actual (el backend usa TypeORM directo sobre Postgres, no el SDK de
Supabase para CRUD), pero sí necesarias si en el futuro se usa Supabase Storage o Auth directamente.

#### JWT (autenticación)

| Variable                 | Obligatoria | Default | Descripción                                                                                                                                    |
| ------------------------ | :---------: | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`             |   **Sí**    | —       | Secreto para firmar el _access token_. Genera uno fuerte con: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.      |
| `JWT_EXPIRES_IN`         |     No      | `1h`    | Vigencia del access token (formato `ms`, p. ej. `15m`, `1h`, `7d`).                                                                            |
| `JWT_REFRESH_SECRET`     |   **Sí**    | —       | Secreto del _refresh token_. **Debe ser distinto** de `JWT_SECRET\*\* — si ambos tokens comparten secreto, comprometer uno compromete el otro. |
| `JWT_REFRESH_EXPIRES_IN` |     No      | `7d`    | Vigencia del refresh token.                                                                                                                    |

> Genera **dos** valores distintos ejecutando el comando de arriba dos veces, uno para cada secreto.
> En cada entorno (dev, staging, producción) deben ser secretos **distintos** — reusar el mismo
> secreto entre entornos permite que un token emitido en un entorno menos protegido (p. ej. CI) sea
> válido en producción.

#### Seguridad y hashing

| Variable             | Default | Descripción                                                                                                                                                                                                                          |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BCRYPT_SALT_ROUNDS` | `10`    | Costo del hash de contraseñas. CI usa `4` para acelerar tests (nunca usar un valor tan bajo en producción). Subir este número aumenta la seguridad pero también la latencia del login/registro — 10-12 es el rango estándar en 2026. |

#### CORS

| Variable       | Descripción                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CORS_ORIGINS` | Lista de orígenes permitidos, separados por coma (sin espacios extra necesarios, se hace `trim()`). El backend **falla cerrado**: si esta variable está vacía, `main.ts` configura `origin: false` y rechaza _todo_ origen cross-site — no hay fallback permisivo. En producción, listar exactamente los dominios del frontend (`https://kore-repuestos.com`, etc.), nunca `*` junto con `credentials: true`. |

#### Rate limiting

| Variable         | Default | Descripción                                                               |
| ---------------- | ------- | ------------------------------------------------------------------------- |
| `THROTTLE_TTL`   | `60`    | Ventana de tiempo (segundos) del rate limit global (`@nestjs/throttler`). |
| `THROTTLE_LIMIT` | `100`   | Máximo de requests por IP dentro de esa ventana.                          |

#### Logging y Swagger

| Variable          | Default | Descripción                                                                                                                              |
| ----------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `LOG_LEVEL`       | `debug` | Nivel de log. Bajar a `warn` o `error` en producción reduce ruido y costo de logging.                                                    |
| `SWAGGER_ENABLED` | `true`  | Si `false`, no se monta `/docs` en absoluto — recomendado en producción si no se quiere exponer la documentación de la API públicamente. |
| `SWAGGER_PATH`    | `docs`  | Ruta donde se sirve Swagger UI cuando está habilitado.                                                                                   |

#### Notificaciones (recordatorios de mantenimiento — US#2)

| Variable                      | Default | Descripción                                                                                                                                                                               |
| ----------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NOTIFICATIONS_ENABLED`       | `true`  | Activa el barrido diario (cron in-process, sin Redis) que genera recordatorios de mantenimiento. Ponerlo en `false` en tests/CI o en réplicas secundarias que no deben duplicar el envío. |
| `NOTIFICATIONS_REMINDER_DAYS` | `7`     | Días de anticipación por defecto para nuevas preferencias de usuario (cuántos días antes de vencer un servicio se avisa).                                                                 |

> ⚠️ **Importante en despliegues con múltiples réplicas del backend:** el cron corre in-process en
> cada instancia. Si se escala el backend horizontalmente (más de un contenedor/proceso), **cada
> réplica ejecutará el cron por separado**, lo que puede duplicar notificaciones. Hasta que exista un
> mecanismo de líder único, en un despliegue multi-réplica se recomienda `NOTIFICATIONS_ENABLED=true`
> en una sola réplica designada y `false` en las demás.

#### Email (canal de notificaciones y de envío de cotizaciones)

| Variable                      | Descripción                                                                                                                                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SMTP_HOST`                   | Si se define, el backend usa un transporte SMTP real (nodemailer) — los emails (recordatorios, cotizaciones) **salen de verdad**.                                                                                                                                |
| `SMTP_PORT`                   | Puerto del servidor SMTP (`587` típico para STARTTLS).                                                                                                                                                                                                           |
| `SMTP_USER` / `SMTP_PASSWORD` | Credenciales del servidor SMTP.                                                                                                                                                                                                                                  |
| `SMTP_FROM`                   | Remitente mostrado en los correos.                                                                                                                                                                                                                               |
| _(sin `SMTP_HOST`)_           | El canal cae automáticamente al transporte `jsonTransport` de nodemailer: **compone el email pero no abre ninguna conexión de red**. Ideal para desarrollo, tests y CI — el flujo funciona de punta a punta (incluido el PDF adjunto) pero el correo nunca sale. |

El **PDF de la cotización siempre se genera** (con `pdfkit`, en memoria) y es descargable vía
`GET /quotations/:id/pdf` sin depender de SMTP en absoluto — SMTP solo afecta si el email de
notificación/cotización se entrega o se simula.

#### Web Push (notificaciones push del navegador)

| Variable                                       | Descripción                                                                                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VAPID_PUBLIC_KEY`                             | Clave pública del par VAPID (protocolo Web Push estándar — **no usa Firebase Cloud Messaging**). Debe coincidir exactamente con `VITE_VAPID_PUBLIC_KEY` del frontend. |
| `VAPID_PRIVATE_KEY`                            | Clave privada del par. Nunca exponerla al cliente.                                                                                                                    |
| `VAPID_SUBJECT`                                | Identificador de contacto exigido por la especificación Web Push, formato `mailto:` (p. ej. `mailto:soporte@kore.dev`).                                               |
| _(sin `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`)_ | El canal push degrada a no-op silencioso: no falla, simplemente no envía nada. Útil en dev/CI donde no hace falta probar push real.                                   |

Genera el par de claves **una sola vez** (se reutiliza en todos los despliegues del mismo entorno; si
cambia, todas las suscripciones push existentes de los navegadores quedan inválidas y los usuarios
deben volver a activar las notificaciones):

```bash
pnpm dlx web-push generate-vapid-keys
```

Ver también la sección [12](#12-consideraciones-de-la-pwa-service-worker-y-push) — Web Push requiere
HTTPS (salvo `localhost`), así que en desarrollo funciona sin certificado, pero en producción el
dominio del frontend debe servirse por HTTPS para que el navegador acepte suscribirse.

### 5.2 Frontend (`apps/web/.env` en desarrollo / `.env.local` también soportado)

| Variable                | Obligatoria | Descripción                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | :---------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL`     |   **Sí**    | URL base del backend **incluyendo** el prefijo de versión (p. ej. `http://localhost:3000/api/v1` en dev, `https://api.tu-dominio.com/api/v1` en producción). Vite solo expone al bundle del cliente las variables prefijadas con `VITE_` — cualquier otra variable de entorno definida en build queda fuera del bundle por diseño de Vite. |
| `VITE_VAPID_PUBLIC_KEY` |     No      | Clave pública VAPID — debe ser **idéntica** a `VAPID_PUBLIC_KEY` del backend. Sin ella, el switch de notificaciones push en el frontend permanece deshabilitado (no rompe nada, solo oculta la función).                                                                                                                                   |

Recuerda que **estas variables se "hornean" (bake) en el bundle en tiempo de build**, no en tiempo de
ejecución: si cambias `VITE_API_BASE_URL`, hay que **rehacer el build** del frontend (`pnpm build:web`
o reconstruir la imagen Docker con el nuevo `--build-arg`), no basta con cambiar una variable de
entorno del contenedor ya corriendo.

---

## 6. Base de datos: Supabase y migraciones

### 6.1 Obtener la cadena de conexión

`Supabase Dashboard → Project Settings → Database → Connection string → URI`. Supabase ofrece dos
modos, y **cuál usar depende del contexto**:

| Modo                             | Puerto | Uso recomendado                                                                                                                                                                                          |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Direct Connection**            | `5432` | Migraciones (siempre) y ejecución normal del backend en un proceso/contenedor de larga vida (VM, Docker Compose). TypeORM usa _prepared statements_, que **no son compatibles** con el modo Transaction. |
| **Transaction Mode (pgBouncer)** | `6543` | Runtimes serverless con muchas conexiones cortas y concurrentes (Vercel Functions). Usar solo para el tráfico de la app, **nunca** para correr migraciones.                                              |

Construye `DATABASE_URL` con el modo Direct y, si el destino es serverless, además
`DATABASE_TRANSACTION_URL` con el modo Transaction (ver [9.3](#93-serverless-vercel)).

### 6.2 Migraciones

Las migraciones viven en `apps/backend/src/database/migrations/` y son gestionadas por el CLI de
TypeORM contra `src/config/typeorm.config.ts`. Al 2026-08, el historial de migraciones es:

| Migración                                   | Qué introduce                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `1781137369796-InitialSchema`               | Esquema inicial: usuarios, sesiones, categorías, productos.                                      |
| `1781137369797-AddIsActiveAndRealSchema`    | Soft delete (`isActive`) y ajustes al esquema real.                                              |
| `1781137369798-AddProductRelations`         | Relaciones de productos (imágenes, ficha técnica).                                               |
| `1781137369799-AddCategoryParentIndex`      | Índice sobre `parent_id` de categorías (árbol jerárquico).                                       |
| `1781137369801-AddGarageFields`             | Campos de vehículos del garaje (Módulo 3).                                                       |
| `1781137369802-AddCompatibilidad`           | Compatibilidad producto ↔ modelo de vehículo.                                                    |
| `1781137369803-AddProductSearchVector`      | Columna `tsvector` para Full-Text Search — [ADR-0001](./adr/0001-search-engine-postgres-fts.md). |
| `1781137369804-AddBusquedasLog`             | Log de búsquedas realizadas (alimenta `/analytics/searches`).                                    |
| `1781137369805-AddReviews`                  | Reviews y calificaciones de productos (US#9).                                                    |
| `1781137369806-AddSinonimos`                | Tabla de sinónimos para mejorar la búsqueda.                                                     |
| `1781137369807-AddBusquedasGuardadas`       | Búsquedas guardadas por usuario.                                                                 |
| `1781137369808-DedupeModelos`               | Limpieza de modelos de vehículo duplicados.                                                      |
| `1781137369809-AddNotifications`            | Tablas de notificaciones/preferencias — [ADR-0002](./adr/0002-notifications-postgres-outbox.md). |
| `1781137369810-AddCart`                     | `carrito_compras`, `items_carrito` (Módulo 4 / Sprint 8).                                        |
| `1781137369811-AddQuotations`               | `cotizaciones`, `detalle_cotizacion` (Módulo 4 / Sprint 8).                                      |
| `1781137369812-AddPushNotifications`        | Suscripciones Web Push (ADR-0006, ver [5.1](#5-1-backend-appsbackendenv)).                       |
| `1781137369813-RelaxUsuariosIdentificacion` | Relaja una restricción sobre identificación de usuarios.                                         |

Todas son **idempotentes** (usan `IF NOT EXISTS` en las sentencias DDL): pueden correr tanto contra un
proyecto Supabase que ya tenga parte del esquema como contra uno completamente vacío, sin fallar por
"ya existe".

```bash
# Aplicar todas las migraciones pendientes
pnpm --filter @kore/backend migration:run

# Revertir la última migración aplicada
pnpm --filter @kore/backend migration:revert

# Generar una nueva migración a partir de cambios en las entidades TypeORM
pnpm --filter @kore/backend migration:generate src/database/migrations/NombreDescriptivo
```

`migration:run` requiere `DATABASE_URL` (o el fallback `DB_HOST/PORT/USERNAME/PASSWORD/NAME`)
configurado en `apps/backend/.env`. **Siempre usa la Direct Connection (5432) para migraciones**,
incluso si el backend en producción corre contra la Transaction Mode (6543).

En **producción**, el arranque del backend corre las migraciones automáticamente
(`migrationsRun: true` en la config de TypeORM) — no hace falta un paso manual separado en el
pipeline de despliegue, pero **sí conviene revisar los logs de arranque** para confirmar que
corrieron sin errores (ver [11](#11-health-checks-y-monitoreo) y el checklist de [15](#15-checklist-de-producción)).

### 6.3 Seeds (datos de ejemplo, opcional)

```bash
pnpm --filter @kore/backend seed:dev         # Usuarios/productos/categorías de ejemplo
pnpm --filter @kore/backend seed:vehicles    # Catálogo de marcas/modelos de vehículos
```

Los seeds son útiles para poblar un entorno de desarrollo o demo. **No correr `seed:dev` contra un
proyecto Supabase de producción** — inserta datos ficticios (usuarios/productos de prueba) mezclados
con datos reales.

### 6.4 pgAdmin (inspección visual, opcional)

`docker-compose.yml` levanta únicamente esta herramienta auxiliar — no una base de datos:

```powershell
docker compose --profile tools up -d    # pgAdmin en http://localhost:5050
docker compose down                     # detener
```

Conecta pgAdmin usando los datos de `Supabase Dashboard → Project Settings → Database → Connection
info` (host, puerto, usuario, contraseña) del proyecto que quieras inspeccionar — funciona igual
contra el proyecto de desarrollo que contra el de producción, según qué credenciales le des.

---

## 7. Compilación (build)

Orden de build **obligatorio**: `shared` primero, porque backend y web importan sus tipos/DTOs desde
`packages/shared/dist` en modo build (en modo dev, el frontend lee el código fuente directo vía alias
de Vite y no necesita este paso, pero el backend **siempre** consume el `dist` compilado).

```powershell
pnpm install
pnpm build:shared     # compila packages/shared → packages/shared/dist
pnpm build:backend    # equivalente a: pnpm build:shared && nest build (apps/backend)
pnpm build:web        # tsc -b && vite build (apps/web) → apps/web/dist
```

- `pnpm build` (sin sufijo) compila **todos** los paquetes del workspace en el orden correcto
  (`pnpm -r build`, que respeta las dependencias declaradas entre workspaces).
- `pnpm build:backend` ya incluye la compilación de `shared` como prerequisito — no hace falta
  encadenar los dos comandos manualmente si solo te interesa el backend.
- El build del backend genera `apps/backend/dist/main.js`, el entry point que ejecuta
  `node apps/backend/dist/main.js` en producción.
- El build del frontend genera `apps/web/dist/`, un directorio de archivos **estáticos** (HTML, JS,
  CSS, el manifest de la PWA y el service worker `sw.js`) listo para servir con cualquier servidor
  web o CDN.

---

## 8. Ejecución en desarrollo

Tres terminales (o dos si no necesitas tests en watch):

**Terminal 1 — Backend:**

```powershell
pnpm dev:backend
# API      → http://localhost:3000/api/v1
# Swagger  → http://localhost:3000/docs
# Health   → http://localhost:3000/api/v1/health
```

**Terminal 2 — Frontend:**

```powershell
pnpm dev:web
# Web → http://localhost:5173 (Vite con HMR)
```

**Terminal 3 — Tests en watch (opcional):**

```powershell
pnpm --filter @kore/backend test:watch
pnpm --filter @kore/web test:watch
```

Otros comandos útiles del día a día:

```powershell
pnpm lint            # ESLint (todo el monorepo) con fix automático
pnpm format           # Prettier
pnpm typecheck         # tsc --noEmit en shared, backend y web
pnpm test               # Todos los tests (pnpm -r test)
```

---

## 9. Despliegue en producción

Hay tres formas soportadas de desplegar el sistema, de menor a mayor uso de contenedores. Elige según
tu infraestructura de destino.

### 9.1 Proceso directo (VM / servidor propio, sin contenedores)

Después de `pnpm install`, `pnpm build:shared`, `pnpm build:backend` y `pnpm build:web`:

```bash
# Backend: proceso Node de larga vida
NODE_ENV=production node apps/backend/dist/main.js
```

En un servidor real, envuelve ese comando en un **gestor de procesos** que lo reinicie ante caídas y
lo arranque en el boot del sistema — por ejemplo, un servicio `systemd`:

```ini
# /etc/systemd/system/kore-backend.service
[Unit]
Description=Kore Repuestos Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/kore-repuestos
EnvironmentFile=/opt/kore-repuestos/apps/backend/.env
ExecStart=/usr/bin/node apps/backend/dist/main.js
Restart=on-failure
User=kore

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kore-backend
sudo systemctl status kore-backend
journalctl -u kore-backend -f    # logs en vivo
```

El **frontend** (`apps/web/dist`) es un directorio 100% estático: sírvelo con Nginx (reutilizando
`apps/web/nginx.conf` como referencia de cabeceras de caché), Apache, o cualquier CDN (Cloudflare
Pages, Netlify, S3+CloudFront, etc.). Ejemplo mínimo de bloque Nginx si sirves ambas apps desde el
mismo host, con el frontend en `/` y el backend detrás de un reverse proxy en `/api/`:

```nginx
server {
    listen 443 ssl;
    server_name kore-repuestos.com;

    root /opt/kore-repuestos/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /sw.js {
        add_header Cache-Control "no-cache";
    }
    location = /manifest.webmanifest {
        add_header Cache-Control "no-cache";
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # certificados TLS gestionados aparte (certbot / Let's Encrypt, etc.)
}
```

Si usas este esquema de reverse proxy en `/api/`, ajusta `VITE_API_BASE_URL` al build del frontend
para que apunte a `https://kore-repuestos.com/api/v1` (mismo origen — evita incluso tener que
configurar `CORS_ORIGINS`, aunque igual conviene dejarlo configurado por defensa en profundidad).

### 9.2 Docker Compose (staging)

El repositorio incluye `Dockerfile` multi-stage para backend y web, y un `docker-compose.staging.yml`
listo para usar. Ambos Dockerfile usan **pnpm con `--frozen-lockfile`** y solo instalan las
dependencias del paquete que están construyendo (`--filter @kore/backend...` / `--filter @kore/web...`,
donde `...` incluye las dependencias del workspace, es decir `@kore/shared`), lo que mantiene las
imágenes finales pequeñas.

**Backend** (`apps/backend/Dockerfile`): build de 3 etapas (`deps` → `builder` → `runner` con
`node:22-alpine`), corre `node apps/backend/dist/main.js`, expone el puerto `3000`.

**Web** (`apps/web/Dockerfile`): build de 2 etapas — compila con Vite recibiendo
`VITE_API_BASE_URL` como **build arg** (¡se hornea en el bundle, no es una env var de runtime!) y la
etapa final es `nginx:alpine` sirviendo `apps/web/dist` con la config de `apps/web/nginx.conf`.

Pasos:

```bash
# 1. Prepara el archivo de variables de entorno del backend para staging
cp apps/backend/.env.example apps/backend/.env.staging
#    edítalo con los valores reales de staging (DATABASE_URL de Supabase-staging, JWT secrets propios, etc.)

# 2. Define la URL pública del backend que verá el frontend en build time
export VITE_API_BASE_URL=https://api.staging.kore-repuestos.com/api/v1

# 3. Construye y levanta ambos servicios
docker compose -f docker-compose.staging.yml up -d --build
```

Servicios resultantes:

| Servicio  | Puerto host | Notas                                                                 |
| --------- | ----------- | --------------------------------------------------------------------- |
| `backend` | `3000`      | Lee variables desde `apps/backend/.env.staging` (`env_file`).         |
| `web`     | `80`        | Nginx; `depends_on: backend` (orden de arranque, no espera de salud). |

```bash
docker compose -f docker-compose.staging.yml logs -f backend   # logs del backend
docker compose -f docker-compose.staging.yml ps                # estado de los contenedores
docker compose -f docker-compose.staging.yml down              # detener y eliminar contenedores
```

Para producción real, replica este mismo patrón con un `docker-compose.production.yml` (o el
equivalente en tu orquestador — Kubernetes, ECS, etc.), apuntando `.env.production` al proyecto
Supabase de producción y `VITE_API_BASE_URL` al dominio público real de la API. El `Dockerfile` no
cambia entre staging y producción — solo las variables de entorno inyectadas.

> `depends_on: backend` en Compose solo controla **orden de arranque de contenedores**, no espera a
> que el backend esté realmente listo (healthy). Si el frontend hace un primer request antes de que
> el backend termine de aplicar migraciones, el navegador simplemente verá un error de red pasajero
> y funcionará al reintentar — no hay una condición de carrera destructiva, pero si quieres eliminarla
> del todo agrega un `healthcheck` al servicio `backend` apuntando a `GET /api/v1/health` y
> `depends_on: { backend: { condition: service_healthy } }` en el servicio `web`.

### 9.3 Serverless (Vercel)

`vercel.json` reescribe **todas** las rutas a la función serverless `/api/index` (que apunta a
`api/index.ts`, el wrapper que expone la app Nest como handler serverless):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api/index" }],
  "installCommand": "pnpm install --config.supportedArchitectures.cpu=x64 --config.supportedArchitectures.os=linux"
}
```

El `installCommand` fuerza arquitectura `x64`/`linux` explícitamente porque algunas dependencias del
backend (`bcrypt`, `sharp`) compilan binarios nativos: sin este flag, instalar en una Mac ARM o
similar y desplegar en la infraestructura Linux x64 de Vercel puede producir binarios incompatibles.

Consideraciones específicas de este modo de despliegue:

- **Conexión a la base de datos**: cada invocación de función puede abrir una conexión nueva a
  Postgres. Bajo carga, esto agota rápido el límite de conexiones de un Postgres normal. Por eso, en
  este modo se recomienda usar `DATABASE_TRANSACTION_URL` (pgBouncer, puerto `6543`) para el tráfico
  de la aplicación — **pero seguir usando la Direct Connection (5432) para correr las migraciones**,
  típicamente como un paso de build/deploy separado o ejecutado manualmente antes del primer deploy.
- **Cron in-process de notificaciones** (`@nestjs/schedule`, ver [5.1](#5-1-backend-appsbackendenv)):
  en un entorno serverless las funciones no tienen un proceso de larga vida "siempre encendido", por
  lo que un cron in-process **no es confiable** aquí (solo corre si hay una invocación activa en ese
  instante). Si el despliegue objetivo es Vercel, evalúa mover el barrido de recordatorios a un
  [Vercel Cron Job](https://vercel.com/docs/cron-jobs) que invoque un endpoint dedicado, en vez de
  depender de `NOTIFICATIONS_ENABLED=true` dentro del proceso.
- **Uploads de imágenes** (`apps/backend/uploads/`, servidos vía `useStaticAssets`): el sistema de
  archivos de una función serverless es efímero y de solo lectura salvo `/tmp`. Si despliegas en
  Vercel, las imágenes de producto necesitan un backend de almacenamiento externo (p. ej. Supabase
  Storage) en vez del filesystem local — esto es una diferencia real de arquitectura respecto al
  despliegue en VM/Docker, no una simple variable de configuración.
- **Swagger** (`/docs`): sigue funcionando igual, gobernado por `SWAGGER_ENABLED`/`SWAGGER_PATH`.

Dado estos matices (almacenamiento de archivos y cron), el despliegue serverless es viable para la
API en sí, pero requiere revisar puntualmente el módulo de **imágenes de productos** y el de
**notificaciones** antes de considerarlo production-ready sin cambios.

---

## 10. Integración continua (CI/CD)

Pipeline definido en [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), disparado en cada
`push` a `main`, `develop` o `feature/*`, y en cada Pull Request hacia `main`/`develop`. Usa
`concurrency` para cancelar automáticamente ejecuciones previas de la misma rama/PR cuando llega un
push nuevo (ahorra minutos de CI).

Jobs, todos corriendo en paralelo tras `setup` (excepto donde se indica dependencia):

| Job            | Qué hace                                                                                                                                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setup`        | Checkout + instala Node 22 y pnpm 11.5.0 + `pnpm install --frozen-lockfile`, publicando la cache de pnpm para los demás jobs.                                                                                                                                                            |
| `lint`         | `pnpm lint` (ESLint, `--max-warnings=0`, cero tolerancia a warnings) + `pnpm format:check` (Prettier).                                                                                                                                                                                   |
| `typecheck`    | Compila `shared` y corre `tsc --noEmit` sobre backend y web por separado.                                                                                                                                                                                                                |
| `test-backend` | Levanta un servicio **Postgres 16** efímero (contenedor de GitHub Actions, no Supabase), aplica el esquema corriendo las **migraciones TypeORM reales** (no un SQL paralelo — así CI valida las migraciones tal cual se ejecutarán en producción), y corre tests unitarios + e2e (Jest). |
| `test-web`     | Corre tests de Vitest y luego el build de producción (`pnpm --filter @kore/web build`) — falla si el build se rompe, no solo si fallan los tests.                                                                                                                                        |
| `sonar`        | Análisis estático con SonarCloud (complejidad, duplicación, bugs/vulnerabilidades — NFR 3.7/3.9). Marcado `continue-on-error: true` porque requiere un secreto `SONAR_TOKEN` que aún no está configurado en el repositorio; falla "silenciosamente" hasta que se configure.              |
| `ci-passed`    | Job final que depende de `[lint, typecheck, test-backend, test-web]` (deliberadamente **no** incluye `sonar` mientras siga sin configurar). Pensado como el único _required check_ a activar en las reglas de protección de rama.                                                        |

Para activar SonarCloud como gate real:

1. Crea un token en SonarCloud (`My Account → Security`) y agrégalo como secreto del repo:
   `Settings → Secrets and variables → Actions → New repository secret` con nombre `SONAR_TOKEN`.
2. Completa `sonar.projectKey` y `sonar.organization` en `sonar-project.properties` (raíz del repo).
3. Quita `continue-on-error: true` del job `sonar` en `ci.yml`.
4. Agrega `sonar` a la lista `needs` del job `ci-passed`.

Variables de entorno usadas por `test-backend` (**valores de CI, no reutilizar en ningún entorno
real**): `NODE_ENV=test`, credenciales del Postgres efímero (`DB_HOST=localhost`, etc.),
`JWT_SECRET`/`JWT_REFRESH_SECRET` de ejemplo y `BCRYPT_SALT_ROUNDS=4` (bajo, solo para que los tests
corran rápido).

Para reproducir el job de tests de backend en local sin depender de Supabase (por ejemplo para
depurar un test que falla en CI), puedes levantar un Postgres efímero propio con Docker y exportar el
mismo bloque de variables `DB_*` antes de correr `pnpm --filter @kore/backend test:e2e`.

---

## 11. Health checks y monitoreo

`GET /api/v1/health` — endpoint **público** (`@Public()`, no requiere JWT), implementado con
`@nestjs/terminus`. Verifica exclusivamente la conexión a la base de datos con un timeout de 3
segundos (mayor al default de 1s de Terminus, porque el pooler remoto de Supabase puede tardar más
que un Postgres local en responder al ping):

```bash
curl -s https://api.tu-dominio.com/api/v1/health
```

- `200 OK` con el detalle del check si la base de datos responde.
- `503 Service Unavailable` si la conexión a Postgres falla o excede el timeout.

Este endpoint está pensado explícitamente para un monitor de uptime externo (Uptime Robot, AWS
CloudWatch Synthetics, un `healthcheck:` de Docker/Kubernetes, etc.) que haga ping cada pocos minutos.
Configúralo apuntando a esta URL en tu herramienta de monitoreo de preferencia — el proyecto no incluye
un servicio de monitoreo propio, es responsabilidad del entorno de despliegue.

**Logs**: en `NODE_ENV=production`, controla el volumen con `LOG_LEVEL` (sección 5.1). En Docker,
`docker compose logs -f backend`; en systemd, `journalctl -u kore-backend -f`; en Vercel, el panel de
Functions/Logs del proyecto.

---

## 12. Consideraciones de la PWA (service worker y push)

El frontend es una **Progressive Web App** (`vite-plugin-pwa`, estrategia `injectManifest`, service
worker en `apps/web/src/sw.ts`, `registerType: 'autoUpdate'`). Esto tiene implicaciones directas para
el despliegue del build estático:

- **Cabeceras de caché del service worker y el manifest**: `sw.js` y `manifest.webmanifest` deben
  servirse con `Cache-Control: no-cache` (ya configurado en `apps/web/nginx.conf`) — si un CDN o
  proxy los cachea de forma agresiva, los usuarios quedan atascados en una versión vieja del frontend
  indefinidamente, sin importar cuántos deploys nuevos se hagan. El resto de assets con hash en el
  nombre de archivo (JS/CSS/imágenes generados por Vite) sí se benefician de cache larga e inmutable
  (`expires 1y; Cache-Control: public, immutable`), porque cualquier cambio en su contenido cambia su
  nombre de archivo.
- **HTTPS obligatorio para Web Push**: la API de notificaciones push del navegador (y los service
  workers en general, salvo `localhost`) requiere que el sitio se sirva por HTTPS. En desarrollo
  (`http://localhost:5173`) funciona sin certificado por la excepción de `localhost`; en cualquier
  dominio de staging o producción, si no hay TLS, el switch de notificaciones push simplemente no
  funcionará en el navegador (no es un bug del backend, es una restricción del navegador).
- **Claves VAPID consistentes**: `VITE_VAPID_PUBLIC_KEY` (build del frontend) y `VAPID_PUBLIC_KEY` /
  `VAPID_PRIVATE_KEY` (runtime del backend) deben pertenecer al **mismo par de claves** generado con
  `pnpm dlx web-push generate-vapid-keys` (sección 5.1). Si regeneras el par, todas las suscripciones
  push existentes en los navegadores de los usuarios quedan inválidas — necesitan volver a activar
  las notificaciones desde el centro de notificaciones de la app.
- **`registerType: 'autoUpdate'`**: el service worker se actualiza solo, sin pedir confirmación al
  usuario, en cuanto detecta un build nuevo. Esto significa que tras cada despliegue del frontend, los
  usuarios con la app abierta reciben el nuevo bundle en su siguiente navegación/recarga sin acción
  manual — pero también que **no hay forma sencilla de forzar rollback en el navegador del usuario**
  más allá de volver a desplegar la versión anterior del frontend (ver [14](#14-rollback)).

---

## 13. Verificación post-despliegue (smoke tests)

Tras cada despliegue, corre esta secuencia mínima para confirmar que el sistema está realmente
operativo de punta a punta — no solo que el proceso arrancó.

```bash
BASE=https://api.tu-dominio.com/api/v1

# 1. Salud del backend y conexión a la base de datos
curl -s $BASE/health

# 2. Catálogo público responde (sin auth)
curl -s "$BASE/products?page=1&limit=5" | head

# 3. Documentación viva (solo si SWAGGER_ENABLED=true)
open https://api.tu-dominio.com/docs

# 4. Registro/login funcionan (crea o usa un usuario de prueba del entorno)
curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"prueba@kore.dev","password":"Prueba123"}'
TOKEN=<accessToken de la respuesta anterior>

# 5. Flujo de garaje / mantenimiento (Módulo 3)
curl -s -H "Authorization: Bearer $TOKEN" $BASE/vehicles
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/maintenance/parts?km=45000"

# 6. Notificaciones (US#2)
curl -s -H "Authorization: Bearer $TOKEN" $BASE/notifications/unread-count

# 7. Búsqueda (ADR-0001)
curl -s "$BASE/products/suggestions?q=filtro"

# 8. Flujo de carrito y cotización (Módulo 4 — Sprint 8)
curl -s -H "Authorization: Bearer $TOKEN" -X POST $BASE/cart/items \
  -H 'Content-Type: application/json' -d '{"productId":1,"quantity":1}'
curl -s -H "Authorization: Bearer $TOKEN" $BASE/cart/summary
curl -s -H "Authorization: Bearer $TOKEN" -X POST $BASE/quotations \
  -H 'Content-Type: application/json' -d '{}'
# usa el "id" devuelto arriba para descargar el PDF:
curl -s -H "Authorization: Bearer $TOKEN" $BASE/quotations/<id>/pdf -o cotizacion.pdf
file cotizacion.pdf    # debe reportar: PDF document
```

Si el paso 8 (cotización) falla con `400`, primero confirma que el carrito no esté vacío (paso previo
requerido) — es la causa más común, no un error de despliegue.

En el **frontend**, adicionalmente: abre la URL pública en un navegador, confirma que la consola no
tenga errores de CORS (si los hay, revisa `CORS_ORIGINS` en el backend) y que el ícono de instalación
de PWA aparezca en el navegador (confirma que el manifest y el service worker se sirven correctamente).

---

## 14. Rollback

- **Backend (Docker/VM)**: vuelve a desplegar la imagen o el commit anterior conocido como bueno.
  Como las migraciones son **idempotentes y aditivas** (no hay migraciones `DROP` destructivas en el
  historial actual), desplegar una versión anterior del código contra una base de datos que ya tiene
  migraciones más nuevas aplicadas generalmente no rompe nada — el código viejo simplemente ignora las
  columnas/tablas nuevas que no conoce. Si alguna vez se agrega una migración destructiva, este
  supuesto deja de sostenerse y el rollback de base de datos debe planearse aparte con
  `migration:revert` **antes** de volver al código viejo.
- **Frontend**: vuelve a desplegar el build anterior (imagen Docker anterior, o el commit anterior si
  se usa un pipeline de build-and-deploy). Gracias a `registerType: 'autoUpdate'` del service worker
  (sección 12), los navegadores con la app abierta recogen el rollback automáticamente en su próxima
  navegación, sin que el usuario tenga que limpiar caché manualmente.
- **Variables de entorno**: si el incidente fue causado por un cambio de configuración (no de código),
  a menudo basta con revertir la variable específica y reiniciar el proceso — más rápido que un
  rollback de artefacto completo.

---

## 15. Checklist de producción

- [ ] `NODE_ENV=production`.
- [ ] `DB_SYNCHRONIZE=false` (siempre — evita alteraciones automáticas y destructivas del esquema).
- [ ] `DB_LOGGING=false` (o `true` temporalmente solo para depurar, nunca de forma permanente).
- [ ] `JWT_SECRET` y `JWT_REFRESH_SECRET` fuertes (≥ 32 caracteres aleatorios), **distintos entre sí**
      y **únicos por entorno** (no reusar los de desarrollo/CI/staging en producción).
- [ ] `CORS_ORIGINS` restringido exactamente a los dominios reales del frontend (sin comodines).
- [ ] `DB_SSL_REJECT_UNAUTHORIZED=true`.
- [ ] Migraciones aplicadas y verificadas en los logs de arranque (sección 6.2).
- [ ] `SWAGGER_ENABLED=false` si no se quiere exponer la documentación pública de la API.
- [ ] Rate limiting activo y ajustado a tráfico real esperado (`THROTTLE_TTL` / `THROTTLE_LIMIT`).
- [ ] `BCRYPT_SALT_ROUNDS` en un valor de producción real (10-12), no el `4` usado en CI.
- [ ] (Opcional) `SMTP_*` configurado si se requiere envío real de emails (cotizaciones, recordatorios).
- [ ] (Opcional) `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` configurados y coincidentes con
      `VITE_VAPID_PUBLIC_KEY` del build del frontend, si se quiere Web Push funcional.
- [ ] El dominio del frontend sirve por **HTTPS** (requisito duro para Web Push y buena práctica
      general).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` presente solo en variables de entorno del backend — nunca en el
      bundle del frontend ni en ningún repositorio o log.
- [ ] Health check (`/api/v1/health`) registrado en el monitor de uptime externo.
- [ ] Si hay más de una réplica del backend: revisar la nota sobre `NOTIFICATIONS_ENABLED` y el cron
      in-process (sección 5.1) para evitar recordatorios duplicados.
- [ ] Smoke test de la sección 13 ejecutado y en verde.

---

## 16. Troubleshooting

### "Cannot find module '@kore/shared'"

`shared` no está compilado, o se compiló pero `node_modules` no tiene el symlink actualizado.

```powershell
pnpm install
pnpm build:shared
```

### "EADDRINUSE: address already in use :::3000"

Otro proceso ya usa el puerto (a menudo, una instancia previa del backend que no cerró bien).

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### La base de datos no conecta

Verifica que `DATABASE_URL` en `apps/backend/.env` (o `.env.staging`/`.env.production`, según el
entorno) tenga el formato correcto y use el **puerto 5432** (Direct Connection), no el 6543:

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

Errores típicos: contraseña con caracteres especiales sin escapar en la URL, proyecto Supabase
pausado (los proyectos gratuitos de Supabase se pausan tras inactividad prolongada — revisa el
dashboard), o `DB_SSL_REJECT_UNAUTHORIZED` mal configurado en un entorno con CA certs desactualizados.

### Las migraciones fallan con "relation already exists" pese a ser idempotentes

Poco probable dado que usan `IF NOT EXISTS`, pero si ocurre, revisa si alguien corrió
`DB_SYNCHRONIZE=true` contra ese mismo proyecto Supabase en algún momento — TypeORM Synchronize puede
crear objetos con nombres/formas ligeramente distintos a los que esperan las migraciones, generando
conflictos. La solución no es forzar la migración, sino auditar el esquema real contra lo que las
migraciones asumen.

### El frontend en producción llama a `localhost:3000`

`VITE_API_BASE_URL` no estaba definida (o apuntaba a localhost) en el **momento del build** — esta
variable se hornea en el bundle, no se puede corregir después con una variable de entorno del
contenedor en runtime. Hay que **reconstruir** el frontend con el valor correcto (`--build-arg
VITE_API_BASE_URL=...` en Docker, o la variable exportada antes de `pnpm build:web`).

### Errores de CORS en el navegador

`CORS_ORIGINS` en el backend no incluye el origen exacto (protocolo + dominio + puerto) desde el que
sirve el frontend. Recuerda que el backend falla cerrado: si la variable está vacía, se rechaza todo
origen cross-site (sección 5.1).

### Las notificaciones push no llegan

1. Confirma que el sitio se sirve por HTTPS (o es `localhost`) — es un requisito del navegador, no
   configurable.
2. Confirma que `VITE_VAPID_PUBLIC_KEY` (build del frontend) y `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`
   (backend) pertenecen al mismo par de claves.
3. Si el par de claves VAPID cambió recientemente, las suscripciones previas quedaron inválidas — el
   usuario debe reactivar las notificaciones desde el centro de notificaciones.

### "pnpm: command not found"

```powershell
npm install -g pnpm
```

o activa `corepack` (incluido en Node 22): `corepack enable`.

---

## 17. Referencias

- [README.md](../README.md) — puesta en marcha rápida.
- [CONTEXT.md](../CONTEXT.md) — contexto general del proyecto y convenciones de código.
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md) — diagramas Mermaid (contexto, componentes, ciclo de vida de un request, modelo de datos, infraestructura).
- [docs/GITFLOW.md](./GITFLOW.md) — estrategia de ramificación.
- [docs/CONVENTIONAL_COMMITS.md](./CONVENTIONAL_COMMITS.md) — convención de commits.
- [docs/TESTING.md](./TESTING.md) — estrategia de pruebas.
- [docs/api/API_REFERENCE.md](./api/API_REFERENCE.md) y [docs/api/MODULE4-CART-QUOTATIONS.md](./api/MODULE4-CART-QUOTATIONS.md) — referencia completa de endpoints.
- ADRs: [0001](./adr/0001-search-engine-postgres-fts.md) (búsqueda) · [0002](./adr/0002-notifications-postgres-outbox.md) (notificaciones) · [0003](./adr/0003-quotations-pdf-pdfkit.md) (PDF) · [0004](./adr/0004-backend-framework-nestjs.md) (NestJS) · [0005](./adr/0005-database-hosting-supabase.md) (Supabase).
- [docs/USER_MANUAL.md](./USER_MANUAL.md) — manual de usuario (qué hace el sistema desde la perspectiva de cliente, asesor comercial y administrador).
