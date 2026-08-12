# ADR-0003: Cotizaciones — generación de PDF con pdfkit y email con nodemailer

**Estado:** Aceptado
**Fecha:** 2026-08-06
**Autores:** equipo Kore Repuestos

---

## Contexto

El backlog del **Sprint 8 · Módulo 4 (US#22 · Generar Cotización)** pedía: crear los modelos de
cotización, un endpoint `POST /api/quotations`, **generar un PDF** de la cotización, **enviarlo por
email** y ofrecer su descarga desde la UI.

La generación de PDF suele resolverse con servicios/motores pesados (renderizado headless de HTML con
Chromium/Puppeteer, o servicios SaaS de documentos). El envío de email, con un proveedor SMTP externo.
Igual que en [ADR-0001](./0001-search-engine-postgres-fts.md) (búsqueda) y
[ADR-0002](./0002-notifications-postgres-outbox.md) (notificaciones), la infraestructura real del
proyecto **no incluye Redis, ni un binario de Chromium en CI, ni un servidor SMTP configurado**. CI
corre sobre un Postgres efímero, sin servicios extra.

Introducir Puppeteer implicaría descargar Chromium (~150 MB), binarios nativos que rompen en runners
mínimos, y un consumo de memoria alto por render. Un SaaS implicaría secretos y una dependencia de red
en el camino crítico.

---

## Decisión

Se genera el PDF **en proceso** con **`pdfkit`** y se envía el email con **`nodemailer`**, sin
infraestructura adicional:

1. **PDF:** `QuotationPdfService` construye el documento con `pdfkit`, una librería **JS pura** (sin
   binarios nativos ni red; usa las fuentes AFM estándar embebidas — Helvetica). Devuelve un `Buffer`
   en memoria que se puede streamear por HTTP (`GET /quotations/:id/pdf`, `application/pdf`) o adjuntar
   a un email. Funciona idéntico en dev, en el CI Postgres-nativo y en producción.
2. **Email:** `QuotationMailerService` sigue el mismo patrón que `EmailChannel` de notificaciones: usa
   **SMTP real si hay `SMTP_HOST`**, y en dev/CI cae a `jsonTransport` de nodemailer (**sin red**), de
   modo que los tests y CI ejercitan el flujo completo sin servidor de correo (`delivered=false`).
3. **Datos congelados:** la cotización es una foto inmutable del carrito. `detalle_cotizacion`
   persiste `precio_unitario` al emitir, de modo que un cambio posterior de `productos.precio_base` no
   altera un documento ya generado. Los totales (subtotal, IVA, total) se **recalculan** en el
   servidor con la misma `IVA_RATE` (18 %) que el carrito; no se guardan en la tabla.
4. **Correlativo:** `numero_cotizacion` = `COT-<año>-<id a 6 dígitos>`, derivado del id
   autoincremental dentro de una transacción (unicidad garantizada por la PK, sin secuencia aparte ni
   condiciones de carrera).

---

## Consecuencias

**Positivas**

- Cero infraestructura nueva: sin Chromium, sin Redis, sin SMTP obligatorio. CI verde sin secretos.
- PDF y email testeables de punta a punta en CI (el PDF se valida por su firma `%PDF-`; el email por
  el resultado `{ to, delivered }`).
- Documentos reproducibles y baratos (render en memoria, del orden de milisegundos).

**Negativas / límites**

- `pdfkit` es más manual que un render de HTML: los layouts complejos (tablas multipágina muy ricas,
  CSS) requieren código de posicionamiento. Para la cotización actual (cabecera + tabla + totales) es
  suficiente.
- Sin SMTP configurado, el email **no sale** de la aplicación (`delivered=false`): la UI lo comunica
  explícitamente como "envío simulado en este entorno".

## Triggers de reevaluación

- Si el negocio exige plantillas de documento con diseño rico/branding avanzado → evaluar un motor de
  HTML→PDF (p. ej. `@react-pdf/renderer` o un servicio dedicado).
- Si se requiere envío de email real en producción → configurar `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD`
  (no requiere cambios de código; el transporte se selecciona por entorno).
