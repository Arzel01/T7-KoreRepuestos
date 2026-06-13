import { Injectable, NotFoundException } from '@nestjs/common';

import { CategoriesRepository } from './categories.repository';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findRoots(): Promise<Category[]> {
    return this.categoriesRepository.findRoots();
  }

  async findById(id: number): Promise<Category> {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat) {
      throw new NotFoundException(`Categoría ${id} no encontrada`);
    }
    return cat;
  }

  async assertExists(id: number): Promise<void> {
    const exists = await this.categoriesRepository.exists({ id });
    if (!exists) {
      throw new NotFoundException(`Categoría ${id} no encontrada`);
    }
  }

  async findTree(): Promise<Category[]> {
    const flat = await this.categoriesRepository.findTreeFlat();
    const byId = new Map<number, Category & { children: Category[] }>();

    for (const row of flat) {
      byId.set(row.id, { ...row, children: [] });
    }

    const roots: Category[] = [];
    for (const row of flat) {
      const node = byId.get(row.id)!;
      if (row.parentId && byId.has(row.parentId)) {
        byId.get(row.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
}
