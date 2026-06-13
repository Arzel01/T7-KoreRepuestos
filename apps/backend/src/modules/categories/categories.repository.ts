import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { BaseRepository } from '../../common/repositories/base.repository';

import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesRepository extends BaseRepository<Category, number> {
  constructor(
    @InjectRepository(Category)
    protected readonly repository: Repository<Category>,
  ) {
    super(repository);
  }

  async findRoots(): Promise<Category[]> {
    return this.repository.find({
      where: { parentId: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findWithChildren(id: number): Promise<Category | null> {
    return this.repository.findOne({
      where: { id },
      relations: { children: true },
    });
  }

  /**
   * Árbol completo en una única query con CTE recursivo sobre `categorias`.
   */
  async findTreeFlat(): Promise<Array<Category & { depth: number; path: number[] }>> {
    const sql = `
      WITH RECURSIVE cat_tree AS (
        SELECT
          c.*,
          0::int            AS depth,
          ARRAY[c.id_categoria] AS path
        FROM categorias c
        WHERE c.id_categoria_padre IS NULL

        UNION ALL

        SELECT
          c.*,
          ct.depth + 1,
          ct.path || c.id_categoria
        FROM categorias c
        INNER JOIN cat_tree ct ON c.id_categoria_padre = ct.id_categoria
      )
      SELECT
        id_categoria   AS id,
        id_categoria_padre AS "parentId",
        nombre         AS name,
        depth,
        path
      FROM cat_tree
      ORDER BY depth ASC, nombre ASC;
    `;
    return this.repository.query(sql);
  }
}
