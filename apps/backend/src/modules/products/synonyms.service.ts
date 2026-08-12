import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Expande un término de búsqueda con sus sinónimos del dominio automotriz
 * (tabla `sinonimos`), resolviendo la limitación anotada en ADR-0001 sin
 * introducir Elasticsearch.
 *
 * El grafo de sinónimos es bidireccional; `expand()` devuelve el cierre
 * transitivo (BFS) para que cualquier variante de un grupo alcance a todas
 * las demás. Los pares casi nunca cambian, así que se cachean en memoria.
 */
@Injectable()
export class SynonymsService {
  /** Adyacencia bidireccional término(lower) → set de sinónimos(lower). */
  private cache: Map<string, Set<string>> | null = null;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Devuelve el término normalizado más todos sus sinónimos transitivos.
   * Si no hay coincidencias, devuelve solo el término (o vacío si es blanco).
   */
  async expand(term: string): Promise<string[]> {
    const key = SynonymsService.normalize(term);
    if (!key) return [];

    const graph = await this.load();
    const visited = new Set<string>([key]);
    const queue: string[] = [key];
    while (queue.length) {
      const current = queue.shift() as string;
      for (const neighbor of graph.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return [...visited];
  }

  /** Limpia la caché (útil en tests tras insertar sinónimos). */
  invalidate(): void {
    this.cache = null;
  }

  private async load(): Promise<Map<string, Set<string>>> {
    if (this.cache) return this.cache;

    const rows = await this.dataSource.query<Array<{ termino: string; sinonimo: string }>>(
      `SELECT lower(termino) AS termino, lower(sinonimo) AS sinonimo FROM public.sinonimos`,
    );

    const graph = new Map<string, Set<string>>();
    const link = (a: string, b: string): void => {
      if (!graph.has(a)) graph.set(a, new Set());
      graph.get(a)?.add(b);
    };
    for (const { termino, sinonimo } of rows) {
      link(termino, sinonimo);
      link(sinonimo, termino);
    }

    this.cache = graph;
    return graph;
  }

  private static normalize(term: string): string {
    return term.trim().toLowerCase();
  }
}
