import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

import type { SavedSearchParams } from '@kore/shared';

/**
 * Búsqueda guardada por un usuario. Propiedades JS en inglés/camelCase,
 * columnas reales en español (ver patrón del resto de entidades).
 */
@Entity({ name: 'busquedas_guardadas' })
export class SavedSearch {
  @PrimaryGeneratedColumn({ name: 'id_busqueda_guardada' })
  id!: number;

  @Column({ name: 'id_usuario', type: 'int' })
  userId!: number;

  @Column({ name: 'nombre', length: 120 })
  nombre!: string;

  @Column({ name: 'parametros', type: 'jsonb' })
  parametros!: SavedSearchParams;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;
}
