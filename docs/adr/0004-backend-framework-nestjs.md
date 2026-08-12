# ADR-0004: Framework de backend — NestJS

**Estado:** Aceptado (documentado retroactivamente)
**Fecha:** 2026-08-11
**Autores:** equipo Kore Repuestos (reconstruido a partir del código y `CONTEXT.md`)

---

## Contexto

El backlog de **Sprint 0** incluía las tareas "Research and select backend framework" (AO, 4h) y
"Document technology decisions" (BR, 3h), pero ninguna dejó un artefacto de decisión versionado —
solo una tabla de stack en `CONTEXT.md`, sin alternativas comparadas ni justificación. Es la única
de las cuatro decisiones de framework/infraestructura del proyecto (backend, notificaciones,
búsqueda, generación de PDF) que **no** tiene ADR propia pese a ser la más fundacional: define la
estructura de los 12 módulos del backend, el patrón de autorización (`@Roles`, `@Public`) y cómo se
documenta la API.

Esta ADR se redacta ahora, a partir de la evidencia real en `apps/backend/src/` (uso extensivo de
decoradores, inyección de dependencias, guards, `@nestjs/swagger`), como parte de una auditoría de
backlog que detectó el vacío.

---

## Decisión

Se adopta **NestJS** sobre Express (que NestJS usa internamente como adapter HTTP por defecto), en
lugar de Express.js sin capa de framework adicional.

---

## Justificación

| Criterio                                           | Express.js (capas manuales)                                               | **NestJS (elegido)**                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Estructura para equipo de 5 con experiencia dispar | Ninguna impuesta — cada módulo puede organizarse distinto                 | Convención `Controller → Service → Repository` impuesta por el framework en los 12 módulos                                   |
| Inyección de dependencias                          | Manual o librería aparte (Awilix, InversifyJS)                            | Nativa (`@Injectable`, constructor injection)                                                                                |
| Autorización declarativa (RBAC)                    | Middleware escrito a mano por ruta, fácil de olvidar en un endpoint nuevo | Guards + decoradores reutilizables (`@Roles(UserRole.ADMINISTRADOR)`, `@Public()`), aplicados globalmente vía `JwtAuthGuard` |
| Documentación OpenAPI/Swagger                      | Requiere configurar `swagger-jsdoc` a mano y mantenerla sincronizada      | `@nestjs/swagger` genera la spec desde los mismos decoradores del controller — no puede desincronizarse del código           |
| Validación de DTOs                                 | Manual (Joi/Zod + wiring por ruta)                                        | `class-validator` integrado vía `ValidationPipe` global                                                                      |
| Testing                                            | Se arma con Jest a mano, mocks manuales                                   | `@nestjs/testing` (TestingModule) + Jest preconfigurado                                                                      |
| Curva de aprendizaje                               | Baja                                                                      | Media-alta (decoradores, DI, módulos)                                                                                        |
| Overhead en runtime                                | Mínimo                                                                    | Mayor (capa de abstracción sobre Express/Fastify) — irrelevante a la escala de este proyecto                                 |

**Conclusión:** para un equipo de 5 integrantes con niveles de experiencia distintos trabajando en
paralelo sobre 12 módulos, una convención **impuesta por el framework** reduce el riesgo de que cada
módulo termine organizado de forma distinta (el mismo riesgo de divergencia que esta auditoría
detectó a nivel de backlog — ver el informe de auditoría de Sprints). El RBAC declarativo también
reduce el riesgo concreto de un guard de autorización olvidado en un endpoint administrativo, que es
exactamente el tipo de bug que una convención manual sobre Express no previene por sí sola.

---

## Consecuencias

**Positivas:**

- Consistencia estructural verificable entre los 12 módulos reales (`auth`, `users`, `products`,
  `categories`, `cart`, `quotations`, `garage`, `notifications`, `recommendations`, `search`,
  `analytics`, `audit`).
- Swagger vivo en `/docs`, generado del código — no depende de que alguien actualice un Markdown a
  mano (a diferencia de otros documentos del proyecto, que sí quedaron desactualizados; ver
  `docs/ARCHITECTURE.md`).
- `class-validator` + DTOs comparte tipos con `packages/shared`, usado también por el frontend.

**Negativas / limitaciones:**

- Curva de aprendizaje para quien no conoce decoradores/DI — mitigado en este proyecto porque el
  equipo completo trabajó con el mismo framework desde Sprint 0.
- Mayor huella en runtime que Express puro; no es un problema a la escala de tráfico de este
  proyecto (académico, sin requisitos de cold-start serverless de alta frecuencia).

---

## Trigger de reevaluación

Reconsiderar Express/Fastify puro si el proyecto migrara a un entorno serverless con facturación
por invocación donde el cold-start de Nest fuera un costo medible, o si el equipo creciera lo
suficiente como para que la convención impuesta por el framework empezara a estorbar más de lo que
ayuda (no observado a la fecha de esta ADR).

---

## Referencias

- `apps/backend/src/modules/*` — estructura Controller/Service/Repository en los 12 módulos.
- `apps/backend/src/common/` — guards, decoradores (`@Roles`, `@Public`) compartidos.
- `CONTEXT.md` — tabla de stack tecnológico del backend.
- [ADR-0001](./0001-search-engine-postgres-fts.md), [ADR-0002](./0002-notifications-postgres-outbox.md), [ADR-0003](./0003-quotations-pdf-pdfkit.md) — decisiones de infraestructura de soporte tomadas dentro de sprints, sin spike previo; esta ADR documenta la decisión de framework que sí se tomó a tiempo en Sprint 0, pero sin dejar registro escrito hasta ahora.
