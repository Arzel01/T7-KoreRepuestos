# ADR-0005: Base de datos y hosting — PostgreSQL gestionado por Supabase

**Estado:** Aceptado (documentado retroactivamente)
**Fecha:** 2026-08-11
**Autores:** equipo Kore Repuestos (reconstruido a partir del código y `docker-compose.yml`)

---

## Contexto

El backlog de **Sprint 0** incluía "Select database" (SR, 3h) y "Setup local database instance" (SR,
3h), pero, igual que la elección de framework ([ADR-0004](./0004-backend-framework-nestjs.md)),
nunca quedó documentada como ADR.

Hay además evidencia de un **pivote real no documentado**: el propio `docker-compose.yml` del
repositorio trae el comentario _"La base de datos PostgreSQL ahora es externa (Supabase)"_, y el
archivo actual solo levanta `pgadmin` bajo el perfil `tools` — no define ningún servicio `postgres`.
Sin embargo, `package.json` conserva los scripts `db:up`, `db:down`, `db:reset` y `db:logs`, que
invocan `docker compose ... postgres`, un servicio que **ya no existe** en `docker-compose.yml`. Es
decir: el proyecto empezó (o al menos planificó) con Postgres local vía Docker Compose y migró a
Supabase administrado en algún punto posterior a Sprint 0, sin que el tooling se terminara de
limpiar ni la decisión quedara registrada.

---

## Decisión

Se adopta **PostgreSQL gestionado por Supabase** como base de datos del proyecto (conexión directa
por el puerto 5432 para TypeORM/migraciones; pooler de transacciones por el puerto 6543 para
despliegues serverless), en lugar de un PostgreSQL autoalojado vía Docker Compose.

---

## Justificación

| Criterio                                         | Docker Compose local (autoalojado)                                              | **Supabase gestionado (elegido)**                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Setup para un integrante nuevo                   | `docker compose up`, esperar a que el contenedor esté sano, correr migraciones  | Solo copiar `DATABASE_URL` desde el dashboard — cero contenedores de base de datos                                                   |
| Backups                                          | Responsabilidad del equipo (no presupuestada en el backlog)                     | Automáticos, gestionados por Supabase                                                                                                |
| Storage de imágenes de producto                  | Requiere un servicio aparte (S3, MinIO) no contemplado en el backlog original   | Supabase Storage incluido, mismo proveedor que la BD                                                                                 |
| Paridad dev/staging/producción                   | Alta solo si los tres entornos también son self-hosted (esfuerzo de ops propio) | Alta — mismo Supabase, distinta `DATABASE_URL` por entorno                                                                           |
| Vendor lock-in                                   | Ninguno                                                                         | Bajo — sigue siendo PostgreSQL estándar; TypeORM y las migraciones no saben que es Supabase, migrar es cambiar una connection string |
| Curva de operación para un equipo académico de 5 | Deben operar Postgres, TLS, backups, alta disponibilidad                        | Cero operación de base de datos — tiempo dedicado a features, no a infraestructura                                                   |
| Costo                                            | Cero en desarrollo (hasta pagar hosting real de producción)                     | Free tier con límites, luego de pago                                                                                                 |

**Conclusión:** para un equipo de 5 estudiantes con una duración de proyecto fija (9 sprints), el
tiempo que se ahorra en operación de base de datos (backups, TLS, disponibilidad) pesa más que el
control adicional de un Postgres autoalojado. El lock-in real es bajo porque Supabase es PostgreSQL
estándar sin extensiones propietarias usadas por el proyecto.

---

## Consecuencias

**Positivas:**

- Cero horas de operación de base de datos presupuestadas ni gastadas.
- Supabase Storage resuelve la subida de imágenes de producto (`Setup file upload service`, Sprint 2) sin añadir un tercer proveedor.
- Migraciones TypeORM (`migrationsRun: true`) corren igual contra Supabase que contra cualquier
  Postgres — sin acoplamiento de código al proveedor.

**Negativas / limitaciones:**

- Dependencia de la disponibilidad de un tercero.
- **Deuda de tooling sin resolver:** los scripts `db:up` / `db:down` / `db:reset` / `db:logs` de
  `package.json` referencian un servicio `postgres` que `docker-compose.yml` ya no define — hoy
  fallan si se ejecutan. Deben eliminarse (si nadie necesita un Postgres local) o repropósitarse
  para levantar un Postgres efímero de desarrollo/test (el mismo patrón que ya usa
  `.github/workflows/ci.yml` para las pruebas de backend), no dejarse apuntando a un servicio
  inexistente.

---

## Trigger de reevaluación

Migrar a PostgreSQL autoalojado (RDS, Docker en una VM propia) si el proyecto pasa de contexto
académico a producción con requisitos de soberanía de datos, SLA propio, o costo de Supabase que
deje de ser sostenible a la escala de datos real. El cambio es de infraestructura (connection
string), no de código: TypeORM y las migraciones no cambian.

---

## Referencias

- `docker-compose.yml` — comentario de migración a Supabase, servicio `pgadmin` bajo perfil `tools`.
- `package.json` — scripts `db:up`/`db:down`/`db:reset`/`db:logs` (huérfanos, ver limitaciones).
- `apps/backend/.env.example`, `CONTEXT.md` — variables `DATABASE_URL` / `DATABASE_TRANSACTION_URL`.
- [ADR-0004](./0004-backend-framework-nestjs.md) — decisión de framework tomada en el mismo Sprint 0, con el mismo vacío de documentación hasta ahora.
