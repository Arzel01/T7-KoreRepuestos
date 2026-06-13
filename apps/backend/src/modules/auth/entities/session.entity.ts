import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

/**
 * Entidad de dominio: Sesión activa de un usuario.
 * Mapea contra la tabla `sesiones` del schema real.
 *
 * Cada login exitoso emite un JWT y persiste aquí el hash SHA-256
 * del refresh token para permitir revocación individual.
 */
@Entity({ name: 'sesiones' })
export class Session {
  @PrimaryGeneratedColumn({ name: 'id_sesion' })
  id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  user!: User;

  @Index()
  @Column({ name: 'id_usuario', type: 'int' })
  userId!: number;

  @Index({ unique: true })
  @Column({ name: 'refresh_token_hash' })
  refreshTokenHash!: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
