import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { QueryProductsDto } from './query-products.dto';

function toDto(plain: Record<string, unknown>): QueryProductsDto {
  return plainToInstance(QueryProductsDto, plain);
}

describe('QueryProductsDto (unit · filtros de productos)', () => {
  describe('defaults', () => {
    it('aplica valores por defecto correctamente', async () => {
      const dto = toDto({});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.pageSize).toBe(12);
      expect(dto.sortBy).toBe('createdAt');
      expect(dto.sortOrder).toBe('desc');
    });
  });

  describe('search', () => {
    it('acepta un término de búsqueda válido', async () => {
      const dto = toDto({ search: 'filtro aceite' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.search).toBe('filtro aceite');
    });

    it('rechaza search vacío (Length min 1)', async () => {
      const dto = toDto({ search: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'search')).toBe(true);
    });
  });

  describe('categoryIds', () => {
    it('transforma "1,2,3" en array de números', async () => {
      const dto = toDto({ categoryIds: '1,2,3' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.categoryIds).toEqual([1, 2, 3]);
    });

    it('acepta array de strings (como llegan desde URL multi-param)', async () => {
      const dto = toDto({ categoryIds: ['5', '10'] });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.categoryIds).toEqual([5, 10]);
    });

    it('filtra entradas NaN del string de categoryIds', async () => {
      const dto = toDto({ categoryIds: '1,abc,3' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.categoryIds).toEqual([1, 3]);
    });
  });

  describe('precio', () => {
    it('acepta minPrice y maxPrice como números', async () => {
      const dto = toDto({ minPrice: '100', maxPrice: '500' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.minPrice).toBe(100);
      expect(dto.maxPrice).toBe(500);
    });

    it('rechaza minPrice negativo', async () => {
      const dto = toDto({ minPrice: '-10' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'minPrice')).toBe(true);
    });
  });

  describe('inStock', () => {
    it('convierte string "true" a booleano true', async () => {
      const dto = toDto({ inStock: 'true' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.inStock).toBe(true);
    });

    it('convierte string "false" a booleano false', async () => {
      const dto = toDto({ inStock: 'false' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.inStock).toBe(false);
    });

    it('convierte "1" a true', async () => {
      const dto = toDto({ inStock: '1' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.inStock).toBe(true);
    });
  });

  describe('paginación y orden', () => {
    it('acepta pageSize hasta 60', async () => {
      const dto = toDto({ pageSize: '60' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.pageSize).toBe(60);
    });

    it('rechaza pageSize mayor a 60', async () => {
      const dto = toDto({ pageSize: '61' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
    });

    it('acepta sortBy con columnas válidas', async () => {
      for (const col of ['name', 'price', 'createdAt']) {
        const dto = toDto({ sortBy: col });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.sortBy).toBe(col);
      }
    });

    it('rechaza sortBy con columna no permitida', async () => {
      const dto = toDto({ sortBy: 'id' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'sortBy')).toBe(true);
    });
  });
});
