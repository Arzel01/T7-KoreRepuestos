import { Injectable, NotFoundException } from '@nestjs/common';

import { CategoriesRepository } from './categories.repository';
import { Category } from './entities/category.entity';

/**
 * Servicio de dominio de Categorías.
 *
 * Hoy expone solo lectura (Sprint 1) — la creación/edición se cubrirá en
 * sprints posteriores cuando exista UI completa de gestión.
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findRoots(): Promise<Category[]> {
    return this.categoriesRepository.findRoots();
  }

  async findById(id: string): Promise<Category> {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat) {
      throw new NotFoundException(`Categoría ${id} no encontrada`);
    }
    return cat;
  }

  async assertExists(id: string): Promise<void> {
    const exists = await this.categoriesRepository.exists({ id });
    if (!exists) {
      throw new NotFoundException(`Categoría ${id} no encontrada`);
    }
  }

  /** Árbol jerárquico construido en memoria desde la versión "plana" del CTE. */
  async findTree(): Promise<Category[]> {
    const flat = await this.categoriesRepository.findTreeFlat();
    const byId = new Map<string, Category & { children: Category[] }>();

    for (const row of flat) {
      byId.set(row.id, { ...row, children: [] });
    }

    const roots: Category[] = [];
    for (const row of flat) {
      const node = byId.get(row.id)!;
      if (row.parentId && byId.has(row.parentId)) {
        byId.get(row.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
}
