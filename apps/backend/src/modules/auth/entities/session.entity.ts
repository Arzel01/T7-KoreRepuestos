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
 *
 * Cada login exitoso emite un JWT y persiste aquí una fila con el hash
 * (NO el JWT crudo) del refresh token. Permite:
 *   · Revocar sesiones individualmente sin invalidar el JWT_SECRET global.
 *   · Mostrar "sesiones activas" al usuario.
 *   · Detección de uso simultáneo desde varios dispositivos.
 *
 * Mapea contra la tabla `sessions` definida en `database/migrations/002_add_sessions.sql`.
 */
@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Relación N:1 con User. `onDelete: CASCADE` elimina todas las sesiones
   * cuando se borra el usuario (consistencia referencial).
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  /**
   * Hash SHA-256 del refresh token. NUNCA almacenar el token plano
   * para evitar que una fuga de BD comprometa sesiones activas.
   */
  @Index({ unique: true })
  @Column({ name: 'refresh_token_hash', length: 128 })
  refreshTokenHash!: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
