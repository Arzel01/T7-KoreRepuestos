import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { TechnicalSheetEntryResponse } from '@kore/shared';

interface TechnicalSpecificationsProps {
  entries: TechnicalSheetEntryResponse[];
}

export function TechnicalSpecifications({ entries }: TechnicalSpecificationsProps): JSX.Element {
  if (!entries || entries.length === 0) {
    return <></>;
  }

  return (
    <Card className="border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Especificaciones Técnicas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg border border-neutral-200 hover:border-navy-300 transition-colors"
            >
              <dt className="text-sm font-bold text-neutral-600 uppercase tracking-wide mb-2">
                {entry.attribute}
              </dt>
              <dd className="text-lg font-semibold text-neutral-900">{entry.value}</dd>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
