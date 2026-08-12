# API — Referencia general (todos los módulos)

Complementa [`MODULE4-CART-QUOTATIONS.md`](./MODULE4-CART-QUOTATIONS.md), que ya documenta Carrito y
Cotizaciones en detalle. Este archivo cubre el resto de módulos del backend, construido leyendo
directamente los `*.controller.ts` reales — no es una copia de Swagger, es la referencia estática
versionada que faltaba para revisar la API sin levantar el servidor.

- **Base URL (dev):** `http://localhost:3000/api/v1`
- **Documentación viva:** `http://localhost:3000/docs` (Swagger, generado del mismo código)
- **Auth:** header `Authorization: Bearer <accessToken>`. Salvo que se indique **Público**, todas las
  rutas exigen JWT válido (`JwtAuthGuard` global); las marcadas **Admin** además exigen
  `@Roles(UserRole.ADMINISTRADOR)`.

---

## Auth (`/auth`)

| Método | Ruta             | Acceso      | Descripción                                      |
| ------ | ---------------- | ----------- | ------------------------------------------------ |
| `POST` | `/auth/register` | Público     | Registro de usuario.                             |
| `POST` | `/auth/login`    | Público     | Login — devuelve `accessToken` + `refreshToken`. |
| `POST` | `/auth/logout`   | Autenticado | Cierra la sesión actual.                         |
| `GET`  | `/auth/me`       | Autenticado | Perfil del usuario autenticado.                  |

---

## Productos (`/products`)

| Método   | Ruta                                      | Acceso      | Descripción                            |
| -------- | ----------------------------------------- | ----------- | -------------------------------------- |
| `GET`    | `/products`                               | Público     | Catálogo paginado y filtrable.         |
| `GET`    | `/products/suggestions`                   | Público     | Autocomplete de búsqueda.              |
| `GET`    | `/products/:id`                           | Público     | Detalle de producto.                   |
| `GET`    | `/products/:id/compatibility`             | Público     | Vehículos compatibles con el producto. |
| `POST`   | `/products/:id/compatibility`             | Admin       | Añade compatibilidad con un modelo.    |
| `DELETE` | `/products/:id/compatibility/:modeloId`   | Admin       | Quita una compatibilidad.              |
| `POST`   | `/products`                               | Admin       | Crea producto.                         |
| `PUT`    | `/products/:id`                           | Admin       | Reemplaza producto.                    |
| `PATCH`  | `/products/:id`                           | Admin       | Actualiza parcialmente.                |
| `DELETE` | `/products/:id`                           | Admin       | Soft delete (`isActive = false`).      |
| `GET`    | `/products/:id/images`                    | Público     | Imágenes del producto.                 |
| `POST`   | `/products/:id/images`                    | Admin       | Sube imagen (multipart).               |
| `DELETE` | `/products/:id/images/:imageId`           | Admin       | Elimina imagen.                        |
| `GET`    | `/products/:id/technical-sheet`           | Público     | Ficha técnica.                         |
| `POST`   | `/products/:id/technical-sheet`           | Admin       | Añade entrada a la ficha técnica.      |
| `DELETE` | `/products/:id/technical-sheet/:entryId`  | Admin       | Elimina entrada.                       |
| `GET`    | `/products/:id/reviews`                   | Público     | Reviews del producto (paginado).       |
| `POST`   | `/products/:id/reviews`                   | Autenticado | Publica una review (US#9).             |
| `POST`   | `/products/:id/reviews/:reviewId/helpful` | Autenticado | Marca una review como útil.            |

> Reviews (`US#9`) vive dentro del módulo `products` (`reviews.service.ts`, `reviews.repository.ts`),
> no como módulo propio — por eso no aparecía en `docs/ARCHITECTURE.md` como componente separado.

---

## Categorías (`/categories`)

| Método   | Ruta               | Acceso  | Descripción                                 |
| -------- | ------------------ | ------- | ------------------------------------------- |
| `GET`    | `/categories`      | Público | Categorías raíz (planas).                   |
| `GET`    | `/categories/tree` | Público | Árbol jerárquico completo.                  |
| `GET`    | `/categories/:id`  | Público | Detalle de una categoría.                   |
| `POST`   | `/categories`      | Admin   | Crea categoría.                             |
| `PATCH`  | `/categories/:id`  | Admin   | Actualiza categoría.                        |
| `DELETE` | `/categories/:id`  | Admin   | Elimina (sin hijos ni productos asociados). |

---

## Garaje y vehículos (`/vehicles`)

| Método   | Ruta                               | Acceso      | Descripción                                                                  |
| -------- | ---------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `GET`    | `/vehicles/brands`                 | Público     | Marcas disponibles.                                                          |
| `GET`    | `/vehicles/brands/:brandId/models` | Público     | Modelos de una marca.                                                        |
| `GET`    | `/vehicles`                        | Autenticado | Vehículos del usuario ("Mi Garaje").                                         |
| `POST`   | `/vehicles`                        | Autenticado | Registra un vehículo (US#1).                                                 |
| `PUT`    | `/vehicles/:id`                    | Autenticado | Actualiza un vehículo propio.                                                |
| `DELETE` | `/vehicles/:id`                    | Autenticado | Elimina un vehículo propio.                                                  |
| `PATCH`  | `/vehicles/:id/mileage`            | Autenticado | Actualiza kilometraje — dispara verificación de mantenimiento vencido.       |
| `POST`   | `/vehicles/:id/logs`               | Autenticado | Registra un evento en la bitácora del vehículo.                              |
| `GET`    | `/vehicles/:id/calendar`           | Autenticado | Vista de calendario de servicios.                                            |
| `GET`    | `/vehicles/:id/plan`               | Autenticado | Plan de mantenimiento (US#3) — próximas tareas, repuestos, costos estimados. |

## Mantenimiento — guías y repuestos (`/maintenance`)

| Método | Ruta                      | Acceso  | Descripción                                    |
| ------ | ------------------------- | ------- | ---------------------------------------------- |
| `GET`  | `/maintenance/parts`      | Público | Búsqueda de repuestos por kilometraje (US#11). |
| `GET`  | `/maintenance/guides`     | Público | Guías de mantenimiento por modelo.             |
| `GET`  | `/maintenance/guides/:id` | Público | Detalle de una guía.                           |
| `POST` | `/maintenance/guides`     | Admin   | Crea una guía de mantenimiento.                |

## Mantenimiento — registros (`/maintenance/records`)

| Método | Ruta                   | Acceso      | Descripción                                              |
| ------ | ---------------------- | ----------- | -------------------------------------------------------- |
| `POST` | `/maintenance/records` | Autenticado | Marca una tarea de mantenimiento como completada (US#4). |
| `GET`  | `/maintenance/records` | Autenticado | Historial de mantenimiento del usuario.                  |

---

## Recomendaciones (`/recommendations`)

| Método | Ruta                                              | Acceso  | Descripción                        |
| ------ | ------------------------------------------------- | ------- | ---------------------------------- |
| `GET`  | `/recommendations/:id`                            | Público | Productos relacionados (US#10).    |
| `GET`  | `/recommendations/:id/frequently-bought-together` | Público | "Frecuentemente comprados juntos". |

---

## Notificaciones (`/notifications`)

| Método  | Ruta                          | Acceso      | Descripción                                         |
| ------- | ----------------------------- | ----------- | --------------------------------------------------- |
| `GET`   | `/notifications/preferences`  | Autenticado | Preferencias de notificación del usuario.           |
| `PATCH` | `/notifications/preferences`  | Autenticado | Actualiza canal (app/email) y días de anticipación. |
| `GET`   | `/notifications/unread-count` | Autenticado | Contador para la campana del header.                |
| `GET`   | `/notifications`              | Autenticado | Centro de notificaciones (historial).               |
| `PATCH` | `/notifications/:id/read`     | Autenticado | Marca una notificación como leída.                  |

> Arquitectura real: cron in-process + tabla `notificaciones` como outbox, sin Redis/Bull ni
> Firebase — ver [ADR-0002](../adr/0002-notifications-postgres-outbox.md).

---

## Búsquedas guardadas (`/searches`)

| Método   | Ruta            | Acceso      | Descripción                                    |
| -------- | --------------- | ----------- | ---------------------------------------------- |
| `GET`    | `/searches`     | Autenticado | Búsquedas guardadas del usuario.               |
| `POST`   | `/searches`     | Autenticado | Guarda la búsqueda actual (filtros + término). |
| `DELETE` | `/searches/:id` | Autenticado | Elimina una búsqueda guardada.                 |

> El motor de búsqueda del catálogo (`GET /products`, `GET /products/suggestions`) usa PostgreSQL
> Full-Text Search + `pg_trgm`, no Elasticsearch — ver [ADR-0001](../adr/0001-search-engine-postgres-fts.md).

---

## Analítica (`/analytics`)

| Método | Ruta                  | Acceso | Descripción                                     |
| ------ | --------------------- | ------ | ----------------------------------------------- |
| `GET`  | `/analytics/searches` | Admin  | Reporte de búsquedas realizadas en el catálogo. |

---

## Carrito y Cotizaciones

Ver documentación dedicada: [`MODULE4-CART-QUOTATIONS.md`](./MODULE4-CART-QUOTATIONS.md)
(`/cart`, `/quotations`).

---

## Errores comunes (todos los módulos)

| Código | Cuándo                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------- |
| `400`  | Payload inválido, regla de negocio violada (p. ej. cantidad > stock, carrito vacío al cotizar). |
| `401`  | Falta el token o expiró.                                                                        |
| `403`  | Ruta `Admin` con usuario sin rol `ADMINISTRADOR`, o acceso a un recurso de otro usuario.        |
| `404`  | Recurso inexistente.                                                                            |
