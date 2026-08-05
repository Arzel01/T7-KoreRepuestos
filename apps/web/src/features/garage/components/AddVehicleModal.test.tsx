// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AddVehicleModal } from './AddVehicleModal';

// Marca/modelo se cargan vía garageApi; se mockea para no tocar la red.
vi.mock('@/features/garage/server/garage.api', () => ({
  garageApi: {
    getBrands: vi.fn().mockResolvedValue([]),
    getModels: vi.fn().mockResolvedValue([]),
  },
}));

describe('AddVehicleModal (validación)', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('exige marca, modelo y año antes de guardar', async () => {
    const onSave = vi.fn();
    render(<AddVehicleModal open onClose={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar Vehículo' }));

    expect(await screen.findByText('Selecciona marca, modelo y año.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
