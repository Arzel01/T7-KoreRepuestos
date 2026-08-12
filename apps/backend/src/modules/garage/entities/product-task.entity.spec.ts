import { ProductTask } from './product-task.entity';

describe('ProductTask M2M (unit · entidad)', () => {
  function build(overrides: Partial<ProductTask> = {}): ProductTask {
    const pt = new ProductTask();
    pt.taskId = 1;
    pt.productId = 10;
    pt.cantidad = 1;
    Object.assign(pt, overrides);
    return pt;
  }

  it('crea una instancia válida con clave compuesta', () => {
    const pt = build();
    expect(pt.taskId).toBe(1);
    expect(pt.productId).toBe(10);
    expect(pt.cantidad).toBe(1);
  });

  it('cantidad puede ser mayor a 1 (múltiples unidades por tarea)', () => {
    const pt = build({ cantidad: 4 });
    expect(pt.cantidad).toBe(4);
  });

  it('cantidad por defecto es 1', () => {
    const pt = build();
    expect(pt.cantidad).toBe(1);
  });

  it('taskId y productId forman la clave primaria compuesta', () => {
    const pt1 = build({ taskId: 1, productId: 10 });
    const pt2 = build({ taskId: 1, productId: 20 });
    expect(pt1.taskId).toBe(pt2.taskId);
    expect(pt1.productId).not.toBe(pt2.productId);
  });

  it('relaciones plan y product comienzan sin valor', () => {
    const pt = build();
    expect(pt.plan).toBeUndefined();
    expect(pt.product).toBeUndefined();
  });
});
