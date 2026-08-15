# Manual de Usuario — Kore Repuestos

Guía completa de uso del sistema para los **tres roles** existentes: **Cliente** (propietario de
vehículo), **Asesor Comercial** y **Administrador**. Describe, pantalla por pantalla, qué puede hacer
cada rol, cómo hacerlo y qué esperar del sistema en cada paso — incluyendo casos borde, mensajes de
error habituales y preguntas frecuentes.

---

## Tabla de contenidos

**Introducción**

- [0. Roles del sistema](#0-roles-del-sistema)

**Parte 1 — Cliente**

1. [Crear una cuenta e iniciar sesión](#1-crear-una-cuenta-e-iniciar-sesión)
2. [Catálogo y búsqueda](#2-catálogo-y-búsqueda)
3. [Ficha de producto](#3-ficha-de-producto)
4. [Mi Garaje](#4-mi-garaje)
5. [Plan de mantenimiento](#5-plan-de-mantenimiento)
6. [Notificaciones](#6-notificaciones)
7. [El carrito de compras](#7-el-carrito-de-compras)
8. [Generar una cotización](#8-generar-una-cotización)
9. [Preguntas frecuentes (cliente)](#9-preguntas-frecuentes-cliente)

**Parte 2 — Asesor Comercial** 10. [Acceso y funciones del Asesor Comercial](#10-acceso-y-funciones-del-asesor-comercial)

**Parte 3 — Administrador** 11. [Gestión de catálogo](#11-gestión-de-catálogo) 12. [Categorías](#12-categorías) 13. [Guías de mantenimiento](#13-guías-de-mantenimiento) 14. [Analítica de búsquedas](#14-analítica-de-búsquedas) 15. [Preguntas frecuentes (administrador)](#15-preguntas-frecuentes-administrador)

**Apéndice** 16. [Glosario y estados](#16-glosario-y-estados)

---

## 0. Roles del sistema

El sistema tiene tres roles, cada uno con acceso a partes distintas de la aplicación. El backend
impone estos permisos a nivel de API (no son solo restricciones visuales): intentar acceder a una
acción fuera del rol propio devuelve un error `403 Forbidden`.

| Rol                  | Qué es                                                | Dónde entra                                                                                                                                      |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Cliente**          | Propietario de vehículo, usuario final de la tienda.  | Sitio público: catálogo (`/`), garaje (`/garage`), carrito, cotizaciones.                                                                        |
| **Asesor Comercial** | Personal comercial que da seguimiento a cotizaciones. | Panel de administración (`/admin`) — solo Dashboard y Cotizaciones, sin gestión de catálogo.                                                     |
| **Administrador**    | Gestiona el catálogo completo del negocio.            | Panel de administración (`/admin`) — acceso total: productos, categorías, guías de mantenimiento, analítica, además de Dashboard y Cotizaciones. |

Toda acción documentada en este manual como **"Admin"** en la referencia de API
([`docs/api/API_REFERENCE.md`](./api/API_REFERENCE.md)) está restringida exclusivamente al rol
Administrador — el Asesor Comercial, pese a entrar también al panel `/admin`, no tiene esos permisos
en el backend aunque la barra lateral le oculte esas secciones.

---

# Parte 1 — Cliente

## 1. Crear una cuenta e iniciar sesión

### Registro

1. Entra a la tienda y pulsa **Registrarse** (`/auth/register`).
2. Completa el formulario: nombre, apellido, correo electrónico y contraseña.
   - La contraseña debe tener **mínimo 8 caracteres**, incluir al menos una **mayúscula** y un
     **número**. Si no cumple el requisito, el formulario lo indica antes de enviar.
   - El correo debe ser único en el sistema: si ya existe una cuenta con ese email, el registro se
     rechaza con un mensaje claro (no revela si el email existe por otra vía, por seguridad).
3. Al registrarte, la sesión se inicia **automáticamente** — no hace falta volver a loguearse después
   de crear la cuenta.

### Inicio de sesión

1. Pulsa **Iniciar sesión** (`/auth/login`) e ingresa correo y contraseña.
2. Si las credenciales son incorrectas, verás un mensaje de error genérico ("credenciales inválidas")
   — el sistema no distingue entre "el email no existe" y "la contraseña es incorrecta", para no dar
   pistas a quien intente adivinar cuentas.

### Persistencia de la sesión

Tu sesión se mantiene entre visitas (el sistema usa un _access token_ de corta duración y un
_refresh token_ de mayor duración que la renueva automáticamente en segundo plano). Si en algún
momento el sistema te desconecta —por ejemplo, tras mucho tiempo de inactividad—, simplemente vuelve
a iniciar sesión.

### Cerrar sesión

Usa la opción **Cerrar sesión** en el menú de usuario. Esto invalida la sesión activa en el servidor,
no solo borra el token localmente en tu navegador.

---

## 2. Catálogo y búsqueda

### Catálogo (página principal, `/`)

Navega el catálogo completo de repuestos, filtrando por **categoría**, **marca** y **modelo de
vehículo**. Los resultados están paginados. Cada producto muestra imagen principal, nombre, precio y
disponibilidad de stock a simple vista.

### Búsqueda avanzada (`/search`)

- Busca por **nombre, SKU o descripción**. El motor de búsqueda reconoce **sinónimos** (p. ej. buscar
  "balatas" también encuentra productos catalogados como "pastillas de freno") y **resalta las
  coincidencias** encontradas en el texto.
- Mientras escribes, aparecen **sugerencias de autocompletado** basadas en el catálogo real.
- **Búsquedas guardadas**: guarda una combinación de término + filtros que uses seguido (por ejemplo,
  "filtros de aceite para tu modelo de auto") para no tener que rearmarla cada vez. Puedes eliminarla
  cuando ya no la necesites.

> El motor de búsqueda usa PostgreSQL nativo (Full-Text Search), no un servicio externo — por eso los
> resultados están siempre disponibles sin depender de infraestructura adicional.

---

## 3. Ficha de producto

En la **ficha del producto** (`/product/:id`) encuentras:

- **Precio y stock** disponible en este momento.
- **Imágenes**: galería con la imagen principal destacada.
- **Especificaciones técnicas**: tabla de atributo/valor cargada por el administrador (p. ej.
  "Diámetro: 25mm").
- **Compatibilidad con vehículos**: qué marcas/modelos usan este repuesto — es la misma información
  que alimenta la búsqueda por kilometraje y tu plan de mantenimiento (ver sección 5).
- **Productos relacionados** y **"Frecuentemente comprados juntos"**: sugerencias basadas en el
  catálogo y en patrones de compra, para no olvidar un repuesto complementario.
- **Reseñas (reviews)**:
  - Lee las reseñas de otros clientes, con su calificación en estrellas (1 a 5).
  - **Publica tu propia reseña**: elige una calificación (obligatoria, no puedes enviar con 0
    estrellas), agrega un título opcional y tu comentario.
  - Marca una reseña de otro cliente como **"útil"** si te ayudó a decidir.

Desde la ficha del producto (o directamente desde el catálogo), pulsa **Agregar al carrito**.

---

## 4. Mi Garaje

**Garaje** (`/garage`) es donde registras y administras tus vehículos.

### Registrar un vehículo

1. Pulsa **Agregar vehículo**.
2. Selecciona **marca**, luego **modelo** (la lista de modelos depende de la marca elegida) y **año**.
3. Ingresa el **kilometraje actual** (obligatorio — es la base de todo el cálculo de mantenimiento).
4. Opcional: dale un **alias** al vehículo (p. ej. "Mi Carro") para identificarlo fácilmente si tienes
   más de uno.

### Editar y eliminar

Cada vehículo se muestra como una tarjeta con sus datos. Desde ahí puedes **editar** los datos del
vehículo o **eliminarlo** del garaje.

### Actualizar kilometraje

Mantén el kilometraje al día: cada vez que lo actualizas, el sistema **recalcula automáticamente**
qué tareas de mantenimiento están próximas a vencer o ya vencidas — es el disparador principal del
plan de mantenimiento (sección 5).

### Bitácora del vehículo

Registra eventos relevantes del vehículo (servicios realizados fuera del sistema, incidencias,
notas) para llevar un historial completo, no solo lo que gestionas dentro de la app.

### Calendario de servicios

Vista de calendario (`/garage/:vehicleId/calendar`) con los servicios de mantenimiento programados y
su fecha/kilometraje estimado, mes a mes.

---

## 5. Plan de mantenimiento

**Panel de mantenimiento** (`/garage/dashboard`): según el kilometraje actual de cada vehículo, el
sistema muestra:

- **Tareas próximas** — se acercan a su punto de servicio.
- **Tareas vencidas** — ya deberían haberse realizado.
- Los **repuestos específicos** que requiere cada tarea, con su costo estimado.

### Agregar todos los repuestos de una tarea

Junto a cada tarea de mantenimiento hay un botón **"Agregar todos los repuestos"**: añade de una sola
vez, al carrito, todos los repuestos que esa tarea necesita — respetando el stock disponible (si un
repuesto no tiene stock suficiente, no se agrega esa línea y el sistema te lo indica).

### Marcar una tarea como completada

Cuando realizas el servicio (dentro o fuera del sistema), márcalo como completado. Esto:

- Registra el evento en tu **historial de mantenimiento**.
- Actualiza el cálculo de próximo vencimiento de esa tarea a partir del kilometraje/fecha actual.

### Historial de mantenimiento

Consulta todos los servicios que has marcado como completados, con fecha y kilometraje al momento de
realizarlos.

---

## 6. Notificaciones

El ícono de campana en la barra superior muestra un **contador de notificaciones sin leer**.

### Centro de notificaciones

Lista el historial de notificaciones que te ha enviado el sistema — principalmente avisos de
mantenimiento próximo a vencer. Marca cada una como leída al revisarla.

### Preferencias

Configura:

- **Canal**: notificación dentro de la app, por email, o ambos.
- **Días de anticipación**: con cuántos días de antelación quieres que se te avise antes de que
  venza un servicio (por defecto, 7 días).

### Notificaciones push del navegador

Si tu dispositivo y navegador lo soportan, puedes activar **notificaciones push** para recibir avisos
incluso con la app cerrada. Requiere que el sitio se sirva de forma segura (HTTPS) — en un entorno de
desarrollo local funciona igual sin certificado. Si el administrador del sistema no ha configurado
esta función en el servidor, el interruptor de notificaciones push permanecerá deshabilitado sin que
eso afecte al resto de la app.

> Si el email de recordatorio no te llega en un entorno de demostración, es normal: el envío puede
> estar simulado (ver la nota equivalente en la sección de cotizaciones, punto 9).

---

## 7. El carrito de compras

Abre el carrito desde el ícono 🛒 de la barra superior — muestra un contador con la cantidad de
artículos.

En **Mi carrito** (`/cart`) puedes:

- **Cambiar la cantidad** de cada línea con los botones **–** / **+**. No puedes superar el stock
  disponible del producto — el sistema lo bloquea antes de dejarte pasar ese límite.
- **Eliminar una línea** individual (pide confirmación antes de borrarla).
- **Vaciar el carrito** por completo.
- Ver el **resumen**: **Subtotal**, **IVA (15 %)** y **Total** — estos cálculos siempre se hacen en el
  servidor, nunca en tu navegador, así que el total que ves es siempre el real y consistente.

Un mismo producto **nunca se duplica** como línea separada: si lo agregas de nuevo (desde la ficha, el
catálogo o "Agregar todos los repuestos"), su cantidad se suma a la línea ya existente.

Cuando estés conforme con tu selección, pulsa **Proceder a cotizar**.

---

## 8. Generar una cotización

1. En **Resumen de tu cotización** (`/cart/summary`) revisa el detalle final: línea por línea,
   subtotal, IVA y total.
2. Opcional: marca **"Enviarme la cotización por email"** para recibir el PDF directamente en tu
   correo, además de poder descargarlo desde la app.
3. Pulsa **Generar cotización**.

Al generarla:

- Se crea un documento con un **número único** con formato `COT-AÑO-NNNNNN` (p. ej.
  `COT-2026-000042`).
- Se le asigna una **fecha de validez** (15 días por defecto desde la emisión).
- Tu **carrito se vacía** automáticamente.

### Vista previa de la cotización

En `/quotations/:id` puedes:

- **Descargar el PDF**: guarda el documento en tu dispositivo. La descarga requiere que hayas
  iniciado sesión (no es un enlace público que cualquiera pueda abrir) — solo tú puedes descargar
  tus propias cotizaciones.
- **Enviar por email**: (re)envía el PDF a tu correo cuando lo necesites, sin límite de veces.
- **Seguir comprando**: vuelve al catálogo para continuar agregando repuestos a un carrito nuevo.

> **El precio de cada repuesto queda "congelado" en la cotización.** Aunque el precio cambie después
> en el catálogo, tu documento conserva el precio vigente en el momento en que la generaste, hasta su
> fecha de validez — así lo que cotizaste es exactamente lo que puedes esperar pagar si decides
> concretar la compra dentro de ese plazo.

### Estados de una cotización

| Estado        | Significado                                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Pendiente** | Recién emitida, aún dentro de su fecha de validez.                                                                                                                                                                                   |
| **Enviada**   | Se envió por email al menos una vez.                                                                                                                                                                                                 |
| **Aceptada**  | La cotización fue aceptada (seguimiento comercial — ver sección 10).                                                                                                                                                                 |
| **Rechazada** | La cotización fue rechazada (seguimiento comercial — ver sección 10).                                                                                                                                                                |
| **Expirada**  | Pasó su fecha de validez. El sistema la marca como expirada automáticamente en la vista, aunque en el registro interno siga figurando como "Pendiente" hasta ese cálculo. Genera una nueva cotización para obtener precios vigentes. |

---

## 9. Preguntas frecuentes (cliente)

**¿El total incluye IVA?**
Sí. Tanto el total que ves en pantalla como el del PDF incluyen el IVA del 15 %.

**No me llegó el email de la cotización o del recordatorio de mantenimiento.**
En entornos de demostración o desarrollo, el envío de correo puede estar **simulado** — la app se
comporta igual (el PDF se genera, el flujo se completa) pero el correo no sale realmente porque el
entorno no tiene un servidor de correo configurado. De todas formas puedes **descargar el PDF** desde
la vista previa de la cotización en cualquier momento.

**¿Puedo cotizar con el carrito vacío?**
No: agrega al menos un repuesto antes de proceder a cotizar. Si lo intentas con el carrito vacío, el
sistema lo rechaza con un mensaje claro.

**¿Dónde veo mis cotizaciones anteriores?**
El historial completo está disponible a través del sistema; la vista dedicada de "historial de
cotizaciones" en pantalla se irá ampliando en próximas versiones — mientras tanto, guarda el enlace de
cada cotización o su PDF descargado si necesitas volver a consultarla.

**¿Puedo editar una cotización ya generada?**
No. Una cotización es un documento congelado en el momento de su emisión. Si necesitas cambiar algo,
genera una cotización nueva desde un carrito nuevo.

**¿Qué pasa si el kilometraje de mi vehículo baja (lo actualizo por error a un valor menor)?**
El plan de mantenimiento recalcula tareas próximas/vencidas en base al kilometraje que registres —
mantén el dato lo más preciso posible para que los recordatorios sean confiables.

**¿Cómo sé si una notificación push realmente está activa?**
El interruptor de notificaciones push en tus preferencias refleja el estado real de tu suscripción en
ese navegador/dispositivo. Si cambias de navegador o dispositivo, debes activarla de nuevo en cada
uno por separado.

---

# Parte 2 — Asesor Comercial

## 10. Acceso y funciones del Asesor Comercial

El rol **Asesor Comercial** entra al mismo panel de administración (`/admin`) que el Administrador,
pero con acceso limitado a dos secciones:

- **Dashboard** (`/admin`): panel principal con indicadores generales del negocio.
- **Cotizaciones** (`/admin/quotations`): listado de **todas** las cotizaciones emitidas por los
  clientes del sistema — no solo las propias, ya que el rol existe justamente para dar seguimiento
  comercial a lo que los clientes van cotizando (contactarlos, resolver dudas, dar curso a una venta).

El resto de secciones del panel (Productos, Categorías, Guías de mantenimiento, Analítica) **no
aparecen** en la barra lateral para este rol, y si se intenta acceder a sus rutas de API
directamente, el backend responde `403 Forbidden` — la restricción no es solo de interfaz.

---

# Parte 3 — Administrador

El rol **Administrador** tiene acceso completo al panel (`/admin`): todo lo del Asesor Comercial
(sección 10) más la gestión completa del catálogo y las herramientas operativas descritas a
continuación. Todo lo listado aquí corresponde a rutas de la API marcadas como **Admin** en
[`docs/api/API_REFERENCE.md`](./api/API_REFERENCE.md) — si una acción no aparece en esa tabla como
`Admin`, no está restringida al administrador (por ejemplo, ver o generar una cotización es una
acción del cliente, no del admin; y ver el listado de todas las cotizaciones también la puede hacer
el Asesor Comercial, no es exclusiva del Administrador).

## 11. Gestión de catálogo

- **Listado de productos** (`/admin/products`): búsqueda, edición y eliminación. Eliminar un producto
  es un **soft delete** — pasa a `isActive = false` y desaparece del catálogo público, pero **no se
  borra de la base de datos** (se conserva, entre otras cosas, para no romper el historial de
  cotizaciones que ya lo incluyan).
- **Crear producto** (`/admin/products/new`): datos base (nombre, SKU, descripción), precio, stock y
  categoría.
- **Editar producto** (`/admin/products/:id/edit`): además de los datos base, gestiona:
  - **Imágenes**: galería con **arrastrar y soltar**; cada imagen sube al servidor y genera
    automáticamente una miniatura (thumbnail).
  - **Ficha técnica**: tabla de atributo/valor (ej. "Diámetro: 25mm"), con alta y baja de filas.
  - **Descripción**: editor de texto enriquecido.
  - **Compatibilidad de vehículos**: asocia el repuesto a los modelos que lo usan. Esta
    compatibilidad es la misma información que alimenta la búsqueda por kilometraje del cliente
    (`/maintenance/parts`) y su plan de mantenimiento — mantenerla completa y correcta es lo que hace
    que esas funciones den resultados útiles.

## 12. Categorías

- **Árbol de categorías** (`/admin/categories`): CRUD completo sobre una estructura jerárquica
  (categoría padre/hijo).
- **No se puede eliminar** una categoría que todavía tenga subcategorías o productos asociados: hay
  que reasignarlos o eliminarlos primero. El sistema bloquea el intento con un mensaje explicando
  por qué.

## 13. Guías de mantenimiento

- **Listado** (`/admin/maintenance`) y **alta** (`/admin/maintenance/new`) de guías de mantenimiento
  por modelo de vehículo.
- Estas guías son la **base** tanto del plan de mantenimiento que ve el cliente en su garaje (sección 5) como de la búsqueda de repuestos por kilometraje. Cargar guías completas y con los repuestos
  correctos asociados es lo que hace que el sistema pueda calcular tareas y costos con precisión para
  cada cliente.

## 14. Analítica de búsquedas

- **Reporte de búsquedas** (`/admin/analytics`): términos que los clientes buscan en el catálogo.
- Útil para detectar **demanda insatisfecha**: repuestos que los clientes buscan con frecuencia pero
  que no tienen stock, o búsquedas que no encuentran buenos resultados por falta de sinónimos
  cargados — ambas son señales para ajustar inventario o mejorar los datos del catálogo.

## 15. Preguntas frecuentes (administrador)

**¿Por qué no puedo eliminar una categoría?**
Tiene subcategorías o productos asociados — reasígnalos o elimínalos primero.

**¿Eliminar un producto lo borra definitivamente?**
No. Es un soft delete (`isActive = false`): el producto deja de verse en el catálogo público pero se
conserva en la base de datos, junto con el historial de cotizaciones que ya lo incluyan.

**¿Puedo moderar o eliminar una reseña de un cliente?**
No en la versión actual — la moderación de reseñas no tiene endpoint de administrador todavía; es una
funcionalidad pendiente, no un permiso oculto en algún lugar de la interfaz.

**¿Cuál es la diferencia entre mi rol y el de Asesor Comercial?**
El Asesor Comercial solo ve Dashboard y Cotizaciones. El Administrador ve además Productos,
Categorías, Guías de mantenimiento y Analítica. Ambos entran al mismo panel `/admin`, pero el backend
aplica el límite real por rol, no solo la interfaz.

**¿Cómo sé si el motor de recomendaciones/"comprados juntos" está funcionando bien?**
Se alimenta del historial de compras/cotizaciones y de la compatibilidad de vehículos que cargas en
cada producto — cuanta más compatibilidad y ficha técnica completa tenga el catálogo, más precisas
serán las sugerencias que ven los clientes.

---

## 16. Glosario y estados

| Término                   | Significado                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Soft delete**           | Eliminación lógica: el registro se marca inactivo (`isActive = false`) pero permanece en la base de datos.                      |
| **SKU**                   | Código único que identifica a un producto en el catálogo.                                                                       |
| **Compatibilidad**        | Relación entre un producto y los modelos de vehículo que lo usan; alimenta búsqueda por kilometraje y el plan de mantenimiento. |
| **Guía de mantenimiento** | Conjunto de tareas y repuestos asociados a un modelo de vehículo, base del cálculo del plan de mantenimiento de cada cliente.   |
| **Cotización**            | Documento con número único (`COT-AÑO-NNNNNN`) generado a partir del carrito, con precios congelados y fecha de validez.         |
| **Estados de cotización** | Pendiente → Enviada / Aceptada / Rechazada; o Expirada si pasó su fecha de validez sin importar el estado interno.              |
| **IVA**                   | 15 %, siempre calculado en el servidor e incluido en el total mostrado y en el PDF.                                             |
| **Notificación push**     | Aviso del navegador que llega incluso con la app cerrada; requiere HTTPS y que el usuario la active explícitamente.             |
| **Asesor Comercial**      | Rol con acceso al panel de administración limitado a Dashboard y Cotizaciones (todas las de todos los clientes).                |
| **Administrador**         | Rol con acceso completo al panel de administración, incluida la gestión del catálogo.                                           |
