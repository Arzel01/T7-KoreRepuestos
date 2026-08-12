import { MaintenanceGuide } from './maintenance-guide.entity';

describe('MaintenanceGuide (unit · entidad)', () => {
  function build(overrides: Partial<MaintenanceGuide> = {}): MaintenanceGuide {
    const g = new MaintenanceGuide();
    g.id = 1;
    g.modeloId = 5;
    g.descripcion = 'Guía estándar Toyota Corolla 2015-2022';
    Object.assign(g, overrides);
    return g;
  }

  it('crea una instancia válida', () => {
    const g = build();
    expect(g.id).toBe(1);
    expect(g.modeloId).toBe(5);
    expect(g.descripcion).toBe('Guía estándar Toyota Corolla 2015-2022');
  });

  it('descripcion puede ser undefined (campo nullable)', () => {
    const g = build({ descripcion: undefined });
    expect(g.descripcion).toBeUndefined();
  });

  it('plans comienza sin valor hasta que se cargue la relación', () => {
    const g = build();
    expect(g.plans).toBeUndefined();
  });

  it('acepta un array vacío de planes', () => {
    const g = build({ plans: [] });
    expect(g.plans).toHaveLength(0);
  });

  it('modeloId es requerido (tipo int)', () => {
    const g = build({ modeloId: 99 });
    expect(typeof g.modeloId).toBe('number');
  });
});
