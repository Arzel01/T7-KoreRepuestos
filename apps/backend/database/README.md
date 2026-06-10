# Database — Kore Repuestos

Migraciones y semillas para PostgreSQL.

## Estructura

```
database/
├── migrations/
│   ├── 001_initial_schema.sql   ← esquema base (users, products, categories)
│   └── 002_add_sessions.sql     ← tabla sessions (refresh tokens)
└── seeds/
    ├── 001_admin_and_categories.sql ← usuario admin + categorías raíz
    └── 002_sample_products.sql      ← productos de muestra
```

## Cómo aplicar

### Entorno local (Docker)

El primer arranque del contenedor ejecuta automáticamente
`docker/postgres/init.sql`. Las migraciones de este directorio quedan como
fuente de verdad para producción y para CI.

```bash
docker compose up -d postgres
```

### Entorno productivo o BD ya inicializada

```bash
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME \
  -f apps/backend/database/migrations/001_initial_schema.sql \
  -f apps/backend/database/migrations/002_add_sessions.sql \
  -f apps/backend/database/seeds/001_admin_and_categories.sql \
  -f apps/backend/database/seeds/002_sample_products.sql
```

### Vía TypeORM CLI

```bash
pnpm --filter @kore/backend migration:run
```

## Credenciales seed

| Campo    | Valor              |
| -------- | ------------------ |
| Email    | `admin@kore.local` |
| Password | `ChangeMe123!`     |
| Rol      | `admin`            |

⚠️ Cambiar tras el primer login en cualquier entorno que no sea local.
