# Manual de Usuario — Kore Repuestos

Guía para el **cliente** de la tienda de repuestos Kore. Cubre el flujo completo: crear una cuenta,
buscar repuestos, gestionar el garaje y su mantenimiento, y finalizar con una **cotización** en PDF.

> Los administradores tienen un panel aparte (`/admin`) que no se documenta aquí.

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
