# Estrategia de Pruebas — Sprint 8 (Módulo 4 y entrega final)

Documenta las pruebas del cierre del proyecto: **integración end-to-end**, **rendimiento (carga)** y
**seguridad (OWASP)**. Toda la automatización corre sobre el stack existente (Postgres efímero en CI,
sin Redis/SMTP/Chromium — ver [ADR-0003](./adr/0003-quotations-pdf-pdfkit.md)).

---

## 1. Pruebas unitarias

Servicios con repositorios/depedencias mockeadas — **no requieren base de datos**.

```bash
pnpm --filter @kore/backend test        # 102 pruebas (incluye QuotationsService)
pnpm --filter @kore/web test
```

Cobertura relevante del Módulo 4:

- `cart.service.spec.ts` — cálculo de subtotal/IVA/total, prevención de duplicados, stock.
- `quotations.service.spec.ts` — carrito vacío ⇒ 400, congelado de precios, totales con IVA,
  `clearCart`, envío de email + estado `Enviada`, propiedad (403/404), expiración.

---

## 2. Pruebas de integración (end-to-end)

Levantan la aplicación NestJS real contra el Postgres de test y ejercitan la API por HTTP.

```bash
pnpm --filter @kore/backend test:e2e
```

| Suite                             | Qué cubre                                                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quotations.e2e-spec.ts`          | US#21 (`/cart/summary`) + US#22 (crear, listar, detalle, **PDF**, email, 401/403/404, precio congelado).                                                              |
| `register-shop-quote.e2e-spec.ts` | **Flujo completo Registro → Compra → Cotización**: un cliente nuevo se registra, explora el catálogo, agrega repuestos, revisa el resumen y genera + descarga el PDF. |
| `cart.e2e-spec.ts`                | Carrito (US#18–US#20) + IVA.                                                                                                                                          |

**Criterios de aceptación verificados en el flujo E2E:**

1. Registro devuelve token y rol `Cliente`.
2. El catálogo responde una colección de productos.
3. El carrito consolida líneas y cuenta artículos.
4. El resumen calcula IVA 18 % correctamente (200 → 236).
5. La cotización se genera con las líneas del carrito y total correcto.
6. El PDF descargado empieza con la firma `%PDF-` y `Content-Type: application/pdf`.
7. El carrito queda vacío tras cotizar.

> El envío de email se ejercita con el transporte simulado (`jsonTransport`): `delivered=false`, sin
> requerir un servidor SMTP en CI.

---

## 3. Pruebas de rendimiento (carga)

El punto más caro del Módulo 4 es la **generación del PDF** (render en memoria con `pdfkit`) y el
cálculo de totales. Se mide con `autocannon` (sin instalar nada permanente):

```bash
# 1. Arranca el backend contra una BD de prueba y obtén un token de un cliente.
TOKEN=... ; BASE=http://localhost:3000/api/v1

# 2. Carga sobre el resumen de carrito (lectura + cálculo de totales)
npx autocannon -c 50 -d 30 -H "Authorization=Bearer $TOKEN" $BASE/cart/summary

# 3. Carga sobre la generación de PDF (ruta más costosa)
npx autocannon -c 20 -d 30 -H "Authorization=Bearer $TOKEN" $BASE/quotations/1/pdf
```

**Objetivos (SLO) sugeridos** (ajustar al hardware objetivo):

| Endpoint                  | p95 latencia | Throughput objetivo |
| ------------------------- | ------------ | ------------------- |
| `GET /cart/summary`       | < 150 ms     | ≥ 300 req/s         |
| `GET /quotations/:id`     | < 200 ms     | ≥ 200 req/s         |
| `GET /quotations/:id/pdf` | < 400 ms     | ≥ 50 req/s          |

**Notas y mitigaciones:**

- El PDF se genera en cada request. Si el volumen lo justifica, cachear el `Buffer` por cotización
  (el documento es inmutable salvo su estado) o materializarlo a disco/almacenamiento al emitir.
- La conexión a Postgres debe usar **Transaction Mode/pgBouncer (6543)** para la app en cargas altas
  con conexiones cortas; **Direct (5432)** solo para migraciones.
- El rate limiting (`@nestjs/throttler`, `THROTTLE_LIMIT`) protege ante ráfagas abusivas — **subir
  `THROTTLE_LIMIT` antes de correr el plan de JMeter de abajo**, o cada usuario virtual empezará a
  recibir 429 en vez de las respuestas reales que el NFR 3.1 quiere medir.

### 3.1 Protocolo formal (NFR 3.1 — JMeter, 100 usuarios / 60 min)

El autocannon de arriba es un chequeo rápido de desarrollo sobre el endpoint más caro. El protocolo
que exige la NFR 3.1 (100 usuarios concurrentes, 60 minutos, degradación < 10 %, error 5xx = 0 %) vive
como un plan de JMeter versionado: [`docs/testing/load/kore-nfr-3.1-load-test.jmx`](./testing/load/kore-nfr-3.1-load-test.jmx).

Qué hace el plan por cada uno de los 100 usuarios virtuales:

1. **Setup (una vez)**: se registra con un email único (`loadtest-<hilo>-<timestamp>@kore.dev`) y
   captura su `accessToken`.
2. **En bucle durante 60 minutos**: `GET /products` (explorar catálogo) → `GET /products?search=…`
   (buscar) → `POST /cart/items` (agregar al carrito) → `GET /cart` (ver carrito), con una pausa
   aleatoria de 0.5–2s entre pasos simulando a una persona real.

Cómo correrlo:

```bash
# 1. Backend corriendo contra una BD real (no la de test, para no truncarla a mitad de la corrida).
pnpm dev:backend

# 2. Sube el rate limit temporalmente (100 hilos van a superar el límite normal de 100 req/60s).
#    En apps/backend/.env: THROTTLE_LIMIT=100000

# 3. Instala JMeter (https://jmeter.apache.org/download_jmeter.cgi) y corre en modo no-GUI:
jmeter -n \
  -t docs/testing/load/kore-nfr-3.1-load-test.jmx \
  -l docs/testing/load/results.jtl \
  -e -o docs/testing/load/report
```

**Criterios de éxito** (leer del reporte HTML generado en `docs/testing/load/report/index.html`):

| Métrica                           | Objetivo  |
| --------------------------------- | --------- |
| Tiempo de respuesta promedio      | < 2000 ms |
| Degradación vs. baseline (1 user) | < 10 %    |
| Tasa de error 5xx                 | 0 %       |

Para el baseline de degradación: corré el mismo plan con `ThreadGroup.num_threads=1` primero y
compará el tiempo de respuesta promedio contra la corrida de 100 usuarios.

`results.jtl` y `report/` quedan fuera de git (son salidas de una corrida local, no artefactos del
repo) — agregalos a `.gitignore` si los generás dentro de `docs/testing/load/`.

---

## 4. Pruebas de seguridad (OWASP)

Revisión frente al **OWASP Top 10 (2021)**, enfocada en el Módulo 4.

| Riesgo OWASP                      | Control implementado                                                                                                                                                                                                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A01 Broken Access Control**     | Todas las rutas están tras un **`JwtAuthGuard` global**. Cada cotización valida **propiedad** (`loadOwned`: 403 si `userId` no coincide, 404 si no existe). El PDF y el email pasan por la misma verificación. El carrito valida propiedad de cada ítem (US#19/20).                                            |
| **A02 Cryptographic Failures**    | Contraseñas con `bcrypt`. Conexión a Postgres con SSL (`DB_SSL_REJECT_UNAUTHORIZED=true`). Secretos JWT por entorno.                                                                                                                                                                                           |
| **A03 Injection**                 | Acceso a datos **solo por TypeORM parametrizado**; el SQL de las migraciones es estático. El `numero_cotizacion` del `Content-Disposition` es **server-generado** (`COT-AÑO-NNNNNN`), no entrada del usuario ⇒ sin header/response-splitting. El nombre del producto se escapa en la UI (`sanitizeHighlight`). |
| **A04 Insecure Design**           | Los **totales se calculan siempre en el servidor**; el cliente nunca los envía. El precio se **congela** al emitir. Validación de stock en el carrito. Cotizar con carrito vacío ⇒ 400.                                                                                                                        |
| **A05 Security Misconfiguration** | `helmet` activo; `ValidationPipe` con `whitelist` + `forbidNonWhitelisted` (rechaza campos no declarados); CORS restringible; Swagger desactivable en prod.                                                                                                                                                    |
| **A06 Vulnerable Components**     | Sin binarios nativos ni Chromium en el camino de PDF (`pdfkit` es JS puro). Dependencias auditables con `pnpm audit`.                                                                                                                                                                                          |
| **A07 Auth Failures**             | JWT con expiración (`JWT_EXPIRES_IN`) y refresh; el login no revela si el email existe; rate limiting global.                                                                                                                                                                                                  |
| **A08 Data Integrity Failures**   | La cotización es inmutable (precios congelados en `detalle_cotizacion`); correlativo único garantizado por PK en transacción.                                                                                                                                                                                  |
| **A09 Logging Failures**          | `logs_auditoria` para acciones sensibles; el envío de email se registra (real vs simulado).                                                                                                                                                                                                                    |
| **A10 SSRF**                      | La app no realiza fetch a URLs provistas por el usuario; el email va **solo** al correo del propio usuario autenticado (no a un destinatario arbitrario del payload).                                                                                                                                          |

### Checks automatizables

```bash
pnpm audit --audit-level=high        # dependencias vulnerables
pnpm --filter @kore/backend lint     # reglas de estilo/seguridad de ESLint
```

- Casos negativos ya cubiertos por e2e: **401** sin token, **403** cotización ajena, **404**
  inexistente, **400** payload inválido / carrito vacío.

### Pendientes / recomendaciones

- Considerar cachear/limitar la generación de PDF (ver §3) para evitar abuso de CPU.
- Añadir un escaneo DAST (p. ej. OWASP ZAP baseline) al pipeline antes de releases mayores.

---

## 5. Calidad estática (NFR 3.7 / 3.9 — SonarCloud)

El job `sonar` en `.github/workflows/ci.yml` corre el análisis, pero necesita configuración de cuenta
que no se puede versionar:

1. Crear un proyecto en [sonarcloud.io](https://sonarcloud.io) importando este repo de GitHub.
2. Copiar el `projectKey`/`organization` que SonarCloud asigna a `sonar-project.properties`
   (reemplazar los dos `CHANGE_ME_*`).
3. Generar un token en Sonar → My Account → Security, y guardarlo como secret `SONAR_TOKEN` en
   GitHub (Settings → Secrets and variables → Actions).
4. Quitar `continue-on-error: true` del job `sonar` y agregarlo a `needs` de `ci-passed` para que el
   Quality Gate bloquee merges (0 bugs, 0 vulnerabilidades, < 3 % duplicación, complejidad < 10 por
   método — los umbrales de la NFR 3.7/3.9 son el Quality Gate "Sonar way" por defecto).

Sin este setup el job falla de forma inofensiva (no bloquea CI) — es trabajo de cuenta, no de código.

## 6. Usabilidad (NFR 3.3)

Requiere sesiones con personas reales — no es algo verificable por análisis de código. El guion
completo (5 participantes, 5 tareas, cuestionario SUS, cálculo de puntaje) está en
[`docs/testing/usability-test-script.md`](./testing/usability-test-script.md).
