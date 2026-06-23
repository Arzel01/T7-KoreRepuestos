import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Product } from '../../products/entities/product.entity';

import { MaintenanceTask } from './maintenance-task.entity';

@Entity('productos_tarea')
export class TaskProduct {
  @PrimaryColumn({ name: 'id_tarea', type: 'int' })
  taskId!: number;

  @PrimaryColumn({ name: 'id_producto', type: 'int' })
  productId!: number;

  @Column({ name: 'cantidad', type: 'int' })
  quantity!: number;

  @ManyToOne(() => MaintenanceTask, (task) => task.taskProducts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_tarea' })
  task!: MaintenanceTask;

  @ManyToOne(() => Product, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_producto' })
  product!: Product;
}
