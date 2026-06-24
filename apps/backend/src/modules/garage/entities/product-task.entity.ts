import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { MaintenancePlan } from '../../maintenance/entities/maintenance-plan.entity';
import { Product } from '../../products/entities/product.entity';

@Entity({ name: 'productos_tarea' })
export class ProductTask {
  @PrimaryColumn({ name: 'id_tarea', type: 'int' })
  taskId!: number;

  @PrimaryColumn({ name: 'id_producto', type: 'int' })
  productId!: number;

  @ManyToOne(() => MaintenancePlan, (p) => p.productTasks)
  @JoinColumn({ name: 'id_tarea' })
  plan!: MaintenancePlan;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'id_producto' })
  product!: Product;

  @Column({ type: 'int', default: 1 })
  cantidad!: number;
}
