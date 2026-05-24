/**
 * Patrón Repository — Interfaz genérica.
 *
 * Abstrae las operaciones de persistencia sobre cualquier entidad de dominio,
 * permitiendo desacoplar la lógica de negocio (servicios) del mecanismo
 * concreto de almacenamiento (TypeORM, Prisma, Mongoose, etc.).
 *
 * Aplica el principio de Inversión de Dependencias (SOLID-D): los servicios
 * dependen de esta abstracción, no de una implementación específica.
 *
 * @typeParam T  - Entidad gestionada por el repositorio.
 * @typeParam ID - Tipo del identificador primario. Por defecto `string` (UUID).
 */
export interface IRepository<T, ID = string> {
  /** Recupera todas las entidades, opcionalmente filtradas. */
  findAll(filter?: Partial<T>): Promise<T[]>;

  /** Recupera una entidad por su identificador primario. */
  findById(id: ID): Promise<T | null>;

  /** Recupera la primera entidad que coincida con el filtro. */
  findOne(filter: Partial<T>): Promise<T | null>;

  /** Persiste una nueva entidad y devuelve la entidad creada. */
  create(data: Partial<T>): Promise<T>;

  /** Actualiza parcialmente una entidad existente. */
  update(id: ID, data: Partial<T>): Promise<T>;

  /** Elimina (lógicamente o físicamente) una entidad. Devuelve `true` si afectó al menos una fila. */
  delete(id: ID): Promise<boolean>;

  /** Cuenta entidades que coinciden con el filtro. */
  count(filter?: Partial<T>): Promise<number>;

  /** Indica si existe alguna entidad que cumpla el filtro. */
  exists(filter: Partial<T>): Promise<boolean>;
}
