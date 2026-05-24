import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { BaseRepository } from '../../common/repositories/base.repository';

import { Session } from './entities/session.entity';

/**
 * Repositorio concreto de sesiones.
 *
 * Hereda CRUD genérico de BaseRepository<Session> y añade operaciones
 * propias del dominio de autenticación (revocación, limpieza, lookup por hash).
 *
 * Nota DI: `Repository` se importa como VALOR porque es el tipo del parámetro
 * inyectado por `@InjectRepository(Session)` en runtime.
 */
@Injectable()
export class SessionsRepository extends BaseRepository<Session> {
  constructor(
    @InjectRepository(Session)
    protected readonly repository: Repository<Session>,
  ) {
    super(repository);
  }

  /** Localiza una sesión vigente (no revocada y no expirada) por hash del refresh token. */
  async findActiveByRefreshHash(hash: string): Promise<Session | null> {
    const now = new Date();
    return this.repository
      .createQueryBuilder('s')
      .where('s.refresh_token_hash = :hash', { hash })
      .andWhere('s.revoked_at IS NULL')
      .andWhere('s.expires_at > :now', { now })
      .getOne();
  }

  /** Marca una sesión como revocada (logout o forzado por admin). */
  async revoke(id: string): Promise<void> {
    await this.repository.update(id, { revokedAt: new Date() });
  }

  /** Revoca todas las sesiones activas de un usuario (cambio de contraseña, ataque, etc.). */
  async revokeAllForUser(userId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Session)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
    return result.affected ?? 0;
  }

  /** Borra físicamente sesiones expiradas (job de mantenimiento). */
  async deleteExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }
}
