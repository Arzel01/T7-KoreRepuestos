import { Product } from './product.entity';

/**
 * Tests unitarios — reglas de negocio del modelo Product (US#45).
 *
 * Verifican los métodos puros de la entidad sin tocar BD ni DI.
 * Cubren:
 *   · isLowStock() — alerta de reposición
 *   · margin()     — utilidad bruta por unidad
 *   · marginPercent()
 */
describe('Product (unit · reglas de negocio)', () => {
  function build(overrides: Partial<Product> = {}): Product {
    const p = new Product();
    p.sku = 'X';
    p.name = 'X';
    p.price = 100;
    p.stock = 10;
    p.minStock = 5;
    Object.assign(p, overrides);
    return p;
  }

  describe('isLowStock()', () => {
    it('devuelve false cuando stock > minStock', () => {
      expect(build({ stock: 10, minStock: 5 }).isLowStock()).toBe(false);
    });

    it('devuelve true cuando stock == minStock (umbral inclusivo)', () => {
      expect(build({ stock: 5, minStock: 5 }).isLowStock()).toBe(true);
    });

    it('devuelve true cuando stock < minStock', () => {
      expect(build({ stock: 2, minStock: 5 }).isLowStock()).toBe(true);
    });

    it('devuelve true cuando stock == 0', () => {
      expect(build({ stock: 0, minStock: 5 }).isLowStock()).toBe(true);
    });
  });

  describe('margin()', () => {
    it('devuelve null si no hay cost definido', () => {
      expect(build({ price: 100 }).margin()).toBeNull();
    });

    it('devuelve la diferencia con 2 decimales', () => {
      expect(build({ price: 100, cost: 60 }).margin()).toBe(40);
      expect(build({ price: 99.99, cost: 60 }).margin()).toBe(39.99);
    });

    it('puede ser negativo si se vende a pérdida', () => {
      expect(build({ price: 50, cost: 60 }).margin()).toBe(-10);
    });
  });

  describe('marginPercent()', () => {
    it('devuelve null si no hay cost', () => {
      expect(build({ price: 100 }).marginPercent()).toBeNull();
    });

    it('calcula el porcentaje sobre el precio', () => {
      // (100 - 60) / 100 * 100 = 40%
      expect(build({ price: 100, cost: 60 }).marginPercent()).toBe(40);
    });

    it('devuelve null si price == 0 (división por cero)', () => {
      expect(build({ price: 0, cost: 0 }).marginPercent()).toBeNull();
    });
  });
});
