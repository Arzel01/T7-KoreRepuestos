import { RotateCw } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useSearchAnalytics } from '../hooks/useSearchAnalytics';

const DAY_OPTIONS = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
];

function TermsTable({
  rows,
  loading,
}: {
  rows: { termino: string; count: number }[];
  loading: boolean;
}): JSX.Element {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">Sin datos para el período.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Término</TableHead>
          <TableHead className="text-right">Búsquedas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={row.termino}>
            <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
            <TableCell className="font-medium">{row.termino}</TableCell>
            <TableCell className="text-right">
              <Badge variant="secondary">{row.count}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function SearchAnalyticsPage(): JSX.Element {
  const [days, setDays] = useState(30);
  const { data, loading, error, retry } = useSearchAnalytics(days);

  return (
    <div className="mx-auto max-w-5xl px-8 py-12 animate-fade-in-up">
      <header className="mb-10 border-b border-border pb-6">
        <p className="text-sm font-semibold text-primary">Analíticas · Búsquedas</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          Analytics de búsqueda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Top términos y búsquedas sin resultados del catálogo.
        </p>
      </header>

      <div className="mb-8 flex items-center gap-3">
        <span className="text-sm font-medium">Período:</span>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && (
          <Button variant="outline" size="sm" onClick={retry} className="gap-2">
            <RotateCw className="size-4" />
            Reintentar
          </Button>
        )}
      </div>

      {error && (
        <p className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top búsquedas</CardTitle>
          </CardHeader>
          <CardContent>
            <TermsTable rows={data?.topTerms ?? []} loading={loading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Búsquedas sin resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <TermsTable rows={data?.zeroResultTerms ?? []} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
