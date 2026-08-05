# Guion de pruebas de usabilidad — US#1 (Mi Garaje) y US#12 (Búsqueda avanzada)

**Sprint:** 6 · **Fecha:** 2026-08-04 · **Responsable:** JP
**Alcance:** registro/gestión de vehículos y búsqueda avanzada del catálogo (incluye las mejoras de
sinónimos, resaltado y búsquedas guardadas entregadas este sprint).

> Estado: **guion listo para ejecutar**. Las columnas _Resultado / Observaciones / Severidad_ se
> completan durante la sesión con cada participante. Meta: 3–5 participantes representativos
> (clientes que compran repuestos por su vehículo).

---

## Preparación

1. Backend arriba: `pnpm dev:backend` (con `DATABASE_URL` o Postgres local vía `pnpm db:up` +
   `pnpm --filter @kore/backend migration:run`).
2. Frontend arriba: `pnpm dev:web` (http://localhost:5173).
3. Datos: catálogo con productos (incluir al menos uno cuyo nombre contenga "pastillas" para probar
   el sinónimo con "balatas"), marcas/modelos sembrados (`pnpm --filter @kore/backend seed:vehicles`).
4. Cuenta de prueba de cliente disponible (o registrar una al inicio).
5. Grabar pantalla + pensar en voz alta. No guiar; anotar dudas y bloqueos.

## Métricas por tarea

- **Éxito:** ✅ sin ayuda · ⚠️ con ayuda/dudas · ❌ no completó.
- **Severidad del hallazgo:** 0 nulo · 1 cosmético · 2 menor · 3 mayor · 4 bloqueante.

---

## Escenarios

### US#1 — Mi Garaje

| #   | Tarea                         | Pasos esperados                                                                                      | Resultado | Observaciones | Sev. |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------- | --------- | ------------- | ---- |
| 1   | Registrar un vehículo         | Ir a _Mi Garaje_ → _Agregar_ → elegir marca, modelo (cascada), año, kilometraje → _Guardar Vehículo_ |           |               |      |
| 2   | Ver el vehículo en la lista   | La tarjeta aparece con marca/modelo/año/km y próximo servicio                                        |           |               |      |
| 3   | Editar kilometraje            | Abrir _Actualizar kilometraje_, subir el valor, guardar                                              |           |               |      |
| 4   | Intentar bajar el kilometraje | El sistema lo rechaza con mensaje claro                                                              |           |               |      |
| 5   | Editar y eliminar el vehículo | Editar alias/placa, guardar; luego eliminar y confirmar                                              |           |               |      |

### US#12 — Búsqueda avanzada

| #   | Tarea                             | Pasos esperados                                                             | Resultado | Observaciones | Sev. |
| --- | --------------------------------- | --------------------------------------------------------------------------- | --------- | ------------- | ---- |
| 6   | Buscar por texto con autocomplete | Escribir en la barra; elegir una sugerencia                                 |           |               |      |
| 7   | Buscar por sinónimo               | Buscar **"balatas"** y encontrar productos "pastillas…"                     |           |               |      |
| 8   | Ver el término resaltado          | En los resultados, el término aparece con resaltado (`<mark>`) en el nombre |           |               |      |
| 9   | Combinar filtros                  | Filtrar por vehículo compatible + categoría + rango de precio + en stock    |           |               |      |
| 10  | Guardar la búsqueda               | _Guardar_ en el panel de filtros, ponerle nombre                            |           |               |      |
| 11  | Re-aplicar una búsqueda guardada  | Limpiar filtros y volver a aplicar la guardada con un clic                  |           |               |      |
| 12  | Eliminar una búsqueda guardada    | Borrar la búsqueda de la lista                                              |           |               |      |

---

## Resultados agregados

- Participantes: ** / Tasa de éxito sin ayuda: ** %
- Tiempo medio por tarea (opcional): \_\_

## Hallazgos priorizados

| ID  | Escenario | Descripción | Severidad | Acción propuesta |
| --- | --------- | ----------- | --------- | ---------------- |
|     |           |             |           |                  |

## Conclusiones y próximos pasos

_(A completar tras la sesión: qué se aprobó, qué backlog nuevo genera.)_
