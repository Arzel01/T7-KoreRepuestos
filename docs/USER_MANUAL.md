# Manual de Usuario — Kore Repuestos

Guía para los dos roles del sistema: el **cliente** (propietario de vehículo) y el
**administrador**. La sección de cliente cubre el flujo completo: crear una cuenta, buscar
repuestos, gestionar el garaje y su mantenimiento, y finalizar con una **cotización** en PDF. La
sección de administrador cubre la gestión del catálogo que hoy tiene interfaz propia.

---

## 1. Crear una cuenta e iniciar sesión

1. Entra a la tienda y pulsa **Registrarse** (`/auth/register`).
2. Ingresa nombre, apellido, email y una contraseña (mínimo 8 caracteres, con mayúscula y número).
3. Al registrarte inicias sesión automáticamente. Para volver, usa **Iniciar sesión** (`/auth/login`).

Tu sesión se mantiene entre visitas. Si te desconecta, vuelve a iniciar sesión.

---

## 2. Buscar y explorar repuestos

- **Catálogo** (página principal `/`): navega por categorías, marca y modelo de vehículo.
- **Búsqueda** (`/search`): busca por nombre, SKU o descripción. Reconoce sinónimos y resalta las
  coincidencias.
- **Ficha del producto** (`/product/:id`): precio, stock, especificaciones técnicas, imágenes,
  compatibilidad con vehículos y productos relacionados.

Desde la ficha o el catálogo, pulsa **Agregar al carrito**.

---

## 3. Mi Garaje y mantenimiento (Módulo 3)

- **Garaje** (`/garage`): registra tus vehículos (alias, modelo, año, placa, kilometraje).
- **Plan de mantenimiento** (`/garage/dashboard`): según el kilometraje, el sistema muestra las
  tareas próximas o vencidas y los repuestos que requieren.
- **"Agregar todos los repuestos"**: añade de una sola vez al carrito todos los repuestos de una
  tarea de mantenimiento (respeta el stock disponible).
- **Recordatorios**: recibes avisos (en la app y, si está configurado, por email) cuando un servicio
  se acerca.

---

## 4. El carrito de compras (US#18–US#21)

Abre el carrito desde el ícono 🛒 de la barra superior (muestra un contador de artículos).

En **Mi carrito** (`/cart`) puedes:

- **Cambiar la cantidad** de cada línea con los botones **–** / **+** (no puedes superar el stock).
- **Eliminar** una línea (te pide confirmación).
- Ver el **resumen**: Subtotal, **IVA (18 %)** y **Total**.
- **Vaciar** el carrito por completo.

Un mismo producto nunca se duplica: si lo agregas otra vez, se suma a la línea existente.

Cuando estés listo, pulsa **Proceder a cotizar**.

---

## 5. Generar una cotización (US#22)

1. En **Resumen de tu cotización** (`/cart/summary`) revisa el detalle final y los totales.
2. Opcional: marca **"Enviarme la cotización por email"** para recibir el PDF en tu correo.
3. Pulsa **Generar cotización**.

Se crea un documento con un número único (`COT-AÑO-NNNNNN`) y una **fecha de validez** (15 días por
defecto). Tras generarla, tu carrito se vacía.

En la **vista previa de la cotización** (`/quotations/:id`) puedes:

- **Descargar PDF**: guarda el documento en tu dispositivo.
- **Enviar por email**: (re)envía el PDF a tu correo.
- **Seguir comprando**: vuelve al catálogo.

> El precio de cada repuesto queda **congelado** en la cotización: aunque cambie después en el
> catálogo, tu documento conserva el precio del momento en que lo generaste, hasta su fecha de validez.

### Estados de una cotización

- **Pendiente**: recién emitida.
- **Enviada**: se envió por email.
- **Expirada**: pasó su fecha de validez. Genera una nueva para obtener precios vigentes.

---

## 6. Preguntas frecuentes

**¿El total incluye IVA?** Sí. El total mostrado y el del PDF incluyen el IVA del 18 %.

**No me llegó el email de la cotización.** En entornos de demostración el envío puede estar
_simulado_ (la app te lo indica). Igual puedes **descargar el PDF** desde la vista previa.

**¿Puedo cotizar con el carrito vacío?** No: agrega al menos un repuesto antes de cotizar.

**¿Dónde veo mis cotizaciones anteriores?** El historial está disponible vía el API
(`GET /quotations`); la vista de historial en la UI se irá ampliando en próximas versiones.

---

# Parte 2 — Administrador

Guía para el rol **Administrador** (`UserRole.ADMINISTRADOR`). Cubre la gestión del catálogo, que
hoy tiene interfaz propia en el panel (`apps/web/src/features/products`, `/admin`). Todo lo listado
aquí corresponde a rutas de la API marcadas como acceso **Admin** en
[`docs/api/API_REFERENCE.md`](./api/API_REFERENCE.md) — si una acción no aparece en esa tabla como
`Admin`, no está restringida al administrador (por ejemplo, ver o generar una cotización es una
acción del cliente, no del admin).

## 7. Gestión de catálogo

- **Listado de productos** (`ProductsListPage`): búsqueda, edición y eliminación (soft delete —
  el producto pasa a `isActive = false`, no se borra de la base de datos).
- **Crear producto** (`ProductCreatePage`): datos base, precio, stock, categoría.
- **Editar producto** (`ProductEditPage`): además de los datos base, gestiona:
  - **Imágenes** (`ImageUploader`) — galería con arrastrar y soltar; cada imagen genera un
    thumbnail automáticamente.
  - **Ficha técnica** (`TechnicalSheetEditor`) — tabla de atributo/valor (ej. "Diámetro: 25mm"),
    con alta y baja de filas.
  - **Descripción** (`DescriptionEditor`) — editor de texto enriquecido.
  - **Compatibilidad de vehículos** — asocia el repuesto a los modelos que lo usan; esta
    compatibilidad es la que alimenta la búsqueda por kilometraje (US#11) y el plan de
    mantenimiento del cliente.

## 8. Categorías

- **Árbol de categorías** (`CategoriesPage`): CRUD completo sobre una estructura jerárquica
  (categoría padre/hijo). No se puede eliminar una categoría que todavía tenga subcategorías o
  productos asociados — hay que reasignarlos o eliminarlos primero.

## 9. Guías de mantenimiento

- Alta de guías de mantenimiento por modelo de vehículo (`POST /maintenance/guides`), que son la
  base del plan de mantenimiento y de la búsqueda de repuestos por kilometraje que ve el cliente.

## 10. Analítica de búsquedas

- Reporte de los términos que los clientes buscan en el catálogo (`GET /analytics/searches`),
  útil para detectar repuestos con demanda pero sin stock o sin buena cobertura de sinónimos.

## 11. Preguntas frecuentes (administrador)

**¿Por qué no puedo eliminar una categoría?** Tiene subcategorías o productos asociados —
reasígnalos primero.

**¿Eliminar un producto lo borra definitivamente?** No. Es un soft delete (`isActive = false`): el
producto deja de verse en el catálogo público pero se conserva en la base de datos, junto con el
historial de cotizaciones que ya lo incluyan.

**¿Puedo moderar o eliminar una review de un cliente?** No en la versión actual — la moderación de
reviews no tiene endpoint de administrador todavía; es una funcionalidad pendiente, no un permiso
oculto.
