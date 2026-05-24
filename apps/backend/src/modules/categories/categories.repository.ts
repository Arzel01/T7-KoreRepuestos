import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { BaseRepository } from '../../common/repositories/base.repository';

import { Category } from './entities/category.entity';

/**
 * Repositorio concreto de categorías de productos.
 *
 * Operaciones específicas del dominio:
 *   · `findRoots()`            categorías raíz (parent_id IS NULL).
 *   · `findWithChildren(id)`   categoría + sus hijos directos.
 *   · `findTree()`             árbol completo con un CTE recursivo en SQL.
 *
 * El CTE recursivo se prefiere a múltiples queries (N+1) porque devuelve
 * todo el árbol en una sola consulta — escala bien hasta miles de nodos.
 */
@Injectable()
export class CategoriesRepository extends BaseRepository<Category> {
  constructor(
    @InjectRepository(Category)
    protected readonly repository: Repository<Category>,
  ) {
    super(repository);
  }

  /** Devuelve las categorías raíz (sin padre). */
  async findRoots(): Promise<Category[]> {
    return this.repository.find({
      where: { parentId: IsNull(), isActive: true },
      order: { name: 'ASC' },
    });
  }

  /** Categoría + hijos directos cargados eagerly. */
  async findWithChildren(id: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { id },
      relations: { children: true },
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.repository.findOne({ where: { slug } });
  }

  /**
   * Árbol completo en una única query usando CTE recursivo.
   *
   * Cada fila incluye:
   *   · todos los campos de la categoría
   *   · `depth` (profundidad desde la raíz, 0 = raíz)
   *   · `path` (array UUIDs desde la raíz, útil para breadcrumbs)
   *
   * El mapeo a árbol jerárquico (relación children) se delega al servicio.
   */
  async findTreeFlat(): Promise<Array<Category & { depth: number; path: string[] }>> {
    const sql = `
      WITH RECURSIVE category_tree AS (
        SELECT
          c.*,
          0::int                  AS depth,
          ARRAY[c.id::text]       AS path
        FROM product_categories c
        WHERE c.parent_id IS NULL

        UNION ALL

        SELECT
          c.*,
          ct.depth + 1            AS depth,
          ct.path || c.id::text   AS path
        FROM product_categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM category_tree
      WHERE is_active = TRUE
      ORDER BY depth ASC, name ASC;
    `;
    return this.repository.query(sql);
  }
}
