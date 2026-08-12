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
export * from './dto/garage.dto';
export * from './dto/plan.dto';
export * from './dto/analytics.dto';
export * from './dto/saved-search.dto';
export * from './dto/notification.dto';
export * from './dto/push-subscription.dto';
export * from './dto/cart.dto';
export * from './dto/maintenance-record.dto';
export * from './dto/quotation.dto';
export * from './dto/dashboard.dto';
