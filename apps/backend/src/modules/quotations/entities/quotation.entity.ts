import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

import { QuotationItem } from './quotation-item.entity';

/**
 * Cabecera de cotización (`cotizaciones`).
 *
 * Congela una compra en un documento con correlativo (`numero_cotizacion`) y
 * fecha de validez. Los totales NO se persisten aquí: se recalculan a partir de
 * las líneas (`detalle_cotizacion`). Ver [[project_real_db_schema]].
 */
@Entity({ name: 'cotizaciones' })
export class Quotation {
  @PrimaryGeneratedColumn({ name: 'id_cotizacion' })
  id!: number;

  @Index({ unique: true })
  @Column({ name: 'numero_cotizacion', type: 'varchar', length: 32 })
  number!: string;

  @Column({ name: 'id_usuario', type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  user!: User;

  @CreateDateColumn({ name: 'fecha_emision', type: 'timestamp' })
  issuedAt!: Date;

  @Column({ name: 'fecha_validez', type: 'timestamp' })
  validUntil!: Date;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'Pendiente' })
  status!: string;

  @OneToMany(() => QuotationItem, (item) => item.quotation, { cascade: true })
  items?: QuotationItem[];
}
