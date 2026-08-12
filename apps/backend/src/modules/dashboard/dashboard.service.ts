import { QuotationStatus } from '@kore/shared';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';

import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { Quotation } from '../quotations/entities/quotation.entity';
import { User } from '../users/entities/user.entity';

import type { DashboardSummaryResponse, SalesTrendPoint, TopProductStat } from '@kore/shared';

/** Productos activos con este stock o menos cuentan como "bajo stock" en el resumen. */
const LOW_STOCK_THRESHOLD = 5;

interface MonthRevenueRow {
  count: string;
  revenue: string;
}

interface SalesTrendRow {
  date: string;
  count: string;
  total: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Quotation) private readonly quotations: Repository<Quotation>,
  ) {}

  async getSummary(): Promise<DashboardSummaryResponse> {
    const [activeProducts, lowStockCount, categories, activeUsers, pendingQuotations, month] =
      await Promise.all([
        this.products.count({ where: { isActive: true } }),
        this.products.count({
          where: { isActive: true, stock: LessThanOrEqual(LOW_STOCK_THRESHOLD) },
        }),
        this.categories.count(),
        this.users.count({ where: { isActive: true } }),
        this.quotations.count({ where: { status: QuotationStatus.PENDIENTE } }),
        this.monthRevenue(),
      ]);

    return {
      activeProducts,
      lowStockCount,
      categories,
      activeUsers,
      pendingQuotations,
      quotationsThisMonth: month.count,
      revenueThisMonth: month.revenue,
    };
  }

  /** Serie diaria de cotizaciones emitidas en los últimos `days` días. */
  async getSalesTrend(days: number): Promise<SalesTrendPoint[]> {
    // `days` viene validado como entero 1-365 por SalesTrendQueryDto antes de llegar
    // aquí (mismo patrón que SearchAnalyticsService.topSearches).
    const rows = await this.dataSource.query<SalesTrendRow[]>(`
      SELECT to_char(c.fecha_emision::date, 'YYYY-MM-DD') AS date,
             COUNT(DISTINCT c.id_cotizacion)::int AS count,
             COALESCE(SUM(d.cantidad * d.precio_unitario), 0)::float AS total
      FROM cotizaciones c
      JOIN detalle_cotizacion d ON d.id_cotizacion = c.id_cotizacion
      WHERE c.fecha_emision >= NOW() - INTERVAL '${days} days'
      GROUP BY c.fecha_emision::date
      ORDER BY c.fecha_emision::date ASC
    `);
    return rows.map((r) => ({ date: r.date, count: Number(r.count), total: Number(r.total) }));
  }

  /** Productos más vendidos por cantidad, agregado sobre todas las cotizaciones. */
  async getTopProducts(limit: number): Promise<TopProductStat[]> {
    return this.dataSource.query<TopProductStat[]>(
      `
      SELECT p.id_producto AS "productId", p.sku, p.nombre AS name,
             SUM(d.cantidad)::int AS "quantitySold",
             SUM(d.cantidad * d.precio_unitario)::float AS revenue
      FROM detalle_cotizacion d
      JOIN productos p ON p.id_producto = d.id_producto
      GROUP BY p.id_producto, p.sku, p.nombre
      ORDER BY "quantitySold" DESC
      LIMIT $1
      `,
      [limit],
    );
  }

  private async monthRevenue(): Promise<{ count: number; revenue: number }> {
    const rows = await this.dataSource.query<MonthRevenueRow[]>(`
      SELECT COUNT(DISTINCT c.id_cotizacion)::int AS count,
             COALESCE(SUM(d.cantidad * d.precio_unitario), 0)::float AS revenue
      FROM cotizaciones c
      JOIN detalle_cotizacion d ON d.id_cotizacion = c.id_cotizacion
      WHERE date_trunc('month', c.fecha_emision) = date_trunc('month', NOW())
    `);
    return { count: Number(rows[0].count), revenue: Number(rows[0].revenue) };
  }
}
