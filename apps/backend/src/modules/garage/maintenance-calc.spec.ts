import {
  classifyReminder,
  computeNextService,
  estimateCost,
  summarizePlan,
} from './maintenance-calc';

import type { CalendarItemDto } from '@kore/shared';

// Fecha fija lejos de cambios de horario (DST) para evitar drift en las fechas.
const NOW = new Date(2026, 5, 15, 12, 0, 0); // 15-jun-2026 12:00 local

function addMonthsIso(base: Date, months: number): string {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

describe('computeNextService (US#3 · algoritmo de mantenimiento)', () => {
  it('calcula km restantes hasta el próximo múltiplo del intervalo', () => {
    const r = computeNextService(
      { mileageInterval: 5000, currentMileage: 12000, averageDailyMileage: 100 },
      NOW,
    );
    expect(r.kmRemaining).toBe(3000); // 15000 - 12000
    expect(r.daysRemaining).toBe(30); // 3000 / 100
  });

  it('marca como vencido (0 km) cuando el kilometraje cae justo en un múltiplo', () => {
    const r = computeNextService(
      { mileageInterval: 5000, currentMileage: 10000, averageDailyMileage: 50 },
      NOW,
    );
    expect(r.kmRemaining).toBe(0);
    expect(r.daysRemaining).toBe(0);
  });

  it('toma la fecha por meses cuando es más temprana que la de kilometraje', () => {
    // avg bajo → fecha por km muy lejana (~300 días); meses (3) es más cercano.
    const r = computeNextService(
      {
        mileageInterval: 5000,
        monthInterval: 3,
        currentMileage: 12000,
        averageDailyMileage: 10,
      },
      NOW,
    );
    expect(r.kmRemaining).toBe(3000);
    expect(r.nextServiceDate).toBe(addMonthsIso(NOW, 3));
  });

  it('usa la fecha del último servicio como base del intervalo por meses', () => {
    const lastCompletedAt = '2026-01-10';
    const r = computeNextService(
      {
        mileageInterval: 100000,
        monthInterval: 6,
        currentMileage: 1000,
        averageDailyMileage: 1,
        lastCompletedAt,
      },
      NOW,
    );
    // 6 meses desde 2026-01-10 → 2026-07-10.
    expect(r.nextServiceDate).toBe(addMonthsIso(new Date(lastCompletedAt), 6));
  });

  it('con último servicio registrado, queda vencido (0 km) al pasar el objetivo y no se corre al siguiente múltiplo', () => {
    // Último servicio a los 75000 km, intervalo 5000 → objetivo 80000.
    // A 80200 km ya lo pasó: debe marcar vencido, no recalcular a 85000.
    const r = computeNextService(
      {
        mileageInterval: 5000,
        currentMileage: 80200,
        averageDailyMileage: 30,
        lastCompletedMileage: 75000,
      },
      NOW,
    );
    expect(r.kmRemaining).toBe(0);
  });

  it('sin historial de servicio, usa el múltiplo más próximo (no acusa vencidos retroactivos)', () => {
    const r = computeNextService(
      { mileageInterval: 5000, currentMileage: 80200, averageDailyMileage: 30 },
      NOW,
    );
    expect(r.kmRemaining).toBe(4800); // 85000 - 80200
  });

  it('no revienta cuando no hay km/día ni intervalo por meses', () => {
    const r = computeNextService(
      { mileageInterval: 5000, currentMileage: 1000, averageDailyMileage: 0 },
      NOW,
    );
    expect(r.kmRemaining).toBe(4000);
    expect(r.nextServiceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // horizonte lejano, fecha válida
  });
});

describe('estimateCost', () => {
  it('suma price × quantity de cada repuesto', () => {
    expect(
      estimateCost([
        { price: 100, quantity: 2 },
        { price: 50, quantity: 1 },
      ]),
    ).toBe(250);
  });

  it('devuelve 0 sin repuestos', () => {
    expect(estimateCost([])).toBe(0);
  });
});

describe('summarizePlan', () => {
  const base: Omit<
    CalendarItemDto,
    'estimatedCost' | 'isCritical' | 'kmRemaining' | 'nextServiceDate'
  > = {
    planId: 1,
    description: 't',
    mileageInterval: 5000,
    products: [],
  };
  const services: CalendarItemDto[] = [
    {
      ...base,
      planId: 1,
      estimatedCost: 100,
      isCritical: true,
      kmRemaining: 0,
      nextServiceDate: '2026-07-01',
    },
    {
      ...base,
      planId: 2,
      estimatedCost: 250,
      isCritical: false,
      kmRemaining: 500,
      nextServiceDate: '2026-06-20',
    },
    {
      ...base,
      planId: 3,
      estimatedCost: 50,
      isCritical: true,
      kmRemaining: 0,
      nextServiceDate: '2026-09-01',
    },
  ];

  it('agrega costo total, contadores y la fecha más cercana', () => {
    const s = summarizePlan(services);
    expect(s.estimatedTotalCost).toBe(400);
    expect(s.criticalCount).toBe(2);
    expect(s.overdueCount).toBe(2);
    expect(s.nextServiceDate).toBe('2026-06-20');
  });

  it('maneja un plan vacío', () => {
    const s = summarizePlan([]);
    expect(s.estimatedTotalCost).toBe(0);
    expect(s.nextServiceDate).toBeUndefined();
  });
});

describe('classifyReminder (tramos de urgencia por km + fecha de respaldo)', () => {
  it('vencido cuando kmRemaining es 0, sin importar la fecha', () => {
    expect(classifyReminder({ kmRemaining: 0, nextServiceDate: 'x', daysRemaining: 999 }, 7)).toBe(
      'vencido',
    );
  });
  it('urgente dentro de 100 km', () => {
    expect(
      classifyReminder({ kmRemaining: 100, nextServiceDate: 'x', daysRemaining: 999 }, 7),
    ).toBe('urgente');
    expect(classifyReminder({ kmRemaining: 1, nextServiceDate: 'x', daysRemaining: 999 }, 7)).toBe(
      'urgente',
    );
  });
  it('próximo entre 100 y 1000 km', () => {
    expect(
      classifyReminder({ kmRemaining: 1000, nextServiceDate: 'x', daysRemaining: 999 }, 7),
    ).toBe('proximo');
    expect(
      classifyReminder({ kmRemaining: 101, nextServiceDate: 'x', daysRemaining: 999 }, 7),
    ).toBe('proximo');
  });
  it('próximo por fecha aunque falte mucho km (tarea dominada por meses)', () => {
    expect(classifyReminder({ kmRemaining: 5000, nextServiceDate: 'x', daysRemaining: 5 }, 7)).toBe(
      'proximo',
    );
  });
  it('null si no está dentro de ningún tramo de km ni de la ventana de días', () => {
    expect(
      classifyReminder({ kmRemaining: 5000, nextServiceDate: 'x', daysRemaining: 20 }, 7),
    ).toBeNull();
  });
});
