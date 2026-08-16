import { Mail, MailCheck, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { extractApiErrorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

import { quotationsApi } from '../server/quotations.api';

import type { QuotationSummaryResponse } from '@kore/shared';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Cotizaciones de todos los clientes, para Administrador/Asesor Comercial.
 * El backend (`QuotationsService.list`) ya devuelve el listado completo con el
 * contacto del cliente cuando lo pide un rol staff — esta página es la misma
 * llamada que el historial del cliente, solo que aquí llegan todas.
 */
export function QuotationsAdminListPage(): JSX.Element {
  const [quotations, setQuotations] = useState<QuotationSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    quotationsApi
      .list()
      .then((rows) => {
        if (!cancelled) setQuotations(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleResend(id: number): Promise<void> {
    setSendingId(id);
    setError(null);
    try {
      await quotationsApi.email(id);
      setSentIds((prev) => new Set(prev).add(id));
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-12 animate-fade-in-up">
      <header className="mb-10 border-b border-border pb-6">
        <p className="text-sm font-semibold text-primary">Cotizaciones · 01</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">Cotizaciones</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cotizaciones de todos los clientes. Reenviá el PDF por email o escribile directo para
          cerrar la venta.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando cotizaciones…</p>
      ) : quotations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay cotizaciones registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N.° cotización</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Emitida</TableHead>
                <TableHead className="w-56">Contactar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.number}</TableCell>
                  <TableCell>
                    {q.customer ? (
                      <div>
                        <p className="font-medium text-foreground">{q.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{q.customer.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={q.expired ? 'destructive' : 'secondary'}>
                      {q.expired ? 'Expirada' : q.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(q.total)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(q.issuedAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {q.customer && (
                        <Button
                          asChild
                          variant="outline"
                          size="icon-sm"
                          aria-label="Escribir al cliente"
                        >
                          <a
                            href={`mailto:${q.customer.email}?subject=${encodeURIComponent(`Cotización ${q.number}`)}`}
                          >
                            <Mail className="size-4" aria-hidden />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={sendingId === q.id}
                        onClick={() => void handleResend(q.id)}
                        className="gap-1.5"
                      >
                        {sentIds.has(q.id) ? (
                          <MailCheck className="size-3.5" aria-hidden />
                        ) : (
                          <Send className="size-3.5" aria-hidden />
                        )}
                        {sendingId === q.id
                          ? 'Enviando…'
                          : sentIds.has(q.id)
                            ? 'Reenviada'
                            : 'Reenviar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
