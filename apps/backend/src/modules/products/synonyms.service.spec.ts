import { SynonymsService } from './synonyms.service';

import type { DataSource } from 'typeorm';

/**
 * Unit test del cierre transitivo (BFS) y la caché. No toca la base de datos:
 * mockea `DataSource.query` con un grafo encadenado.
 */
describe('SynonymsService', () => {
  const PAIRS = [
    { termino: 'pastillas', sinonimo: 'balatas' },
    { termino: 'llanta', sinonimo: 'neumatico' },
    { termino: 'neumatico', sinonimo: 'goma' },
    { termino: 'goma', sinonimo: 'caucho' },
  ];

  function makeService(): { service: SynonymsService; query: jest.Mock } {
    const query = jest.fn().mockResolvedValue(PAIRS);
    const dataSource = { query } as unknown as DataSource;
    return { service: new SynonymsService(dataSource), query };
  }

  it('expande un par bidireccional (balatas → pastillas)', async () => {
    const { service } = makeService();
    const result = await service.expand('balatas');
    expect(result).toEqual(expect.arrayContaining(['balatas', 'pastillas']));
  });

  it('resuelve el cierre transitivo de una cadena (caucho → llanta)', async () => {
    const { service } = makeService();
    const result = await service.expand('caucho');
    expect(result).toEqual(expect.arrayContaining(['caucho', 'goma', 'neumatico', 'llanta']));
  });

  it('normaliza mayúsculas/espacios antes de buscar', async () => {
    const { service } = makeService();
    const result = await service.expand('  BALATAS ');
    expect(result).toContain('pastillas');
  });

  it('devuelve solo el término si no tiene sinónimos', async () => {
    const { service } = makeService();
    expect(await service.expand('bujia')).toEqual(['bujia']);
  });

  it('devuelve vacío para término en blanco', async () => {
    const { service } = makeService();
    expect(await service.expand('   ')).toEqual([]);
  });

  it('cachea los pares: consulta la BD una sola vez', async () => {
    const { service, query } = makeService();
    await service.expand('balatas');
    await service.expand('llanta');
    await service.expand('goma');
    expect(query).toHaveBeenCalledTimes(1);
  });
});
