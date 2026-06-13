import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { BaseRepository } from '../../common/repositories/base.repository';

import { Session } from './entities/session.entity';

export interface CreateSessionDto {
  userId: number;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class SessionsRepository extends BaseRepository<Session, number> {
  constructor(
    @InjectRepository(Session)
    protected readonly repository: Repository<Session>,
  ) {
    super(repository);
  }

  override async create(_data: Partial<Session>): Promise<never> {
    throw new Error('SessionsRepository: usar createSession() en lugar de create()');
  }

  async createSession(dto: CreateSessionDto): Promise<Session> {
    const session = this.repository.create({
      user: { id: dto.userId },
      userId: dto.userId,
      refreshTokenHash: dto.refreshTokenHash,
      expiresAt: dto.expiresAt,
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
    });
    return this.repository.save(session);
  }

  async findActiveByRefreshHash(hash: string): Promise<Session | null> {
    return this.repository
      .createQueryBuilder('s')
      .where('s.refreshTokenHash = :hash', { hash })
      .andWhere('s.revokedAt IS NULL')
      .andWhere('s.expiresAt > :now', { now: new Date() })
      .getOne();
  }

  async revoke(id: number): Promise<void> {
    await this.repository.update(id, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Session)
      .set({ revokedAt: new Date() })
      .where('id_usuario = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
    return result.affected ?? 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repository.delete({ expiresAt: LessThan(new Date()) });
    return result.affected ?? 0;
  }
}
