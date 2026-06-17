import { UserRole } from '@kore/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entidad de dominio: Usuario del sistema.
 * Mapea contra la tabla `usuarios` del schema real.
 *
 * Los campos `firstName`/`lastName` del API se combinan en `nombres`
 * al persistir y se separan por el primer espacio al leer.
 */
@Entity({ name: 'usuarios' })
export class User {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id!: number;

  @Column({ type: 'varchar', name: 'rol', default: UserRole.CLIENTE })
  role!: UserRole;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  /** Nombre completo almacenado en un solo campo. El servicio combina firstName + lastName. */
  @Column({ type: 'varchar' })
  nombres!: string;

  @Column({ type: 'varchar', nullable: true })
  telefono?: string;

  @Column({ type: 'text', nullable: true })
  direccion?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  creadoEn!: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
  actualizadoEn!: Date;
}
