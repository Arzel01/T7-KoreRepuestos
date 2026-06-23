import { useEffect, useState } from 'react';

import { garageApi } from '../server/garage.api';

import type { ModeloResponse } from '@kore/shared';

export function useModels(brandId: number | null) {
  const [models, setModels] = useState<ModeloResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      return;
    }
    setLoading(true);
    garageApi
      .getModels(brandId)
      .then(setModels)
      .finally(() => setLoading(false));
  }, [brandId]);

  return { models, loading };
}
