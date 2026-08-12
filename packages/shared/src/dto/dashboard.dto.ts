/**
 * Panel administrativo — indicadores operativos y de ventas (Admin/Asesor).
 * Todo se calcula en vivo contra `productos`/`categorias`/`usuarios`/`cotizaciones`,
 * sin tablas de agregación separadas.
 */
export interface DashboardSummaryResponse {
  activeProducts: number;
  /** Productos activos con stock en o por debajo del umbral (ver DashboardService). */
  lowStockCount: number;
  categories: number;
  activeUsers: number;
  /** Cotizaciones en estado `Pendiente`. */
  pendingQuotations: number;
  quotationsThisMonth: number;
  revenueThisMonth: number;
}

/** Un punto de la serie de ventas (cotizaciones emitidas por día). */
export interface SalesTrendPoint {
  /** Fecha ISO `yyyy-mm-dd`. */
  date: string;
  total: number;
  count: number;
}

/** Producto más vendido por cantidad, agregado sobre líneas de cotización. */
export interface TopProductStat {
  productId: number;
  sku: string;
  name: string;
  quantitySold: number;
  revenue: number;
}
