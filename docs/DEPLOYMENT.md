# Guía de Despliegue — Kore Repuestos

Cómo desplegar el sistema completo: **backend** (NestJS API), **frontend web** (React/Vite) y la
**base de datos** (Supabase PostgreSQL). Incluye el despliegue del **Módulo 4 (Sprint 8)** —carrito y
cotizaciones—, que **no requiere infraestructura nueva** (sin Redis, sin Chromium, sin SMTP
obligatorio; ver [ADR-0003](./adr/0003-quotations-pdf-pdfkit.md)).

---

## 1. Requisitos

- **Node.js** ≥ 22.13.0 y **pnpm** ≥ 11.5.0
- **PostgreSQL** (Supabase gestionado, o Postgres 16 propio)
- (Opcional) **Docker** + Docker Compose para el despliegue en contenedores (staging/prod)

---

## 2. Configuración (variables de entorno)

Copia las plantillas y rellena los valores reales. **Nunca** commitees los `.env` reales.

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example    apps/web/.env.local
```

### Backend (`apps/backend/.env`) — claves críticas

| Variable                            | Descripción                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                      | Cadena de conexión Postgres. **Direct Connection (puerto 5432)** — TypeORM usa prepared statements, incompatibles con Transaction Mode (6543). |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Secretos fuertes (≥ 32 chars). Genera con `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.                          |
| `CORS_ORIGINS`                      | Orígenes del frontend permitidos, separados por coma.                                                                                          |
| `DB_SSL_REJECT_UNAUTHORIZED`        | `true` (recomendado) valida el certificado del servidor.                                                                                       |
| `SWAGGER_ENABLED`                   | `false` en producción si no quieres exponer `/docs`.                                                                                           |

### Módulo 4 — Email de cotizaciones (opcional)

El envío del PDF de la cotización reutiliza el **mismo** transporte de email que las notificaciones
(no hay variables nuevas):

| Variable                                                  | Efecto                                                                                                                                               |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SMTP_HOST` (+ `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`) | Si se define, el email de cotización se **envía de verdad** (`delivered: true`).                                                                     |
| _(sin `SMTP_HOST`)_                                       | Transporte simulado `jsonTransport` (sin red): el flujo funciona y el PDF se genera, pero el correo no sale (`delivered: false`). Ideal para dev/CI. |
| `SMTP_FROM`                                               | Remitente mostrado.                                                                                                                                  |

> El **PDF** se genera siempre (con `pdfkit`, en memoria) y es descargable vía
> `GET /quotations/:id/pdf` — no depende de SMTP.

### Frontend (`apps/web/.env.local`)

| Variable            | Descripción                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | URL del backend **incluyendo** el prefijo `/api/v1` (p. ej. `https://api.tu-dominio.com/api/v1`). |

---

## 3. Base de datos y migraciones

Las **migraciones corren automáticamente al arrancar** el backend (`migrationsRun: true`). Incluyen
las del Módulo 4:

- `1781137369810-AddCart` — `carrito_compras`, `items_carrito`.
- `1781137369811-AddQuotations` — `cotizaciones`, `detalle_cotizacion`.

Todas son **idempotentes** (`IF NOT EXISTS`): conviven con un Supabase que ya tenga el schema real y
con un Postgres vacío. Para correrlas manualmente:

```bash
pnpm --filter @kore/backend migration:run
# revertir la última:
pnpm --filter @kore/backend migration:revert
```

---

## 4. Build e instalación

```bash
pnpm install
pnpm --filter @kore/shared build   # el backend y la web consumen @kore/shared desde dist
pnpm --filter @kore/backend build
pnpm --filter @kore/web build
```

> **Importante:** compila **`@kore/shared` primero**. Backend y web importan sus tipos/DTOs (incluido
> `quotation.dto`) desde `packages/shared/dist`.

---

## 5. Ejecución

### 5.1 Local / VM

```bash
# Backend (sirve la API en :3000, prefijo /api/v1, Swagger en /docs)
node apps/backend/dist/main.js
# o en desarrollo:
pnpm --filter @kore/backend start:dev

# Frontend (sirve el build estático de apps/web/dist con cualquier servidor estático)
pnpm --filter @kore/web preview   # o Nginx/CDN apuntando a apps/web/dist
```

### 5.2 Docker Compose (staging)

Hay `Dockerfile` para backend y web y un `docker-compose.staging.yml` listo:

```bash
# Requiere apps/backend/.env.staging con las variables de producción
export VITE_API_BASE_URL=https://api.staging.kore-repuestos.com/api/v1
docker compose -f docker-compose.staging.yml up -d --build
```

- `backend` → puerto 3000
- `web` (Nginx) → puerto 80, `depends_on: backend`

### 5.3 Serverless (Vercel)

`vercel.json` reescribe todo a `/api/index`. Si despliegas el backend en un entorno serverless con
muchas conexiones cortas, usa la URL de **Transaction Mode / pgBouncer (6543)** (`DATABASE_TRANSACTION_URL`)
para la app, pero **mantén Direct (5432)** para correr migraciones.

---

## 6. Verificación post-despliegue (smoke test)

```bash
# 1. Salud del API + docs
curl -s https://api.tu-dominio.com/api/v1/products | head
open https://api.tu-dominio.com/docs        # si SWAGGER_ENABLED=true

# 2. Flujo Módulo 4 (con un token válido de un cliente):
TOKEN=... # de POST /auth/login
BASE=https://api.tu-dominio.com/api/v1
curl -s -H "Authorization: Bearer $TOKEN" -X POST $BASE/cart/items -H 'Content-Type: application/json' -d '{"productId":1,"quantity":1}'
curl -s -H "Authorization: Bearer $TOKEN" $BASE/cart/summary
curl -s -H "Authorization: Bearer $TOKEN" -X POST $BASE/quotations -H 'Content-Type: application/json' -d '{}'
# Descargar el PDF de la cotización creada (id devuelto arriba):
curl -s -H "Authorization: Bearer $TOKEN" $BASE/quotations/<id>/pdf -o cotizacion.pdf
file cotizacion.pdf   # → PDF document
```

---

## 7. Checklist de producción

- [ ] `NODE_ENV=production`, `DB_SYNCHRONIZE=false`, `DB_LOGGING=false`.
- [ ] `JWT_SECRET` / `JWT_REFRESH_SECRET` fuertes y únicos por entorno.
- [ ] `CORS_ORIGINS` restringido a los dominios reales del frontend.
- [ ] `DB_SSL_REJECT_UNAUTHORIZED=true`.
- [ ] Migraciones aplicadas (revisar logs de arranque).
- [ ] (Opcional) `SMTP_*` configurado si se requiere envío real de cotizaciones por email.
- [ ] `SWAGGER_ENABLED=false` si no se quiere exponer la documentación pública.
- [ ] Rate limiting activo (`THROTTLE_TTL` / `THROTTLE_LIMIT`).
