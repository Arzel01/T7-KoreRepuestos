# ADR-0002: Notificaciones — cron in-process + outbox en PostgreSQL

**Estado:** Aceptado
**Fecha:** 2026-08-04
**Autores:** equipo Kore Repuestos

---

## Contexto

El backlog de **US#2 (Recordatorios de Mantenimiento)** especificaba una arquitectura basada en
**cola Bull/Agenda**, **notificaciones push con Firebase (FCM)** y un **servicio de email**, para
avisar a los usuarios cuando un servicio de mantenimiento de su vehículo está próximo o vencido.

Al planificar el sprint se constató que la infraestructura real del proyecto **no incluye Redis**
(el `docker-compose.yml` no levanta Redis —de hecho tampoco Postgres, que corre en Supabase—, y el
pipeline de CI no provee Redis), ni un proyecto Firebase, ni un servidor SMTP. Bull/BullMQ
**requieren Redis** de forma obligatoria. Introducir Redis + Firebase implicaría nueva
infraestructura, secretos y cambios de CI para un valor que puede entregarse sobre el stack actual.

Esta situación es análoga a la de [ADR-0001](./0001-search-engine-postgres-fts.md), donde se optó por
PostgreSQL FTS en lugar de Elasticsearch.

---

## Decisión

Se adopta una arquitectura de notificaciones **nativa de PostgreSQL**, sin dependencias de
infraestructura adicional:

1. **Programación:** un cron **in-process** con `@nestjs/schedule` (`@Cron`, sin Redis) ejecuta el
   barrido diario de recordatorios.
2. **Cola / entrega:** la tabla **`notificaciones` funciona como _outbox_**. Los recordatorios nacen
   en estado `pendiente`; el `NotificationDispatcher` los toma (vencidos) y los entrega por su canal,
   marcándolos `enviada`/`fallida`. Un índice único parcial evita encolar duplicados pendientes por
   `(vehículo, tarea, canal)`.
3. **Canales:** abstracción `NotificationChannel` con dos implementaciones:
   - **In-app** (`InAppChannel`): la fila persistida es la entrega; el frontend la muestra en el
     centro de notificaciones (campana en la barra).
   - **Email** (`EmailChannel`): `nodemailer`. Si hay `SMTP_HOST` usa SMTP real; si no, usa el
     transporte `jsonTransport` (**sin red**), de modo que dev/CI/test funcionan sin servidor SMTP.
4. **Preferencias:** tabla `preferencias_notificacion` (una por usuario): activar recordatorios,
   canales (app/email) y días de anticipación.

---

## Justificación

| Criterio                         | Bull/BullMQ + Redis  | Agenda (Mongo)       | **Outbox PostgreSQL (elegido)**     |
| -------------------------------- | -------------------- | -------------------- | ----------------------------------- |
| Infraestructura adicional        | Redis (server, ops)  | MongoDB              | **Ninguna — misma BD**              |
| Funciona en el CI actual         | No (sin Redis)       | No (sin Mongo)       | **Sí (Postgres efímero)**           |
| Programación de tareas           | Sí                   | Sí                   | Sí (`@nestjs/schedule`)             |
| Reintentos / estado              | Sí (nativo)          | Sí                   | Sí (`estado` + barrido)             |
| Persistencia/auditoría de envíos | Requiere store extra | En Mongo             | **Nativa (filas `notificaciones`)** |
| Centro de notificaciones in-app  | Requiere tabla extra | Requiere tabla extra | **Es la misma tabla**               |
| Costo / operación                | Alta                 | Alta                 | **Cero**                            |

Para la escala actual (miles de usuarios, un barrido diario + chequeo al actualizar kilometraje) el
patrón outbox sobre Postgres es funcionalmente suficiente y elimina toda operación extra.

---

## Alcance entregado en el sprint

| Tarea del backlog US#2                     | Implementación                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| "Create MaintenanceReminder model"         | Entidad `Notification` + tabla `notificaciones` (migración `AddNotifications1781137369809`).                |
| "Design notification service architecture" | `NotificationsModule`: `NotificationsService`, `NotificationDispatcher`, abstracción `NotificationChannel`. |
| "Setup notification queue (Bull/Agenda)"   | **Superada** — outbox Postgres (`estado='pendiente'` + índice parcial) en lugar de Bull/Redis.              |
| "Implement email notification service"     | `EmailChannel` (nodemailer; SMTP real o `jsonTransport` sin red).                                           |
| "Setup push notification (Firebase)"       | **Diferida** (ver triggers) — se entrega el canal **in-app** (centro de notificaciones).                    |
| "Create cron job for reminder checks"      | `ReminderSchedulerService` con `@Cron` (`@nestjs/schedule`).                                                |
| "Build notification preferences UI"        | `preferencias_notificacion` + endpoints + UI (`NotificationPreferences`, shadcn `switch`).                  |

Además, `PATCH /vehicles/:id/mileage` dispara `checkVehicle` para encolar recordatorios de tareas que
quedan vencidas tras subir el kilometraje.

---

## Consecuencias

**Positivas:**

- Sin infraestructura ni secretos nuevos; CI verde sin Redis/SMTP.
- Historial de notificaciones y centro in-app comparten una sola tabla, auditable con la BD.
- El algoritmo de mantenimiento (`maintenance-calc.ts`) es puro y se reutiliza en el endpoint de
  plan, el calendario y el scheduler.

**Negativas / limitaciones:**

- El despachador asume despliegue **single-instance**. Multi-instancia requeriría un claim con
  `FOR UPDATE SKIP LOCKED` (o un broker real) para evitar doble envío.
- Sin push nativo a dispositivos (solo in-app + email).
- Los sinónimos/plantillas de mensaje se definen en código (no hay panel de administración).

---

## Trigger de reevaluación

Migrar a un broker dedicado (BullMQ/Redis, SQS, etc.) y/o Firebase cuando se cumpla **cualquiera** de:

1. Se despliegue el backend en **múltiples instancias** en paralelo (se necesita coordinación de la
   cola más allá de `SKIP LOCKED`).
2. El volumen de notificaciones exija **alto throughput** o reintentos con backoff sofisticados que el
   barrido simple no cubra.
3. Se requiera **push nativo** a móvil/web (app nativa o web-push con opt-in) → Firebase/FCM.
4. Se necesite programación **sub-minuto** o fan-out masivo que un cron in-process no sostenga.

---

## Referencias

- `apps/backend/src/modules/notifications/` — servicio, despachador, canales, entidades.
- `apps/backend/src/modules/garage/reminder-scheduler.service.ts` — cron + chequeo por vehículo.
- `apps/backend/src/modules/garage/maintenance-calc.ts` — algoritmo puro de próximo servicio.
- `apps/backend/src/database/migrations/1781137369809-AddNotifications.ts`
- [ADR-0001](./0001-search-engine-postgres-fts.md) — decisión análoga (Postgres FTS vs Elasticsearch).
