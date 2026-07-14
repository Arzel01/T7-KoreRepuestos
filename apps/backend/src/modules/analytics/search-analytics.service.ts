import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SearchLog } from './entities/search-log.entity';

export interface TopSearchTerm {
  termino: string;
  count: number;
}

@Injectable()
export class SearchAnalyticsService {
  constructor(
    @InjectRepository(SearchLog)
    private readonly repo: Repository<SearchLog>,
  ) {}

  async log(termino: string, cantidadResultados: number, userId?: number): Promise<void> {
    const normalized = termino.trim().toLowerCase().slice(0, 200);
    if (!normalized) return;
    const entry = this.repo.create({
      termino: normalized,
      cantidadResultados,
      idUsuario: userId,
    });
    await this.repo.save(entry);
  }

  async topSearches(days: number, limit: number): Promise<TopSearchTerm[]> {
    return this.repo
      .createQueryBuilder('b')
      .select('lower(b.termino)', 'termino')
      .addSelect('COUNT(*)', 'count')
      .where(`b.creado_en >= NOW() - INTERVAL '${days} days'`)
      .groupBy('lower(b.termino)')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<TopSearchTerm>();
  }

  async zeroResultSearches(days: number, limit: number): Promise<TopSearchTerm[]> {
    return this.repo
      .createQueryBuilder('b')
      .select('lower(b.termino)', 'termino')
      .addSelect('COUNT(*)', 'count')
      .where(`b.creado_en >= NOW() - INTERVAL '${days} days'`)
      .andWhere('b.cantidad_resultados = 0')
      .groupBy('lower(b.termino)')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<TopSearchTerm>();
  }
}
