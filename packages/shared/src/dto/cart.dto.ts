/**
 * Carrito de compras (Módulo 4 · US#18–US#20).
 *
 * El carrito vive en Postgres (`carrito_compras` + `items_carrito`, ver
 * [[project_real_db_schema]]): un carrito por usuario. El precio unitario NO se
 * persiste en `items_carrito` (la tabla real solo guarda cantidad); se toma del
 * `precio_base` vigente del producto al leer el carrito, y los totales se
 * calculan en el servidor para que el cliente nunca los invente.
 */

/** Impuesto general a las ventas (IGV/IVA Perú) aplicado al subtotal del carrito. */
export const IVA_RATE = 0.18;

export interface CartItemResponse {
  id: number;
  productId: number;
  sku: string;
  name: string;
  imageUrl?: string;
  /** Precio unitario vigente (`productos.precio_base`) al momento de la lectura. */
  unitPrice: number;
  quantity: number;
  /** Stock disponible del producto — permite avisar en UI si excede existencias. */
  stock: number;
  /** `unitPrice × quantity`. */
  lineTotal: number;
}

export interface CartResponse {
  id: number;
  items: CartItemResponse[];
  /** Suma de cantidades de todas las líneas (para el badge del ícono). */
  itemCount: number;
  /** Número de líneas distintas. */
  distinctCount: number;
  subtotal: number;
  /** Tasa de IVA aplicada (p. ej. 0.18). */
  taxRate: number;
  /** Monto de IVA sobre el subtotal. */
  tax: number;
  total: number;
  updatedAt: string;
}

export interface AddCartItemPayload {
  productId: number;
  /** Por defecto 1 si se omite. */
  quantity?: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

/** Alta masiva — usada por "Agregar todos los repuestos" desde el mantenimiento (US#5). */
export interface BulkAddCartPayload {
  items: AddCartItemPayload[];
}
