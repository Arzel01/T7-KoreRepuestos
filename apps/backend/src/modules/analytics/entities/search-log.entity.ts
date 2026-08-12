import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'busquedas_log' })
export class SearchLog {
  @PrimaryGeneratedColumn({ name: 'id_busqueda' })
  id!: number;

  @Column({ length: 200 })
  termino!: string;

  @Column({ name: 'cantidad_resultados', type: 'int', default: 0 })
  cantidadResultados!: number;

  @Column({ name: 'id_usuario', type: 'int', nullable: true })
  idUsuario?: number;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  creadoEn!: Date;
}
