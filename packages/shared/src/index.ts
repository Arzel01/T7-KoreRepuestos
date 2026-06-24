// Punto de entrada del paquete compartido.
// Re-exporta toda la API pública para que los consumidores
// (backend, web, mobile) hagan `import { X } from '@kore/shared'`.

export * from './enums/user-role.enum';
export * from './enums/product-unit.enum';
export * from './dto/user.dto';
export * from './dto/product.dto';
export * from './dto/category.dto';
export * from './interfaces/api-response.interface';
export * from './dto/vehicle.dto';
export * from './dto/maintenance.dto';
export * from './dto/garage.dto';
