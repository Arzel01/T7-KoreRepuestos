# Kore Repuestos

Sistema de gestión de repuestos automotrices, catálogos y cálculo automatizado
de planes de mantenimiento.

## Arquitectura

Monorepo con tres aplicaciones y un paquete compartido:

| Paquete           | Stack                                   | Descripción                            |
| ----------------- | --------------------------------------- | -------------------------------------- |
| `apps/backend`    | Node.js · NestJS · TypeORM · TypeScript | API REST y lógica de dominio           |
| `apps/web`        | React · Vite · TailwindCSS · TypeScript | Panel administrativo y portal cliente  |
| `apps/mobile`     | React Native · TypeScript               | App para clientes / asesores en campo  |
| `packages/shared` | TypeScript                              | DTOs, enums, interfaces y validaciones |

## Requisitos previos

| Herramienta    | Versión mínima | Descarga                                       |
| -------------- | -------------- | ---------------------------------------------- |
| Node.js        | >= 22.13.x     | https://nodejs.org                             |
| pnpm           | >= 11.x        | `npm install -g pnpm`                          |
| Docker Desktop | >= 4.x         | https://www.docker.com/products/docker-desktop |
| Git            | >= 2.40        | https://git-scm.com                            |

## Puesta en marcha

> PowerShell desde la raíz del proyecto.

```powershell
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Abre `apps/backend/.env`, ejecuta este comando **dos veces** y pega cada
resultado en `JWT_SECRET` y `JWT_REFRESH_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```powershell
# 3. Abrir Docker Desktop y levantar la base de datos
docker compose up -d postgres

# 4. Compilar el backend (solo la primera vez)
pnpm build:backend

# 5. Correr las migraciones
pnpm --filter @kore/backend migration:run
```

**Terminal 1:**

```powershell
pnpm dev:backend
```

**Terminal 2:**

```powershell
pnpm dev:web
```

| Servicio | URL                          |
| -------- | ---------------------------- |
| API      | http://localhost:3000/api/v1 |
| Swagger  | http://localhost:3000/docs   |
| Web      | http://localhost:5173        |

## Documentación

- [Estrategia de ramificación (GitFlow)](./docs/GITFLOW.md)
- [Convención de commits](./docs/CONVENTIONAL_COMMITS.md)

## Patrones de diseño aplicados

- **Repository** — abstrae el acceso a datos vía `IRepository<T>`.
- **Strategy** — algoritmos intercambiables para el cálculo de planes de
  mantenimiento.
- **Observer** — notificaciones de stock bajo, vencimientos de mantenimiento.
- **Builder** — construcción incremental de cotizaciones y planes.
