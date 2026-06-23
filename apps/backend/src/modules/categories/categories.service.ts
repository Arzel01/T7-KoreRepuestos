import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuditLogService } from '../audit/audit-log.service';

import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

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

  async create(dto: CreateCategoryDto, userId?: number): Promise<Category> {
    if (dto.parentId) {
      await this.assertExists(dto.parentId);
    }

    const category = await this.categoriesRepository.create({
      name: dto.name,
      parentId: dto.parentId ?? null,
    });

    await this.auditLogService.log({
      userId,
      tableName: 'categorias',
      action: 'INSERT',
      description: `Categoría "${dto.name}" creada`,
    });

    return category;
  }

  async update(id: number, dto: UpdateCategoryDto, userId?: number): Promise<Category> {
    await this.assertExists(id);

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('Una categoría no puede ser su propio padre');
      }
      if (dto.parentId) {
        await this.assertExists(dto.parentId);
      }
    }

    const updated = await this.categoriesRepository.update(id, dto);

    await this.auditLogService.log({
      userId,
      tableName: 'categorias',
      action: 'UPDATE',
      description: `Categoría ${id} actualizada`,
    });

    return updated;
  }

  async remove(id: number, userId?: number): Promise<void> {
    await this.assertExists(id);

    const childCount = await this.categoriesRepository.count({ parentId: id });
    if (childCount > 0) {
      throw new ConflictException('No se puede eliminar: la categoría tiene subcategorías');
    }

    const productCount = await this.categoriesRepository.countProductsByCategory(id);
    if (productCount > 0) {
      throw new ConflictException('No se puede eliminar: la categoría tiene productos asociados');
    }

    await this.categoriesRepository.delete(id);

    await this.auditLogService.log({
      userId,
      tableName: 'categorias',
      action: 'DELETE',
      description: `Categoría ${id} eliminada`,
    });
  }
}
