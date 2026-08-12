import { Modelo } from './modelo.entity';

describe('Modelo (unit · entidad)', () => {
  function build(overrides: Partial<Modelo> = {}): Modelo {
    const m = new Modelo();
    m.id = 1;
    m.marcaId = 10;
    m.nombre = 'Corolla';
    m.anioInicio = 2015;
    m.anioFin = 2022;
    Object.assign(m, overrides);
    return m;
  }

  it('crea una instancia válida con campos mínimos', () => {
    const m = build();
    expect(m.nombre).toBe('Corolla');
    expect(m.marcaId).toBe(10);
    expect(m.anioInicio).toBe(2015);
    expect(m.anioFin).toBe(2022);
  });

  it('anioInicio y anioFin pueden ser undefined (modelo sin rango)', () => {
    const m = build({ anioInicio: undefined, anioFin: undefined });
    expect(m.anioInicio).toBeUndefined();
    expect(m.anioFin).toBeUndefined();
  });

  it('anioFin puede ser null si el modelo sigue en producción', () => {
    const m = build({ anioFin: null as unknown as number });
    expect(m.anioFin).toBeNull();
  });

  it('guias comienza sin valor (relación lazy)', () => {
    const m = build();
    expect(m.guias).toBeUndefined();
  });

  it('acepta un array de guías de mantenimiento', () => {
    const m = build({ guias: [] });
    expect(m.guias).toHaveLength(0);
  });
});
