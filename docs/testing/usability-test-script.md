# Guion de prueba de usabilidad — NFR 3.3

5 usuarios representativos, tareas centrales (registro, búsqueda, agregar al carrito), SUS ≥ 70,
tasa de finalización > 90 %. Esto requiere sesiones reales — no es algo que se pueda inferir leyendo
el código. Este documento es el protocolo listo para correr esas sesiones.

## 1. Participantes

5 personas que no hayan visto el sistema antes, variando nivel técnico (el NFR pide esto
explícitamente: "independientemente de su nivel técnico"). Sugerido:

- 2 personas con perfil "cliente final" (compran repuestos, poco técnicas).
- 2 personas con perfil "asesor comercial" (usan sistemas de gestión a diario).
- 1 persona con perfil técnico (referencia, no representa al usuario típico).

## 2. Antes de empezar

- Grabar pantalla + audio (con consentimiento).
- Pedir que piensen en voz alta ("¿qué esperás que pase si tocás esto?").
- El facilitador no ayuda salvo que la persona esté completamente bloqueada > 2 min — anotarlo como
  fallo de tarea si eso ocurre.
- Cronometrar cada tarea desde que se lee la consigna hasta que la persona confirma que terminó.

## 3. Tareas

| #   | Tarea (consigna a leer en voz alta)                                | Éxito =                                               |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| 1   | "Creá una cuenta nueva con tu email."                              | Llega al dashboard/catálogo autenticado, sin ayuda.   |
| 2   | "Buscá un filtro de aceite para un vehículo a tu elección."        | Encuentra al menos un resultado relevante en < 2 min. |
| 3   | "Agregá ese repuesto al carrito y confirmá la cantidad."           | El carrito muestra el ítem con la cantidad correcta.  |
| 4   | "Registrá un vehículo en tu garaje."                               | El vehículo aparece en la lista de "Mi Garaje".       |
| 5   | "Encontrá cuándo le toca el próximo mantenimiento a ese vehículo." | Llega al calendario/plan y puede señalar la fecha.    |

Registrar por tarea: **completada / completada con ayuda / abandonada**, tiempo, y cualquier
comentario espontáneo.

## 4. Cuestionario SUS (después de las 5 tareas)

Escala 1 (muy en desacuerdo) a 5 (muy de acuerdo):

1. Creo que usaría este sistema con frecuencia.
2. Encontré el sistema innecesariamente complejo.
3. Pensé que el sistema era fácil de usar.
4. Creo que necesitaría ayuda de una persona técnica para usar este sistema.
5. Encontré que las funciones del sistema estaban bien integradas.
6. Pensé que había demasiada inconsistencia en el sistema.
7. Imagino que la mayoría de la gente aprendería a usar este sistema rápidamente.
8. Encontré el sistema muy incómodo de usar.
9. Me sentí muy seguro/a usando el sistema.
10. Necesité aprender muchas cosas antes de poder usar el sistema.

**Cálculo del puntaje SUS** (por persona):

- Ítems impares (1,3,5,7,9): puntaje − 1.
- Ítems pares (2,4,6,8,10): 5 − puntaje.
- Sumar los 10 valores resultantes (rango 0–40) × 2.5 → puntaje 0–100.
- Promediar los 5 puntajes individuales.

## 5. Criterios de éxito

| Métrica              | Objetivo                                                              |
| -------------------- | --------------------------------------------------------------------- |
| SUS promedio         | ≥ 70 ("Bueno" en la escala de adjetivos de Bangor et al.)             |
| Tasa de finalización | > 90 % de las 25 tareas (5 personas × 5 tareas) completadas sin ayuda |

## 6. Plantilla de registro

```
Participante: ____  Perfil: ____  Fecha: ____

Tarea 1 (Registro):        [ ] Completa  [ ] Con ayuda  [ ] Abandonada   Tiempo: ___s
Tarea 2 (Buscar filtro):   [ ] Completa  [ ] Con ayuda  [ ] Abandonada   Tiempo: ___s
Tarea 3 (Agregar carrito): [ ] Completa  [ ] Con ayuda  [ ] Abandonada   Tiempo: ___s
Tarea 4 (Registrar vehículo): [ ] Completa [ ] Con ayuda [ ] Abandonada Tiempo: ___s
Tarea 5 (Próximo mantenimiento): [ ] Completa [ ] Con ayuda [ ] Abandonada Tiempo: ___s

Comentarios espontáneos:
_______________________________________________

SUS (1-5 por ítem): 1:_ 2:_ 3:_ 4:_ 5:_ 6:_ 7:_ 8:_ 9:_ 10:_   → Puntaje: ___/100
```
