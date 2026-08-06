import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Product } from '../../products/entities/product.entity';

import { Quotation } from './quotation.entity';

/**
 * Línea de una cotización (`detalle_cotizacion`).
 *
 * A diferencia de `items_carrito`, aquí SÍ se persiste `precio_unitario`: es una
 * foto del precio vigente al emitir la cotización, para que un cambio posterior
 * de `productos.precio_base` no altere un documento ya generado.
 * Ver [[project_real_db_schema]].
 */
@Entity({ name: 'detalle_cotizacion' })
export class QuotationItem {
  @PrimaryGeneratedColumn({ name: 'id_detalle' })
  id!: number;

  @Column({ name: 'id_cotizacion', type: 'int' })
  quotationId!: number;

  @ManyToOne(() => Quotation, (q) => q.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_cotizacion' })
  quotation!: Quotation;

  @Column({ name: 'id_producto', type: 'int' })
  productId!: number;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_producto' })
  product!: Product;

  @Column({ name: 'cantidad', type: 'int' })
  quantity!: number;

  @Column({
    name: 'precio_unitario',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string | null) => (v === null ? 0 : Number(v)),
    },
  })
  unitPrice!: number;
}
