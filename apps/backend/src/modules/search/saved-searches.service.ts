import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SavedSearch } from './entities/saved-search.entity';

import type { CreateSavedSearchDto, SavedSearchResponse } from '@kore/shared';

@Injectable()
export class SavedSearchesService {
  constructor(
    @InjectRepository(SavedSearch)
    private readonly repo: Repository<SavedSearch>,
  ) {}

  async list(userId: number): Promise<SavedSearchResponse[]> {
    const rows = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => SavedSearchesService.toResponse(row));
  }

  async create(userId: number, dto: CreateSavedSearchDto): Promise<SavedSearchResponse> {
    const entity = this.repo.create({
      userId,
      nombre: dto.nombre.trim(),
      parametros: dto.parametros,
    });
    try {
      const saved = await this.repo.save(entity);
      return SavedSearchesService.toResponse(saved);
    } catch (err: unknown) {
      // 23505 = unique_violation en (id_usuario, nombre).
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException('Ya tienes una búsqueda guardada con ese nombre');
      }
      throw err;
    }
  }

  async remove(userId: number, id: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Búsqueda guardada no encontrada');
    await this.repo.delete({ id, userId });
  }

  private static toResponse(row: SavedSearch): SavedSearchResponse {
    return {
      id: row.id,
      nombre: row.nombre,
      parametros: row.parametros,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
