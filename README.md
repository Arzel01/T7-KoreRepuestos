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

- Node.js >= 20.x
- npm >= 10.x (o pnpm/yarn equivalentes)
- Docker Desktop >= 4.x
- Git >= 2.40

## Puesta en marcha

```bash
# 1. Clonar e instalar dependencias (raíz del monorepo)
git clone <repo-url> kore-repuestos
cd kore-repuestos
npm install

# 2. Copiar variables de entorno
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env

# 3. Levantar la base de datos
docker compose up -d postgres

# 4. Arrancar backend
npm run dev --workspace=apps/backend

# 5. Arrancar web (en otra terminal)
npm run dev --workspace=apps/web
```

## Documentación

- [Estrategia de ramificación (GitFlow)](./docs/GITFLOW.md)
- [Convención de commits](./docs/CONVENTIONAL_COMMITS.md)

## Patrones de diseño aplicados

- **Repository** — abstrae el acceso a datos vía `IRepository<T>`.
- **Strategy** — algoritmos intercambiables para el cálculo de planes de
  mantenimiento.
- **Observer** — notificaciones de stock bajo, vencimientos de mantenimiento.
- **Builder** — construcción incremental de cotizaciones y planes.
