import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from './audit-log.entity';

export interface AuditLogDto {
  userId?: number | null;
  tableName: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  description?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async log(dto: AuditLogDto): Promise<void> {
    const entry = this.repository.create({
      userId: dto.userId ?? null,
      tableName: dto.tableName,
      action: dto.action,
      description: dto.description ?? null,
    });
    await this.repository.save(entry);
  }
}
