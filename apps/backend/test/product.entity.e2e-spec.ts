import { Product } from '../src/modules/products/entities/product.entity';

describe('Product (unit · entidad)', () => {
  function build(overrides: Partial<Product> = {}): Product {
    const p = new Product();
    p.sku = 'TEST-001';
    p.name = 'Producto de prueba';
    p.price = 100;
    p.stock = 10;
    p.isActive = true;
    Object.assign(p, overrides);
    return p;
  }

  it('crea una instancia válida con campos mínimos', () => {
    const p = build();
    expect(p.sku).toBe('TEST-001');
    expect(p.price).toBe(100);
    expect(p.stock).toBe(10);
    expect(p.isActive).toBe(true);
  });

  it('stock 0 indica producto agotado', () => {
    const p = build({ stock: 0 });
    expect(p.stock).toBe(0);
  });

  it('categoryId puede ser null (sin categoría)', () => {
    const p = build({ categoryId: null });
    expect(p.categoryId).toBeNull();
  });
});
