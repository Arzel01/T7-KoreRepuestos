# ADR-0001: Motor de búsqueda — PostgreSQL Full-Text Search

**Estado:** Aceptado  
**Fecha:** 2026-07-22  
**Autores:** equipo Kore Repuestos

---

## Contexto

El backlog de US#12 (Advanced Search) especificaba integrar **Elasticsearch** como motor de búsqueda avanzada para el catálogo de repuestos. La justificación original era contar con búsqueda full-text, fuzzy matching y filtros avanzados a escala.

Durante el Sprint 4/5 se implementó la búsqueda directamente sobre **PostgreSQL** (ya parte de la infraestructura del proyecto), aprovechando sus capacidades nativas antes de introducir una dependencia adicional. El resultado superó los requisitos funcionales del backlog sin necesidad de Elasticsearch.

---

## Decisión

Se adopta **PostgreSQL FTS (tsvector + websearch_to_tsquery) combinado con trigram word_similarity** como motor oficial de búsqueda avanzada para el catálogo de Kore Repuestos, en lugar de Elasticsearch.

---

## Justificación

| Criterio                                     | Elasticsearch                          | PostgreSQL FTS                                      |
| -------------------------------------------- | -------------------------------------- | --------------------------------------------------- |
| Búsqueda full-text en español                | Sí (analizador `spanish`)              | Sí (`websearch_to_tsquery('spanish', ...)`)         |
| Fuzzy / tolerancia a typos                   | Sí (Levenshtein nativo)                | Sí (`word_similarity` de pg_trgm, umbral 0.25)      |
| Filtros combinados (precio, stock, vehículo) | Sí                                     | Sí (WHERE + EXISTS subquery sobre `compatibilidad`) |
| Ranking por relevancia                       | Sí (`_score`)                          | Sí (`ts_rank` + `word_similarity`)                  |
| Autocomplete                                 | Sí                                     | Sí (prefix ILIKE + word_similarity)                 |
| Infraestructura adicional                    | Elasticsearch cluster (RAM, ops, sync) | Ninguna — misma BD                                  |
| Latencia típica (dataset < 100 k productos)  | ~10–50 ms                              | ~5–30 ms (índices GIN + GiST ya creados)            |
| Operación                                    | Alta (sincronización, snapshots, etc.) | Cero — incluida en backup de PostgreSQL             |
| Costo                                        | Alto                                   | Cero                                                |

**Conclusión:** para el tamaño actual del dataset (miles de productos) y la infraestructura existente (PostgreSQL en Docker Compose / Supabase), PostgreSQL FTS es **funcionalmente equivalente** a Elasticsearch y elimina la complejidad operativa.

---

## Implementación real vs. backlog US#12

| Tarea del backlog                              | Implementación                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| "Full-text search con Elasticsearch"           | `tsvector` (columna `search_vector`) + `websearch_to_tsquery('spanish')` en `products.repository.ts:findCatalog()` |
| "Fuzzy matching / tolerancia a typos"          | `word_similarity(search, nombre) >= 0.25` via extensión `pg_trgm`                                                  |
| "Filtros avanzados (categoría, precio, stock)" | Parámetros `categoryIds`, `minPrice`, `maxPrice`, `inStock` en `QueryProductsDto`                                  |
| "Filtro por compatibilidad de vehículo"        | `EXISTS (SELECT 1 FROM compatibilidad JOIN modelos JOIN marcas ...)`                                               |
| "Ranking por relevancia"                       | `ORDER BY ts_rank DESC, word_similarity DESC`                                                                      |
| "Autocomplete"                                 | `GET /products/suggestions` → `findSuggestions()` con prefix ILIKE + word_similarity                               |
| "Página dedicada /search"                      | `AdvancedSearchPage.tsx` (Sprint 5)                                                                                |
| "Analytics de búsquedas"                       | Tabla `busquedas_log`, `SearchAnalyticsService`, `GET /analytics/searches`                                         |

---

## Consecuencias

**Positivas:**

- Sin operación adicional: la BD se respalda, escala y monitorea junto con el resto del stack.
- Latencia predecible en el dataset actual.
- El índice `search_vector` (GIN) ya existe en la tabla `productos`; los índices GiST para trigrams también.
- Toda la lógica de filtrado y ranking está en un solo lugar (PostgreSQL), simplificando el debugging.

**Negativas / limitaciones:**

- Para datasets > 1 M productos con búsquedas complejas (sinónimos, facets, ML ranking), PostgreSQL FTS puede quedarse corto.
- No hay soporte nativo de sinónimos del dominio automotriz (ej. "pastillas" = "balatas").
- Highlighting de términos en resultados requiere `ts_headline()`, no implementado aún.

---

## Trigger de reevaluación

Migrar a Elasticsearch (o Typesense/Meilisearch) cuando se cumpla **cualquiera** de:

1. El catálogo supere **500 000 productos activos** y las queries de búsqueda excedan 200 ms p95.
2. Se requieran **sinónimos del dominio** configurables sin despliegue (ej. panel de admin de sinónimos).
3. Se necesite **ranking personalizado por ML** (LTR — Learning to Rank).
4. La latencia de `websearch_to_tsquery` supere el SLA acordado con el negocio.

---

## Referencias

- `apps/backend/src/modules/products/products.repository.ts` — `findCatalog()`, `findSuggestions()`
- `apps/backend/src/modules/products/dto/query-products.dto.ts` — parámetros de búsqueda
- `apps/backend/src/modules/analytics/search-analytics.service.ts` — logging de búsquedas
- PostgreSQL docs: [Full Text Search](https://www.postgresql.org/docs/current/textsearch.html), [pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
