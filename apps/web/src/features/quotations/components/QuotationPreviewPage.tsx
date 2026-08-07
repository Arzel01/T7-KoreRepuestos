import { AlertCircle, CheckCircle2, Download, Loader2, Mail, ShoppingBag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CatalogNavbar } from '@/features/catalog/components/CatalogNavbar';
import { extractApiErrorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

import { quotationsApi } from '../server/quotations.api';

import type { QuotationResponse } from '@kore/shared';

/** Formatea una fecha ISO como DD/MM/YYYY sin depender de la zona del navegador. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/**
 * US#22 — vista previa de una cotización.
 *
 * Muestra el documento generado y ofrece descargar el PDF (blob autenticado) y
 * reenviarlo por email. La descarga y el envío tienen su propio estado de carga
 * para no bloquear el resto de la vista.
 */
export function QuotationPreviewPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const quotationId = Number(id);

  const [quotation, setQuotation] = useState<QuotationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setQuotation(await quotationsApi.getOne(quotationId));
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    if (Number.isFinite(quotationId)) void load();
  }, [quotationId, load]);

  async function handleDownload(): Promise<void> {
    if (!quotation) return;
    setDownloading(true);
    setError(null);
    try {
      await quotationsApi.downloadPdf(quotation.id, quotation.number);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  async function handleEmail(): Promise<void> {
    if (!quotation) return;
    setEmailing(true);
    setError(null);
    setEmailNotice(null);
    try {
      const res = await quotationsApi.email(quotation.id);
      setEmailNotice(
        res.delivered
          ? `Cotización enviada a ${res.to}.`
          : `Cotización preparada para ${res.to} (envío simulado en este entorno).`,
      );
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setEmailing(false);
    }
  }

  return (
    <div className="storefront min-h-screen bg-muted text-foreground">
      <CatalogNavbar />

      <div className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" /> Cargando cotización…
          </div>
        ) : error && !quotation ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <AlertCircle className="size-10 text-destructive" />
              <p className="font-medium">{error}</p>
              <Button asChild variant="outline">
                <Link to="/">Volver al catálogo</Link>
              </Button>
            </CardContent>
          </Card>
        ) : quotation ? (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">Cotización {quotation.number}</h1>
                <p className="text-sm text-muted-foreground">
                  Emitida el {formatDate(quotation.issuedAt)} · Válida hasta{' '}
                  {formatDate(quotation.validUntil)}
                </p>
              </div>
              <Badge variant={quotation.expired ? 'destructive' : 'secondary'}>
                {quotation.expired ? 'Expirada' : quotation.status}
              </Badge>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}
            {emailNotice && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="size-4 shrink-0" />
                {emailNotice}
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-3">
              <Button
                className="gap-2"
                disabled={downloading}
                onClick={() => void handleDownload()}
              >
                {downloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Descargar PDF
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={emailing}
                onClick={() => void handleEmail()}
              >
                {emailing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                Enviar por email
              </Button>
              <Button variant="ghost" asChild className="gap-2">
                <Link to="/">
                  <ShoppingBag className="size-4" />
                  Seguir comprando
                </Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Para {quotation.customer.name} · {quotation.customer.email}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">P. unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotation.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(item.lineTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="space-y-2 px-6 pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(quotation.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      IVA ({Math.round(quotation.taxRate * 100)}%)
                    </span>
                    <span className="tabular-nums">{formatCurrency(quotation.tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums text-primary">
                      {formatCurrency(quotation.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
