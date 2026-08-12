/**
 * Cotizaciones (Módulo 4 · US#21–US#22 · Sprint 8).
 *
 * Una cotización es una "foto" del carrito en el momento de emitirla: persiste
 * en `cotizaciones` + `detalle_cotizacion` (ver [[project_real_db_schema]]) y
 * congela el precio unitario de cada línea (`precio_unitario`) para que un
 * cambio posterior de `productos.precio_base` no altere un documento ya emitido.
 *
 * Los totales (subtotal, IVA, total) NO se guardan en la tabla real: se
 * recalculan en el servidor a partir de las líneas usando la misma tasa de IVA
 * que el carrito ([[cart.dto]] · `IVA_RATE`). El PDF y el email se generan a
 * partir de esta misma estructura.
 */

/** Estados posibles de una cotización (columna `estado`). */
export enum QuotationStatus {
  PENDIENTE = 'Pendiente',
  ENVIADA = 'Enviada',
  ACEPTADA = 'Aceptada',
  RECHAZADA = 'Rechazada',
  EXPIRADA = 'Expirada',
}

/**
 * Resumen ligero del carrito (US#21 · GET /cart/summary).
 *
 * Pensado para la barra de navegación / el paso previo a cotizar: devuelve solo
 * los totales y contadores, sin el detalle de líneas, para ser barato de pedir.
 */
export interface CartSummaryResponse {
  itemCount: number;
  distinctCount: number;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  /** `true` si hay al menos una línea (habilita el botón "Proceder a cotizar"). */
  canQuote: boolean;
  updatedAt: string | null;
}

/** Línea de una cotización (`detalle_cotizacion`). */
export interface QuotationItemResponse {
  id: number;
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  /** Precio unitario congelado al emitir la cotización. */
  unitPrice: number;
  /** `unitPrice × quantity`. */
  lineTotal: number;
}

/** Cotización completa devuelta por el API (con totales calculados). */
export interface QuotationResponse {
  id: number;
  /** Correlativo legible, p. ej. `COT-2026-000042`. */
  number: string;
  status: QuotationStatus;
  /** Datos del cliente, para encabezar el PDF/email. */
  customer: {
    id: number;
    name: string;
    email: string;
  };
  items: QuotationItemResponse[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  issuedAt: string;
  /** Fecha hasta la que la cotización es válida (ISO). */
  validUntil: string;
  /** `true` si `validUntil` ya pasó respecto de ahora. */
  expired: boolean;
}

/** Resumen de cotización para listados (sin líneas). */
export interface QuotationSummaryResponse {
  id: number;
  number: string;
  status: QuotationStatus;
  total: number;
  itemCount: number;
  issuedAt: string;
  validUntil: string;
  expired: boolean;
  /**
   * Solo presente cuando el listado lo pide Administrador/Asesor Comercial
   * (ven las cotizaciones de todos los clientes, no solo las propias).
   */
  customer?: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * Alta de cotización (US#22 · POST /quotations).
 *
 * Sin ítems en el payload: la cotización se genera a partir del carrito vigente
 * del usuario autenticado. Se puede pedir el envío por email y/o el vaciado del
 * carrito tras emitir.
 */
export interface CreateQuotationPayload {
  /** Días de validez (por defecto 15). */
  validityDays?: number;
  /** Si `true`, envía la cotización por email al usuario tras crearla. */
  sendEmail?: boolean;
  /** Si `true` (por defecto), vacía el carrito tras emitir la cotización. */
  clearCart?: boolean;
}

/** Respuesta del envío de email de una cotización. */
export interface QuotationEmailResult {
  /** Destinatario al que se envió. */
  to: string;
  /** `true` si se usó un SMTP real; `false` si fue el transporte simulado (dev/CI). */
  delivered: boolean;
}
