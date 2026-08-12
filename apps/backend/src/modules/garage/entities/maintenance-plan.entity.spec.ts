import { MaintenancePlan } from './maintenance-plan.entity';

describe('MaintenancePlan (unit · entidad)', () => {
  function build(overrides: Partial<MaintenancePlan> = {}): MaintenancePlan {
    const p = new MaintenancePlan();
    p.id = 1;
    p.guideId = 2;
    p.description = 'Cambio de aceite';
    p.mileageInterval = 5000;
    p.isCritical = false;
    Object.assign(p, overrides);
    return p;
  }

  it('crea una instancia válida', () => {
    const p = build();
    expect(p.description).toBe('Cambio de aceite');
    expect(p.mileageInterval).toBe(5000);
    expect(p.isCritical).toBe(false);
  });

  it('monthInterval puede ser undefined (solo aplica kilometraje)', () => {
    const p = build({ monthInterval: undefined });
    expect(p.monthInterval).toBeUndefined();
  });

  it('monthInterval puede definirse junto al mileageInterval', () => {
    const p = build({ monthInterval: 6 });
    expect(p.monthInterval).toBe(6);
    expect(p.mileageInterval).toBe(5000);
  });

  it('isCritical marca tareas de alta prioridad', () => {
    const p = build({ isCritical: true });
    expect(p.isCritical).toBe(true);
  });

  it('productTasks comienza sin valor hasta que se cargue la relación', () => {
    const p = build();
    expect(p.productTasks).toBeUndefined();
  });

  it('acepta un array vacío de productTasks', () => {
    const p = build({ productTasks: [] });
    expect(p.productTasks).toHaveLength(0);
  });
});
