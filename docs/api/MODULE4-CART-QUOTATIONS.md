# API — Módulo 4: Carrito y Cotizaciones (Sprint 8)

Documentación de referencia de los endpoints del **Módulo 4** (US#18–US#22). Todos cuelgan del
prefijo global `/api/v1` y **requieren autenticación** (JWT Bearer). La documentación viva
(OpenAPI/Swagger) está en `http://localhost:3000/docs`.

- **Base URL (dev):** `http://localhost:3000/api/v1`
- **Auth:** header `Authorization: Bearer <accessToken>` (obtenido en `POST /auth/login`).
- **Moneda:** dolares (USD). El IVA aplicado es **15 %** (`taxRate: 0.15`).
- **Totales:** siempre se calculan en el servidor; el cliente nunca los envía.

---

## Carrito (US#18–US#21)

| Método   | Ruta               | Descripción                                        |
| -------- | ------------------ | -------------------------------------------------- |
| `GET`    | `/cart`            | Carrito completo con líneas y totales.             |
| `GET`    | `/cart/summary`    | **US#21** — resumen ligero (contadores + totales). |
| `POST`   | `/cart/items`      | Añade un producto (incrementa si ya existe).       |
| `POST`   | `/cart/items/bulk` | Alta masiva ("Agregar todos los repuestos", US#5). |
| `PUT`    | `/cart/items/:id`  | Modifica la cantidad de una línea (US#19).         |
| `DELETE` | `/cart/items/:id`  | Elimina una línea (US#20).                         |
| `DELETE` | `/cart`            | Vacía el carrito.                                  |

### GET /cart/summary — US#21

Resumen barato del carrito, pensado para el mini-carrito de la barra y el paso previo a cotizar.
No devuelve las líneas.

**Respuesta 200**

```json
{
  "itemCount": 3,
  "distinctCount": 2,
  "subtotal": 300.0,
  "taxRate": 0.18,
  "tax": 54.0,
  "total": 354.0,
  "canQuote": true,
  "updatedAt": "2026-08-06T12:00:00.000Z"
}
```

- `canQuote`: `true` si hay al menos una línea (habilita "Proceder a cotizar").

---

## Cotizaciones (US#22)

| Método | Ruta                    | Descripción                                         |
| ------ | ----------------------- | --------------------------------------------------- |
| `POST` | `/quotations`           | Genera una cotización a partir del carrito vigente. |
| `GET`  | `/quotations`           | Historial de cotizaciones del usuario (resúmenes).  |
| `GET`  | `/quotations/:id`       | Detalle de una cotización (líneas + totales).       |
| `GET`  | `/quotations/:id/pdf`   | Descarga el PDF (`application/pdf`).                |
| `POST` | `/quotations/:id/email` | Envía la cotización por email con el PDF adjunto.   |

Todas validan **propiedad**: una cotización solo es accesible por el usuario que la emitió
(`403 Forbidden` en caso contrario, `404` si no existe).

### POST /quotations — US#22

Crea una cotización congelando el carrito actual. No recibe ítems: se arma desde el carrito del
usuario autenticado. Rechaza con `400` si el carrito está vacío.

**Body** (todo opcional)

```json
{
  "validityDays": 15, // 1–365, por defecto 15
  "sendEmail": false, // si true, envía el PDF por email al crear
  "clearCart": true // si true (por defecto), vacía el carrito tras emitir
}
```

**Respuesta 201**

```json
{
  "id": 42,
  "number": "COT-2026-000042",
  "status": "Pendiente",
  "customer": { "id": 7, "name": "Ana Cliente", "email": "ana@kore.dev" },
  "items": [
    {
      "id": 1,
      "productId": 5,
      "sku": "FLT-001",
      "name": "Filtro de aceite",
      "quantity": 2,
      "unitPrice": 100.0,
      "lineTotal": 200.0
    }
  ],
  "subtotal": 200.0,
  "taxRate": 0.18,
  "tax": 36.0,
  "total": 236.0,
  "issuedAt": "2026-08-06T12:00:00.000Z",
  "validUntil": "2026-08-21T12:00:00.000Z",
  "expired": false
}
```

**Estados (`status`)**: `Pendiente` · `Enviada` (tras envío por email) · `Aceptada` · `Rechazada` ·
`Expirada` (efectivo: si `validUntil` ya pasó, se reporta `Expirada` aunque en DB siga `Pendiente`).

### GET /quotations/:id/pdf

Devuelve el PDF binario. Requiere el header `Authorization` (no es un enlace público), por lo que
el frontend descarga el blob autenticado y fuerza la descarga en el navegador.

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="COT-2026-000042.pdf"
```

### POST /quotations/:id/email

Envía la cotización al email del cliente con el PDF adjunto y marca la cotización como `Enviada`.

**Respuesta 200**

```json
{ "to": "ana@kore.dev", "delivered": true }
```

- `delivered`: `true` si se usó un SMTP real; `false` si fue el transporte simulado (dev/CI sin
  `SMTP_HOST`). Ver [ADR-0003](../adr/0003-quotations-pdf-pdfkit.md).

---

## Errores comunes

| Código | Cuándo                                                          |
| ------ | --------------------------------------------------------------- |
| `400`  | Carrito vacío al cotizar · cantidad > stock · payload inválido. |
| `401`  | Falta el token o expiró.                                        |
| `403`  | Intentar acceder a una cotización de otro usuario.              |
| `404`  | Cotización o producto inexistente.                              |

## Modelo de datos (schema real)

- `cotizaciones` (cabecera): `id_cotizacion`, `numero_cotizacion` (UNIQUE), `id_usuario`,
  `fecha_emision`, `fecha_validez`, `estado`.
- `detalle_cotizacion` (líneas): `id_detalle`, `id_cotizacion`, `id_producto`, `cantidad`,
  `precio_unitario` (**precio congelado** al emitir).

Migración: `1781137369811-AddQuotations.ts` (idempotente, `IF NOT EXISTS`).
