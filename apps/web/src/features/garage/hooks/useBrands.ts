import { useEffect, useState } from 'react';

import { garageApi } from '../server/garage.api';

import type { MarcaResponse } from '@kore/shared';

export function useBrands() {
  const [brands, setBrands] = useState<MarcaResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    garageApi
      .getBrands()
      .then(setBrands)
      .finally(() => setLoading(false));
  }, []);

  return { brands, loading };
}
